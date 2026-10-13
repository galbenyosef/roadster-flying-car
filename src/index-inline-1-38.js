// index-inline-1 38 — pho
// Lines 90407-90731 of readable/index-inline-1.pretty.js (statement-aligned).
function photoSave() {
  composer.render();
  const src = renderer.domElement,
    sc = Math.min(1, 1920 / src.width),
    W = Math.round(src.width * sc),
    H = Math.round(src.height * sc),
    cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d");
  const fl = FILTERS[PHO.fil][1];
  if (fl && "filter" in x) x.filter = fl;
  x.drawImage(src, 0, 0, W, H);
  x.filter = "none";
  if (PHO.card) {
    const u = H / 1080,
      g = x.createLinearGradient(0, H * 0.62, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.72)");
    x.fillStyle = g;
    x.fillRect(0, H * 0.62, W, H * 0.38);
    const sk = SKIN(),
      hsp = Math.round(
        (PHO.prev === "replay"
          ? RPL.hs
          : S.air
            ? Math.hypot(S.vx, S.vz)
            : Math.abs(S.v)) * MPH,
      ),
      where = M
        ? `TEST ${M.def.n} · ${M.def.t.toUpperCase()}`
        : "FREE ROAM · THE STRIP";
    x.textBaseline = "alphabetic";
    x.fillStyle = "#fff";
    x.font = `800 ${Math.round(78 * u)}px Saira, Arial, sans-serif`;
    x.fillText("ROADSTER", 60 * u, H - 118 * u);
    x.fillStyle = "#FFB35C";
    x.font = `600 ${Math.round(22 * u)}px "JetBrains Mono", monospace`;
    x.fillText("THE FLYING CAR", 64 * u, H - 80 * u);
    x.fillStyle = "rgba(255,255,255,.82)";
    x.font = `500 ${Math.round(20 * u)}px "JetBrains Mono", monospace`;
    x.fillText(`${sk.n} · ${hsp} MPH · ${where}`, 64 * u, H - 46 * u);
    x.textAlign = "right";
    x.fillStyle = "rgba(255,255,255,.45)";
    x.font = `500 ${Math.round(15 * u)}px "JetBrains Mono", monospace`;
    x.fillText("UNOFFICIAL FAN GAME", W - 56 * u, H - 46 * u);
    x.textAlign = "left";
    x.strokeStyle = "rgba(255,179,92,.9)";
    x.lineWidth = 3 * u;
    x.beginPath();
    x.moveTo(64 * u, H - 100 * u);
    x.lineTo(64 * u + 120 * u, H - 100 * u);
    x.stroke();
  }
  let url;
  try {
    url = cv.toDataURL("image/jpeg", 0.92);
  } catch (e) {
    flash("PHOTO", "could not export on this device", 2);
    return;
  }
  $("phoImg").src = url;
  $("phoPrev").hidden = false;
  PHO.url = url;
  PHO.name = `roadster-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`;
  PHO.blob = null;
  try {
    cv.toBlob(
      (bl) => {
        PHO.blob = bl;
      },
      "image/jpeg",
      0.92,
    );
  } catch (e) {}
  $("phoFlash").classList.remove("go");
  void $("phoFlash").offsetWidth;
  $("phoFlash").classList.add("go");
  audio.noise(5000, 2000, 0.12, 0.25, "highpass");
}
{
  const cvs = renderer.domElement;
  cvs.addEventListener("pointerdown", (e) => {
    if (phase === "replay" && !e.target.closest("button")) {
      replayEnd();
      return;
    }
    if (phase !== "photo") return;
    PHO.ptr.set(e.pointerId, [e.clientX, e.clientY]);
    try {
      cvs.setPointerCapture(e.pointerId);
    } catch (_) {}
    if (PHO.ptr.size === 2) {
      const [p, q] = [...PHO.ptr.values()];
      PHO.pd = Math.hypot(p[0] - q[0], p[1] - q[1]);
    }
  });
  cvs.addEventListener("pointermove", (e) => {
    if (phase !== "photo" || !PHO.ptr.has(e.pointerId)) return;
    const o = PHO.ptr.get(e.pointerId);
    if (PHO.ptr.size === 1) {
      PHO.az -= (e.clientX - o[0]) * 0.008;
      PHO.el += (e.clientY - o[1]) * 0.006;
    }
    PHO.ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (PHO.ptr.size === 2) {
      const [p, q] = [...PHO.ptr.values()],
        d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (PHO.pd > 0) PHO.r *= PHO.pd / d;
      PHO.pd = d;
    }
  });
  const up = (e) => {
    PHO.ptr.delete(e.pointerId);
    PHO.pd = 0;
  };
  cvs.addEventListener("pointerup", up);
  cvs.addEventListener("pointercancel", up);
  cvs.addEventListener(
    "wheel",
    (e) => {
      if (phase !== "photo") return;
      e.preventDefault();
      PHO.r *= Math.exp(e.deltaY * 0.0012);
    },
    { passive: false },
  );
}
$("phoF").addEventListener("click", () =>
  setFilter((PHO.fil + 1) % FILTERS.length),
);
$("phoC").addEventListener("click", () => {
  PHO.card = !PHO.card;
  setT("phoC", PHO.card ? "CARD ON" : "CARD OFF");
});
$("phoS").addEventListener("click", photoSave);
$("phoX").addEventListener("click", photoEnd);
$("phoZi").addEventListener(
  "click",
  () => (PHO.fov = clamp(PHO.fov - 6, 14, 80)),
);
$("phoZo").addEventListener(
  "click",
  () => (PHO.fov = clamp(PHO.fov + 6, 14, 80)),
);
$("phoPrevX").addEventListener("click", () => ($("phoPrev").hidden = true));
// saving goes through the viewer's download prompt when the page runs inside Claude; a plain link otherwise
let dlNS = null;
const inClaude = !!(window.claude && window.claude.use);
if (inClaude)
  window.claude
    .use("downloads")
    .then((n) => {
      dlNS = n;
      if (!n) $("phoDl").hidden = true;
    })
    .catch(() => {
      $("phoDl").hidden = true;
    });
