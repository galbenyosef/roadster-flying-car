// index-inline-1 50 — three
// Lines 94244-94532 of readable/index-inline-1.pretty.js (statement-aligned).
function prop(o) {
  o.visible = false;
  scene.add(o);
  MISSION_REBUILD.props.push(o);
  return o;
}
function glowMat(hex, k = 3) {
  return new THREE.MeshStandardMaterial({
    color: 0x000,
    emissive: hex,
    emissiveIntensity: k,
  });
}
function burst(x, y, z, n = 36, sp = 10) {
  for (let q = 0; q < n; q++) {
    const r = Math.random;
    sparks.emit(
      x,
      y,
      z,
      (r() - 0.5) * sp,
      (r() - 0.2) * sp * 0.8,
      (r() - 0.5) * sp,
      0.9,
      0.28,
      0,
    );
  }
}
function labelSprite(txt, col = "#ffc24a", w = 0.2) {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 96;
  const x = cv.getContext("2d");
  x.font = "800 52px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = col;
  x.shadowColor = "rgba(0,0,0,.7)";
  x.shadowBlur = 8;
  x.fillText(txt, 256, 66);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: t,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: false,
    }),
  );
  s.scale.set(w, (w * 96) / 512, 1);
  return s;
}
// a glowing tether between two points (drone dock, food-truck hand-off)
const BEAM = (() => {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.5, 2.6, 3),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  m.visible = false;
  scene.add(m);
  return m;
})();
function beam(a, b, on, k = 1) {
  BEAM.visible = !!on;
  if (!on) return;
  const d = b.clone().sub(a),
    L = d.length();
  BEAM.position.copy(a).addScaledVector(d, 0.5);
  BEAM.scale.set(k, L, k);
  BEAM.quaternion.setFromUnitVectors(vec3(0, 1, 0), d.normalize());
  BEAM.material.opacity = 0.55 + 0.35 * Math.sin(clock * 40);
}

/* ---- hits: a sudden loss of speed that is not a landing ---- */
function impactTick(dt, ev) {
  const hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  const p = MISSION_REBUILD.hs0;
  MISSION_REBUILD.hs0 = hs;
  if (p == null || (ev && ev.land != null)) return 0;
  const dv = p - hs;
  return dv > Math.max(3.5, dt * 300) ? dv : 0;
}

/* ---- traffic keeps off the lines a mission needs ---- */
MISSION_REBUILD.lines = null;
{
  const tb = TRAFBLOCK;
  TRAFBLOCK = (ax, line) =>
    (tb && tb(ax, line)) ||
    !!(MISSION_REBUILD.lines && MISSION_REBUILD.lines[ax] && MISSION_REBUILD.lines[ax].includes(line));
}
function clearLines(L) {
  MISSION_REBUILD.lines = L;
  for (const c of TRAFFIC) {
    if (c.jam) continue;
    let k = 0;
    while (L[c.axis] && L[c.axis].includes(c.line) && k++ < 30) {
      c.line = -HALF + (2 + ((Math.random() * (BLOCK_COUNT - 4)) | 0)) * BLOCK_PITCH;
    }
  }
}

/* ---- mission set-up and clean-up ---- */
function v26Setup(d) {
  MISSION_REBUILD.hs0 = null;
  MISSION_REBUILD.onTrick = null;
  meter(null);
  const S0 = MISSION_REBUILD.setup && MISSION_REBUILD.setup[d.id];
  if (S0) {
    PADS.forEach((p) => (p.beam.visible = false));
    RINGS.forEach((r) => (r.m.visible = false));
    DROP_ZONE.visible = false;
    S0(d);
  }
}
function v26Clear() {
  MISSION_REBUILD.props.forEach((o) => (o.visible = false));
  MISSION_REBUILD.noRegen = MISSION_REBUILD.noServ = false;
  MISSION_REBUILD.lines = null;
  MISSION_REBUILD.onTrick = null;
  BEAM.visible = false;
  meter(null);
  const t = byId("tree");
  if (t) t.classList.remove("on");
  RIVALS.forEach((r) => {
    if (!RACE.on && !CHASE.on) r.g.visible = false;
  });
}
MISSION_REBUILD.setup = {};

