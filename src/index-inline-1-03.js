// index-inline-1 03 — three
// Lines 79258-79583 of readable/index-inline-1.pretty.js (statement-aligned).
const FACADES = [
  winTex(11, "#c2b39b", "#2b3947", "#7d97ad", 0.05),
  winTex(12, "#6f8396", "#1d3244", "#9dbbd4", 0.03),
  winTex(13, "#94979b", "#2a3038", "#6f7f90", 0.04),
  winTex(14, "#e6d9c2", "#34424f", "#8ea4b6", 0.02, 0.28),
  winTex(15, "#b88f47", "#3e2f14", "#f0cf82", 0.12),
  winTex(16, "#8d9195", "#4b5158", "#77818b", 0, 0.05, true),
  (() => {
    // 6: clean white factory panels with a blue glass band
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const x = c.getContext("2d");
    x.fillStyle = "#eef0f2";
    x.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 512; i += 32) {
      x.fillStyle = "rgba(0,0,0,.07)";
      x.fillRect(i, 0, 2, 1024);
    }
    for (let j = 0; j < 1024; j += 64) {
      x.fillStyle = "rgba(0,0,0,.05)";
      x.fillRect(0, j, 512, 2);
    }
    const g = x.createLinearGradient(0, 850, 0, 905);
    g.addColorStop(0, "#5d93c4");
    g.addColorStop(1, "#1f4d78");
    x.fillStyle = g;
    x.fillRect(0, 850, 512, 55);
    x.fillStyle = "rgba(255,255,255,.35)";
    x.fillRect(0, 850, 512, 3);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  })(),
];
{
  const geo = FACADES.map(() => ({ p: [], n: [], u: [], i: [] }));
  const roof = { p: [], n: [], u: [], i: [] };
  const hroof = { p: [], n: [], i: [] };
  const crown = { p: [], c: [], i: [] };
  const r = rng(7);
  const quad = (G, a, b, c, d, n, uv) => {
    const o = G.p.length / 3;
    G.p.push(...a, ...b, ...c, ...d);
    for (let k = 0; k < 4; k++) G.n.push(...n);
    if (uv) G.u.push(...uv);
    G.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  for (const B of buildings) {
    if (B.style < 0) continue;
    const G = geo[B.style],
      { x0, x1, z0, z1, h } = B,
      uw = (w) => w / 51.2,
      vh = h / 115.2;
    quad(
      G,
      [x0, 0, z1],
      [x1, 0, z1],
      [x1, h, z1],
      [x0, h, z1],
      [0, 0, 1],
      [0, 0, uw(x1 - x0), 0, uw(x1 - x0), vh, 0, vh],
    );
    quad(
      G,
      [x1, 0, z0],
      [x0, 0, z0],
      [x0, h, z0],
      [x1, h, z0],
      [0, 0, -1],
      [0, 0, uw(x1 - x0), 0, uw(x1 - x0), vh, 0, vh],
    );
    quad(
      G,
      [x1, 0, z1],
      [x1, 0, z0],
      [x1, h, z0],
      [x1, h, z1],
      [1, 0, 0],
      [0, 0, uw(z1 - z0), 0, uw(z1 - z0), vh, 0, vh],
    );
    quad(
      G,
      [x0, 0, z0],
      [x0, 0, z1],
      [x0, h, z1],
      [x0, h, z0],
      [-1, 0, 0],
      [0, 0, uw(z1 - z0), 0, uw(z1 - z0), vh, 0, vh],
    );
    if (B.style === 3) {
      // pitched roof on houses
      const along = x1 - x0 > z1 - z0,
        rh = Math.min(2.4, Math.min(x1 - x0, z1 - z0) * 0.3),
        o = hroof.p.length / 3;
      if (along) {
        const zm = (z0 + z1) / 2;
        hroof.p.push(
          x0,
          h,
          z1,
          x1,
          h,
          z1,
          x1,
          h + rh,
          zm,
          x0,
          h + rh,
          zm,
          x1,
          h,
          z0,
          x0,
          h,
          z0,
          x0,
          h + rh,
          zm,
          x1,
          h + rh,
          zm,
          x0,
          h,
          z0,
          x0,
          h,
          z1,
          x0,
          h + rh,
          zm,
          x1,
          h,
          z1,
          x1,
          h,
          z0,
          x1,
          h + rh,
          zm,
        );
      } else {
        const xm = (x0 + x1) / 2;
        hroof.p.push(
          x1,
          h,
          z1,
          x1,
          h,
          z0,
          xm,
          h + rh,
          z0,
          xm,
          h + rh,
          z1,
          x0,
          h,
          z0,
          x0,
          h,
          z1,
          xm,
          h + rh,
          z1,
          xm,
          h + rh,
          z0,
          x0,
          h,
          z1,
          x1,
          h,
          z1,
          xm,
          h + rh,
          z1,
          x1,
          h,
          z0,
          x0,
          h,
          z0,
          xm,
          h + rh,
          z0,
        );
      }
      hroof.i.push(
        o,
        o + 1,
        o + 2,
        o,
        o + 2,
        o + 3,
        o + 4,
        o + 5,
        o + 6,
        o + 4,
        o + 6,
        o + 7,
        o + 8,
        o + 9,
        o + 10,
        o + 11,
        o + 12,
        o + 13,
      );
    } else
      quad(
        roof,
        [x0, h, z1],
        [x1, h, z1],
        [x1, h, z0],
        [x0, h, z0],
        [0, 1, 0],
        [0, 0, 1, 0, 1, 1, 0, 1],
      );
    if (h > 80 && B.style !== 5) {
      const cc = [
        [1, 0.2, 0.85],
        [0.15, 0.9, 1],
        [1, 0.75, 0.2],
        [0.5, 0.35, 1],
      ][(r() * 4) | 0].map((v) => v * 1.1);
      const y = h - 1.2,
        t = 0.5;
      const P4 = [
        [x0 - 0.05, z1 + 0.05],
        [x1 + 0.05, z1 + 0.05],
        [x1 + 0.05, z0 - 0.05],
        [x0 - 0.05, z0 - 0.05],
      ];
      for (let k = 0; k < 4; k++) {
        const A = P4[k],
          Bq = P4[(k + 1) % 4];
        const oo = crown.p.length / 3;
        crown.p.push(
          A[0],
          y,
          A[1],
          Bq[0],
          y,
          Bq[1],
          Bq[0],
          y + t,
          Bq[1],
          A[0],
          y + t,
          A[1],
        );
        for (let m = 0; m < 4; m++) crown.c.push(...cc);
        crown.i.push(
          oo,
          oo + 1,
          oo + 2,
          oo,
          oo + 2,
          oo + 3,
          oo,
          oo + 2,
          oo + 1,
          oo,
          oo + 3,
          oo + 2,
        );
      }
    }
  }
  const mk = (G, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(G.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(G.n, 3));
    if (G.u && G.u.length)
      g.setAttribute("uv", new THREE.Float32BufferAttribute(G.u, 2));
    g.setIndex(G.i);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  geo.forEach((G, k) => {
    if (G.p.length) {
      const em = FACADES[k].userData.em;
      const mt = new THREE.MeshStandardMaterial({
        map: FACADES[k],
        roughness: [0.6, 0.3, 0.55, 0.85, 0.35, 0.8, 0.5][k],
        metalness: [0.1, 0.45, 0.15, 0, 0.5, 0.25, 0.1][k],
        emissive: em ? 0xffffff : 0x000000,
        emissiveMap: em || null,
        emissiveIntensity: 0,
      });
      if (em) CITYMATS.push(mt);
      mk(G, mt);
    }
  });
  mk(roof, new THREE.MeshStandardMaterial({ color: 0x6a6d72, roughness: 0.9 }));
  if (hroof.p.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(hroof.p, 3));
    g.setIndex(hroof.i);
    const ng = g.toNonIndexed();
    ng.computeVertexNormals();
    const m = new THREE.Mesh(
      ng,
      new THREE.MeshStandardMaterial({
        color: 0x9a4b35,
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
    );
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute("position", new THREE.Float32BufferAttribute(crown.p, 3));
  cg.setAttribute("color", new THREE.Float32BufferAttribute(crown.c, 3));
  cg.setIndex(crown.i);
  scene.add(
    new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ vertexColors: true })),
  );
}
// rooftop clutter: AC units + antenna lights on tall towers
