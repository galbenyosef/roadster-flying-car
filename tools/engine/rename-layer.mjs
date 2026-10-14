// Shared rename-layer logic for the roadster-flying-car mirror: tokenize,
// apply, and verify a semantic rename map over the readable layer. (Copied +
// adapted from the fleet's newest engine lineage — a-place-beyond / grid-academy
// / embervale-adventure / call-of-roque / kals-valley / ziggy-card / stillwater
// / madrid-rush / kowloon / vanta7 / skyforge / pelota
// tools/engine/rename-layer.mjs, carrying the canonical guard family and ALL
// recorded defect fixes: the brace-depth template scanner (vanta7, proposal
// (r)), the marked FunctionDeclaration/ClassDeclaration ids (kowloon, proposal
// (p)), the bracket-aware `:` object-key guard incl. applyBindingMap
// (stillwater / madrid-rush), the reconstruction-time binding map (turfwar,
// proposal (t)(1) — split-spec sources[].renameBindings), the `of`/`in`
// KEYWORD-position guard in applyBindingMap (dune-arrakis, proposal (x)), the
// TOKEN-BASED import-specifier extractor (embervale, proposal (ab) — a
// text-level regex misreads UI copy as imports) and `recordCounts` (mindfall,
// proposal (af) — flat counts must count OCCURRENCES on the base token stream,
// not name keys); nothing is read from another mirror at runtime.)
//
// A "rename layer" is what turns a prettified chunk range into a readable src/
// slice. The campaign (tools/apply-names.mjs) renames a chunk's top-level
// bindings with a scope-aware token pass, so the relationship between a slice
// and its source range is exact and invertible:
//
//     committed slice body  ==  source range with identifiers substituted
//
// Recovering the map is therefore mechanical: tokenize both sides (comments and
// whitespace dropped, string/template literals atomic) and require the
// *non-identifier* token streams to be identical. Identifiers then pair up
// positionally and every differing pair is a rename.
//
// This is deliberately not a heuristic. If the non-identifier streams disagree,
// the slice is not a rename of its source range and recovery *fails* rather
// than inventing a plausible map — which is the difference between a verified
// readable layer and one that merely looks right.
//
// Layout note (this mirror): the capture is ONE file — index.html — whose big
// inline `<script type="module">` (2,697,801 B) carries the whole dependency
// graph. That block is a single-file bundle behind a tiny `__defs`/`__req`
// module registry: its first two statements (the registry object and the
// loader) are wholeFile build machinery and the next twelve are the vendor
// `__defs['<id>'] = function () { … };` module definitions (three.js r187dev
// plus the ten examples/jsm addons), a VENDOR REGION claimed wholeFile, never
// sliced. Everything after is the game's own ~526 KB of app code, sitting at
// MODULE TOP LEVEL (no IIFE wrapper), so the chunk's program scope IS the
// literal module scope and a slice is src/index-inline-1-NN.js. Sections in
// split-spec.json carry the readable twin as their sourceFile (repo-relative)
// and the src-relative section file. The loader machinery, the three.js vendor
// region and the two inline stylesheets are wholeFile sections (never sliced);
// the app chunk has no skipped section. The small service-worker registration
// script (index-inline-2) and the captured sw.js are separate one-slice chunks.
// Namespace guard (the one rule the writer and the appliers share): an
// identifier before a ":" is treated as an object-literal key ONLY in property
// position — inside braces with the previous token "{" or ",". Elsewhere
// (ternary "c ? a : b", "case e:", a label) the identifier is a real reference
// and is renamed with its binding; a naive "next token is :" test misread
// those as keys and split bindings (the fleet fix proven by the stillwater /
// madrid-rush / tailgrab verifiers). Property accesses ("x.e"), the spread
// token in "...e", and import/export specifier names are likewise excluded. A
// SHORTHAND property ("{e}") shares one token for key and value, so
// tools/apply-names.mjs refuses to rename any name that appears in such a
// position at all — the map can then be applied uniformly without touching a
// key. Bare multi-declarator lists ("let a, b") sit in the same token shape and
// are the exception the writer's classifier scans back for (stillwater fix).
//
// Template-substitution scans (stop === "}") close on the MATCHING brace: an
// object literal inside ${…} used to end the substitution early, which pushed
// the rest of the expression into the outer template's literal run and broke
// recovery alignment (the madrid-rush / wanju-bara braceDepth fix, carried).
//
// The tokenizer here is THE tokenizer: tools/derive.mjs (re-cut), tools/audit.js
// (gate), tools/recover-scoped-map.mjs (map recovery) and tools/apply-names.mjs
// (campaign writer) all splice through these spans, so an index recorded by one
// means the same position to the others.
import fs from "fs";
import path from "path";

