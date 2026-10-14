// index-inline-1 44 — three
// Lines 92370-92639 of readable/index-inline-1.pretty.js (statement-aligned).
function launchDayTick(M, dt, ev, el) {
  const Lc = LAUNCH;
  if (M.step === 0) {
    const tz =
      Lc.st === "idle" ? Lc.cycle - Lc.t : Lc.st === "count" ? 10 - Lc.t : 0;
    if (!M.onDeck) {
      if (ev && ev.land != null && ev.pad && ev.pad.label === "L") {
        M.onDeck = true;
        audio.chime();
        flash("ON THE DECK", "stay put · liftoff soon", 2);
      } else if (Lc.st === "up") {
        finish(false, "The rocket left without you on the deck.", {
          time: null,
        });
        return ["", ""];
      }
      return [
        "Land on the TOWER DECK before T-0",
        `T-${Math.max(0, tz).toFixed(1)} s`,
      ];
    }
    if (Lc.st === "up" && !M.shown) {
      M.shown = true;
      if (!cin.on) startShow("launch");
    }
    if (Lc.st === "up" && Lc.y > 320) {
      M.step = 1;
      DZ.visible = true;
      zoneColor(0xffc24a);
      DZ.position.set(VP[0], 0, VP[1]);
      PADS.forEach((p) => (p.beam.visible = false));
      flash(
        "RACE THE BOOSTER",
        "get to the gold VIEW POINT before it lands",
        2.4,
      );
    }
    return [
      "Stay on the deck. Watch it go.",
      Lc.st === "up"
        ? `T+${Lc.t.toFixed(1)} s`
        : `T-${Math.max(0, tz).toFixed(1)} s`,
    ];
  }
  const tl = Lc.st === "gone" ? 29 - Lc.t : Lc.st === "down" ? 15 - Lc.t : 0,
    inZ =
      Math.hypot(S.x - VP[0], S.z - VP[1]) < 6 && !S.air && Math.abs(S.v) < 2.5;
  if (Lc.st === "down" && Lc.t >= 7.5 && !M.shown2 && !cin.on) {
    M.shown2 = true;
    if (inZ) startShow("land");
  }
  if (Lc.st === "landed" && !M.res) {
    M.res = true;
    if (Math.hypot(S.x - LS.lz.x, S.z - LS.lz.z) < 26)
      finish(false, "Too close! Never stand on the landing zone.", {
        time: null,
      });
    else if (inZ)
      finish(true, "Deck, liftoff and the catch. A perfect launch day.", {
        time: el,
      });
    else
      finish(
        false,
        "The booster beat you home. Be inside the VIEW POINT before touchdown.",
        { time: null },
      );
  }
  return [
    inZ ? "In position. Watch it land." : "Stop inside the gold VIEW POINT",
    Lc.st === "landed" ? "" : `TOUCHDOWN IN ${Math.max(0, tl).toFixed(1)} s`,
  ];
}

/* ---- the Daily Run: one 60 s score attack per day, the same for everyone ---- */
const DAY0 = Date.UTC(2026, 9, 1),
  dayNo = () => Math.floor((Date.now() - DAY0) / 864e5) + 1;
const DSPOTS = [
    [-668.8, -20, 0, "STUNT YARD"],
    [-3.5, -300, 0, "THE STRIP"],
    [3.5, 440, 0, "THE BOULEVARD"],
    [-816, 70, 0, "THE LOOP"],
    [300, -500, Math.PI / 2, "THE CORE"],
    [-380.8, -30, 0, "WEST SIDE"],
  ],
  DBONUS = ["AIRTIME", "DRIFT", "NEAR MISS", "SPIN"];
function dailyInfo() {
  const r = rng(dayNo() * 7919),
    s = DSPOTS[(r() * DSPOTS.length) | 0],
    b = DBONUS[(r() * DBONUS.length) | 0];
  return { n: dayNo(), spot: s, bonus: b };
}
function dailySpawn() {
  const d = dailyInfo();
  place(d.spot[0], d.spot[1], d.spot[2]);
}
function dailyTick(M, el) {
  const left = 60 - el,
    cur = Math.round(M.pts + SCORE.drift);
  if (left <= 0) {
    const d = dailyInfo(),
      key = "rfc_daily_" + d.n,
      best = Math.max(cur, +(store.get(key) || 0));
    store.set(key, String(best));
    finish(true, `Daily ${d.n} · ${cur.toLocaleString("en-US")} points`, {
      time: 60,
      pts: cur,
    });
    return ["", ""];
  }
  return [
    `${cur.toLocaleString("en-US")} pts · ${dailyInfo().bonus} pays ×2`,
    `${left.toFixed(1)} s left`,
  ];
}
function dailyLine() {
  const d = dailyInfo(),
    pts = Math.round(M.pts),
    m = M.medal || 1;
  return `ROADSTER Daily ${d.n} · ${MNAME[m][0] + MNAME[m].slice(1).toLowerCase()} · ${pts.toLocaleString("en-US")}`;
}

