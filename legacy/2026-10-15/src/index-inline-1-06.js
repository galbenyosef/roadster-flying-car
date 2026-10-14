// index-inline-1 06 — three
// Lines 80194-80497 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const n = TREES.length,
    r = rng(61);
  const trunk = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.28, 3, 5),
    new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.9 }),
    n,
  );
  const crown = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(2.2, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }),
    n,
  );
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler(),
    C = new THREE.Color();
  TREES.forEach(([x, z, s], i) => {
    addProp(x, z, 0.28 * s, 3.5 * s);
    M.compose(
      new THREE.Vector3(x, 0.2 + 1.5 * s, z),
      Q.identity(),
      new THREE.Vector3(s, s, s),
    );
    trunk.setMatrixAt(i, M);
    M.compose(
      new THREE.Vector3(x, 0.2 + 3.9 * s, z),
      Q.setFromEuler(E.set(0, r() * 6, 0)),
      new THREE.Vector3(
        s * (0.9 + r() * 0.3),
        s * (1 + r() * 0.4),
        s * (0.9 + r() * 0.3),
      ),
    );
    crown.setMatrixAt(i, M);
    crown.setColorAt(
      i,
      C.setHSL(0.24 + r() * 0.08, 0.45 + r() * 0.2, 0.26 + r() * 0.1),
    );
  });
  crown.castShadow = true;
  scene.add(trunk, crown);
  const B = PADS.find((p) => p.box);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    PALMS.push([B.x + Math.cos(a) * 22, B.z + Math.sin(a) * 22]);
  }
  const np = PALMS.length,
    ptr = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.16, 0.28, 9, 7),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 }),
      np,
    );
  const fg = new THREE.BoxGeometry(0.5, 0.05, 3.4);
  fg.translate(0, 0, 1.7);
  const frond = new THREE.InstancedMesh(
    fg,
    new THREE.MeshStandardMaterial({
      color: 0x2f5a34,
      roughness: 0.8,
      emissive: 0x0a1a0c,
    }),
    np * 8,
  );
  let k = 0;
  PALMS.forEach(([x, z], i) => {
    const hh = 8 + r() * 3;
    addProp(x, z, 0.4, hh);
    M.compose(
      new THREE.Vector3(x, 0.2 + hh / 2, z),
      Q.setFromEuler(E.set((r() - 0.5) * 0.08, 0, (r() - 0.5) * 0.08)),
      new THREE.Vector3(1, hh / 9, 1),
    );
    ptr.setMatrixAt(i, M);
    for (let f = 0; f < 8; f++) {
      Q.setFromEuler(
        E.set(0.45 + r() * 0.35, (f / 8) * Math.PI * 2 + r() * 0.3, 0, "YXZ"),
      );
      M.compose(
        new THREE.Vector3(x, 0.2 + hh, z),
        Q,
        new THREE.Vector3(1, 1, 0.8 + r() * 0.4),
      );
      frond.setMatrixAt(k++, M);
    }
  });
  ptr.castShadow = frond.castShadow = true;
  scene.add(ptr, frond);
}
// shipping containers in the industrial yards
{
  const n = CONT.length;
  if (n) {
    const m = new THREE.InstancedMesh(
      new THREE.BoxGeometry(6, 2.55, 2.45),
      new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.3 }),
      n,
    );
    const M = new THREE.Matrix4(),
      C = new THREE.Color();
    const cols = [0xb5452e, 0x2e6fb5, 0x3d8a4d, 0xd8a23a, 0x8a8f96];
    CONT.forEach(([x, z, y, c], i) => {
      M.makeTranslation(x, y, z);
      m.setMatrixAt(i, M);
      m.setColorAt(i, C.set(cols[c]));
    });
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}
/* ---------------- landmarks (original designs) ---------------- */
const neonMat = (r, g, b) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
function textPlane(txt, w, h, opt = {}) {
  const cv = document.createElement("canvas");
  cv.width = opt.cw || 1024;
  cv.height = opt.ch || 256;
  const x = cv.getContext("2d");
  if (opt.bg) {
    x.fillStyle = opt.bg;
    x.fillRect(0, 0, cv.width, cv.height);
  }
  x.font = opt.font || "900 150px Saira, Arial Black, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  if (opt.glow) {
    x.shadowColor = opt.glow;
    x.shadowBlur = 30;
  }
  x.fillStyle = opt.col || "#fff";
  x.fillText(txt, cv.width / 2, cv.height * 0.54, cv.width * 0.94);
  if (opt.sub) {
    x.shadowBlur = 0;
    x.font = opt.subFont || "700 44px JetBrains Mono, monospace";
    x.fillStyle = opt.subCol || "#fff";
    x.fillText(opt.sub, cv.width / 2, cv.height * 0.86, cv.width * 0.9);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: t,
      transparent: !opt.bg,
      side: THREE.DoubleSide,
      color: new THREE.Color(opt.bright || 1, opt.bright || 1, opt.bright || 1),
      depthWrite: !!opt.bg,
    }),
  );
}
// 1. SKYLINE DINER: a retro-futurist drive-in with a big outdoor screen and charging stalls
const DINER_SCREEN = {};
{
  const D = DINER,
    [bx0, bx1, bz0, bz1] = D.b,
    L = bx1 - bx0,
    W = bz1 - bz0,
    cx = (bx0 + bx1) / 2,
    cz = (bz0 + bz1) / 2;
  const steel = new THREE.MeshStandardMaterial({
      color: 0xe3e6ea,
      metalness: 0.85,
      roughness: 0.22,
    }),
    glassM = new THREE.MeshStandardMaterial({
      color: 0x172430,
      metalness: 0.8,
      roughness: 0.06,
    }),
    dark = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.6 });
  const add = (g, m, x, y, z) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    scene.add(o);
    return o;
  };
  add(new THREE.BoxGeometry(L, 4.2, W), steel, cx, 2.3, cz);
  add(new THREE.BoxGeometry(L - 1.2, 2.1, W + 0.12), glassM, cx, 2.7, cz);
  add(new THREE.BoxGeometry(L + 0.12, 2.1, W - 1.2), glassM, cx, 2.7, cz);
  const rg = new THREE.CylinderGeometry(
    W / 2,
    W / 2,
    L,
    28,
    1,
    false,
    0,
    Math.PI,
  );
  rg.rotateZ(Math.PI / 2);
  rg.scale(1, 0.38, 1);
  add(rg, steel, cx, 4.4, cz);
  for (const [y, m] of [
    [4.35, neonMat(0.3, 2.6, 2.4)],
    [1.05, neonMat(2.8, 0.45, 1.7)],
  ])
    for (const s of [-1, 1]) {
      add(
        new THREE.BoxGeometry(L + 0.3, 0.16, 0.16),
        m,
        cx,
        y,
        cz + s * (W / 2 + 0.1),
      );
      add(
        new THREE.BoxGeometry(0.16, 0.16, W + 0.3),
        m,
        cx + s * (L / 2 + 0.1),
        y,
        cz,
      );
    }
  const sign = textPlane("SKYLINE DINER", 17, 4.2, {
    glow: "#ff4fc0",
    col: "#ffd6f0",
    sub: "EST. 2026 · BURGERS · SHAKES · CHARGE",
    subCol: "#8ff5ff",
    bright: 1.3,
  });
  sign.position.set(cx - 4, 8.8, cz + W / 2 - 1);
  sign.rotation.y = -0.35;
  scene.add(sign);
  add(new THREE.BoxGeometry(0.3, 4, 0.3), dark, cx - 10, 6.4, cz + W / 2 - 1.4);
  add(new THREE.BoxGeometry(0.3, 4, 0.3), dark, cx + 2, 6.4, cz + W / 2 - 1.4);
  // pylon
  const px = D.x0 + 3,
    pz = D.z1 - 3;
  add(new THREE.CylinderGeometry(0.35, 0.45, 16, 10), dark, px, 8.2, pz);
  const disc = textPlane("DINER", 6.4, 6.4, {
    cw: 512,
    ch: 512,
    bg: "#0f1720",
    glow: "#28e0ff",
    col: "#bff8ff",
    font: "900 150px Saira, Arial Black, sans-serif",
    sub: "OPEN 24H",
    subCol: "#ffc233",
    subFont: "800 70px Saira, Arial, sans-serif",
    bright: 1.25,
  });
  disc.position.set(px, 16.5, pz);
  disc.rotation.y = -Math.PI / 4;
  scene.add(disc);
  add(
    new THREE.TorusGeometry(3.3, 0.14, 8, 48),
    neonMat(2.6, 0.5, 1.6),
    px,
    16.5,
    pz,
  ).rotation.y = -Math.PI / 4;
  // drive-in screen facing west over the lot
  const sx = D.x1 - 3.5,
    sz = (D.z0 + D.z1) / 2 + 4;
  for (const dz of [-13, 13])
    add(new THREE.BoxGeometry(0.6, 17, 0.6), dark, sx + 0.6, 8.5, sz + dz);
  add(new THREE.BoxGeometry(0.5, 14, 31), dark, sx + 0.4, 10.5, sz);
  const cv = document.createElement("canvas");
  cv.width = 640;
  cv.height = 288;
  const st = new THREE.CanvasTexture(cv);
  st.colorSpace = THREE.SRGBColorSpace;
  Object.assign(DINER_SCREEN, { cv, x: cv.getContext("2d"), t: st });
  const scr = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 13.2),
    new THREE.MeshBasicMaterial({
      map: st,
      color: new THREE.Color(1.15, 1.15, 1.15),
    }),
  );
  scr.position.set(sx, 10.5, sz);
  scr.rotation.y = -Math.PI / 2;
  scene.add(scr);
  addB(sx, sx + 1, sz - 15, sz + 15, 17, -1);
  // charging stalls with parked cars facing the screen
  const post = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.4, 1.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xf2f3f5, roughness: 0.4 }),
      20,
    ),
    cap = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.42),
      neonMat(0.3, 2.5, 2.3),
      20,
    );
  const M = new THREE.Matrix4();
  let k = 0;
  const r = rng(9090);
  const parked = [];
  for (const col of [bx1 + 7, bx1 + 17])
    for (let i = 0; i < 8; i++) {
      const z = D.z0 + 6 + i * 5.4;
      M.makeTranslation(col - 3.2, 0.95, z);
      post.setMatrixAt(k, M);
      M.makeTranslation(col - 3.2, 1.76, z);
      cap.setMatrixAt(k, M);
      k++;
      if (r() < 0.55) parked.push([col, z]);
    }
  post.count = cap.count = k;
  scene.add(post, cap);
  DINER.parked = parked;
}
