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
- `src/` + `split-spec.json` — 65 statement-aligned slices (69 sections) carrying
  the recorded derivation spec **and the semantic rename layer** (129 reviewed
  names over 60 slices; `rename-map.json` is the record)
- `docs/cover.png` — gameplay cover (the Roadster flying at 110 m over the
  city, HOVER · 37 MPH, full HUD); `docs/boot-2026-10-13.png` — boot evidence
  (the TAP TO IGNITE gate); `docs/boot-network-2026-10-13.json` — the opencli
  network log from the play test
- `tools/capture.mjs` — byte-exact capture + runtime-closure fetch (`--check`
  for a residual closure audit)
- `tools/derive.mjs` — rebuild `readable/` + `src/` + `split-spec.json`
  (re-applying the recorded rename map on every re-cut)
- `tools/verify.mjs` — re-hash the capture against the manifest
- `tools/update.mjs` — read-only drift probe against the live origin
- `tools/audit.js` — integrity gate for the derived layers (`AUDIT PASS`),
  including the rename-map honesty gate
- `tools/net-crosscheck.mjs` — compare an opencli network log against the
  manifest (dynamic closure check)
- `tools/record-manifest.mjs` — re-cut / `--check` `.upstream/manifest.json`
  (canonical SKIP/NOT_CAPTURED sets — derived layers never enter the sums)
- `tools/probe-structure.mjs` — read-only structure probe (source maps, the
  `__defs` factory table, top-level statements, recorded boundaries)
- `tools/apply-names.mjs` — the PLAN §5 campaign writer (scope-aware, canonical
  guard family); `tools/names.json` is the reviewed worklist
- `tools/recover-scoped-map.mjs` — recover `rename-map.json` from the committed
  slices by token alignment; `tools/verify-rename.mjs` + `tools/check-chunk.mjs`
  + `tools/refcheck.mjs` are the campaign gates
- `tools/engine/rename-layer.mjs` — the shared tokenizer / map application the
  writer, derive, audit and the campaign gates all splice through;
  `tools/lib-acorn.mjs` resolves acorn into a gitignored `tools/.deps/`
  (authoring-time only)

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
node tools/audit.js                   # derived-layer integrity gate → AUDIT PASS (incl. rename-map gate)
node tools/capture.mjs --check        # residual closure audit → 0 new unresolved
node tools/net-crosscheck.mjs docs/boot-network-2026-10-13.json   # dynamic closure check
node tools/update.mjs                 # read-only drift probe → up to date: 6 captured files identical
node tools/record-manifest.mjs --check   # the manifest walk agrees, no derived path leaked
node tools/probe-structure.mjs        # read-only structure evidence (the __defs factory table)
node tools/apply-names.mjs --all --dry   # the campaign preflight (nothing written)
node tools/verify-rename.mjs --all    # every slice reproduces byte-exact through rename-map.json
node tools/check-chunk.mjs --all      # cross-slice calls still resolve after the rename
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
- **Open task (PLAN §5), closed 2026-10-15**: the first pass left identifiers
  as bundled and recorded the deep identifier-rename campaign as an open task.
  It was run on 2026-10-15 — see the structure + rename section below; the
  finding was that the script is **authored, not minified**, so only 129
  genuinely opaque short bindings needed naming. Rebuild the derived layers any
  time with `node tools/derive.mjs`.

### 2026-10-15 structure pass + identifier rename campaign (the open task, closed)

Mission of this pass: converge the derived layers on the real project shape and
run the PLAN §5 identifier rename campaign. The capture was **not** touched —
`node tools/verify.mjs` still re-hashes all 6 files (0 problems) — so this
section is entirely about `readable/`, `src/`, `split-spec.json`,
`rename-map.json`, `tools/` and `legacy/`.

