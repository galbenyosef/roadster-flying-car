// capture.mjs — byte-exact capture + runtime-closure fetch for roadster-flying-car.
//
// ROADSTER: The Flying Car (https://roadster-the-flying-car-gamev28.vercel.app/)
// is a single-file three.js game served by Vercel at the origin root: one
// 2,775,374 B entry document carrying the entire game — a ~2.7 MB inline
// <script type="module"> (the whole three.js r187dev engine source bundled
// behind a tiny `__defs`/`__req` module registry, the ten examples/jsm
// postprocessing/shader addons, and the game's own ~526 KB of app code), two
// inline <style> blocks, one embedded data:image/jpeg share-card photo — plus
// a same-origin PWA shell the page references (manifest.webmanifest, sw.js,
// icon-192.png, icon-512.png, og.jpg) and off-origin CDN loads (the Google
// Fonts stylesheet, and the gstatic firebase modules the optional cloud-login
// path dynamic-imports when a cloud.json config exists).
//
// What the game loads at runtime from the origin, and what this tool does:
//
//   1. entry document              -> index.html (fetched from "/")
//   2. <link rel=manifest>         -> manifest.webmanifest
//   3. icons (link rel=icon/apple-touch-icon, manifest icons[], sw.js precache)
//                                  -> icon-192.png, icon-512.png
//   4. service worker registration -> sw.js (its precache list F is scanned)
//   5. og:image / twitter:image    -> og.jpg (same-origin meta reference)
//   6. probed-but-404              -> favicon.ico (no upstream icon; browsers
//                                     request it implicitly) and cloud.json
//                                     (the optional cloud-config fetch — the
//                                     code tolerates a 404; no cloud.json is
//                                     deployed, so the firebase path never
//                                     activates). Both recorded as gaps.
//
// The scanner iterates every captured text file to a fixpoint (HTML attrs and
// inline script/style bodies, JS literals/specifiers, CSS url()/@import, JSON
// quoted paths). Two documented precision rules keep vendor noise out of the
// probe list (both proven against the capture; the opencli network log over a
// played session is the dynamic cross-check):
//
//   - block comments are stripped before scanning: the bundled three.js
//     source carries its JSDoc, whose examples quote paths that were never
//     deployed ("sprite.png", "sounds/song.ogg", "fish.gltf", …). All of them
//     live inside /* … */ blocks (verified); stripping them leaves only code.
//   - the bundle's own module ids are internal: `__req('…')` resolves through
//     `__defs['…']=function(){…}` inside the same inline script, never over
//     the network. Every id defined in the captured entry is excluded from
//     probing (self-maintaining: parsed from the capture, not hardcoded).
//
// Two hardcoded EXCLUDE entries remain, both never network-requested:
// roadster-progress.png is a client-side File() name for the share sheet, and
// firebase-app|auth|firestore.js are dynamic-imported from the absolute
// gstatic CDN base (off-origin; recorded external, only when a cloud config
// exists — it never does).
//
// Output (all byte-exact, nothing edited):
//   <mirror root>/…            captured files as served (entry index.html at root)
//   _mirror-report.json        crawl record (dead-world shape)
//   .upstream/manifest.json    Gen-A { generated, origin, files: { rel: {bytes, sha256} } }
//
// usage: node tools/capture.mjs [--check] [--report-only]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const ORIGIN = "https://roadster-the-flying-car-gamev28.vercel.app";
const ENTRY = "index.html"; // served at the origin root; capture at repo root (DISK_PREFIX = "")
const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0" };

// runtime-instantiated template targets the literal scanner cannot resolve
// (see header): the browser-implicit root favicon. Everything else the page
// needs is directly referenced in the captured text.
const KNOWN = ["favicon.ico"];

// strings that look like asset paths but are never network-requested (proven:
// code context, network log clean) — kept out of the probe list
const EXCLUDE = new Set([
  // share-sheet File() name generated client-side (canvas.toBlob → File)
  "roadster-progress.png",
  // dynamic-imported from the absolute gstatic CDN base (off-origin, recorded external)
  "firebase-app.js",
  "firebase-auth.js",
  "firebase-firestore.js",
]);

