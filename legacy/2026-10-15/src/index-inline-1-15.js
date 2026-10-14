// index-inline-1 15 — three
// Lines 82788-83135 of readable/index-inline-1.pretty.js (statement-aligned).
for (const p of PADS) {
  const g = new THREE.Group();
  g.position.set(p.x, p.y, p.z);
  scene.add(g);
  const side = new THREE.MeshStandardMaterial({
    color: 0x2a2c30,
    roughness: 0.8,
  });
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(p.r, p.r + 0.5, 0.4, 64),
    [
      side,
      new THREE.MeshStandardMaterial({
        map: padTex(p.label, p.box),
        roughness: 0.75,
      }),
      side,
    ],
  );
  top.position.y = -0.18;
  top.receiveShadow = true;
  g.add(top);
  const lights = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0x000,
      emissive: p.color,
      emissiveIntensity: 10,
    }),
    28,
  );
  const M = new THREE.Matrix4();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    M.makeTranslation(
      Math.cos(a) * (p.r + 0.2),
      0.04,
      Math.sin(a) * (p.r + 0.2),
    );
    lights.setMatrixAt(i, M);
  }
  g.add(lights);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.6, 90, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: p.color,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  beam.position.y = 45;
  beam.visible = false;
  g.add(beam);
  p.beam = beam;
  const sign = document.createElement("canvas");
  sign.width = 256;
  sign.height = 64;
  const sx = sign.getContext("2d");
  sx.fillStyle = "rgba(0,0,0,0)";
  sx.fillRect(0, 0, 256, 64);
  sx.fillStyle = "#fff";
  sx.font = "800 40px Saira, Arial, sans-serif";
  sx.textAlign = "center";
  sx.fillText(p.name, 128, 46);
  const st = new THREE.CanvasTexture(sign);
  st.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: st,
      color: p.color,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  sp.scale.set(12, 3, 1);
  sp.position.y = 7;
  g.add(sp);
  p.label3d = sp;
}
const RINGDEF = [
  [0, 250, 12],
  [-3, 190, 20],
  [3, 130, 28],
  [0, 70, 34],
  [-3, 10, 28],
  [0, -50, 22],
];
const RINGS = RINGDEF.map(([x, z, y]) => {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(4.6, 0.28, 12, 56),
    new THREE.MeshStandardMaterial({
      color: 0x000,
      emissive: 0x28e0ff,
      emissiveIntensity: 3.2,
    }),
  );
  m.position.set(x, y, z);
  scene.add(m);
  return { x, y, z, m };
});
function crewBot() {
  const g = new THREE.Group();
  const b = new THREE.MeshStandardMaterial({
    color: 0x2d3139,
    metalness: 0.6,
    roughness: 0.35,
  });
  const acc = new THREE.MeshStandardMaterial({
    color: 0x000,
    emissive: 0xff8a2a,
    emissiveIntensity: 5,
  });
  const vis = new THREE.MeshStandardMaterial({
    color: 0x000,
    emissive: 0x28e0ff,
    emissiveIntensity: 8,
  });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 6, 12), b);
  torso.position.y = 1.25;
  g.add(torso);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.02), acc);
  chest.position.set(0, 1.38, 0.235);
  g.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), b);
  head.scale.set(1, 1.12, 1);
  head.position.y = 1.83;
  g.add(head);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.05), vis);
  visor.position.set(0, 1.85, 0.15);
  g.add(visor);
  for (const x of [-0.12, 0.12]) {
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.62, 4, 8), b);
    l.position.set(x, 0.45, 0);
    g.add(l);
  }
  const arms = [-1, 1].map((s) => {
    const pv = new THREE.Group();
    pv.position.set(s * 0.33, 1.56, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), b);
    a.position.y = -0.3;
    pv.add(a);
    g.add(pv);
    return pv;
  });
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  g.userData.arms = arms;
  g.userData.ph = Math.random() * 6;
  return g;
}
const BOTS = [];
function placeBot(x, z, face) {
  const b = crewBot();
  b.position.set(x, groundH(x, z).h, z);
  b.rotation.y = face;
  scene.add(b);
  BOTS.push(b);
  return b;
}
{
  const A = PADS.find((p) => p.label === "A"),
    Cc = PADS.find((p) => p.label === "C");
  placeBot(A.x + A.r + 1.2, A.z, -Math.PI / 2);
  placeBot(A.x, A.z - A.r - 1.2, 0);
  placeBot(Cc.x - Cc.r - 1.2, Cc.z, Math.PI / 2);
  const Bx = PADS.find((p) => p.box);
  placeBot(Bx.x - Bx.r - 1.5, Bx.z + 2, Math.PI / 2);
  placeBot(9.6, 428, -Math.PI / 2);
}

