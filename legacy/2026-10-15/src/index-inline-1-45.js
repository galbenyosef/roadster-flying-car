// index-inline-1 45 — math
// Lines 92640-92973 of readable/index-inline-1.pretty.js (statement-aligned).
const ORBIT = {
  dur: 44,
  setup() {
    ORB.on = true;
    applyVehicle(VSEL());
    resetLaunch(0);
    Object.assign(LAUNCH, { st: "count", t: 0 });
    ROCKET.g.visible = true;
    const bb = new THREE.Box3().setFromObject(ROCKET.g);
    ORB.top = bb.max.y - ROCKET.g.position.y + 0.2;
    place(VP[0], VP[1], Math.PI / 2);
    S.armed = true;
    S.spool = 1.2;
    S.bayK = 1;
    RIVALS[0].g.visible = true;
    RIVALS[0].g.position.set(VP[0] - 14, 0, VP[1] + 8);
    RIVALS[0].g.rotation.y = -0.6;
    rivalTags(true);
    rivalWheels();
    ORB.space = null;
  },
  cues: [
    [0.4, () => showSub("MAE", "Payload seat, sugar. You earned it.", 4)],
    [5, () => radio("VEX", "orbit", true)],
    [
      9,
      () =>
        showSub(
          "CONTROL",
          "Skyline One, you are go for launch. Roadster is secured.",
          3.5,
        ),
    ],
    [
      22,
      () => {
        const sp = spaceBuild();
        composer.passes[0].scene = sp.sc;
        skyG.visible = false;
        orbitCredits(true);
      },
    ],
    [27, () => showSub("ZERO", "( a hand on the window )", 3)],
    [33, () => showSub("MAE", "Look at that view. Come home safe, Zero.", 5)],
  ],
  cam(t, dt) {
    const V = (a, b, c) => new THREE.Vector3(a, b, c),
      m = LS.mount,
      R = ROCKET.g.position;
    if (t < 6) {
      const u = easeIO(clamp(t / 5.5)),
        top = V(m.x, R.y + ORB.top, m.z);
      S.x = lerp(VP[0], top.x, u);
      S.z = lerp(VP[1], top.z, u);
      S.y = lerp(0.2, top.y, u) + Math.sin(u * Math.PI) * 18;
      S.yaw = Math.PI / 2;
      S.thrust = 1;
      return { p: V(m.x - 36, 9, m.z - 150), tg: V(S.x, S.y, S.z), fov: 40 };
    }
    S.x = m.x + (R.x - m.x);
    S.z = m.z;
    S.y = R.y + ORB.top;
    S.thrust = 0;
    if (t < 22) {
      if (LAUNCH.st !== "up")
        return {
          p: V(m.x - 36, 9, m.z - 150),
          tg: V(m.x, R.y + ORB.top * 0.6, m.z),
          fov: lerp(40, 34, clamp((t - 6) / 4)),
        };
      const sh = launchCam(LAUNCH.t);
      sh.tg = V(R.x, R.y + ORB.top * 0.8, R.z);
      return sh;
    }
    const sp = ORB.space;
    if (!sp)
      return {
        p: V(R.x - 20, R.y - 10, R.z - 60),
        tg: V(R.x, R.y + ORB.top, R.z),
        fov: 46,
      };
    const u = t - 22;
    sp.rc.rotation.set(
      Math.sin(u * 0.2) * 0.08,
      u * 0.06,
      Math.sin(u * 0.15) * 0.05,
    );
    sp.rc.position.y = Math.sin(u * 0.5) * 0.3;
    if (sp.rc.userData) sp.E.rotation.y += dt * 0.004;
    const a = 0.6 + u * 0.05;
    return {
      p: V(Math.sin(a) * 9, 1.6 + u * 0.08, Math.cos(a) * 9),
      tg: V(0, -1.2 - u * 0.04, 0),
      fov: lerp(46, 52, clamp(u / 20)),
    };
  },
};
function startOrbit(k) {
  STORY.on = true;
  STORY.cur = k;
  clearMissionProps();
  M = null;
  mission = null;
  startCut(ORBIT, () => orbitEnd(k));
}
function orbitEnd(k) {
  ORB.on = false;
  composer.passes[0].scene = scene;
  skyG.visible = true;
  orbitCredits(false);
  RIVALS[0].g.visible = false;
  rivalTags(false);
  rivalWheels();
  resetLaunch(0);
  STORY.done = Math.max(STORY.done, k + 1);
  store.set("rfc_story", String(STORY.done));
  startFree();
  flash(
    "STORY COMPLETE",
    "The whole city is yours. Daily Run, events and secret spots are waiting.",
    4.5,
  );
}
BARKS.VEX.boost = ["Not today, rookie!", "Catch this.", "Too slow. Again."];
BARKS.VEX.orbit = [
  "...Go on, Zero. Show them what the Strip looks like from up there.",
];

