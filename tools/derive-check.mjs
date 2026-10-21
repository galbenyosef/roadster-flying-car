/**
 * derive --check — prove the committed derived layer is current. WRITES NOTHING.
 *
 * WHY THIS TOOL EXISTS
 * This mirror's derive tool used to ignore its command line: it never read
 * `process.argv`, so `node tools/derive.mjs --check` was not a check at all —
 * it was a FULL, unconditional re-derivation that rewrote `readable/`, `src/`
 * and `split-spec.json` in place. On the mirrors whose derive does not re-apply
 * the recorded rename map, that also STRIPS the rename layer off `src/`: the
 * slices come back with the capture-side spellings, the files still parse, and
 * the damage looks legitimate. (It has already done real damage in this fleet.)
 *
 * WHAT IT DOES
 *   1. copies the mirror's tree into a throwaway scratch directory OUTSIDE the
 *      mirror (no `.git`, so the copy has no remote);
 *   2. runs the mirror's own documented rebuild chain there — the SAME chain
 *      the README names, so the recorded rename layer is re-applied and the
 *      comparison is against what the mirror really ships;
 *   3. compares the freshly produced derived layer against the committed tree,
 *      byte for byte;
 *   4. removes the scratch and exits.
 *
 * NOTHING inside the mirror is written: not `readable/`, not `src/`, not
 * `split-spec.json`, not a temp file that survives.
 *
 *   usage: node tools/derive-check.mjs        (the same thing as
 *                                               `node tools/derive.mjs --check`)
 *
 *   exit 0 — the committed derived layer is exactly what the chain produces
 *   exit 1 — the committed derived layer has drifted (the differing files are named)
 *   exit 2 — the check could not run (scratch/copy/chain failure)
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");

// ── the mirror's documented rebuild chain (README, "Rebuild") ────────────
// node tools/derive.mjs
const CHAIN = [
  { file: "tools/derive.mjs", args: [] },
];

// the derived artifacts the chain is responsible for, compared byte for byte
const ARTIFACTS = ["readable", "src"];
// the spec is compared by content (see below): the committed spec may carry
// hand-recorded sections the derive does not emit
const SPEC = "split-spec.json";

// ── helpers ─────────────────────────────────────────────────────────────
const rel = (p) => path.relative(proj, p).split(path.sep).join("/");

// a canonical JSON string (object keys sorted) so two records can be compared
// for deep equality regardless of key order
function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  }
  return JSON.stringify(v === undefined ? null : v);
}

function walk(dir, base = dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out;
}

function readBytes(abs) {
  try {
    return fs.readFileSync(abs);
  } catch {
    return null;
  }
}

// copy the tree, minus the things a rebuild never needs
function copyTree(from, to) {
  fs.cpSync(from, to, {
    recursive: true,
    dereference: true,
    filter: (src) => {
      const r = path.relative(from, src);
      if (!r) return true;
      const top = r.split(path.sep)[0];
      return top !== ".git" && top !== "node_modules";
    },
  });
}

// ── the check ───────────────────────────────────────────────────────────
export async function runDeriveCheck() {
  const scratchRoot = process.env.DERIVE_CHECK_SCRATCH || os.tmpdir();
  fs.mkdirSync(scratchRoot, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(scratchRoot, "derive-check-"));
  const problems = [];
  let compared = 0;
  try {
    console.log(`derive-check: scratch copy at ${scratch} (outside the mirror)`);
    copyTree(proj, scratch);

    // ── the chain, run in the scratch ────────────────────────────────────
    for (const step of CHAIN) {
      const argv = [step.file, ...(step.args || [])];
      const shown = "node " + argv.join(" ");
      const r = spawnSync(process.execPath, argv, {
        cwd: scratch,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      const out = (r.stdout || "").trimEnd().split("\n").filter(Boolean);
      const err = (r.stderr || "").trimEnd().split("\n").filter(Boolean);
      for (const line of out.slice(-4)) console.log(`derive-check:   ${line}`);
      if (r.status !== 0) {
        for (const line of err.slice(-12)) console.error(`derive-check:   ${line}`);
        console.error(`DERIVE CHECK ERROR — the chain step \`${shown}\` failed in the scratch (exit ${r.status})`);
        return 2;
      }
    }

    // ── compare the fresh derived layer against the committed tree ───────
    for (const artifact of ARTIFACTS) {
      const freshAbs = path.join(scratch, artifact);
      const liveAbs = path.join(proj, artifact);
      const freshIsDir = fs.existsSync(freshAbs) && fs.statSync(freshAbs).isDirectory();
      const liveIsDir = fs.existsSync(liveAbs) && fs.statSync(liveAbs).isDirectory();

      if (freshIsDir && liveIsDir) {
        const fresh = walk(freshAbs).sort();
        const live = new Set(walk(liveAbs));
        for (const f of fresh) {
          compared++;
          const a = readBytes(path.join(freshAbs, f));
          const b = readBytes(path.join(liveAbs, f));
          if (!b) problems.push(`missing derived file: ${artifact}/${f}`);
          else if (!a.equals(b)) problems.push(`stale derived file: ${artifact}/${f}`);
        }
        for (const f of live) {
          if (!fs.existsSync(path.join(freshAbs, f))) {
            compared++;
            problems.push(`orphan derived file: ${artifact}/${f}`);
          }
        }
      } else if (!freshIsDir && !liveIsDir) {
        compared++;
        const a = readBytes(freshAbs);
        const b = readBytes(liveAbs);
        if (!a) problems.push(`missing derived file: ${artifact}`);
        else if (!b) problems.push(`missing derived file: ${artifact}`);
        else if (!a.equals(b)) problems.push(`stale derived file: ${artifact}`);
      } else {
        problems.push(`derived artifact has a different shape: ${artifact}`);
      }
    }

    // ── the spec is co-maintained by hand: compare it by CONTENT ────────
    // The campaign records sections the derive does not emit (a whole-file
    // pristine record, a served chunk's own export statement), so the
    // committed spec is a SUPERSET of the spec a fresh derive writes. The
    // check therefore requires the committed spec to CONTAIN every section the
    // derive emits, byte-identically; the extra hand-recorded sections are
    // reported (so they stay visible) instead of failing the check.
    if (SPEC) {
      const freshSpec = readBytes(path.join(scratch, SPEC));
      const liveSpec = readBytes(path.join(proj, SPEC));
      compared++;
      if (!liveSpec) {
        problems.push(`missing derived file: ${SPEC}`);
      } else if (!freshSpec) {
        problems.push(`the rebuild produced no ${SPEC}`);
      } else if (!freshSpec.equals(liveSpec)) {
        let f;
        let l;
        try {
          f = JSON.parse(freshSpec.toString("utf8"));
          l = JSON.parse(liveSpec.toString("utf8"));
        } catch (e) {
          problems.push(`stale derived file: ${SPEC} (not valid JSON: ${e.message})`);
        }
        if (f && l) {
          const fs2 = Array.isArray(f.sections) ? f.sections : [];
          const ls2 = Array.isArray(l.sections) ? l.sections : [];
          const liveCanon = ls2.map(canon);
          let missing = 0;
          for (const s of fs2) {
            if (!liveCanon.includes(canon(s))) {
              missing++;
              const name = s.file || s.sourceFile || s.pristine || "(unnamed section)";
              const where = s.startLine ? ` lines ${s.startLine}-${s.endLine ?? s.startLine}` : "";
              problems.push(`stale derived file: ${SPEC} — section not reproduced by the committed spec: ${name}${where}`);
            }
          }
          const freshCanon = fs2.map(canon);
          const extra = ls2.filter((s) => !freshCanon.includes(canon(s)));
          if (extra.length) {
            console.log(
              `derive-check: ${SPEC}: ${extra.length} hand-recorded section(s) the derive does not emit (kept, not a failure)`,
            );
          }
          if (!missing) {
            const proseKeys = Object.keys(f).filter(
              (k) => k !== "sections" && canon(f[k]) !== canon(l[k]),
            );
            if (proseKeys.length) {
              console.log(
                `derive-check: ${SPEC}: top-level ${proseKeys.join(", ")} prose differs from the derive's own text (kept, not a failure)`,
              );
            }
          }
        }
      }
    }

    const chainLabel = CHAIN.map((s) => "node " + [s.file, ...(s.args || [])].join(" ")).join(" && ");
    console.log(`derive-check: compared ${compared} derived file(s) against the committed tree`);
    console.log(`derive-check: chain was: ${chainLabel}`);
    if (problems.length) {
      console.error(`DERIVE CHECK FAIL — ${problems.length} file(s) differ from a fresh rebuild (nothing written)`);
      for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
      if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
      return 1;
    }
    console.log(
      `DERIVE CHECK PASS — ${ARTIFACTS.join(" + ")} ${ARTIFACTS.length > 1 ? "are" : "is"} current under the mirror's documented rebuild chain (nothing written)`,
    );
    return 0;
  } catch (e) {
    console.error(`DERIVE CHECK ERROR — ${e && e.stack ? e.stack : e}`);
    return 2;
  } finally {
    try {
      fs.rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      console.error(`derive-check: WARNING — could not remove the scratch at ${scratch}`);
    }
  }
}

// run as a script: report the exit code
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(await runDeriveCheck());
}
