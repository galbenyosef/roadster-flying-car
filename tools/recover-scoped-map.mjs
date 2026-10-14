// recover-scoped-map.mjs — record the semantic rename map for every slice, by
// aligning its readable range against the committed slice token by token
// (PLAN §5; the campaign gate's record). ROADSTER: THE FLYING CAR — copied +
// adapted from the fleet precedent (call-of-roque / kals-valley / ziggy-card /
// stillwater / pelota / taipei-rush-tokyo / kowloon / a-place-beyond; the
// alignment runs against the RAW committed body — the zombie-game fix).
// Nothing is read from another mirror at runtime.
//
// Two sections are written into rename-map.json:
//
//   files[sliceName] = { name: target, … }
//       A word-boundary rename, safe ONLY when the name means the same thing
//       everywhere it appears in the slice and is never a property or key.
//
//   scoped[sliceName][name] = [[tokenIndex, target], …]
//       Everything else, addressed by exact token index. A short name can be a
//       different binding in every function (`r` is a radius here, a result
//       there) and short names are also keys (`t.x`, `{x: .3}`), so neither
//       "one name, one target" nor a count of occurrences can be correct. An
//       index can.
//
// Safety rests on the alignment proof: the two token streams must be identical
// in every non-identifier position and the same length. If they are not, nothing
// is written -- an invented map would make a wrong slice look verified, which is
// worse than a loud failure.
//
// usage: node tools/recover-scoped-map.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recoverSlice, serializeMap, sourceResolver, stripHeader, rangeText } from "./engine/rename-layer.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const dry = process.argv.includes("--dry");

const spec = JSON.parse(fs.readFileSync(path.join(proj, "split-spec.json"), "utf8"));
const prettyFor = sourceResolver(proj, spec);

const files = {};
const scoped = {};
let slices = 0;
let renamed = 0;
let alignedTokens = 0;
const failures = [];

for (const sec of spec.sections) {
  if (sec.wholeFile === true || sec.skipped === true) continue;
  const srcAbs = path.join(proj, "src", sec.file);
  if (!fs.existsSync(srcAbs)) {
    failures.push(`${sec.file}: slice file missing`);
    continue;
  }
  const range = rangeText(prettyFor, sec);
  const raw = fs.readFileSync(srcAbs, "utf8").replace(/\r\n/g, "\n");
  // Align against the RAW committed body (header stripped): the tokenizer drops
  // real comments on both sides by construction, while a whole-line `//` that is
  // template/GLSL payload is one atomic literal run — stripping comment lines
  // here (stripCommentLines) can misclassify payload and corrupt that literal,
  // so recovery must see the same bytes tools/verify-rename.mjs compares.
  const body = stripHeader(raw).trimEnd();
  const rec = recoverSlice(range, body);
  slices++;
  if (!rec.ok) {
    failures.push(`${sec.file}: ${rec.why}`);
    continue;
  }
  alignedTokens += rec.tokens;
  if (Object.keys(rec.flat).length || Object.keys(rec.scoped).length) {
    renamed++;
    if (Object.keys(rec.flat).length) files[sec.file] = rec.flat;
    if (Object.keys(rec.scoped).length) scoped[sec.file] = rec.scoped;
  }
}

if (failures.length) {
  console.error(`recover: REFUSING — ${failures.length} slice(s) do not align:`);
  for (const f of failures.slice(0, 20)) console.error("  " + f);
  process.exit(1);
}

const flatNames = Object.values(files).reduce((n, m) => n + Object.keys(m).length, 0);
const scopedNames = Object.values(scoped).reduce((n, m) => n + Object.keys(m).length, 0);
const scopedOccurrences = Object.values(scoped).reduce(
  (n, m) => n + Object.values(m).reduce((k, hits) => k + hits.length, 0),
  0,
);
console.log(
  `recover: ${slices} slice(s) aligned (${alignedTokens.toLocaleString("en-US")} identifier/token positions), ` +
    `${renamed} renamed slice(s) — ${flatNames} word-boundary record(s), ` +
    `${scopedNames} indexed name(s) over ${scopedOccurrences} occurrence(s)`,
);

if (dry) {
  console.log("recover: --dry, nothing written");
  process.exit(0);
}
const out = serializeMap({ files, scoped });
fs.writeFileSync(path.join(proj, "rename-map.json"), JSON.stringify(out, null, 2) + "\n");
console.log("recover: wrote rename-map.json");