// module ids the inline bundle defines itself (`__defs['id']=function(){…}`);
// `__req('id')` resolves them in-memory — never a network fetch. Filled after
// the entry is fetched (see collectInternalIds).
const INTERNAL = new Set();
const collectInternalIds = (text) => {
  for (const m of text.matchAll(/__defs\['([^']+)'\]\s*=\s*function/g)) INTERNAL.add(m[1]);
  return INTERNAL.size;
};

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const EXT =
  "js|mjs|css|png|jpe?g|webp|gif|svg|avif|ico|ktx2|basis|mp3|ogg|wav|m4a|mp4|webm|json|wasm|data|bin|glb|gltf|woff2?|ttf|otf|hdr|exr|txt|csv|glsl|vert|frag|map|xml|webmanifest";
const RE_EXT_END = new RegExp(`\\.(?:${EXT})$`, "i");

// quoted-string scanner used for both HTML attributes/URLs and JS literals
const RE_QUOTED = new RegExp(`["'\`]([^"'\`\\n\\r]{1,300}?\\.(?:${EXT}))(?:\\?[^"'\`\\n\\r]*)?["'\`]`, "gi");
const RE_SPECIFIER = /\b(?:import|from)\s*\(?\s*["'`]([^"'`\n\r]+)["'`]/g;
const RE_NEW_URL = /\bnew\s+URL\s*\(\s*["'`]([^"'`\n\r]+)["'`]/g;
const RE_CSS_URL = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
const RE_CSS_IMPORT = /@import\s+(?:url\(\s*)?["']([^"']+)["']/g;
const RE_SRC_HREF = /\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;
const RE_SRCSET = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
// a captured URL must look like a sane relative path: no spaces, quotes,
// interpolation, operators or query syntax (kills minifier-expression artifacts)
const SANE = (s) => s.length > 0 && s.length <= 250 && !/[\s"'`&?!=<>|;(){}$,:\\]/.test(s);

// vendor JSDoc examples (three.js source comments) quote paths that were never
// deployed; stripping /* … */ blocks before scanning keeps only code refs
const stripBlockComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ");

const normalize = (p) => {
  const out = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
};

function classifyUrl(raw, baseDir) {
  let s = raw.trim();
  if (!s || s.includes("${")) return null;
  if (/^(data:|blob:|javascript:|mailto:|tel:|#)/i.test(s)) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    if (s.startsWith(ORIGIN + "/")) s = s.slice(ORIGIN.length);
    else if (s === ORIGIN) s = "/";
    else return { external: s };
  }
  if (s.startsWith("//")) return { external: s };
  if (!SANE(s)) return null;
  if (s.startsWith("/")) {
    const n = normalize(s.replace(/^\//, ""));
    return { path: n || "index.html" }; // "/" is the root document
  }
  // relative: try module-dir base first, then the origin root (document base)
  const mod = baseDir && baseDir !== "." ? normalize(path.posix.join(baseDir, s)) : normalize(s);
  const root = normalize(s);
  const paths = [...new Set([mod, root])].map((p) => p || "index.html");
  return { paths };
}

// extract candidate references from a captured text file; each entry is a
// candidate-base GROUP for one reference (probe() closes it if any base works)
function refsOf(relPath, rawText, external) {
  const text = stripBlockComments(rawText);
  const groups = [];
  const add = (r) => {
    if (!r) return;
    if (r.external) {
      external.add(r.external);
      return;
    }
    const paths = (r.paths ?? [r.path]).filter((p) => p && !EXCLUDE.has(p) && !INTERNAL.has(p));
    if (paths.length) groups.push(paths);
  };
  const baseDir = path.posix.dirname(relPath);
  const isHtml = /\.html?$/i.test(relPath);
  const isCss = /\.css$/i.test(relPath);
  const isJs = /\.(js|mjs)$/i.test(relPath);
  const isJson = /\.json$/i.test(relPath) || /\.webmanifest$/i.test(relPath);

  if (isHtml) {
    for (const m of text.matchAll(RE_SRC_HREF)) add(classifyUrl(m[1], ""));
    for (const m of text.matchAll(RE_SRCSET))
      for (const part of m[1].split(",")) add(classifyUrl(part.trim().split(/\s+/)[0], ""));
    for (const m of text.matchAll(RE_QUOTED)) {
      const v = m[1];
      // no "://" filter here: same-origin absolute URLs (meta og:image /
      // twitter:image point at <ORIGIN>/og.jpg) must classify to a local path
      if (RE_EXT_END.test(v)) add(classifyUrl(v, ""));
    }
    // HTML comments can carry loader hints
    for (const m of rawText.matchAll(/<!--([\s\S]*?)-->/g))
      for (const t of m[1].matchAll(new RegExp(`([A-Za-z0-9_./-]{1,200}\\.(?:${EXT}))`, "gi")))
        add(classifyUrl(t[1], ""));
  }
  if (isJson) {
    for (const m of text.matchAll(RE_QUOTED)) add(classifyUrl(m[1], baseDir));
  }
  if (isCss) {
    for (const m of text.matchAll(RE_CSS_URL)) add(classifyUrl(m[1], baseDir));
    for (const m of text.matchAll(RE_CSS_IMPORT)) add(classifyUrl(m[1], baseDir));
  }
  if (isJs) {
    for (const m of text.matchAll(RE_QUOTED)) add(classifyUrl(m[1], baseDir));
    for (const m of text.matchAll(RE_SPECIFIER)) {
      const v = m[1];
      if (/^(\.{0,2}\/)/.test(v) || /\.(js|mjs|css|json|wasm)(\?|$)/i.test(v)) add(classifyUrl(v, baseDir));
    }
    for (const m of text.matchAll(RE_NEW_URL)) {
      const v = m[1];
      if (!v.includes("${")) add(classifyUrl(v, baseDir));
    }
  }
  const seen = new Set();
  return groups.filter((g) => {
    const k = g.join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const external = new Set();
// the optional cloud-login path dynamic-imports firebase from this absolute
// gstatic base (off-origin; only when a cloud.json config exists — see header).
// It is a bare base string with no file extension, so the literal scanner
// cannot see it; recorded here from the code's own `base:` literal.
external.add("https://www.gstatic.com/firebasejs/10.12.2/");
const state = {
  start: ORIGIN + "/",
  origin: ORIGIN,
  gated: false,
  sessionRenewal: "none",
  requests: 0,
  fetched: new Map(), // rel -> { bytes, sha256, buf }
  unresolved: [],
  unreachable: [],
};

const unresolvedSeen = new Set();
const unreachableSeen = new Set();
const probedFailed = new Map(); // candidate rel -> last non-200 status this run
const badStatus = (status, rel) => {
  if (status === 404 && !unresolvedSeen.has(rel)) {
    unresolvedSeen.add(rel);
    state.unresolved.push({ status, path: rel, probes: 1 });
  } else if (status !== 404 && !unreachableSeen.has(rel)) {
    unreachableSeen.add(rel);
    state.unreachable.push({ status, path: rel, probes: 1 });
  }
};

// one raw fetch; never records — probe() decides what a failure means.
// Vercel serves the root-hosted entry document at both "/" and "/index.html".
async function tryFetch(rel) {
  const url = rel === ENTRY ? ORIGIN + "/" : ORIGIN + "/" + rel.split("/").map(encodeURIComponent).join("/");
  state.requests++;
  let r;
  try {
    r = await fetch(url, { headers: UA });
  } catch (e) {
    return { status: `net:${e.message}`, buf: null };
  }
  if (r.status !== 200) return { status: r.status, buf: null };
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: 200, buf };
}

// probe one reference: try every candidate base path; a reference is a gap only
// when EVERY base 404s (then each probed form is recorded, dead-world style);
// once any base is captured the reference is closed
async function probe(paths) {
  if (paths.some((p) => state.fetched.has(p))) return true;
  const fresh = paths.filter((p) => !probedFailed.has(p));
  if (!fresh.length) return false;
  const failed = [];
  for (const rel of fresh) {
    const res = await tryFetch(rel);
    if (res.buf) {
      state.fetched.set(rel, { bytes: res.buf.length, sha256: sha256(res.buf), buf: res.buf });
      return true;
    }
    probedFailed.set(rel, res.status);
    failed.push({ status: res.status, rel });
  }
  for (const f of failed) badStatus(f.status, f.rel);
  return false;
}

async function fetchEntry(rel) {
  const res = await tryFetch(rel);
  if (!res.buf) throw new Error(`entry ${rel} not fetchable (HTTP ${res.status})`);
  state.fetched.set(rel, { bytes: res.buf.length, sha256: sha256(res.buf), buf: res.buf });
  return res.buf;
}

// --check: residual closure audit. Every reference scanned out of the captured
// text files must resolve to a captured file (any candidate base) or be a gap
// already recorded in _mirror-report.json — run after a capture to prove the
// runtime graph is closed.
function checkClosure() {
  const manifestPath = path.join(proj, ".upstream", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const have = new Set(Object.keys(manifest.files));
  const recorded = new Set();
  try {
    const rep = JSON.parse(fs.readFileSync(path.join(proj, "_mirror-report.json"), "utf8"));
    for (const u of rep.unresolved ?? []) recorded.add(u.path);
  } catch {
    /* no report yet: every unresolved reference counts as new */
  }
  // module ids the bundle defines itself (internal registry, never fetched)
  INTERNAL.clear();
  for (const rel of have) if (/\.html?$/i.test(rel)) collectInternalIds(fs.readFileSync(path.join(proj, rel), "utf8"));
  const ext = new Set();
  let groups = 0;
  const missing = [];
  const scanExternal = new Set();
  for (const rel of Object.keys(manifest.files).filter((r) => /\.(html?|js|mjs|css|json|webmanifest)$/i.test(r))) {
    const text = fs.readFileSync(path.join(proj, rel), "utf8");
    for (const g of refsOf(rel, text, scanExternal)) {
      groups++;
      const k = g.join("|");
      if (ext.has(k)) continue;
      ext.add(k);
      if (!g.some((p) => have.has(p))) missing.push({ from: rel, candidates: g });
    }
  }
  const novel = missing.filter((m) => !m.candidates.some((c) => recorded.has(c)));
  for (const m of missing)
    console.log(
      `UNRESOLVED ${m.from} -> ${m.candidates.join(" | ")}` +
        (m.candidates.some((c) => recorded.has(c)) ? "  (recorded gap)" : "  (NEW)"),
    );
  console.log(
    `closure check: ${groups} reference group(s), ${missing.length} unresolved (${novel.length} new vs _mirror-report.json), ` +
      `${scanExternal.size} external off-origin reference(s) (left on CDN), ${INTERNAL.size} internal module id(s) excluded`,
  );
  for (const e of [...scanExternal].sort()) console.log(`  external: ${e}`);
  process.exit(novel.length ? 1 : 0);
}

async function main() {
  if (process.argv.includes("--check")) return checkClosure();
  if (process.argv.includes("--report-only")) {
    console.log("report-only: no fetch performed");
    return;
  }

  // round 0: entry + runtime-instantiated template targets
  if (!state.fetched.has(ENTRY)) await fetchEntry(ENTRY);
  collectInternalIds(state.fetched.get(ENTRY).buf.toString("utf8"));
  console.log(`internal module ids defined by the entry bundle: ${INTERNAL.size}`);
  for (const rel of KNOWN) if (!state.fetched.has(rel)) await probe([rel]);

  // iterate closure to fixpoint
  let round = 0;
  let newRefs = 0;
  do {
    newRefs = 0;
    round++;
    for (const [rel, rec] of [...state.fetched.entries()].sort()) {
      if (!/\.(html?|js|mjs|css|json|webmanifest)$/i.test(rel)) continue;
      const text = rec.buf.toString("utf8");
      if (!Buffer.from(text, "utf8").equals(rec.buf)) continue; // non-utf8, not scannable
      for (const group of refsOf(rel, text, external)) {
        if (group.some((p) => state.fetched.has(p))) continue;
        if (group.every((p) => probedFailed.has(p))) continue;
        newRefs++;
        await probe(group);
      }
    }
    console.log(`round ${round}: ${newRefs} new reference(s) probed, ${state.fetched.size} file(s) in closure`);
  } while (newRefs > 0);

  // write every captured file byte-exact at the capture root
  let bytes = 0;
  for (const [rel, rec] of [...state.fetched.entries()].sort()) {
    const abs = path.join(proj, rel);
    if (!path.resolve(abs).startsWith(path.resolve(proj) + path.sep) && path.resolve(abs) !== path.resolve(proj))
      throw new Error(`path escapes capture root: ${rel}`);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, rec.buf);
    bytes += rec.bytes;
  }
  state.bytes = bytes;

  // crawl record
  const report = {
    start: state.start,
    origin: state.origin,
    gated: state.gated,
    sessionRenewal: state.sessionRenewal,
    requests: state.requests,
    fetched: state.fetched.size,
    bytes: state.bytes,
    paths: [...state.fetched.keys()].sort(),
    unresolved: state.unresolved.sort((a, b) => a.path.localeCompare(b.path)),
    unreachable: state.unreachable.sort((a, b) => a.path.localeCompare(b.path)),
    external: [...external].sort(),
  };
  fs.writeFileSync(path.join(proj, "_mirror-report.json"), JSON.stringify(report, null, 2) + "\n");

  // Gen-A manifest over EVERY captured file
  const files = {};
  for (const [rel, rec] of [...state.fetched.entries()].sort()) files[rel] = { bytes: rec.bytes, sha256: rec.sha256 };
  fs.mkdirSync(path.join(proj, ".upstream"), { recursive: true });
  fs.writeFileSync(
    path.join(proj, ".upstream", "manifest.json"),
    JSON.stringify({ generated: new Date().toISOString(), origin: ORIGIN, files }, null, 2) + "\n",
  );

  console.log(
    `capture: ${state.fetched.size} file(s), ${bytes} bytes, ${state.requests} request(s), ` +
      `${state.unresolved.length} unresolved 404, ${state.unreachable.length} unreachable, ${external.size} external`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
