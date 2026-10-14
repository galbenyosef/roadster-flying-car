// audit.js — integrity gate (PLAN §5), tailored to roadster-flying-car's shape.
//
// ROADSTER: The Flying Car (https://roadster-the-flying-car-gamev28.vercel.app/)
// is capture-class: a single-file three.js game served by Vercel at the origin
// root. Nearly all of the code lives inside the entry document, so the derived
// pipeline is:
//
//   index.html inline <script type="module"> -> readable/index-inline-1.pretty.js
//                                               + src/index-inline-1-NN.js slices
//                                               (vendor regions wholeFile, never sliced)
//   index.html inline <script> (SW register) -> readable/index-inline-2.pretty.js + slices
//   index.html inline <style>s               -> readable/index-inline-1|2.pretty.css  (wholeFile)
//   captured sw.js                           -> readable/sw.pretty.js + src/sw-NN.js slices
//   readable/index-inline-map.json           -> byte ranges + sha256 per inline block
//   capture non-code payloads                -> split-spec notRendered hashed records
//
// split-spec.json records that pipeline and this gate keeps it honest:
//
//   1. split-spec.json parses, carries a note + renderOptions, and a defaultFile exists.
//   2. Every section resolves: ranged slices have a src/*.js file on disk, a readable
//      *.pretty.js|css sourceFile and in-bounds startLine/endLine; wholeFile sections
//      (the two inline stylesheets, the __defs/__req loader machinery and the bundled
//      three.js vendor region) must NOT have a src file; `skipped` sections must NOT
//      have a src file and are re-verified textually against their recorded lines.
//   3. The ranges of each sourceFile tile it exactly: first starts at line 1, each next
//      starts at previous end + 1, last ends at EOF — no gaps, no overlaps.
//   4. Byte-exact round-trip through the rename layer: every src slice minus its exact
//      2-line header (`// <tag> NN — <marker>` + `// Lines A-B of <pretty>
//      (statement-aligned).`) equals its recorded sourceFile range byte for byte with
//      the recorded rename map applied (tools/engine/rename-layer.mjs applyRecordedMap,
//      the same application tools/derive.mjs re-cuts with). A body that differs from
//      its readable range while rename-map.json records no map for it is an
//      unrecorded rename — a problem.
//   5. Every slice parses standalone with the exact gate command
//      `node --input-type=module --check -` (stdin), as does every readable *.pretty.js.
//   6. src/*.js on disk and the spec's ranged slices are the same set — no unlisted or
//      missing reversals; wholeFile/skipped names are not on disk.
//   7. Every readable pretty is referenced by the spec and is NOT byte-identical to its
//      capture source (inline twins are byte-compared against their capture block;
//      captured sw.js maps to readable/sw.pretty.js and is byte-compared against it).
//      Every captured .js/.css file must have a readable twin (layer completeness).
//   8. Inline-block scan: every inline <script>/<style> content block in a captured HTML
//      document must have its readable twin and a readable/index-inline-map.json entry
//      whose byte range + sha256 match the capture bytes.
//   9. notRendered completeness: every captured non-HTML/JS/CSS file (icon-192.png,
//      icon-512.png, og.jpg, manifest.webmanifest) has a notRendered record with the
//      manifest's sha256.
//  10. The hard rule — src/ import resolution: any specifier a slice carries must
//      resolve to a file the CAPTURE carries (this game has no import statements —
//      the bundle resolves modules through its own __defs/__req registry; the scanner
//      still runs, so a future refresh that introduces imports is checked).
//  11. Vendor/shape guards: the wholeFile vendor regions must carry the recorded
//      fingerprints (the loader registry; three.js r187dev + UnrealBloomPass), and the
//      big inline-script twin must carry the game's own (the three.js import site, the
//      WebGLRenderer, the vehicle controller, the frame loop, the branding) — a
//      silently reshaped readable fails the gate instead of passing.
//  12. Derived layers never enter the capture sums: no readable/, src/, legacy/ or
//      split-spec.json / rename-map.json path may appear in .upstream/manifest.json.
//  13. Rename-map honesty (the PLAN §5 campaign gate): rename-map.json parses; every
//      recorded file is a ranged slice on disk; every scoped index addresses the
//      recorded identifier token in that slice's readable range and is never an
//      import/export specifier (foreign) position; every map target is a valid
//      identifier and not the name itself; split-spec.json carries a `rename` block
//      naming rename-map.json.
//
// usage: node tools/audit.js
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { applyRecordedMap, foreignNameIndices, tokens } from "./engine/rename-layer.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const srcDir = path.join(proj, "src");
const readableDir = path.join(proj, "readable");
const PINNED = "3.9.6";