/* ---------------- post ---------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth / 2, innerHeight / 2),
  0.45,
  0.4,
  2.4,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- input ---------------- */
const K = {},
  T = {};
let armPress = false,
  camMode = 0,
  metric = false;
const WMODES = ["AUTO", "ROAD", "TRACK", "DRS"];
let wingSel = 0;
function cycleWing() {
  wingSel = (wingSel + 1) % 4;
  audio.servo();
}
addEventListener("keydown", (e) => {
  const k = e.key === " " ? " " : e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k))
    e.preventDefault();
  if (typeof v18Key === "function" && v18Key(k)) {
    K[k] = true;
    return;
  }
  if (phase === "gate") {
    startIntro();
    return;
  }
  if (phase === "intro") {
    if (["escape", "enter", " "].includes(k)) endIntro();
    return;
  }
  if (phase === "cut") {
    if (["escape", "enter"].includes(k)) endCut();
    return;
  }
  if (phase === "card") return;
  if (cin.on && k === "enter") {
    cin.t = cin.dur * 0.9;
  }
  if (k === "v" && phase === "play") {
    showOn = !showOn;
    flash(showOn ? "CINEMATIC MOMENTS ON" : "CINEMATIC MOMENTS OFF", "", 1.2);
  }
  if (!K[k]) {
    if (k === "shift") armPress = true;
    if ((k === "x" && K[" "]) || (k === " " && K["x"])) armPress = true;
    if (k === "q") cycleWing();
    if (k === "c") camMode = (camMode + 1) % 3;
    if (k === "r" && phase === "play") respawn(true);
    if (k === "u") metric = !metric;
    if (k === "escape" && phase === "play") {
      if (PAUSE.on) pauseClose();
      else pauseOpen();
    }
    if (k === "enter" && phase === "result") startMission(lastMission);
  }
  K[k] = true;
});
addEventListener("keyup", (e) => {
  const k = e.key === " " ? " " : e.key.toLowerCase();
  K[k] = false;
});
addEventListener("blur", () => {
  for (const k in K) K[k] = false;
});
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button === 2) T.boostM = true;
});
addEventListener("pointerup", (e) => {
  if (e.button === 2) T.boostM = false;
});
function bindTouch(id, key, tap) {
  const el = $(id);
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    T[key] = true;
    el.classList.add("act");
    if (tap) tap();
  });
  const up = () => {
    T[key] = false;
    el.classList.remove("act");
  };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
bindTouch("tbGo", "go");
// floating analog joystick (left thumb) for steering, like most mobile shooters/racers
{
  const Z = $("joyZone"),
    B = $("joyBase"),
    Kn = $("joyKnob");
  let id = null,
    cx = 0,
    cy = 0,
    R = 44;
  Z.addEventListener("pointerdown", (e) => {
    if (id !== null) return;
    id = e.pointerId;
    try {
      Z.setPointerCapture(id);
    } catch (_) {}
    const r = Z.getBoundingClientRect();
    R = Math.max(40, B.offsetWidth * 0.36);
    cx = e.clientX;
    cy = e.clientY;
    B.style.left = cx - r.left + "px";
    B.style.top = cy - r.top + "px";
    Z.classList.add("on");
    e.preventDefault();
  });
  Z.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx,
      dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx *= R / d;
      dy *= R / d;
    }
    Kn.style.transform = `translate(${dx}px,${dy}px)`;
    const v = dx / R;
    T.steer = -Math.sign(v) * Math.pow(clamp((Math.abs(v) - 0.1) / 0.9), 1.35);
  });
  const up = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    T.steer = 0;
    Z.classList.remove("on");
    B.style.left = "";
    B.style.top = "";
    Kn.style.transform = "";
  };
  Z.addEventListener("pointerup", up);
  Z.addEventListener("pointercancel", up);
}
// keep the page from scrolling/zooming under the thumbs while driving
document.addEventListener(
  "touchmove",
  (e) => {
    if (phase === "play" || phase === "intro") e.preventDefault();
  },
  { passive: false },
);
bindTouch("tbBr", "brake");
bindTouch("tbRev", "rev");
bindTouch("tbArm", "arm", () => (armPress = true));
bindTouch("tbHov", "hover");
bindTouch("tbBst", "boost");
bindTouch("tbCam", "cam", () => (camMode = (camMode + 1) % 3));
const inp = () => ({
  thr: K["w"] || K["arrowup"] || T.go,
  brk: K["s"] || K["arrowdown"] || T.brake,
  left: K["a"] || K["arrowleft"] || T.left,
  right: K["d"] || K["arrowright"] || T.right,
  hover: K[" "] || T.hover,
  boost: K["b"] || K["e"] || T.boost || T.boostM,
  rev: (K["x"] && !K[" "] && performance.now() - xDownT > 80) || T.rev,
});

/* ---------------- audio ---------------- */
