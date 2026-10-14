// lib-acorn.mjs — resolve the acorn parser for the rename-campaign tools
// (tools/apply-names.mjs spans, tools/probe-structure.mjs, tools/refcheck.mjs
// reference/binding gates). Copied + adapted from the call-of-roque /
// kals-valley / ziggy-card / pelota / one-life / kowloon fleet precedent; acorn
// is an authoring-time dependency ONLY: it is installed into
// tools/.deps/node_modules (gitignored) on first use and never shipped or
// required at runtime — the capture and the derived layers are plain files, and
// tools/derive.mjs re-applies the RECORDED rename map without a parser. Keeping
// it out of the repo root avoids a package.json that would change how Node
// interprets the other tools.
//
// usage:
//   import { getAcorn } from "./lib-acorn.mjs";
//   const acorn = await getAcorn();
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const depsDir = path.join(here, ".deps");
const ACORN_VERSION = "acorn@8.14.1";

let cached = null;

export async function getAcorn() {
  if (cached) return cached;
  const req = createRequire(import.meta.url);
  let resolved = null;
  try {
    resolved = req.resolve("acorn", { paths: [depsDir] });
  } catch {
    // not installed yet — install it
    fs.mkdirSync(depsDir, { recursive: true });
    const gitignore = path.join(depsDir, ".gitignore");
    if (!fs.existsSync(gitignore)) fs.writeFileSync(gitignore, "node_modules/\npackage-lock.json\n");
    const r = spawnSync("npm", ["install", "--prefix", depsDir, "--no-audit", "--no-fund", "--loglevel=error", ACORN_VERSION], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (r.status !== 0) {
      throw new Error(
        `acorn is required by the rename-campaign tools but could not be installed into ${depsDir}.\n` +
        `Run manually: npm install --prefix tools/.deps ${ACORN_VERSION}\n` +
        String(r.stderr || r.stdout || ""),
      );
    }
    resolved = req.resolve("acorn", { paths: [depsDir] });
  }
  cached = req(resolved);
  return cached;
}
