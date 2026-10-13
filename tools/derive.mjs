// derive.mjs — rebuild the derived layers (readable/ + src/ + split-spec.json)
// from the roadster-flying-car capture (PLAN §3/§5). ROADSTER: The Flying Car
// (https://roadster-the-flying-car-gamev28.vercel.app/) is capture-class: a
// single-file three.js game served by Vercel at the origin root. §0.4
// fork-over-mirror was checked on 2026-10-13 — no public upstream source repo
// exists (see README / split-spec note), so the mirror stands. The capture is
// untouched; every captured file is re-hashed against .upstream/manifest.json
// before it is rendered, so a drifted capture fails loudly instead of being
// silently re-derived.
//
// Pipeline (the entry document carries nearly all of the code):
//   index.html inline <script type="module"> (2,697,801 B) ->
//     readable/index-inline-1.pretty.js (pinned prettier 3.9.6 module API —
//     the CLI respects .gitignore and can silently echo its input — single
//     pass, verified idempotent; the pretty is provably NOT a byte copy).
//     That block is a single-file bundle behind a tiny `__defs`/`__req`
//     registry: statement 0 is `const __defs = {}, __cache = {};`, statement 1
//     is the `__req` loader — build machinery, wholeFile, never sliced — and
//     statements 2-13 are the 12 vendor module definitions
//     (`__defs['<id>'] = function () { … };` — three.js r187dev core/module
//     plus the ten examples/jsm postprocessing+shader addons), a VENDOR REGION
//     claimed wholeFile, never sliced (vendor rule, PLAN §1). Everything from
//     the app's `const THREE = __req('three.module.js');` on is the game's own
//     ~526 KB of app code and is cut into statement-aligned slices.
//   index.html inline <script> (149 B, the service-worker registration) ->
//     readable/index-inline-2.pretty.js + slices.
//   index.html inline <style>s (66 B + 61,649 B) ->
//     readable/index-inline-1|2.pretty.css (stylesheet rule: indexed whole,
//     never sliced).
//   sw.js (captured service worker) -> readable/sw.pretty.js + slices.
//   every twin is recorded in readable/index-inline-map.json with the exact
//   byte range + sha256 of its capture block.
//
// src/ slicing: statement-aligned windows at top-level statement boundaries
// (~250-350 lines; oversized single declarations stay whole), cut from the
// top-level program (no IIFE wrapper here — the app code sits at module top
// level, so there is nothing to unwrap). Every slice gets the exact 2-line
// provenance header, is parse-checked with `node --input-type=module
// --check -` and round-trips byte-exact to its readable line range.
//
// Non-code payloads (icon-192.png, icon-512.png, og.jpg, manifest.webmanifest)
// are recorded as hashed notRendered entries — bytes + sha256, no pretty pass —
// and stay byte-exact under the manifest. The off-origin loads (the Google
// Fonts stylesheet + font origins, the gstatic firebase base) were never
// captured (socker precedent, PLAN §1), so they have no derived layer either;
// tools/capture.mjs --check keeps them listed as external references.
//
// Identifiers in src/ are the bundle's own names — the rename campaign
// (PLAN §5) is recorded as an open task in README.md. usage:
//   node tools/derive.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const PINNED = "3.9.6";
const MAX_WINDOW = 350;

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const readLines = (abs) => {
  const t = fs.readFileSync(abs, "utf8");
  const l = t.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
};
const linesOf = (text) => text.replace(/\n$/, "").split("\n");
const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;

// the 12 vendor module ids the inline bundle defines — asserted, not assumed
// (three.js r187dev core+module plus the ten examples/jsm addons)
const VENDOR_IDS = [
  "three.module.js",
  "three.core.js",
  "jsm/postprocessing/EffectComposer.js",
  "jsm/shaders/CopyShader.js",
  "jsm/postprocessing/ShaderPass.js",
  "jsm/postprocessing/Pass.js",
  "jsm/postprocessing/MaskPass.js",
  "jsm/postprocessing/RenderPass.js",
  "jsm/postprocessing/UnrealBloomPass.js",
  "jsm/shaders/LuminosityHighPassShader.js",
  "jsm/postprocessing/OutputPass.js",
  "jsm/shaders/OutputShader.js",
];
const VENDOR_GUARDS = [
  [/const REVISION = ['"]187dev['"]/, "three.js r187dev revision constant"],
  [/class EffectComposer/, "EffectComposer"],
  [/class UnrealBloomPass/, "UnrealBloomPass"],
  [/class RenderPass/, "RenderPass"],
  [/class ShaderPass/, "ShaderPass"],
  [/class MaskPass/, "MaskPass"],
  [/class OutputPass/, "OutputPass"],
  [/const LuminosityHighPassShader = \{/, "LuminosityHighPassShader"],
  [/const OutputShader = \{/, "OutputShader"],
  [/const CopyShader = \{/, "CopyShader"],
  [/__THREE__ = REVISION/, "window.__THREE__ registration"],
];

// ── pinned prettier (module API, exactly 3.9.6) ─────────────────────────
async function loadPrettier() {
  const candidates = [
    process.env.PRETTIER_MJS,
    path.join(proj, "node_modules", "prettier", "index.mjs"),
    "D:/repos/mirrors/metropolygonia/node_modules/prettier/index.mjs",
  ].filter(Boolean);
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(c), "package.json"), "utf8"));
      if (pkg.version !== PINNED) continue;
      const mod = (await import(pathToFileURL(c).href)).default;
      if (mod.version === PINNED) return { mod, at: c };
    } catch {
      /* try next */
    }
  }
  throw new Error(`pinned prettier ${PINNED} not found (set PRETTIER_MJS to its index.mjs)`);
}

