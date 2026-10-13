// net-crosscheck.mjs — dynamic closure cross-check for ROADSTER: The Flying Car.
//
// The static closure (tools/capture.mjs --check) proves the captured text files
// reference nothing un-captured. This tool adds the dynamic half: it compares an
// opencli browser network log, recorded while the mirror was loaded and played
// on loopback, against .upstream/manifest.json:
//   - every same-origin request must be a captured file (a MISSING line is a
//     closure gap the static scan did not see);
//   - captured files that were never requested are listed (informational:
//     og.jpg is meta-tag-only and icon-512.png is precache-only, so a browser
//     session need not fetch them);
//   - off-origin requests are summarised (the Google Fonts stylesheet/font
//     origins stay external by design);
//   - failed requests (status >= 400) are listed — cloud.json is the recorded
//     404 gap (the optional cloud-config fetch the code tolerates a 404 from),
//     so a failure line naming it is expected, not a defect.
//
// The log is the JSON-lines stream of
//   opencli browser <session> network --all --follow
// (one JSON object per request; the --since query form does not retain the
// buffer, which is why the log is recorded with --follow while the game runs).
//
// usage: opencli browser <session> network --all --follow > docs/boot-network-<date>.json
//        node tools/net-crosscheck.mjs docs/boot-network-<date>.json
import fs from "node:fs";

const log = JSON.parse(
  "[" +
    fs
      .readFileSync(process.argv[2], "utf8")
      .split("\n")
      .filter((l) => l.trim().startsWith("{"))
      .join(",") +
    "]",
);
const manifest = JSON.parse(fs.readFileSync(new URL("../.upstream/manifest.json", import.meta.url), "utf8"));
const have = new Set(Object.keys(manifest.files));
// recorded 404 gaps (from the capture crawl): a request for one of these is
// explained, not a new closure gap
const recorded = new Set();
try {
  const rep = JSON.parse(fs.readFileSync(new URL("../_mirror-report.json", import.meta.url), "utf8"));
  for (const u of rep.unresolved ?? []) recorded.add(u.path);
} catch {
  /* no report: nothing recorded */
}

const sameOrigin = new Map(); // path -> statuses
const offOrigin = new Map();
let dataUris = 0;
for (const e of log) {
  let u;
  try {
    u = new URL(e.url);
  } catch {
    continue;
  }
  if (e.url.startsWith("data:")) {
    dataUris++;
    continue;
  }
  if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
    const p = u.pathname.replace(/^\//, "") || "index.html";
    if (!sameOrigin.has(p)) sameOrigin.set(p, []);
    sameOrigin.get(p).push(e.status);
  } else {
    if (!offOrigin.has(u.origin)) offOrigin.set(u.origin, 0);
    offOrigin.set(u.origin, offOrigin.get(u.origin) + 1);
  }
}
console.log(
  `entries: ${log.length} (off-origin: ${[...offOrigin.entries()].map(([o, n]) => `${o} x${n}`).join(", ") || "none"}; embedded data: URIs: ${dataUris})`,
);
console.log("--- same-origin requests not in manifest:");
let novel = 0;
for (const [p, st] of [...sameOrigin.entries()].sort()) {
  const ok = have.has(p);
  if (!ok) {
    const rec = recorded.has(p);
    if (!rec) novel++;
    console.log(
      `  MISSING ${p} statuses=${[...new Set(st)].join(",")}` +
        (rec ? "  (recorded 404 gap — never served upstream)" : "  (NEW — not a recorded gap)"),
    );
  }
}
console.log(novel ? `${novel} NEW missing` : "0 new missing — every same-origin request is captured or a recorded gap");
console.log("--- captured-but-never-requested (expected: meta-only og.jpg, precache-only icon-512.png, https-only sw.js):");
const req = new Set(sameOrigin.keys());
for (const rel of [...have].sort()) if (!req.has(rel)) console.log(`  ${rel}`);
console.log(`--- same-origin request count: ${sameOrigin.size}; failed (>=400 or 0):`);
for (const [p, st] of [...sameOrigin.entries()].sort())
  if (st.some((s) => s >= 400 || s === 0)) console.log(`  ${p} statuses=${[...new Set(st)].join(",")}`);
