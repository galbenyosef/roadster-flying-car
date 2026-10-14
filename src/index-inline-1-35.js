// index-inline-1 35 — math
// Lines 89481-89803 of readable/index-inline-1.pretty.js (statement-aligned).
const SHOWDOWN = {
  dur: 10,
  setup() {
    rivalTags(false);
  },
  cues: [
    [
      0.2,
      () =>
        showSub(
          "VEX · CHROME KINGS",
          "Last race, Zero. Two laps, the whole Strip. Winner owns the night.",
          3.6,
        ),
    ],
    [
      3.3,
      () => {
        vsShow(true);
        audio.hit();
        const f = byId("flash");
        f.classList.remove("fl", "fb");
        void f.offsetWidth;
        f.classList.add("fl");
      },
    ],
    [5.8, () => vsShow(false)],
    [
      6.1,
      () =>
        showSub(
          "CONTROL",
          "Six corners, one of them a left. Watch the arrows. Every gate counts.",
          3.4,
        ),
    ],
    [8.4, () => audio.riser(1.5)],
  ],
  cam(t) {
    const p = pathAt(RACE.off - 14),
      f = [p.tx, p.tz],
      G = [p.x, p.z],
      V = (x, y, z) => new THREE.Vector3(x, y, z),
      r = [-p.tz, p.tx];
    if (t < 3.3) {
      const e = easeIO(t / 3.3);
      return {
        p: V(
          G[0] - f[0] * lerp(34, 4, e) + r[0] * 7.5,
          lerp(0.7, 1, e),
          G[1] - f[1] * lerp(34, 4, e) + r[1] * 7.5,
        ),
        tg: V(
          G[0] + f[0] * lerp(-14, 6, e),
          0.8,
          G[1] + f[1] * lerp(-14, 6, e),
        ),
        fov: 36,
      };
    }
    if (t < 5.8) {
      const e = easeIO((t - 3.3) / 2.5);
      return {
        p: V(
          G[0] + f[0] * lerp(18, 13, e),
          lerp(1.1, 1.3, e),
          G[1] + f[1] * lerp(18, 13, e),
        ),
        tg: V(G[0] - f[0] * 4, 0.7, G[1] - f[1] * 4),
        fov: lerp(42, 36, e),
      };
    }
    const e = easeIO((t - 5.8) / 4.2);
    return {
      p: V(
        G[0] - f[0] * lerp(12, 34, e),
        lerp(2, 42, e),
        G[1] - f[1] * lerp(12, 34, e),
      ),
      tg: V(
        G[0] + f[0] * lerp(20, 170, e),
        lerp(1, 6, e),
        G[1] + f[1] * lerp(20, 170, e),
      ),
      fov: 44,
    };
  },
};
function finishCam() {
  const G = RACE.gates[RACE.gates.length - 1],
    p = pathAt(G.s),
    rt = [-p.tz, p.tx],
    e = easeIO(clamp(cinematic.t / cinematic.dur)),
    V = (a, b, c) => new THREE.Vector3(a, b, c);
  return {
    p: V(
      G.x + rt[0] * 12.5 - p.tx * lerp(10, 6, e),
      1.3,
      G.z + rt[1] * 12.5 - p.tz * lerp(10, 6, e),
    ),
    tg: V(G.x - p.tx * lerp(4, 0, e), 1.4, G.z - p.tz * lerp(4, 0, e)),
    fov: lerp(52, 46, e),
  };
}

/* ================= V18: camera spring, speed lines, combos, air spins, replay, photo mode, radio ================= */
// smooth noise for camera shake (no per-frame random jitter)
function smoothNoise(t, a, b, c) {
  return (
    Math.sin(t * a) * 0.6 +
    Math.sin(t * b + 1.7) * 0.3 +
    Math.sin(t * c + 4.1) * 0.1
  );
}
let hitStop = 0,
  boostKick = 0,
  bPrev = false,
  camRoll = 0,
  camSpring = false,
  rplLand = 0;
const camOff = new THREE.Vector3(),
  camOffV = new THREE.Vector3();