/* ---- challenge codes: beat a friend's time on any test ---- */
const CHAL = { on: null };
function chalMake(id, t) {
  return (
    "RC-" +
    btoa(id + ":" + t.toFixed(2))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
  );
}
function chalRead(c) {
  try {
    c = (c || "").trim();
    if (!c.startsWith("RC-")) return null;
    let b = c.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const [id, t] = atob(b).split(":");
    const i = MIS.findIndex((m) => m.id === id && !m.hidden);
    if (i < 0 || !(+t > 0)) return null;
    return { id, i, t: +t };
  } catch (e) {
    return null;
  }
}
function chalStart(c) {
  const q = chalRead(c);
  if (!q) return false;
  CHAL.on = q;
  STORY.on = false;
  startMission(q.i);
  return true;
}

/* ---- Orbit: the Roadster rides Skyline One; credits over the Earth ---- */
const ORB = { on: false, space: null };
function spaceBuild() {
  if (ORB.space) return ORB.space;
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x000004);
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 512;
  const x = cv.getContext("2d"),
    im = x.createImageData(1024, 512);
  for (let j = 0; j < 512; j++)
    for (let i = 0; i < 1024; i++) {
      const u = i / 1024,
        v = j / 512,
        lat = Math.abs(v - 0.5) * 2,
        n = fbm(u * 9 + 3, v * 5 + 1, 5),
        cl = fbm(u * 14 + 40, v * 8 + 7, 4),
        land = n > 0.575,
        ice = lat > 0.86;
      let r, g, b;
      if (ice) {
        r = g = b = 235;
      } else if (land) {
        const k = (n - 0.575) * 4;
        r = 74 + k * 70 + (lat < 0.35 ? 36 : 0);
        g = 92 + k * 36;
        b = 52 + k * 16;
      } else {
        r = 8;
        g = 38 + lat * 26;
        b = 104 + lat * 44;
      }
      const c = Math.min(0.95, Math.max(0, (cl - 0.55) * 2.6));
      r = r * (1 - c) + 255 * c;
      g = g * (1 - c) + 255 * c;
      b = b * (1 - c) + 255 * c;
      const o = (j * 1024 + i) * 4;
      im.data[o] = r;
      im.data[o + 1] = g;
      im.data[o + 2] = b;
      im.data[o + 3] = 255;
    }
  x.putImageData(im, 0, 0);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const E = new THREE.Mesh(
    new THREE.SphereGeometry(6000, 96, 64),
    new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, metalness: 0 }),
  );
  E.position.set(0, -6420, 0);
  E.rotation.z = 0.4;
  sc.add(E);
  const A = new THREE.Mesh(
    new THREE.SphereGeometry(6000 * 1.03, 96, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader:
        "varying vec3 n;varying vec3 vp;void main(){n=normalize(normalMatrix*normal);vp=(modelViewMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*vec4(vp,1.);}",
      fragmentShader:
        "varying vec3 n;varying vec3 vp;void main(){float f=pow(1.-abs(dot(normalize(-vp),n)),3.);gl_FragColor=vec4(vec3(.3,.6,1.)*f*2.2,f);}",
    }),
  );
  A.position.copy(E.position);
  sc.add(A);
  const sg = new THREE.BufferGeometry(),
    sp = [];
  const r = rng(99);
  for (let i = 0; i < 3000; i++) {
    const a = r() * 6.283,
      b = Math.acos(2 * r() - 1),
      R = 15000;
    sp.push(
      R * Math.sin(b) * Math.cos(a),
      R * Math.cos(b),
      R * Math.sin(b) * Math.sin(a),
    );
  }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  sc.add(
    new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.6,
        sizeAttenuation: false,
      }),
    ),
  );
  const sl = new THREE.DirectionalLight(0xfff4e6, 3.2);
  sl.position.set(-1, 0.6, 0.4);
  sc.add(sl);
  sc.add(new THREE.AmbientLight(0x223355, 0.6));
  const rc = car.clone(true);
  rc.position.set(0, 0, 0);
  sc.add(rc);
  ORB.space = { sc, E, rc };
  return ORB.space;
}
function orbitCredits(on) {
  const el = $("credits");
  if (on) {
    el.hidden = false;
    el.classList.remove("roll");
    void el.offsetWidth;
    el.classList.add("roll");
  } else {
    el.hidden = true;
    el.classList.remove("roll");
  }
}