// ---- scanner ---------------------------------------------------------------
// Tokenize JS, dropping whitespace and comments. A string literal is one token.
// A *template* literal is split, because `${...}` holds real code: literal runs
// are emitted as `lit` and each substitution is tokenized recursively.
const ID_START = /[A-Za-z_$]/;
const ID_PART = /[\w$]/;

/** Tokenize a whole source text. Every token carries its span (`s`..`e`). */
export function tokens(text) {
  const st = { i: 0, text, out: [] };
  scan(st, undefined);
  return st.out;
}

function emit(st, t, v, s, e) {
  st.out.push({ t, v, s, e: e === undefined ? s + v.length : e });
}

function scan(st, stop) {
  const { text } = st;
  const n = text.length;
  // Template-substitution scans (stop === "}") must close on the MATCHING
  // brace: an object literal inside ${…} used to end the substitution early,
  // which pushed the rest of the expression into the outer template's literal
  // run and broke recovery alignment (madrid-rush / wanju-bara fix, carried).
  let braceDepth = 0;
  while (st.i < n) {
    const c = text[st.i];
    const start = st.i;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      st.i++;
      continue;
    }
    if (c === "/" && text[st.i + 1] === "/") {
      while (st.i < n && text[st.i] !== "\n") st.i++;
      continue;
    }
    if (c === "/" && text[st.i + 1] === "*") {
      st.i += 2;
      while (st.i < n && !(text[st.i] === "*" && text[st.i + 1] === "/")) st.i++;
      st.i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = st.i + 1;
      while (j < n) {
        if (text[j] === "\\") {
          j += 2;
          continue;
        }
        if (text[j] === c) {
          j++;
          break;
        }
        j++;
      }
      emit(st, "lit", text.slice(st.i, j), start);
      st.i = j;
      continue;
    }
    if (c === "`") {
      scanTemplate(st);
      continue;
    }
    // Regex literal: a `/` is a regex start when the previous significant token
    // cannot end an expression — otherwise it is division. Scanning it as one
    // token keeps flag letters (`/gm`) and body text out of the identifier
    // stream, where a map key like `gm` would otherwise rewrite regex flags.
    if (c === "/" && isRegexStart(st)) {
      let j = st.i + 1,
        inClass = !1;
      while (j < n) {
        const d = text[j];
        if (d === "\\") {
          j += 2;
          continue;
        }
        if (d === "[") inClass = !0;
        else if (d === "]") inClass = !1;
        else if (d === "/" && !inClass) break;
        else if (d === "\n") break; // unterminated: not a regex after all
        j++;
      }
      if (j < n && text[j] === "/") {
        j++;
        while (j < n && /[a-z]/.test(text[j])) j++; // flags
        emit(st, "re", text.slice(st.i, j), start);
        st.i = j;
        continue;
      }
    }
    if (stop === "}" && (c === "{" || c === "}")) {
      if (c === "}") {
        if (braceDepth === 0) {
          st.i++;
          return;
        }
        braceDepth--;
      } else braceDepth++;
      // fall through: the brace is a real token of the substitution
    }
    if (ID_START.test(c)) {
      let j = st.i + 1;
      while (j < n && ID_PART.test(text[j])) j++;
      emit(st, "id", text.slice(st.i, j), start);
      st.i = j;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = st.i + 1;
      while (j < n && /[\w.]/.test(text[j])) j++;
      emit(st, "num", text.slice(st.i, j), start);
      st.i = j;
      continue;
    }
    emit(st, "pun", c, start);
    st.i++;
  }
}

function isRegexStart(st) {
  const prev = st.out[st.out.length - 1];
  if (!prev) return !0;
  if (prev.t === "pun") return !(")]}".includes(prev.v) || prev.v === "++" || prev.v === "--");
  if (prev.t === "id")
    return /^(?:return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await|throw)$/.test(prev.v);
  return !1; // after id/num/str/template/regex, `/` is division
}