- **Inventory (source maps + module boundaries) — recorded by
  `tools/probe-structure.mjs`**:
  - *Source maps*: **0** `sourceMappingURL` occurrences and **0** `*.map` files
    across the capture (scanned byte-wise), so no original tree can be
    reconstructed from maps; the derivation stays a prettier/slice pass.
  - *Module boundaries*: the big inline module script opens with the bundle's
    own `__defs`/`__req` registry — a **factory family in a single-file form**:
    **12** top-level `__defs['<id>'] = function () { … };` module definitions.
    The turbopack/webpack detection rule applies, adapted: the registry *is* a
    module table, but **every factory is a VENDOR module** (three.js r187dev
    `three.module.js` + `three.core.js` and the ten `examples/jsm` addons), so
    the vendor rule claims the whole region wholeFile — exactly the turbopack
    README's *"the vendor chunk (one that carries no push) stays wholeFile"*
    gotcha adapted. There are **0 app factories**: the game's own code is a
    flat classic **module top level** (931 top-level statements, **no IIFE**),
    so the statement-aligned slices the first pass cut *are* the real shape and
    the factory-extraction precedents (spawn-dust-2-dm / mindfall) do not
    apply. The loader machinery and the 12 vendor definitions stay wholeFile
    (never sliced, never renamed); the two inline stylesheets stay wholeFile by
    the stylesheet rule.
- **Rename campaign (PLAN §5) — applied and gated**: the finding that shaped
  the campaign is that ROADSTER's script is **authored, not minified**. Of the
  693 program-scope bindings of the app chunk, the great majority already carry
  the author's own semantic names (`renderer`, `scene`, `camera`, `car`,
  `body`, `wheels`, `mission`, `composer`, `clamp`, `lerp`, …) and are left
  untouched — renaming them would destroy the author's naming, not recover it.
  `tools/names.json` therefore renames only the **129 genuinely opaque short
  bindings — all 129 fired, 0 of them refused, 3,957 identifier positions**
  spliced across **60 slices**: the single-letter globals (`$`→`byId`,
  `S`→`carState`, `M`→`currentMission`, `K`→`keyState`, `P`→`BLOCK_PITCH`,
  `U`→`upgradeLevel`), the two/three-letter code abbreviations (`RW`→`ROAD_WIDTH`,
  `NBK`→`BLOCK_COUNT`, `RPL`→`REPLAY`, `PHO`→`PHOTO`, `V26`→`MISSION_REBUILD`,
  `ECO`→`ECONOMY`, `MIS`→`MISSIONS`, `VEH`→`VEHICLES`, `DRN`→`DRONE`, …) and
  the `_`-prefixed scratch family (`_sq/_se/_sm/_sv/_ss`→`scratch*Skid`,
  `_tc`→`textCache`, `_wv`→`wingVizSpans`, `_c3`→`scratchColor`). Applied by
  `tools/apply-names.mjs` (chunk scope = the app module's top level, so every
  nested local is untouched), recovered mechanically into `rename-map.json`
  (**532 word-boundary + 17 indexed names over 164 occurrences** as recovered
  on 2026-10-15; superseded 2026-10-20 by the fleet guard sync below —
  **534 word-boundary + 13 indexed names over 103 occurrences**, with the slice
  bytes themselves unchanged: 65/65 slices aligned over 170,477 token
  positions, 60 renamed slices), and re-applied by
  `tools/derive.mjs` on every re-cut.
- **Guard family carried (all recorded fixes)**: marked
  `FunctionDeclaration`/`ClassDeclaration` ids + token-level shorthand refusal
  at preflight (proposal (p)); brace-depth template-substitution scanning
  (proposal (r)); strict outside-ranged refusal + per-source line cache
  (proposal (s)); the (t)(1) `renameBindings` record (this app chunk has no
  index-only skipped section, so the exemption path is unreachable but the
  honesty check is live); the token-based import/export handling (proposal
  (ab)); per-chunk target uniqueness (proposal (ad)); flat-occurrence counting
  on the base token stream (proposal (af)); canonical record-manifest
  SKIP/NOT_CAPTURED sets incl. `rename-map.json` (proposal (u)/(t)(2)). The
  `of`/`in` keyword guard (proposal (x)) and the whole-program-IIFE re-rooting
  guard (proposal (ag), scoped to the true IIFE shape per proposal (ah)) are
  carried: this capture is a flat module, so (ag) correctly re-roots nothing
  (the literal program scope is kept) and the `of`/`in` guard has no rule to
  fire on. **One deliberate divergence, recorded**: the `app` rules are keyed
  by the **readable source**, not by capture rel — this capture is one file
  (`index.html`) carrying two inline `<script>` chunks plus two inline
  `<style>` blocks, so a capture rel does not identify a chunk here.
