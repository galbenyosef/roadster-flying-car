// probe-structure.mjs — read-only structure probe over the readable layer:
// what the captured code actually exposes (source maps, module/factory
// signatures, top-level statements), where the recorded slice boundaries fall,
// and which identifiers the rename campaign may address.
//
// Evidence tool for the 2026-10-14 structure + rename pass (PLAN §5). It
// writes nothing; every fact it prints is re-derivable from the capture.
// The rename-candidate verdicts (eligible / refused + why) come from
// `node tools/apply-names.mjs --list` — the writer's own preflight, so the
// evidence and the guard can never disagree.
//
// usage: node tools/probe-structure.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAcorn } from "./lib-acorn.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const acorn = await getAcorn();

const spec = JSON.parse(fs.readFileSync(path.join(proj, "split-spec.json"), "utf8"));
const cache = new Map();
const linesOf = (rel) => {
  if (!cache.has(rel)) cache.set(rel, fs.readFileSync(path.join(proj, rel), "utf8").split("\n"));
  return cache.get(rel);
};

// the app chunk: the sliced source with the most ranged sections
const bySource = new Map();
for (const s of spec.sections) {
  if (s.wholeFile || s.skipped || typeof s.startLine !== "number") continue;
  bySource.set(s.sourceFile, (bySource.get(s.sourceFile) || 0) + 1);
}
const appSource = [...bySource.entries()].sort((a, b) => b[1] - a[1])[0][0];

