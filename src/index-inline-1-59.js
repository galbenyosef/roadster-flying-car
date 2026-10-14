// index-inline-1 59 — carstate
// Lines 96974-97290 of readable/index-inline-1.pretty.js (statement-aligned).
Object.assign(ORBIT, {
  dur: 50,
  setup() {
    ORBIT_MODE.on = true;
    applyVehicle(SELECTED_VEHICLE());
    resetLaunch(LAUNCH.cycle - 15);
    ROCKET.g.visible = true;
    orbitMode(true);
    fairOpen(1);
    FAIR.ring.material.emissiveIntensity = 3;
    FAIR.locks.forEach((l) => (l.material.emissiveIntensity = 0));
    const T = LAUNCH_SITE.tower;
    place(T.x + 3.5, T.z, Math.PI / 2);
    carState.y = T.h + 0.2;
    carState.armed = true;
    carState.spool = 1.2;
    carState.bayK = 1;
    ORBIT_MODE.p0 = vec3(carState.x, carState.y, carState.z);
    RIVALS[0].g.visible = true;
    RIVALS[0].g.position.set(VIEWPOINT[0] - 14, 0, VIEWPOINT[1] + 8);
    RIVALS[0].g.rotation.y = -0.6;
    rivalTags(true);
    rivalWheels();
    ORBIT_MODE.space = null;
    ORBIT_MODE.closed = false;
  },
  cues: [
    [0.4, () => showSub("MAE", "Payload seat, sugar. You earned it.", 3.6)],
    [
      2.4,
      () => {
        flash("PAYLOAD BAY", "fairing open · clamps ready", 2);
        audio.servo();
      },
    ],
    [
      4.2,
      () =>
        showSub("CONTROL", "Roadster, line up over the bay. Nice and slow.", 3),
    ],
    [
      7.9,
      () => {
        audio.hit();
        shake = 0.25;
        flash("CLAMPS LOCKED", "", 1.4);
      },
    ],
    [
      8.6,
      () => {
        audio.hinge();
        showSub("CONTROL", "Closing the fairing.", 2.4);
      },
    ],
    [
      11.2,
      () => {
        audio.boom();
        shake = 0.35;
        FAIR.locks.forEach((l) => (l.material.emissiveIntensity = 6));
        flash("FAIRING CLOSED", "Roadster is secured", 1.8);
      },
    ],
    [12.2, () => showSub("CONTROL", "Skyline One, you are go for launch.", 3)],
    [13, () => radio("VEX", "orbit", true)],
    [
      26,
      () => {
        const sp = spaceBuild();
        composer.passes[0].scene = sp.sc;
        skyG.visible = false;
        orbitCredits(true);
      },
    ],
    [
      27.4,
      () => {
        flash("FAIRING SEPARATION", "", 1.8);
      },
    ],
    [33, () => showSub("ZERO", "( a hand on the window )", 3)],
    [39, () => showSub("MAE", "Look at that view. Come home safe, Zero.", 5)],
  ],
  cam(t, dt) {
    const V = vec3,
      m = LAUNCH_SITE.mount,
      R = ROCKET.g.position;
    ROCKET.g.updateMatrixWorld();
    const bay = ROCKET.g.localToWorld(V(0, FAIR_Y + 0.62, 0));
    // the fairing: open until the car is in, closed from 11.2 s
    if (t < 8.6) fairOpen(1);
    else if (t < 11.2) {
      const u = easeIO(clamp((t - 8.6) / 2.6));
      fairOpen(1 - u);
    } else fairOpen(0);
    FAIR.ring.material.emissiveIntensity =
      t < 7.9 ? 3 + Math.sin(t * 6) * 1.5 : 1;
    if (t < 7.9) {
      // hover off the tower deck, over, and down into the bay
      const u = easeIO(clamp((t - 2.4) / 5.2)),
        a = ORBIT_MODE.p0,
        top = bay.clone().add(V(0, 9, 0));
      let p;
      if (u < 0.6) {
        const w = u / 0.6;
        p = a.clone().lerp(top, w);
        p.y += Math.sin(w * Math.PI) * 5;
      } else {
        const w = easeIO((u - 0.6) / 0.4);
        p = top.clone().lerp(bay, w);
      }
      carState.x = p.x;
      carState.y = p.y;
      carState.z = p.z;
      carState.yaw = Math.PI / 2 + u * Math.PI * 0.5;
      carState.thrust = t > 2.4 ? 1 : 0;
      carState.air = true;
      car.visible = true;
      if (t < 2.4)
        return {
          p: V(m.x - 70, 26, m.z - 62),
          tg: V(m.x, R.y + 60, m.z),
          fov: 40,
        };
      const c = V(carState.x, carState.y, carState.z),
        k = easeIO(clamp((t - 2.4) / 5.5));
      return {
        p: V(
          m.x - lerp(40, 30, k),
          R.y + FAIR_Y + lerp(26, 15, k),
          m.z - lerp(16, 8, k),
        ),
        tg: c.lerp(V(m.x, R.y + FAIR_Y + 2, m.z), 0.25),
        fov: lerp(40, 44, k),
      };
    }
    carState.x = bay.x;
    carState.y = bay.y;
    carState.z = bay.z;
    carState.yaw = Math.PI;
    carState.thrust = 0;
    carState.air = false;
    if (t < 11.4) {
      car.visible = true;
      const u = easeIO(clamp((t - 7.9) / 3.4));
      return {
        p: V(
          m.x - lerp(28, 36, u),
          R.y + FAIR_Y + lerp(10, 7, u),
          m.z - lerp(10, 20, u),
        ),
        tg: V(m.x, R.y + FAIR_Y + lerp(3, 7, u), m.z),
        fov: lerp(40, 44, u),
      };
    }
    car.visible = false;
    if (t < 26) {
      if (LAUNCH.st !== "up") {
        const u = easeIO(clamp((t - 11.4) / 3.6)),
          a = V(m.x - 36, R.y + FAIR_Y + 7, m.z - 20),
          b = V(m.x - 36, 9, m.z - 150);
        return {
          p: a.lerp(b, u),
          tg: V(m.x, R.y + lerp(FAIR_Y + 5, 40, u), m.z),
          fov: lerp(48, 38, u),
        };
      }
      const sh = launchCam(LAUNCH.t);
      sh.tg = V(R.x, R.y + FAIR_Y, R.z);
      return sh;
    }
    const sp = ORBIT_MODE.space;
    if (!sp)
      return {
        p: V(R.x - 20, R.y - 10, R.z - 60),
        tg: V(R.x, R.y + FAIR_Y, R.z),
        fov: 46,
      };
    const u = t - 26;
    spaceSep(sp, u);
    sp.rc.rotation.set(
      Math.sin(u * 0.2) * 0.08 * clamp(u / 6),
      Math.PI / 2 + u * 0.05,
      Math.sin(u * 0.15) * 0.05 * clamp(u / 6),
    );
    sp.rc.position.y = Math.sin(u * 0.5) * 0.3 + clamp((u - 3) / 6) * 1.2;
    sp.E.rotation.y += dt * 0.004;
    if (u < 7) {
      const e = easeIO(clamp(u / 7));
      return {
        p: V(lerp(-44, -12, e), lerp(12, 3, e), lerp(-52, -9, e)),
        tg: V(0, lerp(-3, 0, e), 0),
        fov: lerp(38, 46, e),
      };
    }
    const a = -2.2 + (u - 7) * 0.05;
    return {
      p: V(Math.sin(a) * 10, 2.2 + (u - 7) * 0.07, Math.cos(a) * 10),
      tg: V(0, -1.2 - (u - 7) * 0.04, 0),
      fov: lerp(46, 52, clamp((u - 7) / 20)),
    };
  },
});
{
  const _o = orbitEnd;
  orbitEnd = function (k) {
    orbitMode(false);
    _o(k);
  };
}

