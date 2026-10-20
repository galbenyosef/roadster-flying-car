// apply-names.mjs — apply the reviewed semantic renames to the pristine src/
// slice bodies, at identifier-token spans (the campaign writer, PLAN §5).
// ROADSTER: THE FLYING CAR — copied + adapted from the fleet precedent
// (grid-academy / call-of-roque / kals-valley / ziggy-card / stillwater /
// pelota / kowloon / a-place-beyond tools/apply-names.mjs;
// the canonical guard family — bare `let a, b` declarators, bracket-aware `:`
// keys, exact 2-line header strip, shorthand-import/export and
// shorthand-property refusal, marked FunctionDeclaration/ClassDeclaration ids
// (the kowloon (p) fixes), program-scope occurrences outside the ranged
// regions refused + per-source line cache (the pelota (s) fixes), the
// (t)(1) refinement: occurrences inside index-only SKIPPED sections are
// reached by the recorded binding map (split-spec sources[].renameBindings,
// applied by the reconstruction gates) and do not refuse a rule, while
// wholeFile regions still do, the (ab) TOKEN-BASED import/export handling and
// the (ag) whole-program-IIFE re-rooting — scoped to the TRUE IIFE shape per
// proposal (ah): the program scope is re-rooted at the top-level IIFE callee
// ONLY when the ENTIRE program is one expression statement calling a function,
// so a flat module (this capture: hundreds of top-level statements) keeps the
// literal program scope. The (ad) target-uniqueness scoping — uniqueness is
// enforced per CHUNK (the readable source), the unit a rename can legally
// span; the global-rule idiom keeps its own global map). Nothing is read from
// another mirror at runtime.
//
// DIVERGENCE FROM THE FLEET IDIOM (deliberate, recorded): the app rules are
// keyed by the READABLE SOURCE (readable/…), not by capture rel. This capture
// is ONE file (index.html) that carries TWO inline <script> chunks (the 2.7 MB
// bundle and the 149 B service-worker registration) plus two inline <style>
// blocks, so a capture rel does not identify a chunk here — the readable twin
// does. The chunk is the true independence unit, so the rule set is keyed by it.
//
// ROADSTER's app chunk is the tail of the big inline module script: the
// `__defs`/`__req` loader (wholeFile machinery) and the twelve vendor
// `__defs['<id>'] = function () { … };` definitions (three.js r187dev + the ten
// examples/jsm addons, a wholeFile VENDOR REGION) sit ABOVE it in the same
// readable source, and the game's own app code follows at MODULE TOP LEVEL (no
// IIFE). Slices are statement-aligned windows of the app tail. Two rule kinds
// (tools/names.json):
//
//   "app": { "<readable source>": { "<name>": "<target>" } }
//     A top-level binding of that chunk is renamed in EVERY slice of the chunk
//     that mentions it — eligible identifiers resolving to the slice's top
//     level, or unbound in the slice (the cross-slice reference case). Guards:
//     the name must be a program-scope binding declared inside a RANGED slice
//     region of the chunk (never in a wholeFile region — the loader machinery or
//     the three.js vendor band — or a skipped section); no program-scope
//     occurrence may sit in a wholeFile region (never rewritten — the rename
//     could not be complete), while occurrences in skipped sections are reached
//     by the recorded binding map at reconstruction time (t)(1); and every
//     eligible app-scope/unbound occurrence in every slice must be renamed (a
//     partial application is refused).
//
//   "files": { "<src slice>": [ { "scope": "<fn>", "renames": { … } } ] }
//     Locally-bound identifiers renamed via scoped rules inside one slice.
//     `scope` names a scope as it reads in the SLICE: a function by its name,
//     a nested function as `outer.inner`, a class method as `Class.method`, a
//     function assigned to a const/let/var by the variable's name, or an
//     object-literal method as `Object.key` when the object is a named
//     binding. A trailing `:*` widens to everything nested inside it. Rules
//     run top to bottom, re-parsing between groups, so a later rule can
//     address a scope an earlier rule already renamed.
//
// Target safety (the preflight, refusing rather than shipping a broken slice):
//   · a target must be FRESH in the rule's own scope — it may not appear as an
//     eligible identifier spelling anywhere inside that scope's subtree (a
//     nested use would be captured by the renamed binding);
//   · a target may not be another rule's source in the same rule group (no
//     chained or swapped renames), nor a reserved word, nor reused by any
//     other rule of this list (app or scoped);
//   · an `app` target must additionally be fresh across the whole chunk (any
//     app window spelling of that chunk) — a refactor cannot rename a binding
//     onto a name that nested code already uses.
//
// Candidate tokens are intersected with engine/rename-layer.mjs's `eligible`
// set (property accesses, object keys, shorthand properties are never renamed)
// so the recovered record can always express exactly what was applied.
//
// The base the rules apply to is the pristine readable range (split-spec) —
// never the committed text — so re-running is a function of the review list
// alone. The committed 2-line provenance header is preserved verbatim (it
// belongs to derive.mjs, which recomputes markers on the renamed body).
// After writing, run tools/recover-scoped-map.mjs, then tools/derive.mjs, then
// the gates (verify-rename / check-chunk / audit) — pipeline order
// apply -> recover -> derive -> gates.
//
// usage: node tools/apply-names.mjs <src-relative-file> [names.json] [--dry]
//        node tools/apply-names.mjs --all [names.json] [--dry]
//        node tools/apply-names.mjs --list [<readable source>]  # authoring aid:
//          every program-scope name of the chunk with its preflight verdict
//          (default: the biggest app chunk; nothing written)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getAcorn } from "./lib-acorn.mjs";
import { tokens, classifyTokens, stripHeader } from "./engine/rename-layer.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const acorn = await getAcorn();

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const all = process.argv.includes("--all");
const dry = process.argv.includes("--dry");
const listMode = process.argv.includes("--list");
const file = all || listMode ? null : args[0];
const namesFile = args[1] || path.join(proj, "tools", "names.json");
if (!all && !listMode && !file) {
  console.error("usage: node tools/apply-names.mjs <src-relative-file|--all|--list [readable source]> [names.json] [--dry]");
  process.exit(1);
}

