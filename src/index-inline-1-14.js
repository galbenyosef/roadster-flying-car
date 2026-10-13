// index-inline-1 14 — three
// Lines 82486-82787 of readable/index-inline-1.pretty.js (statement-aligned).
class Puffs {
  constructor(n, color, additive, op = 0.55) {
    this.n = n;
    this.i = 0;
    this.op = op;
    const g = new THREE.BufferGeometry();
    this.p = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    this.a = new Float32Array(n);
    this.s = new Float32Array(n);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n);
    this.grow = new Float32Array(n);
    g.setAttribute("position", new THREE.BufferAttribute(this.p, 3));
    g.setAttribute("aA", new THREE.BufferAttribute(this.a, 1));
    g.setAttribute("aS", new THREE.BufferAttribute(this.s, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: puffTex },
        col: { value: new THREE.Color(color) },
        scale: { value: innerHeight * 0.5 },
      },
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader:
        "attribute float aA;attribute float aS;varying float vA;uniform float scale;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vA=aA*smoothstep(3.5,11.,-mv.z);gl_PointSize=min(aS*scale/-mv.z,160.);gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "uniform sampler2D map;uniform vec3 col;varying float vA;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(col,t.a*vA);}",
    });
    this.pts = new THREE.Points(g, this.mat);
    this.pts.frustumCulled = false;
    scene.add(this.pts);
  }
  emit(x, y, z, vx, vy, vz, life, size, grow) {
    const i = this.i;
    this.i = (i + 1) % this.n;
    this.p.set([x, y, z], i * 3);
    this.v.set([vx, vy, vz], i * 3);
    this.life[i] = life;
    this.max[i] = life;
    this.s[i] = size;
    this.grow[i] = grow;
  }
  update(dt, drag = 2) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) {
        this.a[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const k = Math.exp(-drag * dt);
      this.v[i * 3] *= k;
      this.v[i * 3 + 1] = this.v[i * 3 + 1] * k + 0.6 * dt;
      this.v[i * 3 + 2] *= k;
      this.p[i * 3] += this.v[i * 3] * dt;
      this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt;
      this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      this.s[i] += this.grow[i] * dt;
      const u = this.life[i] / this.max[i];
      this.a[i] = Math.max(0, u) * this.op;
    }
    this.pts.geometry.attributes.position.needsUpdate =
      this.pts.geometry.attributes.aA.needsUpdate =
      this.pts.geometry.attributes.aS.needsUpdate =
        true;
  }
}
const gas = new Puffs(isTouch ? 500 : 900, 0xeaf4ff, false),
  dust = new Puffs(isTouch ? 400 : 700, 0x8d8a90, false, 0.2),
  smoke = new Puffs(isTouch ? 300 : 500, 0xd8d6d2, false, 0.16),
  sparks = new Puffs(300, 0xffa640, true, 1);

/* ---------------- hidden thruster bay + lift nozzles ---------------- */
const nozzleMat = new THREE.MeshStandardMaterial({
  color: 0x111418,
  emissive: 0x7fd6ff,
  emissiveIntensity: 0,
  metalness: 0.9,
  roughness: 0.3,
});
const steel = new THREE.MeshStandardMaterial({
  color: 0x9aa0a8,
  metalness: 1,
  roughness: 0.25,
  side: THREE.DoubleSide,
});
// rear licence plate on a hinge; behind it a 2x2 cluster of thrusters
const PW = 0.56,
  PH = 0.26,
  PY = 0.575,
  PZ = 2.318;
