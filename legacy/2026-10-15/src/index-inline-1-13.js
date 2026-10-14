// index-inline-1 13 — three
// Lines 82146-82485 of readable/index-inline-1.pretty.js (statement-aligned).
function loft(sec, segs = 36, n = 4, cap = true) {
  const P = [],
    I = [];
  sec.forEach((s) => {
    const yc = (s.yb + s.yt) / 2,
      hh = (s.yt - s.yb) / 2;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2,
        c = Math.cos(a),
        sn = Math.sin(a);
      P.push(
        s.w * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
        yc + hh * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / (sn < 0 ? 8 : n)),
        s.z,
      );
    }
  });
  for (let i = 0; i < sec.length - 1; i++)
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j,
        b = i * segs + ((j + 1) % segs),
        c = a + segs,
        d = b + segs;
      I.push(a, c, b, b, c, d);
    }
  if (cap) {
    const f = P.length / 3;
    const s0 = sec[0],
      s1 = sec[sec.length - 1];
    P.push(0, (s0.yb + s0.yt) / 2, s0.z, 0, (s1.yb + s1.yt) / 2, s1.z);
    for (let j = 0; j < segs; j++) {
      I.push(f, (j + 1) % segs, j);
      const o = (sec.length - 1) * segs;
      I.push(f + 1, o + j, o + ((j + 1) % segs));
    }
  }
  for (let i = 0; i < I.length; i += 3) {
    const t = I[i + 1];
    I[i + 1] = I[i + 2];
    I[i + 2] = t;
  }
  const UV = [];
  sec.forEach((s, i) => {
    for (let j = 0; j < segs; j++) UV.push(j / segs, i / (sec.length - 1));
  });
  if (cap) UV.push(0.5, 0, 0.5, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
const paint = new THREE.MeshPhysicalMaterial({
  color: 0xb3121b,
  metalness: 0.4,
  roughness: 0.3,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  envMapIntensity: 0.9,
});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x07090c,
  metalness: 0.9,
  roughness: 0.04,
  clearcoat: 1,
  envMapIntensity: 1.6,
});
const carbon = new THREE.MeshPhysicalMaterial({
  color: 0x121316,
  metalness: 0.35,
  roughness: 0.32,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
});
const dark = new THREE.MeshStandardMaterial({
  color: 0x0b0c0e,
  roughness: 0.6,
  metalness: 0.3,
});
const car = new THREE.Group();
scene.add(car);
const body = new THREE.Group();
car.add(body);
{
  const b = new THREE.Mesh(
    loft(
      [
        { z: -2.3, w: 0.58, yb: 0.22, yt: 0.4 },
        { z: -2.14, w: 0.86, yb: 0.17, yt: 0.5 },
        { z: -1.75, w: 0.99, yb: 0.15, yt: 0.61 },
        { z: -1.15, w: 1.0, yb: 0.15, yt: 0.7 },
        { z: -0.5, w: 0.96, yb: 0.15, yt: 0.76 },
        { z: 0.25, w: 0.95, yb: 0.15, yt: 0.79 },
        { z: 0.95, w: 1.03, yb: 0.15, yt: 0.81 },
        { z: 1.55, w: 1.03, yb: 0.17, yt: 0.79 },
        { z: 2.05, w: 0.96, yb: 0.22, yt: 0.73 },
        { z: 2.3, w: 0.84, yb: 0.31, yt: 0.66 },
      ],
      48,
      4.6,
    ),
    paint,
  );
  b.castShadow = true;
  b.receiveShadow = true;
  body.add(b);
  const cab = new THREE.Mesh(
    loft(
      [
        { z: -1.1, w: 0.46, yb: 0.69, yt: 0.73 },
        { z: -0.65, w: 0.66, yb: 0.69, yt: 1.0 },
        { z: -0.1, w: 0.71, yb: 0.71, yt: 1.12 },
        { z: 0.45, w: 0.69, yb: 0.73, yt: 1.09 },
        { z: 0.95, w: 0.6, yb: 0.75, yt: 0.93 },
        { z: 1.3, w: 0.48, yb: 0.76, yt: 0.8 },
      ],
      40,
      2.8,
    ),
    glass,
  );
  cab.castShadow = true;
  body.add(cab);
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, 0.035, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x100000,
      emissive: 0xff1a1a,
      emissiveIntensity: 6,
    }),
  );
  tail.position.set(0, 0.6, 2.29);
  body.add(tail);
  car.userData.tail = tail;
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.028, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x111,
        emissive: 0xf4f7ff,
        emissiveIntensity: 2.1,
      }),
    );
    hl.position.set(s * 0.54, 0.49, -2.19);
    hl.rotation.set(0, s * 0.28, s * -0.08);
    body.add(hl);
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.7), dark);
    intake.position.set(s * 1.0, 0.44, 0.55);
    body.add(intake);
  }
  const diff = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.42), carbon);
  diff.position.set(0, 0.2, 2.12);
  body.add(diff);
  const split = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.3), carbon);
  split.position.set(0, 0.14, -2.1);
  body.add(split);
  for (const s of [-1, 1]) {
    const nz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.06, 0.12, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x9aa0a8,
        metalness: 1,
        roughness: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    nz.rotation.x = Math.PI / 2;
    nz.position.set(s * 0.72, 0.34, 2.27);
    body.add(nz);
  }
}
// headlights (real lights)
for (const sx of [-0.55, 0.55]) {
  const sp = new THREE.SpotLight(0xf1f4ff, 90, 170, 0.4, 0.6, 1.3);
  sp.position.set(sx, 0.55, -2.1);
  const tg = new THREE.Object3D();
  tg.position.set(sx * 2, -0.6, -30);
  car.add(sp, tg);
  sp.target = tg;
}
{
  const fill = new THREE.PointLight(0xff3020, 3, 7, 1.6);
  fill.position.set(0, 0.6, 2.6);
  car.add(fill);
}
// wheels
const wheels = [];
{
  const tire = new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.92,
    }),
    rimM = new THREE.MeshPhysicalMaterial({
      color: 0xb7bcc3,
      metalness: 1,
      roughness: 0.22,
      clearcoat: 0.6,
    }),
    disc = new THREE.MeshStandardMaterial({
      color: 0x5c5f63,
      metalness: 0.8,
      roughness: 0.4,
    }),
    cal = new THREE.MeshStandardMaterial({ color: 0xffb35c, roughness: 0.4 });
  [
    [-0.93, -1.38, 0.355, 1],
    [0.93, -1.38, 0.355, 1],
    [-0.93, 1.38, 0.37, 0],
    [0.93, 1.38, 0.37, 0],
  ].forEach(([x, z, r, front]) => {
    const steer = new THREE.Group();
    steer.position.set(x, r, z);
    car.add(steer);
    const spin = new THREE.Group();
    steer.add(spin);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 40), tire);
    t.rotation.z = Math.PI / 2;
    t.castShadow = true;
    spin.add(t);
    const rm = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.305, 30),
      rimM,
    );
    rm.rotation.z = Math.PI / 2;
    spin.add(rm);
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(
        new THREE.BoxGeometry(0.31, 0.05, r * 1.36),
        carbon,
      );
      sp.rotation.x = (k / 5) * Math.PI;
      spin.add(sp);
    }
    const d = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.03, 24),
      disc,
    );
    d.rotation.z = Math.PI / 2;
    d.position.x = -Math.sign(x) * 0.06;
    steer.add(d);
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.2), cal);
    cp.position.set(-Math.sign(x) * 0.1, 0.12, 0);
    steer.add(cp);
    wheels.push({ steer, spin, front, r });
  });
}
// active wing
const wing = new THREE.Group();
body.add(wing);
const wingInner = new THREE.Group();
wing.add(wingInner);
function airfoil(c, th) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(c * 0.08, th * 0.55, c * 0.45, th * 0.35, c, th * 0.05);
  s.bezierCurveTo(c * 0.55, -th * 0.9, c * 0.12, -th * 1.05, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 1.74,
    bevelEnabled: false,
    curveSegments: 14,
  });
  g.translate(0, 0, -0.87);
  g.rotateY(-Math.PI / 2);
  return g;
}
const mainEl = new THREE.Mesh(airfoil(0.44, 0.06), carbon);
mainEl.castShadow = true;
wingInner.add(mainEl);
const slat = new THREE.Mesh(airfoil(0.15, 0.03), carbon);
slat.position.set(0, -0.025, -0.17);
slat.rotation.x = 0.18;
wingInner.add(slat);
const plates = [];
for (const s of [-1, 1]) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.5), carbon);
  p.position.set(s * 0.87, 0, 0.17);
  wingInner.add(p);
  plates.push(p);
}
const arms = [];
for (const s of [-1, 1]) {
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.12), carbon);
  body.add(a);
  arms.push({ m: a, x: s * 0.5 });
}
function setWing(dp, ang) {
  const y = lerp(0.78, 1.3, dp),
    z = lerp(1.58, 1.86, dp);
  wing.position.set(0, y, z);
  wingInner.rotation.x = -THREE.MathUtils.degToRad(lerp(-1.5, ang, dp));
  slat.visible = dp > 0.25;
  slat.scale.setScalar(lerp(0.3, 1, clamp((dp - 0.25) / 0.75)));
  plates.forEach((p) => (p.visible = dp > 0.1));
  arms.forEach((a) => {
    const top = y - 0.02,
      bot = 0.66,
      h = Math.max(0.001, top - bot);
    a.m.visible = dp > 0.04;
    a.m.scale.y = h;
    a.m.position.set(a.x, bot + h / 2, z + 0.12);
  });
}
// shadow blob for softness
const blob = new THREE.Mesh(
  new THREE.PlaneGeometry(2.6, 5.2),
  new THREE.MeshBasicMaterial({
    color: 0x000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  }),
);
blob.rotation.x = -Math.PI / 2;
scene.add(blob);
{
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  blob.material.alphaMap = new THREE.CanvasTexture(c);
}

/* ---------------- particles ---------------- */
const puffTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
