// index-inline-1 17 — three
// Lines 83479-83813 of readable/index-inline-1.pretty.js (statement-aligned).
const S = {
  x: 0,
  z: 0,
  y: 0,
  vx: 0,
  vz: 0,
  vy: 0,
  yaw: 0,
  vyaw: 0,
  dr: 0,
  slip: 0,
  v: 0,
  steer: 0,
  air: false,
  armed: false,
  spool: 0,
  tank: 100,
  heat: 25,
  thermal: false,
  crash: 0,
  dp: 0,
  ang: 0,
  pitch: 0,
  roll: 0,
  drift: 0,
  wingMode: "",
  state: "GROUND",
  thrust: 0,
  bayK: 0,
  glx: 0,
  glz: 0,
};
let phase = "gate",
  clock = 0,
  shake = 0,
  scrape = 0,
  servicing = false,
  flashT = 0,
  lapStart = 0,
  lapBest = parseFloat(store.get("rfc_lap")) || null,
  half = false,
  lastS = 0,
  mission = null,
  lastMission = null,
  M = null,
  prevZ = 0;
const cin = { on: false, t: 0, dur: 0, full: false, k0: 0, lit: false };
function startArmCin() {
  const full = revealOK();
  if (full) ONCE.arm = true;
  rco = null;
  Object.assign(cin, {
    on: true,
    t: 0,
    kind: "arm",
    full,
    rev: full,
    rt: !full,
    dur: full ? REVEAL_DUR : 1.3,
    k0: S.bayK,
    lit: false,
    cue: 0,
    shot: null,
    mv: Math.abs(S.v) > 3,
  });
  $("cinK").textContent = "SYSTEM 04 · REAR BAY";
  $("cinT").textContent = "ROCKET MODE";
  $("cinS").textContent = "PLATE UNLOCK · SPOOL 1.2 S";
  $("cinS2").textContent = "4 × COLD-GAS THRUSTERS · ONLINE";
  $("slowx").textContent = full
    ? Math.abs(S.v) > 3
      ? "0.12×"
      : "0.30×"
    : "0.22×";
  document.body.classList.toggle("cine", full);
  $("cinS2").classList.remove("on");
  $("cinT").classList.remove("go");
  void $("cinT").offsetWidth;
  $("cinT").classList.add("go");
  if (full) {
  } else
    audio.seq([
      [0, "unlock"],
      [180, "hinge"],
      [650, "ignite"],
    ]);
}
// "cinematic moments": bullet-time showcases of the flight mechanics. Controls stay live.
let showOn = true,
  lastShow = -99;