const rules = listMode && !fs.existsSync(namesFile) ? {} : JSON.parse(fs.readFileSync(namesFile, "utf8"));
const APP_BY_SOURCE = rules.app || {};
const GLOBAL = rules.global || {}; // fleet idiom, kept for compatibility (empty here)
const PER_FILE = rules.files || {};
for (const [src, m] of Object.entries(APP_BY_SOURCE)) {
  if (typeof m !== "object" || m === null || Array.isArray(m)) {
    console.error(`names.json app["${src}"] must be an object of { name: target } pairs`);
    process.exit(1);
  }
}

const spec = JSON.parse(fs.readFileSync(path.join(proj, "split-spec.json"), "utf8"));
const sections = new Map();
for (const s of spec.sections) {
  if (!s.wholeFile && !s.skipped && typeof s.startLine === "number") sections.set(s.file, s);
}
// every sliced chunk (a readable pretty with ranged sections) and its capture
// rel, resolved through split-spec sources
const CHUNKS = (() => {
  const bySource = new Map();
  for (const s of spec.sections) {
    if (s.wholeFile || s.skipped || typeof s.startLine !== "number") continue;
    if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
    bySource.get(s.sourceFile).push(s);
  }
  const out = [];
  for (const [sourceFile, list] of bySource) {
    const rec = spec.sources.find((x) => x.sourceFile === sourceFile);
    if (!rec || !rec.capture) {
      console.error(`split-spec source ${sourceFile} carries no capture rel`);
      process.exit(1);
    }
    out.push({
      sourceFile,
      capture: rec.capture,
      text: fs.readFileSync(path.join(proj, sourceFile), "utf8"),
      sections: list,
      allSections: spec.sections.filter((s) => s.sourceFile === sourceFile && typeof s.startLine === "number"),
    });
  }
  return out.sort((a, b) => b.sections.length - a.sections.length);
})();
const chunkBySource = new Map(CHUNKS.map((c) => [c.sourceFile, c]));
for (const src of Object.keys(APP_BY_SOURCE))
  if (!chunkBySource.has(src)) {
    console.error(`names.json app["${src}"]: no sliced app chunk with that readable source`);
    process.exit(1);
  }

// ── scope analysis (stillwater walk, + `Class.method` scope keys) ───────────
// A scope tree over one parse: var/function hoist to the nearest function
// scope; let/const/class stay in their block. Every identifier node is marked
// with the scope that OWNS it (null = unbound in this text: a real global).
let current = null;
let programScope = null;
let functionScopes = new Map();
const MARK = new WeakMap();
let pendingFnName = null; // scope key for the next function: method / var-assigned
let objectName = null; // set while walking `const X = { … }` inits
let chunkText = ""; // the chunk currently being analyzed by the preflight
let chunkLines = [];
let topLevelCalls = new WeakSet(); // CallExpressions that are a whole top-level statement (the IIFE)
let iifeScope = null; // the function scope of a top-level IIFE callee (a-place-beyond's whole app)

function declare(name, kind, scope = current, node = null) {
  if (kind === "var" || kind === "function") scope = scope.fnScope;
  if (!scope.names.has(name)) scope.names.set(name, { kind, decls: [] });
  const entry = scope.names.get(name);
  if (node) entry.decls.push([node.start, node.end]);
  return scope;
}
function pushScope(fnName, isFunction) {
  const s = { parent: current, fnScope: null, names: new Map(), fnName: fnName ?? null, node: null };
  s.fnScope = isFunction ? s : current.fnScope;
  current = s;
  return s;
}
const popScope = () => { const s = current; current = s.parent; return s; };

function isName(node, parent) {
  if (!parent) return false;
  if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return true;
  if (parent.type === "Property" && parent.key === node && !parent.computed) return true;
  if (parent.type === "MethodDefinition" && parent.key === node && !parent.computed) return true;
  if (parent.type === "PropertyDefinition" && parent.key === node && !parent.computed) return true;
  if ((parent.type === "LabeledStatement" || parent.type === "BreakStatement" || parent.type === "ContinueStatement") && parent.label === node) return true;
  if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier") return true;
  if (parent.type === "ExportSpecifier") return true;
  return false;
}