function scanTemplate(st) {
  const { text } = st;
  const n = text.length;
  emit(st, "pun", "`", st.i);
  st.i++;
  let run = "";
  let runStart = st.i;
  const flush = () => {
    if (run) emit(st, "lit", run, runStart);
    run = "";
  };
  while (st.i < n) {
    const c = text[st.i];
    if (c === "\\") {
      if (!run) runStart = st.i;
      run += text.slice(st.i, st.i + 2);
      st.i += 2;
      continue;
    }
    if (c === "`") {
      flush();
      emit(st, "pun", "`", st.i);
      st.i++;
      return;
    }
    if (c === "$" && text[st.i + 1] === "{") {
      flush();
      emit(st, "pun", "${", st.i);
      st.i += 2;
      scan(st, "}");
      emit(st, "pun", "}", st.i - 1);
      runStart = st.i;
      continue;
    }
    if (!run) runStart = st.i;
    run += c;
    st.i++;
  }
  flush();
}

// ---- slice headers ---------------------------------------------------------
// The derive writer prepends a 2-line provenance header
//   // <chunk tag> NN — <markers>
//   // Lines A-B of <sourceFile> (statement-aligned).
// It is not part of the source range, so verification and recovery both strip
// it — EXACTLY those two lines. Stripping a run of leading `//` lines would eat
// real comments a source range may begin with (the madrid-rush fix).
export function stripHeader(committed) {
  const lines = committed.split("\n");
  const isRangeLine = (l) => /^\/\/ Lines \d+-\d+ of .+ \(statement-aligned\)\.$/.test(l);
  if (lines.length >= 2 && lines[0].startsWith("// ") && isRangeLine(lines[1]))
    committed = lines.slice(2).join("\n");
  // Trailing whitespace is a slice-write artifact; it carries no code.
  return committed.replace(/[\n\s]+$/, "");
}

// ---- markers for slice titles (top tokens, lowercase; fleet convention) ----
const STOP = new Set(
  ("function return typeof undefined object string number boolean prototype length value default " +
    "exports import this that with from then else case break continue delete instanceof constructor " +
    "arguments void null true false call apply name type text target window document globalthis self " +
    "require module async await yield static class const let var new for while switch throw try catch " +
    "finally extends super using debugger of in do if has own hasown get set")
    .split(" ")
    .filter(Boolean),
);
export function markerWords(text, n = 2) {
  // URLs/identifiers living inside string literals (import paths, asset names)
  // are not code tokens — strip quoted strings before counting
  const code = text.replace(/`[^`]*`|"[^"\n]*"|'[^'\n]*'/g, " ");
  const counts = new Map();
  for (const m of code.matchAll(/[A-Za-z][A-Za-z0-9_]{2,}/g)) {
    const w = m[0].toLowerCase();
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}
export const markerText = (ms) => ms.map(([w, c]) => `${w}(${c})`).join(", ");

/** The exact 2-line provenance header the derive writer prepends to a slice. */
export function sliceHeader({ tag, num, body, sourceFile, startLine, endLine }) {
  const ms = markerWords(body);
  const topWord = ms.length ? ms[0][0] : /^\s*import\b/.test(body) ? "imports" : tag.toLowerCase();
  return (
    `// ${tag} ${num} — ${topWord}\n` + `// Lines ${startLine}-${endLine} of ${sourceFile} (statement-aligned).\n`
  );
}

// ---- source resolution -----------------------------------------------------
/**
 * Locate the prettified source for a spec section. Sections name their own
 * repo-relative `sourceFile` (readable/…); the fallback keeps older records
 * readable. Returns LF-split lines.
 */
export function sourceResolver(dir, spec) {
  const cache = new Map();
  return (section) => {
    const rel = section.sourceFile;
    if (!rel) throw new Error(`no source for ${section.file}: no sourceFile recorded`);
    if (cache.has(rel)) return cache.get(rel);
    const hit = path.join(dir, rel);
    if (!fs.existsSync(hit)) throw new Error(`source not found for ${section.file}: ${rel}`);
    const lines = fs.readFileSync(hit, "utf8").split(/\r?\n/);
    cache.set(rel, lines);
    return lines;
  };
}

/** The raw text of a section's source range (with the trailing newline). */
export function rangeText(prettyFor, section) {
  return prettyFor(section).slice(section.startLine - 1, section.endLine).join("\n") + "\n";
}

// ---- apply -----------------------------------------------------------------
/** Apply a flat map the way a word-boundary pass would: longest key first. */
export function compileMap(map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!keys.length) return null;
  return new RegExp(`\\b(${keys.map((k) => k.replace(/\$/g, "\\$")).join("|")})\\b`, "g");
}
export function applyMap(text, map) {
  const re = compileMap(map);
  return re ? text.replace(re, (m) => map[m]) : text;
}

