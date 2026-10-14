// index-inline-1 47 — carstate
// Lines 93265-93610 of readable/index-inline-1.pretty.js (statement-aligned).
const TSTEP = [
  {
    t: "GAS",
    hl: ["gas"],
    say: null,
    obj: () =>
      `Hold ${KEY_LABELS("gas")} to drive · ${Math.round(Math.max(0, carState.v) * MPH)} / 30 mph`,
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
      `Hold ${KEY_LABELS("brake")} to stop · ${Math.round(Math.abs(carState.v) * MPH)} mph`,
  },
  {
    t: "ROCKET MODE",
    hl: ["rocket"],
    say: "Here comes the good part. Open the plate.",
    obj: () =>
      carState.armed
        ? carState.spool < 1.2
          ? "Spooling the thrusters…"
          : ""
        : `Press ${KEY_LABELS("rocket")}: ROCKET MODE`,
  },
  {
    t: "HOVER",
    hl: ["hover"],
    say: "Hold to lift. Let go and she sinks, slow and safe.",
    obj: () =>
      `Hold ${KEY_LABELS("hover")} to climb · ${Math.max(0, carState.y - groundH(carState.x, carState.z, carState.y).h).toFixed(1)} / 6 m`,
  },
  {
    t: "FLY",
    hl: ["hover", "gas", "steer"],
    say: "Gas still means forward, even up here. Tap hover to keep your height.",
    obj: () =>
      carState.air
        ? `${KEY_LABELS("gas")} flies forward · ${Math.min(40, Math.round(Math.hypot(carState.x - currentMission.p0[0], carState.z - currentMission.p0[1])))} / 40 m`
        : `Hold ${KEY_LABELS("hover")} to lift again`,
  },
  {
    t: "LAND",
    hl: [],
    say: "Hands off. She sets you down by herself, nice and soft.",
    obj: () => (carState.air ? "Let go of everything · she lands herself" : "Landed"),
  },
  {
    t: "BOOST",
    hl: ["boost", "gas"],
    say: "And this is the rocket. Hold boost with the gas. Hold on.",
    obj: () =>
      `Hold ${KEY_LABELS("boost")} + ${KEY_LABELS("gas")} · ${Math.round(Math.max(0, carState.v) * MPH)} mph`,
  },
];
function tutTarget() {
  if (!currentMission) return null;
  return currentMission.step === 1 ? { x: TUTORIAL_PAD[0], z: TUTORIAL_PAD[1] } : null;
}
function tutHide() {
  if (TUTR) TUTR.visible = false;
  tutHL([]);
  if (DRONE) DRONE.g.visible = false;
}
function tutHL(list) {
  for (const k in TOUCH_BUTTONS) {
    const e = byId(TOUCH_BUTTONS[k]);
    if (e) e.classList.toggle("hl", list.includes(k));
  }
  const h = byId("ctlHint");
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
  if (TUTORIAL.live && currentMission && currentMission.def.id === "tutorial" && !currentMission.done) {
    const k = currentMission.step,
      c = currentMission.cp;
    if (k <= 3 || !c) {
      place(CAR_START.x, CAR_START.z, Math.PI / 2);
    } else place(c[0], c[1], c[2]);
    if (k >= 4) {
      carState.armed = true;
      carState.spool = 1.2;
      carState.bayK = 1;
    }
    carState.tank = 100;
    carState.heat = 25;
    if (flashT <= 0) flash("TRY AGAIN", "same step · no rush", 1.6);
    return;
  }
  place(CAR_START.x, CAR_START.z, Math.PI / 2);
}
function tutEnter(M, k) {
  M.step = k;
  M.st = clock;
  M.acc = 0;
  M.p0 = [carState.x, carState.z];
  if (k === 4) M.cp = [carState.x, carState.z, carState.yaw];
  const T = TSTEP[k];
  DROP_ZONE.visible = k === 1;
  if (DROP_ZONE.visible) {
    zoneColor(0xffc24a);
    DROP_ZONE.position.set(TUTORIAL_PAD[0], 0, TUTORIAL_PAD[1]);
  }
  if (k === 7) {
    carState.tank = 100;
    carState.heat = Math.min(carState.heat, 40);
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
    TUTORIAL.live = true;
    tutEnter(M, 0);
  }
  const k = M.step,
    agl = carState.y - groundH(carState.x, carState.z, carState.y).h;
  let next = false;
  if (k === 0) next = carState.v * MPH >= 30;
  else if (k === 1) next = Math.hypot(carState.x - TUTORIAL_PAD[0], carState.z - TUTORIAL_PAD[1]) < 7;
  else if (k === 2) next = Math.abs(carState.v) < 0.4 && !carState.air;
  else if (k === 3) next = carState.armed && carState.spool >= 1.2 && !cinematic.on;
  else if (k === 4) next = carState.air && agl >= 6;
  else if (k === 5)
    next = carState.air && Math.hypot(carState.x - M.p0[0], carState.z - M.p0[1]) >= 40;
  else if (k === 6) next = !!(ev && ev.land != null);
  else if (k === 7) {
    if (carState.thrust === 2) M.acc += dt;
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
  if (n >= 4 && !carState.armed && !M.done) {
    o = `Press ${KEY_LABELS("rocket")} again: ROCKET MODE is off`;
    tutHL(["rocket"]);
  }
  return [o, `STEP ${n + 1} / ${TSTEP.length}`];
}
byId("tutSkip").addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentMission && !currentMission.done && currentMission.def.id === "tutorial" && phase === "play")
    finish(
      true,
      "Tutorial skipped. Replay it any time: it is TEST 00 in the list.",
      { time: clock - currentMission.t0 },
    );
});
MISSIONS.find((m) => m.id === "jam").n = "20";
MISSIONS.push({
  id: "tutorial",
  r: 200,
  n: "00",
  t: "First Drive",
  b: "The controls, one at a time: gas, steer, brake, Rocket Mode, hover, fly, land and boost. No clock, no fail.",
  spawn: () => tutSpawn(),
});
CHAPTERS[0] = Object.assign({}, CHAPTERS[0], {
  t: "FIRST DRIVE",
  mis: missionIndex("tutorial"),
  who: "MAE",
  intro: "New car, new rules. One control at a time, I'll talk you through it.",
  outro: "Look at you. Drives, flies, lands. Oh no. Zero, my drone!",
});
EARN.diamond.have = () =>
  MISSIONS.filter((m) => !m.hidden && m.id !== "tutorial" && medalOf(m.id) >= 3)
    .length;
