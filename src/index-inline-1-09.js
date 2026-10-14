// index-inline-1 09 — three
// Lines 80920-81219 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const g = new THREE.Group();
  g.position.set(16, 0.2, 368);
  g.rotation.y = -0.45;
  scene.add(g);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 360;
  const x = c.getContext("2d");
  x.fillStyle = "#f4efe4";
  x.beginPath();
  x.moveTo(256, 6);
  x.lineTo(506, 150);
  x.lineTo(256, 354);
  x.lineTo(6, 150);
  x.closePath();
  x.fill();
  x.fillStyle = "#d8203a";
  x.font = "800 34px Saira, Arial Black, sans-serif";
  x.textAlign = "center";
  x.fillText("WELCOME TO", 256, 120);
  x.fillStyle = "#1b3fa0";
  x.font = "900 64px Saira, Arial Black, sans-serif";
  x.fillText("LAS VEGAS", 256, 190);
  x.fillStyle = "#d8203a";
  x.font = "800 26px Saira, Arial Black, sans-serif";
  x.fillText("NEVADA", 256, 236);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 5.06),
    new THREE.MeshStandardMaterial({
      map: t,
      transparent: true,
      emissive: 0xffffff,
      emissiveMap: t,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  board.position.y = 5.2;
  g.add(board);
  for (const sx of [-1.3, 1.3]) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 3.2, 0.25),
      new THREE.MeshStandardMaterial({
        color: 0x7a7f88,
        metalness: 0.6,
        roughness: 0.4,
      }),
    );
    p.position.set(sx, 1.6, -0.05);
    g.add(p);
  }
}