/**
 * Identifier positions inside `import { … }` / `export { … }` that name the
 * *other* module, not a local binding: the imported name in `import { a as e }`
 * has to keep matching the module it comes from, and the alias in
 * `export { H as REFLECT_EXTRA_LAYER }` is the public API.
 */
export function foreignNameIndices(toks) {
  const foreign = new Set();
  for (let i = 0; i < toks.length - 1; i++) {
    const kw = toks[i];
    if (kw.t !== "id" || (kw.v !== "import" && kw.v !== "export")) continue;
    if (toks[i + 1].t !== "pun" || toks[i + 1].v !== "{") continue;
    let end = i + 2;
    while (end < toks.length && !(toks[end].t === "pun" && toks[end].v === "}")) end++;
    let group = [];
    const flush = () => {
      const ids = group.filter((k) => toks[k].t === "id");
      if (kw.v === "import") {
        if (ids.length) foreign.add(ids[0]); // import: first name is foreign, `as` introduces the local one
      } else if (ids.length > 1) {
        foreign.add(ids[ids.length - 1]); // export: local first, alias is the public API
      }
      group = [];
    };
    for (let k = i + 2; k < end; k++) {
      if (toks[k].t === "pun" && toks[k].v === ",") flush();
      else group.push(k);
    }
    flush();
  }
  return foreign;
}

/** Rewrite text by replacing the spans in `reps` (any order). */
export function spliceTokens(text, reps) {
  if (!reps.length) return text;
  const sorted = [...reps].sort((a, b) => a.s - b.s);
  let out = "";
  let last = 0;
  for (const r of sorted) {
    if (r.s < last) throw new Error(`overlapping splice at ${r.s}`);
    out += text.slice(last, r.s) + r.to;
    last = r.e;
  }
  return out + text.slice(last);
}

/**
 * Apply a rename-map record ({ scoped, files }) to a source range: token-index
 * entries take precedence, then flat word-boundary entries for identifier
 * tokens that sit in a *binding* position. The namespace guard (see file
 * header): property accesses, import/export specifier names, and object-literal
 * keys — the latter detected by BRACKET CONTEXT (`:` with the identifier inside
 * braces and preceded by `{` or `,`), never by "next token is `:`" alone, which
 * misread `case e:` / ternary branches as keys and split bindings. This is the
 * exact application tools/verify-rename.mjs and tools/audit.js use;
 * tools/derive.mjs uses it to re-cut slices. Indices are validated against the
 * recorded names, so a drifted readable or a stale map fails loudly instead of
 * silently mis-renaming.
 */
export function applyRecordedMap(text, record) {
  if (!record) return text;
  const scoped = record.scoped || {};
  const flat = record.files || {};
  const ts = tokens(text);
  const foreign = foreignNameIndices(ts);
  // bracket context for the object-literal-key guard: is the innermost open
  // bracket a `{`? (stillwater / madrid-rush fix, carried here)
  const braceStack = [];
  const inBraces = new Array(ts.length).fill(false);
  for (let k = 0; k < ts.length; k++) {
    const t = ts[k];
    if (t.t === "pun") {
      if (t.v === "{" || t.v === "${") braceStack.push("{");
      else if (t.v === "[") braceStack.push("[");
      else if (t.v === "(") braceStack.push("(");
      else if (t.v === "}" || t.v === "]" || t.v === ")") braceStack.pop();
    }
    if (t.t === "id") inBraces[k] = braceStack[braceStack.length - 1] === "{";
  }
  const at = new Map();
  for (const [name, hits] of Object.entries(scoped))
    for (const [i, target] of hits) {
      const t = ts[i];
      if (!t || t.t !== "id" || t.v !== name)
        throw new Error(`rename map addresses token ${i} as "${name}" but the range has ${t ? t.t + "(" + JSON.stringify(t.v.slice(0, 30)) + ")" : "no such token"}`);
      at.set(i, { name, target });
    }
  let out = "";
  let last = 0;
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.t === "id") {
      const hit = at.get(i);
      const prev = ts[i - 1];
      const isSpread =
        prev && prev.t === "pun" && prev.v === "." && ts[i - 2] && ts[i - 2].t === "pun" && ts[i - 2].v === ".";
      const isProp = prev && prev.t === "pun" && (prev.v === "." || prev.v === "?.") && !isSpread;
      const next = ts[i + 1];
      // object-literal key: inside braces and preceded by `{` or `,` — a `:`
      // elsewhere (`case e:`, ternary `a : b`, a label) leaves the identifier a
      // real reference
      const isKey =
        next &&
        next.t === "pun" &&
        next.v === ":" &&
        inBraces[i] &&
        prev &&
        prev.t === "pun" &&
        (prev.v === "{" || prev.v === ",");
      const target = hit
        ? hit.target
        : !foreign.has(i) && !isProp && !isKey && Object.prototype.hasOwnProperty.call(flat, t.v)
          ? flat[t.v]
          : undefined;
      if (target !== undefined) {
        out += text.slice(last, t.s) + target;
        last = t.e;
        continue;
      }
    }
    out += text.slice(last, t.e);
    last = t.e;
  }
  return out + text.slice(last);
}