- **One recorded frontier exclusion**: the touch-state object `T` shares its
  spelling with a *local* `T` (`const T = VT[type]` in `vehicleModel`) that
  appears in shorthand position (`{ T, … }`), which the canonical token-level
  shorthand guard refuses — so `T` is left as the author wrote it rather than
  weakening the guard. (darths-rage's binding-resolution adaptation is a
  project-specific divergence and was deliberately not adopted here.) All four
  refusals the writer made — `T` plus the three loader-machinery names
  `__defs` / `__cache` / `__req` — are now recorded with their exact preflight
  reasons in `tools/names.json`'s `refused` section (a refusal is a result,
  not a failure).
- **Pipeline** `apply → recover → derive → gates`; the superseded pre-campaign
  `src/` + `readable/` layers are archived under `legacy/2026-10-15/` (71
  files, 3.69 MB) — `readable/` is the capture rendering and is byte-identical
  across the pass (archived per the archive-both rule); `rename-map.json`,
  `split-spec.json` and `index-inline-map.json` regenerate in place (git is
  their history).
- **Gates**: `node tools/verify.mjs` → `6 files checked, 0 problems`;
  `node tools/audit.js` → `AUDIT PASS` (69 spec sections — 65/65 src↔pretty
  round-trips byte-exact through the recorded rename map, 60 renamed slices,
  rename map 534 word-boundary + 103 indexed records over 60 slices
  token-validated with no foreign position, 5/5 pretties re-render byte-exact
  under pinned prettier 3.9.6 at the fixed point, vendor + shape guards held);
  `node tools/verify-rename.mjs --all` → `65/65 slice(s) reproduce byte-exact,
  60 renamed slice(s) (103 indexed occurrence(s)), 3/3 chunk(s)
  references+bindings YES`; `node tools/check-chunk.mjs --all` → `3 chunk(s),
  65 slice body(ies) substituted — all cross-slice calls resolve`;
  `node tools/derive.mjs` re-run → 73 derived files byte-identical;
  `node tools/record-manifest.mjs --check` → `PASS — 6 capture file(s)
  recorded, walk agrees byte-for-byte, no derived path leaked`;
  `node tools/update.mjs` → `up to date: 6 captured files identical upstream`;
  `node tools/capture.mjs --check` → `1 unresolved (0 new)`; serve probe on
  loopback → entry + `sw.js` + `manifest.webmanifest` + both icons + `og.jpg`
  HTTP 200 at their recorded sizes (`cloud.json` → 404, matching upstream),
  listener PID killed, port proven closed.

### 2026-10-20 fleet guard sync + campaign re-run (the rename layer re-proved)

The mirror's own tool set was two guard fixes behind the fleet template
(`_standard/templates/rename-campaign/`), so the current set was copied in and
the whole campaign re-run under it. Nothing was weakened, nothing was invented,
and **not one byte of `src/` or `readable/` changed** — which is the point of
the exercise.

- **What changed in the tools** (copied verbatim from the fleet template; the
  template set *is* this mirror's lineage, so no per-mirror adaptation was
  needed beyond what was already recorded):
  - `tools/engine/rename-layer.mjs` — the property-access detector no longer
    matches the third dot of a **spread** call: `...ECO(...)` is a call, not a
    property read. Before the fix, a clean word-boundary rename was demoted to
    the index-addressed map because the range contained a `...ECO` spread.
  - `tools/apply-names.mjs` — a **labeled statement** body is now walked. The
    label identifier itself is still never renamed (it is a name position),
    but the statement body must be walked, or a program-scope name used inside
    `outer: for (…) { … }` was renamed at some references and not others
    (caught elsewhere in the fleet as verify-rename reference drift).
