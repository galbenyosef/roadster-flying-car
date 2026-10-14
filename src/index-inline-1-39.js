// index-inline-1 39 — byid
// Lines 90732-91081 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const _au = audio.update;
  let empty = false;
  audio.update = function (v, thr, thrust, onRoad, air, scr, spool) {
    _au.apply(this, arguments);
    if (!this.ok) return;
    const t = this.c.currentTime;
    if (!this.whO) {
      const o = this.c.createOscillator();
      o.type = "sine";
      o.frequency.value = 700;
      const g = this.c.createGain();
      g.gain.value = 0;
      o.connect(g);
      g.connect(this.m);
      o.start();
      this.whO = o;
      this.whG = g;
    }
    if (thrust && carState.tank < 25) {
      const k = 1 - carState.tank / 25,
        slot = Math.floor(t / 0.11),
        h = Math.sin(slot * 12.9898) * 43758.5453,
        rnd = h - Math.floor(h);
      if (rnd < 0.2 + 0.55 * k) this.hiss.g.gain.setTargetAtTime(0, t, 0.006);
    }
    const hk = clamp((carState.heat - 55) / 45);
    this.whO.frequency.setTargetAtTime(700 + hk * 1500, t, 0.12);
    this.whG.gain.setTargetAtTime(hk * hk * 0.05, t, 0.12);
    const e = carState.tank <= 0 && carState.armed;
    if (e && !empty) {
      this.noise(1100, 170, 0.17, 0.5, "bandpass");
      this.shot(150, 62, 0.15, 0.2, "square");
    }
    empty = e;
  };
}

/* ---- #10 photo finish: only inside one car length, the world holds 1.0 s on the line ---- */
const PHOTO_FINISH = { on: false, t: 0, dur: 1 };
const ZONE_TAG = (() => {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 64;
  const x = cv.getContext("2d");
  x.font = "800 40px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = "#fff";
  x.fillText("ZERO", 128, 46);
  const tt = new THREE.CanvasTexture(cv);
  tt.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tt,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: false,
    }),
  );
  sp.scale.set(0.16, 0.04, 1);
  sp.position.y = 2.4;
  sp.visible = false;
  car.add(sp);
  return sp;
})();
function pfCheck() {
  if (!currentMission || currentMission.pf || !RACE.on) return;
  const fin = RACE.laps * RACE.len;
  let lead = currentMission.pprog;
  for (const r of RIVALS) lead = Math.max(lead, r.prog);
  if (lead < fin) return;
  currentMission.pf = true;
  let g = 1e9;
  for (const r of RIVALS) g = Math.min(g, Math.abs(r.prog - currentMission.pprog));
  if (g < 4.6) pfStart(g);
}
function pfStart(g) {
  PHOTO_FINISH.on = true;
  PHOTO_FINISH.t = 0;
  PHOTO_FINISH.t0 = performance.now();
  PHOTO_FINISH.g = g;
  ZONE_TAG.visible = true;
  rivalTags(true);
  document.body.classList.add("cine");
  byId("cinK").textContent = "FINAL LAP · FINISH LINE";
  byId("cinT").textContent = "PHOTO FINISH";
  byId("cinS").textContent = `GAP ${g.toFixed(1)} m · LESS THAN ONE CAR`;
  byId("cinS2").textContent = "";
  byId("slowx").textContent = "HOLD";
  byId("cinT").classList.remove("go");
  void byId("cinT").offsetWidth;
  byId("cinT").classList.add("go");
  audio.whoosh();
  audio.shot(2400, 2200, 0.05, 0.1, "square");
}
function pfTick(rdt) {
  PHOTO_FINISH.t = (performance.now() - PHOTO_FINISH.t0) / 1000;
  if (PHOTO_FINISH.t >= PHOTO_FINISH.dur) {
    PHOTO_FINISH.on = false;
    ZONE_TAG.visible = false;
    document.body.classList.remove("cine");
    camSpring = false;
    snapCam();
    const f = byId("flash");
    f.classList.remove("fl", "fb");
    void f.offsetWidth;
    f.classList.add("fb");
  }
}
function pfCam() {
  const G = RACE.gates[RACE.gates.length - 1],
    p = pathAt(G.s),
    rt = [-p.tz, p.tx];
  camera.position.set(
    G.x + rt[0] * 12.5 - p.tx * 1.5,
    1.3,
    G.z + rt[1] * 12.5 - p.tz * 1.5,
  );
  camera.lookAt(G.x, 1.1, G.z);
  camera.fov = 40;
  camera.updateProjectionMatrix();
}