/* ---- 01 DRAG STRIP: a quarter mile on the boulevard against RAZOR. Jump the light and you are out. ---- */
const DRAG = { z0: 440, z1: 38, x: 3.5, rx: -3.5 };
function stripeMesh(z, txt) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  g.add(m);
  g.position.set(0, 0, z);
  return g;
}
const DRAGP = (() => {
  const g = new THREE.Group();
  const post = new THREE.MeshStandardMaterial({
    color: 0x22252b,
    metalness: 0.6,
    roughness: 0.4,
  });
  for (const sx of [-9, 9]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), post);
    p.position.set(sx, 4.5, DRAG.z1);
    g.add(p);
  }
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 128;
  const x = cv.getContext("2d");
  for (let i = 0; i < 32; i++)
    for (let j = 0; j < 4; j++) {
      x.fillStyle = (i + j) % 2 ? "#111" : "#f2f2f2";
      x.fillRect(i * 32, j * 32, 32, 32);
    }
  x.fillStyle = "rgba(0,0,0,.72)";
  x.fillRect(312, 14, 400, 100);
  x.font = "900 70px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = "#ffc24a";
  x.fillText("FINISH", 512, 90);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const ban = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 2.25),
    new THREE.MeshStandardMaterial({
      map: t,
      emissive: 0xffffff,
      emissiveMap: t,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  ban.position.set(0, 8, DRAG.z1);
  g.add(ban);
  g.add(stripeMesh(DRAG.z1), stripeMesh(DRAG.z0 - 2.6));
  // the light tree on the median at the start line
  const tree = new THREE.Group();
  tree.position.set(0, 0, DRAG.z0 - 3.5);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), post);
  pole.position.y = 1.7;
  tree.add(pole);
  const lamps = [];
  [0xffa21a, 0xffa21a, 0xffa21a, 0x2bff6a].forEach((c, i) => {
    const mt = new THREE.MeshStandardMaterial({
      color: 0x111,
      emissive: c,
      emissiveIntensity: 0,
    });
    for (const sz of [-0.22, 0.22]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mt);
      l.position.set(0, 3.2 - i * 0.38, sz);
      tree.add(l);
    }
    lamps.push(mt);
  });
  const red = new THREE.MeshStandardMaterial({
    color: 0x111,
    emissive: 0xff2020,
    emissiveIntensity: 0,
  });
  const rl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), red);
  rl.position.set(0, 1.62, 0);
  tree.add(rl);
  lamps.push(red);
  g.add(tree);
  g.userData.lamps = lamps;
  return prop(g);
})();
function treeSet(n, red) {
  const L = DRAGP.userData.lamps;
  L.forEach((m, i) => {
    m.emissiveIntensity =
      i < 3
        ? n > i && n < 4
          ? 7
          : 0
        : i === 3
          ? n >= 4
            ? 9
            : 0
          : red
            ? 9
            : 0;
  });
  const el = byId("tree");
  if (!el) return;
  el.classList.add("on");
  el.querySelectorAll("i").forEach(
    (q, i) =>
      (q.className =
        i < 3
          ? n > i && n < 4
            ? "a"
            : ""
          : i === 3
            ? n >= 4
              ? "g"
              : ""
            : red
              ? "r"
              : ""),
  );
}
// RAZOR's run: a 0.20-0.32 s reaction, a nitrous launch, then a long pull to 237 mph (about 5.9 s)
function razorAcc(v) {
  return v < 27 ? 40 : v < 60 ? 28 : v < 100 ? 18 : v < 106 ? 18 : 0;
}
MISSION_REBUILD.setup.launch = (d) => {
  DRAGP.visible = true;
  clearLines({ z: [0], x: [384, 288, 192, 96] });
  const R = RIVALS[1];
  RIVALS.forEach((r) => (r.g.visible = r === R));
  R.g.position.set(DRAG.rx, 0, DRAG.z0);
  R.g.rotation.y = 0;
  R.sp = 0;
  place(DRAG.x, DRAG.z0, 0);
  Object.assign(currentMission, {
    rs: "stage",
    tr: 0,
    rz: DRAG.z0,
    rv: 0,
    react: 0.2 + Math.random() * 0.12,
    go: null,
    jump: false,
    rt: null,
    rdone: null,
    pdone: null,
  });
  treeSet(0);
  rivalWheels();
};
