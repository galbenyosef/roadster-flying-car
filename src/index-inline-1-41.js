// index-inline-1 41 — clip
// Lines 91410-91758 of readable/index-inline-1.pretty.js (statement-aligned).
function clipStart(vert) {
  if (phase !== "replay" || CLIP.on) return;
  const mime = clipMime();
  if (!mime || !CLIP.cv.captureStream) {
    flash("CLIP", "this browser cannot record video · use PHOTO instead", 2.4);
    return;
  }
  CLIP.vert = vert;
  CLIP.cv.width = vert ? 720 : 1280;
  CLIP.cv.height = vert ? 1280 : 720;
  CLIP.ext = mime.includes("mp4") ? "mp4" : "webm";
  const vs = CLIP.cv.captureStream(30);
  try {
    if (!audio.recDest) {
      audio.recDest = audio.c.createMediaStreamDestination();
      audio.m.connect(audio.recDest);
    }
    audio.recDest.stream.getAudioTracks().forEach((tr) => vs.addTrack(tr));
  } catch (e) {}
  CLIP.chunks = [];
  try {
    CLIP.rec = new MediaRecorder(vs, {
      mimeType: mime,
      videoBitsPerSecond: vert ? 5e6 : 6e6,
    });
  } catch (e) {
    flash("CLIP", "recording is blocked here", 2);
    return;
  }
  CLIP.rec.ondataavailable = (e) => {
    if (e.data && e.data.size) CLIP.chunks.push(e.data);
  };
  CLIP.rec.onstop = () => {
    CLIP.blob = new Blob(CLIP.chunks, { type: mime.split(";")[0] });
    const v = byId("clipVid");
    v.src = URL.createObjectURL(CLIP.blob);
    byId("clipBox").hidden = false;
    setT(
      "clipMsg",
      `${CLIP.vert ? "9:16 for Reels, Shorts and X" : "16:9"} · ${(CLIP.blob.size / 1048576).toFixed(1)} MB`,
    );
  };
  REPLAY.p = 0;
  REPLAY.lastI = -1;
  REPLAY.shot = null;
  CLIP.on = true;
  document.body.classList.add("rec");
  CLIP.rec.start(250);
}
function clipFrame() {
  if (!CLIP.on) return;
  const src = renderer.domElement,
    W = CLIP.cv.width,
    H = CLIP.cv.height,
    x = CLIP.x;
  let sw = src.width,
    sh = src.height,
    sx = 0,
    sy = 0;
  const ar = W / H;
  if (sw / sh > ar) {
    const nw = sh * ar;
    sx = (sw - nw) / 2;
    sw = nw;
  } else {
    const nh = sw / ar;
    sy = (sh - nh) / 2;
    sh = nh;
  }
  x.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
  const u = (H / 1280) * (CLIP.vert ? 1 : 1.6);
  x.fillStyle = "rgba(255,255,255,.9)";
  x.font = `800 ${Math.round(30 * u)}px Saira, Arial, sans-serif`;
  x.textBaseline = "alphabetic";
  x.fillText("ROADSTER", 28 * u, H - 46 * u);
  x.fillStyle = "#FFB35C";
  x.font = `600 ${Math.round(12 * u)}px "JetBrains Mono", monospace`;
  x.fillText("THE FLYING CAR · UNOFFICIAL FAN GAME", 30 * u, H - 26 * u);
}
function clipStop() {
  if (!CLIP.on) return;
  CLIP.on = false;
  document.body.classList.remove("rec");
  try {
    CLIP.rec.stop();
  } catch (e) {}
}
byId("rplClipH").addEventListener("click", (e) => {
  e.stopPropagation();
  clipStart(false);
});
byId("rplClipV").addEventListener("click", (e) => {
  e.stopPropagation();
  clipStart(true);
});
byId("clipX").addEventListener("click", () => {
  byId("clipBox").hidden = true;
});
byId("clipDl").addEventListener("click", async () => {
  if (!CLIP.blob) return;
  const name = `roadster-clip-${Date.now()}.${CLIP.ext}`;
  if (downloadLink) {
    try {
      await downloadLink.save({ filename: name, data: CLIP.blob });
      setT("clipDl", "SAVED ✓");
      setTimeout(() => setT("clipDl", "DOWNLOAD CLIP"), 1800);
    } catch (e) {}
    return;
  }
  if (!inClaude) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(CLIP.blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
});

/* ---- per-frame hook ---- */
function v20Tick(rdt, dt) {
  MUSIC.tick(rdt);
  if (watchT > 0) {
    watchT -= rdt;
    if (watchT <= 0 || phase !== "play") {
      watchK = null;
      byId("watchChip").classList.remove("on");
    }
  }
  if (MINI_SLOW.t > 0) MINI_SLOW.t -= rdt;
}

/* ================= V21: love — medals, ghosts, earned skins, golden hour and night ================= */
/* ---- medals: bronze for a pass, silver and gold on time, score or margin ---- */
const MEDAL = {
  jam: { t: 25, s: 40 },
  launch: { t: 0.95, s: 1.2 },
  hover: { t: 18, s: 26 },
  pad: { t: 30, s: 42 },
  rings: { t: 40, s: 52 },
  drift: { t: 25, s: 35 },
  relay: { t: 92, s: 108 },
  race: { t: 96, s: 106 },
  courier: { t: 60, s: 85 },
  ramps: { t: 32, s: 50 },
  skytour: { t: 60, s: 80 },
  truck: { t: 10, s: 20 },
  stuntshow: { t: 30, s: 45 },
  loop: { t: 12, s: 22 },
  final: { t: 136, s: 143 },
  bigair: { k: "air", t: 2.6, s: 2.3, hi: true, u: " s air" },
  chase: { k: "dist", t: 30, s: 45, u: " m average" },
  deck: { k: "left", t: 30, s: 12, hi: true, u: " s to spare" },
  catch: { k: "off", t: 2, s: 4, u: " m from centre" },
};
const MNAME = ["", "BRONZE", "SILVER", "GOLD"],
  MEDAL_COLORS = ["", "#cd8a52", "#d9dde3", "#ffc84a"];
const medalOf = (id) => +(store.get("rfc_med_" + id) || 0);
function medalCalc(ok, stats) {
  if (!currentMission) return;
  const d = currentMission.def,
    R = MEDAL[d.id];
  currentMission.medal = 0;
  currentMission.medalTxt = "";
  if (!ok || !R) return;
  let v = stats.time;
  if (R.k === "air") v = currentMission.best;
  else if (R.k === "dist") v = currentMission.dN ? currentMission.dSum / currentMission.dN : 99;
  else if (R.k === "left") v = currentMission.deckLeft || 0;
  else if (R.k === "off") v = Math.hypot(carState.x - VIEWPOINT[0], carState.z - VIEWPOINT[1]);
  else if (R.k === "pts") v = stats.pts;
  if (v == null || !isFinite(v)) return;
  const better = (a, b) => (R.hi ? a >= b : a <= b);
  const m = better(v, R.t) ? 3 : better(v, R.s) ? 2 : 1;
  currentMission.medal = m;
  currentMission.medalV = v;
  const prev = medalOf(d.id);
  if (m > prev) store.set("rfc_med_" + d.id, String(m));
  const fmt = (x) =>
    R.k === "pts"
      ? `${Math.round(x).toLocaleString("en-US")}${R.u}`
      : R.k
        ? `${x.toFixed(R.k === "air" ? 2 : 1)}${R.u}`
        : `${x.toFixed(2)} s`;
  const nxt = m < 3 ? ` · ${MNAME[m + 1]} is ${fmt(m === 1 ? R.s : R.t)}` : "";
  currentMission.medalTxt = `<b style="color:${MEDAL_COLORS[m]};letter-spacing:.14em">${MNAME[m]}</b> · you ${fmt(v)}${nxt}`;
  if (m === 3) audio.seq([[200, "chime"]]);
  checkUnlocks();
}

/* ---- ghosts: your best run, driving beside you ---- */
const GHOSTABLE = new Set([
  "jam",
  "hover",
  "pad",
  "rings",
  "relay",
  "race",
  "courier",
  "ramps",
  "skytour",
  "truck",
  "loop",
  "final",
  "drift",
  "stuntshow",
  "bigair",
]);
const GHOST = (() => {
  const g = new THREE.Group(),
    m = new THREE.MeshBasicMaterial({
      color: 0x7fe8ff,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
  for (const p of RIVAL_MESH.body) {
    const o = new THREE.Mesh(p.geo, m);
    g.add(o);
  }
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 64;
  const x = cv.getContext("2d");
  x.font = "800 34px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = "#bff4ff";
  x.fillText("YOUR BEST", 128, 44);
  const tt = new THREE.CanvasTexture(cv);
  tt.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tt,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: false,
      opacity: 0.8,
    }),
  );
  sp.scale.set(0.14, 0.035, 1);
  sp.position.y = 2.3;
  g.add(sp);
  g.visible = false;
  scene.add(g);
  return { g, run: null, rec: null, acc: 0 };
})();
function ghostStart(id) {
  GHOST.g.visible = false;
  GHOST.run = null;
  GHOST.rec = GHOSTABLE.has(id) ? [] : null;
  GHOST.acc = 0;
  if (!GHOSTABLE.has(id)) return;
  try {
    const r = JSON.parse(store.get("rfc_gh_" + id) || "null");
    if (r && r.p && r.p.length > 8) GHOST.run = r;
  } catch (e) {}
}
function ghostTick(dt) {
  if (!currentMission || currentMission.done || phase !== "play" || (currentMission.def.race && currentMission.rs !== "run"))
    return;
  const el = clock - currentMission.t0;
  if (GHOST.rec) {
    GHOST.acc += dt;
    if (GHOST.acc >= 0.1) {
      GHOST.acc = 0;
      if (GHOST.rec.length < 9000)
        GHOST.rec.push(
          Math.round(el * 100) / 100,
          Math.round(carState.x * 10) / 10,
          Math.round(carState.y * 10) / 10,
          Math.round(carState.z * 10) / 10,
          Math.round(carState.yaw * 100) / 100,
        );
    }
  }
  const r = GHOST.run;
  if (!r) {
    GHOST.g.visible = false;
    return;
  }
  const p = r.p,
    n = p.length / 5;
  let i = Math.min(n - 2, Math.max(0, Math.floor(el * 10)));
  while (i < n - 2 && p[(i + 1) * 5] < el) i++;
  while (i > 0 && p[i * 5] > el) i--;
  if (el > p[(n - 1) * 5] + 1.5) {
    GHOST.g.visible = false;
    return;
  }
  const a = i * 5,
    b = a + 5,
    f = clamp((el - p[a]) / Math.max(0.01, p[b] - p[a]));
  GHOST.g.visible = true;
  GHOST.g.position.set(
    lerp(p[a + 1], p[b + 1], f),
    lerp(p[a + 2], p[b + 2], f),
    lerp(p[a + 3], p[b + 3], f),
  );
  GHOST.g.rotation.y = p[a + 4] + angleDelta(p[b + 4], p[a + 4]) * f;
  const near = Math.hypot(GHOST.g.position.x - carState.x, GHOST.g.position.z - carState.z);
  GHOST.g.children.forEach((o) => {
    if (o.material.opacity != null && !o.isSprite)
      o.material.opacity = near < 5 ? 0.12 : 0.26;
  });
}
function ghostSave(ok, stats) {
  if (!currentMission || !GHOST.rec || !ok || GHOST.rec.length < 200) return;
  const id = currentMission.def.id,
    tm = stats.time;
  if (tm == null) return;
  let best = null;
  try {
    best = JSON.parse(store.get("rfc_gh_" + id) || "null");
  } catch (e) {}
  if (!best || tm < best.t) {
    try {
      store.set("rfc_gh_" + id, JSON.stringify({ t: tm, p: GHOST.rec }));
    } catch (e) {}
  }
  GHOST.rec = null;
}
function ghostHide() {
  GHOST.g.visible = false;
  GHOST.run = null;
  GHOST.rec = null;
}

/* ---- skins: no credit bonuses; three are earned by feats instead of bought ---- */
SKINS.forEach((s) => {
  s.perk = 0;
});
const EARN = {
  leopard: {
    txt: "Land ten clean 720 spins",
    have: () => +(store.get("rfc_720") || 0),
    need: 10,
  },
  galaxy: {
    txt: "Collect every sky token",
    have: () => SCORE.tokens.size,
    need: () => TOKENS.length,
  },
  diamond: {
    txt: "Win Gold in every test",
    have: () => MISSIONS.filter((m) => !m.hidden && medalOf(m.id) >= 3).length,
    need: () => MISSIONS.filter((m) => !m.hidden).length,
  },
};
const eNeed = (e) => (typeof e.need === "function" ? e.need() : e.need);