/**
 * Apply a chunk-level BINDING map ({ oldTopLevelName: newName }) to a piece of
 * the chunk that is NOT re-cut into src/ — the final `export {…}` table, which
 * split-spec records as an index-only skipped section. Its local-side names are
 * references to the chunk's own top-level bindings, so the campaign renames them
 * too; the public (aliased) side is foreign and stays. The reconstruction gates
 * use this to make the whole chunk parse and resolve again. Property accesses,
 * object keys, labels and foreign positions are left alone, exactly as in
 * applyRecordedMap.
 */
export function applyBindingMap(text, map) {
  if (!map || !Object.keys(map).length) return text;
  const ts = tokens(text);
  const foreign = foreignNameIndices(ts);
  // bracket context for the key guard (same brace-aware rule as
  // applyRecordedMap): an identifier is an object-literal key only inside
  // braces directly after "{" or ","
  const braceStack = [];
  const inBraces = new Array(ts.length).fill(false);
  for (let k = 0; k < ts.length; k++) {
    const t = ts[k];
    if (t.t === "pun") {
      if (t.v === "{" || t.v === "${") braceStack.push("{");
      else if (t.v === "[") braceStack.push("[");
      else if (t.v === "(") braceStack.push("(");
      else if (t.v === "}" || t.v === "]" || t.v === ")") braceStack.pop();
    }
    if (t.t === "id") inBraces[k] = braceStack[braceStack.length - 1] === "{";
  }
  const reps = [];
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.t !== "id") continue;
    if (!Object.prototype.hasOwnProperty.call(map, t.v)) continue;
    if (foreign.has(i)) continue;
    const prev = ts[i - 1];
    const isSpread =
      prev && prev.t === "pun" && prev.v === "." && ts[i - 2] && ts[i - 2].t === "pun" && ts[i - 2].v === ".";
    const isProp = prev && prev.t === "pun" && (prev.v === "." || prev.v === "?.") && !isSpread;
    const next = ts[i + 1];
    const isKey =
      next &&
      next.t === "pun" &&
      next.v === ":" &&
      inBraces[i] &&
      prev &&
      prev.t === "pun" &&
      (prev.v === "{" || prev.v === ",");
    // `of` / `in` keyword positions are NOT references: in a `for (x of y)` /
    // `for (x in y)` / `x in y` the token is grammar, not an identifier. A
    // rule key spelled like a keyword (`of`, the one-letter `in` family) would
    // otherwise be spliced into the reconstruction text and break the parse
    // (found live on the dune-arrakis capture: the loader machinery's
    // `for (let e of …)` inside an index-only skipped section). Skipped, like
    // a property/key (proposal (x), carried here).
    const isForInOf =
      (t.v === "of" || t.v === "in") &&
      !isProp &&
      next &&
      (next.t === "id" ||
        (next.t === "pun" && (next.v === "{" || next.v === "[")) ||
        next.t === "num" ||
        next.t === "lit") &&
      prev &&
      (prev.t === "id" ||
        prev.t === "num" ||
        prev.t === "lit" ||
        (prev.t === "pun" && (prev.v === ")" || prev.v === "]" || prev.v === "}")));
    if (isProp || isKey || isForInOf) continue;
    reps.push({ s: t.s, e: t.e, to: map[t.v] });
  }
  return spliceTokens(text, reps);
}

