// index-inline-1 05 — three
// Lines 79909-80193 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const pts = [];
  for (let a = 1; a < NBK; a++)
    for (let b = 1; b < NBK; b++) {
      if (a >= 4 && a <= 6 && b >= 10 && b <= 12) continue;
      pts.push([-HALF + a * P, -HALF + b * P]);
    }
  const n = pts.length;
  const pole = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.09, 0.12, 5.6, 6),
      new THREE.MeshStandardMaterial({
        color: 0x2a2e34,
        metalness: 0.6,
        roughness: 0.5,
      }),
      n,
    ),
    box = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.55, 1.3, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.6 }),
      n,
    );
  const lns = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.17, 6, 4),
      SIG.ns,
      n,
    ),
    lew = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.17, 6, 4),
      SIG.ew,
      n,
    );
  const M = new THREE.Matrix4();
  pts.forEach(([x, z], i) => {
    const px = x + 9.4,
      pz = z + 9.4;
    addProp(px, pz, 0.25, 6);
    M.makeTranslation(px, 2.8, pz);
    pole.setMatrixAt(i, M);
    M.makeTranslation(px, 5.9, pz);
    box.setMatrixAt(i, M);
    M.makeTranslation(px, 6.05, pz - 0.3);
    lns.setMatrixAt(i, M);
    M.makeTranslation(px - 0.3, 5.75, pz);
    lew.setMatrixAt(i, M);
  });
  scene.add(pole, box, lns, lew);
}
function updateSignals(dt) {
  SIG.t = (SIG.t + dt) % 24;
  const t = SIG.t;
  SIG.state.ns = t < 10 ? "g" : t < 12.5 ? "a" : "r";
  SIG.state.ew = t >= 12 && t < 22 ? "g" : t >= 22 && t < 24.5 ? "a" : "r";
  if (t < 0.5) SIG.state.ew = "r";
  const col = { g: [0.2, 3, 1.2], a: [3, 1.8, 0.1], r: [3, 0.15, 0.12] };
  SIG.ns.color.setRGB(...col[SIG.state.ns]);
  SIG.ew.color.setRGB(...col[SIG.state.ew]);
}
// neon signs on walls facing the street (made-up names), merged per word
{
  const WORDS = [
    ["HOTEL", "#ff2bd6"],
    ["CASINO", "#ffc233"],
    ["NOODLES", "#28e0ff"],
    ["ARCADE", "#7a5cff"],
    ["OPEN 24H", "#ff4f4f"],
    ["DINER", "#5be3a0"],
    ["SLOTS", "#ffc233"],
    ["LIVE MUSIC", "#ff2bd6"],
    ["BURGERS", "#ff8a2a"],
    ["MOTEL", "#28e0ff"],
    ["BAR", "#ff4f4f"],
    ["WEDDINGS", "#ff9ad5"],
  ];
  const r = rng(55);
  const G = WORDS.map(() => ({ p: [], u: [], i: [] }));
  for (let i = 0; i < 330; i++) {
    const B = BLD[(r() * BLD.length) | 0];
    if (B.h < 10 || B.style === 3 || B.style < 0 || B.style === 5) continue;
    const side = (r() * 4) | 0,
      y = 5 + r() * Math.min(18, B.h - 7);
    let x, z, rot;
    if (side === 0) {
      x = lerp(B.x0 + 5, B.x1 - 5, r());
      z = B.z1 + 0.12;
      rot = 0;
    } else if (side === 1) {
      x = lerp(B.x0 + 5, B.x1 - 5, r());
      z = B.z0 - 0.12;
      rot = Math.PI;
    } else if (side === 2) {
      x = B.x1 + 0.12;
      z = lerp(B.z0 + 5, B.z1 - 5, r());
      rot = Math.PI / 2;
    } else {
      x = B.x0 - 0.12;
      z = lerp(B.z0 + 5, B.z1 - 5, r());
      rot = -Math.PI / 2;
    }
    const g = G[(r() * WORDS.length) | 0],
      ax = Math.cos(rot) * 4.5,
      az = -Math.sin(rot) * 4.5,
      o = g.p.length / 3;
    g.p.push(
      x - ax,
      y - 1.125,
      z - az,
      x + ax,
      y - 1.125,
      z + az,
      x + ax,
      y + 1.125,
      z + az,
      x - ax,
      y + 1.125,
      z - az,
    );
    g.u.push(0, 0, 1, 0, 1, 1, 0, 1);
    g.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  WORDS.forEach(([w, c], k) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 128;
    const x = cv.getContext("2d");
    x.font = "800 84px Saira, Arial Black, sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.shadowColor = c;
    x.shadowBlur = 18;
    x.fillStyle = c;
    x.fillText(w, 256, 68);
    x.shadowBlur = 0;
    x.fillStyle = "#fff";
    x.globalAlpha = 0.55;
    x.fillText(w, 256, 68);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(G[k].p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(G[k].u, 2));
    g.setIndex(G[k].i);
    scene.add(
      new THREE.Mesh(
        g,
        new THREE.MeshBasicMaterial({
          map: t,
          transparent: true,
          depthWrite: false,
          color: new THREE.Color(1.25, 1.25, 1.25),
          side: THREE.DoubleSide,
        }),
      ),
    );
  });
}
// animated LED billboards along the boulevard (original ads)
const BOARD_TEX = [];
{
  const ADS = [
    ["ROADSTER", "THE FLYING CAR · NOW BOARDING", "#ffb35c", "#1a0f06"],
    ["ROBOCAB", "RIDE THE CITY · NO DRIVER NEEDED", "#28e0ff", "#04161c"],
    ["NEON NIGHTS", "LIVE SHOW TONIGHT 9PM · 50+ ACTS", "#ff2bd6", "#1a0418"],
  ];
  ADS.forEach(([a, b, c, bg]) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 192;
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    BOARD_TEX.push({ cv, x: cv.getContext("2d"), t, a, b, c, bg });
  });
  const G = BOARD_TEX.map(() => ({ p: [], u: [], i: [] }));
  for (const B of BOARDS) {
    const g = G[B.k],
      ax = (Math.cos(B.rot) * B.w) / 2,
      az = (-Math.sin(B.rot) * B.w) / 2,
      o = g.p.length / 3,
      y = B.y;
    g.p.push(
      B.x - ax,
      y - B.h / 2,
      B.z - az,
      B.x + ax,
      y - B.h / 2,
      B.z + az,
      B.x + ax,
      y + B.h / 2,
      B.z + az,
      B.x - ax,
      y + B.h / 2,
      B.z - az,
    );
    g.u.push(0, 0, 1, 0, 1, 1, 0, 1);
    g.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const frame = new THREE.MeshStandardMaterial({
    color: 0x111317,
    metalness: 0.6,
    roughness: 0.4,
  });
  BOARD_TEX.forEach((T, k) => {
    if (!G[k].p.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(G[k].p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(G[k].u, 2));
    g.setIndex(G[k].i);
    scene.add(
      new THREE.Mesh(
        g,
        new THREE.MeshBasicMaterial({
          map: T.t,
          color: new THREE.Color(1.2, 1.2, 1.2),
          side: THREE.DoubleSide,
        }),
      ),
    );
  });
  for (const B of BOARDS) {
    const f = new THREE.Mesh(
      new THREE.BoxGeometry(B.w + 0.8, B.h + 0.8, 0.3),
      frame,
    );
    f.position.set(
      B.x + Math.sin(B.rot) * -0.2,
      B.y,
      B.z + Math.cos(B.rot) * -0.2,
    );
    f.rotation.y = B.rot;
    scene.add(f);
  }
}
let boardT = 0;
function updateBoards(dt, t) {
  boardT += dt;
  if (boardT < 0.12) return;
  boardT = 0;
  if (
    Math.hypot(
      S.x - (DINER.x0 + DINER.x1) / 2,
      S.z - (DINER.z0 + DINER.z1) / 2,
    ) < 520
  )
    drawDinerScreen(t);
  BOARD_TEX.forEach((T, k) => {
    const x = T.x,
      W = 512,
      H = 192;
    x.fillStyle = T.bg;
    x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, W, 0);
    const s = (t * 0.25 + k * 0.33) % 1;
    g.addColorStop(Math.max(0, s - 0.2), "rgba(255,255,255,0)");
    g.addColorStop(s, "rgba(255,255,255,.14)");
    g.addColorStop(Math.min(1, s + 0.2), "rgba(255,255,255,0)");
    x.fillStyle = T.c;
    x.font = "900 86px Saira, Arial Black, sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    const bump = 1 + 0.04 * Math.sin(t * 3 + k);
    x.save();
    x.translate(W / 2, 78);
    x.scale(bump, bump);
    x.shadowColor = T.c;
    x.shadowBlur = 24;
    x.fillText(T.a, 0, 0, W * 0.9);
    x.restore();
    x.shadowBlur = 0;
    x.fillStyle = "#fff";
    x.font = "700 26px JetBrains Mono, monospace";
    const msg = T.b + "   ·   ";
    const mw = x.measureText(msg).width;
    const off = -((t * 90) % mw);
    x.textAlign = "left";
    for (let px = off; px < W; px += mw) x.fillText(msg, px, 158);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) {
      x.fillStyle = "rgba(0,0,0,.18)";
      x.fillRect(0, y, W, 1);
    }
    T.t.needsUpdate = true;
  });
}
// trees (parks, houses) and palms (boulevard + plaza)
