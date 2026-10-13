// index-inline-1 18 — kind
// Lines 83814-84086 of readable/index-inline-1.pretty.js (statement-aligned).
function maybeShow(kind) {
  if (!showOn || cin.on || phase !== "play") return;
  if (kind === "hover") {
    if (ONCE.hover) return;
    ONCE.hover = true;
    if (sessOK("hover")) startShow("hover");
    return;
  }
  if (kind === "boost") {
    if (sessOK("boost")) startShow("boost");
    return;
  }
  if (SEEN.has(kind)) {
    if (kind === "launch" || kind === "land") watchOffer(kind);
    else if (kind === "jump" && sessMini()) miniSlow();
    return;
  }
  if (kind !== "jump" || (S.jumpR && S.jumpR.H >= 3.2)) {
    SEEN.add(kind);
    saveSeen();
  }
  const now = performance.now() / 1000;
  if (kind === "jump") {
    if (M && !M.done && (M.def.race || M.def.id === "chase")) return;
    const big = S.jumpR && S.jumpR.H >= 3.2;
    if (
      (!seen.jump ||
        (now - lastShow > (big ? 8 : 20) && Math.random() < (big ? 1 : 0.4))) &&
      sessOK("jump")
    ) {
      seen.jump = true;
      lastShow = now;
      startShow("jump");
    }
    return;
  }
  if (
    !seen[kind] ||
    (now - lastShow > 40 && Math.random() < (kind === "hover" ? 0.35 : 0.25))
  ) {
    seen[kind] = true;
    lastShow = now;
    startShow(kind);
  }
}
function startShow(kind) {
  const D = SHOW[kind];
  Object.assign(cin, {
    on: true,
    t: 0,
    kind,
    full: true,
    dur: D.dur,
    k0: S.bayK,
    lit: true,
  });
  document.body.classList.add("cine", "show");
  $("cinK").textContent = D.k;
  $("cinT").textContent = D.title;
  $("cinS2").textContent = D.sub;
  $("cinS2").classList.add("on");
  $("cinT").classList.remove("go");
  void $("cinT").offsetWidth;
  $("cinT").classList.add("go");
  $("slowx").textContent = D.slow || "0.20×";
  document.querySelector("#cine .tag").style.visibility =
    D.ts && !D.slow ? "hidden" : "";
  cin.freeze = !!D.freeze;
  if (cin.freeze) $("cutUI").hidden = false;
  const L = $("callouts");
  L.innerHTML = '<svg id="coSvg" width="100%" height="100%"></svg>';
  cin.calls = D.call.map((c) => {
    const d = document.createElement("div");
    d.className = "co";
    d.innerHTML = `<b>${c.t}</b><span>${c.v}</span>`;
    L.appendChild(d);
    const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    dot.setAttribute("r", "0");
    $("coSvg").append(ln, dot);
    return { ...c, d, ln, dot, on: false };
  });
  if (kind === "hover") {
    const g = groundH(S.x, S.z, S.y).h;
    shock.position.set(S.x, g + 0.06, S.z);
    shock.visible = true;
    cin.shock = 0;
    audio.seq([
      [0, "whoosh"],
      [120, "hit"],
    ]);
  } else if (kind === "jump" || kind === "finish") audio.seq([[0, "whoosh"]]);
  else
    audio.seq([
      [0, "ignite"],
      [200, "whoosh"],
    ]);
}
function showTick() {
  if (!cin.on || cin.kind === "arm") return;
  const p = clamp(cin.t / cin.dur),
    env = clamp(Math.min(p / 0.12, (1 - p) / 0.14));
  vecMat.opacity = 0.9 * env;
  plumeMat.opacity = 0.13 * env;
  (cin.kind === "hover" ? vecs : cin.kind === "boost" ? rvecs : []).forEach(
    (g, i) => {
      g.visible = true;
      const pulse = 1 + 0.12 * Math.sin(clock * 40 + i);
      g.scale.set(1, pulse, 1);
      if (cin.kind === "boost") g.scale.set(1, 1, pulse);
    },
  );
  if (cin.kind === "hover") {
    const u = clamp(p / 0.5);
    shock.scale.setScalar(1 + u * 9);
    shock.material.opacity = 0.7 * (1 - u);
  }
  car.updateMatrixWorld();
  const W = innerWidth,
    H = innerHeight,
    placed = [];
  cin.calls.forEach((c) => {
    if (!c.on && p >= c.at) {
      c.on = true;
      c.d.classList.add("on");
      c.ln.classList.add("on");
      c.dot.setAttribute("r", "4.5");
      audio.ping();
    }
    const v = c.a().project(camera);
    const x = (v.x * 0.5 + 0.5) * W,
      y = (-v.y * 0.5 + 0.5) * H,
      lx = clamp(x + c.dx, 90, W - 90);
    let ly = clamp(y + c.dy, H * 0.16, H * 0.64);
    const bw = Math.min(250, W * 0.5),
      x0 = c.dx < 0 ? lx - bw : lx;
    for (let g = 0; g < 4; g++) {
      const hit = placed.find(
        (q) => Math.abs(q.y - ly) < 58 && x0 < q.x0 + q.w && q.x0 < x0 + bw,
      );
      if (!hit) break;
      let ny = hit.y + (ly >= hit.y ? 62 : -62);
      if (ny > H * 0.64 || ny < H * 0.16) ny = hit.y + (ly >= hit.y ? -62 : 62);
      ly = ny;
    }
    if (c.on) placed.push({ x0, w: bw, y: ly });
    c.ln.setAttribute("x1", x);
    c.ln.setAttribute("y1", y);
    c.ln.setAttribute("x2", lx);
    c.ln.setAttribute("y2", ly);
    c.dot.setAttribute("cx", x);
    c.dot.setAttribute("cy", y);
    c.d.style.transform = `translate(${lx}px,${ly}px) translate(${c.dx < 0 ? "-100%" : "0"},-50%)`;
    c.d.classList.toggle("l", c.dx < 0);
    c.d.style.opacity = c.on ? Math.min(1, (1 - p) / 0.12) : 0;
  });
  const agl = S.y - groundH(S.x, S.z, S.y).h,
    hs = Math.hypot(S.vx, S.vz);
  $("cinS").textContent =
    cin.kind === "launch"
      ? `ROCKET ALT ${Math.round(LAUNCH.y)} m · ${Math.round(LAUNCH.v * 3.6)} KM/H`
      : cin.kind === "hover"
        ? `ALT ${agl.toFixed(1)} m · V·Z ${S.vy.toFixed(1)} m/s · AIR ${Math.round(S.tank)}%`
        : `${Math.round(hs * (metric ? 3.6 : MPH))} ${metric ? "KM/H" : "MPH"} · HEAT ${Math.round(S.heat)}° · AIR ${Math.round(S.tank)}%`;
}
function endCin() {
  cin.rev = false;
  rco = null;
  vecs.concat(rvecs).forEach((g) => (g.visible = false));
  shock.visible = false;
  vecMat.opacity = 0;
  plumeMat.opacity = 0;
  $("callouts").innerHTML = "";
  document.body.classList.remove("show");
  cin.on = false;
  document.body.classList.remove("cine");
  document.querySelector("#cine .tag").style.visibility = "";
  if (cin.freeze) {
    cin.freeze = false;
    $("cutUI").hidden = true;
    snapCam();
    const f = $("flash");
    f.classList.remove("fl", "fb");
    void f.offsetWidth;
    f.classList.add("fb");
  } else camPos.copy(camera.position);
}
function snapCam() {
  camPos.set(
    S.x + Math.sin(S.yaw) * 5.6,
    S.y + 1.8,
    S.z + Math.cos(S.yaw) * 5.6,
  );
  look.set(S.x - Math.sin(S.yaw) * 6, S.y + 0.75, S.z - Math.cos(S.yaw) * 6);
  camera.position.copy(camPos);
  camera.lookAt(look);
}
// on phones, speak in button names instead of keys
function tx(s) {
  if (!isTouch || !s) return s;
  return s
    .replace(/(Hit|Press) SPACE \+ X for ROCKET MODE/g, "Tap ROCKET")
    .replace(/SPACE \+ X = ROCKET MODE/g, "tap ROCKET")
    .replace(/\(SPACE \+ X\)/g, "(ROCKET)")
    .replace(/SPACE to/g, "hold HOVER to")
    .replace(/hold B and W/g, "hold BOOST and GAS")
    .replace(/hold B \+ W/g, "hold BOOST + GAS")
    .replace(/B with W/g, "BOOST with GAS")
    .replace(/\(SHIFT\)/g, "(ROCKET)")
    .replace(/\bSHIFT = ROCKET MODE\b/g, "tap ROCKET")
    .replace(/\bSHIFT\b/g, "ROCKET")
    .replace(/\bSPACE\b/g, "HOVER");
}
/* ---------------- economy: credits, garage, boosters ---------------- */
const jget = (k, d) => {
  try {
    const v = JSON.parse(store.get(k));
    return v == null ? d : v;
  } catch (e) {
    return d;
  }
};
const ECO = {
  cr: jget("rfc_cr", 3000),
  upg: jget("rfc_upg", {}),
  owned: new Set(jget("rfc_own", ["roadster"])),
  sel: "roadster",
  skins: new Set(jget("rfc_skins", ["red", "white", "midnight"])),
  skin: store.get("rfc_skin") || "red",
  refund: 0,
};
// one car now: the Roadster. Cars bought in older versions become a skin or a refund.
if (!store.get("rfc_mig14")) {
  if (ECO.owned.has("carbon")) ECO.skins.add("carbon");
  if (store.get("rfc_sel") === "carbon") ECO.skin = "carbon";
  ECO.refund =
    (ECO.owned.has("cab") ? 1500 : 0) + (ECO.owned.has("pickup") ? 2500 : 0);
  ECO.cr += ECO.refund;
  ECO.owned = new Set(["roadster"]);
  store.set("rfc_mig14", "1");
}
function saveEco() {
  store.set("rfc_cr", JSON.stringify(ECO.cr));
  store.set("rfc_upg", JSON.stringify(ECO.upg));
  store.set("rfc_own", JSON.stringify([...ECO.owned]));
  store.set("rfc_sel", "roadster");
  store.set("rfc_skins", JSON.stringify([...ECO.skins]));
  store.set("rfc_skin", ECO.skin);
  const c = $("crv");
  if (c) c.textContent = ECO.cr.toLocaleString("en-US");
}
function earn(n) {
  if (n > 0) {
    ECO.cr += Math.round(n * (1 + (SKIN().perk || 0)));
    saveEco();
  }
}
const VEH = [
  {
    id: "roadster",
    n: "ROADSTER",
    tag: "",
    price: 0,
    pmul: 1,
    grip: 1,
    drain: 1,
    fly: true,
    st: [0.95, 1, 0.9, 1],
  },
];
