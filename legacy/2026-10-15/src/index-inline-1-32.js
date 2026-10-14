// index-inline-1 32 — three
// Lines 88540-88887 of readable/index-inline-1.pretty.js (statement-aligned).
function mkGrid(X) {
  const n = X.length;
  return X.map((P1, i) => {
    const P0 = X[(i - 1 + n) % n],
      P2 = X[(i + 1) % n],
      nm = (v) => {
        const l = Math.hypot(v[0], v[1]);
        return [v[0] / l, v[1] / l];
      };
    const a = nm([P1[0] - P0[0], P1[1] - P0[1]]),
      b = nm([P2[0] - P1[0], P2[1] - P1[1]]);
    return [P1[0] + (-a[1] - b[1]) * 3.2, P1[1] + (a[0] + b[0]) * 3.2, a, b];
  });
}
function mkTrack(C, opt) {
  const T = Object.assign(
    { laps: 2, gates: [], on: false, off: 70 },
    opt,
    mkPath(C),
  );
  const g = new THREE.Group();
  scene.add(g);
  g.visible = false;
  T.group = g;
  T.lines = {
    z: [...new Set(C.map((c) => Math.round((c[0] + HALF) / P) * P - HALF))],
    x: [...new Set(C.map((c) => Math.round((c[1] + HALF) / P) * P - HALF))],
  };
  const n = Math.round(T.len / 155);
  for (let i = 1; i <= n; i++) {
    const s = (T.off + (i * T.len) / n - 2) % T.len,
      p = pathAtP(T, s),
      yaw = Math.atan2(-p.tx, -p.tz),
      m = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.3, 2.2, 2.6),
      }),
      a = new THREE.Group();
    a.position.set(p.x, 0, p.z);
    a.rotation.y = yaw;
    for (const sd of [-7, 7]) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), m);
      pl.position.set(sd, 3.5, 0);
      a.add(pl);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.6, 0.5), m);
    top.position.y = 7;
    a.add(top);
    if (i === n) {
      const fl = textPlane(
        T.final ? "SHOWDOWN · FINISH" : "START · FINISH",
        12,
        1.6,
        {
          col: "#0b0c0e",
          bg: T.final ? "#ffb35c" : "#f3efe7",
          font: "900 110px Saira, Arial Black, sans-serif",
        },
      );
      fl.position.y = 8.3;
      a.add(fl);
    }
    g.add(a);
    T.gates.push({ s, x: p.x, z: p.z, m });
  }
  chevrons(T, g);
  return T;
}
const TRACKS = {
  street: mkTrack(
    [
      [3.2, -188.8, [0, -1], [1, 0]],
      [380.8, -188.8, [1, 0], [0, 1]],
      [380.8, 380.8, [0, 1], [-1, 0]],
      [3.2, 380.8, [-1, 0], [0, -1]],
    ],
    { rv: [37, 35.5, 34], cv: [15, 0.5], rb: [-1, 1] },
  ),
  // the final: the whole Strip, six corners including a left-hander by the park; rivals run near a perfect lap and barely ease off
  final: mkTrack(
    mkGrid([
      [0, -576],
      [384, -576],
      [384, -192],
      [576, -192],
      [576, 384],
      [0, 384],
    ]),
    {
      final: true,
      off: 110,
      rv: [47.5, 45, 43.5],
      cv: [18, 0.57],
      rb: [-0.35, 1],
      acc: 11,
    },
  ),
};
let RACE = TRACKS.street;
const pathAt = (s) => pathAtP(RACE, s),
  projS = (x, z, s0) => projSP(RACE, x, z, s0);