const problems = [];
const problem = (msg) => problems.push(msg);

// ── helpers ─────────────────────────────────────────────────────────────
const readLines = (abs) => {
  const t = fs.readFileSync(abs, "utf8");
  const l = t.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
};
const linesCache = new Map();
const getLines = (abs) => {
  if (!linesCache.has(abs)) linesCache.set(abs, readLines(abs));
  return linesCache.get(abs);
};
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// captured .js/.css rel -> readable twin name (dirs flattened with __)
const prettyNameOf = (capRel) => {
  const flat = capRel.replace(/\.(js|css)$/i, "").split("/").join("__");
  return "readable/" + flat + (/\.css$/i.test(capRel) ? ".pretty.css" : ".pretty.js");
};
const captureByPretty = new Map(); // readable/<x>.pretty.js|css -> capture rel

// parse check — the exact standalone gate: node --input-type=module --check - < file
function parseCheck(abs, rel) {
  const r = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: fs.readFileSync(abs),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0)
    problem(`standalone ESM parse failed: ${rel} — ${(r.stderr || "").trim().split("\n").slice(0, 4).join(" | ")}`);
  return r.status === 0;
}

// inline <script>/<style> scan (byte-exact, same shape as tools/derive.mjs)
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
      if (j < 0) {
        problem(`unterminated <${kind}> opened at byte ${i}`);
        break;
      }
      const tag = buf.subarray(i, tagEnd + 1).toString("utf8");
      const external = /\bsrc\s*=\s*["']/i.test(tag);
      if (!external) {
        n++;
        const content = buf.subarray(tagEnd + 1, j);
        blocks.push({
          kind: /\btype\s*=\s*['"]importmap['"]/i.test(tag) ? "importmap" : kind,
          block: n,
          contentStart: tagEnd + 1,
          contentEnd: j,
          bytes: content.length,
          sha256: sha256(content),
        });
      }
      p = j + close.length;
    }
  }
  return blocks.sort((a, b) => a.contentStart - b.contentStart);
}