// ---- recovery --------------------------------------------------------------
// Drop whole-line `//` comments -- but only lines where that `//` is real code.
// A slice can carry a GLSL or shader template literal whose lines begin with
// `//`, and those are payload, not commentary.
export function stripCommentLines(lines) {
  const out = [];
  let inBlock = false;
  let inStr = null; // '"', "'" or "`" when a string spans the newline
  for (const line of lines) {
    const trimmed = line.trimStart();
    const outsideCode = !inBlock && !inStr;
    if (outsideCode && trimmed.startsWith("//")) continue;
    out.push(line);
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (inBlock) {
        if (c === "*" && line[i + 1] === "/") {
          inBlock = false;
          i += 2;
          continue;
        }
        i++;
        continue;
      }
      if (inStr) {
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === inStr) inStr = null;
        i++;
        continue;
      }
      if (c === "/" && line[i + 1] === "*") {
        inBlock = true;
        i += 2;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = c;
        i++;
        continue;
      }
      i++;
    }
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Recover the rename record for one slice: token-align its source range against
 * the committed body and classify every changed identifier as a word-boundary
 * (`files`) or index-addressed (`scoped`) rename.
 *
 * Returns { ok: true, flat, scoped, tokens, renames } or { ok: false, why }.
 */
export function recoverSlice(range, committedBody) {
  const a = tokens(range.replace(/[\n\s]+$/, ""));
  const b = tokens(committedBody.replace(/[\n\s]+$/, ""));
  if (a.length !== b.length) return { ok: false, why: `token count ${a.length} vs ${b.length}` };
  for (let i = 0; i < a.length; i++) {
    if (a[i].t !== b[i].t) return { ok: false, why: `token ${i} type ${a[i].t}/${b[i].t}` };
    if (a[i].t !== "id" && a[i].v !== b[i].v)
      return { ok: false, why: `non-identifier diff at ${i}: ${JSON.stringify(a[i].v.slice(0, 40))} vs ${JSON.stringify(b[i].v.slice(0, 40))}` };
  }
  const byName = new Map();
  for (let i = 0; i < a.length; i++) {
    if (a[i].t !== "id" || a[i].v === b[i].v) continue;
    if (!byName.has(a[i].v)) byName.set(a[i].v, []);
    byName.get(a[i].v).push([i, b[i].v]);
  }
  // A name goes in the flat map only when it reaches ONE target, covers EVERY
  // occurrence in the range, is never a property or object key, and is not the
  // ambiguous `c ? x : y` middle token.
  const isKey = (name) =>
    new RegExp(`\\.\\s*${escapeRe(name)}\\b`).test(range) || new RegExp(`[{,]\\s*${escapeRe(name)}\\s*:`).test(range);
  const ambiguous = new Set();
  for (let i = 0; i < a.length; i++) {
    if (a[i].t !== "id") continue;
    const prev = a[i - 1],
      next = a[i + 1];
    if (prev && prev.t === "pun" && prev.v === "?" && next && next.t === "pun" && next.v === ":") ambiguous.add(a[i].v);
  }
  const occurrences = new Map();
  for (const t of a) if (t.t === "id") occurrences.set(t.v, (occurrences.get(t.v) || 0) + 1);
  const flat = {},
    scoped = {};
  for (const [name, hits] of byName) {
    const targets = new Set(hits.map(([, t]) => t));
    if (targets.size === 1 && occurrences.get(name) === hits.length && !isKey(name) && !ambiguous.has(name))
      flat[name] = [...targets][0];
    else scoped[name] = hits;
  }
  const renames = [...byName.values()].reduce((n, h) => n + h.length, 0);
  return { ok: true, flat, scoped, tokens: a.length, renames };
}

/** Serialise a recovered map for storage next to the project. */
export function serializeMap({ files, scoped }) {
  return {
    note:
      "Semantic rename map for src/, recovered mechanically by anchor alignment from the " +
      "committed slices (tools/recover-scoped-map.mjs): the token streams of a slice and its " +
      "readable range must be identical in every non-identifier position, so every differing " +
      "identifier pair is a proven rename, not a guess. `files` is a word-boundary map, used " +
      "only where a name means the same thing everywhere in the slice and is never a property " +
      "or object key; `scoped` addresses the rest by exact token index as { name: [[i, target], …] }. " +
      "tools/derive.mjs re-applies this map when it re-cuts src/ (index-validated), " +
      "tools/verify-rename.mjs and tools/audit.js re-prove every slice from it, and " +
      "tools/check-chunk.mjs proves cross-slice references still resolve. Regenerate with " +
      "`node tools/recover-scoped-map.mjs` after any rename batch.",
    files: Object.fromEntries(
      Object.entries(files)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([f, m]) => [f, Object.fromEntries(Object.entries(m).sort())]),
    ),
    scoped: Object.fromEntries(
      Object.entries(scoped)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([f, m]) => [f, Object.fromEntries(Object.entries(m).sort())]),
    ),
  };
}

