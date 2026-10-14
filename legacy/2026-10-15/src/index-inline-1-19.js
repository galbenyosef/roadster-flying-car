// index-inline-1 19 — fillstyle
// Lines 84087-84434 of readable/index-inline-1.pretty.js (statement-aligned).
const SKINS = [
  {
    id: "red",
    n: "FACTORY RED",
    tier: "STANDARD",
    price: 0,
    c: "#B3121B",
    m: 0.3,
    r: 0.28,
    tag: "The launch colour. Deep red under a glass-clear coat.",
  },
  {
    id: "white",
    n: "PEARL WHITE",
    tier: "STANDARD",
    price: 0,
    c: "#E9ECEF",
    m: 0.25,
    r: 0.24,
    sheen: 0.6,
    sheenC: "#cfe6ff",
    tag: "Bright pearl with a soft blue shimmer.",
  },
  {
    id: "midnight",
    n: "MIDNIGHT",
    tier: "STANDARD",
    price: 0,
    c: "#0d0f13",
    m: 0.6,
    r: 0.2,
    rim: "#2a2d33",
    tag: "Gloss black on dark rims. Quiet until it isn't.",
  },
  {
    id: "ocean",
    n: "OCEAN BLUE",
    tier: "STANDARD",
    price: 800,
    c: "#1B4FA8",
    m: 0.55,
    r: 0.24,
    tag: "Metallic blue, like the desert sky at noon.",
  },
  {
    id: "silver",
    n: "SATIN SILVER",
    tier: "STANDARD",
    price: 1200,
    c: "#a7adb4",
    m: 0.85,
    r: 0.4,
    cc: 0.3,
    tag: "Brushed-metal look with a satin finish.",
  },
  {
    id: "carbon",
    n: "CARBON",
    tier: "LUXURY",
    price: 3000,
    c: "#ffffff",
    tex: "carbon",
    m: 0.45,
    r: 0.32,
    ccr: 0.08,
    rim: "#1a1b1e",
    cal: "#ffb35c",
    perk: 0.1,
    tag: "Exposed carbon weave, black rims, gold calipers.",
  },
  {
    id: "gold",
    n: "CHAMPAGNE GOLD",
    tier: "LUXURY",
    price: 5000,
    c: "#d4ad62",
    m: 1,
    r: 0.18,
    rim: "#e2bf6a",
    cal: "#111111",
    perk: 0.15,
    sw: "linear-gradient(135deg,#f3dc9c,#b8893e 50%,#f0d58e)",
    tag: "Champagne metallic with gold rims. Pure Vegas.",
  },
  {
    id: "neon",
    n: "NEON NIGHT",
    tier: "LUXURY",
    price: 6000,
    c: "#150a28",
    m: 0.55,
    r: 0.28,
    emTex: "neon",
    em: "#ffffff",
    emi: 2.4,
    rim: "#101114",
    rimE: "#28e0ff",
    cal: "#ff2bd6",
    glow: "#ff2bd6",
    perk: 0.15,
    tag: "Violet body with glowing pinstripes, light-up rims and underglow.",
  },
  {
    id: "chrome",
    n: "MIRROR CHROME",
    tier: "LUXURY",
    price: 8000,
    c: "#f2f4f7",
    m: 1,
    r: 0.02,
    cc: 0,
    env: 1.6,
    perk: 0.2,
    sw: "linear-gradient(135deg,#fff,#8d949c 45%,#f4f6f8 55%,#6b737c)",
    tag: "A rolling mirror. Reflects the whole Strip.",
  },
  {
    id: "leopard",
    n: "LEOPARD",
    tier: "PREMIUM",
    price: 9000,
    c: "#ffffff",
    tex: "leopard",
    m: 0.15,
    r: 0.42,
    cc: 0.8,
    rim: "#d4ad62",
    cal: "#111111",
    perk: 0.2,
    tag: "Hand-drawn rosettes over gold. Loud on purpose.",
  },
  {
    id: "galaxy",
    n: "GALAXY",
    tier: "PREMIUM",
    price: 11000,
    c: "#ffffff",
    tex: "galaxy",
    emTex: "stars",
    em: "#ffffff",
    emi: 1.6,
    m: 0.35,
    r: 0.25,
    rim: "#1d1f26",
    rimE: "#7a5cff",
    perk: 0.25,
    tag: "Deep-space nebula with stars that glow at night.",
  },
  {
    id: "diamond",
    n: "DIAMOND",
    tier: "PREMIUM",
    price: 15000,
    c: "#ffffff",
    tex: "diamond",
    flat: true,
    irid: 1,
    m: 0.7,
    r: 0.05,
    env: 2,
    rim: "#eef3fa",
    cal: "#7fd6ff",
    perk: 0.3,
    tag: "Faceted, iridescent, catches every light. The rarest finish.",
  },
];
const SKIN = () => SKINS.find((s) => s.id === ECO.skin) || SKINS[0];
// skin textures are painted once on canvases, mapped on the body's UVs (u around the body, v nose to tail)
const SKTEX = {};
function skTex(k) {
  if (SKTEX[k]) return SKTEX[k];
  const c = document.createElement("canvas"),
    x = c.getContext("2d"),
    R = rng(k.length * 97 + 13);
  let rep = [1, 1];
  if (k === "carbon") {
    c.width = c.height = 64;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const on = ((i + j) >> 1) % 2 === 0;
        const g = x.createLinearGradient(i * 8, j * 8, i * 8 + 8, j * 8 + 8);
        g.addColorStop(0, on ? "#2b2f36" : "#15171b");
        g.addColorStop(1, on ? "#1a1d22" : "#23262c");
        x.fillStyle = g;
        x.fillRect(i * 8, j * 8, 8, 8);
      }
    rep = [34, 30];
  }
  if (k === "leopard") {
    c.width = c.height = 512;
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, "#e2b25c");
    g.addColorStop(0.5, "#cf963f");
    g.addColorStop(1, "#e6b866");
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    const ros = (cx, cy, rr) => {
      x.fillStyle = "#a8641f";
      x.beginPath();
      x.ellipse(cx, cy, rr * 0.75, rr * 0.6, R() * 3, 0, 7);
      x.fill();
      x.fillStyle = "#21150a";
      const n = 5 + ((R() * 3) | 0);
      for (let q = 0; q < n; q++) {
        if (R() < 0.18) continue;
        const a = (q / n) * Math.PI * 2 + R() * 0.4;
        x.beginPath();
        x.ellipse(
          cx + Math.cos(a) * rr,
          cy + Math.sin(a) * rr * 0.85,
          rr * (0.28 + R() * 0.18),
          rr * (0.16 + R() * 0.1),
          a + Math.PI / 2,
          0,
          7,
        );
        x.fill();
      }
    };
    for (let i = 0; i < 46; i++) {
      const cx = R() * 512,
        cy = R() * 512,
        rr = 14 + R() * 12;
      for (const ox of [-512, 0, 512])
        for (const oy of [-512, 0, 512]) ros(cx + ox, cy + oy, rr);
    }
    x.fillStyle = "#21150a";
    for (let i = 0; i < 90; i++) {
      const cx = R() * 512,
        cy = R() * 512,
        rr = 2 + R() * 4;
      x.beginPath();
      x.arc(cx, cy, rr, 0, 7);
      x.fill();
    }
    rep = [3, 4.4];
  }
  if (k === "galaxy" || k === "stars") {
    c.width = 1024;
    c.height = 512;
    x.fillStyle = k === "galaxy" ? "#0a0624" : "#000";
    x.fillRect(0, 0, 1024, 512);
    if (k === "galaxy") {
      const cols = [
        "rgba(255,43,214,",
        "rgba(40,224,255,",
        "rgba(122,92,255,",
        "rgba(255,120,60,",
      ];
      for (let i = 0; i < 26; i++) {
        const cx = R() * 1024,
          cy = R() * 512,
          rr = 60 + R() * 170,
          cl = cols[(R() * cols.length) | 0];
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, cl + (0.28 + R() * 0.25) + ")");
        g.addColorStop(1, cl + "0)");
        x.fillStyle = g;
        x.fillRect(0, 0, 1024, 512);
      }
    }
    for (let i = 0; i < 900; i++) {
      const b = R();
      x.fillStyle = `rgba(255,255,255,${0.35 + b * 0.65})`;
      const s = b > 0.97 ? 2.6 : b > 0.85 ? 1.6 : 1;
      x.fillRect(R() * 1024, R() * 512, s, s);
    }
  }
  if (k === "diamond") {
    c.width = c.height = 256;
    x.fillStyle = "#eef3fb";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const b = R();
      x.fillStyle =
        b > 0.94
          ? "#ffffff"
          : b > 0.6
            ? `rgba(170,190,220,${0.4 + R() * 0.4})`
            : `rgba(255,255,255,${R() * 0.5})`;
      x.fillRect(R() * 256, R() * 256, b > 0.94 ? 2 : 1, b > 0.94 ? 2 : 1);
    }
    rep = [6, 6];
  }
  if (k === "neon") {
    c.width = 256;
    c.height = 512;
    x.fillStyle = "#000";
    x.fillRect(0, 0, 256, 512);
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#28e0ff");
    g.addColorStop(0.5, "#ff2bd6");
    g.addColorStop(1, "#7a5cff");
    x.fillStyle = g;
    for (const u of [0.035, 0.465]) x.fillRect(u * 256 - 3, 0, 6, 512);
    x.fillRect(0.25 * 256 - 1.5, 0, 3, 512);
    x.globalAlpha = 0.5;
    for (const u of [0.06, 0.44]) x.fillRect(u * 256 - 1, 0, 2, 512);
    x.globalAlpha = 1;
    x.fillStyle = "#ff2bd6";
    for (const v of [0.02, 0.98]) x.fillRect(0, v * 512 - 3, 256, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  SKTEX[k] = t;
  return t;
}
function skinSwatch(s) {
  if (s.sw) return s.sw;
  if (s.tex) {
    const t = skTex(s.tex);
    if (!t.userData.url) t.userData.url = t.image.toDataURL();
    return `url(${t.userData.url}) center/${s.tex === "carbon" ? "24px" : "cover"}`;
  }
  if (s.emTex) {
    const t = skTex(s.emTex);
    if (!t.userData.url) t.userData.url = t.image.toDataURL();
    return `url(${t.userData.url}) center/cover, ${s.c}`;
  }
  return s.c;
}
function skinMat(m, s) {
  const map = s.tex ? skTex(s.tex) : null,
    emap = s.emTex ? skTex(s.emTex) : null,
    flat = !!s.flat;
  if (m.map !== map || m.emissiveMap !== emap || m.flatShading !== flat) {
    m.map = map;
    m.emissiveMap = emap;
    m.flatShading = flat;
    m.needsUpdate = true;
  }
  m.color.set(s.c);
  m.metalness = s.m;
  m.roughness = s.r;
  m.clearcoat = s.cc != null ? s.cc : 1;
  m.clearcoatRoughness = s.ccr != null ? s.ccr : 0.05;
  m.emissive.set(s.em || "#000000");
  m.emissiveIntensity = s.emi != null ? s.emi : 1;
  m.iridescence = s.irid || 0;
  m.iridescenceIOR = 2.1;
  m.iridescenceThicknessRange = [100, 650];
  m.sheen = s.sheen || 0;
  if (s.sheenC) m.sheenColor.set(s.sheenC);
  m.envMapIntensity = s.env != null ? s.env : 1.15;
}
