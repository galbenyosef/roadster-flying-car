// check-chunk.mjs — chunk-level gate: did renaming any slice break a SIBLING
// slice (the cross-slice resolve proof, PLAN §5)? ROADSTER: THE FLYING CAR —
// copied + adapted from the fleet precedent (call-of-roque / kals-valley /
// ziggy-card / stillwater / pelota / taipei-rush-tokyo / kowloon /
// a-place-beyond). Nothing is read from another mirror at runtime.
//
//   node tools/check-chunk.mjs --all
//   node tools/check-chunk.mjs <sourceFile> [<sourceFile> …]   (readable/… path)
//
// Every slice cut from one prettified chunk shares that chunk's top-level scope,
// so a name declared in one slice can be called from another. Renaming that
// declaration to say what it holds is fine -- unless the caller is left behind,
// which leaves a call to a binding nothing declares. Nothing inside a single
// slice can see that: the slice's own references all still resolve, its token
// stream still matches its source range, and every per-slice gate passes.
//
// This gate substitutes every committed slice body into its source range of the
// WHOLE prettified chunk, re-parses the resulting program and compares the
// unbound-name set and the resolved-binding trace against the untouched chunk.
// A name that was bound before and is unbound after is a declaration renamed
// without its callers -- or vice versa.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyBindingMap, sourceResolver, stripHeader } from "./engine/rename-layer.mjs";
import { bindingDrift, refDrift } from "./refcheck.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const spec = JSON.parse(fs.readFileSync(path.join(proj, "split-spec.json"), "utf8"));
const prettyFor = sourceResolver(proj, spec);

const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const all = process.argv.includes("--all");
if (!all && !targets.length) {
  console.error("usage: node tools/check-chunk.mjs --all | <sourceFile> […]");
  process.exit(2);
}

// every ranged + skipped section (the reconstruction must cover the whole
// chunk: skipped export tables reference renamed bindings), grouped by chunk
const bySource = new Map();
for (const s of spec.sections) {
  if (s.wholeFile || typeof s.startLine !== "number") continue;
  if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
  bySource.get(s.sourceFile).push(s);
}

let failed = 0;
let chunks = 0;
let substitutedTotal = 0;
for (const [sourceFile, sectionsRaw] of [...bySource].sort()) {
  if (!all && !targets.includes(sourceFile)) continue;
  chunks++;
  const sections = [...sectionsRaw].sort((a, b) => a.startLine - b.startLine);
  const lines = prettyFor(sections[0]);
  const fullText = lines.join("\n");
  const prefix = new Array(lines.length + 1).fill(0);
  for (let i = 0; i < lines.length; i++) prefix[i + 1] = prefix[i] + lines[i].length + 1;
  const offsetOfLine = (n) => prefix[n - 1];

  let cursor = 0;
  let out = "";
  let substituted = 0;
  const bindingMap = spec.sources.find((s) => s.sourceFile === sourceFile)?.renameBindings || {};
  for (const sec of sections) {
    const start = offsetOfLine(sec.startLine);
    const end = start + (prefix[sec.endLine] - prefix[sec.startLine - 1]) - 1;
    let piece = fullText.slice(start, end);
    if (sec.skipped) {
      // index-only export table: its local-side names reference the renamed
      // top-level bindings, so the chunk's recorded binding map applies here
      piece = applyBindingMap(piece, bindingMap);
    } else {
      const p = path.join(proj, "src", sec.file);
      if (fs.existsSync(p)) {
        const body = stripHeader(fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")).replace(/[\n\s]+$/, "");
        piece = body + "\n";
        substituted++;
      }
    }
    out += fullText.slice(cursor, start) + piece;
    cursor = end;
  }
  out += fullText.slice(cursor);
  substitutedTotal += substituted;

  const drift = await refDrift(out, fullText);
  const rebound = await bindingDrift(out, fullText);
  const broken = drift ? [...new Set([...drift.extra, ...drift.missing])] : [];

  const ranged = sections.filter((s) => !s.skipped).length;
  console.log(`${sourceFile}: ${ranged} ranged slice(s) (${sections.length} section(s) in the reconstruction), ${substituted} substituted`);
  console.log(`  cross-slice calls resolve: ${broken.length === 0 ? "YES" : "NO"}`);
  if (broken.length) {
    console.log(`    still called / no longer bound (${broken.length}): ${broken.slice(0, 30).join(", ")}`);
    console.log("    a declaration was renamed but its callers were not (or vice versa).");
  }
  if (rebound) console.log(`    binding drift at reference ${rebound.at} (${rebound.reason})`);
  if (broken.length || rebound) failed++;
}
console.log(`check-chunk: ${chunks} chunk(s), ${substitutedTotal} slice body(ies) substituted — ${failed === 0 ? "all cross-slice calls resolve" : failed + " chunk(s) FAILED"}`);
process.exit(failed ? 1 : 0);