$("phoDl").addEventListener("click", async () => {
  if (!PHO.url) return;
  if (dlNS) {
    try {
      const data = PHO.blob || (await (await fetch(PHO.url)).blob());
      await dlNS.save({ filename: PHO.name, data });
      setT("phoDl", "SAVED ✓");
      setTimeout(() => setT("phoDl", "DOWNLOAD"), 1800);
    } catch (e) {
      const c = e && e.code;
      if (c === "declined") return;
      if (c === "rate_limited") {
        flash("PHOTO", "one moment, a save is already open", 1.4);
        return;
      }
      if (c !== "bad_request") $("phoDl").hidden = true;
    }
    return;
  }
  if (!inClaude) {
    const a = document.createElement("a");
    a.href = PHO.url;
    a.download = PHO.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
});
$("rplSkip").addEventListener("click", (e) => {
  e.stopPropagation();
  replayEnd();
});
$("rplPho").addEventListener("click", (e) => {
  e.stopPropagation();
  photoStart();
});
$("rplHint").addEventListener("click", () => replayStart());
$("rrpl").addEventListener("click", () => {
  if (phase !== "result") return;
  $("result").hidden = true;
  phase = "play";
  if (replayStart()) RPL.fromRes = true;
  else {
    phase = "result";
    $("result").hidden = false;
    flash("", "", 0);
  }
});
$("tbRpl").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!replayStart()) flash("REPLAY", "drive a few seconds first", 1.2);
});
$("tbPho").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  photoStart();
});
// keyboard: T replay, P photo; on the result screen R retries and ENTER moves on
function v18Key(k) {
  if (phase === "replay") {
    if (k === "p") photoStart();
    else if (["escape", "enter", " ", "t"].includes(k)) replayEnd();
    return true;
  }
  if (phase === "photo") {
    if (k === "escape" || k === "p") {
      photoEnd();
      return true;
    }
    if (k === "enter") {
      photoSave();
      return true;
    }
    if (k === "f") {
      setFilter((PHO.fil + 1) % FILTERS.length);
      return true;
    }
    if (k === "h") {
      PHO.card = !PHO.card;
      setT("phoC", PHO.card ? "CARD ON" : "CARD OFF");
      return true;
    }
    return false;
  }
  if (phase === "play") {
    if (k === "t" && !K[k]) {
      if (!replayStart()) flash("REPLAY", "drive a few seconds first", 1.2);
      return true;
    }
    if (k === "p" && !K[k]) {
      photoStart();
      return true;
    }
  }
  if (phase === "result") {
    if (k === "r") {
      $("rretry").click();
      return true;
    }
    if (k === "t") {
      $("rrpl").click();
      return true;
    }
    if (k === "enter") {
      (!$("rnext").hidden ? $("rnext") : $("rretry")).click();
      return true;
    }
  }
  return false;
}

/* ---- free-roam launch event ---- */
function launchEvent() {
  if (phase !== "play" || M) return;
  const L = LAUNCH;
  if (L.st === "up" && !L.wit) {
    L.wit = true;
    const d = Math.hypot(S.x - LS.mount.x, S.z - LS.mount.z);
    if (d < 700) setTimeout(() => pop("LIFTOFF WITNESS", 600), 1600);
  }
  if (L.st !== "up") L.wit = false;
}

/* ---- per-frame hook ---- */
function v18Tick(rdt, dt) {
  comboTick(rdt);
  radioTick(rdt);
  speedFx(rdt);
  recTick(dt);
  launchEvent();
  boostKick = Math.max(0, boostKick - rdt * 1.6);
  if (rplHintT > 0) {
    rplHintT -= rdt;
    if (rplHintT <= 0 || phase !== "play") $("rplHint").classList.remove("on");
  }
  if (
    M &&
    !M.done &&
    M.def.id === "chase" &&
    M.rs === "run" &&
    phase === "play"
  ) {
    const v = RIVALS[0],
      dd = Math.hypot(S.x - v.g.position.x, S.z - v.g.position.z);
    if (!M.rd0) {
      M.rd0 = 1;
      radio("VEX", "chase", true);
    } else if (dd > 56 && !M.rdF) {
      M.rdF = 1;
      radio("VEX", "far", true);
    } else if (dd < 18 && clock - M.t0 > 8 && !M.rdC) {
      M.rdC = 1;
      radio("VEX", "close");
    }
    if (dd < 45) M.rdF = 0;
  }
}

/* ================= V19: spool buffer, air/heat sound, photo-finish hold, the city's rocket event ================= */
let xDownT = 0;
addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === "x") xDownT = performance.now();
});

/* ---- #6 the thrusters are the gauges: gaps in the hiss mean air, a rising whine means heat ---- */