const SKIP_KEYS = new Set(["type", "start", "end", "loc", "range", "raw"]);
function walk(node, parent) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { for (const c of node) walk(c, parent); return; }
  if (typeof node.type !== "string") {
    for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) walk(node[k], parent);
    return;
  }
  switch (node.type) {
    case "Program": {
      for (const s of node.body) hoist(s);
      // mark the whole-program IIFE call (rive-city shape): re-root the app
      // scope ONLY when the ENTIRE program is one expression statement calling a
      // function — a flat ESM module (many top-level call statements) must keep
      // the literal program scope (proposal (ag), scoped to the true IIFE shape
      // by proposal (ah): this capture is flat, so nothing is re-rooted here).
      if (node.body.length === 1) {
        const s = node.body[0];
        if (s.type === "ExpressionStatement" && s.expression && s.expression.type === "CallExpression")
          topLevelCalls.add(s.expression);
      }
      for (const s of node.body) walk(s, node);
      return;
    }
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression": {
      const isDecl = node.type === "FunctionDeclaration";
      // The declaration's own id is a real binding reference: mark it with the
      // scope it declares in, or a rule renaming the function would rename every
      // CALL and leave the declaration behind (caught by verify-rename: the name
      // is unbound after substitution). Fleet fix, carried here.
      if (node.id) MARK.set(node.id, declare(node.id.name, "function", current, node.id));
      // Nested declarations are qualified by their enclosing function key
      // (`bootWorld.grow` in the whole chunk, `grow` in the slice that holds
      // it), so a rule written against the slice addresses the same scope the
      // preflight resolves. Var-assigned/method scopes already arrive qualified
      // through pendingFnName.
      const scopeKey = node.id?.name
        ? isDecl && current.fnName
          ? `${current.fnName}.${node.id.name}`
          : node.id.name
        : pendingFnName ?? null;
      const outer = pushScope(scopeKey, true);
      outer.node = node;
      if (scopeKey && !functionScopes.has(scopeKey)) functionScopes.set(scopeKey, outer);
      // a top-level IIFE callee: its function scope IS the app scope (a-place-
      // beyond's whole app is one `(function(){…})();` — its body's top-level
      // bindings are what the slices expose and what the app rules address).
      if (parent && parent.type === "CallExpression" && topLevelCalls.has(parent)) iifeScope = outer;
      pendingFnName = null;
      const outerObjectName = objectName;
      objectName = null;
      for (const p of node.params) bindPattern(p);
      if (node.body.type === "BlockStatement") {
        for (const s of node.body.body) hoist(s);
        for (const s of node.body.body) walk(s, node);
      } else walk(node.body, node);
      objectName = outerObjectName;
      popScope();
      return;
    }
    case "BlockStatement":
    case "StaticBlock": {
      const s = pushScope(parent?.fnName ?? null, false);
      s.node = node;
      for (const st of node.body) hoist(st);
      for (const st of node.body) walk(st, node);
      popScope();
      return;
    }
    case "ForStatement":
    case "ForInStatement":
    case "ForOfStatement": {
      const s = pushScope(parent?.fnName ?? null, false);
      s.node = node;
      if (node.init && node.init.type !== "VariableDeclaration") walk(node.init, node);
      else if (node.init) { for (const d of node.init.declarations) bindPattern(d.id, node.init.kind); walk(node.init, node); }
      if (node.left && node.left.type !== "VariableDeclaration") bindPattern(node.left, "var");
      else if (node.left) for (const d of node.left.declarations) bindPattern(d.id, node.left.kind);
      walk(node.test, node);
      walk(node.update, node);
      walk(node.right, node);
      walk(node.body, node);
      popScope();
      return;
    }
    case "VariableDeclaration":
      for (const d of node.declarations) {
        bindPattern(d.id, node.kind);
        if (d.id.type === "Identifier" && d.init) {
          const prefixed = current.fnName ? `${current.fnName}.${d.id.name}` : d.id.name;
          if (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression") pendingFnName = prefixed;
          else if (d.init.type === "ObjectExpression") objectName = prefixed;
        }
        walk(d.init, node);
        pendingFnName = null;
        objectName = null;
      }
      return;
    case "Property": {
      // object-literal methods: `key(s,t){…}` / `key: function(){…}` /
      // `key: (…) => {…}` — addressable as `<Object>.<key>` when the object
      // literal is assigned to a named const/let/var, else as `<key>`.
      if (!node.computed && node.value && (node.value.type === "FunctionExpression" || node.value.type === "ArrowFunctionExpression")) {
        const keyName = node.key.type === "Identifier" ? node.key.name : node.key.type === "Literal" ? String(node.key.value) : null;
        if (keyName) pendingFnName = objectName ? `${objectName}.${keyName}` : keyName;
      }
      walk(node.key, node);
      walk(node.value, node);
      pendingFnName = null;
      return;
    }
    case "MethodDefinition":
    case "PropertyDefinition": {
      if (!node.computed && node.key && node.key.type === "Identifier" && node.value &&
          (node.value.type === "FunctionExpression" || node.value.type === "ArrowFunctionExpression")) {
        pendingFnName = current.fnName ? `${current.fnName}.${node.key.name}` : node.key.name;
      }
      walk(node.key, node);
      walk(node.value, node);
      pendingFnName = null;
      return;
    }
    case "CatchClause": {
      const s = pushScope(parent?.fnName ?? null, false);
      s.node = node;
      if (node.param) bindPattern(node.param);
      walk(node.body, node);
      popScope();
      return;
    }
    case "ClassDeclaration":
    case "ClassExpression": {
      // mark the class id with its declaring scope (same fix as function ids):
      // otherwise a rule renaming the class would leave the declaration behind
      if (node.id) MARK.set(node.id, declare(node.id.name, "class", current, node.id));
      const s = pushScope(node.id?.name ?? parent?.fnName ?? null, false);
      s.node = node;
      if (node.superClass) walk(node.superClass, node);
      for (const el of node.body.body) walk(el, node.body);
      popScope();
      return;
    }
    case "Identifier": {
      if (isName(node, parent)) return;
      let owner = current;
      while (owner && !owner.names.has(node.name)) owner = owner.parent;
      MARK.set(node, owner); // null = unbound in this text (a real global)
      return;
    }
    case "LabeledStatement":
      // the label identifier is a name position (isName) and must not be walked,
      // but the labeled STATEMENT BODY must be — returning here left every
      // identifier inside a labeled loop unmarked, so a program-scope name used
      // there was renamed at some references and not others (found live on
      // voxelrush's entry chunk: `e: for (...) { ... v.FURNACE ... }` kept `v`
      // while its declaration became BLOCK — caught by verify-rename's reference
      // drift). Fix: walk the body, skip the label (proposal (aj)).
      walk(node.body, node);
      return;
    case "BreakStatement":
    case "ContinueStatement":
      return;
  }
  for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) walk(node[k], node);
}

function hoist(st) {
  if (!st) return;
  if (st.type === "FunctionDeclaration" && st.id) declare(st.id.name, "function", current, st.id);
  else if (st.type === "ClassDeclaration" && st.id) declare(st.id.name, "class", current, st.id);
  else if (st.type === "VariableDeclaration")
    for (const d of st.declarations) predeclare(d.id, st.kind);
}
function predeclare(p, kind = "let") {
  if (!p) return;
  switch (p.type) {
    case "Identifier": MARK.set(p, declare(p.name, kind)); return;
    case "ObjectPattern": for (const prop of p.properties) predeclare(prop.type === "RestElement" ? prop.argument : prop.value, kind); return;
    case "ArrayPattern": for (const el of p.elements) predeclare(el, kind); return;
    case "AssignmentPattern": predeclare(p.left, kind); return;
    case "RestElement": predeclare(p.argument, kind); return;
  }
}
function bindPattern(p, kind = "let") {
  if (!p) return;
  switch (p.type) {
    case "Identifier": MARK.set(p, declare(p.name, kind, current, p)); return;
    case "ObjectPattern":
      for (const prop of p.properties) {
        if (prop.type === "RestElement") bindPattern(prop.argument, kind);
        else if (prop.value) bindPattern(prop.value, kind);
      }
      return;
    case "ArrayPattern": for (const el of p.elements) bindPattern(el, kind); return;
    case "AssignmentPattern": bindPattern(p.left, kind); if (p.right) walk(p.right, p); return;
    case "RestElement": bindPattern(p.argument, kind); return;
  }
}

