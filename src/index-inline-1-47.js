// index-inline-1 47 — three
// Lines 93265-93610 of readable/index-inline-1.pretty.js (statement-aligned).
const TSTEP = [
  {
    t: "GAS",
    hl: ["gas"],
    say: null,
    obj: () =>
      `Hold ${KY("gas")} to drive · ${Math.round(Math.max(0, S.v) * MPH)} / 30 mph`,
  },
  {
    t: "STEER",
    hl: ["steer", "gas"],
    say: "Good. Now steer. Swing left into the gold gate.",
    obj: () =>
      `Steer ${isTouch ? "with the stick" : "with A / D"} into the gold gate`,
  },
  {
    t: "BRAKE",
    hl: ["brake"],
    say: "Brakes. She stops harder than you think.",
    obj: () =>
      `Hold ${KY("brake")} to stop · ${Math.round(Math.abs(S.v) * MPH)} mph`,
  },
  {
    t: "ROCKET MODE",
    hl: ["rocket"],
    say: "Here comes the good part. Open the plate.",
    obj: () =>
      S.armed
        ? S.spool < 1.2
          ? "Spooling the thrusters…"
          : ""
        : `Press ${KY("rocket")}: ROCKET MODE`,
  },
  {
    t: "HOVER",
    hl: ["hover"],
    say: "Hold to lift. Let go and she sinks, slow and safe.",
    obj: () =>
      `Hold ${KY("hover")} to climb · ${Math.max(0, S.y - groundH(S.x, S.z, S.y).h).toFixed(1)} / 6 m`,
  },
  {
    t: "FLY",
    hl: ["hover", "gas", "steer"],
    say: "Gas still means forward, even up here. Tap hover to keep your height.",
    obj: () =>
      S.air
        ? `${KY("gas")} flies forward · ${Math.min(40, Math.round(Math.hypot(S.x - M.p0[0], S.z - M.p0[1])))} / 40 m`
        : `Hold ${KY("hover")} to lift again`,
  },
  {
    t: "LAND",
    hl: [],
    say: "Hands off. She sets you down by herself, nice and soft.",
    obj: () => (S.air ? "Let go of everything · she lands herself" : "Landed"),
  },
  {
    t: "BOOST",
    hl: ["boost", "gas"],
    say: "And this is the rocket. Hold boost with the gas. Hold on.",
    obj: () =>
      `Hold ${KY("boost")} + ${KY("gas")} · ${Math.round(Math.max(0, S.v) * MPH)} mph`,
  },
];
function tutTarget() {
  if (!M) return null;
  return M.step === 1 ? { x: TG1[0], z: TG1[1] } : null;
}
function tutHide() {
  if (TUTR) TUTR.visible = false;
  tutHL([]);
  if (DRN) DRN.g.visible = false;
}
function tutHL(list) {
  for (const k in TBTN) {
    const e = $(TBTN[k]);
    if (e) e.classList.toggle("hl", list.includes(k));
  }
  const h = $("ctlHint");
  if (!h) return;
  if (isTouch || !list.length) {
    h.classList.remove("on");
    return;
  }
  h.innerHTML = list
    .map((k) => KEYS[k].map((x) => `<kbd>${x}</kbd>`).join(""))
    .join("<i>+</i>");
  h.classList.add("on");
}
function tutSpawn() {
  if (TUT.live && M && M.def.id === "tutorial" && !M.done) {
    const k = M.step,
      c = M.cp;
    if (k <= 3 || !c) {
      place(CARP.x, CARP.z, Math.PI / 2);
    } else place(c[0], c[1], c[2]);
    if (k >= 4) {
      S.armed = true;
      S.spool = 1.2;
      S.bayK = 1;
    }
    S.tank = 100;
    S.heat = 25;
    if (flashT <= 0) flash("TRY AGAIN", "same step · no rush", 1.6);
    return;
  }
  place(CARP.x, CARP.z, Math.PI / 2);
}
function tutEnter(M, k) {
  M.step = k;
  M.st = clock;
  M.acc = 0;
  M.p0 = [S.x, S.z];
  if (k === 4) M.cp = [S.x, S.z, S.yaw];
  const T = TSTEP[k];
  DZ.visible = k === 1;
  if (DZ.visible) {
    zoneColor(0xffc24a);
    DZ.position.set(TG1[0], 0, TG1[1]);
  }
  if (k === 7) {
    S.tank = 100;
    S.heat = Math.min(S.heat, 40);
  }
  tutHL(T.hl);
  if (k > 0) {
    audio.chime();
    flash(`${k + 1} / ${TSTEP.length} · ${T.t}`, T.obj(), 2.4);
  } else
    flash(
      "FIRST DRIVE",
      `Learn the controls. No clock, no fail.${isTouch ? "" : " ENTER skips any film."}`,
      3.4,
    );
  if (T.say) showSub("MAE", T.say, 5);
}
function tutTick(M, dt, ev, el) {
  if (!M.tutOn) {
    M.tutOn = true;
    TUT.live = true;
    tutEnter(M, 0);
  }
  const k = M.step,
    agl = S.y - groundH(S.x, S.z, S.y).h;
  let next = false;
  if (k === 0) next = S.v * MPH >= 30;
  else if (k === 1) next = Math.hypot(S.x - TG1[0], S.z - TG1[1]) < 7;
  else if (k === 2) next = Math.abs(S.v) < 0.4 && !S.air;
  else if (k === 3) next = S.armed && S.spool >= 1.2 && !cin.on;
  else if (k === 4) next = S.air && agl >= 6;
  else if (k === 5)
    next = S.air && Math.hypot(S.x - M.p0[0], S.z - M.p0[1]) >= 40;
  else if (k === 6) next = !!(ev && ev.land != null);
  else if (k === 7) {
    if (S.thrust === 2) M.acc += dt;
    if (M.acc >= 1.1) {
      tutHL([]);
      finish(
        true,
        "Controls done: gas, steer, brake, Rocket Mode, hover, fly, land and boost. Now the real tests begin.",
        { time: el },
      );
      return ["", ""];
    }
  }
  if (next && k < 7) tutEnter(M, k + 1);
  const n = M.step;
  let o = TSTEP[n].obj();
  if (n >= 4 && !S.armed && !M.done) {
    o = `Press ${KY("rocket")} again: ROCKET MODE is off`;
    tutHL(["rocket"]);
  }
  return [o, `STEP ${n + 1} / ${TSTEP.length}`];
}
$("tutSkip").addEventListener("click", (e) => {
  e.stopPropagation();
  if (M && !M.done && M.def.id === "tutorial" && phase === "play")
    finish(
      true,
      "Tutorial skipped. Replay it any time: it is TEST 00 in the list.",
      { time: clock - M.t0 },
    );
});
MIS.find((m) => m.id === "jam").n = "20";
MIS.push({
  id: "tutorial",
  r: 200,
  n: "00",
  t: "First Drive",
  b: "The controls, one at a time: gas, steer, brake, Rocket Mode, hover, fly, land and boost. No clock, no fail.",
  spawn: () => tutSpawn(),
});
CH[0] = Object.assign({}, CH[0], {
  t: "FIRST DRIVE",
  mis: MI("tutorial"),
  who: "MAE",
  intro: "New car, new rules. One control at a time, I'll talk you through it.",
  outro: "Look at you. Drives, flies, lands. Oh no. Zero, my drone!",
});
EARN.diamond.have = () =>
  MIS.filter((m) => !m.hidden && m.id !== "tutorial" && medalOf(m.id) >= 3)
    .length;