- **Re-run, in the mandated order** (`apply → recover → derive → gates`):
  - `node tools/apply-names.mjs --all --dry` → `65 file(s) visited, 0 changed,
    3957 identifier splice(s) (app: 129 name(s) over 1 chunk(s))` — the
    committed slices are **byte-identical** to what the current guards
    produce: zero names lost, zero names invented, proven by re-derivation
    from the pristine readable layer alone.
  - `node tools/recover-scoped-map.mjs` → `65 slice(s) aligned (170,477
    identifier/token positions), 60 renamed slice(s) — 534 word-boundary
    record(s), 15 indexed name(s) over 103 occurrence(s)`; the map now records
    **13** scoped slices instead of 15, because `ECO` (slice 18) and `PHO`
    (slice 38) are promoted from index-addressed records to ordinary
    word-boundary renames by the spread fix.
  - `node tools/derive.mjs` → re-cut from the capture + the recovered map:
    **65/65 src slices byte-identical** to the committed ones; only
    `rename-map.json` (the record's shape) and one `split-spec.json`
    `renameBindings` ordering line changed. `split-spec.json` still records
    **129 name(s) / 3,957 splice(s) / 60 renamed slice(s)**.
- **Refusals are now part of the record** (the spec's "a refusal is a result,
  not a failure"): `tools/names.json` gained a `refused` section listing the
  four names the writer refused, each with its exact preflight reason —
  `__defs`, `__cache`, `__req` (loader machinery inside a wholeFile region:
  "the region is never rewritten, so the rename cannot be complete") and `T`
  (shorthand-property position: "a token rename cannot express it"). None of
  the four is one of the 129 worklist rules; all 129 fired.
- **Gates (all green)**: `node tools/verify.mjs` → `6 files checked, 0
  problems`; `node tools/audit.js` → `AUDIT PASS` (rename map: 534
  word-boundary + 103 indexed record(s) over 60 slice(s), 60 flat + 13 scoped
  slice(s) token-validated, no foreign position); `node tools/verify-rename.mjs
  --all` → `65/65 slice(s) reproduce byte-exact, 60 renamed slice(s) (103
  indexed occurrence(s)), 3/3 chunk(s) references+bindings YES`; `node
  tools/check-chunk.mjs --all` → `3 chunk(s), 65 slice body(ies) substituted —
  all cross-slice calls resolve`; `node tools/refcheck.mjs` → no shadowing /
  duplicate / shorthand drift; `node tools/derive.mjs --check` → self-check
  clean (writes nothing); `node tools/record-manifest.mjs --check` → `PASS —
  6 capture file(s) recorded, walk agrees byte-for-byte, no derived path
  leaked`. The capture was never touched.

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
- **Rename layer** — `rename-map.json` records the semantic renames applied to
  `src/` (the bundle's own opaque short names → reviewed names); `tools/derive.mjs`
  re-applies it on every re-cut, and `tools/audit.js` + `tools/verify-rename.mjs`
  + `tools/check-chunk.mjs` re-prove it. A capture refresh re-authors the campaign
  (`node tools/apply-names.mjs --list` for the preflight verdicts) before the
  derived layers are re-cut — the map is valid for one build only.

## Fleet status

<!-- mirror-status:start — feeds _standard/REPO-INDEX.md. Update ONLY your own mirror's block; never edit the shared index (PLAN §8). Rebuild: node _standard/build-index.mjs -->
<!-- cols: cls=classification · ver=verify 0 problems · upd=drift probe · man=manifest · rdbl=readable re-derived · src=reversed src · boot=boot test · top=offline-mirror topic · tag=backup tag · staged=staged not committed -->
| # | repo | cls | ver | upd | man | rdbl | src | boot | top | tag | staged |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 301 | roadster-flying-car | mirror | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
<!-- mirror-status:end -->