function analyze(codeText) {
  let ast;
  try {
    ast = acorn.parse(codeText, { ecmaVersion: 2023, sourceType: "module", locations: true });
  } catch {
    try {
      ast = acorn.parse(codeText, { ecmaVersion: 2023, sourceType: "script", locations: true });
    } catch (e) {
      throw new Error(`slice does not parse while applying names: ${e.message}`);
    }
  }
  current = { parent: null, fnScope: null, names: new Map(), fnName: null, node: ast };
  current.fnScope = current;
  programScope = current;
  functionScopes = new Map();
  pendingFnName = null;
  objectName = null;
  topLevelCalls = new WeakSet();
  iifeScope = null;
  walk(ast, null);
  // whole-program-IIFE shape only (proposal (ag), scoped per (ah)): when the
  // ENTIRE chunk is one top-level IIFE, the app's top-level bindings live one
  // level below the literal program, so re-root the "program scope" at the IIFE
  // callee's function scope. This capture is a flat module — iifeScope stays
  // null and the literal program scope is kept.
  if (iifeScope) programScope = iifeScope;
  return ast;
}

function scopeMatches(spec0) {
  if (spec0 === null) return { program: true, deep: false, want: null };
  const deep = spec0.endsWith(":*");
  return { program: false, deep, want: deep ? spec0.slice(0, -2) : spec0 };
}
function within(root, scope) {
  for (let s = scope; s; s = s.parent) if (s === root) return true;
  return false;
}
function overlap(a, b) { return a[0] < b[1] && b[0] < a[1]; }

// ── preflight ────────────────────────────────────────────────────────────────
// A target must be FRESH where the rename lands, or the rename changes meaning
// instead of just naming. Scoped rules are checked against their own scope
// subtree (nothing inside may spell the target); app rules against every app
// window of their own chunk. Refusals are fatal.
const RESERVED = new Set(
  ("break case catch class const continue debugger default delete do else enum export extends false finally for " +
    "function if import in instanceof new null return super switch this throw true try typeof var void while with " +
    "yield let static await async of get set arguments eval")
    .split(" "),
);

function scopeSpellings(node) {
  const text = chunkText.slice(node.start, node.end);
  const toks = tokens(text);
  const { eligible } = classifyTokens(toks);
  const out = new Set();
  for (let k = 0; k < toks.length; k++) if (toks[k].t === "id" && eligible[k]) out.add(toks[k].v);
  return out;
}

// Shorthand-property refusal (the canonical fleet guard): `{ c, g }` uses ONE
// token as both key and value, so a token rename cannot express the change (the
// key would change with it). Any source name that occurs in shorthand position
// anywhere in the rule's scope makes the rule unshippable — refuse it instead of
// leaving a reference behind (verify-rename catches the residue, but loudly at
// the gate rather than at the review list).
function shorthandNames(text, names) {
  const toks = tokens(text);
  const { eligible } = classifyTokens(toks);
  const out = new Set();
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== "id" || eligible[k] || !names.has(t.v)) continue;
    const prev = toks[k - 1], next = toks[k + 1];
    const isProp = prev && prev.t === "pun" && (prev.v === "." || prev.v === "?.");
    const isKey = next && next.t === "pun" && next.v === ":" && prev && prev.t === "pun" && (prev.v === "{" || prev.v === ",");
    const isShorthand = prev && prev.t === "pun" && (prev.v === "{" || prev.v === ",") && next && next.t === "pun" && (next.v === "," || next.v === "}");
    if (isShorthand && !isProp && !isKey) out.add(t.v);
  }
  return out;
}

const bad = [];
const appInfo = new Map(); // readable source -> per-chunk preflight facts
// (ad) target-uniqueness scoping: targets are unique per CHUNK (the readable
// source) — the unit a rename can legally span. A target may be shared across
// chunks (identical helpers in two chunks are independent), but every name a
// rename lands on must be fresh for the scope the rename writes into. With
// exactly one app chunk here this is the whole campaign; the per-chunk keying
// carries the fleet fix (aetherfall's (ad) lineage) so a re-cut with a second
// chunk keeps the mechanism.
const chunkTargets = new Map(); // readable source -> Map(target -> label)
const globalTargets = new Map(); // target -> label (GLOBAL rules only)
const targetsOf = (src) => {
  if (!chunkTargets.has(src)) chunkTargets.set(src, new Map());
  return chunkTargets.get(src);
};