// ---- writer eligibility (tools/apply-names.mjs) ----------------------------
// The campaign writer must be able to rename exactly the tokens its record can
// express, so it intersects its candidate set with this classifier: property
// accesses, object-literal keys and shorthand properties are never renamed
// (they are another namespace, or key and value at once). The `:` key guard is
// bracket-aware — `case e:` and a ternary's `? … :` branches stay eligible —
// and a bare multi-declarator (`let a, b`) is scanned back to its statement
// boundary so it is treated as a declarator, not a shorthand property
// (stillwater canonical fix, carried fleet-wide).
/** { eligible } — per-token classification of a token stream. */
export function classifyTokens(toks) {
  // bracket context for shorthand detection: is the innermost open bracket a `{`?
  const braceStack = [];
  const inBraces = new Array(toks.length).fill(false);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t === "pun") {
      if (t.v === "{" || t.v === "${") braceStack.push(t.v);
      else if (t.v === "[") braceStack.push("[");
      else if (t.v === "(") braceStack.push("(");
      else if (t.v === "}" || t.v === "]" || t.v === ")") braceStack.pop();
    }
    if (t.t === "id") inBraces[k] = braceStack[braceStack.length - 1] === "{";
  }
  const eligible = new Array(toks.length).fill(false);
  // import/export specifier names are foreign: collect their indices
  const foreign = foreignNameIndices(toks);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== "id") continue;
    if (foreign.has(k)) continue;
    const prev = toks[k - 1];
    const prev2 = toks[k - 2];
    const isSpread = prev && prev.t === "pun" && prev.v === "." && prev2 && prev2.t === "pun" && prev2.v === ".";
    if (prev && prev.t === "pun" && (prev.v === "." || prev.v === "?.") && !isSpread) continue; // property access
    const next = toks[k + 1];
    // A `:` after an identifier is an object-literal key ONLY in property
    // position — inside braces with the previous token `{` or `,`. Elsewhere
    // (ternary `... ? -x / y : z`, `case e:`) the identifier is a real
    // reference and stays eligible; excluding it made renames unexpressible
    // and silently split a binding (caught by tools/verify-rename.mjs).
    if (
      next && next.t === "pun" && next.v === ":" && inBraces[k] &&
      prev && prev.t === "pun" && (prev.v === "{" || prev.v === ",")
    )
      continue; // object-literal key
    if (
      inBraces[k] &&
      prev && prev.t === "pun" && (prev.v === "{" || prev.v === ",") &&
      next && next.t === "pun" && (next.v === "," || next.v === "}")
    ) {
      // Shorthand property — with one exception the token-level view can see:
      // a BARE DECLARATOR in a `let a, b` list sits inside the function body's
      // braces in exactly the same token shape. Scan back (bounded) to the
      // statement boundary; a `let`/`var`/`const` before it makes this a
      // declarator, not a property (the writer must be able to rename it, or a
      // rename would split its binding — verify-rename catches that). The
      // FIRST element of a destructuring pattern (`let {a, b}`) keeps prev `{`
      // and stays ineligible: its token is the property name too.
      let isDeclaration = false;
      if (prev.v === ",") {
        // walk back to the statement boundary, skipping balanced groups so a
        // declarator list with calls (`i = e.getElementById(...), l,`) is not
        // cut short at a `)`.
        let depth = 0;
        for (let j = k - 2, steps = 0; j >= 0 && steps < 400; j--, steps++) {
          const t2 = toks[j];
          if (t2.t === "pun") {
            if (t2.v === ")" || t2.v === "]" || t2.v === "}") { depth++; continue; }
            if (depth > 0) {
              if (t2.v === "(" || t2.v === "[" || t2.v === "{") depth--;
              continue;
            }
            if (t2.v === ";" || t2.v === "{" || t2.v === "}" || t2.v === ")" || t2.v === "=>") break;
          }
          if (depth === 0 && t2.t === "id" && (t2.v === "let" || t2.v === "var" || t2.v === "const")) { isDeclaration = true; break; }
        }
      }
      if (!isDeclaration) continue;
    }
    eligible[k] = true;
  }
  return { eligible };
}

/**
 * Apply a rename map to a base body by splicing token spans.
 * `flat`    — { name: target } word-boundary (every eligible occurrence)
 * `indexed` — Map(tokenIndex -> target) (token-index addressed, wins)
 */