EARN.diamond.need = () =>
  MISSIONS.filter((m) => !m.hidden && m.id !== "tutorial").length;

/* ---- per-frame hook ---- */
function v23Tick(rdt, dt) {
  if (cinematic.on && cinematic.rev) revealTick(dt);
  const sk = phase === "play" && cinematic.on && (cinematic.rev || cinematic.kind === "hover");
  if (byId("cinSkip").hidden === sk) byId("cinSkip").hidden = !sk;
  const ts =
    phase === "play" && currentMission && !currentMission.done && currentMission.def.id === "tutorial" && !cinematic.on;
  if (byId("tutSkip").hidden === ts) byId("tutSkip").hidden = !ts;
}
MEDAL.rings = { t: 42, s: 55 }; // hover is slower since V23
MEDAL.launch = { t: 0.65, s: 0.8 }; // boost is a rocket since V24

/* ================= V25: story missions with films · Rogue Drone · route previews ================= */
// moving instanced meshes kept a bounding sphere from before they were placed, so traffic and CrewBots vanished
// whenever the city origin was off screen while still colliding. Never cull them.
for (const T of Object.values(VEHICLE_TYPES))
  if (T.meshes)
    T.meshes.forEach((m) => {
      m.frustumCulled = false;
    });
if (TRAFFIC.wheels) TRAFFIC.wheels.frustumCulled = false;
["torso", "head", "visor", "legs", "arms"].forEach((k) => {
  if (WALKERS[k]) WALKERS[k].frustumCulled = false;
});

/* ---- the drone ---- */
var DRONE = (() => {
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