/* ---------------- traffic: four original vehicle types ---------------- */
// every type: length L, width W, parts [geometry, material, perInstanceColour?], wheel spots and light offsets
const VEHICLE_TYPES = {};
{
  const glass = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.08,
      metalness: 0.9,
    }),
    paint = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.55,
    }),
    dark = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.7 });
  const B = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  };
  const capsule = (r, l, sy, y) => {
    const g = new THREE.CapsuleGeometry(r, l, 4, 10);
    g.rotateX(Math.PI / 2);
    g.scale(1, sy, 1);
    g.translate(0, y, 0);
    return g;
  };
  const dome = (sx, sy, sz, y, z) => {
    const g = new THREE.SphereGeometry(
      1,
      12,
      6,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    g.scale(sx, sy, sz);
    g.translate(0, y, z);
    return g;
  };
  const hlM = new THREE.MeshBasicMaterial({
      color: new THREE.Color(3.2, 3.2, 3),
    }),
    tlM = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.2, 0.15) }),
    teal = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.3, 2.2, 2.4),
    }),
    amber = new THREE.MeshBasicMaterial({
      color: new THREE.Color(3, 1.8, 0.3),
    });
  VEHICLE_TYPES.sedan = {
    L: 4.4,
    W: 1.9,
    cols: [
      0x9aa0a6, 0x1b1d22, 0xe9ecef, 0x7a1c1c, 0x1c3f7a, 0x3a3f45, 0xc7a24a,
    ],
    wheels: [
      [-0.85, 0.33, -1.35],
      [0.85, 0.33, -1.35],
      [-0.85, 0.33, 1.35],
      [0.85, 0.33, 1.35],
    ],
    wr: 0.33,
    parts: [
      [B(1.9, 0.62, 4.4, 0, 0.66, 0), paint, true],
      [B(1.62, 0.46, 2.1, 0, 1.2, 0.2), glass],
      [B(1.5, 0.06, 1.7, 0, 1.45, 0.25), paint, true],
      [B(1.5, 0.1, 0.05, 0, 0.74, -2.21), hlM],
      [B(1.6, 0.1, 0.05, 0, 0.8, 2.21), tlM],
    ],
  };
  VEHICLE_TYPES.cab = {
    L: 3.9,
    W: 1.8,
    cols: [0xf2f3f5],
    wheels: [
      [-0.78, 0.32, -1.15],
      [0.78, 0.32, -1.15],
      [-0.78, 0.32, 1.15],
      [0.78, 0.32, 1.15],
    ],
    wr: 0.32,
    parts: [
      [capsule(0.82, 2.2, 0.75, 0.78), paint, true],
      [dome(0.74, 0.62, 1.5, 1.05, 0.05), glass],
      [B(1.66, 0.07, 3.3, 0, 0.66, 0), teal],
      [B(0.62, 0.14, 0.3, 0, 1.72, 0.1), amber],
      [B(1.3, 0.08, 0.05, 0, 0.8, -1.93), hlM],
      [B(1.4, 0.08, 0.05, 0, 0.86, 1.93), tlM],
    ],
  };
  VEHICLE_TYPES.pickup = {
    L: 5.6,
    W: 2.05,
    cols: [0x3b4047, 0x14161a, 0x5c6f86, 0xd9dcdf, 0x7b2a22],
    wheels: [
      [-0.95, 0.42, -1.8],
      [0.95, 0.42, -1.8],
      [-0.95, 0.42, 1.8],
      [0.95, 0.42, 1.8],
    ],
    wr: 0.42,
    parts: [
      [B(2.05, 0.8, 5.6, 0, 0.9, 0), paint, true],
      [B(1.95, 0.8, 2.3, 0, 1.68, -0.55), paint, true],
      [B(1.99, 0.42, 2.0, 0, 1.8, -0.6), glass],
      [B(1.8, 0.12, 2.3, 0, 1.33, 1.55), dark],
      [B(1.7, 0.1, 0.05, 0, 1.05, -2.81), hlM],
      [B(1.8, 0.12, 0.05, 0, 1.1, 2.81), tlM],
    ],
  };
  VEHICLE_TYPES.hauler = {
    L: 16,
    W: 2.6,
    cols: [0xe9ecef, 0xb3121b, 0x1c3f7a, 0x3a3f45, 0x2c6b4f],
    wheels: [
      [-1.1, 0.55, -6.3],
      [1.1, 0.55, -6.3],
      [-1.1, 0.55, -3.6],
      [1.1, 0.55, -3.6],
      [-1.2, 0.55, 4.3],
      [1.2, 0.55, 4.3],
      [-1.2, 0.55, 5.8],
      [1.2, 0.55, 5.8],
    ],
    wr: 0.55,
    parts: [
      [B(2.5, 2.4, 2.8, 0, 2.1, -6.5), paint, true],
      [B(2.3, 0.9, 2.5, 0, 2.85, -6.7), glass],
      [B(2.2, 0.5, 15.6, 0, 0.9, 0.2), dark],
      [
        B(2.6, 3.2, 11.2, 0, 2.75, 2.3),
        new THREE.MeshStandardMaterial({
          color: 0xeef0f2,
          roughness: 0.5,
          metalness: 0.2,
        }),
      ],
      [B(2.1, 0.14, 0.05, 0, 1.4, -7.92), hlM],
      [B(2.4, 0.14, 0.05, 0, 1.3, 7.92), tlM],
    ],
  };
}
const TRAFFIC = [];
{
  const mix = isTouch
    ? { sedan: 28, cab: 16, pickup: 10, hauler: 4 }
    : { sedan: 64, cab: 32, pickup: 22, hauler: 10 };
  const r = rng(88);
  const wheelList = [];
  for (const [type, n] of Object.entries(mix)) {
    const T = VEHICLE_TYPES[type];
    T.meshes = T.parts.map(([g, m, pc]) => {
      const im = new THREE.InstancedMesh(g, m, n);
      if (pc)
        for (let i = 0; i < n; i++)
          im.setColorAt(i, new THREE.Color(T.cols[(r() * T.cols.length) | 0]));
      im.castShadow = m.type !== "MeshBasicMaterial";
      scene.add(im);
      return im;
    });
    T.n = n;
    for (let i = 0; i < n; i++) {
      const axis = r() < 0.5 ? "x" : "z";
      let line = -HALF + (1 + ((r() * (BLOCK_COUNT - 1)) | 0)) * BLOCK_PITCH;
      while (NOTRAF(axis, line)) line += BLOCK_PITCH;
      const _l = line,
        dir = r() < 0.5 ? 1 : -1;
      const car = {
        type,
        T,
        idx: i,
        axis,
        line: _l,
        dir,
        pos: -HALF + BLOCK_PITCH + r() * (BLOCK_COUNT - 2) * BLOCK_PITCH,
        sp: (type === "hauler" ? 8 : 9) + r() * (type === "hauler" ? 3 : 7),
        v: 0,
        x: 0,
        z: 0,
        yaw: 0,
        wait: 0,
        ghost: 0,
        nm: 0,
        wb: wheelList.length,
      };
      T.wheels.forEach(() => wheelList.push(car));
      TRAFFIC.push(car);
    }
  }
  const wg = new THREE.CylinderGeometry(1, 1, 1, 10);
  wg.rotateZ(Math.PI / 2);
  const wheels = new THREE.InstancedMesh(
    wg,
    new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.9 }),
    wheelList.length,
  );
  scene.add(wheels);
  TRAFFIC.wheels = wheels;
}
const scratchQuat = new THREE.Quaternion(),
  scratchVec3 = new THREE.Vector3();
// cars parked at the diner's charging stalls, nosed toward the screen
function vehicleModel(type, color) {
  const T = VEHICLE_TYPES[type],
    g = new THREE.Group();
  g.userData.paint = [];
  T.parts.forEach(([geo, m, pc]) => {
    const mm = pc ? m.clone() : m;
    if (pc) {
      mm.color = new THREE.Color(color);
      g.userData.paint.push(mm);
    }
    const o = new THREE.Mesh(geo, mm);
    o.castShadow = mm.type !== "MeshBasicMaterial";
    g.add(o);
  });
  const wg = new THREE.CylinderGeometry(1, 1, 1, 12);
  wg.rotateZ(Math.PI / 2);
  const wm = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.9,
  });
  T.wheels.forEach((w) => {
    const o = new THREE.Mesh(wg, wm);
    o.position.set(w[0], w[1], w[2]);
    o.scale.set(0.3, T.wr, T.wr);
    g.add(o);
  });
  return g;
}
{
  const r = rng(4242);
  for (const [x, z] of DINER.parked) {
    const type = r() < 0.4 ? "cab" : "sedan",
      T = VEHICLE_TYPES[type];
    const g = vehicleModel(type, T.cols[(r() * T.cols.length) | 0]);
    g.position.set(x, 0.2, z);
    g.rotation.y = -Math.PI / 2;
    scene.add(g);
    addB(x - T.L / 2, x + T.L / 2, z - T.W / 2, z + T.W / 2, 1.4, -1);
  }
}
let TRAFBLOCK = null;