/* ---- speed lines + vignette: only when it is genuinely fast ---- */
const SPEED_FX = { cv: byId("speedfx"), k: 0, L: [] };
SPEED_FX.x = SPEED_FX.cv.getContext("2d");
function sfxSize() {
  const s = isTouch ? 0.45 : 0.6;
  SPEED_FX.cv.width = Math.max(2, Math.round(innerWidth * s));
  SPEED_FX.cv.height = Math.max(2, Math.round(innerHeight * s));
}
sfxSize();
addEventListener("resize", sfxSize);
for (let i = 0; i < 46; i++)
  SPEED_FX.L.push({
    a: Math.random() * 6.283,
    r: 0.25 + Math.random() * 0.75,
    s: 0.6 + Math.random() * 0.8,
    w: Math.random(),
  });
function speedFx(dt) {
  const hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  const want =
    phase === "play" && !cinematic.on && camMode !== 2
      ? clamp((hs - 38) / 36) * 0.75 +
        (carState.thrust === 2 ? 0.4 : 0) +
        boostKick * 0.35
      : 0;
  SPEED_FX.k += (Math.min(1, want) - SPEED_FX.k) * Math.min(1, dt * 5);
  byId("vig").style.opacity = (SPEED_FX.k * 0.85).toFixed(3);
  const x = SPEED_FX.x,
    W = SPEED_FX.cv.width,
    H = SPEED_FX.cv.height;
  if (SPEED_FX.k < 0.02) {
    if (SPEED_FX.on) {
      x.clearRect(0, 0, W, H);
      SPEED_FX.on = false;
    }
    return;
  }
  SPEED_FX.on = true;
  x.clearRect(0, 0, W, H);
  const cx = W / 2,
    cy = H * 0.47,
    R = Math.hypot(W, H) * 0.55;
  x.lineCap = "round";
  for (const l of SPEED_FX.L) {
    l.r += dt * (1.5 + l.s * 2.2) * (0.6 + SPEED_FX.k);
    if (l.r > 1) {
      l.r = 0.25 + Math.random() * 0.1;
      l.a = Math.random() * 6.283;
      l.w = Math.random();
    }
    const r0 = R * (0.34 + l.r * 0.72),
      r1 = r0 + R * (0.05 + 0.17 * SPEED_FX.k) * l.s,
      ca = Math.cos(l.a),
      sa = Math.sin(l.a) * 0.6;
    x.strokeStyle = `rgba(235,245,255,${((0.08 + 0.24 * l.w) * SPEED_FX.k * Math.min(1, (l.r - 0.25) * 4)).toFixed(3)})`;
    x.lineWidth = (1 + l.w * 1.4) * (W / 900);
    x.beginPath();
    x.moveTo(cx + ca * r0, cy + sa * r0);
    x.lineTo(cx + ca * r1, cy + sa * r1);
    x.stroke();
  }
}

