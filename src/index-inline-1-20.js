// index-inline-1 20 — spawn
// Lines 84435-84771 of readable/index-inline-1.pretty.js (statement-aligned).
const rimMat = wheels[0].spin.children[1].material,
  calMat = wheels[0].steer.children[2].material,
  RIM0 = "#" + rimMat.color.getHexString(),
  CAL0 = "#" + calMat.color.getHexString();
const glowM = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 4.7),
  new THREE.MeshBasicMaterial({
    color: 0xff2bd6,
    alphaMap: blob.material.alphaMap,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
glowM.rotation.x = -Math.PI / 2;
glowM.position.y = 0.06;
glowM.visible = false;
car.add(glowM);
// the paint reflects the real city: one environment capture of the Strip, taken at load
const carEnv = (() => {
  try {
    return pmrem.fromScene(scene, 0.02, 1, 2600, {
      position: new THREE.Vector3(3.5, 14, 360),
      size: 256,
    }).texture;
  } catch (e) {
    return null;
  }
})();
if (carEnv) {
  paint.envMap = carEnv;
  glass.envMap = carEnv;
  rimMat.envMap = carEnv;
}
function applySkin(s) {
  skinMat(paint, s);
  rimMat.color.set(s.rim || RIM0);
  rimMat.emissive.set(s.rimE || "#000000");
  rimMat.emissiveIntensity = s.rimE ? 2.2 : 1;
  calMat.color.set(s.cal || CAL0);
  glowM.visible = !!s.glow;
  if (s.glow) glowM.material.color.set(s.glow).multiplyScalar(1.3);
}
const UPG = [
  { id: "tank", n: "AIR TANK", d: "Hover uses 15% less air per level" },
  { id: "cool", n: "COOLING", d: "Thrusters heat up 18% slower per level" },
  { id: "thrust", n: "THRUST", d: "+12% boost push and +10% climb per level" },
  { id: "grip", n: "GRIP", d: "+7% tyre grip per level: tighter turns" },
  { id: "power", n: "POWER", d: "+10% motor power per level" },
];
const UCOST = [400, 900, 1600],
  U = (id) => ECO.upg[id] | 0,
  VSEL = () => VEH[0];
let veh = VEH[0],
  curPaint = "#B3121B";
const ALT = {};
function applyVehicle(v) {
  veh = VEH[0];
  body.visible = true;
  wheels.forEach((w) => (w.steer.visible = true));
  applySkin(SKIN());
  const hv = $("tbHov");
  if (hv) hv.querySelector("i").textContent = "HOVER";
}
function flash(a, b, d = 2.4) {
  $("msgbig").textContent = a;
  $("msgsmall").textContent = tx(b) || "";
  flashT = d;
}
function place(x, z, yaw) {
  S.loop = null;
  S.ball = false;
  S.rollV = 0;
  S.spinA = 0;
  S.susp = 0;
  S.suspV = 0;
  S.pitchV = 0;
  S.vyaw = yaw;
  S.dr = 0;
  S.slip = 0;
  S.rampOn = null;
  S.jumpR = null;
  S.gvy = 0;
  S.airT = 0;
  if (typeof SCORE !== "undefined") SCORE.drift = 0;
  if (typeof TRAFFIC !== "undefined") setTimeout(clearLane, 0);
  S.x = x;
  S.z = z;
  S.y = groundH(x, z).h + 0.02;
  S.yaw = yaw;
  S.v = 0;
  S.vx = S.vz = S.vy = 0;
  S.air = false;
  S.armed = false;
  S.spool = 0;
  S.crash = 0;
  S.thermal = false;
  body.position.y = 0;
  prevZ = z;
  try {
    camPos.set(x + Math.sin(yaw) * 6, S.y + 2, z + Math.cos(yaw) * 6);
    look.set(x, S.y + 0.7, z);
  } catch (e) {}
}
// snap to the nearest street lane (right-hand traffic)
function atStreet(x, z) {
  const lx = Math.round((x + HALF) / P) * P - HALF,
    lz = Math.round((z + HALF) / P) * P - HALF;
  if (Math.abs(x - lx) <= Math.abs(z - lz)) {
    const zz = clamp(z, -HALF + 12, HALF - 12);
    place(lx + 3.5, zz, 0);
  } else {
    const xx = clamp(x, -HALF + 12, HALF - 12);
    place(xx, lz - 3.5, -Math.PI / 2);
  }
}
function clearLane() {
  for (const c of TRAFFIC) {
    if (Math.hypot(c.x - S.x, c.z - S.z) < 70) {
      c.pos += (c.pos > 0 ? -1 : 1) * 160;
    }
  }
}
function atPad(label, faceLabel) {
  const p = PADS.find((q) => q.label === label),
    f = faceLabel ? PADS.find((q) => q.label === faceLabel) : null;
  place(p.x, p.z, f ? Math.atan2(-(f.x - p.x), -(f.z - p.z)) : 0);
}
function respawn(manual) {
  if (manual && M && !M.done && M.def.id === "tutorial") {
    M.def.spawn();
    return;
  }
  if (mission && manual) {
    if (STORY.on && STORY.cur >= 0 && CH[STORY.cur].mis === mission) {
      startChapter(STORY.cur);
      return;
    }
    startMission(mission);
    return;
  }
  if (mission && M && !M.done) {
    M.def.spawn();
    return;
  }
  atStreet(S.x, S.z);
  S.tank = Math.max(S.tank, 40);
  S.heat = 25;
}
function padAt(x, z, y) {
  for (const p of PADS) {
    if (Math.hypot(x - p.x, z - p.z) < p.r - 0.6 && Math.abs(y - p.y) < 1.2)
      return p;
  }
  return null;
}

/* ---------------- missions ---------------- */
const MIS = [
  {
    id: "launch",
    r: 300,
    n: "01",
    t: "Launch Control",
    b: "Hit SPACE + X for ROCKET MODE, let it spool, then hold B and W. Reach 60 mph in under 1.5 s.",
    spawn: () => place(3.5, 440, 0),
  },
  {
    id: "hover",
    r: 400,
    n: "02",
    t: "First Hover",
    b: "Hover at 3 m or higher for 8 s over the plaza, then land inside the BOX under 3.5 m/s.",
    spawn: () => {
      const B = PADS.find((p) => p.box);
      place(B.x, B.z + 28, 0);
    },
  },
  {
    id: "pad",
    r: 600,
    n: "03",
    t: "Pad to Pad",
    b: "Lift off from the Pad A rooftop and land on the Pad B rooftop within 60 s. Fly the streets or climb over the towers.",
    spawn: () => atPad("A", "B"),
  },
  {
    id: "rings",
    r: 800,
    n: "04",
    t: "Ring Run",
    b: "Fly through all 6 rings in order, then land on the Pad C rooftop.",
    spawn: () => place(3.5, 340, 0),
  },
  {
    id: "drift",
    r: 700,
    n: "05",
    t: "Drift King",
    b: "Score 4,000 drift points in 45 s. Turn hard at speed; tap brake while steering to kick the rear out.",
    spawn: () => place(3.5, 440, 0),
  },
  {
    id: "relay",
    r: 1000,
    n: "06",
    t: "Rooftop Relay",
    b: "Land on Pad A, then Pad C, then Pad B within 120 s. Each pad tops up your air.",
    spawn: () => {
      const B = PADS.find((p) => p.box);
      place(B.x, B.z + 28, 0);
    },
  },
  {
    id: "deck",
    r: 1200,
    n: "07",
    t: "Front Row Seat",
    b: "Land on the launch tower deck (100 m) before T-0. Then watch the liftoff from up there.",
    spawn: () => place(387.5, 540, 0),
  },
  {
    id: "race",
    r: 1500,
    n: "08",
    t: "Street Race",
    b: "Two laps against the Chrome Kings: boulevard, park, the fab and back. Hit every neon gate. Follow the arrows.",
    race: true,
    spawn: () => raceSetup("street"),
  },
  {
    id: "courier",
    r: 900,
    n: "09",
    t: "Special Delivery",
    b: "Three hot orders from the diner. Stop inside each glowing drop zone within 120 s. Fly if you like.",
    spawn: () => place(DINER.x0 - 8 + 3.2, (DINER.z0 + DINER.z1) / 2, 0),
  },
  {
    id: "ramps",
    r: 1000,
    n: "10",
    t: "Stunt Yard",
    b: "Launch off 4 different ramps in the Stunt Yard and land every jump within 75 s. Boost is fine; hovering does not count.",
    spawn: () => place(-668.8, -20, 0),
  },
  {
    id: "chase",
    r: 1200,
    n: "11",
    t: "Tail VEX",
    b: "VEX has the telemetry pod. Stay within 70 m of him for 45 s. Step outside 70 m and the mission fails.",
    spawn: () => chaseSetup(),
  },
  {
    id: "skytour",
    r: 1400,
    n: "12",
    t: "Sky Tour",
    b: "Fly through 4 sky rings (wheel, diner, Megafab, tower), then land on the tower deck. Each ring tops up 25% air.",
    spawn: () => atPad("A", "B"),
  },
  {
    id: "truck",
    r: 1100,
    n: "14",
    t: "Truck Jump",
    b: "Three haulers are parked across the Stunt Yard street. Hit the street ramp at speed and clear all three. Boost is fine; hovering does not count. 40 s.",
    spawn: () => place(-668.8, -60, 0),
  },
  {
    id: "bigair",
    r: 1300,
    n: "15",
    t: "Big Air",
    b: "Mega Ramp. One jump with 2.0 s of airtime or more, landed clean. 60 s.",
    spawn: () => place(-610, 30, 0),
  },
  {
    id: "stuntshow",
    r: 1500,
    n: "16",
    t: "Stunt Show",
    b: "5,000 stunt points in 60 s. Airtime, drifts, spins and near misses all score, and chaining them inside 4 s multiplies everything up to ×5.",
    spawn: () => place(-668.8, -20, 0),
  },
  {
    id: "loop",
    r: 1400,
    n: "18",
    t: "Loop the Loop",
    b: "The 360° loop in the Stunt Yard. Hit it at 55 mph or more and go all the way round. 45 s.",
    spawn: () => place(-816, 70, 0),
  },
  {
    id: "final",
    r: 5000,
    n: "17",
    t: "Showdown",
    b: "The last race. Two laps of the whole Strip against the Chrome Kings at full speed. Six corners, one left. Only a win counts.",
    race: true,
    spawn: () => raceSetup("final"),
  },
  {
    id: "catch",
    r: 1600,
    n: "13",
    t: "Booster Catch",
    b: "The booster is flying home. Reach the gold VIEW POINT on the viewing field and stop inside it before touchdown.",
    spawn: () => {
      const B = PADS.find((p) => p.box);
      place(B.x, B.z + 28, 0);
    },
  },
];
function renderMissionList() {
  $("mlist").innerHTML = "";
  MIS.map((m, i) => [m, i])
    .sort((a, b) => {
      const k = (n) => {
        const v = parseInt(n, 10);
        return isNaN(v) ? 99 : v;
      };
      return k(a[0].n) - k(b[0].n);
    })
    .forEach(([m, i]) => {
      if (m.hidden) return;
      const b = document.createElement("button");
      b.className = "mis";
      const best = parseFloat(store.get("rfc_" + m.id));
      b.innerHTML = `<div class="n">TEST ${m.n}${window.__MED ? window.__MED(m.id) : ""}</div><div class="t">${m.t}</div><div class="b">${best ? "best " + best.toFixed(2) + " s · <span class=rw>+" + Math.round(m.r / 4) + " CR</span>" : "<span class=rw>REWARD " + m.r.toLocaleString("en-US") + " CR</span>"}</div>`;
      b.addEventListener("click", () => startMission(i));
      $("mlist").appendChild(b);
    });
}
renderMissionList();