EARN.diamond.need = () =>
  MIS.filter((m) => !m.hidden && m.id !== "tutorial").length;

/* ---- per-frame hook ---- */
function v23Tick(rdt, dt) {
  if (cin.on && cin.rev) revealTick(dt);
  const sk = phase === "play" && cin.on && (cin.rev || cin.kind === "hover");
  if ($("cinSkip").hidden === sk) $("cinSkip").hidden = !sk;
  const ts =
    phase === "play" && M && !M.done && M.def.id === "tutorial" && !cin.on;
  if ($("tutSkip").hidden === ts) $("tutSkip").hidden = !ts;
}
MEDAL.rings = { t: 42, s: 55 }; // hover is slower since V23
MEDAL.launch = { t: 0.65, s: 0.8 }; // boost is a rocket since V24

/* ================= V25: story missions with films · Rogue Drone · route previews ================= */
// moving instanced meshes kept a bounding sphere from before they were placed, so traffic and CrewBots vanished
// whenever the city origin was off screen while still colliding. Never cull them.
for (const T of Object.values(VT))
  if (T.meshes)
    T.meshes.forEach((m) => {
      m.frustumCulled = false;
    });
if (TRAFFIC.wheels) TRAFFIC.wheels.frustumCulled = false;
["torso", "head", "visor", "legs", "arms"].forEach((k) => {
  if (WALKERS[k]) WALKERS[k].frustumCulled = false;
});