// ── 1) bundle-shape signatures ──────────────────────────────────────────
// The entry document carries the code inline, so scan the derived twins (the
// faithful renderings) rather than the HTML for JS signatures.
const manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
console.log("captured code surface:");
for (const rel of Object.keys(manifest.files).sort()) {
  const raw = fs.readFileSync(path.join(proj, rel), "utf8");
  const isHtml = /\.html?$/i.test(rel);
  const text = isHtml ? "" : raw;
  const sigs = {
    sourceMappingURL: /sourceMappingURL/.test(raw),
    "import(": (text.match(/\bimport\s*\(/g) || []).length,
    "bare import": (text.match(/(^|[;{}\s])import\s*["'`]/g) || []).length,
    "from-import": (text.match(/\bfrom\s*["'`]/g) || []).length,
    exportTable: (text.match(/\bexport\s*\{/g) || []).length,
    __vite__mapDeps: (text.match(/__vite__mapDeps/g) || []).length,
    modulepreload: (text.match(/modulepreload/g) || []).length,
    "__webpack_require__": (text.match(/__webpack_require__/g) || []).length,
    "__turbopack": (text.match(/__turbopack|turbopack_/g) || []).length,
    moduleFactories: (text.match(/\.push\(\[/g) || []).length,
    __defs: (text.match(/__defs\[/g) || []).length,
    __req: (text.match(/__req\(/g) || []).length,
    newURLWorker: (text.match(/new URL\([^)]*import\.meta\.url/g) || []).length,
    importMeta: (text.match(/import\.meta/g) || []).length,
  };
  console.log(`  ${rel}: ${JSON.stringify(sigs)}`);
}
const mapFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "legacy", "readable", "src", "tools", "docs"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".map")) mapFiles.push(path.relative(proj, p).split(path.sep).join("/"));
  }
})(proj);
console.log(`  *.map files in the capture: ${mapFiles.length}${mapFiles.length ? " — " + mapFiles.join(", ") : ""}`);

// ── 2) the __defs factory table (is the module structure extractable?) ──
const appLines = linesOf(appSource);
const defRe = /^__defs\[["']([^"']+)["']\]\s*=\s*function\s*\(/;
const factories = [];
appLines.forEach((l, i) => {
  const m = defRe.exec(l);
  if (m) factories.push({ id: m[1], line: i + 1 });
});
const VENDOR = new Set([
  "three.module.js", "three.core.js",
  "jsm/postprocessing/EffectComposer.js", "jsm/shaders/CopyShader.js",
  "jsm/postprocessing/ShaderPass.js", "jsm/postprocessing/Pass.js",
  "jsm/postprocessing/MaskPass.js", "jsm/postprocessing/RenderPass.js",
  "jsm/postprocessing/UnrealBloomPass.js", "jsm/shaders/LuminosityHighPassShader.js",
  "jsm/postprocessing/OutputPass.js", "jsm/shaders/OutputShader.js",
]);
console.log(`\n${appSource}: __defs factory table`);
console.log(`  top-level __defs['<id>'] = function () { … } definitions: ${factories.length}`);
for (const f of factories) console.log(`    line ${String(f.line).padStart(6)}  ${VENDOR.has(f.id) ? "vendor " : "APP??  "} ${f.id}`);
const appFactories = factories.filter((f) => !VENDOR.has(f.id));
console.log(`  vendor factories: ${factories.length - appFactories.length}, non-vendor: ${appFactories.length}`);
console.log(
  `  verdict: the registry IS a factory family (${factories.length} module factories), but every factory is a ` +
    `VENDOR module — the vendor rule claims the whole region wholeFile (never sliced, never rewritten), exactly the ` +
    `turbopack README's "the vendor chunk (one that carries no push) stays wholeFile" gotcha adapted. ` +
    `There are ${appFactories.length} app factories, so the app code is NOT a factory family.`,
);

// ── 3) top-level statements of the sliced pretty + recorded boundaries ──
const fullText = appLines.join("\n");
let ast;
try {
  ast = acorn.parse(fullText, { ecmaVersion: 2023, sourceType: "module", locations: true });
} catch {
  ast = acorn.parse(fullText, { ecmaVersion: 2023, sourceType: "script", locations: true });
}
const starts = [0];
for (let i = 0; i < fullText.length; i++) if (fullText[i] === "\n") starts.push(i + 1);
const lineOf = (off) => {
  let lo = 0,
    hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= off) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
};
const stmts = ast.body.map((n, i) => ({ i, type: n.type, startLine: lineOf(n.start), endLine: lineOf(n.end - 1) }));
console.log(`\n${appSource}: ${stmts.length} top-level statements, ${appLines.length} lines`);
console.log(`statement types: ${JSON.stringify(Object.fromEntries(Object.entries(stmts.reduce((a, s) => ((a[s.type] = (a[s.type] || 0) + 1), a), {})).sort()))}`);
console.log(`top-level IIFE? ${stmts.length === 1 && stmts[0].type === "ExpressionStatement" ? "YES (whole-program IIFE)" : "NO — flat module top level (proposal (ah): no re-rooting)"}`);

const bounds = spec.sections
  .filter((s) => s.sourceFile === appSource)
  .sort((a, b) => a.startLine - b.startLine)
  .map((s) => [s.file, s.startLine, s.endLine, s.wholeFile ? "wholeFile" : s.skipped ? "skipped" : "ranged"]);
console.log(`recorded section boundaries (${bounds.length}) -> statement indices:`);
for (const [file, a, b, kind] of bounds) {
  const first = stmts.find((s) => s.startLine === a);
  const last = stmts.find((s) => s.endLine === b);
  console.log(`  ${path.basename(file).padEnd(48)} lines ${String(a).padStart(6)}-${String(b).padStart(6)}  stmt#${first ? first.i : "??"}..${last ? last.i : "??"}  ${kind}`);
}
const shared = stmts.filter((s, k) => k > 0 && s.startLine <= stmts[k - 1].endLine);
console.log(`statements sharing a line: ${shared.length}`);

// ── 4) rename-candidate space ───────────────────────────────────────────
const ranged = bounds.filter(([, , , kind]) => kind === "ranged").map(([, a, b]) => [a, b]);
const whole = bounds.filter(([, , , kind]) => kind === "wholeFile").map(([, a, b]) => [a, b]);
const skipped = bounds.filter(([, , , kind]) => kind === "skipped").map(([, a, b]) => [a, b]);
const fmt = (rs) => rs.map(([a, b]) => `${a}-${b}`).join(", ");
console.log(`\nranged app regions: ${fmt(ranged)}`);
console.log(`wholeFile regions: ${fmt(whole)} (loader machinery + three.js vendor band + stylesheet rule — never sliced, never renamed)`);
console.log(`skipped sections: ${fmt(skipped) || "(none)"}`);
console.log("\nrename-eligible program-scope names: run `node tools/apply-names.mjs --list` (the writer's own preflight; this probe does not duplicate the scope walk).");

// ── 5) template substitutions with braces inside the ranged regions ─────
const SKIP_KEYS = new Set(["type", "start", "end", "loc", "range", "raw"]);
const inRanged = (l) => ranged.some(([a, b]) => l >= a && l <= b);
console.log("\ntemplate substitutions containing `{` inside ranged regions (the brace-depth scanner guard, proposal (r)):");
let found = 0;
(function scanTemplates(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const c of node) scanTemplates(c);
    return;
  }
  if (typeof node.type !== "string") {
    for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) scanTemplates(node[k]);
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const e of node.expressions) {
      const l = lineOf(node.start);
      if (inRanged(l)) {
        const t = fullText.slice(e.start, e.end);
        if (t.includes("{")) {
          found++;
          if (found <= 12) console.log(`  line ${l}: \${{ ${t.slice(0, 80)}${t.length > 80 ? "…" : ""} }}`);
        }
      }
    }
  }
  for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) scanTemplates(node[k]);
})(ast);
console.log(found ? `  ${found} substitution(s) carry a brace (the scanner must close on the MATCHING brace)` : "  (none)");
