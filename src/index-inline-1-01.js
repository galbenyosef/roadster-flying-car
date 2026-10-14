// index-inline-1 01 — three
// Lines 78641-78929 of readable/index-inline-1.pretty.js (statement-aligned).
const THREE = __req("three.module.js");
const { EffectComposer } = __req("jsm/postprocessing/EffectComposer.js");
const { RenderPass } = __req("jsm/postprocessing/RenderPass.js");
const { UnrealBloomPass } = __req("jsm/postprocessing/UnrealBloomPass.js");
const { OutputPass } = __req("jsm/postprocessing/OutputPass.js");

const byId = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
  lerp = (a, b, t) => a + (b - a) * t,
  smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
const isTouch = matchMedia("(pointer:coarse)").matches;
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
};

/* ---------------- renderer ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (e) {
  byId("nogl").hidden = false;
  byId("title").hidden = true;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
byId("app").appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  9000,
);

/* ---------------- noise ---------------- */
function hash2(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const smoothstep = (t) => t * t * (3 - 2 * t);
function valueNoise(x, y) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = smoothstep(x - xi),
    yf = smoothstep(y - yi);
  return lerp(
    lerp(hash2(xi, yi), hash2(xi + 1, yi), xf),
    lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), xf),
    yf,
  );
}
function fbm(x, y, o = 5) {
  let s = 0,
    a = 0.5,
    f = 1,
    n = 0;
  for (let i = 0; i < o; i++) {
    s += a * valueNoise(x * f, y * f);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / n;
}
function rng(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- night sky, moon, environment ---------------- */
const CITY = new THREE.Vector3(2150, 0, -2250);
const cityDir = new THREE.Vector3(CITY.x - 500, 0, CITY.z + 400).normalize();
const skyG = new THREE.Group();
scene.add(skyG);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    uZen: { value: new THREE.Color(0.13, 0.32, 0.7) },
    uHor: { value: new THREE.Color(0.62, 0.74, 0.86) },
    uCl: { value: new THREE.Color(0.95, 0.97, 1) },
    uGr: { value: new THREE.Color(0.55, 0.6, 0.66) },
    uSunC: { value: new THREE.Color(1, 0.94, 0.85) },
    uSunD: { value: new THREE.Vector3(0, 1, 0) },
    uStar: { value: 0 },
  },
  vertexShader:
    "varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader:
    "varying vec3 vD;uniform vec3 uZen,uHor,uCl,uGr,uSunC,uSunD;uniform float uStar;float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}void main(){float h=clamp(vD.y,-.2,1.);vec3 zen=uZen;vec3 hor=uHor;vec3 c=mix(hor,zen,pow(max(h,0.),.5));if(vD.y>0.02){vec2 p=vD.xz/(vD.y+.12)*1.6;float cl=smoothstep(.52,.8,fb(p+vec2(3.1,1.7)));c=mix(c,uCl,cl*.85*smoothstep(.02,.18,vD.y));}float sd=max(dot(vD,uSunD),0.);c+=uSunC*(pow(sd,180.)*2.5+pow(sd,8.)*.22)*(1.-uStar*.75);if(uStar>0.&&vD.y>0.){vec3 q=floor(vD*360.);float st=step(.9965,hs(q.xy+q.z*7.13));c+=vec3(st*uStar*(.55+.45*hs(q.zx)));}c=mix(c,uGr,smoothstep(0.,-.15,vD.y));gl_FragColor=vec4(c*1.15,1.);}",
});
skyG.add(new THREE.Mesh(new THREE.SphereGeometry(8000, 48, 24), skyMat));
const sunDir = new THREE.Vector3().setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(90 - 66),
  THREE.MathUtils.degToRad(35),
);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(scene, 0.04, 1, 9500).texture;
scene.environmentIntensity = 1.0;
scene.fog = new THREE.FogExp2(0xa9bccf, 0.0009);
const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x6e6152, 1.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0da, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, {
  left: -80,
  right: 80,
  top: 80,
  bottom: -80,
  near: 1,
  far: 1000,
});
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

/* ---------------- the city: 16 x 16 blocks, five districts ---------------- */
const BLOCK_PITCH = 96,
  ROAD_WIDTH = 16,
  BLOCK_COUNT = 24,
  HALF = (BLOCK_COUNT * BLOCK_PITCH) / 2,
  EDGE = HALF - 6;
const cellKey = (a, b) => a * 100003 + b,
  CELL = 48;
const buildings = [],
  bgrid = new Map(),
  PROPS = new Map();
