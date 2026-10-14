// index-inline-1 08 — three
// Lines 80620-80919 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const concrete = new THREE.MeshStandardMaterial({
      color: 0x8e9297,
      roughness: 0.9,
    }),
    steelD = new THREE.MeshStandardMaterial({
      color: 0x2f343b,
      metalness: 0.7,
      roughness: 0.45,
    }),
    white = new THREE.MeshStandardMaterial({
      color: 0xf4f5f6,
      metalness: 0.25,
      roughness: 0.35,
    }),
    black = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 });
  const add = (g, m, x, y, z, par) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    (par || scene).add(o);
    return o;
  };
  const slab = new THREE.InstancedMesh(
    new THREE.BoxGeometry(P - RW, 0.24, P - RW),
    new THREE.MeshStandardMaterial({ color: 0xa4a8ad, roughness: 0.95 }),
    LAUNCHB.size,
  );
  const M = new THREE.Matrix4();
  let k = 0;
  for (const key of LAUNCHB) {
    const [bi, bj] = key.split(",").map(Number);
    M.makeTranslation(
      (blockMin(bi) + blockMax(bi)) / 2,
      0.12,
      (blockMin(bj) + blockMax(bj)) / 2,
    );
    slab.setMatrixAt(k++, M);
  }
  slab.receiveShadow = true;
  scene.add(slab);
  const m = LS.mount;
  add(new THREE.BoxGeometry(30, 10, 30), concrete, m.x, 5, m.z);
  addB(m.x - 15, m.x + 15, m.z - 15, m.z + 15, 10, -1);
  add(new THREE.CylinderGeometry(6, 7, 1.2, 24), steelD, m.x, 10.6, m.z);
  // lattice tower
  const T = LS.tower,
    tw = 12;
  addB(T.x - tw / 2, T.x + tw / 2, T.z - tw / 2, T.z + tw / 2, T.h, -1);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      add(
        new THREE.BoxGeometry(0.9, T.h, 0.9),
        steelD,
        T.x + (sx * tw) / 2,
        T.h / 2,
        T.z + (sz * tw) / 2,
      );
  const nb = Math.floor(T.h / 7),
    br = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.35, Math.hypot(tw, 7), 0.35),
      steelD,
      nb * 8,
    );
  const E = new THREE.Euler(),
    Q = new THREE.Quaternion();
  k = 0;
  for (let i = 0; i < nb; i++) {
    const y = i * 7 + 3.5;
    for (const f of [0, 1, 2, 3])
      for (const d of [-1, 1]) {
        const ang = Math.atan2(tw, 7) * d;
        let x = T.x,
          z = T.z,
          rotY = 0;
        if (f === 0) z += tw / 2;
        if (f === 1) z -= tw / 2;
        if (f === 2) {
          x += tw / 2;
          rotY = Math.PI / 2;
        }
        if (f === 3) {
          x -= tw / 2;
          rotY = Math.PI / 2;
        }
        Q.setFromEuler(E.set(0, rotY, ang, "YXZ"));
        M.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(1, 1, 1));
        br.setMatrixAt(k++, M);
      }
  }
  br.castShadow = true;
  scene.add(br);
  add(new THREE.BoxGeometry(tw + 2, 1, tw + 2), steelD, T.x, T.h - 0.5, T.z);
  const beacon = add(
    new THREE.SphereGeometry(0.7, 10, 8),
    neonMat(8, 0.4, 0.3),
    T.x,
    T.h + 4,
    T.z,
  );
  add(new THREE.CylinderGeometry(0.15, 0.15, 4, 6), steelD, T.x, T.h + 2, T.z);
  ROCKET.beacon = beacon;
  const armP = new THREE.Group();
  armP.position.set(T.x - tw / 2, 72, T.z);
  scene.add(armP);
  add(new THREE.BoxGeometry(14, 1.6, 2.4), steelD, -7, 0, 0, armP);
  ROCKET.arm = armP;
  // rocket: original white reusable booster with a black interstage band, four fins, four landing legs
  const g = new THREE.Group();
  g.position.set(m.x, 11.2, m.z);
  scene.add(g);
  ROCKET.g = g;
  ROCKET.base = 11.2;
  add(new THREE.CylinderGeometry(4.5, 4.5, 56, 40), white, 0, 28, 0, g);
  add(new THREE.CylinderGeometry(4.55, 4.55, 5, 40), black, 0, 42, 0, g);
  add(new THREE.CylinderGeometry(4.55, 4.55, 1.2, 40), black, 0, 14, 0, g);
  add(new THREE.CylinderGeometry(0.4, 4.5, 14, 40), white, 0, 63, 0, g);
  add(new THREE.CylinderGeometry(0.45, 1.4, 3, 24), black, 0, 68.5, 0, g);
  add(new THREE.CylinderGeometry(3.9, 4.6, 2.4, 32), steelD, 0, -1, 0, g);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const fin = add(
      new THREE.BoxGeometry(0.35, 7, 4),
      white,
      Math.cos(a) * 5.4,
      4.5,
      Math.sin(a) * 5.4,
      g,
    );
    fin.rotation.y = -a;
    const leg = add(
      new THREE.BoxGeometry(0.5, 9, 0.5),
      black,
      Math.cos(a) * 5.6,
      1.5,
      Math.sin(a) * 5.6,
      g,
    );
    leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
  }
  const nameP = textPlane("SKYLINE ONE", 30, 4, {
    col: "#15171a",
    font: "900 150px Saira, Arial Black, sans-serif",
  });
  nameP.rotation.set(0, -Math.PI / 2, Math.PI / 2);
  nameP.position.set(-4.56, 30, 0);
  nameP.material.side = THREE.FrontSide;
  g.add(nameP);
  const nameQ = nameP.clone();
  nameQ.rotation.set(0, 0, Math.PI / 2);
  nameQ.position.set(0, 30, 4.56);
  g.add(nameQ);
  // landing zone
  const lzc = document.createElement("canvas");
  lzc.width = lzc.height = 512;
  const lx = lzc.getContext("2d");
  lx.fillStyle = "#7f8388";
  lx.fillRect(0, 0, 512, 512);
  lx.strokeStyle = "#ffd23a";
  lx.lineWidth = 18;
  lx.beginPath();
  lx.arc(256, 256, 236, 0, 7);
  lx.stroke();
  lx.strokeStyle = "#f2f3f5";
  lx.lineWidth = 40;
  lx.beginPath();
  lx.moveTo(150, 150);
  lx.lineTo(362, 362);
  lx.moveTo(362, 150);
  lx.lineTo(150, 362);
  lx.stroke();
  const lzt = new THREE.CanvasTexture(lzc);
  lzt.colorSpace = THREE.SRGBColorSpace;
  const lz = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({ map: lzt, roughness: 0.9 }),
  );
  lz.rotation.x = -Math.PI / 2;
  lz.position.set(LS.lz.x, 0.27, LS.lz.z);
  lz.receiveShadow = true;
  scene.add(lz);
  // propellant tanks on legs
  const tc = {
    x: (blockMin(18) + blockMax(18)) / 2,
    z: (blockMin(17) + blockMax(17)) / 2,
  };
  for (const [dx, dz] of [
    [-14, -12],
    [14, -12],
    [0, 12],
  ]) {
    const x = tc.x + dx,
      z = tc.z + dz;
    add(new THREE.SphereGeometry(7, 24, 16), white, x, 13, z);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      add(
        new THREE.CylinderGeometry(0.35, 0.35, 8, 6),
        steelD,
        x + Math.cos(a) * 5,
        4,
        z + Math.sin(a) * 5,
      );
    }
    addB(x - 6.5, x + 6.5, z - 6.5, z + 6.5, 20, -1);
  }
  // grandstand + complex sign
  const gs = {
    x: (blockMin(17) + blockMax(17)) / 2,
    z: (blockMin(18) + blockMax(18)) / 2,
  };
  for (let i = 0; i < 4; i++) {
    add(
      new THREE.BoxGeometry(44, 1.4 * (i + 1), 5),
      concrete,
      gs.x,
      0.7 * (i + 1),
      gs.z + 12 - i * 5,
    );
  }
  addB(gs.x - 22, gs.x + 22, gs.z - 10, gs.z + 15, 5.6, -1);
  const sg = textPlane("SKYLINE LAUNCH COMPLEX", 44, 5.5, {
    col: "#f4f5f6",
    bg: "#15171a",
    font: "900 110px Saira, Arial Black, sans-serif",
    sub: "VISITOR DECK · TOWER 100 m",
    subCol: "#ffb35c",
  });
  sg.position.set(gs.x, 10, gs.z - 12);
  sg.rotation.y = Math.PI;
  scene.add(sg);
  // viewing field north of the pad: benches facing the rocket
  {
    const vf = {
      x: (blockMin(17) + blockMax(18)) / 2,
      z: (blockMin(16) + blockMax(16)) / 2,
    };
    const bench = new THREE.InstancedMesh(
      new THREE.BoxGeometry(10, 0.5, 1.2),
      concrete,
      24,
    );
    let q = 0;
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 6; j++) {
        M.makeTranslation(vf.x - 75 + j * 30, 0.45, vf.z - 24 + i * 6);
        bench.setMatrixAt(q++, M);
      }
    bench.receiveShadow = true;
    scene.add(bench);
    const vs = textPlane("VIEWING FIELD", 24, 3.6, {
      col: "#f4f5f6",
      bg: "#15171a",
      font: "900 120px Saira, Arial Black, sans-serif",
      sub: "WATCH LAUNCHES AND LANDINGS FROM HERE",
      subCol: "#ffb35c",
    });
    vs.position.set(vf.x, 4.2, vf.z - 34);
    vs.rotation.y = Math.PI;
    scene.add(vs);
    for (const dx of [-9, 9]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), steelD);
      p.position.set(vf.x + dx, 1.4, vf.z - 34.2);
      scene.add(p);
    }
  }
  // flood light masts
  for (const [dx, dz] of [
    [-30, -30],
    [30, -30],
    [-30, 30],
    [30, 30],
  ]) {
    add(
      new THREE.CylinderGeometry(0.35, 0.5, 30, 8),
      steelD,
      m.x + dx,
      15,
      m.z + dz,
    );
    add(
      new THREE.BoxGeometry(3, 1.2, 1),
      neonMat(3, 3, 2.8),
      m.x + dx,
      30.5,
      m.z + dz,
    );
  }
}
PADS.push({
  label: "L",
  name: "TOWER DECK",
  x: LS.tower.x,
  z: LS.tower.z,
  y: LS.tower.h,
  r: 6.8,
  color: 0xffffff,
});

// welcome sign near the start