const seen = {};
const vecMat = new THREE.MeshBasicMaterial({
  color: 0x8fe3ff,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const plumeMat = new THREE.MeshBasicMaterial({
  color: 0xbfeeff,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const LIFTN = [
  [-0.7, -1.25],
  [0.7, -1.25],
  [-0.7, 1.2],
  [0.7, 1.2],
];
const vecs = LIFTN.map(([x, z]) => {
  const g = new THREE.Group();
  g.position.set(x, 0.12, z);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1, 8, 1, true),
    vecMat,
  );
  shaft.position.y = -0.5;
  g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 14), vecMat);
  head.rotation.x = Math.PI;
  head.position.y = -1.06;
  g.add(head);
  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 1.1, 24, 1, true),
    plumeMat,
  );
  plume.rotation.x = Math.PI;
  plume.position.y = -0.65;
  plume.scale.set(1, 1, 1);
  g.add(plume);
  g.visible = false;
  body.add(g);
  return g;
});
const rvecs = BAYP.map(([x, y]) => {
  const g = new THREE.Group();
  g.position.set(x, y, 2.42);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1, 8, 1, true),
    vecMat,
  );
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.5;
  g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 14), vecMat);
  head.rotation.x = Math.PI / 2;
  head.position.z = 1.12;
  g.add(head);
  g.visible = false;
  body.add(g);
  return g;
});
const shock = new THREE.Mesh(
  new THREE.RingGeometry(0.8, 1, 72),
  new THREE.MeshBasicMaterial({
    color: 0xcff3ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
);
shock.rotation.x = -Math.PI / 2;
shock.visible = false;
scene.add(shock);
const SHOW = {
  hover: {
    dur: 3.6,
    title: "HOVER",
    k: "FLIGHT SYSTEM · LIFT",
    sub: "COUNTER-GRAVITY · 4 LIFT JETS",
    call: [
      {
        at: 0.12,
        a: () => body.localToWorld(new THREE.Vector3(-0.7, 0.1, -1.25)),
        dx: -170,
        dy: -80,
        t: "LIFT JET ×4",
        v: "cold gas · straight down",
      },
      {
        at: 0.3,
        a: () => new THREE.Vector3(S.x, groundH(S.x, S.z, S.y).h + 0.05, S.z),
        dx: 170,
        dy: 70,
        t: "GROUND EFFECT",
        v: "−20% air use under 3 m",
      },
      {
        at: 0.46,
        a: () => body.localToWorld(new THREE.Vector3(0, 1.1, 0.2)),
        dx: 160,
        dy: -100,
        t: "CLIMB 6 m/s",
        v: "hold SPACE · ceiling 80 m",
      },
    ],
  },
  launch: {
    dur: 11,
    freeze: true,
    slow: "0.45×",
    ts: (p) =>
      p < 0.22 ? 0.45 : p < 0.32 ? lerp(0.45, 1, (p - 0.22) / 0.1) : 1,
    title: "LIFTOFF",
    k: "SKYLINE ONE · REUSABLE BOOSTER",
    sub: "IT FLIES BACK AND LANDS ITSELF",
    call: [
      {
        at: 0.05,
        a: () => ROCKET.g.localToWorld(new THREE.Vector3(0, 1, 0)),
        dx: 170,
        dy: 40,
        t: "LIFTOFF",
        v: "T+0 · full thrust",
      },
      {
        at: 0.3,
        a: () => ROCKET.g.localToWorld(new THREE.Vector3(0, 66, 0)),
        dx: -180,
        dy: -40,
        t: "70 m ROCKET",
        v: "lands itself · flies again",
      },
      {
        at: 0.5,
        a: () => new THREE.Vector3(LS.tower.x, LS.tower.h, LS.tower.z),
        dx: 170,
        dy: -60,
        t: "LAUNCH TOWER",
        v: "deck at 100 m",
      },
    ],
  },
  land: {
    dur: 8.5,
    freeze: true,
    ts: () => 1,
    title: "TOUCHDOWN",
    k: "SKYLINE ONE · BOOSTER RETURN",
    sub: "IT FLEW BACK AND LANDED ITSELF",
    call: [
      {
        at: 0.1,
        a: () => ROCKET.g.localToWorld(new THREE.Vector3(0, 4, 0)),
        dx: 170,
        dy: -30,
        t: "BOOSTER RETURN",
        v: "down from 1,300 m",
      },
      {
        at: 0.42,
        a: () => new THREE.Vector3(LS.lz.x, 0.4, LS.lz.z),
        dx: -170,
        dy: 30,
        t: "LANDING ZONE",
        v: "40 m pad · dead centre",
      },
    ],
  },
  jump: {
    dur: 2.4,
    slow: "0.22×",
    ts: (p) =>
      p < 0.06
        ? lerp(1, 0.22, p / 0.06)
        : p < 0.78
          ? 0.22
          : lerp(0.22, 1, (p - 0.78) / 0.22),
    title: "AIRTIME",
    k: "STUNT YARD · WHEELS ONLY",
    sub: "NO THRUSTERS. JUST SPEED.",
    call: [
      {
        at: 0.14,
        a: () => body.localToWorld(new THREE.Vector3(0.95, 0.3, 1.38)),
        dx: 170,
        dy: 50,
        t: "WHEELS UP",
        v: "pure ballistic flight",
      },
    ],
  },
  finish: {
    dur: 3.2,
    slow: "0.30×",
    ts: (p) =>
      p < 0.06
        ? lerp(1, 0.3, p / 0.06)
        : p < 0.86
          ? 0.3
          : lerp(0.3, 1, (p - 0.86) / 0.14),
    title: "PHOTO FINISH",
    k: "FINAL LAP · LAST 100 m",
    sub: "WHO TAKES IT?",
    call: [],
  },
  boost: {
    dur: 2.8,
    title: "BOOST",
    k: "FLIGHT SYSTEM · THRUST",
    sub: "4 REAR THRUSTERS · FULL VECTOR",
    call: [
      {
        at: 0.12,
        a: () => body.localToWorld(new THREE.Vector3(0, 0.45, 2.45)),
        dx: 150,
        dy: -80,
        t: "4 REAR THRUSTERS",
        v: "from behind the plate",
      },
      {
        at: 0.3,
        a: () => body.localToWorld(new THREE.Vector3(0, 0.55, -2.3)),
        dx: -170,
        dy: -70,
        t: "3.3 g FORWARD",
        v: "32 m/s² · to 245 mph",
      },
      {
        at: 0.46,
        a: () => body.localToWorld(new THREE.Vector3(0.5, 0.62, 2.2)),
        dx: 190,
        dy: -150,
        t: "HEAT +12 °C/s",
        v: "about 6 s to cutoff",
      },
    ],
  },
};
