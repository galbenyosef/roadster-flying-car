// index-inline-1 04 — three
// Lines 79584-79908 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const r = rng(31);
  const ac = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x4a4f58,
      roughness: 0.7,
      metalness: 0.4,
    }),
    buildings.length * 3,
  );
  const blink = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.6, 8, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 0.4, 0.3) }),
    buildings.length,
  );
  const mast = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.15, 0.3, 9, 6),
    ac.material,
    buildings.length,
  );
  const M = new THREE.Matrix4();
  let k = 0,
    kb = 0;
  for (const B of buildings) {
    if (B.style < 0 || B.style === 3 || B.style === 6) continue;
    if (
      PADS.some(
        (p) =>
          Math.abs(p.x - (B.x0 + B.x1) / 2) < 1 &&
          Math.abs(p.z - (B.z0 + B.z1) / 2) < 1,
      )
    )
      continue;
    const n = 1 + ((r() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const w = 2 + r() * 4,
        d = 2 + r() * 4,
        hh = 1 + r() * 2;
      M.compose(
        new THREE.Vector3(
          lerp(B.x0 + w, B.x1 - w, r()),
          B.h + hh / 2,
          lerp(B.z0 + d, B.z1 - d, r()),
        ),
        new THREE.Quaternion(),
        new THREE.Vector3(w, hh, d),
      );
      ac.setMatrixAt(k++, M);
    }
    if (B.h > 90) {
      M.makeTranslation((B.x0 + B.x1) / 2, B.h + 9, (B.z0 + B.z1) / 2);
      blink.setMatrixAt(kb, M);
      M.makeTranslation((B.x0 + B.x1) / 2, B.h + 4.5, (B.z0 + B.z1) / 2);
      mast.setMatrixAt(kb, M);
      kb++;
    }
  }
  ac.count = k;
  blink.count = kb;
  mast.count = kb;
  ac.castShadow = true;
  scene.add(ac, blink, mast);
  window.__tip = blink;
}
// streets: asphalt, raised sidewalks, park lawns, lane dashes, crosswalks
{
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = "#3b3c40";
  x.fillRect(0, 0, 256, 256);
  const r = rng(3);
  for (let i = 0; i < 6000; i++) {
    const g = 48 + r() * 34;
    x.fillStyle = `rgb(${g},${g},${g + 2})`;
    x.fillRect(r() * 256, r() * 256, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(420, 420);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const g = new THREE.Mesh(
    new THREE.PlaneGeometry(4200, 4200),
    new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.82,
      metalness: 0,
      envMapIntensity: 0.3,
    }),
  );
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  scene.add(g);
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sx = sc.getContext("2d");
  sx.fillStyle = "#6f6c67";
  sx.fillRect(0, 0, 128, 128);
  sx.strokeStyle = "#5d5a55";
  sx.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) {
    sx.beginPath();
    sx.moveTo(i, 0);
    sx.lineTo(i, 128);
    sx.moveTo(0, i);
    sx.lineTo(128, i);
    sx.stroke();
  }
  const st = new THREE.CanvasTexture(sc);
  st.wrapS = st.wrapT = THREE.RepeatWrapping;
  st.repeat.set(20, 20);
  st.colorSpace = THREE.SRGBColorSpace;
  const gc = document.createElement("canvas");
  gc.width = gc.height = 256;
  const gx = gc.getContext("2d");
  gx.fillStyle = "#4f7a3a";
  gx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = r();
    gx.fillStyle = `rgb(${(60 + v * 40) | 0},${(100 + v * 50) | 0},${(45 + v * 25) | 0})`;
    gx.fillRect(r() * 256, r() * 256, 2, 2);
  }
  const gt = new THREE.CanvasTexture(gc);
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
  gt.repeat.set(10, 10);
  gt.colorSpace = THREE.SRGBColorSpace;
  const n = (BLOCK_COUNT + 4) * (BLOCK_COUNT + 4);
  const walk = new THREE.InstancedMesh(
    new THREE.BoxGeometry(BLOCK_PITCH - ROAD_WIDTH, 0.2, BLOCK_PITCH - ROAD_WIDTH),
    new THREE.MeshStandardMaterial({
      map: st,
      roughness: 0.9,
      envMapIntensity: 0.4,
    }),
    n,
  );
  const lawn = new THREE.InstancedMesh(
    new THREE.BoxGeometry(BLOCK_PITCH - ROAD_WIDTH - 6, 0.26, BLOCK_PITCH - ROAD_WIDTH - 6),
    new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95 }),
    8,
  );
  const M = new THREE.Matrix4();
  let k = 0,
    kl = 0;
  for (let bi = -2; bi < BLOCK_COUNT + 2; bi++)
    for (let bj = -2; bj < BLOCK_COUNT + 2; bj++) {
      M.makeTranslation(
        (blockMin(bi) + blockMax(bi)) / 2,
        0.1,
        (blockMin(bj) + blockMax(bj)) / 2,
      );
      walk.setMatrixAt(k++, M);
      if (PARK.has(bi + "," + bj)) {
        M.makeTranslation(
          (blockMin(bi) + blockMax(bi)) / 2,
          0.13,
          (blockMin(bj) + blockMax(bj)) / 2,
        );
        lawn.setMatrixAt(kl++, M);
      }
    }
  walk.count = k;
  lawn.count = kl;
  walk.receiveShadow = lawn.receiveShadow = true;
  scene.add(walk, lawn);
  for (const [px, pz, a, b] of PONDS) {
    const w = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshStandardMaterial({
        color: 0x2e5f7a,
        roughness: 0.08,
        metalness: 0.3,
      }),
    );
    w.scale.set(a, b, 1);
    w.rotation.x = -Math.PI / 2;
    w.position.set(px, 0.28, pz);
    scene.add(w);
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.08, 48),
      new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.8 }),
    );
    rim.scale.set(a, b, 1);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(px, 0.29, pz);
    scene.add(rim);
  }
  const dash = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.18, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.6 }),
    34000,
  );
  const Q = new THREE.Quaternion(),
    E = new THREE.Euler();
  let m = 0;
  const put = (x, z, rot, sxz) => {
    Q.setFromEuler(E.set(-Math.PI / 2, 0, rot));
    M.compose(
      new THREE.Vector3(x, 0.02, z),
      Q,
      new THREE.Vector3(sxz ? sxz[0] : 1, sxz ? sxz[1] : 1, 1),
    );
    dash.setMatrixAt(m++, M);
  };
  for (let l = 0; l <= BLOCK_COUNT; l++) {
    const line = -HALF + l * BLOCK_PITCH;
    for (let seg = 0; seg < BLOCK_COUNT; seg++) {
      const a = blockMin(seg) + 2,
        b = blockMax(seg) - 2;
      for (let s = a; s < b; s += 8) {
        put(line, s, 0);
        put(s, line, Math.PI / 2);
      }
      for (let w = -6; w <= 6; w += 1.4) {
        put(line + w, blockMin(seg) - 1.2, 0, [4, 0.55]);
        put(line + w, blockMax(seg) + 1.2, 0, [4, 0.55]);
        put(blockMin(seg) - 1.2, line + w, Math.PI / 2, [4, 0.55]);
        put(blockMax(seg) + 1.2, line + w, Math.PI / 2, [4, 0.55]);
      }
    }
  }
  dash.count = m;
  scene.add(dash);
}
// street lights with light pools
{
  const poolTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,.3)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const spots = [];
  for (let bi = 0; bi < BLOCK_COUNT; bi++)
    for (let bj = 0; bj < BLOCK_COUNT; bj++) {
      if (
        district(bi, bj) === "strip" ||
        district(bi, bj) === "launch" ||
        district(bi, bj) === "stunt"
      )
        continue;
      const a = blockMin(bi) + 1.2,
        b = blockMax(bi) - 1.2,
        c = blockMin(bj) + 1.2,
        d = blockMax(bj) - 1.2;
      for (const f of [0.35]) {
        spots.push(
          [lerp(a, b, f), c, 0, -1],
          [lerp(a, b, f + 0.2), d, 0, 1],
          [a, lerp(c, d, f + 0.2), -1, 0],
          [b, lerp(c, d, f), 1, 0],
        );
      }
    }
  const n = spots.length,
    pole = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.08, 0.12, 7.5, 4),
      new THREE.MeshStandardMaterial({
        color: 0x2e3238,
        metalness: 0.7,
        roughness: 0.45,
      }),
      n,
    ),
    head = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.5, 0.12, 1),
      new THREE.MeshStandardMaterial({
        color: 0x111,
        emissive: 0xffc680,
        emissiveIntensity: 0.25,
      }),
      n,
    ),
    pool = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xff9a4a,
        map: poolTex,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      n,
    );
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler();
  spots.forEach(([x, z, ox, oz], i) => {
    addProp(x, z, 0.2, 7.6);
    M.makeTranslation(x, 3.95, z);
    pole.setMatrixAt(i, M);
    Q.setFromEuler(E.set(0, Math.atan2(ox, oz), 0));
    M.compose(
      new THREE.Vector3(x + ox * 0.6, 7.6, z + oz * 0.6),
      Q,
      new THREE.Vector3(1, 1, 1),
    );
    head.setMatrixAt(i, M);
    Q.setFromEuler(E.set(-Math.PI / 2, 0, 0));
    M.compose(
      new THREE.Vector3(x + ox * 3, 0.04, z + oz * 3),
      Q,
      new THREE.Vector3(15, 15, 1),
    );
    pool.setMatrixAt(i, M);
  });
  pool.visible = false;
  scene.add(pole, head, pool);
}
// traffic signals at every inner intersection (one controller for the whole grid)
const SIGNALS = {
  ns: new THREE.MeshBasicMaterial({ color: 0x33ff88 }),
  ew: new THREE.MeshBasicMaterial({ color: 0xff3030 }),
  t: 0,
  state: { ns: "g", ew: "r" },
};