{
  for (const chunk of CHUNKS) {
    chunkText = chunk.text;
    chunkLines = chunkText.split("\n");
    const appRules = APP_BY_SOURCE[chunk.sourceFile];
    const hasApp = appRules && Object.keys(appRules).length > 0;
    const fileRulesOfChunk = Object.entries(PER_FILE).filter(([f]) => sections.has(f) && sections.get(f).sourceFile === chunk.sourceFile);
    const listThis = listMode && (args[0] ? chunk.sourceFile === args[0] : chunk === CHUNKS[0]);
    if (!hasApp && !fileRulesOfChunk.length && !listThis) continue;
    const ast = analyze(chunkText);
    const topDecl = new Set(programScope.names.keys());

    // line index over the whole chunk (binary search over newline offsets)
    const starts = [0];
    for (let i = 0; i < chunkText.length; i++) if (chunkText[i] === "\n") starts.push(i + 1);
    const lineOfOff = (off) => {
      let lo = 0,
        hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= off) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    };

    // app-scope bindings: "app scope" is the chunk's PROGRAM scope. Extra
    // guards (this mirror's shape): the declaration must sit inside a RANGED
    // slice region (a name declared in a wholeFile band — the loader machinery
    // or the three.js vendor region — or a skipped section cannot be renamed);
    // occurrences that resolve to the program scope inside a wholeFile VENDOR
    // band refuse the rule (the band is never rewritten — proposal (s));
    // occurrences inside an index-only SKIPPED section do NOT refuse it — the
    // reconstruction gates reach them through the recorded binding map
    // (split-spec sources[].renameBindings — (t)(1)).
    const rangedLines = chunk.allSections.filter((s) => !s.wholeFile && !s.skipped).map((s) => [s.startLine, s.endLine]);
    const wholeLines = chunk.allSections.filter((s) => s.wholeFile === true).map((s) => [s.startLine, s.endLine]);
    const skippedLines = chunk.allSections.filter((s) => s.skipped === true).map((s) => [s.startLine, s.endLine]);
    const inRanged = (line) => rangedLines.some(([a, b]) => line >= a && line <= b);
    const inWhole = (line) => wholeLines.some(([a, b]) => line >= a && line <= b);
    const inSkipped = (line) => skippedLines.some(([a, b]) => line >= a && line <= b);
    const declLineOf = new Map(); // name -> [first decl line, …]
    const appScopeNames = new Set();
    for (const [name, entry] of programScope.names) {
      if (!entry.decls.length) continue;
      declLineOf.set(name, entry.decls.map(([s]) => lineOfOff(s)));
      if (entry.decls.every(([s, e]) => inRanged(lineOfOff(s)) && inRanged(lineOfOff(e - 1)))) appScopeNames.add(name);
    }
    const programRefLines = new Map(); // name -> [lines of program-scope references]
    (function scan(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const c of node) scan(c);
        return;
      }
      if (typeof node.type !== "string") {
        for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) scan(node[k]);
        return;
      }
      if (node.type === "Identifier") {
        // MARK is set only for real binding/reference positions (name positions
        // are left unmarked by the scope walk) — so a programScope mark here is a
        // true occurrence of a top-level binding.
        if (MARK.get(node) === programScope && node.loc) {
          if (!programRefLines.has(node.name)) programRefLines.set(node.name, []);
          programRefLines.get(node.name).push(node.loc.start.line);
        }
        return;
      }
      for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) scan(node[k]);
    })(ast);
    const outsideOccurrences = new Map(); // name -> lines in wholeFile bands (refuse)
    const skippedOccurrences = new Map(); // name -> lines in index-only skipped sections (reachable)
    for (const [name, lines] of programRefLines) {
      for (const l of lines) {
        if (inRanged(l)) continue;
        const map = inWhole(l) ? outsideOccurrences : skippedOccurrences; // anything else is neither — treat as unreachable
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(l);
      }
    }
    for (const name of outsideOccurrences.keys()) appScopeNames.delete(name);

    if (listThis) {
      // authoring aid: every program-scope name of the app chunk with its
      // preflight verdict. Nothing is written, names.json is not read.
      const rows = [];
      for (const [name, entry] of programScope.names) {
        if (!entry.decls.length) continue;
        const decls = declLineOf.get(name) || [];
        const refs = programRefLines.get(name) || [];
        const whole = outsideOccurrences.get(name) || [];
        const skipped = skippedOccurrences.get(name) || [];
        let verdict, why;
        if (!decls.every(inRanged)) {
          verdict = "REFUSED";
          why = `declared outside the ranged regions (line ${decls[0]}) — wholeFile machinery/vendor band or skipped section`;
        } else if (whole.length) {
          verdict = "REFUSED";
          why = `referenced in a wholeFile band at line(s) ${whole.slice(0, 4).join(", ")}${whole.length > 4 ? " …" : ""}`;
        } else {
          verdict = "ELIGIBLE";
          why = `${refs.length} program-scope occurrence(s)${skipped.length ? `, ${skipped.length} inside skipped section(s) at line(s) ${skipped.slice(0, 4).join(", ")} (reached via renameBindings)` : ""}`;
        }
        rows.push({ name, kind: entry.kind, decl: decls[0], refs: refs.length, verdict, why });
      }
      rows.sort((a, b) => a.decl - b.decl);
      const elig = rows.filter((r) => r.verdict === "ELIGIBLE").length;
      console.log(`app chunk ${chunk.sourceFile} (capture ${chunk.capture}): ${rows.length} program-scope name(s), ${elig} ELIGIBLE, ${rows.length - elig} refused`);
      console.log("verdict  name                kind   decl    refs  why");
      for (const r of rows)
        console.log(`${r.verdict.padEnd(8)} ${r.name.padEnd(19)} ${r.kind.padEnd(6)} ${String(r.decl).padEnd(7)} ${String(r.refs).padEnd(5)} ${r.why}`);
      continue;
    }

    // every addressable scope in the chunk, keyed exactly as applyRule
    // addresses it: function declarations/assignments by their name, class
    // methods as `Class.method`, object-literal methods as `Object.key`. One
    // key can name several scopes (two nested closures can reuse a short
    // name), so every candidate is kept and the rule resolves to the
    // one inside its slice.
    const scopeInfo = new Map();
    const add = (key, node) => {
      if (!key) return;
      if (!scopeInfo.has(key)) scopeInfo.set(key, []);
      scopeInfo.get(key).push(node);
    };
    const collect = (node, enclosing, className, objName) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) { for (const c of node) collect(c, enclosing, className, objName); return; }
      if (typeof node.type !== "string") { for (const k of Object.keys(node)) collect(node[k], enclosing, className, objName); return; }
      if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        const key = node.id?.name ?? null;
        const eff = key ? (enclosing ? `${enclosing}.${key}` : key) : null;
        if (eff) add(eff, node);
        for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k) && k !== "id") collect(node[k], eff ?? enclosing, className, objName);
        return;
      }
      if ((node.type === "MethodDefinition" || node.type === "PropertyDefinition") && node.key?.type === "Identifier" && node.value &&
          (node.value.type === "FunctionExpression" || node.value.type === "ArrowFunctionExpression")) {
        const eff = className ? `${className}.${node.key.name}` : node.key.name;
        add(eff, node.value);
        collect(node.value, eff, className, objName);
        return;
      }
      if (node.type === "Property" && !node.computed && node.value &&
          (node.value.type === "FunctionExpression" || node.value.type === "ArrowFunctionExpression")) {
        const key = node.key.type === "Identifier" ? node.key.name : node.key.type === "Literal" ? String(node.key.value) : null;
        if (key) {
          const eff = objName ? `${objName}.${key}` : key;
          add(eff, node.value, objName);
          collect(node.value, eff, className, objName);
          return;
        }
      }
      if (node.type === "VariableDeclaration") {
        for (const d of node.declarations) {
          if (d.id.type === "Identifier" && d.init &&
              (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression")) {
            const eff = enclosing ? `${enclosing}.${d.id.name}` : d.id.name;
            add(eff, d.init);
            collect(d.init, eff, className, objName);
          } else if (d.id.type === "Identifier" && d.init?.type === "ObjectExpression") {
            const eff = enclosing ? `${enclosing}.${d.id.name}` : d.id.name;
            collect(d.init, enclosing, className, eff);
          } else {
            collect(d.init, enclosing, className, objName);
          }
        }
        return;
      }
      const nextClass = node.type === "ClassDeclaration" || node.type === "ClassExpression" ? node.id?.name ?? className : className;
      for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) collect(node[k], enclosing, nextClass, objName);
    };
    collect(ast, null, null, null);

    // Rule groups as spans: two groups can safely share a target (or a target
    // equal the other's source) only when their subtrees do not overlap —
    // nested or same-span scopes interact through the scope chain.
    const groups = []; // { label, span: [s,e], sources:Set, targets:Set }
    for (const [f, list] of fileRulesOfChunk) {
      for (const rule of list) {
        const label = `${f} [${rule.scope ?? "<program>"}]`;
        let span = [0, chunkText.length];
        if (rule.scope != null) {
          const { want } = scopeMatches(rule.scope);
          // a rule is written against the SLICE, where the top-level wrapper is
          // absent — resolve the key bare. Several scopes can share a key (the
          // vendored band has its own short names); the one INSIDE the slice
          // the rule is filed under is the rule's scope.
          const sec = sections.get(f);
          const cands = scopeInfo.get(want) ?? [];
          if (!cands.length) { bad.push(`${label}: no scope named ${want} in the chunk`); continue; }
          const lineSpan = (n) => [chunkText.slice(0, n.start).split("\n").length, chunkText.slice(0, n.end).split("\n").length];
          const inside = cands.filter((n) => {
            const [a, b] = lineSpan(n);
            return a >= sec.startLine && b <= sec.endLine;
          });
          if (!inside.length) {
            const [a, b] = lineSpan(cands[0]);
            bad.push(`${label}: scope ${want} spans lines ${a}-${b}, outside ${f} (${sec.startLine}-${sec.endLine}) — file the rule under the right slice`);
            continue;
          }
          span = [inside[0].start, inside[0].end];
        }
        groups.push({ label, span, sources: new Set(Object.keys(rule.renames || {})), targets: new Set(Object.values(rule.renames || {})) });
      }
    }

    const appSpellings = new Set();
    for (const s of chunk.sections) {
      const text = chunkLines.slice(s.startLine - 1, s.endLine).join("\n");
      const toks = tokens(text);
      const { eligible } = classifyTokens(toks);
      for (let k = 0; k < toks.length; k++) if (toks[k].t === "id" && eligible[k]) appSpellings.add(toks[k].v);
    }

    // app rule validation for this chunk
    if (hasApp) {
      const targets = targetsOf(chunk.sourceFile);
      for (const [from, to] of Object.entries(appRules)) {
        const label = `app[${chunk.sourceFile}] ${from}`;
        if (!/^[A-Za-z_$][\w$]*$/.test(to)) bad.push(`${label} -> ${to}: not an identifier`);
        if (from === to) bad.push(`${label} -> itself`);
        if (RESERVED.has(to)) bad.push(`${label}: target "${to}" is a reserved word`);
        if (targets.has(to)) bad.push(`target ${to} reused in this chunk (also for ${targets.get(to)})`);
        targets.set(to, label);
        if (Object.prototype.hasOwnProperty.call(appRules, to)) bad.push(`${label}: target ${to} is another app rule's source (no chained/swapped renames)`);
        if (!appScopeNames.has(from)) {
          const out = outsideOccurrences.get(from);
          bad.push(
            out
              ? `${label}: program-scope occurrence(s) at line(s) ${out.slice(0, 4).join(", ")} sit inside a wholeFile region (loader machinery or three.js vendor band) — the region is never rewritten, so the rename cannot be complete; drop the name (proposal (s))`
              : `${label}: not a top-level binding declared inside a ranged slice region — remove it`,
          );
        } else if (appSpellings.has(to)) bad.push(`${label}: target ${to} is already used in the chunk — choose a fresh name`);
      }
      // shorthand refusal across every slice of the chunk: an app name in
      // shorthand position cannot be renamed by a token pass (see shorthandNames)
      {
        const appNames = new Set(Object.keys(appRules));
        const sh = new Set();
        for (const s of chunk.sections) {
          const text = chunkLines.slice(s.startLine - 1, s.endLine).join("\n");
          for (const n of shorthandNames(text, appNames)) sh.add(`${n} (in ${s.file})`);
        }
        for (const n of sh) bad.push(`app[${chunk.sourceFile}]: ${n} occurs in shorthand-property position — a token rename cannot express it; drop the name`);
      }
    }

    // global rules (fleet idiom; validated against the biggest app chunk —
    // empty in this mirror, kept so the idiom cannot rot silently)
    if (Object.keys(GLOBAL).length && chunk === CHUNKS[0]) {
      for (const [from, to] of Object.entries(GLOBAL)) {
        const label = `global ${from}`;
        if (!/^[A-Za-z_$][\w$]*$/.test(to)) bad.push(`${label} -> ${to}: not an identifier`);
        if (RESERVED.has(to)) bad.push(`${label}: target "${to}" is a reserved word`);
        if (globalTargets.has(to)) bad.push(`target ${to} reused (also for ${globalTargets.get(to)})`);
        globalTargets.set(to, label);
        if (!topDecl.has(from)) bad.push(`${label}: no top-level declaration in the chunk — remove it`);
        else if (appSpellings.has(to)) bad.push(`${label}: target ${to} is already used in the chunk — choose a fresh name`);
      }
    }

    for (const g of groups) {
      const renames = {};
      for (const [f, list] of fileRulesOfChunk)
        for (const rule of list)
          if (`${f} [${rule.scope ?? "<program>"}]` === g.label) Object.assign(renames, rule.renames || {});
      const gTargets = targetsOf(chunk.sourceFile);
      for (const [from, to] of Object.entries(renames)) {
        if (!/^[A-Za-z_$][\w$]*$/.test(to)) bad.push(`${g.label}: ${from} -> ${to}: not an identifier`);
        if (from === to) bad.push(`${g.label}: ${from} -> itself`);
        if (RESERVED.has(to)) bad.push(`${g.label}: target "${to}" is a reserved word`);
        if (g.sources.has(to)) bad.push(`${g.label}: target ${to} is another rule's source here (no chained/swapped renames)`);
        if (gTargets.has(to)) bad.push(`${g.label}: target ${to} reused in this chunk (also for ${gTargets.get(to)})`);
        gTargets.set(to, g.label);
      }
      // subtree freshness: nothing inside the addressed scope may spell the target
      if (g.span[1] - g.span[0] < chunkText.length) {
        const sp = scopeSpellings({ start: g.span[0], end: g.span[1] });
        for (const [from, to] of Object.entries(renames))
          if (sp.has(to)) bad.push(`${g.label}: target ${to} (for ${from}) already appears inside the scope — choose a fresh name`);
        const sh = shorthandNames(chunkText.slice(g.span[0], g.span[1]), new Set(Object.keys(renames)));
        for (const n of sh)
          bad.push(`${g.label}: ${n} occurs in shorthand-property position inside the scope — a token rename cannot express it (the key would change too); drop the name from the rule`);
      }
      // overlapping groups may not share a target, nor cross target/source
      for (const h of groups) {
        if (h === g || !overlap(g.span, h.span)) continue;
        for (const to of g.targets)
          if (h.targets.has(to)) bad.push(`${g.label} and ${h.label}: overlapping scopes share target "${to}"`);
        for (const to of g.targets)
          if (h.sources.has(to) && !g.sources.has(to)) bad.push(`${g.label}: target "${to}" is renamed away by overlapping group ${h.label}`);
      }
    }

    appInfo.set(chunk.sourceFile, { chunk, ast, appScopeNames, outsideOccurrences, skippedOccurrences, spellings: appSpellings, declLineOf, programRefLines, groups, scopeInfo, topDecl });
  }

  if (listMode) {
    if (!CHUNKS.length) {
      console.error("no sliced app chunk found in split-spec.json");
      process.exit(1);
    }
    process.exit(bad.length ? 1 : 0);
  }
}

