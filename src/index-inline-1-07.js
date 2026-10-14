// index-inline-1 07 — fillstyle
// Lines 80498-80619 of readable/index-inline-1.pretty.js (statement-aligned).
function drawDinerScreen(t) {
  const S2 = DINER_SCREEN;
  if (!S2.x) return;
  const x = S2.x,
    W = 640,
    H = 288;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1b1036");
  g.addColorStop(0.55, "#ff6a5b");
  g.addColorStop(0.75, "#ffb35c");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#ffd27a";
  x.beginPath();
  x.arc(W * 0.72, H * 0.62, 46, 0, 7);
  x.fill();
  x.fillStyle = "#231437";
  for (let i = 0; i < 22; i++) {
    const bw = 18 + ((i * 37) % 23),
      bh = 40 + ((i * 53) % 90);
    x.fillRect(i * 31 - 10, H * 0.75 - bh, bw, bh);
  }
  x.fillStyle = "#14121a";
  x.fillRect(0, H * 0.75, W, H * 0.25);
  x.fillStyle = "#ffd27a";
  const off = (t * 260) % 80;
  for (let i = -1; i < 9; i++) x.fillRect(i * 80 - off, H * 0.87, 40, 5);
  const lift = Math.max(0, Math.sin(t * 0.9)) * 38,
    cx = W * 0.38,
    cy = H * 0.8 - lift;
  x.fillStyle = "#e0222e";
  x.beginPath();
  x.moveTo(cx - 70, cy);
  x.quadraticCurveTo(cx - 60, cy - 22, cx - 20, cy - 26);
  x.quadraticCurveTo(cx + 10, cy - 44, cx + 40, cy - 26);
  x.quadraticCurveTo(cx + 68, cy - 22, cx + 74, cy - 4);
  x.lineTo(cx + 74, cy);
  x.closePath();
  x.fill();
  x.fillStyle = "#111";
  x.beginPath();
  x.arc(cx - 40, cy + 2, 11, 0, 7);
  x.arc(cx + 44, cy + 2, 11, 0, 7);
  x.fill();
  if (lift > 4) {
    x.fillStyle = "rgba(160,230,255,.85)";
    for (const dx of [-44, 40]) {
      x.beginPath();
      x.moveTo(cx + dx - 8, cy + 10);
      x.lineTo(cx + dx + 8, cy + 10);
      x.lineTo(cx + dx, cy + 10 + lift * 0.8);
      x.fill();
    }
  }
  x.fillStyle = "#fff";
  x.font = "900 34px Saira, Arial Black, sans-serif";
  x.textAlign = "left";
  x.fillText("NOW SHOWING", 24, 46);
  x.fillStyle = "#ffd27a";
  x.font = "800 24px JetBrains Mono, monospace";
  x.fillText("THE FLYING CAR · TONIGHT", 24, 78);
  for (let y = 0; y < H; y += 3) {
    x.fillStyle = "rgba(0,0,0,.12)";
    x.fillRect(0, y, W, 1);
  }
  S2.t.needsUpdate = true;
}
// 2. MEGAFAB: a clean white chip factory with a solar roof
{
  const F = MEGAFAB;
  const s1 = textPlane("MEGAFAB", 46, 10, {
    col: "#1f4d78",
    font: "900 170px Saira, Arial Black, sans-serif",
    sub: "CHIPS FOR CARS · ROBOTS · ROCKETS",
    subCol: "#5d7a96",
  });
  s1.position.set(F.x0 - 0.2, 24, (F.z0 + F.z1) / 2);
  s1.rotation.y = -Math.PI / 2;
  scene.add(s1);
  const s2 = s1.clone();
  s2.position.set((F.x0 + F.x1) / 2, 24, F.z1 + 0.2);
  s2.rotation.y = 0;
  scene.add(s2);
  const nx = Math.floor((F.x1 - F.x0 - 6) / 5),
    nz = Math.floor((F.z1 - F.z0 - 6) / 3.4);
  const pan = new THREE.InstancedMesh(
    new THREE.BoxGeometry(4.4, 0.12, 2.8),
    new THREE.MeshStandardMaterial({
      color: 0x1a2c4a,
      metalness: 0.7,
      roughness: 0.25,
    }),
    nx * nz,
  );
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.22, 0, 0));
  let k = 0;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      M.compose(
        new THREE.Vector3(F.x0 + 5 + i * 5, F.h + 0.9, F.z0 + 5 + j * 3.4),
        Q,
        new THREE.Vector3(1, 1, 1),
      );
      pan.setMatrixAt(k++, M);
    }
  scene.add(pan);
}
// 3. SKYLINE LAUNCH COMPLEX: mount, lattice tower, a reusable rocket, landing zone, tanks, grandstand
const LAUNCH_SITE = {
  mount: {
    x: (blockMin(17) + blockMax(17)) / 2,
    z: (blockMin(17) + blockMax(17)) / 2,
    top: 10,
  },
  lz: {
    x: (blockMin(18) + blockMax(18)) / 2,
    z: (blockMin(18) + blockMax(18)) / 2,
  },
};
LAUNCH_SITE.tower = { x: LAUNCH_SITE.mount.x + 24, z: LAUNCH_SITE.mount.z, h: 100 };
const ROCKET = {};