// rivals: the same Roadster in other skins, merged into a handful of meshes (a full clone costs ~70 draw calls each)
const LITE = (() => {
  setWing(0, 0);
  bayPose(0, 0);
  car.position.set(0, 0, 0);
  car.rotation.set(0, 0, 0);
  body.rotation.set(0, 0, 0);
  body.position.set(0, 0, 0);
  car.updateMatrixWorld(true);
  const key = (m) =>
      [
        m.type,
        m.color ? m.color.getHexString() : "",
        m.emissive ? m.emissive.getHexString() : "",
        m.emissiveIntensity,
        m.metalness,
        m.roughness,
        m.side,
        m.transparent,
      ].join("|"),
    T = new THREE.Matrix4();
  const collect = (root, ref) => {
    const inv = new THREE.Matrix4().copy(ref.matrixWorld).invert(),
      groups = new Map();
    root.traverse((o) => {
      if (
        !o.isMesh ||
        o.isInstancedMesh ||
        Array.isArray(o.material) ||
        o.material.map
      )
        return;
      for (let q = o; q; q = q.parent) {
        if (!q.visible) return;
        if (q === root) break;
      }
      const m = o.material,
        k = m === paint ? "paint" : key(m);
      let g = groups.get(k);
      if (!g) {
        g = { m, geos: [] };
        groups.set(k, g);
      }
      const geo = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      for (const a of Object.keys(geo.attributes))
        if (a !== "position" && a !== "normal") geo.deleteAttribute(a);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      T.multiplyMatrices(inv, o.matrixWorld);
      geo.applyMatrix4(T);
      g.geos.push(geo);
    });
    return [...groups].map(([k, g]) => {
      let n = 0;
      g.geos.forEach((q) => (n += q.attributes.position.count));
      const Pp = new Float32Array(n * 3),
        Nn = new Float32Array(n * 3);
      let o = 0;
      g.geos.forEach((q) => {
        Pp.set(q.attributes.position.array, o * 3);
        Nn.set(q.attributes.normal.array, o * 3);
        o += q.attributes.position.count;
        q.dispose();
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(Pp, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(Nn, 3));
      geo.computeBoundingSphere();
      return { k, geo, m: g.m };
    });
  };
  return {
    body: collect(body, car),
    wheel: collect(wheels[0].spin, wheels[0].spin),
  };
})();
const RW_IM = LITE.wheel.map((p) => {
  const im = new THREE.InstancedMesh(p.geo, p.m.clone(), 12);
  im.frustumCulled = false;
  scene.add(im);
  return im;
});
const WOFF = wheels.map((w) => w.steer.position.clone()),
  WR0 = wheels[0].r;
const RIVALS = [
  { n: "VEX", skin: "gold", v: 37 },
  { n: "RAZOR", skin: "ocean", v: 35.5 },
  { n: "GHOST", skin: "white", v: 34 },
].map((R, i) => {
  const sk = SKINS.find((s) => s.id === R.skin),
    g = new THREE.Group(),
    pm = paint.clone();
  skinMat(pm, sk);
  for (const p of LITE.body) {
    const o = new THREE.Mesh(p.geo, p.k === "paint" ? pm : p.m);
    o.castShadow = o.receiveShadow = p.k === "paint";
    g.add(o);
  }
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 64;
  const x = cv.getContext("2d");
  x.font = "800 40px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.fillStyle = "#fff";
  x.fillText(R.n, 128, 46);
  const tt = new THREE.CanvasTexture(cv);
  tt.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tt,
      color: new THREE.Color(sk.c),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: false,
    }),
  );
  sp.scale.set(0.16, 0.04, 1);
  sp.position.y = 2.4;
  g.add(sp);
  g.visible = false;
  scene.add(g);
  return {
    ...R,
    col: sk.c,
    g,
    prog: 0,
    sp: 0,
    spin: 0,
    lat: [-2.4, 2.4, 2.4][i],
    row: [-6, -6, -14][i],
  };
});
function rivalWheels() {
  const M4 = new THREE.Matrix4(),
    W = new THREE.Matrix4(),
    Z = new THREE.Matrix4().makeScale(0, 0, 0),
    Sv = new THREE.Vector3();
  let k = 0;
  for (const r of RIVALS) {
    const on = r.g.visible;
    if (on) r.g.updateMatrixWorld();
    for (let j = 0; j < 4; j++) {
      if (on) {
        const s = wheels[j].r / WR0;
        W.makeRotationX(r.spin)
          .scale(Sv.set(s, s, s))
          .setPosition(WOFF[j]);
        M4.multiplyMatrices(r.g.matrixWorld, W);
      } else M4.copy(Z);
      RW_IM.forEach((im) => im.setMatrixAt(k, M4));
      k++;
    }
  }
  RW_IM.forEach((im) => {
    im.instanceMatrix.needsUpdate = true;
  });
}
rivalWheels();
function raceSetup(key = "street") {
  rivalTags(true);
  for (const k in TRACKS) {
    TRACKS[k].on = false;
    TRACKS[k].group.visible = false;
  }
  RACE = TRACKS[key];
  RACE.on = true;
  RACE.group.visible = true;
  RIVALS.forEach((r) => {
    r.prog = r.row;
    r.sp = 0;
    r.g.visible = true;
  });
  const p = pathAt(RACE.off - 14),
    yaw = Math.atan2(-p.tx, -p.tz);
  place(p.x + p.tz * 2.4, p.z - p.tx * 2.4, yaw);
  const bad = (c) =>
    (c.axis === "z" && RACE.lines.z.includes(c.line)) ||
    (c.axis === "x" && RACE.lines.x.includes(c.line));
  for (const c of TRAFFIC) {
    let k = 0;
    while (bad(c) && k++ < 20) {
      c.line = -HALF + (2 + ((Math.random() * (NBK - 4)) | 0)) * P;
    }
  }
  RACE.group.visible = true;
  updateRivals(0);
}
function raceEnd() {
  for (const k in TRACKS) {
    TRACKS[k].on = false;
    TRACKS[k].group.visible = false;
  }
  if (!CHASE.on) RIVALS.forEach((r) => (r.g.visible = false));
  rivalWheels();
}
// the chase: VEX drives a loop through the west side and the boulevard
const CHASE = Object.assign(
  { on: false, s: 0, group: new THREE.Group() },
  mkPath([
    [-380.8, -572.8, [0, -1], [1, 0]],
    [-3.2, -572.8, [1, 0], [0, 1]],
    [-3.2, 476.8, [0, 1], [-1, 0]],
    [-380.8, 476.8, [-1, 0], [0, -1]],
  ]),
);
scene.add(CHASE.group);
CHASE.group.visible = false;
chevrons(CHASE, CHASE.group);
const Z70 = new THREE.Mesh(
  new THREE.RingGeometry(68.6, 70, 120),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.3, 2.2, 2.6),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
Z70.rotation.x = -Math.PI / 2;
Z70.visible = false;
scene.add(Z70);
function chaseSetup() {
  CHASE.on = true;
  CHASE.group.visible = true;
  Z70.visible = true;
  const v = RIVALS[0];
  RIVALS.forEach((r) => (r.g.visible = r === v));
  const s0 = nearestS(CHASE, -380.8, -30);
  CHASE.s = s0;
  v.prog = s0 + VX.gap;
  v.sp = 0;
  v.bst = 0;
  v.bcd = 0;
  const p = pathAtP(CHASE, s0);
  place(p.x, p.z, Math.atan2(-p.tx, -p.tz));
  for (const c of TRAFFIC) {
    if (
      (c.axis === "z" && (c.line === -384 || c.line === 0)) ||
      (c.axis === "x" && (c.line === -576 || c.line === 480))
    ) {
      c.line = -HALF + (2 + ((Math.random() * (NBK - 4)) | 0)) * P;
      if ([-384, 0, -576, 480].includes(c.line)) c.line += P;
    }
  }
  updateRivals(0);
}