/* ---- combo: chain tricks inside a 4 s window, the multiplier climbs to x5, a crash kills it ---- */
const COMBO = {
  n: 0,
  mult: 1,
  t: 0,
  bank: 0,
  show: 0,
  best: +(store.get("rfc_combo") || 0),
};
const COMBO_WIN = 4;
function comboAdd(pts) {
  COMBO.n++;
  COMBO.mult = Math.min(5, 1 + 0.5 * (COMBO.n - 1));
  const p = Math.round(pts * COMBO.mult);
  COMBO.bank += p;
  COMBO.t = COMBO_WIN;
  if (COMBO.n >= 2) {
    audio.shot(420 + COMBO.n * 70, 440 + COMBO.n * 75, 0.14, 0.07, "triangle");
    byId("combo").classList.remove("bump");
    void byId("combo").offsetWidth;
    byId("combo").classList.add("bump");
  }
  return p;
}
function comboEnd(broken) {
  const n = COMBO.n,
    bank = COMBO.bank;
  if (n >= 2) {
    if (broken) {
      pop("COMBO BROKEN", 0, true);
    } else {
      setT("cbM", `CHAIN ×${COMBO.mult.toFixed(1).replace(".0", "")}`);
      setT("cbT", `${n} TRICKS · ${bank.toLocaleString("en-US")} PTS`);
      COMBO.show = 1.6;
      audio.chime();
      if (n >= 3) rplHint();
    }
    if (bank > COMBO.best && !broken) {
      COMBO.best = bank;
      store.set("rfc_combo", String(bank));
      if (n >= 3)
        setT("cbT", `NEW BEST CHAIN · ${bank.toLocaleString("en-US")} PTS`);
    }
  }
  COMBO.n = 0;
  COMBO.mult = 1;
  COMBO.t = 0;
  COMBO.bank = 0;
}
function comboTick(dt) {
  const el = byId("combo");
  if (phase !== "play") {
    return;
  }
  if (COMBO.n > 0) {
    if (SCORE.drift > 0 || (carState.air && (carState.ball || !carState.armed)) || carState.loop)
      COMBO.t = Math.max(COMBO.t, 0.7);
    COMBO.t -= dt;
    if (COMBO.t <= 0) comboEnd(false);
  }
  if (COMBO.n >= 2) {
    setT("cbM", `×${COMBO.mult.toFixed(1).replace(".0", "")}`);
    setT(
      "cbT",
      `${COMBO.n} TRICKS · ${COMBO.bank.toLocaleString("en-US")} PTS`,
    );
    byId("cbBar").style.transform =
      `scaleX(${clamp(COMBO.t / COMBO_WIN).toFixed(3)})`;
    el.classList.add("on");
  } else if (COMBO.show > 0) {
    COMBO.show -= dt;
    byId("cbBar").style.transform = "scaleX(0)";
    el.classList.add("on");
  } else el.classList.remove("on");
}

/* ---- air spins: steer while ballistic to rotate, land it straight (or backwards for 180 / 540) ---- */
const SPIN_PTS = [0, 400, 900, 1500, 2400, 3500];
function landSpin(fw) {
  const hv = Math.hypot(carState.vx, carState.vz),
    vh = Math.atan2(-carState.vx, -carState.vz),
    slip = hv > 2 ? angleDelta(carState.yaw, vh) : 0,
    a = Math.abs(slip),
    spin = Math.abs(carState.spinA || 0),
    n = Math.round(spin / Math.PI);
  carState.spinA = 0;
  if (a < 1.25) {
    carState.v = hv * Math.max(0.5, Math.cos(slip));
    carState.vyaw = hv > 2 ? vh : carState.yaw;
    if (a > 0.2) carState.dr = Math.min(1, a * 1.3);
  } else if (a < 2.15) {
    carState.v = hv * 0.38;
    carState.vyaw = vh;
    carState.dr = 1;
  } else {
    carState.v = -Math.min(9, hv * 0.3);
    carState.vyaw = carState.yaw;
    carState.dr = 0;
  }
  if (n >= 1 && !carState.hovUsed && spin > Math.PI * 0.8) {
    const err = n % 2 ? Math.PI - a : a,
      k = Math.min(n, 5),
      deg = n * 180;
    if (err < 0.62) {
      pop(n % 2 ? `${deg} · REVERSE` : `${deg} SPIN`, SPIN_PTS[k]);
      rplHint();
      if (n >= 4) {
        store.set("rfc_720", String(+(store.get("rfc_720") || 0) + 1));
        checkUnlocks();
      }
    } else pop(`SKETCHY ${deg}`, Math.round(SPIN_PTS[k] * 0.35));
  }
}

/* ---- fail forward: a crash in a stunt test puts you back at the start, the clock waits ---- */
const STUNTY = new Set([
  "ramps",
  "truck",
  "bigair",
  "loop",
  "stuntshow",
  "drift",
]);
function wipeout(v) {
  comboEnd(true);
  if (!(currentMission && !currentMission.done && STUNTY.has(currentMission.def.id))) return false;
  carState.crash = Math.min(carState.crash, 0.9);
  currentMission.wipes = (currentMission.wipes || 0) + 1;
  flash(
    "WIPEOUT",
    `${v.toFixed(1)} m/s · back to the start · clock paused`,
    1.4,
  );
  return true;
}

/* ---- Chrome Kings on the radio ---- */
