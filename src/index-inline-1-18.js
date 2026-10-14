// index-inline-1 18 — kind
// Lines 83814-84086 of readable/index-inline-1.pretty.js (statement-aligned).
function maybeShow(kind) {
  if (!showOn || cinematic.on || phase !== "play") return;
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
  if (kind !== "jump" || (carState.jumpR && carState.jumpR.H >= 3.2)) {
    SEEN.add(kind);
    saveSeen();
  }
  const now = performance.now() / 1000;
  if (kind === "jump") {
    if (currentMission && !currentMission.done && (currentMission.def.race || currentMission.def.id === "chase")) return;
    const big = carState.jumpR && carState.jumpR.H >= 3.2;
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
  Object.assign(cinematic, {
    on: true,
    t: 0,
    kind,
    full: true,
    dur: D.dur,
    k0: carState.bayK,
    lit: true,
  });
  document.body.classList.add("cine", "show");
  byId("cinK").textContent = D.k;
  byId("cinT").textContent = D.title;
  byId("cinS2").textContent = D.sub;
  byId("cinS2").classList.add("on");
  byId("cinT").classList.remove("go");
  void byId("cinT").offsetWidth;
  byId("cinT").classList.add("go");
  byId("slowx").textContent = D.slow || "0.20×";
  document.querySelector("#cine .tag").style.visibility =
    D.ts && !D.slow ? "hidden" : "";
  cinematic.freeze = !!D.freeze;
  if (cinematic.freeze) byId("cutUI").hidden = false;
  const L = byId("callouts");
  L.innerHTML = '<svg id="coSvg" width="100%" height="100%"></svg>';
  cinematic.calls = D.call.map((c) => {
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
    byId("coSvg").append(ln, dot);
    return { ...c, d, ln, dot, on: false };
  });
  if (kind === "hover") {
    const g = groundH(carState.x, carState.z, carState.y).h;
    shock.position.set(carState.x, g + 0.06, carState.z);
    shock.visible = true;
    cinematic.shock = 0;
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
  if (!cinematic.on || cinematic.kind === "arm") return;
  const p = clamp(cinematic.t / cinematic.dur),
    env = clamp(Math.min(p / 0.12, (1 - p) / 0.14));
  vecMat.opacity = 0.9 * env;
  plumeMat.opacity = 0.13 * env;
  (cinematic.kind === "hover" ? vecs : cinematic.kind === "boost" ? rvecs : []).forEach(
    (g, i) => {
      g.visible = true;
      const pulse = 1 + 0.12 * Math.sin(clock * 40 + i);
      g.scale.set(1, pulse, 1);
      if (cinematic.kind === "boost") g.scale.set(1, 1, pulse);
    },
  );
  if (cinematic.kind === "hover") {
    const u = clamp(p / 0.5);
    shock.scale.setScalar(1 + u * 9);
    shock.material.opacity = 0.7 * (1 - u);
  }
  car.updateMatrixWorld();
  const W = innerWidth,
    H = innerHeight,
    placed = [];
  cinematic.calls.forEach((c) => {
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
  const agl = carState.y - groundH(carState.x, carState.z, carState.y).h,
    hs = Math.hypot(carState.vx, carState.vz);
  byId("cinS").textContent =
    cinematic.kind === "launch"
      ? `ROCKET ALT ${Math.round(LAUNCH.y)} m · ${Math.round(LAUNCH.v * 3.6)} KM/H`
      : cinematic.kind === "hover"
        ? `ALT ${agl.toFixed(1)} m · V·Z ${carState.vy.toFixed(1)} m/s · AIR ${Math.round(carState.tank)}%`
        : `${Math.round(hs * (metric ? 3.6 : MPH))} ${metric ? "KM/H" : "MPH"} · HEAT ${Math.round(carState.heat)}° · AIR ${Math.round(carState.tank)}%`;
}
function endCin() {
  cinematic.rev = false;
  calloutState = null;
  vecs.concat(rvecs).forEach((g) => (g.visible = false));
  shock.visible = false;
  vecMat.opacity = 0;
  plumeMat.opacity = 0;
  byId("callouts").innerHTML = "";
  document.body.classList.remove("show");
  cinematic.on = false;
  document.body.classList.remove("cine");
  document.querySelector("#cine .tag").style.visibility = "";
  if (cinematic.freeze) {
    cinematic.freeze = false;
    byId("cutUI").hidden = true;
    snapCam();
    const f = byId("flash");
    f.classList.remove("fl", "fb");
    void f.offsetWidth;
    f.classList.add("fb");
  } else camPos.copy(camera.position);
}
function snapCam() {
  camPos.set(
    carState.x + Math.sin(carState.yaw) * 5.6,
    carState.y + 1.8,
    carState.z + Math.cos(carState.yaw) * 5.6,
  );
  look.set(carState.x - Math.sin(carState.yaw) * 6, carState.y + 0.75, carState.z - Math.cos(carState.yaw) * 6);
  camera.position.copy(camPos);
  camera.lookAt(look);
}
// on phones, speak in button names instead of keys
function touchText(s) {
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
const jsonGet = (k, d) => {
  try {
    const v = JSON.parse(store.get(k));
    return v == null ? d : v;
  } catch (e) {
    return d;
  }
};
const ECONOMY = {
  cr: jsonGet("rfc_cr", 3000),
  upg: jsonGet("rfc_upg", {}),
  owned: new Set(jsonGet("rfc_own", ["roadster"])),
  sel: "roadster",
  skins: new Set(jsonGet("rfc_skins", ["red", "white", "midnight"])),
  skin: store.get("rfc_skin") || "red",
  refund: 0,
};
// one car now: the Roadster. Cars bought in older versions become a skin or a refund.
if (!store.get("rfc_mig14")) {
  if (ECONOMY.owned.has("carbon")) ECONOMY.skins.add("carbon");
  if (store.get("rfc_sel") === "carbon") ECONOMY.skin = "carbon";
  ECONOMY.refund =
    (ECONOMY.owned.has("cab") ? 1500 : 0) + (ECONOMY.owned.has("pickup") ? 2500 : 0);
  ECONOMY.cr += ECONOMY.refund;
  ECONOMY.owned = new Set(["roadster"]);
  store.set("rfc_mig14", "1");
}
function saveEco() {
  store.set("rfc_cr", JSON.stringify(ECONOMY.cr));
  store.set("rfc_upg", JSON.stringify(ECONOMY.upg));
  store.set("rfc_own", JSON.stringify([...ECONOMY.owned]));
  store.set("rfc_sel", "roadster");
  store.set("rfc_skins", JSON.stringify([...ECONOMY.skins]));
  store.set("rfc_skin", ECONOMY.skin);
  const c = byId("crv");
  if (c) c.textContent = ECONOMY.cr.toLocaleString("en-US");
}
function earnCredits(n) {
  if (n > 0) {
    ECONOMY.cr += Math.round(n * (1 + (activeSkin().perk || 0)));
    saveEco();
  }
}
const VEHICLES = [
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