/* ---- the drone ---- */
var DRN = (() => {
  const g = new THREE.Group(),
    dark = new THREE.MeshStandardMaterial({
      color: 0x1b1e24,
      metalness: 0.7,
      roughness: 0.35,
    }),
    white = new THREE.MeshStandardMaterial({
      color: 0xeef0f2,
      metalness: 0.2,
      roughness: 0.4,
    });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.9), white);
  g.add(body);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    dark,
  );
  dome.position.y = 0.13;
  g.add(dome);
  const ledR = new THREE.MeshStandardMaterial({
      color: 0x000,
      emissive: 0xff2a2a,
      emissiveIntensity: 6,
    }),
    ledB = new THREE.MeshStandardMaterial({
      color: 0x000,
      emissive: 0x38d6ff,
      emissiveIntensity: 6,
    });
  const rot = [];
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz], i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.1), dark);
    arm.position.set(sx * 0.45, 0.02, sz * 0.45);
    arm.rotation.y = Math.atan2(sz, sx) * -1 + (Math.PI / 2) * 0;
    arm.lookAt(sx * 2, 0.02, sz * 2);
    g.add(arm);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12),
      dark,
    );
    hub.position.set(sx * 0.82, 0.08, sz * 0.82);
    g.add(hub);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({
        color: 0xcfd6de,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(sx * 0.82, 0.17, sz * 0.82);
    g.add(disc);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.06), dark);
    blade.position.set(sx * 0.82, 0.18, sz * 0.82);
    g.add(blade);
    rot.push(blade);
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      i < 2 ? ledR : ledB,
    );
    led.position.set(sx * 0.82, -0.02, sz * 0.82);
    g.add(led);
  });
  const pie = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xd9a35b, roughness: 0.8 }),
  );
  pie.position.y = -0.36;
  g.add(pie);
  const strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.06, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xb3121b }),
  );
  strap.position.y = -0.3;
  g.add(strap);
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 64;
  const x = cv.getContext("2d");
  x.font = "800 30px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = "#ffc24a";
  x.fillText("MAE'S DRONE", 128, 42);
  const tt = new THREE.CanvasTexture(cv);
  tt.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tt,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: false,
    }),
  );
  tag.scale.set(0.16, 0.04, 1);
  tag.position.y = 1.3;
  g.add(tag);
  g.scale.setScalar(1.7);
  g.visible = false;
  scene.add(g);
  return { g, rot, ledR, ledB, tag, s: 0, y: 0, dock: 0, att: false };
})();
const DRN_ROOF = [
  (DINER.b[0] + DINER.b[1]) / 2,
  7.5,
  (DINER.b[2] + DINER.b[3]) / 2,
];
// a loop over the plaza and open streets; heights are lifted clear of any roof along the way