/* ---- sharing: progress card, best moment as a cinematic clip, straight to X ---- */
const SHARE = { site: "" };
function siteURL() {
  if (SHARE.site) return SHARE.site;
  try {
    const h = location.host || "";
    if (
      /^https?:$/.test(location.protocol) &&
      h &&
      !/claude|anthropic|usercontent|localhost|127\.0\.0\.1/.test(h)
    )
      return location.origin + location.pathname.replace(/index\.html$/, "");
  } catch (e) {}
  return "";
}
function xIntent(text, url) {
  const u =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text) +
    (url ? "&url=" + encodeURIComponent(url) : "");
  let w = null;
  try {
    w = window.open(u, "_blank");
    if (w)
      try {
        w.opener = null;
      } catch (_) {}
  } catch (e) {}
  if (!w) {
    const done = () => flash("COPIED", "post text copied · paste it on X", 2.4),
      fail = () => flash("SHARE ON X", text, 4);
    try {
      navigator.clipboard
        .writeText(text + (url ? " " + url : ""))
        .then(done, fail);
    } catch (e) {
      fail();
    }
  }
}
async function shareOut(text, url, file) {
  // phones: the system share sheet with the file (pick X); desktop: download the file and open a post on X
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: text + (url ? " " + url : ""),
      });
      return "shared";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancel";
  }
  if (file) saveBlob(file, file.name);
  xIntent(text, url);
  return "intent";
}
function saveBlob(blob, name) {
  if (downloadLink) {
    downloadLink.save({ filename: name, data: blob }).catch(() => {});
    return;
  }
  if (inClaude) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function progStats() {
  const vis = MISSIONS.filter((m) => !m.hidden && !isNaN(parseInt(m.n, 10)));
  let g = 0,
    s = 0,
    b = 0,
    c = 0;
  vis.forEach((m) => {
    const k = medalOf(m.id);
    if (k >= 3) g++;
    else if (k === 2) s++;
    else if (k === 1) b++;
    if (clearedId(m.id)) c++;
  });
  return {
    ch: Math.min(STORY.done, CHAPTERS.length),
    chN: CHAPTERS.length,
    g,
    s,
    b,
    c,
    n: vis.length,
    cr: ECONOMY.cr,
    combo: COMBO.best || 0,
    done: STORY.done >= CHAPTERS.length,
  };
}
function progressScore() {
  const p = progStats();
  return (
    p.ch * 1e6 +
    p.c * 1e4 +
    (p.g * 3 + p.s * 2 + p.b) * 100 +
    Math.min(99, Math.floor(p.cr / 10000))
  );
}
