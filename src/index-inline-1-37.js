// index-inline-1 37 — rpl
// Lines 90084-90406 of readable/index-inline-1.pretty.js (statement-aligned).
function replayTick(dt) {
  if (M && !M.done) M.t0 += dt;
  const F = RPL.F,
    b = RPL.buf,
    i0 = Math.floor(RPL.p),
    f = RPL.p - i0,
    a = rplIdx(i0),
    c = rplIdx(i0 + 1),
    o0 = a * F,
    o1 = c * F,
    L = (k) => b[o0 + k] + (b[o1 + k] - b[o0 + k]) * f;
  S.x = L(0);
  S.y = L(1);
  S.z = L(2);
  S.yaw = b[o0 + 3] + angD(b[o1 + 3], b[o0 + 3]) * f;
  S.pitch = L(4);
  S.roll = L(5);
  const th = L(6);
  S.loop = Math.abs(th) > 1e-3 ? { th } : null;
  S.bayK = L(7);
  S.thrust = b[o0 + 8];
  S.susp = L(9);
  S.suspV = 0;
  S.steer = L(10);
  S.v = L(11);
  S.armed = b[o0 + 12] > 0.5;
  S.air = b[o0 + 13] > 0.5;
  S.crash = 0;
  const hs = L(15),
    dr = L(16);
  RPL.hs = hs;
  // traffic + rivals from the tape
  const n = TRAFFIC.length,
    ta = a * n * 3,
    tc = c * n * 3,
    T = RPL.tb;
  trafPose((q, k) => [
    T[ta + k * 3] + (T[tc + k * 3] - T[ta + k * 3]) * f,
    T[ta + k * 3 + 1] + (T[tc + k * 3 + 1] - T[ta + k * 3 + 1]) * f,
    T[ta + k * 3 + 2] + angD(T[tc + k * 3 + 2], T[ta + k * 3 + 2]) * f,
  ]);
  const ra = a * 12,
    rc = c * 12,
    Rb = RPL.rb;
  RIVALS.forEach((r, k) => {
    const vis = Rb[ra + k * 4 + 3] > 0.5;
    r.g.visible = vis;
    if (vis) {
      r.g.position.x = Rb[ra + k * 4] + (Rb[rc + k * 4] - Rb[ra + k * 4]) * f;
      r.g.position.z =
        Rb[ra + k * 4 + 1] + (Rb[rc + k * 4 + 1] - Rb[ra + k * 4 + 1]) * f;
      r.g.rotation.y =
        Rb[ra + k * 4 + 2] + angD(Rb[rc + k * 4 + 2], Rb[ra + k * 4 + 2]) * f;
      r.spin -= (hs / 0.36) * dt;
    }
  });
  rivalWheels();
  // effects re-fired from the tape
  const fwv = [-Math.sin(S.yaw), -Math.cos(S.yaw)],
    rt = [Math.cos(S.yaw), -Math.sin(S.yaw)],
    r = Math.random;
  if (S.thrust === 2)
    for (let k = 0; k < 4; k++) {
      const nn = BAYP[k];
      flame.emit(
        S.x - fwv[0] * 2.42 + rt[0] * nn[0],
        S.y + nn[1],
        S.z - fwv[1] * 2.42 + rt[1] * nn[0],
        -fwv[0] * 26 + (r() - 0.5),
        r() - 0.5,
        -fwv[1] * 26 + (r() - 0.5),
        0.12,
        0.16,
        0.9,
      );
    }
  if (S.thrust === 1 && r() < 0.6) {
    const q = [
      [-0.7, -1.25],
      [0.7, -1.25],
      [-0.7, 1.2],
      [0.7, 1.2],
    ][(r() * 4) | 0];
    gas.emit(
      S.x + rt[0] * q[0] - fwv[0] * q[1],
      S.y + 0.1,
      S.z + rt[1] * q[0] - fwv[1] * q[1],
      (r() - 0.5) * 1.5,
      -9 - r() * 5,
      (r() - 0.5) * 1.5,
      0.3,
      0.18,
      2.2,
    );
  }
  if (!S.air && dr > 0.3 && hs > 10 && r() < 0.7)
    for (const sd of [-0.8, 0.8])
      smoke.emit(
        S.x - fwv[0] * 1.4 + rt[0] * sd,
        S.y + 0.2,
        S.z - fwv[1] * 1.4 + rt[1] * sd,
        (r() - 0.5) * 2,
        0.5 + r(),
        (r() - 0.5) * 2,
        1.4,
        0.7,
        2.6,
      );
  if (i0 !== RPL.lastI) {
    for (let j = RPL.lastI + 1; j <= i0; j++) {
      if (j < 0) continue;
      const imp = b[rplIdx(j) * F + 14];
      if (imp > 2) {
        const nd = Math.min(40, Math.round(imp * 2.5));
        for (let k = 0; k < nd; k++) {
          const an = r() * 6.283,
            rr = 1.2 + r() * 1.4;
          dust.emit(
            S.x + Math.cos(an) * rr,
            S.y + 0.15,
            S.z + Math.sin(an) * rr,
            Math.cos(an) * (4 + imp * 0.5),
            0.4 + r() * 1.2,
            Math.sin(an) * (4 + imp * 0.5),
            1.2,
            1.1,
            2.6,
          );
        }
        audio.boom();
      }
    }
    RPL.lastI = i0;
  }
  const tg = S.air ? 0.3 : S.loop ? 0.45 : hs > 32 ? 0.62 : 0.85;
  RPL.speed +=
    (tg - RPL.speed) * Math.min(1, (dt / Math.max(0.05, RPL.speed)) * 3);
  setT("rplX", `${RPL.speed.toFixed(2)}×`);
  RPL.p += dt * RPL.hz;
  $("rplBar").style.transform =
    `scaleX(${clamp(RPL.p / (RPL.cnt - 1)).toFixed(3)})`;
  if (RPL.p >= RPL.cnt - 1) replayEnd();
}
// the director: cuts between five TV cameras, shorter shots in the air
function rplCam(rdt) {
  if (phase !== "replay") return;
  const fw = new THREE.Vector3(-Math.sin(S.yaw), 0, -Math.cos(S.yaw)),
    rt = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw)),
    C = new THREE.Vector3(S.x, S.y + 0.55, S.z);
  RPL.shotT -= rdt;
  if (RPL.shotT <= 0 || !RPL.shot) {
    const pool = S.air
      ? ["side", "orbit", "low", "drone"]
      : ["chase", "side", "low", "orbit", "drone"];
    let s = RPL.shot ? null : S.air ? "side" : "chase";
    while (!s || s === RPL.shot) s = pool[(Math.random() * pool.length) | 0];
    RPL.shot = s;
    RPL.shotT = s === "side" ? 2.8 : 2.2;
    RPL.oa = Math.random() * 6.283;
    RPL.sg = Math.random() < 0.5 ? -1 : 1;
    if (s === "side") {
      const j = rplIdx(Math.floor(RPL.p) + 30),
        o = j * RPL.F,
        bx = RPL.buf[o],
        by = RPL.buf[o + 1],
        bz = RPL.buf[o + 2],
        yw = RPL.buf[o + 3],
        rx = Math.cos(yw),
        rz = -Math.sin(yw);
      let P = null;
      for (const sg of [RPL.sg, -RPL.sg]) {
        const d = 9 + RPL.buf[o + 15] * 0.06,
          q = new THREE.Vector3(bx + rx * d * sg, by + 1.1, bz + rz * d * sg);
        if (!hitB(q.x, q.z, q.y, 0.8)) {
          P = q;
          break;
        }
      }
      RPL.fix = P || new THREE.Vector3(bx, by + 6, bz);
      RPL.fix.y = Math.max(
        RPL.fix.y,
        groundH(RPL.fix.x, RPL.fix.z, RPL.fix.y).h + 0.6,
      );
    }
    if (s === "chase") RPL.cp = null;
  }
  let P,
    fov = 50,
    T = C;
  const s = RPL.shot;
  if (s === "side") {
    P = RPL.fix.clone();
    fov = clamp(2 * Math.atan2(4.2, P.distanceTo(C)) * 57.3, 10, 52);
  } else if (s === "chase") {
    const want = C.clone()
      .addScaledVector(fw, -7.5)
      .add(new THREE.Vector3(0, 1.3, 0));
    RPL.cp = RPL.cp ? RPL.cp.lerp(want, 1 - Math.exp(-rdt * 5)) : want;
    P = RPL.cp.clone();
    T = C.clone().addScaledVector(fw, 4);
    fov = 56;
  } else if (s === "orbit") {
    RPL.oa += rdt * 0.5 * RPL.sg;
    P = C.clone().add(
      new THREE.Vector3(Math.sin(RPL.oa) * 6.8, 0.9, Math.cos(RPL.oa) * 6.8),
    );
    fov = 42;
  } else if (s === "low") {
    P = C.clone()
      .addScaledVector(fw, 4.6)
      .addScaledVector(rt, 2.7 * RPL.sg);
    P.y = S.y + 0.32;
    T = C.clone().addScaledVector(fw, -1);
    fov = 62;
  } else {
    P = C.clone()
      .addScaledVector(fw, -13)
      .addScaledVector(rt, 5 * RPL.sg)
      .add(new THREE.Vector3(0, 8.5, 0));
    fov = 48;
  }
  const gy = groundH(P.x, P.z, P.y).h + 0.25;
  if (P.y < gy) P.y = gy;
  camera.position.copy(P);
  camera.lookAt(T);
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

