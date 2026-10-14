// index-inline-1 42 — currentmission
// Lines 91759-92058 of readable/index-inline-1.pretty.js (statement-aligned).
function checkUnlocks() {
  for (const id in EARN) {
    if (ECONOMY.skins.has(id)) continue;
    const e = EARN[id];
    if (e.have() >= eNeed(e)) {
      ECONOMY.skins.add(id);
      saveEco();
      const sk = SKINS.find((s) => s.id === id);
      flash("SKIN UNLOCKED", `${sk.n} · equip it in the garage`, 2.6);
      audio.chime();
    }
  }
}

/* ---- golden hour and night: one time-of-day system for sky, sun, fog, windows and bloom ---- */
const TOD_PRESETS = {
  day: {
    zen: [0.13, 0.32, 0.7],
    hor: [0.62, 0.74, 0.86],
    cl: [0.95, 0.97, 1],
    gr: [0.55, 0.6, 0.66],
    star: 0,
    sunC: [1, 0.94, 0.85],
    sunI: 3.2,
    el: 66,
    hs: [0.81, 0.89, 1],
    hg: [0.43, 0.38, 0.32],
    hI: 1.45,
    fog: [0.66, 0.74, 0.81],
    fd: 0.0009,
    exp: 1,
    bl: 0.45,
    env: 1,
    win: 0,
  },
  golden: {
    zen: [0.17, 0.24, 0.5],
    hor: [1, 0.58, 0.32],
    cl: [1, 0.74, 0.56],
    gr: [0.55, 0.42, 0.38],
    star: 0,
    sunC: [1, 0.62, 0.34],
    sunI: 2.9,
    el: 12,
    hs: [1, 0.74, 0.52],
    hg: [0.34, 0.24, 0.16],
    hI: 0.95,
    fog: [0.9, 0.6, 0.42],
    fd: 0.0012,
    exp: 1.0,
    bl: 0.6,
    env: 0.55,
    win: 0.3,
  },
  night: {
    zen: [0.006, 0.012, 0.04],
    hor: [0.05, 0.04, 0.12],
    cl: [0.08, 0.08, 0.14],
    gr: [0.02, 0.02, 0.04],
    star: 1,
    sunC: [0.6, 0.7, 1],
    sunI: 0.3,
    el: 38,
    hs: [0.3, 0.38, 0.62],
    hg: [0.04, 0.04, 0.07],
    hI: 0.24,
    fog: [0.04, 0.05, 0.11],
    fd: 0.0011,
    exp: 1.05,
    bl: 1.0,
    env: 0.12,
    win: 1.35,
  },
};
const TIME_OF_DAY = {
  mode: "golden",
  cur: JSON.parse(JSON.stringify(TOD_PRESETS.golden)),
  clock: 0,
  want: null,
};
function todMix(a, b, f) {
  const o = {};
  for (const k in a)
    o[k] = Array.isArray(a[k])
      ? a[k].map((v, i) => lerp(v, b[k][i], f))
      : lerp(a[k], b[k], f);
  return o;
}
function todCycle() {
  const p = (TIME_OF_DAY.clock / 720) % 1,
    K = [
      [0, "day"],
      [0.42, "day"],
      [0.5, "golden"],
      [0.58, "night"],
      [0.88, "night"],
      [0.95, "golden"],
      [1, "day"],
    ];
  for (let i = 0; i < K.length - 1; i++) {
    if (p >= K[i][0] && p <= K[i + 1][0]) {
      const f = easeIO((p - K[i][0]) / Math.max(1e-6, K[i + 1][0] - K[i][0]));
      return todMix(TOD_PRESETS[K[i][1]], TOD_PRESETS[K[i + 1][1]], f);
    }
  }
  return TOD_PRESETS.day;
}
const scratchColor = new THREE.Color();
function todApply(P) {
  const U = skyMat.uniforms;
  U.uZen.value.set(...P.zen);
  U.uHor.value.set(...P.hor);
  U.uCl.value.set(...P.cl);
  U.uGr.value.set(...P.gr);
  U.uStar.value = P.star;
  U.uSunC.value.set(...P.sunC);
  const el = THREE.MathUtils.degToRad(90 - P.el);
  sunDir.setFromSphericalCoords(1, el, THREE.MathUtils.degToRad(35));
  U.uSunD.value.copy(sunDir);
  sun.color.setRGB(...P.sunC);
  sun.intensity = P.sunI;
  hemi.color.setRGB(...P.hs);
  hemi.groundColor.setRGB(...P.hg);
  hemi.intensity = P.hI;
  scene.fog.color.setRGB(...P.fog);
  scene.fog.density = P.fd;
  renderer.toneMappingExposure = P.exp;
  bloom.strength = P.bl;
  scene.environmentIntensity = P.env;
  for (const m of CITYMATS) m.emissiveIntensity = P.win;
}
function todTarget() {
  if (currentMission)
    return currentMission.def.id === "final"
      ? "night"
      : currentMission.story != null || STORY.on
        ? "golden"
        : "day";
  if (phase === "play" || phase === "replay" || phase === "photo")
    return "cycle";
  if (phase === "intro") return "day";
  return "golden";
}
function todTick(dt) {
  const tg = todTarget();
  if (tg === "cycle") TIME_OF_DAY.clock += dt;
  const want = tg === "cycle" ? todCycle() : TOD_PRESETS[tg];
  const k = 1 - Math.exp(-dt * (tg === TIME_OF_DAY.mode ? 3 : 1.2));
  TIME_OF_DAY.mode = tg;
  TIME_OF_DAY.cur = todMix(TIME_OF_DAY.cur, want, k);
  todApply(TIME_OF_DAY.cur);
}
TIME_OF_DAY.clock = 720 * 0.18;

