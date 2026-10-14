// index-inline-1 29 — classlist
// Lines 87642-87857 of readable/index-inline-1.pretty.js (statement-aligned).
function setT(id, v) {
  if (_tc[id] !== v) {
    _tc[id] = v;
    $(id).textContent = v;
  }
}
let _wingSel = -1;
const _wv = [...document.querySelectorAll("#wingviz span")];
function hud(st) {
  const hs = S.air ? Math.hypot(S.vx, S.vz) : Math.abs(S.v);
  setT("spd", String(Math.round(hs * (metric ? 3.6 : MPH))));
  setT("unit", metric ? "KM/H" : "MPH");
  const stl = S.state;
  const se = $("state");
  const shown = STATE_LABEL[stl] || stl;
  if (se.textContent !== shown) {
    se.textContent = shown;
    se.className = stl;
  }
  const agl = S.y - groundH(S.x, S.z, S.y).h;
  setT("alt", `${Math.max(0, agl).toFixed(1)} m`);
  setT("air", `${Math.round(S.tank)}%`);
  $("airbar").style.width = Math.round(S.tank) + "%";
  setT("heat", `${Math.round(S.heat)}°`);
  $("heatbar").style.width = Math.round(clamp((S.heat - 25) / 75) * 100) + "%";
  const vz = S.air ? S.vy : 0;
  setT("vz", vz.toFixed(1));
  const vc =
    S.air && -vz >= LIMIT
      ? "var(--bad)"
      : S.air && -vz >= LIMIT * 0.7
        ? "var(--gold)"
        : "";
  if (_tc.vzc !== vc) {
    _tc.vzc = vc;
    $("vz").style.color = vc;
  }
  setT("wingmode", S.wingMode);
  if (_wingSel !== wingSel) {
    _wingSel = wingSel;
    _wv.forEach((s) =>
      s.classList.toggle("on", s.dataset.m === WMODES[wingSel]),
    );
  }
  setT(
    "df",
    `${Math.round(st.df / 9.81)} kg · ${((st.mu * st.geff) / 9.81).toFixed(2)} g`,
  );
  {
    let bp = null,
      bd = 1e9;
    for (const p of PADS) {
      const d = Math.hypot(p.x - S.x, p.z - S.z);
      if (d < bd) {
        bd = d;
        bp = p;
      }
    }
    setT(
      "lap",
      `${bp.name} · ${Math.round(bd)} m · ${bp.box ? "street" : Math.round(bp.y) + " m up"}`,
    );
  }
  const armB = $("tbArm");
  armB.classList.toggle("on", S.armed);
  $("tbHov").classList.toggle("dim", !S.armed);
  $("tbBst").classList.toggle("dim", !S.armed);
  if (!isTouch) drawG();
}

/* ---------------- opening film ---------------- */
const keyL = new THREE.PointLight(0xfff2e2, 0, 16, 1.4);
scene.add(keyL);
let introT = 0,
  introShot = -1,
  introGlow = 0,
  ishake = 0,
  ipunch = 0,
  icues = 0;
// opening film: the Roadster cruises up the Strip at dawn, blows past the camera, brakes, opens the bay, and takes off
const ICUT = [0, 2.6, 4.3, 6.2],
  IZ0 = 650;
const introZ = (t) => {
    const v = 32,
      tb = 6.2,
      db = 1.1;
    if (t < tb) return IZ0 - v * t;
    const u = Math.min(t - tb, db);
    return IZ0 - v * tb - (v * u - (v * u * u) / (2 * db));
  },
  introV = (t) => (t < 6.2 ? 32 : Math.max(0, 32 * (1 - (t - 6.2) / 1.1)));
const ITXT = [
  [0.45, "LAS VEGAS", "7:42 AM · the strip wakes up"],
  [2.75, "IT DRIVES.", "tri-motor · instant torque"],
  [4.45, "0–60 MPH", "in under one second"],
];
const ISND = [
  [2.95, "whoosh"],
  [3.5, "hit"],
];
const ICAM = [
  { aerial: 1, f0: 52, f1: 44 },
  { byWorld: 1, f0: 24, f1: 46 },
  {
    p0: [-2.9, 0.42, 2.1],
    p1: [-2.5, 0.5, -1.9],
    t0: [0, 0.4, 1.3],
    t1: [0, 0.45, -0.7],
    f0: 34,
    f1: 30,
  },
  {
    p0: [1.95, 0.85, 5.3],
    p1: [-0.42, 0.5, 3.15],
    t0: [0, 0.46, 2.3],
    t1: [0, 0.45, 2.28],
    f0: 40,
    f1: 29,
  },
  {
    p0: [3.4, 0.35, -5.8],
    p1: [9.5, 7, 11.5],
    t0: [0, 0.6, 0],
    t1: [0, 0.6, 0],
    f0: 46,
    f1: 63,
    lift: 1,
  },
  { orbit: 1, f0: 38, f1: 33, lift: 1 },
];
function itext(a, b) {
  const el = $("itext");
  el.innerHTML = `<div class="a">${a}</div>${b ? `<div class="b">${b}</div>` : ""}`;
  el.classList.remove("slam");
  void el.offsetWidth;
  el.classList.add("slam");
}
function icut(first) {
  const f = $("flash");
  f.classList.remove("fl", "fb");
  void f.offsetWidth;
  f.classList.add(first ? "fb" : "fl");
  ishake = first ? 0 : 0.6;
  ipunch = 1;
  if (!first) audio.hit();
}
function clearIntroLane() {
  for (const c of TRAFFIC) {
    if (
      (c.axis === "z" && c.line === 0) ||
      (c.axis === "x" && (c.line === 576 || c.line === 480))
    ) {
      let k = 0;
      do {
        c.line = -HALF + (2 + ((Math.random() * (NBK - 4)) | 0)) * P;
      } while (k++ < 20 && [0, 576, 480].includes(c.line));
    }
  }
}
function startIntro() {
  if (phase !== "gate") return;
  audio.init();
  if (isTouch) {
    try {
      const d = document.documentElement,
        rq = d.requestFullscreen || d.webkitRequestFullscreen;
      if (rq) {
        const pr = rq.call(d, { navigationUI: "hide" });
        if (pr && pr.then)
          pr.then(
            () =>
              screen.orientation &&
              screen.orientation.lock &&
              screen.orientation.lock("landscape"),
          ).catch(() => {});
      }
    } catch (_) {}
  }
  $("gate").classList.add("gone");
  setTimeout(() => {
    $("gate").hidden = true;
  }, 800);
  phase = "intro";
  introT = 0;
  introShot = -1;
  icues = 0;
  document.body.classList.add("intro");
  $("intro").hidden = false;
  $("ihero").classList.remove("on");
  $("itext").innerHTML = "";
  clearIntroLane();
  place(3.5, IZ0, 0);
  S.bayK = 0;
  audio.riser(5.6);
}
function endIntro() {
  if (phase !== "intro") return;
  phase = "title";
  document.body.classList.remove("intro");
  $("intro").hidden = true;
  $("ilines").classList.remove("on");
  place(3.5, 440, 0);
  S.bayK = 0;
  camPos.copy(camera.position);
  const T = $("title");
  T.hidden = false;
  T.classList.remove("show");
  void T.offsetWidth;
  T.classList.add("show");
}
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]),
  LV = (a, b, u) => [
    lerp(a[0], b[0], u),
    lerp(a[1], b[1], u),
    lerp(a[2], b[2], u),
  ];