if (bad.length) {
  console.error("apply-names preflight refused:");
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}

// ── rule application ─────────────────────────────────────────────────────────
function applyRule(rule, codeText) {
  const sp = { ...rule, ...scopeMatches(rule.scope ?? null) };
  if (!sp.program) {
    const scope = functionScopes.get(sp.want);
    if (!scope) throw new Error(`no function named ${sp.want}`);
    sp.root = scope;
  }
  const toks = tokens(codeText);
  const { eligible } = classifyTokens(toks);
  const tokenAt = new Map();
  for (let k = 0; k < toks.length; k++) if (toks[k].t === "id") tokenAt.set(`${toks[k].s}:${toks[k].e}`, k);

  const marks = [];
  const covered = new Set();
  const renamedNames = new Set();
  (function choose(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const c of node) choose(c); return; }
    if (typeof node.type !== "string") {
      for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) choose(node[k]);
      return;
    }
    if (node.type === "Identifier") {
      const owner = MARK.get(node);
      const k = tokenAt.get(`${node.start}:${node.end}`);
      if (owner === programScope) {
        if (k !== undefined && eligible[k]) covered.add(node.name);
        if (Object.prototype.hasOwnProperty.call(sp.renames, node.name) && k !== undefined && eligible[k]) {
          marks.push({ start: node.start, end: node.end, to: sp.renames[node.name] });
          renamedNames.add(node.name);
        }
      } else if (owner === null) {
        if (sp.program) {
          if (k !== undefined && eligible[k]) {
            covered.add(node.name);
            if (Object.prototype.hasOwnProperty.call(sp.renames, node.name)) {
              marks.push({ start: node.start, end: node.end, to: sp.renames[node.name] });
              renamedNames.add(node.name);
            }
          }
        }
      } else if (!sp.program && Object.prototype.hasOwnProperty.call(sp.renames, node.name)) {
        const hit = sp.deep ? within(sp.root, owner) : owner === sp.root;
        if (hit && k !== undefined && eligible[k]) {
          marks.push({ start: node.start, end: node.end, to: sp.renames[node.name] });
          renamedNames.add(node.name);
        }
      }
    }
    for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) choose(node[k]);
  })(current.node);
  if (!marks.length) return { text: codeText, count: 0, covered, renamedNames };
  return { text: splice(codeText, marks), count: marks.length, covered, renamedNames };
}

