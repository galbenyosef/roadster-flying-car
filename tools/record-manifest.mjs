// Rebuild (or re-check) .upstream/manifest.json for this mirror.
//
// The capture walk: everything the origin served, and nothing the mirror owns.
// The SKIP/NOT_CAPTURED sets are the canonical fleet ones (PLAN §1, proposals
// (g)/(u)/(t)(2), applied on the 2026-10-14 pass): derived layers (readable/,
// src/), the superseded-derived archive (legacy/ — proposal (o)), derivation
// records (split-spec.json, rename-map.json, readable/index-inline-map.json),
// local records (_mirror-report.json — present in this repo), this repo's
// docs/tools, and .upstream/ itself never enter the capture sums.
//
// This mirror's manifest is GEN-A (`{ generated, origin, files: {
// rel: { bytes, sha256 } } }`, the capture-time record) and is NEVER converted
// between generations (PLAN §1) — a re-cut keeps the schema and the recorded
// `generated`/`origin` stamps, only re-walking `files`.
//
// --check re-walks without writing and diffs the file set (and every hash)
// against the committed manifest — the gate that proves the SKIP sets keep the
// derived layers out even after the src/ rename campaign landed. A plain run
// re-cuts the manifest.
//
// usage: node tools/record-manifest.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const checkOnly = process.argv.includes("--check");

// Take the origin from update.mjs rather than hardcoding it, so the two tools
// cannot drift apart.
let origin = null;
try {
  const upd = fs.readFileSync(path.join(here, "update.mjs"), "utf8");
  origin = /ORIGIN\s*=\s*["'`](https?:\/\/[^"'`]+)["'`]/.exec(upd)?.[1] ?? null;
} catch { /* no update.mjs */ }

const SKIP = new Set([".git", ".upstream", "node_modules", "readable", "src", "legacy", "docs", "tools"]);
const NOT_CAPTURED = new Set([
  ".gitattributes",
  ".gitignore",
  "README.md",
  "split-spec.json",
  "rename-map.json",
  "index-inline-map.json",
  "_mirror-report.json",
]);

const files = {};
let bytes = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const rel = path.relative(proj, p).split(path.sep).join("/");
    if (NOT_CAPTURED.has(rel)) continue;
    const buf = fs.readFileSync(p);
    files[rel] = {
      sha256: crypto.createHash("sha256").update(buf).digest("hex"),
      bytes: buf.length,
    };
    bytes += buf.length;
  }
})(proj);

const livePath = path.join(proj, ".upstream", "manifest.json");
const prior = fs.existsSync(livePath) ? JSON.parse(fs.readFileSync(livePath, "utf8")) : null;

if (checkOnly) {
  if (!prior) {
    console.error("record-manifest --check: .upstream/manifest.json missing");
    process.exit(1);
  }
  const problems = [];
  if (origin && prior.origin !== origin) problems.push(`manifest origin ${prior.origin} != tools/update.mjs ORIGIN ${origin}`);
  const want = new Set(Object.keys(files));
  const have = new Set(Object.keys(prior.files ?? {}));
  for (const r of have) {
    if (/(^|\/)(readable|src|legacy|docs|tools)\//.test(r) || NOT_CAPTURED.has(r))
      problems.push(`derived/local path recorded in the manifest: ${r}`);
    if (!want.has(r)) problems.push(`recorded but no longer on disk (or newly SKIPped): ${r}`);
  }
  for (const r of want) if (!have.has(r)) problems.push(`on disk but not recorded: ${r}`);
  for (const r of want) {
    if (!have.has(r)) continue;
    const a = files[r];
    const b = prior.files[r];
    if (a.sha256 !== b.sha256 || a.bytes !== b.bytes) problems.push(`hash/size differs: ${r}`);
  }
  if (problems.length) {
    console.error(`record-manifest --check: FAIL — ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 20)) console.error("  " + p);
    process.exit(1);
  }
  console.log(`record-manifest --check: PASS — ${have.size} capture file(s) recorded, walk agrees byte-for-byte, no derived path leaked`);
  process.exit(0);
}

// Gen-A schema (PLAN §1: generations are never converted) — the walk refreshes
// `files` only; `generated` and `origin` keep the capture-time record.
const manifest = {
  generated: prior?.generated ?? new Date().toISOString(),
  origin: origin ?? prior?.origin ?? null,
  files,
};

fs.mkdirSync(path.join(proj, ".upstream"), { recursive: true });
fs.writeFileSync(livePath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`recorded ${Object.keys(files).length} files, ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`origin: ${origin ?? "(not found in tools/update.mjs)"} · generated: ${manifest.generated}`);
