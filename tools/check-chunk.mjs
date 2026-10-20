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
import { applyBindingMap, sourceResolver, stripHeader, tokens } from "./engine/rename-layer.mjs";
import { bindingDrift, refDrift } from "./refcheck.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const spec = JSON.parse(fs.readFileSync(path.join(proj, "split-spec.json"), "utf8"));
const prettyFor = sourceResolver(proj, spec);

/**
 * The PUBLIC names a chunk exports: `export { a, b as c }` -> a and c.
 *
 * The binding-trace comparison below cannot see a lost public name: a
 * shorthand export that was renamed is still a BOUND name, so the trace
 * matches and the gate stays green while every importer of that name breaks.
 * lagoon-tree-village proved it — `i` became LAGOON_LOBES and `a f n p t`
 * became angleToDir/polylinePath/RAD_TO_DEG/resampleCatmullRom/DEG_TO_RAD,
 * with check-chunk reporting "all cross-slice calls resolve". The chunk's
 * public API is part of its contract, so it is compared directly.
 */
function exportedNames(text) {
  const ts = tokens(text);
  const names = new Set();
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.t !== "id" || t.v !== "export") continue;
    const n1 = ts[i + 1];
    if (!n1) continue;
    if (n1.t === "pun" && n1.v === "{") {
      let end = i + 2;
      while (end < ts.length && !(ts[end].t === "pun" && ts[end].v === "}")) end++;
      let group = [];
      const flush = () => {
        if (!group.length) return;
        // The alias KEYWORD is found BY POSITION, not by value: a chunk can
        // have a local literally named `as`, and then the group is
        // `export { as as o }` — ids = [as, as, o] — where a value-based
        // lookup finds the LOCAL, not the keyword. The engine's own
        // foreignNameIndices is position-based; this must agree with it.
        //   one id            -> shorthand: the local IS the public name
        //   ids[1] === "as"   -> aliased: the public name is ids[2]
        //   otherwise         -> fall back to the last id
        const ids = group.filter((k) => ts[k].t === "id");
        if (ids.length === 1) names.add(ts[ids[0]].v);
        else if (ids.length >= 3 && ts[ids[1]].v === "as") names.add(ts[ids[2]].v);
        else if (ids.length >= 2) names.add(ts[ids.length - 1].v);
        group = [];
      };
      for (let k = i + 2; k < end; k++) {
        if (ts[k].t === "pun" && ts[k].v === ",") flush();
        else group.push(k);
      }
      flush();
      i = end;
    } else if (n1.t === "id" && n1.v === "default") {
      names.add("default");
    } else if (n1.t === "id" && n1.v === "async" && ts[i + 2]?.t === "id" && ts[i + 2].v === "function") {
      // `export async function foo(…) { … }` — the `async` sits between
      // `export` and `function`, so the name is one token further on
      const name = ts[i + 3];
      if (name && name.t === "id") names.add(name.v);
    } else if (n1.t === "id" && n1.v === "*" && ts[i + 2]?.t === "id" && ts[i + 2].v === "as") {
      // `export * as ns from "./x.js"` — the namespace object is the public name
      const name = ts[i + 3];
      if (name && name.t === "id") names.add(name.v);
    } else if (n1.t === "id" && (n1.v === "class" || n1.v === "function")) {
      // `export class Actor { … }` / `export function foo(…) { … }` — an
      // INLINE export is a public name too, and a chunk can use those
      // instead of an export table.
      const name = ts[i + 2];
      if (name && name.t === "id") names.add(name.v);
    } else if (n1.t === "id" && (n1.v === "const" || n1.v === "let" || n1.v === "var")) {
      // `export const a = 1, b = 2` — every declarator is exported. The
      // declarator may have NO INITIALISER (`export let arrowBase;`), so the
      // name is recognised by what FOLLOWS it: `=`, `,`, `;`, `)`, `}`, or
      // the next statement's first token when the statement ended without a
      // semicolon.
      for (let k = i + 2; k < ts.length && k < i + 400; k++) {
        const tk = ts[k];
        if (tk.t === "id") {
          const nx = ts[k + 1];
          const isDeclarator =
            nx &&
            ((nx.t === "pun" && (nx.v === "=" || nx.v === "," || nx.v === ";" || nx.v === ")" || nx.v === "}")) ||
              nx.t === "id");
          if (isDeclarator && tk.v !== "of" && tk.v !== "in") names.add(tk.v);
        }
        if (tk.t === "pun" && tk.v === ";") break;
        if (tk.t === "pun" && tk.v === "}" && ts[k - 1]?.t === "pun" && ts[k - 1].v === "{") break;
      }
    }
  }
  return names;
}

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

  // the chunk's public API: a rename must not move an exported name
  const exportedBefore = exportedNames(fullText);
  const exportedAfter = exportedNames(out);
  const lostExports = [...exportedBefore].filter((n) => !exportedAfter.has(n));
  const gainedExports = [...exportedAfter].filter((n) => !exportedBefore.has(n));

  const ranged = sections.filter((s) => !s.skipped).length;
  console.log(`${sourceFile}: ${ranged} ranged slice(s) (${sections.length} section(s) in the reconstruction), ${substituted} substituted`);
  console.log(`  cross-slice calls resolve: ${broken.length === 0 ? "YES" : "NO"}`);
  if (broken.length) {
    console.log(`    still called / no longer bound (${broken.length}): ${broken.slice(0, 30).join(", ")}`);
    console.log("    a declaration was renamed but its callers were not (or vice versa).");
  }
  console.log(
    `  public export names preserved: ${lostExports.length === 0 ? "YES" : "NO"}` +
      ` (${exportedBefore.size} exported, ${gainedExports.length} added)`,
  );
  if (lostExports.length) {
    console.log(`    lost (${lostExports.length}): ${lostExports.slice(0, 30).join(", ")}`);
    console.log("    a renamed binding was re-exported under its own name, so the chunk's public API moved.");
  }
  if (rebound) console.log(`    binding drift at reference ${rebound.at} (${rebound.reason})`);
  if (broken.length || rebound || lostExports.length) failed++;
}
console.log(`check-chunk: ${chunks} chunk(s), ${substitutedTotal} slice body(ies) substituted — ${failed === 0 ? "all cross-slice calls resolve" : failed + " chunk(s) FAILED"}`);
process.exit(failed ? 1 : 0);
