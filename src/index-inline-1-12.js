// index-inline-1 12 — three
// Lines 81811-82145 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const tc = document.createElement("canvas");
  tc.width = 64;
  tc.height = 256;
  const tx = tc.getContext("2d");
  tx.fillStyle = "#3a3d43";
  tx.fillRect(0, 0, 64, 256);
  tx.fillStyle = "#ffc233";
  tx.fillRect(0, 0, 5, 256);
  tx.fillRect(59, 0, 5, 256);
  tx.fillStyle = "#f3efe7";
  for (let y = 0; y < 256; y += 64) tx.fillRect(30, y, 4, 34);
  const tt = new THREE.CanvasTexture(tc);
  tt.wrapS = tt.wrapT = THREE.RepeatWrapping;
  tt.colorSpace = THREE.SRGBColorSpace;
  tt.anisotropy = 8;
  const trackM = new THREE.MeshStandardMaterial({
      map: tt,
      roughness: 0.6,
      metalness: 0.3,
      side: THREE.DoubleSide,
    }),
    railM = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.3, 2.4, 2.8),
    }),
    steelL = new THREE.MeshStandardMaterial({
      color: 0xe3e6ea,
      metalness: 0.8,
      roughness: 0.3,
    });
  for (const [x, z, yaw, R, w, W] of [[-816, -20, 0, 11, 6.6, 6.4]]) {
    const fx = -Math.sin(yaw),
      fz = -Math.cos(yaw),
      rx = -fz,
      rz = fx,
      L = { x, z, yaw, R, w, W, fx, fz, rx, rz };
    LOOPS.push(L);
    // the same loop ridden backwards from the exit lane
    LOOPS.push({
      x: x + rx * w,
      z: z + rz * w,
      yaw: yaw + Math.PI,
      R,
      w,
      W,
      fx: -fx,
      fz: -fz,
      rx: -rx,
      rz: -rz,
      twin: L,
    });
    const N = 160,
      pos = [],
      uv = [],
      idx = [],
      eA = [],
      eB = [];
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2,
        lat = (w * i) / N,
        cx = x + fx * R * Math.sin(th) + rx * lat,
        cy = 0.22 + R * (1 - Math.cos(th)),
        cz = z + fz * R * Math.sin(th) + rz * lat,
        nx = -fx * Math.sin(th),
        ny = Math.cos(th),
        nz = -fz * Math.sin(th);
      for (const sd of [-1, 1]) {
        pos.push(cx + (rx * sd * W) / 2, cy, cz + (rz * sd * W) / 2);
        uv.push(sd < 0 ? 0 : 1, (i / N) * 9);
      }
      eA.push(
        new THREE.Vector3(
          cx - rx * (W / 2 + 0.1) + nx * 0.45,
          cy + ny * 0.45,
          cz - rz * (W / 2 + 0.1) + nz * 0.45,
        ),
      );
      eB.push(
        new THREE.Vector3(
          cx + rx * (W / 2 + 0.1) + nx * 0.45,
          cy + ny * 0.45,
          cz + rz * (W / 2 + 0.1) + nz * 0.45,
        ),
      );
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, trackM);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    for (const E of [eA, eB])
      scene.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(E),
            240,
            0.16,
            6,
            false,
          ),
          railM,
        ),
      );
    // A-frame gantry over the top of the loop
    const top = 0.22 + 2 * R + 1.4;
    for (const lat of [-W / 2 - 1.6, w + W / 2 + 1.6])
      for (const df of [-R * 0.55, R * 0.55]) {
        const px = x + rx * lat + fx * df,
          pz = z + rz * lat + fz * df;
        const pl = new THREE.Mesh(new THREE.BoxGeometry(0.7, top, 0.7), steelL);
        pl.position.set(px, top / 2, pz);
        pl.castShadow = true;
        scene.add(pl);
        addB(px - 0.5, px + 0.5, pz - 0.5, pz + 0.5, top, -1);
      }
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(w + W + 3.2 + 0.7, 0.8, 0.8),
      steelL,
    );
    beam.position.set(x + rx * (w / 2), top, z + rz * (w / 2));
    beam.rotation.y = yaw;
    scene.add(beam);
    const sg = textPlane("THE LOOP", 12, 2.6, {
      col: "#ffc233",
      glow: "#ff8a2a",
      sub: "55 MPH OR MORE",
      subCol: "#fff",
      bright: 1.3,
    });
    sg.position.set(x + rx * (w / 2), top + 2.2, z + rz * (w / 2));
    sg.rotation.y = yaw + Math.PI;
    scene.add(sg);
    // glowing entry chevrons on the ground
    const ch = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 1, 10),
      new THREE.MeshBasicMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = 128;
          c.height = 256;
          const q = c.getContext("2d");
          q.fillStyle = "#ffc233";
          for (let i = 0; i < 3; i++) {
            const y = 30 + i * 80;
            q.beginPath();
            q.moveTo(14, y + 50);
            q.lineTo(64, y);
            q.lineTo(114, y + 50);
            q.lineTo(114, y + 70);
            q.lineTo(64, y + 22);
            q.lineTo(14, y + 70);
            q.fill();
          }
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        })(),
        transparent: true,
        color: new THREE.Color(1.6, 1.6, 1.6),
        depthWrite: false,
      }),
    );
    ch.rotation.set(-Math.PI / 2, 0, yaw);
    ch.position.set(x - fx * 9, 0.24, z - fz * 9);
    scene.add(ch);
    const ch2 = ch.clone();
    ch2.rotation.set(-Math.PI / 2, 0, yaw + Math.PI);
    ch2.position.set(x + rx * w + fx * 9, 0.24, z + rz * w + fz * 9);
    scene.add(ch2);
  }
}
/* ---------------- HALO WHEEL: an observation wheel on the boulevard ---------------- */
const WHEELG = {};
{
  const W = WHEEL,
    steelW = new THREE.MeshStandardMaterial({
      color: 0xe3e6ea,
      metalness: 0.85,
      roughness: 0.28,
    }),
    dk = new THREE.MeshStandardMaterial({
      color: 0x2a2e34,
      metalness: 0.6,
      roughness: 0.45,
    });
  const root = new THREE.Group();
  root.position.set(W.x, W.y, W.z);
  scene.add(root);
  const rot = new THREE.Group();
  root.add(rot);
  WHEELG.rot = rot;
  for (const dz of [-2.4, 2.4]) {
    const t = new THREE.Mesh(
      new THREE.TorusGeometry(W.R, 0.55, 8, 120),
      steelW,
    );
    t.position.z = dz;
    t.castShadow = true;
    rot.add(t);
  }
  const neon = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.4, 0.6, 2),
  });
  WHEELG.neon = neon;
  rot.add(
    new THREE.Mesh(new THREE.TorusGeometry(W.R - 1.3, 0.24, 6, 120), neon),
  );
  const sp = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.14, W.R, 5),
    steelW,
    48,
  );
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler();
  let k = 0;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    for (const dz of [-2.4, 2.4]) {
      Q.setFromEuler(E.set(0, 0, a - Math.PI / 2));
      M.compose(
        new THREE.Vector3((Math.cos(a) * W.R) / 2, (Math.sin(a) * W.R) / 2, dz),
        Q,
        new THREE.Vector3(1, 1, 1),
      );
      sp.setMatrixAt(k++, M);
    }
  }
  rot.add(sp);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 7.4, 24), dk);
  hub.rotation.x = Math.PI / 2;
  root.add(hub);
  const hubN = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.18, 6, 32), neon);
  hubN.position.z = 3.75;
  root.add(hubN);
  const hubN2 = hubN.clone();
  hubN2.position.z = -3.75;
  root.add(hubN2);
  // A-frame legs from the ground up to the axle
  for (const dz of [-6.5, 6.5])
    for (const dx of [-20, 20]) {
      const a = new THREE.Vector3(W.x + dx, 0, W.z + dz),
        b = new THREE.Vector3(W.x, W.y, W.z + Math.sign(dz) * 3.6),
        len = a.distanceTo(b);
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.8, len, 10),
        dk,
      );
      leg.position.copy(a).add(b).multiplyScalar(0.5);
      leg.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.clone().sub(a).normalize(),
      );
      leg.castShadow = true;
      scene.add(leg);
      addB(a.x - 1, a.x + 1, a.z - 1, a.z + 1, 4, -1);
    }
  // glass cabins that stay level while the wheel turns
  const cg = new THREE.SphereGeometry(1.7, 14, 10);
  cg.scale(1, 0.9, 1.25);
  WHEELG.cab = new THREE.InstancedMesh(
    cg,
    new THREE.MeshPhysicalMaterial({
      color: 0x9fd8ff,
      metalness: 0.2,
      roughness: 0.08,
      transparent: true,
      opacity: 0.82,
      clearcoat: 1,
    }),
    24,
  );
  scene.add(WHEELG.cab);
  WHEELG.cabL = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 1.5, 0.2),
    dk,
    24,
  );
  scene.add(WHEELG.cabL);
  // boarding station + sign facing the boulevard
  const stn = new THREE.Mesh(
    new THREE.BoxGeometry(30, 6, 14),
    new THREE.MeshStandardMaterial({
      color: 0x1d2127,
      metalness: 0.4,
      roughness: 0.4,
    }),
  );
  stn.position.set(W.x, 3, W.z);
  stn.castShadow = stn.receiveShadow = true;
  scene.add(stn);
  const band = new THREE.Mesh(new THREE.BoxGeometry(30.2, 0.3, 14.2), neon);
  band.position.set(W.x, 5.6, W.z);
  scene.add(band);
  const sg = textPlane("HALO WHEEL", 20, 4, {
    col: "#ffd6f0",
    glow: "#ff4fc0",
    sub: "ONE LAP · 12 MINUTES · BEST VIEW IN TOWN",
    subCol: "#8ff5ff",
    bright: 1.3,
  });
  sg.position.set(W.x + 15.2, 9, W.z);
  sg.rotation.y = Math.PI / 2;
  scene.add(sg);
}
function updateWheel(dt, t) {
  const W = WHEEL,
    r = WHEELG.rot;
  r.rotation.z += 0.045 * dt;
  const M = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + r.rotation.z,
      x = W.x + Math.cos(a) * W.R,
      y = W.y + Math.sin(a) * W.R;
    M.makeTranslation(x, y - 2.1, W.z);
    WHEELG.cab.setMatrixAt(i, M);
    M.makeTranslation(x, y - 0.75, W.z);
    WHEELG.cabL.setMatrixAt(i, M);
  }
  WHEELG.cab.instanceMatrix.needsUpdate =
    WHEELG.cabL.instanceMatrix.needsUpdate = true;
  WHEELG.neon.color
    .setHSL((0.17 + ((t * 0.04) % 1) * 0.9) % 1, 1, 0.5)
    .multiplyScalar(2.4);
}
updateWheel(0, 0);

/* ---------------- the car (original design) ---------------- */