/* ---- #9 the city counts the rocket down ---- */
const COUNTDOWN = (() => {
  const L = [
    "T-10",
    "T-9",
    "T-8",
    "T-7",
    "T-6",
    "T-5",
    "T-4",
    "T-3",
    "T-2",
    "T-1",
    "LIFTOFF",
  ];
  return L.map((s) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 192;
    const x = cv.getContext("2d");
    x.fillStyle = "#07080c";
    x.fillRect(0, 0, 512, 192);
    x.fillStyle = "#fff";
    x.font = `900 ${s.length > 4 ? 96 : 132}px Saira, Arial Black, sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = "#bfe9ff";
    x.shadowBlur = 26;
    x.fillText(s, 256, 100, 480);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
})();
const DIGIT_MATERIAL = new THREE.MeshBasicMaterial({
  map: COUNTDOWN[0],
  color: new THREE.Color(1.5, 1.5, 1.5),
});
const DIGIT_MESHES = BOARDS.map((B) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(B.w, B.h), DIGIT_MATERIAL);
  m.position.set(
    B.x + Math.sin(B.rot) * 0.06,
    B.y,
    B.z + Math.cos(B.rot) * 0.06,
  );
  m.rotation.y = B.rot;
  m.visible = false;
  scene.add(m);
  return m;
});
const COUNTDOWN_STATE = { st: "idle", dig: -1, crack: false };
function digShow(i) {
  if (i === COUNTDOWN_STATE.dig) return;
  COUNTDOWN_STATE.dig = i;
  if (i < 0) {
    DIGIT_MESHES.forEach((m) => (m.visible = false));
    return;
  }
  DIGIT_MATERIAL.map = COUNTDOWN[i];
  DIGIT_MESHES.forEach((m) => (m.visible = true));
}
function cityEvent(dt) {
  const L = LAUNCH;
  walkerEvent.px = LAUNCH_SITE.mount.x;
  walkerEvent.pz = LAUNCH_SITE.mount.z;
  if (L.st === "count") {
    const n = Math.min(9, Math.floor(L.t));
    if (n !== COUNTDOWN_STATE.n) {
      COUNTDOWN_STATE.n = n;
      audio.shot(55, 55, 0.42, 0.32, "sine");
      audio.noise(160, 60, 0.3, 0.08, "lowpass");
    }
    digShow(n);
    walkerEvent.look = 1;
  } else if (L.st === "up") {
    digShow(L.t < 3 ? 10 : -1);
    walkerEvent.look = L.t < 8 ? 1 : 0;
    COUNTDOWN_STATE.n = -1;
  } else {
    digShow(-1);
    walkerEvent.look = 0;
    COUNTDOWN_STATE.n = -1;
  }
  if (L.st === "down" && L.t >= 1 && !COUNTDOWN_STATE.crack) {
    COUNTDOWN_STATE.crack = true;
    const d = Math.hypot(carState.x - LAUNCH_SITE.lz.x, carState.z - LAUNCH_SITE.lz.z),
      dl = Math.min(4, d / 343) * 1000;
    const cr = () => {
      audio.noise(6000, 1400, 0.07, 0.7, "highpass");
      audio.shot(95, 38, 0.3, 0.4, "sine");
    };
    setTimeout(cr, dl);
    setTimeout(cr, dl + 330);
  }
  if (L.st !== "down") COUNTDOWN_STATE.crack = false;
  if (L.st === "landed" && COUNTDOWN_STATE.st !== "landed") walkerEvent.wave = 4.5;
  COUNTDOWN_STATE.st = L.st;
  walkerEvent.wave = Math.max(0, walkerEvent.wave - dt);
}
// the minimap marks the 700 m witness ring while the rocket goes
function drawRing(c, sc) {
  const L = LAUNCH;
  if (L.st !== "count" && !(L.st === "up" && L.t < 10)) return;
  c.strokeStyle = "rgba(255,255,255,.85)";
  c.lineWidth = 2;
  c.setLineDash([6, 5]);
  c.beginPath();
  c.arc((LAUNCH_SITE.mount.x - carState.x) * sc, (LAUNCH_SITE.mount.z - carState.z) * sc, 700 * sc, 0, 7);
  c.stroke();
  c.setLineDash([]);
}

/* ---- #8 chapter cards and the Showdown intro play once per session ---- */
const SEEN_CH = new Set();
let finalSeen = false;

/* ---- per-frame hook ---- */
function v19Tick(rdt, dt) {
  cityEvent(dt);
  if (carState.armed && camMode === 2) camMode = 0;
}

/* ================= V20: feel — fixes, first flight, cinematics rule, music, clips, pause ================= */
// traffic never turns onto a live race or chase route; the jam holds still
TRAFBLOCK = (ax, line) =>
  (RACE.on && RACE.lines[ax] && RACE.lines[ax].includes(line)) ||
  (CHASE.on &&
    ((ax === "z" && (line === -384 || line === 0)) ||
      (ax === "x" && (line === -576 || line === 480))));
const TRAFFIC_JAM = { on: false, cars: [] };
function jamOn() {
  jamOff();
  const pick = TRAFFIC.filter((c) => c.type !== "hauler").slice(0, 16);
  let k = 0;
  for (const c of pick) {
    const lane = k % 2,
      i = k >> 1;
    c.jam = true;
    c.axis = "z";
    c.line = 96;
    c.dir = lane ? 1 : -1;
    c.pos = 262 + i * 9.6 + (lane ? 4 : 0);
    c.v = 0;
    c.kt = 0;
    c.ox = c.oz = c.oyaw = 0;
    TRAFFIC_JAM.cars.push(c);
    k++;
  }
  TRAFFIC_JAM.on = true;
  updateTraffic(0);
}
function jamOff() {
  for (const c of TRAFFIC_JAM.cars) c.jam = false;
  TRAFFIC_JAM.cars = [];
  TRAFFIC_JAM.on = false;
}

/* ---- saves: one code carries everything ---- */
function saveCode() {
  const o = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("rfc_")) o[k] = localStorage.getItem(k);
    }
  } catch (e) {}
  return "RDSTR1." + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function loadCode(s) {
  s = (s || "").trim();
  if (!s.startsWith("RDSTR1.")) return false;
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(s.slice(7)))));
    let n = 0;
    for (const k in o) {
      if (k.startsWith("rfc_")) {
        store.set(k, o[k]);
        n++;
      }
    }
    return n > 0;
  } catch (e) {
    return false;
  }
}
byId("saveCopy").addEventListener("click", async () => {
  const c = saveCode(),
    t = byId("saveTxt");
  t.value = c;
  t.select();
  let ok = false;
  try {
    await navigator.clipboard.writeText(c);
    ok = true;
  } catch (e) {
    try {
      ok = document.execCommand("copy");
    } catch (_) {}
  }
  byId("saveMsg").textContent = ok
    ? "Copied. Keep it somewhere safe; paste it here on any device to continue."
    : "Select the code above and copy it.";
});
byId("saveLoad").addEventListener("click", () => {
  if (loadCode(byId("saveTxt").value)) {
    byId("saveMsg").textContent = "Loaded. Restarting…";
    setTimeout(() => location.reload(), 600);
  } else byId("saveMsg").textContent = "That is not a ROADSTER save code.";
});

/* ---- cinematics never steal the wheel twice: full once per save, then 0.4 s of slow motion you drive through ---- */
const SEEN = new Set(
  (() => {
    try {
      return JSON.parse(store.get("rfc_seen") || "[]");
    } catch (e) {
      return [];
    }
  })(),
);
const saveSeen = () => store.set("rfc_seen", JSON.stringify([...SEEN]));
const MINI_SLOW = { t: 0 };
function miniSlow() {
  MINI_SLOW.t = 0.4;
}
let watchK = null,
  watchT = 0;