// single pass + idempotency proof: prettier output must be a fixed point of
// the same call, so audit's one-pass re-render is byte-exact by construction
async function formatOnce(prettier, text, parser) {
  const out = await prettier.format(text, { parser });
  const again = await prettier.format(out, { parser });
  if (again !== out) throw new Error(`prettier ${parser} is not idempotent on this input`);
  return out;
}

// ── parse check: the exact standalone gate (ESM stdin) ──────────────────
function parses(text) {
  const r = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: text,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, why: (r.stderr || "").trim().split("\n").slice(0, 5).join(" | ") };
}

// ── markers for titles (top tokens, lowercase; fleet convention) ────────
const STOP = new Set(
  ("function return typeof undefined object string number boolean prototype length value default " +
    "exports import this that with from then else case break continue delete instanceof constructor " +
    "arguments void null true false call apply name type text target window document globalthis self " +
    "require module async await yield static class const let var new for while switch throw try catch " +
    "finally extends super using debugger of in do if has own hasown get set")
    .split(" ")
    .filter(Boolean),
);
function markers(text, n = 2) {
  const code = text.replace(/`[^`]*`|"[^"\n]*"|'[^'\n]*'/g, " ");
  const counts = new Map();
  for (const m of code.matchAll(/[A-Za-z][A-Za-z0-9_]{2,}/g)) {
    const w = m[0].toLowerCase();
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}
const markerText = (ms) => ms.map(([w, c]) => `${w}(${c})`).join(", ");

// ── windowize: cut only at statement starts; ≤350 lines, a single ───────
// ── oversized declaration is a window of its own ────────────────────────
function windowize(stmts) {
  const out = [];
  let cur = null;
  for (const s of stmts) {
    if (!cur) {
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
      continue;
    }
    const projected = s.endLine - cur.startLine + 1;
    if (projected > MAX_WINDOW) {
      out.push(cur);
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
    } else {
      cur.last = s;
      cur.count++;
      cur.endLine = s.endLine;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ── is a statement standalone at module top level? A `return` that is not ─
// ── nested inside a function makes the statement non-standalone ────────────
function hasTopLevelReturn(node) {
  let found = false;
  const walk = (n) => {
    if (!n || found || typeof n.type !== "string") return;
    // any function-ish scope owns its own `return` (arrow/function/class
    // methods, object-literal methods, getters/setters, static blocks)
    if (/Function|Method|StaticBlock/.test(n.type)) return;
    if (n.type === "ReturnStatement") {
      found = true;
      return;
    }
    for (const k of Object.keys(n)) {
      if (k === "loc" || k === "start" || k === "end" || k === "range" || k === "leadingComments" || k === "trailingComments") continue;
      const v = n[k];
      if (Array.isArray(v)) {
        for (const c of v) if (c && typeof c.type === "string") walk(c);
      } else if (v && typeof v.type === "string") {
        walk(v);
      }
    }
  };
  walk(node);
  return found;
}

// ── inline block scan (byte-exact, over the raw entry buffer) ───────────
function scanBlocks(buf) {
  const blocks = [];
  for (const [open, close, kind] of [
    ["<script", "</script", "script"],
    ["<style", "</style", "style"],
  ]) {
    let p = 0;
    let n = 0;
    while (true) {
      const i = buf.indexOf(open, p);
      if (i < 0) break;
      const after = buf[i + open.length];
      const boundary =
        after === 0x3e || after === 0x2f || after === 0x20 || after === 0x09 || after === 0x0a || after === 0x0d;
      if (!boundary) {
        p = i + open.length;
        continue;
      }
      const tagEnd = buf.indexOf(">", i);
      if (tagEnd < 0) break;
      const j = buf.indexOf(close, tagEnd + 1);
      if (j < 0) throw new Error(`unterminated <${kind}> opened at byte ${i}`);
      const tag = buf.subarray(i, tagEnd + 1).toString("utf8");
      const external = /\bsrc\s*=\s*["']/i.test(tag);
      if (external) {
        blocks.push({ kind, external: true, tag, openStart: i, contentStart: tagEnd + 1, contentEnd: j });
      } else {
        n++;
        const content = buf.subarray(tagEnd + 1, j);
        blocks.push({
          kind: /\btype\s*=\s*["']importmap["']/i.test(tag) ? "importmap" : kind,
          external: false,
          block: n,
          tag,
          openStart: i,
          contentStart: tagEnd + 1,
          contentEnd: j,
          bytes: content.length,
          sha256: sha256(content),
          text: content.toString("utf8"),
        });
      }
      p = j + close.length;
    }
  }
  return blocks.sort((a, b) => a.openStart - b.openStart);
}

// payload kinds for hashed notRendered records
const KIND_OF = [
  [/\.(png|jpe?g|webp|gif|svg|avif|ico)$/i, "image"],
  [/\.(mp4|webm)$/i, "video"],
  [/\.(mp3|ogg|wav|m4a)$/i, "audio"],
  [/\.(woff2?|ttf|otf)$/i, "font"],
  [/\.(glb|gltf)$/i, "model"],
  [/\.(json|webmanifest)$/i, "data"],
];

async function main() {
  const { mod: prettier, at } = await loadPrettier();
  console.log(`pinned prettier ${PINNED} (${at})`);

  const manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
  const captured = Object.keys(manifest.files).map((r) => r.split(path.sep).join("/")).sort();
  const captureBytes = (rel) => {
    const abs = path.join(proj, rel);
    if (!fs.existsSync(abs)) throw new Error(`capture file missing: ${rel}`);
    const buf = fs.readFileSync(abs);
    if (sha256(buf) !== manifest.files[rel].sha256)
      throw new Error(`${rel} on disk does not match .upstream/manifest.json — re-verify the capture first`);
    return buf;
  };

  const readableDir = path.join(proj, "readable");
  const srcDir = path.join(proj, "src");
  fs.mkdirSync(readableDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  const written = { readable: new Set(), src: new Set() };

  const sources = [];
  const sections = [];
  const notRendered = [];
  const inlineMapBlocks = [];
  const inlineFiles = [];
  let slicedTotal = 0;
  let wholeTotal = 0;
  let skippedTotal = 0;

  // ── statement-aligned slicing of one script source (pretty text) ───────
  // `vendor` (optional): { machinery, three, ids } — claims the bundle's
  // loader statements + vendor module definitions as wholeFile before the app
  // code is windowed. Used for the entry's big inline module script.
  async function sliceScript({
    rel,
    captureKind,
    captureByteStart,
    captureByteEnd,
    captureSha256,
    captureBytesLen,
    tag,
    pretty,
    sourceFile,
    vendor = null,
  }) {
    const lines = linesOf(pretty);
    const dbg = await prettier.__debug.parse(pretty, { parser: "babel" });
    const program = (dbg.ast.program || dbg.ast).body;
    if (!program.length) throw new Error(`${sourceFile}: no top-level statements — readable changed shape`);

    // Generic IIFE unwrap (fleet pattern; not triggered by this capture's
    // module-top-level app code, kept so a future refresh that wraps the game
    // in an IIFE still slices at the body's statement boundaries).
    let inner = program;
    let slicingMode = "top-level-program";
    let iifeFn = null;
    if (program.length === 1 && program[0].type === "ExpressionStatement") {
      const e = program[0].expression;
      const fn = e.type === "CallExpression" && e.callee ? e.callee : e;
      if (
        (fn.type === "ArrowFunctionExpression" || fn.type === "FunctionExpression") &&
        fn.body.type === "BlockStatement"
      ) {
        inner = fn.body.body;
        iifeFn = fn;
        slicingMode = "iife-body";
      }
    }
    const directives = iifeFn ? iifeFn.body.directives || [] : [];
    const directiveStmts = directives.map((d) => ({
      node: d,
      startLine: lineOf(pretty, d.start),
      endLine: lineOf(pretty, d.end),
      text: pretty.slice(d.start, d.end),
    }));
    const stmts = [
      ...directiveStmts,
      ...inner.map((n) => ({
        node: n,
        startLine: lineOf(pretty, n.start),
        endLine: lineOf(pretty, n.end),
        text: pretty.slice(n.start, n.end),
      })),
    ];
    for (let i = 1; i < stmts.length; i++)
      if (stmts[i].startLine <= stmts[i - 1].endLine)
        throw new Error(`${rel}: statements ${i - 1}/${i} share a line — cannot slice at line boundaries`);

    const specials = [];
    const covered = new Array(stmts.length).fill(false);
    const claim = (a, b, block) => {
      if (a < 0 || b < a || b >= stmts.length) throw new Error(`${rel}: bad ${block.file} range ${a}-${b}`);
      for (let i = a; i <= b; i++) {
        if (covered[i]) throw new Error(`${rel}: ${block.file} overlaps another block at statement ${i}`);
        covered[i] = true;
      }
      specials.push({ ...block, A: stmts[a].startLine, B: stmts[b].endLine });
    };

    // wrapper head/tail (only when an IIFE was unwrapped)
    if (slicingMode === "iife-body") {
      const first = stmts[0];
      const last = stmts[stmts.length - 1];
      if (first.startLine > 1)
        specials.push({
          kind: "skip",
          file: `${tag}-wrapper-head.js`,
          title: `${tag} — IIFE wrapper head (non-standalone, not sliced)`,
          desc: `Lines 1-${first.startLine - 1}. The inline script opens with a single top-level IIFE (\`(() => {\`); the wrapper head is not standalone, so it is indexed only. Slices are cut inside the body (${slicingMode}).`,
          A: 1,
          B: first.startLine - 1,
        });
      if (last.endLine < lines.length)
        specials.push({
          kind: "skip",
          file: `${tag}-wrapper-tail.js`,
          title: `${tag} — IIFE wrapper tail (non-standalone, not sliced)`,
          desc: `Lines ${last.endLine + 1}-${lines.length}. The IIFE invocation tail (\`})();\`) is not standalone, so it is indexed only.`,
          A: last.endLine + 1,
          B: lines.length,
        });
    }

    // ── vendor plan: loader machinery + the 12 module definitions ────────
    if (vendor) {
      if (!/^const __defs\b/.test(stmts[0].text.trim()) || !/^function __req\b/.test(stmts[1].text.trim()))
        throw new Error(`${rel}: bundle does not open with the __defs/__req loader — readable changed shape`);
      claim(0, 1, {
        kind: "whole",
        file: vendor.machinery.file,
        title: vendor.machinery.title,
        body: vendor.machinery.body,
      });
      const n = vendor.ids.length;
      const gotIds = stmts.slice(2, 2 + n).map((s) => (/^__defs\[\s*['"]([^'"]+)['"]\s*\]/.exec(s.text.trim()) || [])[1]);
      const missing = gotIds.filter((x) => !x);
      if (missing.length || gotIds.length !== n)
        throw new Error(`${rel}: expected ${n} consecutive __defs definitions after the loader — readable changed shape`);
      const gotSet = [...gotIds].sort().join("\n");
      const wantSet = [...vendor.ids].sort().join("\n");
      if (gotSet !== wantSet)
        throw new Error(
          `${rel}: vendor module id set changed — readable changed shape\n  got:  ${gotIds.join(", ")}\n  want: ${vendor.ids.join(", ")}`,
        );
      const regionText = lines.slice(stmts[2].startLine - 1, stmts[2 + n - 1].endLine).join("\n");
      for (const [re, what] of VENDOR_GUARDS)
        if (!re.test(regionText)) throw new Error(`${rel}: vendor region guard failed (${what}) — readable changed shape`);
      claim(2, 2 + n - 1, {
        kind: "whole",
        file: vendor.three.file,
        title: vendor.three.title,
        body: vendor.three.body,
      });
    }

    // body statements that are not standalone at module top level (top-level `return`)
    for (let i = 0; i < stmts.length; i++) {
      if (!covered[i] && hasTopLevelReturn(stmts[i].node)) {
        claim(i, i, {
          kind: "skip",
          file: `${tag}-nonstandalone-${i + 1}.js`,
          title: `${tag} — non-standalone statement (top-level return, not sliced)`,
          desc: `Lines ${stmts[i].startLine}-${stmts[i].endLine}. This statement is only valid inside a function body (it contains a top-level \`return\`), so it is indexed only — it would not parse standalone.`,
        });
      }
    }

    // runs of uncovered statements -> windows
    const runs = [];
    for (let i = 0; i < stmts.length; i++) {
      if (covered[i]) continue;
      const run = [stmts[i]];
      while (i + 1 < stmts.length && !covered[i + 1]) run.push(stmts[++i]);
      runs.push(run);
    }
    const windows = [];
    for (const run of runs) for (const w of windowize(run)) windows.push(w);

    // blocks in line order, then re-tile so every line of the pretty is owned
    const blocks = [
      ...specials,
      ...windows.map((w) => ({ kind: "slice", A: w.startLine, B: w.endLine, count: w.count })),
    ];
    blocks.sort((a, b) => a.A - b.A);
    for (let i = 0; i < blocks.length; i++) {
      if (i === 0) blocks[i].A = 1;
      if (i + 1 < blocks.length) blocks[i].B = blocks[i + 1].A - 1;
      else blocks[i].B = lines.length;
    }

    let nn = 0;
    let perFileSkipped = 0;
    let perFileWhole = 0;
    for (const b of blocks) {
      if (b.kind === "slice") {
        nn++;
        const num = String(nn).padStart(2, "0");
        const body = lines.slice(b.A - 1, b.B).join("\n") + "\n";
        const ms = markers(body);
        const topWord = ms.length ? ms[0][0] : /^\s*['"]use strict['"]/.test(body) ? "use-strict" : tag.toLowerCase();
        const oversized = b.count === 1 && b.B - b.A + 1 > MAX_WINDOW;
        const file = `${tag}-${num}.js`;
        const sliceText =
          `// ${tag} ${num} — ${topWord}\n` +
          `// Lines ${b.A}-${b.B} of ${sourceFile} (statement-aligned).\n` +
          body;
        const chk = parses(sliceText);
        if (!chk.ok) throw new Error(`generated src/${file} does not parse standalone: ${chk.why}`);
        fs.writeFileSync(path.join(srcDir, file), sliceText);
        written.src.add(file);
        sections.push({
          file,
          title: `${tag} ${num} — ${topWord}`,
          desc: `${oversized ? "Oversized single declaration (kept whole). " : ""}Lines ${b.A}-${b.B}. Markers: ${markerText(ms)}.`,
          startLine: b.A,
          endLine: b.B,
          sourceFile,
        });
      } else if (b.kind === "whole") {
        perFileWhole++;
        sections.push({
          file: b.file,
          wholeFile: true,
          title: b.title,
          desc: `Lines ${b.A}-${b.B} of ${sourceFile}: ${b.body}`,
          note: "whole-file region (vendor/machinery rule): indexed in readable/, never sliced",
          startLine: b.A,
          endLine: b.B,
          sourceFile,
        });
      } else {
        perFileSkipped++;
        sections.push({
          file: b.file,
          skipped: true,
          title: b.title,
          desc: b.desc,
          startLine: b.A,
          endLine: b.B,
          sourceFile,
          firstLine: lines[b.A - 1],
          lastLine: lines[b.B - 1],
        });
      }
    }
    slicedTotal += nn;
    wholeTotal += perFileWhole;
    skippedTotal += perFileSkipped;
    sources.push({
      sourceFile,
      capture: rel,
      captureKind,
      captureByteStart,
      captureByteEnd,
      captureSha256,
      captureBytes: captureBytesLen,
      prettyLines: lines.length,
      prettyBytes: Buffer.byteLength(pretty, "utf8"),
      prettyPasses: 1,
      idempotent: true,
      tag,
      slicingMode,
      slices: nn,
      derived:
        `readable + ${nn} statement-aligned slice(s)` +
        (perFileWhole ? ` + ${perFileWhole} wholeFile region(s)` : "") +
        (perFileSkipped ? ` + ${perFileSkipped} skipped section(s)` : ""),
    });
    console.log(
      `derive: ${tag} -> ${sourceFile} (${lines.length} lines, ${nn} slices, ${perFileWhole} wholeFile, ${perFileSkipped} skipped, ${slicingMode})`,
    );
  }

  // ── 1) captured script files (sw.js): prettier twin + slices ────────────
  const jsRels = captured.filter((r) => /\.js$/i.test(r));
  for (const rel of jsRels) {
    const buf = captureBytes(rel);
    const text = buf.toString("utf8");
    if (!Buffer.from(text, "utf8").equals(buf)) throw new Error(`${rel} does not round-trip through utf8`);
    const pretty = await formatOnce(prettier, text, "babel");
    if (pretty === text) throw new Error(`${rel}: prettier output is byte-identical to the capture`);
    const tag = rel.replace(/\.(js|css)$/i, "").split("/").join("__");
    const prettyFile = `${tag}.pretty.js`;
    fs.writeFileSync(path.join(readableDir, prettyFile), pretty);
    written.readable.add(prettyFile);
    await sliceScript({
      rel,
      captureKind: "file",
      captureSha256: manifest.files[rel].sha256,
      captureBytesLen: buf.length,
      tag,
      pretty,
      sourceFile: `readable/${prettyFile}`,
    });
  }

  // ── 2) entry document: inline <script>/<style> scan + twins + slicing ───
  const htmlRels = captured.filter((r) => /\.html$/i.test(r));
  if (!htmlRels.length) throw new Error("capture carries no HTML entry document");
  for (const rel of htmlRels) {
    const buf = captureBytes(rel);
    const blocks = scanBlocks(buf);
    const inline = blocks.filter((b) => !b.external);
    const externals = blocks.filter((b) => b.external);
    inlineFiles.push(rel);
    for (const b of externals) console.log(`derive: ${rel}: external ${b.kind} (not derived): ${b.tag.slice(0, 90)}`);
    if (!inline.length) throw new Error(`${rel}: no inline <script>/<style> content blocks — nothing to derive`);
    const entryTag = rel.replace(/\.html$/i, "").split("/").join("__");
    const DATA_TYPES = new Set(["application/ld+json", "application/json", "importmap", "speculationrules"]);
    for (const b of inline) {
      const isImportmap = b.kind === "importmap";
      const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(b.tag)?.[1] ?? "").toLowerCase();
      if (b.kind === "script" && DATA_TYPES.has(type)) {
        notRendered.push({
          capture: rel,
          kind: "inline-data",
          type,
          byteStart: b.contentStart,
          byteEnd: b.contentEnd,
          bytes: b.bytes,
          sha256: b.sha256,
          rendered: false,
          reason: `typed data block (<script type="${type}">) — data, not JS/CSS; recorded with range + sha256, no pretty pass`,
        });
        continue;
      }
      const tag = `${entryTag}-inline-${b.block}`;
      const parser = isImportmap ? "json" : b.kind === "style" ? "css" : "babel";
      const prettyExt = isImportmap ? "json" : b.kind === "style" ? "css" : "js";
      const prettyFile = `${tag}.pretty.${prettyExt}`;
      const pretty = await formatOnce(prettier, b.text, parser);
      if (pretty === b.text)
        throw new Error(`readable/${prettyFile} would be byte-identical to its capture source`);
      fs.writeFileSync(path.join(readableDir, prettyFile), pretty);
      written.readable.add(prettyFile);
      inlineMapBlocks.push({
        file: `readable/${prettyFile}`,
        source: rel,
        kind: isImportmap ? "importmap" : b.kind,
        byteStart: b.contentStart,
        byteEnd: b.contentEnd,
        bytes: b.bytes,
        sha256: b.sha256,
        prettyFile: `readable/${prettyFile}`,
        prettyBytes: Buffer.byteLength(pretty, "utf8"),
      });
      if (b.kind === "style" || isImportmap) {
        // stylesheet/importmap rule: whole-file, never sliced
        const lines = linesOf(pretty);
        sections.push({
          file: `${tag}.${prettyExt}`,
          wholeFile: true,
          title: `${tag} — inline ${isImportmap ? "importmap" : b.kind} block (whole-file, never sliced)`,
          desc: `Lines 1-${lines.length} of readable/${prettyFile}. Whole-file: the entry document's inline ${b.kind} block (${b.bytes} B at bytes ${b.contentStart}-${b.contentEnd} of ${rel}) is indexed whole and never sliced.`,
          note: `whole-file (entry inline ${b.kind} block, not sliced)`,
          startLine: 1,
          endLine: lines.length,
          sourceFile: `readable/${prettyFile}`,
        });
        sources.push({
          sourceFile: `readable/${prettyFile}`,
          capture: rel,
          captureKind: `inline-${b.kind}`,
          captureByteStart: b.contentStart,
          captureByteEnd: b.contentEnd,
          captureSha256: b.sha256,
          captureBytes: b.bytes,
          prettyLines: lines.length,
          prettyBytes: Buffer.byteLength(pretty, "utf8"),
          prettySha256: sha256(Buffer.from(pretty, "utf8")),
          tag,
          slices: 0,
          derived: "readable only (inline block, wholeFile)",
        });
        console.log(`derive: ${rel} inline ${b.kind} #${b.block} -> readable/${prettyFile} (${lines.length} lines, wholeFile)`);
      } else {
        // the big inline module script carries the vendor bundle inline —
        // detected by the bundle's own loader shape, not by size
        const vendor = /^\s*const __defs\b/.test(b.text)
          ? {
              ids: VENDOR_IDS,
              machinery: {
                file: `${tag}-loader-machinery.js`,
                title: `${tag} — __defs/__req module-registry loader (build machinery, whole-file, never sliced)`,
                body:
                  "the bundle's own module registry (`const __defs = {}, __cache = {};` + the `__req` lookup/" +
                  "memoise function that every module definition below resolves through). Build machinery that " +
                  "replaced ES-module imports when the whole dependency graph was inlined into one script — " +
                  "indexed whole-file in readable/, never sliced.",
              },
              three: {
                file: `${tag}-three-vendor.js`,
                title: `${tag} — bundled three.js r187dev + jsm addons (vendor region, whole-file, never sliced)`,
                body:
                  "the twelve `__defs['<id>'] = function () { … };` vendor module definitions the loader " +
                  "registers: three.module.js and three.core.js (the full three.js r187dev engine source — math, " +
                  "camera, geometry, materials, renderers, WebGLRenderer, `REVISION = '187dev'`, " +
                  "`window.__THREE__` registration) plus the ten examples/jsm postprocessing+shader addons the " +
                  "build inlined (EffectComposer, RenderPass, ShaderPass, MaskPass, UnrealBloomPass, OutputPass, " +
                  "CopyShader, LuminosityHighPassShader, OutputShader, Pass) — vendor, not app code. Vendor rule " +
                  "— indexed whole-file in readable/, never sliced or rewritten.",
              },
            }
          : null;
        await sliceScript({
          rel,
          captureKind: `inline-${b.kind}`,
          captureByteStart: b.contentStart,
          captureByteEnd: b.contentEnd,
          captureSha256: b.sha256,
          captureBytesLen: b.bytes,
          tag,
          pretty,
          sourceFile: `readable/${prettyFile}`,
          vendor,
        });
      }
    }
  }

  // ── 3) non-code payloads: hashed notRendered records (no pretty pass) ───
  for (const rel of captured) {
    if (/\.html?$/i.test(rel) || /\.js$/i.test(rel) || /\.css$/i.test(rel)) continue;
    const kind = KIND_OF.find(([re]) => re.test(rel))?.[1];
    if (!kind) throw new Error(`captured non-code file with unknown payload kind: ${rel}`);
    const buf = captureBytes(rel);
    notRendered.push({
      capture: rel,
      kind,
      bytes: buf.length,
      sha256: manifest.files[rel].sha256,
      rendered: false,
      reason: `${kind} payload — binary/data capture stays byte-exact under .upstream/manifest.json; recorded here hashed, no pretty pass`,
    });
  }

  // ── 4) inline map (byte ranges + sha256 of every inline block) ──────────
  fs.writeFileSync(
    path.join(readableDir, "index-inline-map.json"),
    JSON.stringify(
      {
        note:
          "byte ranges (into the captured entry document) + sha256 for every inline <script>/<style> content block, " +
          "with its readable twin; generated by tools/derive.mjs",
        blocks: inlineMapBlocks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`derive: wrote readable/index-inline-map.json (${inlineMapBlocks.length} inline block(s))`);

  // ── 5) prune orphan derived files (capture untouched) ──────────────────
  let pruned = 0;
  for (const [dir, keep, exts] of [
    [readableDir, written.readable, /\.(pretty\.js|pretty\.css|pretty\.json)$/],
    [srcDir, written.src, /\.js$/],
  ]) {
    for (const f of fs.readdirSync(dir)) {
      if (exts.test(f) && !keep.has(f)) {
        fs.rmSync(path.join(dir, f));
        pruned++;
        console.log(`derive: pruned orphan derived file ${path.join(path.basename(dir), f)}`);
      }
    }
  }

  // ── 6) split-spec.json (2-space indent + trailing newline) ─────────────
  const appSources = sources.filter((s) => s.slices > 0);
  const cssSources = sources.filter((s) => s.sourceFile.endsWith(".pretty.css"));
  const spec = {
    project: "roadster-flying-car",
    kind: "statement-aligned-slices",
    defaultFile: `src/${sections.find((s) => !s.wholeFile && !s.skipped).file}`,
    note:
      "ROADSTER: The Flying Car (https://roadster-the-flying-car-gamev28.vercel.app/) is capture-class: a " +
      "single-file three.js game served by Vercel at the origin root. §0.4 fork-over-mirror was checked on " +
      "2026-10-13 — no public upstream source repo exists (the captured text carries no github/gitlab/bitbucket " +
      "reference for the project itself; the only repository credits are third-party library banners inside the " +
      "bundled three.js source — mrdoob/three.js, toji/gl-matrix, mapbox/earcut, paper.js, GeometricTools, " +
      "lightgl.js — and a GitHub search for the project finds nothing), so the mirror stands. Derived pipeline: " +
      "capture → pinned prettier 3.9.6 (module API, default options, single pass verified idempotent — never the " +
      "CLI: it respects .gitignore and can silently echo its input) → the entry document's inline " +
      "<script type=\"module\"> becomes readable/index-inline-1.pretty.js and the service-worker registration " +
      "script becomes readable/index-inline-2.pretty.js (both pretties provably NOT byte-identical to their " +
      "capture blocks; readable/index-inline-map.json records each block's exact byte range + sha256), the two " +
      "inline <style> blocks become readable/index-inline-1|2.pretty.css, and the captured sw.js becomes " +
      "readable/sw.pretty.js. The big script is a single-file bundle behind a tiny `__defs`/`__req` module " +
      "registry: its first two statements (the registry object and the `__req` loader) are wholeFile build " +
      "machinery, the next twelve statements are the vendor `__defs['<id>'] = function () { … };` module " +
      "definitions (three.js r187dev three.core/three.module plus the ten examples/jsm postprocessing+shader " +
      "addons) claimed wholeFile under the vendor rule (indexed, never sliced; the id set and content anchors " +
      "are asserted), and everything from the app's `const THREE = __req('three.module.js');` on is the game's " +
      "own app code — statement-aligned slices src/index-inline-1-NN.js at top-level statement boundaries " +
      "(~250-350 line windows; oversized single declarations stay whole) with an exact 2-line provenance " +
      "header. Every slice parses standalone under `node --input-type=module --check -` and round-trips " +
      "byte-exact to its recorded readable line range. Stylesheet rule — the two inline <style> blocks are " +
      "wholeFile sections, never sliced. Non-code payloads (icon-192.png, icon-512.png, og.jpg and the " +
      "manifest.webmanifest data file) are hashed notRendered records (bytes + sha256, no pretty pass). The " +
      "off-origin loads (the Google Fonts stylesheet + font origins, the gstatic firebase base the optional " +
      "cloud-login path dynamic-imports) were never captured (socker precedent, PLAN §1) and have no derived " +
      "layer; tools/capture.mjs --check lists them as external references. Identifiers in src/ are the " +
      "bundle's own names — the rename campaign (PLAN §5) is recorded as an open task in README.md, not " +
      "claimed here. Capture bytes are untouched by everything above; re-cut with `node tools/derive.mjs` " +
      "after any capture refresh. `node tools/audit.js` is the gate.",
    renderOptions: {
      _default:
        "prettier 3.9.6, module API, default options, single pass (re-format verified idempotent at derive time) — never the CLI: it respects .gitignore and can silently echo its input",
      js: "parser babel, no plugins (inline <script> blocks + captured sw.js)",
      css: "parser css, no plugins (inline <style>)",
      json: "parser json, no plugins (inline importmap blocks, if any)",
    },
    source:
      `readable/: ${inlineMapBlocks.length} inline twin(s) + ${jsRels.length} captured script twin(s) ` +
      `(${appSources.length} sliced script(s): ${sources.filter((s) => s.slicingMode).length} total); ` +
      `src/: ${slicedTotal} statement-aligned slice(s); ` +
      `${wholeTotal} wholeFile section(s); ${skippedTotal} skipped section(s); ` +
      `capture: ${captured.length} files under .upstream/manifest.json; inline scan: ${inlineFiles.join(", ")} ` +
      `(${inlineMapBlocks.length} content block(s)); notRendered: ${notRendered.length} hashed payload record(s).`,
    inline: {
      scanned: inlineFiles,
      contentBlocks: inlineMapBlocks.length,
      notRendered: notRendered.filter((n) => n.kind === "inline-data").length,
      note:
        "the entry document carries two inline <script> blocks (the 2,697,801 B bundle carrying the whole " +
        "three.js engine + the game, and the 149 B service-worker registration) and two inline <style> blocks " +
        "(66 B + 61,649 B); every content block has a readable twin recorded in readable/index-inline-map.json " +
        "with its exact byte range + sha256. The off-origin <link rel=stylesheet> (Google Fonts) is a CDN " +
        "dependency and is not derived.",
    },
    sources,
    sections,
    notRendered,
  };
  fs.writeFileSync(path.join(proj, "split-spec.json"), JSON.stringify(spec, null, 2) + "\n");

  // ── 7) self-check (tools/audit.js is the authoritative gate) ────────────
  let bad = 0;
  const bySource = new Map();
  for (const s of sections) {
    if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
    bySource.get(s.sourceFile).push(s);
  }
  for (const [sourceFile, list] of bySource) {
    const lines = readLines(path.join(proj, sourceFile));
    const sorted = [...list].sort((a, b) => a.startLine - b.startLine);
    if (sorted[0].startLine !== 1) {
      console.error(`TILING FAIL ${sourceFile}: starts at line ${sorted[0].startLine}`);
      bad++;
    }
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].startLine !== sorted[i - 1].endLine + 1) {
        console.error(`TILING FAIL ${sourceFile}: gap/overlap at ${sorted[i].file}`);
        bad++;
      }
    if (sorted[sorted.length - 1].endLine !== lines.length) {
      console.error(`TILING FAIL ${sourceFile}: does not reach EOF (${lines.length})`);
      bad++;
    }
  }
  let parsed = 0;
  let ranged = 0;
  let roundOK = 0;
  for (const s of sections) {
    if (s.wholeFile || s.skipped) continue;
    ranged++;
    const abs = path.join(srcDir, s.file);
    const text = fs.readFileSync(abs, "utf8");
    const nl2 = text.indexOf("\n", text.indexOf("\n") + 1);
    const body = text.slice(nl2 + 1);
    const expected = readLines(path.join(proj, s.sourceFile)).slice(s.startLine - 1, s.endLine).join("\n") + "\n";
    if (body !== expected) {
      console.error(`ROUND-TRIP FAIL ${s.file}`);
      bad++;
    } else roundOK++;
    if (!parses(text).ok) {
      console.error(`PARSE FAIL src/${s.file}`);
      bad++;
    } else parsed++;
  }
  let prettyParsed = 0;
  for (const s of sources) {
    if (!s.sourceFile.endsWith(".pretty.js")) continue;
    if (!parses(fs.readFileSync(path.join(proj, s.sourceFile), "utf8")).ok) {
      console.error(`PARSE FAIL ${s.sourceFile}`);
      bad++;
    } else prettyParsed++;
  }
  console.log(
    `derive: ${written.readable.size} readable file(s), ${written.src.size} src slices ` +
      `(${parsed}/${ranged} parse standalone, ${roundOK}/${ranged} round-trip byte-exact), ` +
      `${skippedTotal} skipped, ${sections.filter((s) => s.wholeFile).length} wholeFile, ` +
      `${prettyParsed} pretty js parse clean, ${notRendered.length} notRendered, ${pruned} orphan(s) pruned — ` +
      `self-check ${bad ? bad + " FAILURE(S)" : "clean"}`,
  );
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