/* ---- per-frame hook ---- */
function v22Tick(rdt, dt) {
  if (ORB.on && LAUNCH.st === "up" && phase === "cut") {
    const f = clamp(LAUNCH.y / 1800);
    TOD.cur = todMix(TODP.golden, TODP.night, f);
    todApply(TOD.cur);
  }
}

// share line on the result screen: a challenge code for tests, a copyable result for the Daily Run
function shareCalc(ok) {
  if (!M) return;
  if (M.def.id === "tutorial") {
    M.shareHTML = "";
    return;
  }
  const d = M.def,
    tm = M.lastTime;
  M.shareHTML = "";
  let txt = "";
  if (d.id === "daily" && ok) txt = dailyLine();
  else if (
    (ok && tm != null && !d.hidden && !d.race) ||
    (ok && d.race && tm != null)
  )
    txt = `Beat my ${d.t}: ${tm.toFixed(2)} s · ROADSTER challenge ${chalMake(d.id, tm)}`;
  if (CHAL.on && CHAL.on.id === d.id && ok && tm != null) {
    const g = CHAL.on.t - tm;
    M.chalTxt =
      g >= 0
        ? `<b style="color:#6ee7a8">CHALLENGE WON</b> · ${g.toFixed(2)} s faster`
        : `<b style="color:#ff8a7a">CHALLENGE LOST</b> · ${(-g).toFixed(2)} s short`;
  }
  if (txt) {
    M.shareTxt = txt;
    M.shareHTML = `<button class="gbtn" id="rshare" style="margin-top:8px">${d.id === "daily" ? "COPY RESULT" : "COPY CHALLENGE"}</button>`;
  }
}
document.addEventListener("click", async (e) => {
  if (!e.target || e.target.id !== "rshare" || !M || !M.shareTxt) return;
  let ok = false;
  try {
    await navigator.clipboard.writeText(M.shareTxt);
    ok = true;
  } catch (_) {}
  e.target.textContent = ok ? "COPIED ✓" : M.shareTxt;
  if (!ok) {
    e.target.style.whiteSpace = "normal";
    e.target.style.textAlign = "left";
  }
});
$("dailyBtn").addEventListener("click", () => {
  STORY.on = false;
  CHAL.on = null;
  const d = dailyInfo();
  startMission(MIS.findIndex((m) => m.id === "daily"));
  flash(`DAILY RUN ${d.n}`, `${d.spot[3]} · ${d.bonus} pays ×2 · 60 s`, 3);
});
$("chalGo").addEventListener("click", () => {
  if (!chalStart($("chalIn").value))
    $("chalIn").value = "Not a ROADSTER challenge code";
});
try {
  const h = location.hash || "";
  if (h.startsWith("#c=")) $("chalIn").value = decodeURIComponent(h.slice(3));
} catch (e) {}
function dailyMatch(a) {
  const b = dailyInfo().bonus;
  return b === "AIRTIME"
    ? /AIR/.test(a)
    : b === "DRIFT"
      ? /DRIFT/.test(a)
      : b === "NEAR MISS"
        ? /NEAR/.test(a)
        : /SPIN|REVERSE/.test(a);
}
/* ================= V23: first drive tutorial, plate reveal, clear missions, honest hover ================= */
var ONCE = { arm: false, hover: false },
  TUT = { live: false },
  TUTR = null;
const KY = (k) =>
  isTouch
    ? {
        gas: "GAS",
        brake: "BRAKE",
        rocket: "ROCKET",
        hover: "HOVER",
        boost: "BOOST",
      }[k]
    : { gas: "W", brake: "S", rocket: "SHIFT", hover: "SPACE", boost: "B" }[k];