function addProp(x, z, r, h) {
  const k = cellKey(Math.floor(x / CELL), Math.floor(z / CELL));
  (PROPS.get(k) || PROPS.set(k, []).get(k)).push([x, z, r, h]);
}
function addB(x0, x1, z0, z1, h, style) {
  const b = { x0, x1, z0, z1, h, style };
  buildings.push(b);
  for (
    let cx = Math.floor((x0 - 3) / CELL);
    cx <= Math.floor((x1 + 3) / CELL);
    cx++
  )
    for (
      let cz = Math.floor((z0 - 3) / CELL);
      cz <= Math.floor((z1 + 3) / CELL);
      cz++
    ) {
      const k = cellKey(cx, cz);
      (bgrid.get(k) || bgrid.set(k, []).get(k)).push(b);
    }
  return b;
}
function bldAt(x, z, m = 0) {
  const c = bgrid.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!c) return null;
  for (const b of c)
    if (x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m) return b;
  return null;
}
const blockOf = (v) => Math.floor((v + HALF) / BLOCK_PITCH);
const blockMin = (i) => -HALF + i * BLOCK_PITCH + ROAD_WIDTH / 2,
  blockMax = (i) => -HALF + (i + 1) * BLOCK_PITCH - ROAD_WIDTH / 2;
function inBlock(x, z) {
  const bi = blockOf(x),
    bj = blockOf(z);
  if (bi < 0 || bj < 0 || bi >= BLOCK_COUNT || bj >= BLOCK_COUNT) return false;
  return (
    x > blockMin(bi) && x < blockMax(bi) && z > blockMin(bj) && z < blockMax(bj)
  );
}
// ground height under (x,z) for something currently at height y
// stunt ramps: wedges you can drive up; their height counts as ground
const RAMPS = [];
function rampH(x, z) {
  for (const r of RAMPS) {
    const dx = x - r.x,
      dz = z - r.z;
    if (dx * dx + dz * dz > r.R2) continue;
    const f = dx * r.fx + dz * r.fz,
      l = dx * r.fz - dz * r.fx;
    if (f > 0 && f < r.L && Math.abs(l) < r.W / 2)
      return { h: 0.2 + (r.H * f) / r.L, r };
  }
  return null;
}
function groundH(x, z, y = 1e9) {
  const c = bgrid.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
  let best = null;
  if (c)
    for (const b of c)
      if (
        x > b.x0 &&
        x < b.x1 &&
        z > b.z0 &&
        z < b.z1 &&
        y >= b.h - 1.2 &&
        (!best || b.h > best.h)
      )
        best = b;
  const base = best ? best.h : inBlock(x, z) ? 0.2 : 0;
  if (RAMPS.length) {
    const rp = rampH(x, z);
    if (rp && y >= rp.h - 0.55 && rp.h > base)
      return { h: rp.h, b: null, q: true, ramp: rp.r };
  }
  return best ? { h: best.h, b: best, q: true } : { h: base, b: null, q: true };
}
// building that (x,z,y) is inside of, with a horizontal margin
function hitB(x, z, y, m = 0) {
  const c = bgrid.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!c) return null;
  for (const b of c)
    if (
      y < b.h - 0.25 &&
      x > b.x0 - m &&
      x < b.x1 + m &&
      z > b.z0 - m &&
      z < b.z1 + m
    )
      return b;
  return null;
}
// special blocks keep the same world positions as before: plaza with the BOX, three rooftop pads
// indices shift by +2 each time the grid grows (16 -> 20 -> 24): world positions of every landmark stay the same
const SPECIAL = {
  "12,15": { plaza: true },
  "12,13": { h: 30, pad: "A" },
  "10,11": { h: 45, pad: "B" },
  "12,10": { h: 56, pad: "C" },
  "13,15": { diner: true },
  "16,16": { fab: true },
  "11,13": { wheel: true },
};
const LAUNCHB = new Set(["17,17", "18,17", "17,18", "18,18", "17,16", "18,16"]);
let DINER = null,
  MEGAFAB = null,
  WHEEL = null;
const PARK = new Set(["15,9", "16,9", "15,10", "16,10"]);
const STUNT = new Set();
for (let i = 3; i <= 6; i++)
  for (let j = 9; j <= 12; j++) STUNT.add(i + "," + j);
const NOTRAF = (axis, l) =>
  (axis === "z" && (l === -768 || l === -672 || l === -576)) ||
  (axis === "x" && (l === -192 || l === -96 || l === 0));
function district(bi, bj) {
  const k = bi + "," + bj;
  if (LAUNCHB.has(k)) return "launch";
  if (PARK.has(k)) return "park";
  if (STUNT.has(k)) return "stunt";
  if (bi === 11 || bi === 12) return "strip";
  if (bi >= 16 && bi <= 21 && bj >= 15 && bj <= 21) return "industrial";
  if (bi <= 5 || bi >= 18 || bj <= 5 || bj >= 18) return "residential";
  return "core";
}
const PADS = [],
  TREES = [],
  PALMS = [],
  BOARDS = [],
  CONT = [],
  PONDS = [];