export function applyRecords(baseBody, flat, indexed) {
  const toks = tokens(baseBody);
  const { eligible } = classifyTokens(toks);
  const reps = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== "id") continue;
    const hit = indexed.get(k);
    if (hit !== undefined) { reps.push({ s: t.s, e: t.e, to: hit }); continue; }
    if (eligible[k] && Object.prototype.hasOwnProperty.call(flat, t.v)) reps.push({ s: t.s, e: t.e, to: flat[t.v] });
  }
  return spliceTokens(baseBody, reps);
}

/**
 * Count what a rename record actually expresses (proposal (af), carried from
 * the mindfall lineage): `names` = distinct renamed names, `splices` = the
 * splices the record applies to a base body. Passing the BASE body (the
 * pristine range, before the map is applied) makes `splices` count real
 * OCCURRENCES on the token stream — counting name keys alone under-reports a
 * flat record that fires on many occurrences (mindfall found 1,826 → 1,698
 * with the name-counting mistake; `flat` stays the word-boundary NAME count
 * and `flatOccurrences` the occurrence count).
 */
export function recordCounts(record, baseBody) {
  const flat = record?.files ?? {};
  const scoped = record?.scoped ?? {};
  const indexed = Object.values(scoped).reduce((n, hits) => n + hits.length, 0);
  const names = new Set([...Object.keys(flat), ...Object.keys(scoped)]).size;
  if (baseBody !== undefined) {
    const ts = tokens(baseBody);
    const { eligible } = classifyTokens(ts);
    const at = new Set();
    for (const hits of Object.values(scoped)) for (const [i] of hits) at.add(i);
    let flatOcc = 0;
    for (let k = 0; k < ts.length; k++) {
      const t = ts[k];
      if (t.t !== "id" || at.has(k)) continue;
      if (eligible[k] && Object.prototype.hasOwnProperty.call(flat, t.v)) flatOcc++;
    }
    return { names, splices: flatOcc + indexed, flat: Object.keys(flat).length, indexed, flatOccurrences: flatOcc };
  }
  return { names, splices: Object.keys(flat).length + indexed, flat: Object.keys(flat).length, indexed };
}

/**
 * Import-specifier extractor for the derived-layer import gate (proposal (ab),
 * carried from the embervale lineage): the specifier text is read out of the
 * literal TOKEN, never by a regex over raw text. A text-level regex misreads
 * ordinary UI copy that happens to contain the word `import` as a side-effect
 * import — found live on the embervale capture; the same hazard exists here
 * (the page carries strings like "INSPECT LOADOUT"). Kinds: side-effect,
 * from, dynamic, dynamic-template, require, worker-url.
 */
export function extractImportSpecifiers(code) {
  const out = [];
  const push = (spec, kind) => out.push({ spec, kind });
  const ts = tokens(code);
  const litValue = (t) => (t && t.t === "lit" && /^["'`]/.test(t.v) ? t.v.slice(1, -1) : null);
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.t !== "id") continue;
    if (t.v === "import") {
      const next = ts[i + 1];
      const side = litValue(next);
      if (side !== null) {
        push(side, "side-effect");
        continue;
      }
      if (next && next.t === "pun" && next.v === "(") {
        const a = ts[i + 2];
        const dyn = litValue(a);
        if (dyn !== null) {
          push(dyn, "dynamic");
          continue;
        }
        if (a && a.t === "pun" && a.v === "`") {
          // non-interpolated template specifier: collect the run until the
          // closing backtick; a `${` makes it a dynamic template
          let j = i + 3;
          let run = "";
          let interpolated = false;
          for (; j < ts.length; j++) {
            const x = ts[j];
            if (x.t === "pun" && x.v === "`") break;
            if (x.t === "pun" && x.v === "${") {
              interpolated = true;
              break;
            }
            if (x.t === "lit") run += x.v;
          }
          if (interpolated) push(run + "…", "dynamic-template");
          else if (j < ts.length) push(run, "dynamic");
        }
      }
      continue;
    }
    if (t.v === "from") {
      const from = litValue(ts[i + 1]);
      if (from !== null) push(from, "from");
      continue;
    }
    if (t.v === "require" && ts[i + 1] && ts[i + 1].t === "pun" && ts[i + 1].v === "(") {
      push("<require()>", "require");
      continue;
    }
    if (t.v === "URL" && ts[i - 1] && ts[i - 1].t === "id" && ts[i - 1].v === "new") {
      const a = ts[i + 1],
        b = ts[i + 2];
      if (a && a.t === "pun" && a.v === "(") {
        const url = litValue(b);
        if (url !== null) push(url, "worker-url");
      }
    }
  }
  return out;
}