function splice(text, marks) {
  marks.sort((a, b) => a.start - b.start);
  let out = "", last = 0;
  for (const m of marks) {
    if (m.start < last) throw new Error(`overlapping rename at ${m.start}`);
    out += text.slice(last, m.start) + m.to;
    last = m.end;
  }
  return out + text.slice(last);
}

// ── run ──────────────────────────────────────────────────────────────────────
const sortedTargets = all ? [...sections.keys()].sort() : [file];
const globalCoverage = new Map();
const globalRenamed = new Map();
for (const name of Object.keys(GLOBAL)) { globalCoverage.set(name, new Set()); globalRenamed.set(name, new Set()); }
const appCoverage = new Map(); // readable source -> Map(name -> Set(sliceFile))
const appRenamed = new Map();
for (const src of Object.keys(APP_BY_SOURCE)) {
  appCoverage.set(src, new Map());
  appRenamed.set(src, new Map());
  for (const name of Object.keys(APP_BY_SOURCE[src])) {
    appCoverage.get(src).set(name, new Set());
    appRenamed.get(src).set(name, new Set());
  }
}

let filesChanged = 0, totalSplices = 0, totalGroups = 0, appSplices = 0;
for (const rel of sortedTargets) {
  const section = sections.get(rel);
  if (!section) {
    console.error(`no ranged section for ${rel}`);
    process.exit(1);
  }
  const abs = path.join(proj, "src", section.file);
  const committed = fs.readFileSync(abs, "utf8");
  if (stripHeader(committed) === committed) {
    console.error(`${rel}: committed slice has no 2-line provenance header (re-run derive.mjs first)`);
    process.exit(1);
  }
  const nl2 = committed.indexOf("\n", committed.indexOf("\n") + 1);
  const header = committed.slice(0, nl2 + 1);

  const linesCache = new Map();
  const linesOfSource = (rel) => {
    if (!linesCache.has(rel))
      linesCache.set(rel, fs.readFileSync(path.join(proj, rel), "utf8").split("\n"));
    return linesCache.get(rel);
  };
  const base = linesOfSource(section.sourceFile).slice(section.startLine - 1, section.endLine).join("\n") + "\n";

  const chunk = chunkBySource.get(section.sourceFile);
  const chunkApp = chunk ? APP_BY_SOURCE[chunk.sourceFile] : null;

  let body = base;
  const counts = [];
  const fileRules = PER_FILE[rel] || [];
  // 1) the per-file scoped rules, in order, re-parsing between groups. They run
  // BEFORE the app pass: scope keys are written as they read in the PRISTINE
  // slice (the app pass renames app-scope bindings, so a scoped rule addressed
  // after it would have to spell the new name — this order keeps the review
  // list readable against the pristine text).
  for (const rule of fileRules) {
    analyze(body);
    const r = applyRule(rule, body);
    if (r.count === 0) {
      console.error(`${rel}: rule group ${rule.scope ?? "<program>"} matched 0 identifiers — refusing (a rule must fire)`);
      process.exit(1);
    }
    body = r.text;
    counts.push(`  ${rule.scope}: ${Object.keys(rule.renames).length} name(s), ${r.count} identifier(s)`);
    totalSplices += r.count;
    totalGroups++;
  }
  // 2) the app pass: that chunk's top-level bindings + cross-slice references.
  // A slice is only ever app-renamed by its OWN chunk's rule set.
  if (chunkApp && Object.keys(chunkApp).length) {
    analyze(body);
    const r = applyRule({ scope: null, renames: chunkApp }, body);
    body = r.text;
    for (const name of r.covered) if (appCoverage.get(chunk.sourceFile)?.has(name)) appCoverage.get(chunk.sourceFile).get(name).add(rel);
    for (const name of r.renamedNames) if (appRenamed.get(chunk.sourceFile)?.has(name)) appRenamed.get(chunk.sourceFile).get(name).add(rel);
    if (r.count) counts.push(`  <app ${chunk.sourceFile}>: ${r.count} identifier(s)`);
    totalSplices += r.count;
    appSplices += r.count;
  }
  // 3) the global pass (fleet idiom; empty in this mirror)
  if (Object.keys(GLOBAL).length) {
    analyze(body);
    const r = applyRule({ scope: null, renames: GLOBAL }, body);
    body = r.text;
    for (const name of r.covered) if (globalCoverage.has(name)) globalCoverage.get(name).add(rel);
    for (const name of r.renamedNames) if (globalRenamed.has(name)) globalRenamed.get(name).add(rel);
    if (r.count) counts.push(`  <global>: ${r.count} identifier(s)`);
    totalSplices += r.count;
  }
  const next = header + body;
  if (next === committed) {
    console.log(`${rel}: no change (already applied)`);
    continue;
  }
  // the renamed slice must still parse standalone under the exact gate
  const check = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: next,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (check.status !== 0) {
    console.error(`${rel}: renamed slice does not parse standalone — refusing:\n${(check.stderr || "").split("\n").slice(0, 6).join("\n")}`);
    process.exit(1);
  }
  if (dry) {
    console.log(`${rel}: WOULD change (${counts.length} rule group(s))`);
    console.log(counts.join("\n"));
  } else {
    fs.writeFileSync(abs, next);
    filesChanged++;
    console.log(`${rel}: ${counts.length} rule group(s) applied`);
    console.log(counts.join("\n"));
  }
}

