# ROADSTER: The Flying Car — offline mirror

Full mirror of **ROADSTER: The Flying Car**
(https://roadster-the-flying-car-gamev28.vercel.app/) — "Drive, hover and race
a Roadster with a hidden thruster bay through a neon city with a live rocket."

Source: https://roadster-the-flying-car-gamev28.vercel.app/

![ROADSTER](docs/cover.png)

## Stack

- **Single-file three.js build** — the entire game is one 2,775,374 B
  `index.html`: a **2,697,801 B inline `<script type="module">`** carrying the
  whole dependency graph, two inline `<style>` blocks (66 B + 61,649 B) and one
  embedded `data:image/jpeg` share-card photo. No external bundles, no build
  step, no CDN scripts.
- **three.js r187dev, bundled inline** — the module script opens with a tiny
  `__defs`/`__req` registry (`const __defs = {}, __cache = {};` + a 164 B
  loader line) and then defines its 12 vendor modules as
  `__defs['<id>'] = function () { … };`: **three.core.js + three.module.js**
  (the full unminified r187dev engine source — `REVISION = "187dev"`,
  `window.__THREE__` registration) plus ten `examples/jsm` addons
  (EffectComposer, RenderPass, ShaderPass, MaskPass, UnrealBloomPass,
  OutputPass, CopyShader, LuminosityHighPassShader, OutputShader, Pass). The
  game's own 526,779 B of app code follows, importing through `__req("…")`.
- **Procedural everything** — the Roadster, the city, traffic, the plate
  bay/thrusters, the rocket and all textures are generated in code (39 runtime
  canvases — plate/livery/city/UI art). Sound is WebAudio-synthesised at
  runtime (oscillators/buffers); no audio files ship.
- **PWA shell** — `manifest.webmanifest`, `sw.js` (service worker, registered
  only when the page is on `https:`), `icon-192.png`, `icon-512.png` and the
  `og.jpg` social card, all served same-origin at the root.
- **Google Fonts stay external** — the `Saira` / `JetBrains Mono` stylesheet
  and font origins are off-origin references recorded in `_mirror-report.json`
  (`external`); they are never backfilled into the capture (socker precedent,
  PLAN §1). The page renders fine with system fallbacks when offline.
- **Optional cloud login never activates** — the code fetches `cloud.json`
  (a 404 upstream, recorded as a gap) and only when a config exists would it
  dynamic-import firebase from the absolute `gstatic.com/firebasejs/10.12.2/`
  base (recorded external).

## What this is

ROADSTER: The Flying Car (roadster-the-flying-car-gamev28.vercel.app) — a
single-file browser driving/flying game: you take the Roadster through a neon
city, learn gas/steer/brake, open the rear licence plate into **ROCKET MODE**,
lift off on four cold-gas hover jets, fly, land, and boost with the rocket.
Captured whole, byte-exact under `.upstream/manifest.json`: **6 files,
2,898,335 bytes** — the entry document (2,775,374 B, carrying the 2,697,801 B
inline module script = 164 B loader + 2,170,858 B of vendor module definitions
+ 526,779 B of app code), the PWA shell (`sw.js`, `manifest.webmanifest`,
`icon-192.png`, `icon-512.png`) and `og.jpg`.

The runtime closure was driven to a fixpoint by `tools/capture.mjs` and then
cross-checked against an opencli browser network log recorded while the mirror
was loaded and played on loopback (`docs/boot-network-2026-10-13.json`, 11
requests): **0 new same-origin requests beyond the capture** — the only
same-origin non-match is `cloud.json` (404), the already-recorded gap. The
browser never fetched `og.jpg` (meta-only), `icon-512.png` (manifest/precache
only) or `sw.js` (https-only) on this http serve; all three are captured from
the origin and covered by the static closure scan.

## Layout

- `index.html` — the capture at the origin root (served paths = on-disk
  paths): inline vendor bundle + app code + styles + embedded share photo
- `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `og.jpg` —
  the same-origin PWA shell / meta assets
- `.upstream/manifest.json` — sha256 + bytes for every captured file (Gen-A)
- `_mirror-report.json` — crawl record: request count, fetched paths,
  recorded 404 gaps (`favicon.ico`, `cloud.json`), external references
- `readable/` — prettified derived layer (pinned prettier 3.9.6):
  `index-inline-1.pretty.js` (the whole 2.7 MB module script, 98,435 lines),
  `index-inline-2.pretty.js` (the 149 B service-worker registration),
  `index-inline-1.pretty.css` (7 lines), `index-inline-2.pretty.css`
  (4,031 lines), `sw.pretty.js` (65 lines) + `index-inline-map.json` (byte
  ranges + sha256 for every inline block)
- `src/` + `split-spec.json` — 65 statement-aligned slices with the recorded
  derivation spec (69 sections)
- `docs/cover.png` — gameplay cover (the Roadster flying at 110 m over the
  city, HOVER · 37 MPH, full HUD); `docs/boot-2026-10-13.png` — boot evidence
  (the TAP TO IGNITE gate); `docs/boot-network-2026-10-13.json` — the opencli
  network log from the play test
- `tools/capture.mjs` — byte-exact capture + runtime-closure fetch (`--check`
  for a residual closure audit)
- `tools/derive.mjs` — rebuild `readable/` + `src/` + `split-spec.json`
- `tools/verify.mjs` — re-hash the capture against the manifest
- `tools/update.mjs` — read-only drift probe against the live origin
- `tools/audit.js` — integrity gate for the derived layers (`AUDIT PASS`)
- `tools/net-crosscheck.mjs` — compare an opencli network log against the
  manifest (dynamic closure check)

## Assets

The build is a single file: almost every asset is **in-file**, and the game's
art is **procedural**. What the repo carries:

- **images** — 3 captured files: `og.jpg` (109,573 B, 1200×630 social card,
  meta-only), `icon-192.png` (3,076 B) and `icon-512.png` (8,727 B, maskable)
  for the PWA. **In-file**: one `data:image/jpeg;base64` payload (~87 KB
  decoded) — `HERO_JPG`, the golden-hour photo rendered in-game and stamped
  onto every share card.
- **textures** — none as files: all 39 textures are generated at runtime on
  canvases (licence-plate art, livery, city windows, road markings, UI
  sprites, the og-card backdrop).
- **audio** — none as files: WebAudio synthesis only (engine/thruster/tyre/
  UI sounds are oscillators and buffers built in code).
- **models** — none as files: the car, its plate-hinge/thruster bay, the city,
  traffic, walkers, rocket and props are procedural three.js geometry built in
  the app code.
- **data** — 1 file: `manifest.webmanifest` (407 B, PWA manifest; its
  `icons[]` reference the two captured PNGs). The service worker `sw.js`
  (1,178 B) precaches `index.html`, the manifest and both icons.
- **fonts** — none captured: `Saira` / `JetBrains Mono` load from Google Fonts
  (external by design, see Stack).

## Run

Open `index.html` through any static file server (the capture is a static site
served at the origin root; no build step):

```
npx serve .
```

Everything except the Google Fonts stylesheet is local. The service worker
only registers on `https:`, so a plain loopback serve plays without it. The
game needs WebGL (it shows its own "This game needs WebGL" guard otherwise).
The boot evidence in `docs/boot-2026-10-13.png` and the cover in
`docs/cover.png` were both taken through a local serve on loopback.

## Verify

```
node tools/verify.mjs                 # re-hash the capture → 6 files checked, 0 problems
node tools/audit.js                   # derived-layer integrity gate → AUDIT PASS
node tools/capture.mjs --check        # residual closure audit → 0 new unresolved
node tools/net-crosscheck.mjs docs/boot-network-2026-10-13.json   # dynamic closure check
```

## Updating from upstream

```
node tools/update.mjs     # read-only drift probe: what changed upstream
```

The probe never rewrites the capture — a mirror is a point-in-time snapshot.
Only captured (same-origin) files are probed: the manifest is the closure, and
the external loads (Google Fonts, the gstatic firebase base) have no manifest
entries — they are documented in `_mirror-report.json` and listed by
`tools/capture.mjs --check`, so they are never probed as if local. Vercel
serves the entry at both `/` and `/index.html`; the probe keeps the root-form
fallback. Refreshing means re-fetching into a clean tree
(`node tools/capture.mjs`), re-cutting the manifest, and re-deriving
`readable/` + `src/` from the new entry document with `node tools/derive.mjs`.

### 2026-10-13 capture + readable/src derivation

- **Capture** (byte-exact, nothing edited): 6 files, 2,898,335 bytes —
  `index.html` (2,775,374 B; the 2,697,801 B inline module script, the 149 B
  service-worker registration script, the 66 B + 61,649 B inline styles, the
  embedded `data:image/jpeg` share photo), `sw.js` (1,178 B),
  `manifest.webmanifest` (407 B), `icon-192.png` (3,076 B), `icon-512.png`
  (8,727 B), `og.jpg` (109,573 B). Closure was driven to a fixpoint by
  `tools/capture.mjs` (8 requests, 3 rounds): entry → manifest/icons/og via
  attributes + same-origin absolute meta URLs → `sw.js` → `icon-512.png`
  (named inside `sw.js`'s precache list and the manifest's icons[]).
  Two recorded 404 gaps: `favicon.ico` (browser-implicit root request; Vercel
  serves no icon) and `cloud.json` (the optional cloud-config fetch the code
  tolerates a 404 from). Scanner precision is documented in the tool: block
  comments are stripped before scanning (the bundled three.js JSDoc quotes
  example paths that were never deployed — "sprite.png", "sounds/song.ogg",
  …) and the bundle's own `__defs` module ids are excluded from probing
  (`__req('three.module.js')` resolves in-memory, never over the network).
- **Dynamic closure cross-check** — the mirror was served on loopback and
  played through an opencli browser session; the recorded network log
  (`docs/boot-network-2026-10-13.json`, 11 requests) contains **zero
  same-origin requests that are not captured files**: `index.html`,
  `manifest.webmanifest`, `icon-192.png` (200s) and `cloud.json` (404, the
  recorded gap). Off-origin: the Google Fonts stylesheet (x1) and two font
  files from `fonts.gstatic.com` (x2); two embedded `data:` payloads (the
  HERO photo + a runtime canvas PNG) never touch the network. The log was
  recorded with `network --all --follow` (the `--since` query form does not
  retain the buffer).
- **readable/** — pinned prettier 3.9.6 (module API, default options, single
  pass verified idempotent — never the CLI, it respects `.gitignore` and can
  silently echo its input) rendered the entry's inline blocks to
  `index-inline-1.pretty.js` (98,435 lines), `index-inline-2.pretty.js`
  (5 lines), `index-inline-1.pretty.css` (7 lines) and
  `index-inline-2.pretty.css` (4,031 lines), and the captured `sw.js` to
  `sw.pretty.js` (65 lines). Every pretty is provably not a byte copy of its
  capture source and re-renders byte-exact under the pinned version. Block
  numbering is per tag kind (the fleet convention): the big module script is
  script #1, the SW registration is script #2, the two styles are #1 and #2.
- **Inline blocks** — all four content blocks get whole-file twins plus
  `readable/index-inline-map.json` recording each block's exact byte range +
  sha256 inside `index.html`.
- **src/** — 65 statement-aligned slices (63 from the app code of the big
  script, 1 from the SW registration, 1 from `sw.js`; exact 2-line provenance
  header) recorded in `split-spec.json` (69 sections): 65/65 parse standalone
  (`node --input-type=module --check -`) and round-trip byte-exact to their
  readable line ranges. Cuts land only on top-level statement boundaries
  (~250-350 line windows); oversized single declarations stay whole
  (largest: `index-inline-1-27.js`, 638 lines). The app code sits at module
  top level (no IIFE wrapper here), so no wrapper sections were needed.
- **Vendor regions are wholeFile, never sliced** (vendor rule, PLAN §1): the
  164 B `__defs`/`__req` loader line (`index-inline-1-loader-machinery.js`)
  and the 12 vendor module definitions
  (`index-inline-1-three-vendor.js`, readable lines 9-78,640) — the module id
  set and content anchors (`REVISION = "187dev"`, UnrealBloomPass, …) are
  asserted at derive time and re-checked by the audit. The two inline
  `<style>` blocks are wholeFile sections (stylesheet rule).
- **notRendered** — 4 hashed payload records in `split-spec.json`
  (`icon-192.png`, `icon-512.png`, `og.jpg`, `manifest.webmanifest`; bytes +
  sha256, no pretty pass), all re-checked against the manifest by the audit.
- **Gates**: `node tools/verify.mjs` → `6 files checked, 0 problems`;
  `node tools/audit.js` → `AUDIT PASS` (65/65 round-trips byte-exact, 5/5
  pretties re-render byte-exact, 4 inline blocks with twins + map, vendor +
  shape guards held); `node tools/capture.mjs --check` → `0 new unresolved`;
  `node tools/net-crosscheck.mjs docs/boot-network-2026-10-13.json` →
  `0 new missing`; `node tools/update.mjs` → `up to date: 6 captured files
  identical upstream`; independent 3-slice check → 3/3 byte-exact +
  header-exact + parse standalone. Boot test: mirror served on loopback,
  opened through opencli — the TAP TO IGNITE gate rendered
  (`docs/boot-2026-10-13.png`), clicking through took the game into the
  FIRST DRIVE tutorial; the car was driven (up to 74 mph, mission at
  STEP 2/8), ROCKET MODE armed (plate + thruster reveal cinematic,
  SPOOLING → ARMED), and the Roadster flew on its hover jets, climbing past
  ALT 110 m; the cover shows live gameplay at ALT 110.3 m, HOVER · 37 MPH
  with the full HUD. Serve probe:
  entry + `sw.js` + `manifest.webmanifest` + both icons + `og.jpg` over HTTP
  200 at their recorded sizes on loopback (cloud.json → 404, matching
  upstream), listener PID killed, port proven closed (`netstat` shows no
  LISTENER + connection refused).
- **§0.4 fork-over-mirror checked 2026-10-13**: the project has **no own
  public repo** — the captured text carries no github/gitlab/bitbucket
  reference for the game itself (the only repository links are third-party
  library credits inside the bundled three.js source: mrdoob/three.js,
  toji/gl-matrix, mapbox/earcut, paper.js, GeometricTools, lightgl.js — library
  banners, not the project's source), the only outbound project URL is the X
  share-intent, and GitHub searches for "roadster-the-flying-car" /
  "Roadster: The Flying Car" return 0 repositories. The page declares itself
  an "Unofficial fan game … Not affiliated with or endorsed by Tesla or
  SpaceX". The mirror stands.
- **Open task (PLAN §5)**: identifiers in `src/` are the bundle's own names.
  The app code is authored readably (meaningful names survive the pretty
  pass); the vendor region keeps three.js's own names. A deep identifier
  rename campaign has not been run. Rebuild the derived layers any time with
  `node tools/derive.mjs`.

## Mirror conventions

- **Capture layer** — the captured files are byte-exact copies of what the
  origin served; nothing in them is edited. `.gitattributes` pins `* -text`
  so git never normalizes EOLs.
- **CDN dependencies stay CDN** — the Google Fonts stylesheet/font origins and
  the gstatic firebase base are recorded as external references and are never
  backfilled into the capture (PLAN §1, socker precedent).
- **Readable layer** — `readable/` is derived (prettified) and never shipped
  to a browser; it exists so the single inline bundle can actually be read.
- **Provenance** — `.upstream/manifest.json` records sha256 for each captured
  artifact, and `tools/verify.mjs` re-checks it; `_mirror-report.json` is the
  crawl record.
- **Drift** — `tools/update.mjs` is read-only: it reports what changed
  upstream and never rewrites the capture.

## Fleet status

<!-- mirror-status:start — feeds _standard/REPO-INDEX.md. Update ONLY your own mirror's block; never edit the shared index (PLAN §8). Rebuild: node _standard/build-index.mjs -->
<!-- cols: cls=classification · ver=verify 0 problems · upd=drift probe · man=manifest · rdbl=readable re-derived · src=reversed src · boot=boot test · top=offline-mirror topic · tag=backup tag · staged=staged not committed -->
| # | repo | cls | ver | upd | man | rdbl | src | boot | top | tag | staged |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 301 | roadster-flying-car | mirror | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
<!-- mirror-status:end -->