function plateTex() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 240;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 240);
  g.addColorStop(0, "#fbfaf6");
  g.addColorStop(1, "#dedad1");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 240);
  x.strokeStyle = "#14161a";
  x.lineWidth = 12;
  x.strokeRect(6, 6, 500, 228);
  x.fillStyle = "#b3121b";
  x.fillRect(20, 20, 472, 34);
  x.fillStyle = "#fff";
  x.font = "700 21px Saira, Arial, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("ELECTRIC  ·  FLIGHT CAPABLE", 256, 38);
  x.fillStyle = "#14161a";
  x.font = '900 118px Saira, "Arial Black", sans-serif';
  x.fillText("ROADSTER", 256, 146, 462);
  x.fillStyle = "#5b5f66";
  x.font = "600 19px JetBrains Mono, monospace";
  x.fillText("L A S   V E G A S", 256, 212);
  [
    [30, 72],
    [482, 72],
    [30, 204],
    [482, 204],
  ].forEach(([a, b]) => {
    x.fillStyle = "#8d939b";
    x.beginPath();
    x.arc(a, b, 7, 0, 7);
    x.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const bayBack = new THREE.Mesh(
  new THREE.BoxGeometry(PW + 0.07, PH + 0.05, 0.03),
  new THREE.MeshStandardMaterial({
    color: 0x06070a,
    roughness: 0.45,
    metalness: 0.7,
  }),
);
bayBack.position.set(0, PY - PH / 2, 2.296);
body.add(bayBack);
const bayCoreMat = new THREE.MeshStandardMaterial({
  color: 0x000,
  emissive: 0x8fdcff,
  emissiveIntensity: 0,
});
const BAYP = [
  [-0.135, PY - PH / 2 + 0.066],
  [0.135, PY - PH / 2 + 0.066],
  [-0.135, PY - PH / 2 - 0.066],
  [0.135, PY - PH / 2 - 0.066],
];
const bayNoz = BAYP.map(([x, y]) => {
  const g = new THREE.Group();
  g.position.set(x, y, 2.24);
  const n = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054, 0.064, 0.12, 28, 1, true),
    steel,
  );
  n.rotation.x = Math.PI / 2;
  g.add(n);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.056, 0.009, 8, 28),
    steel,
  );
  lip.position.z = 0.06;
  g.add(lip);
  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.02, 0.08, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1a1d22,
      metalness: 0.9,
      roughness: 0.35,
      side: THREE.BackSide,
    }),
  );
  throat.rotation.x = Math.PI / 2;
  throat.position.z = 0.02;
  g.add(throat);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), bayCoreMat);
  core.position.z = -0.015;
  g.add(core);
  body.add(g);
  return g;
});
const platePivot = new THREE.Group();
platePivot.position.set(0, PY, PZ);
body.add(platePivot);
const plateSide = new THREE.MeshStandardMaterial({
  color: 0x14161a,
  metalness: 0.6,
  roughness: 0.4,
});
const plate = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.018), [
  plateSide,
  plateSide,
  plateSide,
  plateSide,
  new THREE.MeshStandardMaterial({
    map: plateTex(),
    roughness: 0.45,
    metalness: 0.1,
  }),
  plateSide,
]);
plate.position.set(0, -PH / 2, 0);
plate.castShadow = true;
platePivot.add(plate);
const hingeBar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.012, 0.012, PW * 0.9, 10),
  steel,
);
hingeBar.rotation.z = Math.PI / 2;
hingeBar.position.set(0, PY + 0.004, PZ - 0.006);
body.add(hingeBar);
const revMat = new THREE.MeshStandardMaterial({
  color: 0x222,
  emissive: 0xffffff,
  emissiveIntensity: 0,
});
for (const sx of [-0.56, 0.56]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.02), revMat);
  m.position.set(sx, 0.47, 2.29);
  body.add(m);
}
const easeIO = (u) =>
    u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  easeBack = (u) => {
    const c1 = 1.5,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  };
// k: 0 closed -> 1 open. Stages: unlock (slide out), hinge up, thrusters extend.
function bayPose(k, glow) {
  const s = clamp(k / 0.16),
    h = clamp((k - 0.14) / 0.5),
    e = clamp((k - 0.5) / 0.4);
  platePivot.position.z = PZ + 0.04 * easeIO(s);
  platePivot.position.y = PY + 0.012 * easeIO(s);
  platePivot.rotation.x = -2.25 * easeBack(h);
  bayNoz.forEach((n, i) => {
    n.position.z = lerp(2.24, 2.35, easeIO(clamp(e * 1.25 - i * 0.08)));
  });
  bayCoreMat.emissiveIntensity = glow;
}
const flame = new Puffs(isTouch ? 260 : 420, 0xa8e4ff, true, 0.95);
const liftNoz = [
  [-0.7, -1.25],
  [0.7, -1.25],
  [-0.7, 1.2],
  [0.7, 1.2],
].map(([x, z]) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), nozzleMat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, 0.135, z);
  body.add(m);
  return m;
});

/* ---------------- pads, rings, crew ---------------- */
function padTex(label, box) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#26282c";
  x.fillRect(0, 0, 512, 512);
  const r = rng(label.length * 13 + 7);
  for (let i = 0; i < 6000; i++) {
    const g = 30 + r() * 30;
    x.fillStyle = `rgb(${g},${g},${g + 2})`;
    x.fillRect(r() * 512, r() * 512, 2, 2);
  }
  x.lineWidth = 10;
  x.strokeStyle = "#e9e6de";
  if (box) {
    x.strokeRect(116, 116, 280, 280);
    x.setLineDash([28, 18]);
    x.strokeStyle = "#ffb35c";
    x.strokeRect(70, 70, 372, 372);
    x.setLineDash([]);
  } else {
    x.beginPath();
    x.arc(256, 256, 215, 0, 7);
    x.stroke();
    x.lineWidth = 4;
    x.beginPath();
    x.arc(256, 256, 160, 0, 7);
    x.stroke();
  }
  x.fillStyle = "#e9e6de";
  x.font = `900 ${box ? 96 : 170}px Saira, "Arial Black", sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(label, 256, 266);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