/* ---- hover: a precise, slow flight mode. Boost is the fast one. ---- */
const HOV_CAP = 24,
  BOOST_G = 26,
  BOOST_A = 32,
  BOOST_CAP = 110; // boost: +26 m/s² on the road, 32 m/s² (3.3 g) in the air, up to 110 m/s
// m/s, about 54 mph, top hover cruise
function airVec(dt, th, I) {
  // the jets carry half the velocity round with the nose; turning never adds speed
  if (!S.ball) {
    const a = S.steer * 1.25 * dt * 0.5,
      c = Math.cos(a),
      s = Math.sin(a),
      x = S.vx,
      z = S.vz;
    S.vx = x * c + z * s;
    S.vz = z * c - x * s;
  }
  const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)],
    rt = [Math.cos(S.yaw), -Math.sin(S.yaw)];
  let vf = S.vx * fw[0] + S.vz * fw[1],
    vl = S.vx * rt[0] + S.vz * rt[1];
  // sideways slip dies away at 3/s, never harder than 1.3 g
  const q = vl * Math.exp(-3 * dt),
    cp = 12.8 * dt;
  vl = Math.abs(vl - q) > cp ? vl - Math.sign(vl) * cp : q;
  if (vf < 0) vf *= Math.exp(-1.2 * dt);
  else if (th === 1) {
    if (vf > HOV_CAP) vf = Math.max(HOV_CAP, vf - 6 * dt);
    else if (!I.thr) vf *= Math.exp(-0.45 * dt);
  }
  S.vx = fw[0] * vf + rt[0] * vl;
  S.vz = fw[1] * vf + rt[1] * vl;
}

/* ---- the plate reveal: once per mission, staged like a car launch film ---- */
const REVEAL_DUR = 5.4;
function revealOK() {
  return (
    !ONCE.arm &&
    showOn &&
    phase === "play" &&
    !S.air &&
    !(M && !M.done && (M.def.race || M.def.id === "chase"))
  );
}
const RSHOT = [
  {
    t0: 0,
    t1: 1.05,
    k: "REAR BAY · 01 / 04 · LATCH",
    s: "ELECTROMAGNETIC LATCH · RELEASE IN 40 MS",
    co: ["LATCH", "electromagnetic · 40 ms"],
    a: () => new THREE.Vector3(0, PY - PH, PZ + 0.03),
    P: [
      [-1.9, 0.5, 4.8],
      [-1.4, 0.52, 4.2],
    ],
    L: [
      [0, 0.45, 2.3],
      [0, 0.48, 2.32],
    ],
    f: [28, 25],
  },
  {
    t0: 1.05,
    t1: 2.55,
    k: "REAR BAY · 02 / 04 · HINGE",
    s: "SPRING-DAMPED HINGE · 129°",
    co: ["HINGE 129°", "spring-damped"],
    a: () => new THREE.Vector3(PW * 0.42, PY, PZ),
    P: [
      [1.9, 1.05, 4.9],
      [1.5, 1.15, 4.3],
    ],
    L: [
      [0, 0.62, 2.3],
      [0, 0.64, 2.3],
    ],
    f: [30, 28],
  },
  {
    t0: 2.55,
    t1: 3.75,
    k: "REAR BAY · 03 / 04 · THRUSTERS",
    s: "4 × COLD-GAS THRUSTERS · DEPLOY +110 MM",
    co: ["4 × THRUSTERS", "deploy +110 mm"],
    a: () => new THREE.Vector3(BAYP[1][0], BAYP[1][1], 2.37),
    P: [
      [0.35, 0.55, 4.3],
      [0.2, 0.52, 3.35],
    ],
    L: [
      [0, 0.5, 2.3],
      [0, 0.5, 2.32],
    ],
    f: [30, 24],
  },
  {
    t0: 3.75,
    t1: 5.0,
    k: "REAR BAY · 04 / 04 · SPOOL",
    s: "SPOOL 1.2 S · LIFT 6 M/S · BOOST 2 G",
    co: ["ONLINE", "spool 1.2 s · cold gas"],
    a: () => new THREE.Vector3(0, PY - PH / 2, 2.37),
    P: [
      [0.2, 0.52, 3.35],
      [2.2, 1.9, 7.6],
    ],
    L: [
      [0, 0.5, 2.3],
      [0, 0.7, -1],
    ],
    f: [24, 52],
  },
];