/* ---- per-frame hook ---- */
function v21Tick(rdt, dt) {
  todTick(rdt);
  ghostTick(dt);
  if (currentMission && !currentMission.done && currentMission.def.id === "chase" && currentMission.rs === "run") {
    const v = RIVALS[0];
    currentMission.dSum =
      (currentMission.dSum || 0) +
      Math.hypot(carState.x - v.g.position.x, carState.z - v.g.position.z) * dt;
    currentMission.dN = (currentMission.dN || 0) + dt;
  }
  if (currentMission && !currentMission.done && currentMission.def.id === "deck" && currentMission.onDeck && currentMission.deckLeft == null) {
    const Lc = LAUNCH;
    currentMission.deckLeft =
      Lc.st === "idle" ? Lc.cycle - Lc.t : Lc.st === "count" ? 10 - Lc.t : 0;
  }
}

window.__EARN = EARN;
window.__eNeed = eNeed;
window.__MED = (id) => {
  const m = medalOf(id);
  return m ? ` · <b style="color:${MEDAL_COLORS[m]}">${MNAME[m]}</b>` : "";
};
/* ================= V22: spread — free-roam events, signature spots, 15-chapter story, Orbit finale, Daily Run, challenges ================= */
/* ---- free-roam events: speed traps, drift zones and ramp airtime, each with 1–3 stars and a personal best ---- */
const FREE_ROAM_EVENTS = {
  traps: [],
  zones: [],
  best: (() => {
    try {
      return JSON.parse(store.get("rfc_ev") || "{}");
    } catch (e) {
      return {};
    }
  })(),
  zone: null,
};
const evSave = () => store.set("rfc_ev", JSON.stringify(FREE_ROAM_EVENTS.best));
const STARS = (n) => "★".repeat(n) + "☆".repeat(3 - n);
{
  const r = rng(2026),
    okB = (bi, bj) =>
      bi >= 0 &&
      bj >= 0 &&
      bi < BLOCK_COUNT &&
      bj < BLOCK_COUNT &&
      !["stunt", "launch", "park"].includes(district(bi, bj)),
    lines = [];
  for (let k = 2; k < BLOCK_COUNT - 1; k++) lines.push(-HALF + k * BLOCK_PITCH);
  let guard = 0;
  while (FREE_ROAM_EVENTS.traps.length < 12 && guard++ < 400) {
    const ax = r() < 0.5 ? "z" : "x",
      line = lines[(r() * lines.length) | 0],
      j = 2 + ((r() * (BLOCK_COUNT - 4)) | 0),
      mid = -HALF + j * BLOCK_PITCH + BLOCK_PITCH / 2,
      bi = ax === "z" ? blockOf(line - 1) : blockOf(mid),
      bj = ax === "z" ? blockOf(mid) : blockOf(line - 1);
    if (
      !okB(bi, bj) ||
      FREE_ROAM_EVENTS.traps.some(
        (t) =>
          Math.hypot(
            t.x - (ax === "z" ? line : mid),
            t.z - (ax === "z" ? mid : line),
          ) < 300,
      )
    )
      continue;
    FREE_ROAM_EVENTS.traps.push({
      id: "T" + FREE_ROAM_EVENTS.traps.length,
      ax,
      x: ax === "z" ? line : mid,
      z: ax === "z" ? mid : line,
    });
  }
  guard = 0;
  while (FREE_ROAM_EVENTS.zones.length < 6 && guard++ < 400) {
    const x = lines[(r() * lines.length) | 0],
      z = lines[(r() * lines.length) | 0];
    if (
      !okB(blockOf(x + 1), blockOf(z + 1)) ||
      !okB(blockOf(x - 1), blockOf(z - 1)) ||
      FREE_ROAM_EVENTS.zones.some((q) => Math.hypot(q.x - x, q.z - z) < 400) ||
      FREE_ROAM_EVENTS.traps.some((t) => Math.hypot(t.x - x, t.z - z) < 120)
    )
      continue;
    FREE_ROAM_EVENTS.zones.push({ id: "D" + FREE_ROAM_EVENTS.zones.length, x, z, r: 24 });
  }
  const post = new THREE.BoxGeometry(0.5, 6, 0.5),
    bar = new THREE.BoxGeometry(1, 0.5, 0.5),
    mat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      emissive: 0x28e0ff,
      emissiveIntensity: 2.2,
    });
  const IP = new THREE.InstancedMesh(post, mat, FREE_ROAM_EVENTS.traps.length * 2),
    IB = new THREE.InstancedMesh(bar, mat, FREE_ROAM_EVENTS.traps.length),
    M4 = new THREE.Matrix4();
  FREE_ROAM_EVENTS.traps.forEach((t, i) => {
    const w = 17,
      dx = t.ax === "z" ? 1 : 0,
      dz = t.ax === "z" ? 0 : 1;
    for (const s of [-1, 1]) {
      M4.makeTranslation(t.x + (dx * s * w) / 2, 3, t.z + (dz * s * w) / 2);
      IP.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), M4);
    }
    M4.makeScale(t.ax === "z" ? w : 1, 1, t.ax === "z" ? 1 : w).setPosition(
      t.x,
      6,
      t.z,
    );
    IB.setMatrixAt(i, M4);
  });
  scene.add(IP, IB);
  const rm = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.4, 0.4, 2),
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  FREE_ROAM_EVENTS.zones.forEach((q) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(q.r - 0.7, q.r, 64), rm);
    m.rotation.x = -Math.PI / 2;
    m.position.set(q.x, 0.3, q.z);
    scene.add(m);
  });
}
function evResult(kind, id, val, thr, fmt, pts) {
  const st = val >= thr[2] ? 3 : val >= thr[1] ? 2 : val >= thr[0] ? 1 : 0,
    prev = FREE_ROAM_EVENTS.best[id] || 0,
    pb = val > prev;
  if (pb) {
    FREE_ROAM_EVENTS.best[id] = val;
    evSave();
  }
  flash(
    `${kind} · ${STARS(st)}`,
    `${fmt(val)}${pb && prev ? " · new best" : prev ? ` · best ${fmt(prev)}` : ""}`,
    2,
  );
  if (st) pop(kind, st * 250);
}
let prevEventZ = 0,
  prevEventX = 0;