/* ---- photo mode: freeze, orbit, filter, save a card ---- */
const FILTERS = [
  ["NATURAL", ""],
  ["FILM", "contrast(1.12) saturate(1.18) sepia(.12)"],
  ["NOIR", "grayscale(1) contrast(1.35) brightness(.95)"],
  [
    "GOLD HOUR",
    "sepia(.32) saturate(1.45) hue-rotate(-10deg) brightness(1.05)",
  ],
  ["NEON", "saturate(1.8) contrast(1.15) hue-rotate(10deg)"],
];
const PHO = {
  on: false,
  az: 0,
  el: 0.2,
  r: 7,
  fov: 45,
  fil: 0,
  card: true,
  ptr: new Map(),
  pd: 0,
};
function setFilter(i) {
  PHO.fil = i;
  renderer.domElement.style.filter = FILTERS[i][1];
  setT("phoF", FILTERS[i][0]);
}
function photoStart() {
  if (
    PHO.on ||
    !(phase === "play" || phase === "replay") ||
    (phase === "play" && cin.on)
  )
    return;
  PHO.on = true;
  PHO.prev = phase;
  phase = "photo";
  const c = new THREE.Vector3(S.x, S.y + 0.55, S.z),
    d = camera.position.clone().sub(c);
  PHO.r = clamp(d.length(), 3, 30);
  PHO.az = Math.atan2(d.x, d.z);
  PHO.el = Math.asin(clamp(d.y / PHO.r, -1, 1));
  PHO.fov = clamp(camera.fov, 20, 70);
  PHO.save = {
    p: camera.position.clone(),
    q: camera.quaternion.clone(),
    fov: camera.fov,
  };
  document.body.classList.add("photo");
  $("phoUI").hidden = false;
  $("phoPrev").hidden = true;
  setFilter(PHO.fil);
  setT("phoC", PHO.card ? "CARD ON" : "CARD OFF");
  audio.shot(2400, 2100, 0.05, 0.08, "square");
}
function photoEnd() {
  if (!PHO.on) return;
  PHO.on = false;
  phase = PHO.prev;
  armPress = false;
  document.body.classList.remove("photo");
  $("phoUI").hidden = true;
  $("phoPrev").hidden = true;
  renderer.domElement.style.filter = "";
  camera.position.copy(PHO.save.p);
  camera.quaternion.copy(PHO.save.q);
  camera.fov = PHO.save.fov;
  camera.updateProjectionMatrix();
  last = performance.now();
}
function photoTick(dt) {
  const kk = (a, b) => (K[a] || K[b] ? 1 : 0);
  PHO.az += (kk("arrowleft", "a") - kk("arrowright", "d")) * dt * 1.3;
  PHO.el += (kk("arrowup", "w") - kk("arrowdown", "s")) * dt * 0.9;
  PHO.r *= Math.exp((kk("-", "x") - kk("=", "z")) * dt * 1.2);
  PHO.el = clamp(PHO.el, -0.12, 1.45);
  PHO.r = clamp(PHO.r, 2.6, 40);
  const c = new THREE.Vector3(S.x, S.y + 0.55, S.z),
    P = c
      .clone()
      .add(
        new THREE.Vector3(
          Math.sin(PHO.az) * Math.cos(PHO.el) * PHO.r,
          Math.sin(PHO.el) * PHO.r,
          Math.cos(PHO.az) * Math.cos(PHO.el) * PHO.r,
        ),
      );
  const gy = groundH(P.x, P.z, P.y).h + 0.15;
  if (P.y < gy) P.y = gy;
  camera.position.copy(P);
  camera.lookAt(c);
  camera.fov = PHO.fov;
  camera.updateProjectionMatrix();
}
