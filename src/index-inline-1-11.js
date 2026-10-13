// index-inline-1 11 — three
// Lines 81500-81810 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const defs = [
    [-712, -150, -Math.PI / 2, 12, 8, 2.6, "EAST HOP"],
    [-632, -120, Math.PI / 2, 12, 8, 2.6, "WEST HOP"],
    [-736, -62, 0, 12, 8, 2.6, "NORTH HOP"],
    [-610, -14, 0, 22, 9, 5.5, "MEGA RAMP"],
    [-600, -150, Math.PI, 12, 8, 2.6, "SOUTH HOP"],
    [-672, -112, 0, 12, 9, 3.2, "TRUCK JUMP"],
    [-720, 40, 0, 14, 8, 3.4, "YARD KICKER"],
    [-840, -120, 0, 14, 8, 3, "WIDE KICKER"],
    [-640, -230, -Math.PI / 2, 16, 8, 4.2, "EAST LAUNCH"],
    [-528, 30, 0, 14, 8, 3.4, "DOUBLE UP"],
  ];
  const sc = document.createElement("canvas");
  sc.width = 128;
  sc.height = 256;
  const sx = sc.getContext("2d");
  sx.fillStyle = "#55585c";
  sx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 2; i++) {
    const y = i * 128;
    sx.fillStyle = "#ffc233";
    sx.beginPath();
    sx.moveTo(10, y + 100);
    sx.lineTo(64, y + 40);
    sx.lineTo(118, y + 100);
    sx.lineTo(118, y + 124);
    sx.lineTo(64, y + 64);
    sx.lineTo(10, y + 124);
    sx.closePath();
    sx.fill();
  }
  const st = new THREE.CanvasTexture(sc);
  st.wrapS = st.wrapT = THREE.RepeatWrapping;
  st.colorSpace = THREE.SRGBColorSpace;
  st.anisotropy = 8;
  const slopeM = new THREE.MeshStandardMaterial({
      map: st,
      roughness: 0.8,
      metalness: 0.1,
    }),
    sideM = new THREE.MeshStandardMaterial({
      color: 0x2c2f34,
      roughness: 0.7,
      metalness: 0.3,
    });
  for (const [x, z, yaw, L, W, H, name] of defs) {
    const r = {
      x,
      z,
      yaw,
      L,
      W,
      H,
      name,
      fx: -Math.sin(yaw),
      fz: -Math.cos(yaw),
      R2: L * L + W * W,
    };
    RAMPS.push(r);
    const w = W / 2,
      p = [
        -w,
        0,
        0,
        w,
        H,
        L,
        w,
        0,
        0,
        -w,
        0,
        0,
        -w,
        H,
        L,
        w,
        H,
        L,
        -w,
        0,
        L,
        w,
        0,
        L,
        w,
        H,
        L,
        -w,
        0,
        L,
        w,
        H,
        L,
        -w,
        H,
        L,
        -w,
        0,
        0,
        -w,
        0,
        L,
        -w,
        H,
        L,
        w,
        0,
        0,
        w,
        H,
        L,
        w,
        0,
        L,
      ];
    const sl = Math.hypot(L, H) / 4,
      uv = [
        0,
        0,
        1,
        sl,
        1,
        0,
        0,
        0,
        0,
        sl,
        1,
        sl,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    g.addGroup(0, 6, 0);
    g.addGroup(6, 12, 1);
    const m = new THREE.Mesh(g, [slopeM, sideM]);
    m.position.set(x, 0.2, z);
    m.rotation.y = Math.atan2(r.fx, r.fz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.9, 0.3) }),
    );
    bar.position.set(0, H + 0.07, L);
    m.add(bar);
    r.bar = bar.material;
    r.mesh = m;
  }
  // painted yard surface over the four lots
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#2f3135";
  x.fillRect(0, 0, 512, 512);
  const r = rng(99);
  for (let i = 0; i < 5000; i++) {
    const g = 38 + r() * 26;
    x.fillStyle = `rgb(${g},${g},${g + 2})`;
    x.fillRect(r() * 512, r() * 512, 2, 2);
  }
  x.strokeStyle = "rgba(10,10,10,.55)";
  x.lineCap = "round";
  for (let i = 0; i < 14; i++) {
    x.lineWidth = 5 + r() * 4;
    x.beginPath();
    const cx = r() * 512,
      cy = r() * 512,
      rr = 30 + r() * 90;
    x.arc(cx, cy, rr, r() * 6, r() * 6 + 2 + r() * 3);
    x.stroke();
  }
  x.strokeStyle = "rgba(255,255,255,.8)";
  x.lineWidth = 6;
  x.setLineDash([26, 16]);
  x.strokeRect(20, 20, 472, 472);
  x.setLineDash([]);
  const yt = new THREE.CanvasTexture(c);
  yt.colorSpace = THREE.SRGBColorSpace;
  yt.anisotropy = 8;
  const ym = new THREE.MeshStandardMaterial({ map: yt, roughness: 0.75 });
  for (const k of STUNT) {
    const [bi, bj] = k.split(",").map(Number);
    const pl = new THREE.Mesh(
      new THREE.PlaneGeometry(P - RW - 2, P - RW - 2),
      ym,
    );
    pl.rotation.x = -Math.PI / 2;
    pl.position.set(bc(bi), 0.215, bc(bj));
    pl.receiveShadow = true;
    scene.add(pl);
  }
  // floodlight masts, tyre stacks, the sign
  const dk = new THREE.MeshStandardMaterial({
    color: 0x2a2e34,
    metalness: 0.6,
    roughness: 0.5,
  });
  const x0 = blockMin(3),
    x1 = blockMax(6),
    z0 = blockMin(9),
    z1 = blockMax(12);
  for (const [px, pz] of [
    [x0 + 3, z0 + 3],
    [x1 - 3, z0 + 3],
    [x0 + 3, z1 - 3],
    [x1 - 3, z1 - 3],
  ]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 18, 8), dk);
    p.position.set(px, 9, pz);
    scene.add(p);
    const h = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.6) }),
    );
    h.position.set(px, 18.4, pz);
    scene.add(h);
    addB(px - 0.5, px + 0.5, pz - 0.5, pz + 0.5, 18, -1);
  }
  const tyre = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.42, 0.2, 6, 14),
    new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.9 }),
    400,
  );
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  let k = 0;
  for (const k2 of STUNT) {
    const [bi, bj] = k2.split(",").map(Number);
    const a = blockMin(bi) + 2,
      b = blockMax(bi) - 2,
      cc = blockMin(bj) + 2,
      d = blockMax(bj) - 2;
    for (const [px, pz] of [
      [a, cc],
      [b, cc],
      [a, d],
      [b, d],
      [(a + b) / 2, cc],
      [(a + b) / 2, d],
    ])
      for (let q = 0; q < 4 && k < 400; q++) {
        M.compose(
          new THREE.Vector3(px, 0.42 + q * 0.38, pz),
          Q,
          new THREE.Vector3(1, 1, 1),
        );
        tyre.setMatrixAt(k++, M);
      }
  }
  tyre.count = k;
  tyre.castShadow = true;
  scene.add(tyre);
  const sg = textPlane("STUNT YARD", 30, 6.5, {
    col: "#ffc233",
    glow: "#ff8a2a",
    sub: "RAMPS · AIRTIME · NO SPEED LIMIT",
    subCol: "#fff",
    bright: 1.3,
  });
  sg.position.set(x1 + 0.5, 9, (z0 + z1) / 2);
  sg.rotation.y = Math.PI / 2;
  scene.add(sg);
  for (const dz of [-9, 9]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), dk);
    p.position.set(x1 + 0.4, 3.5, (z0 + z1) / 2 + dz);
    scene.add(p);
  }
}

// TRUCK JUMP: three haulers parked across the yard street (no traffic runs on this street)
{
  const r = rng(707);
  for (const z of [-134, -138.2, -142.4]) {
    const T = VT.hauler,
      g = vehicleModel("hauler", T.cols[(r() * T.cols.length) | 0]);
    g.position.set(-672, 0, z);
    g.rotation.y = Math.PI / 2;
    scene.add(g);
    addB(-672 - 8, -672 + 8, z - 1.35, z + 1.35, 4.4, -1);
  }
}
// THE LOOP: a full 360 degree loop. Entry at (x,z) heading `yaw`; the track drifts sideways by w so the exit lane clears the entry
const LOOPS = [];