// ── specifier extraction + export tables (the hard rule) ─────────────────
function extractSpecifiers(code) {
  const out = [];
  const push = (spec, kind, clause) => out.push({ spec, kind, clause: clause || "" });
  let m;
  const fromRe = /\bimport\s+([^;('"]*?)\s*from\s*(["'])([^"']+)\2/g;
  while ((m = fromRe.exec(code))) push(m[3], "from", m[1]);
  const sideRe = /\bimport\s*(["'])([^"']+)\1/g;
  while ((m = sideRe.exec(code))) push(m[2], "side-effect", "");
  const reExpRe = /\bexport\s+[^;()]*?\bfrom\s*(["'])([^"']+)\1/g;
  while ((m = reExpRe.exec(code))) push(m[2], "re-export", "");
  const dynRe = /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g;
  while ((m = dynRe.exec(code))) push(m[2], "dynamic", "");
  const dynTplRe = /\bimport\s*\(\s*`([^`]*)`\s*\)/g;
  while ((m = dynTplRe.exec(code))) if (!m[1].includes("${")) push(m[1], "dynamic", "");
  const urlRe = /\bnew\s+URL\s*\(\s*(["'`])([^"'`]+)\1\s*,/g;
  while ((m = urlRe.exec(code))) push(m[2], "worker-url", "");
  if (/\brequire\s*\(/.test(code)) push("<require()>", "require", "");
  return out;
}
function namedImports(clause) {
  const names = [];
  const brace = /\{([^}]*)\}/s.exec(clause);
  if (brace) {
    for (let part of brace[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const as = /\s+as\s+([\w$]+)\s*$/.exec(part);
      names.push(as ? part.slice(0, as.index).trim() : part); // imported name precedes `as`
    }
  } else {
    const head = clause.split(",")[0].trim();
    if (head && !head.startsWith("*")) names.push(head); // default import
  }
  return names.filter(Boolean);
}
function exportsOf(code) {
  const names = new Set();
  for (const m of code.matchAll(/\bexport\s*\{([^}]*)\}/g)) {
    for (let part of m[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const as = /\s+as\s+([\w$]+)\s*$/.exec(part);
      names.add(as ? as[1] : part);
    }
  }
  for (const m of code.matchAll(/\bexport\s+(?:async\s+)?(?:function|class)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of code.matchAll(/\bexport\s+(?:const|let|var)\s+([\w$]+)/g)) names.add(m[1]);
  if (/\bexport\s+default\b/.test(code)) names.add("default");
  if (/\bexport\s+\*\s+from\b/.test(code)) names.add("*");
  return names;
}

// ── capture manifest ────────────────────────────────────────────────────
let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
} catch (e) {
  problem(`.upstream/manifest.json does not parse: ${e.message}`);
}
const captured = manifest?.files ? Object.keys(manifest.files).sort() : [];
for (const rel of captured) {
  if (/\.(js|css)$/i.test(rel)) captureByPretty.set(prettyNameOf(rel), rel);
}

// ── split-spec.json ─────────────────────────────────────────────────────
const specPath = path.join(proj, "split-spec.json");
if (!fs.existsSync(specPath)) problem("split-spec.json missing at repo root");
let spec = null;
try {
  spec = specPath && JSON.parse(fs.readFileSync(specPath, "utf8"));
} catch (e) {
  problem(`split-spec.json does not parse: ${e.message}`);
}
const sections = Array.isArray(spec?.sections) ? spec.sections : [];
if (spec && !Array.isArray(spec?.sections)) problem("split-spec.json has no sections array");
if (!String(spec?.note ?? "").trim()) problem("split-spec.json has no note (derivation record)");
if (!spec?.renderOptions || typeof spec.renderOptions !== "object")
  problem("split-spec.json records no renderOptions (prettier options for re-derivation)");
if (!Array.isArray(spec?.notRendered))
  problem("split-spec.json records no notRendered array (non-code payload blocks)");
if (spec?.defaultFile) {
  const df = path.join(srcDir, path.basename(String(spec.defaultFile)));
  if (!fs.existsSync(df)) problem(`split-spec defaultFile "${spec.defaultFile}" does not exist`);
}
if (!spec?.rename || typeof spec.rename !== "object") problem("split-spec.json records no rename block");
else if (spec.rename.map !== "rename-map.json") problem(`split-spec rename.map is "${spec.rename.map}", expected "rename-map.json"`);

// ── rename-map.json (the PLAN §5 campaign record this gate re-proves) ────
const renameMapPath = path.join(proj, "rename-map.json");
let renameMap = { files: {}, scoped: {} };
const renameSlices = new Set();
let flatRecorded = 0,
  scopedRecorded = 0;
if (fs.existsSync(renameMapPath)) {
  try {
    const rm = JSON.parse(fs.readFileSync(renameMapPath, "utf8"));
    renameMap = { files: rm.files || {}, scoped: rm.scoped || {}, note: rm.note || "" };
    if (!String(renameMap.note).trim()) problem("rename-map.json has no note (recovery record)");
    for (const [f, map] of Object.entries(renameMap.files)) {
      renameSlices.add(f);
      for (const [name, target] of Object.entries(map)) {
        flatRecorded++;
        if (target === name) problem(`rename-map.json ${f}: "${name}" maps to itself`);
        if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${f}: "${name}" → "${target}" is not an identifier`);
      }
    }
    for (const [f, map] of Object.entries(renameMap.scoped)) {
      renameSlices.add(f);
      for (const [name, hits] of Object.entries(map))
        for (const [i, target] of hits) {
          scopedRecorded++;
          if (target === name) problem(`rename-map.json ${f}: "${name}" maps to itself at ${i}`);
          if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${f}: "${name}" → "${target}" is not an identifier`);
        }
    }
  } catch (e) {
    problem(`rename-map.json does not parse: ${e.message}`);
  }
}
const recordFor = (file) => {
  const files = renameMap.files[file];
  const scoped = renameMap.scoped[file];
  return files || scoped ? { files, scoped } : null;
};

const seen = new Set();
const rangedFiles = new Set();
const indexOnlyFiles = new Set();
for (const s of sections) {
  if (!s.file) {
    problem("split-spec section without a file");
    continue;
  }
  if (seen.has(s.file)) problem(`split-spec lists ${s.file} twice`);
  seen.add(s.file);
  const isWhole = s.wholeFile === true;
  const isSkipped = s.skipped === true;
  if (isWhole && isSkipped) problem(`section ${s.file}: both wholeFile and skipped`);
  if (typeof s.startLine !== "number" || typeof s.endLine !== "number")
    problem(`section ${s.file}: no startLine/endLine range recorded`);
  if (typeof s.sourceFile !== "string") problem(`section ${s.file}: no sourceFile provenance recorded`);
  if (isWhole || isSkipped) indexOnlyFiles.add(s.file);
  else rangedFiles.add(s.file);
}
if (!rangedFiles.size) problem("no ranged src slices in split-spec.json (no reversed layer)");

const onDisk = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter((f) => f.endsWith(".js")).sort()
  : [];
if (!onDisk.length) problem("src/ missing or empty (no reversed layer)");
for (const f of onDisk) if (!rangedFiles.has(f)) problem(`src/${f} exists but is not a ranged slice in split-spec.json`);
for (const f of rangedFiles) if (!onDisk.includes(f)) problem(`split-spec lists ${f} but it is not on disk`);
for (const f of indexOnlyFiles)
  if (onDisk.includes(f)) problem(`index-only section ${f} must not have a src file on disk (wholeFile/skipped)`);

// every rename-map.json record must be a ranged slice, on disk
for (const f of renameSlices) {
  if (!rangedFiles.has(f)) problem(`rename-map.json records ${f} but it is not a ranged slice in split-spec.json`);
  else if (!onDisk.includes(f)) problem(`rename-map.json records ${f} but it is not on disk`);
}

// ── ranges: existence, bounds, tiling ───────────────────────────────────
const bySource = new Map();
for (const s of sections) {
  if (!s.file || typeof s.sourceFile !== "string") continue;
  const src = path.join(proj, s.sourceFile);
  if (!fs.existsSync(src)) {
    problem(`section ${s.file}: sourceFile missing: ${s.sourceFile}`);
    continue;
  }
  if (!/\.pretty\.(js|css)$/i.test(s.sourceFile)) {
    problem(`section ${s.file}: sourceFile is not a readable pretty: ${s.sourceFile}`);
    continue;
  }
  const srcLines = getLines(src);
  const A = s.startLine,
    B = s.endLine;
  if (!Number.isInteger(A) || !Number.isInteger(B) || A < 1 || B < A || B > srcLines.length) {
    problem(`section ${s.file}: bad range ${A}-${B} vs ${s.sourceFile} (${srcLines.length} lines)`);
    continue;
  }
  if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
  bySource.get(s.sourceFile).push({ s, A, B });
}
let tiledOK = 0;
for (const [sourceFile, list] of bySource) {
  let ok = true;
  list.sort((x, y) => x.A - y.A);
  const srcLines = getLines(path.join(proj, sourceFile));
  if (list[0].A !== 1) {
    problem(`${sourceFile}: first section starts at line ${list[0].A}, not 1`);
    ok = false;
  }
  for (let k = 1; k < list.length; k++) {
    if (list[k].A !== list[k - 1].B + 1) {
      problem(
        `${sourceFile}: ranges not contiguous at ${list[k].s.file} (starts ${list[k].A}, previous ends ${list[k - 1].B})`,
      );
      ok = false;
    }
  }
  if (list[list.length - 1].B !== srcLines.length) {
    problem(`${sourceFile}: last section ends at ${list[list.length - 1].B}, not ${srcLines.length}`);
    ok = false;
  }
  if (ok) tiledOK++;
}

// ── byte-exact round-trip through the rename layer + header provenance ──
let roundOK = 0,
  ranged = 0,
  renamedSlices = 0;
for (const [, list] of bySource) {
  for (const { s, A, B } of list) {
    if (s.wholeFile === true || s.skipped === true) continue;
    ranged++;
    const srcAbs = path.join(srcDir, path.basename(String(s.file)));
    if (!fs.existsSync(srcAbs)) continue; // already reported
    const text = fs.readFileSync(srcAbs, "utf8");
    const nl1 = text.indexOf("\n");
    const nl2 = nl1 >= 0 ? text.indexOf("\n", nl1 + 1) : -1;
    if (nl2 < 0) {
      problem(`src/${s.file}: missing 2-line header`);
      continue;
    }
    const header1 = text.slice(0, nl1);
    const header2 = text.slice(nl1 + 1, nl2);
    const nn = path.basename(String(s.file)).match(/-(\d+)\.js$/)?.[1];
    if (!nn) problem(`src/${s.file}: file name carries no -NN slice number`);
    else if (!new RegExp(`^// .+ ${nn} — .+$`).test(header1))
      problem(`src/${s.file}: header line 1 does not match "// <tag> ${nn} — <marker>": ${header1}`);
    const want2 = `// Lines ${A}-${B} of ${s.sourceFile} (statement-aligned).`;
    if (header2 !== want2) problem(`src/${s.file}: header line 2 is not the recorded range: ${header2}`);
    const body = text.slice(nl2 + 1);
    const srcLines = getLines(path.join(proj, s.sourceFile));
    const raw = srcLines.slice(A - 1, B).join("\n") + "\n";
    const record = recordFor(s.file);
    let expected = raw;
    if (record) {
      renamedSlices++;
      try {
        expected = applyRecordedMap(raw, record);
      } catch (e) {
        problem(`src/${s.file}: recorded rename map does not apply: ${e.message}`);
        continue;
      }
      if (body === raw) problem(`src/${s.file}: rename-map.json records a map but the body is unchanged (record not applied)`);
    } else if (body !== raw) {
      problem(`src/${s.file}: body differs from its readable range but rename-map.json records no map (unrecorded rename)`);
    }
    if (body !== expected)
      problem(`src/${s.file}: body is not a byte-exact round-trip of ${s.sourceFile} lines ${A}-${B} (through the recorded rename map)`);
    else roundOK++;
  }
}

// ── rename-map honesty: indices address the recorded identifier tokens ──
let scopedOK = 0;
for (const [file, scoped] of Object.entries(renameMap.scoped)) {
  const sec = sections.find((s) => s.file === file);
  if (!sec || typeof sec.startLine !== "number" || typeof sec.sourceFile !== "string") continue;
  const lines = getLines(path.join(proj, sec.sourceFile));
  const range = lines.slice(sec.startLine - 1, sec.endLine).join("\n") + "\n";
  const toks = tokens(range);
  const foreign = foreignNameIndices(toks);
  for (const [name, hits] of Object.entries(scoped)) {
    for (const [i, target] of hits) {
      const t = toks[i];
      if (!t || t.t !== "id" || t.v !== name) {
        problem(`rename-map.json ${file}: index ${i} is not the identifier "${name}" (${t ? t.t + "(" + JSON.stringify(t.v.slice(0, 20)) + ")" : "none"})`);
        continue;
      }
      if (foreign.has(i)) problem(`rename-map.json ${file}: index ${i} ("${name}") is an import/export specifier (foreign) position`);
      if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${file}: "${name}" → "${target}" is not an identifier`);
    }
  }
  scopedOK++;
}
let flatOK = 0;
for (const [file, map] of Object.entries(renameMap.files)) {
  const sec = sections.find((s) => s.file === file);
  if (!sec || typeof sec.startLine !== "number" || typeof sec.sourceFile !== "string") continue;
  const lines = getLines(path.join(proj, sec.sourceFile));
  const range = lines.slice(sec.startLine - 1, sec.endLine).join("\n");
  const ids = new Set(tokens(range).filter((t) => t.t === "id").map((t) => t.v));
  for (const name of Object.keys(map)) if (!ids.has(name)) problem(`rename-map.json ${file}: word-boundary key "${name}" does not occur in the slice range`);
  flatOK++;
}

// ── skipped sections: textual re-verification ───────────────────────────
let skippedOK = 0,
  skippedTotal = 0;
for (const s of sections) {
  if (s.skipped !== true || typeof s.sourceFile !== "string") continue;
  skippedTotal++;
  const src = path.join(proj, s.sourceFile);
  if (!fs.existsSync(src)) {
    problem(`skipped section ${s.file}: sourceFile missing: ${s.sourceFile}`);
    continue;
  }
  const lines = getLines(src);
  if (!Number.isInteger(s.startLine) || !Number.isInteger(s.endLine) || s.startLine < 1 || s.endLine > lines.length)
    continue;
  const first = lines[s.startLine - 1],
    last = lines[s.endLine - 1];
  if (typeof s.firstLine !== "string" || typeof s.lastLine !== "string")
    problem(`skipped section ${s.file}: no firstLine/lastLine recorded`);
  else if (first !== s.firstLine || last !== s.lastLine)
    problem(`skipped section ${s.file}: range text does not match the recorded first/last lines`);
  else skippedOK++;
}

// ── every src + pretty parses standalone ────────────────────────────────
let checkOK = 0;
for (const f of onDisk) if (parseCheck(path.join(srcDir, f), `src/${f}`)) checkOK++;

const prettyFiles = [];
const walkPretty = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkPretty(p);
    else if (/\.pretty\.(js|css|json)$/i.test(e.name)) prettyFiles.push(p);
  }
};
walkPretty(readableDir);
if (!prettyFiles.length) problem("readable/ has no *.pretty.js|css (derived layer missing)");
let prettyOK = 0,
  prettyParsed = 0;
for (const abs of prettyFiles) {
  const rel = path.relative(proj, abs).split(path.sep).join("/");
  if (!/\.pretty\.js$/i.test(rel)) continue; // CSS/JSON pretties are indexed, not ESM-parsed
  prettyParsed++;
  if (parseCheck(abs, rel)) prettyOK++;
}

// ── inline block twins + map (deliverable rule) ─────────────────────────
// Inline twins have no capture .js/.css of their own — they are validated here,
// byte-for-byte against their capture block, and exempted from the pretty→capture
// mapping loop below.
const inlineMapPath = path.join(readableDir, "index-inline-map.json");
let inlineMap = null;
if (fs.existsSync(inlineMapPath)) {
  try {
    inlineMap = JSON.parse(fs.readFileSync(inlineMapPath, "utf8"));
  } catch (e) {
    problem(`readable/index-inline-map.json does not parse: ${e.message}`);
  }
}
const inlineTwinRels = new Set();
let inlineBlocks = 0;
for (const capRel of Object.keys(manifest?.files ?? {})) {
  if (!/\.html?$/i.test(capRel)) continue;
  const buf = fs.readFileSync(path.join(proj, capRel));
  const blocks = scanBlocks(buf);
  inlineBlocks += blocks.filter((b) => true).length;
  const entryTag = capRel.replace(/\.html$/i, "").split("/").join("__");
  for (const b of blocks) {
    const twinExt = b.kind === "style" ? "css" : b.kind === "importmap" ? "json" : "js";
    const twin = `readable/${entryTag}-inline-${b.block}.pretty.${twinExt}`;
    inlineTwinRels.add(twin);
    if (!fs.existsSync(path.join(proj, twin))) problem(`${capRel}: inline ${b.kind} #${b.block} has no twin ${twin}`);
    else {
      const twinText = fs.readFileSync(path.join(proj, twin), "utf8");
      const content = buf.subarray(b.contentStart, b.contentEnd);
      if (twinText === content.toString("utf8"))
        problem(`${twin}: byte-identical to its capture block (prettier did not run?)`);
      if (twinExt === "json") {
        try {
          JSON.parse(twinText);
        } catch (e) {
          problem(`${twin}: does not parse as JSON: ${e.message}`);
        }
      }
    }
    const rec = inlineMap?.blocks?.find((x) => x.file === twin && x.source === capRel);
    if (!rec) {
      problem(`${capRel}: inline ${b.kind} #${b.block} is missing from readable/index-inline-map.json`);
      continue;
    }
    if (rec.byteStart !== b.contentStart || rec.byteEnd !== b.contentEnd || rec.sha256 !== b.sha256)
      problem(`${twin}: recorded inline byte range/sha256 does not match the capture bytes`);
  }
}
if (inlineMap && inlineBlocks === 0) problem("readable/index-inline-map.json exists but the capture has no inline blocks");

// ── every pretty referenced + provably derived + layer completeness ─────
const referenced = new Set();
for (const [sourceFile] of bySource) referenced.add(sourceFile.split(path.sep).join("/"));
let derivedOK = 0;
for (const abs of prettyFiles) {
  const rel = path.relative(proj, abs).split(path.sep).join("/");
  if (!referenced.has(rel))
    problem(`readable/${path.basename(rel)} exists but is not referenced by split-spec.json`);
  if (inlineTwinRels.has(rel)) {
    derivedOK++; // inline twins are byte-compared against their capture block above
    continue;
  }
  const capRel = captureByPretty.get(rel);
  const capAbs = capRel ? path.join(proj, capRel) : null;
  if (!capAbs || !fs.existsSync(capAbs)) {
    problem(`${rel}: capture source missing (no captured .js/.css maps to this pretty)`);
    continue;
  }
  if (manifest && !manifest.files?.[capRel])
    problem(`${rel}: capture source ${capRel} is not recorded in .upstream/manifest.json`);
  if (fs.readFileSync(capAbs).equals(fs.readFileSync(abs)))
    problem(`${rel}: byte-identical to its capture source (prettier did not run?)`);
  else derivedOK++;
}
if (manifest) {
  for (const capRel of Object.keys(manifest.files)) {
    if (!/\.(js|css)$/i.test(capRel)) continue;
    if (!prettyFiles.some((abs) => captureByPretty.get(path.relative(proj, abs).split(path.sep).join("/")) === capRel))
      problem(`captured ${capRel} has no readable twin referenced by the spec`);
  }
}

// ── notRendered completeness: every captured non-code payload is recorded ─
{
  const recs = new Map((spec?.notRendered ?? []).map((r) => [r.capture, r]));
  for (const rel of captured) {
    if (/\.(html?|js|css)$/i.test(rel)) continue;
    const rec = recs.get(rel);
    if (!rec) {
      problem(`captured payload ${rel} has no notRendered record in split-spec.json`);
      continue;
    }
    if (rec.sha256 !== manifest?.files?.[rel]?.sha256) problem(`notRendered ${rel}: sha256 does not match the manifest`);
  }
}

// ── vendor rule: wholeFile sections carry the recorded shape ────────────
const VENDOR_GUARDS = [
  ["index-inline-1-loader-machinery.js", /const __defs/, /function __req/],
  ["index-inline-1-three-vendor.js", /const REVISION = ['"]187dev['"]/, /class UnrealBloomPass/],
];
for (const [file, reA, reB] of VENDOR_GUARDS) {
  const sec = sections.find((s) => s.file === file);
  if (!sec) continue; // absence is fine; presence must hold its guard
  if (sec.wholeFile !== true) {
    problem(`vendor section ${file} is not wholeFile`);
    continue;
  }
  const text = getLines(path.join(proj, sec.sourceFile))
    .slice(sec.startLine - 1, sec.endLine)
    .join("\n");
  if (!reA.test(text) || !reB.test(text)) problem(`vendor section ${file}: content guard failed — readable changed shape`);
}

// ── shape guard: the big inline-script twin carries the game's fingerprints ─
{
  const twinRel = "readable/index-inline-1.pretty.js";
  if (fs.existsSync(path.join(proj, twinRel))) {
    const text = fs.readFileSync(path.join(proj, twinRel), "utf8");
    for (const [re, what] of [
      [/__defs\[/, "the __defs module registry"],
      [/__req\(/, "the __req loader calls"],
      [/const THREE = __req\(["']three\.module\.js["']\)/, "the three.js import site"],
      [/new THREE\.WebGLRenderer/, "WebGLRenderer"],
      [/applyVehicle/, "the vehicle controller"],
      [/requestAnimationFrame\(frame\)/, "the frame loop"],
      [/composer\.render\(\)/, "the EffectComposer render"],
      [/ROADSTER/, "the game's own branding"],
    ])
      if (!re.test(text)) problem(`${twinRel}: shape guard failed (${what}) — the inline script twin changed shape`);
  }
}

// ── the hard rule: src/ import resolution against the capture ───────────
let checkedImports = 0,
  resolvedImports = 0,
  whitelisted = 0;
for (const s of sections) {
  if (s.wholeFile === true || s.skipped === true) continue;
  if (!s.file || typeof s.sourceFile !== "string") continue;
  const srcAbs = path.join(srcDir, path.basename(String(s.file)));
  if (!fs.existsSync(srcAbs)) continue;
  // slices come from inline blocks / root-level captured files: base dir is the capture root
  const baseDir = "";
  const code = fs.readFileSync(srcAbs, "utf8");
  for (const { spec: specifier, kind, clause } of extractSpecifiers(code)) {
    checkedImports++;
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const target = path.posix.normalize(path.posix.join(baseDir, specifier));
      if (!fs.existsSync(path.join(proj, target))) {
        problem(`src/${s.file}: unresolvable ${kind} import "${specifier}" (capture carries no ${target})`);
        continue;
      }
      resolvedImports++;
      const targetCode = fs.readFileSync(path.join(proj, target), "utf8");
      const targetExports = exportsOf(targetCode);
      for (const n of namedImports(clause)) {
        if (n === "*" || targetExports.has(n)) continue;
        problem(`src/${s.file}: imports { ${n} } from "${specifier}" but ${target} does not export it`);
      }
      continue;
    }
    if (specifier.startsWith("node:") || specifier.startsWith("vite/") || specifier.startsWith("/")) {
      whitelisted++;
      continue;
    }
    problem(`src/${s.file}: unresolvable ${kind} import "${specifier}" — bare/URL specifier not whitelisted`);
  }
}

// ── derived layers must never enter the capture sums ────────────────────
if (manifest) {
  for (const rel of Object.keys(manifest.files)) {
    const norm = rel.split(path.sep).join("/");
    if (/^(readable|src|legacy)\//.test(norm) || ["split-spec.json", "rename-map.json", "index-inline-map.json", "_mirror-report.json"].includes(norm))
      problem(`derived layer leaked into the capture manifest: ${rel}`);
  }
}

// ── best-effort: re-render every pretty with the pinned prettier 3.9.6 ─
const prettierCandidates = [
  process.env.PRETTIER_MJS,
  path.join(proj, "node_modules", "prettier", "index.mjs"),
  "D:/repos/mirrors/metropolygonia/node_modules/prettier/index.mjs",
].filter(Boolean);
function loadPinnedPrettier() {
  for (const c of prettierCandidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(c), "package.json"), "utf8"));
      if (pkg.version !== PINNED) continue;
      return c;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

(async () => {
  let renderNote = `prettier ${PINNED} not importable — renderOptions recorded, re-render check skipped`;
  const prettierPath = loadPinnedPrettier();
  if (prettierPath) {
    const prettier = (await import(pathToFileURL(prettierPath).href)).default;
    // format-to-fixed-point: derive asserts single-pass idempotency, so the
    // fixed point equals the recorded single pass; the loop only guards
    // against a prettier build that needs an extra pass.
    const renderFix = async (text, parser) => {
      const p1 = await prettier.format(text, { parser });
      const p2 = await prettier.format(p1, { parser });
      if (p2 === p1) return p1;
      const p3 = await prettier.format(p2, { parser });
      return p3 === p2 ? p2 : null;
    };
    let renderOK = 0;
    let renderTotal = 0;
    // inline twins re-render from their capture byte range (all pretties here)
    for (const rec of inlineMap?.blocks ?? []) {
      const capAbs = path.join(proj, rec.source);
      if (!fs.existsSync(capAbs)) continue; // already reported
      const parser = rec.kind === "importmap" ? "json" : rec.kind === "style" ? "css" : "babel";
      const src = fs.readFileSync(capAbs).subarray(rec.byteStart, rec.byteEnd).toString("utf8");
      const got = await renderFix(src, parser);
      const want = fs.readFileSync(path.join(proj, rec.file), "utf8");
      renderTotal++;
      if (got === want) renderOK++;
      else problem(`${rec.file}: does not re-render byte-exact under pinned prettier ${PINNED} ({parser:${parser}}, fixed-point method)`);
    }
    // any other pretty (captured sw.js) re-renders from its capture source
    for (const abs of prettyFiles) {
      const rel = path.relative(proj, abs).split(path.sep).join("/");
      if (inlineTwinRels.has(rel)) continue;
      const capRel = captureByPretty.get(rel);
      if (!capRel || !fs.existsSync(path.join(proj, capRel))) {
        renderTotal++;
        problem(`${rel}: pretty with no capture source mapping — cannot re-render`);
        continue;
      }
      const parser = /\.pretty\.css$/i.test(rel) ? "css" : "babel";
      const got = await renderFix(fs.readFileSync(path.join(proj, capRel), "utf8"), parser);
      const want = fs.readFileSync(abs, "utf8");
      renderTotal++;
      if (got === want) renderOK++;
      else problem(`${rel}: does not re-render byte-exact under pinned prettier ${PINNED} ({parser:${parser}}, fixed-point method)`);
    }
    renderNote = `${renderOK}/${renderTotal} pretties re-render byte-exact under pinned prettier ${PINNED} (format-to-fixed-point)`;
  }

  if (problems.length) {
    console.error(`AUDIT FAIL — ${problems.length} problem(s)`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(
    `AUDIT PASS — ${sections.length} spec sections (${roundOK}/${ranged} src↔pretty round-trips byte-exact through the recorded rename map, ` +
      `${renamedSlices} renamed slice(s), ${tiledOK}/${bySource.size} pretty sources tiled contiguously, ` +
      `${skippedOK}/${skippedTotal} skipped non-standalone sections re-verified textually, ` +
      `${checkOK}/${onDisk.length} src slices + ${prettyOK}/${prettyParsed} readable/*.pretty.js parse standalone (node --input-type=module --check -), ` +
      `${derivedOK}/${prettyFiles.length} pretties provably distinct from their capture source, ` +
      `${indexOnlyFiles.size} index-only wholeFile/skipped sections carry no src file, ` +
      `rename map: ${flatRecorded} word-boundary + ${scopedRecorded} indexed record(s) over ${renameSlices.size} slice(s) (${flatOK} flat slice(s) + ${scopedOK} scoped slice(s) token-validated, no foreign position), ` +
      `${inlineBlocks} inline content block(s) with twins + index-inline-map.json, ` +
      `${spec?.notRendered?.length ?? 0} notRendered payload records (all captured payloads covered), ` +
      `${resolvedImports}/${checkedImports} imports resolve inside the capture (${whitelisted} whitelisted machinery), ` +
      `${renderNote}, vendor + inline-script shape guards held, capture manifest free of derived layers)`,
  );
})();