// app coverage: every eligible app-scope/unbound occurrence of an app name must
// have been renamed — a partial application is refused
{
  const missing = [];
  for (const [src, names] of appCoverage) {
    for (const [name, set] of names) {
      if (!set.size) { missing.push(`app[${src}] ${name}: no eligible app-scope occurrence found anywhere — remove it from names.json`); continue; }
      const renamed = appRenamed.get(src).get(name);
      const untouched = [...set].filter((f) => !renamed.has(f));
      if (untouched.length) missing.push(`app[${src}] ${name}: eligible occurrence(s) left unrenamed in ${untouched.join(", ")}`);
    }
  }
  if (missing.length) {
    console.error(`apply-names: app coverage incomplete — refusing:`);
    for (const m of missing) console.error("  " + m);
    process.exit(1);
  }
}
// global coverage: every eligible program-scope/unbound occurrence of a global
// name must have been renamed — a partial application is refused
if (Object.keys(GLOBAL).length) {
  const missing = [];
  for (const [name, set] of globalCoverage) {
    if (!set.size) { missing.push(`${name}: no eligible program-scope occurrence found anywhere — remove it from names.json`); continue; }
    const renamed = globalRenamed.get(name);
    const untouched = [...set].filter((f) => !renamed.has(f));
    if (untouched.length) missing.push(`${name}: eligible occurrence(s) left unrenamed in ${untouched.join(", ")}`);
  }
  if (missing.length) {
    console.error(`apply-names: global coverage incomplete — refusing:`);
    for (const m of missing) console.error("  " + m);
    process.exit(1);
  }
}
if (!all) {
  const unknown = Object.keys(PER_FILE).filter((f) => !sections.has(f));
  for (const f of unknown) console.error(`note: names.json lists ${f} which is not a src slice`);
}
const appNamesTotal = Object.values(APP_BY_SOURCE).reduce((n, m) => n + Object.keys(m).length, 0);
console.log(
  `apply-names: ${sortedTargets.length} file(s) visited, ${filesChanged} changed, ${totalGroups} rule group(s), ${totalSplices} identifier splice(s)` +
    (appNamesTotal ? ` (app: ${appNamesTotal} name(s) over ${Object.keys(APP_BY_SOURCE).length} chunk(s), ${appSplices} splice(s))` : "") +
    (dry ? " (dry run)" : ""),
);
