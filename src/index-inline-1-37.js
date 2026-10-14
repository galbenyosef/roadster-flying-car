// index-inline-1 37 — replay
// Lines 90084-90406 of readable/index-inline-1.pretty.js (statement-aligned).
function replayTick(dt) {
  if (currentMission && !currentMission.done) currentMission.t0 += dt;
  const F = REPLAY.F,
    b = REPLAY.buf,
    i0 = Math.floor(REPLAY.p),
    f = REPLAY.p - i0,
    a = rplIdx(i0),
    c = rplIdx(i0 + 1),
    o0 = a * F,
    o1 = c * F,
    L = (k) => b[o0 + k] + (b[o1 + k] - b[o0 + k]) * f;
  carState.x = L(0);
  carState.y = L(1);
  carState.z = L(2);
  carState.yaw = b[o0 + 3] + angleDelta(b[o1 + 3], b[o0 + 3]) * f;
  carState.pitch = L(4);
  carState.roll = L(5);
  const th = L(6);
  carState.loop = Math.abs(th) > 1e-3 ? { th } : null;
  carState.bayK = L(7);
  carState.thrust = b[o0 + 8];
  carState.susp = L(9);
  carState.suspV = 0;
  carState.steer = L(10);
  carState.v = L(11);
  carState.armed = b[o0 + 12] > 0.5;
  carState.air = b[o0 + 13] > 0.5;
  carState.crash = 0;
  const hs = L(15),
    dr = L(16);
  REPLAY.hs = hs;
  // traffic + rivals from the tape
  const n = TRAFFIC.length,
    ta = a * n * 3,
    tc = c * n * 3,
    T = REPLAY.tb;
  trafPose((q, k) => [
    T[ta + k * 3] + (T[tc + k * 3] - T[ta + k * 3]) * f,
    T[ta + k * 3 + 1] + (T[tc + k * 3 + 1] - T[ta + k * 3 + 1]) * f,
    T[ta + k * 3 + 2] + angleDelta(T[tc + k * 3 + 2], T[ta + k * 3 + 2]) * f,
  ]);
  const ra = a * 12,
    rc = c * 12,
    Rb = REPLAY.rb;
  RIVALS.forEach((r, k) => {
    const vis = Rb[ra + k * 4 + 3] > 0.5;
    r.g.visible = vis;
    if (vis) {
      r.g.position.x = Rb[ra + k * 4] + (Rb[rc + k * 4] - Rb[ra + k * 4]) * f;
      r.g.position.z =
        Rb[ra + k * 4 + 1] + (Rb[rc + k * 4 + 1] - Rb[ra + k * 4 + 1]) * f;
      r.g.rotation.y =
        Rb[ra + k * 4 + 2] + angleDelta(Rb[rc + k * 4 + 2], Rb[ra + k * 4 + 2]) * f;
      r.spin -= (hs / 0.36) * dt;
    }
  });
  rivalWheels();
  // effects re-fired from the tape
  const fwv = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)],
    rt = [Math.cos(carState.yaw), -Math.sin(carState.yaw)],
    r = Math.random;
  if (carState.thrust === 2)
    for (let k = 0; k < 4; k++) {
      const nn = BAY_PORTS[k];
      flame.emit(
        carState.x - fwv[0] * 2.42 + rt[0] * nn[0],
        carState.y + nn[1],
        carState.z - fwv[1] * 2.42 + rt[1] * nn[0],
        -fwv[0] * 26 + (r() - 0.5),
        r() - 0.5,
        -fwv[1] * 26 + (r() - 0.5),
        0.12,
        0.16,
        0.9,
      );
    }
  if (carState.thrust === 1 && r() < 0.6) {
    const q = [
      [-0.7, -1.25],
      [0.7, -1.25],
      [-0.7, 1.2],
      [0.7, 1.2],
    ][(r() * 4) | 0];
    gas.emit(
      carState.x + rt[0] * q[0] - fwv[0] * q[1],
      carState.y + 0.1,
      carState.z + rt[1] * q[0] - fwv[1] * q[1],
      (r() - 0.5) * 1.5,
      -9 - r() * 5,
      (r() - 0.5) * 1.5,
      0.3,
      0.18,
      2.2,
    );
  }
  if (!carState.air && dr > 0.3 && hs > 10 && r() < 0.7)
    for (const sd of [-0.8, 0.8])
      smoke.emit(
        carState.x - fwv[0] * 1.4 + rt[0] * sd,
        carState.y + 0.2,
        carState.z - fwv[1] * 1.4 + rt[1] * sd,
        (r() - 0.5) * 2,
        0.5 + r(),
        (r() - 0.5) * 2,
        1.4,
        0.7,
        2.6,
      );
  if (i0 !== REPLAY.lastI) {
    for (let j = REPLAY.lastI + 1; j <= i0; j++) {
      if (j < 0) continue;
      const imp = b[rplIdx(j) * F + 14];
      if (imp > 2) {
        const nd = Math.min(40, Math.round(imp * 2.5));
        for (let k = 0; k < nd; k++) {
          const an = r() * 6.283,
            rr = 1.2 + r() * 1.4;
          dust.emit(
            carState.x + Math.cos(an) * rr,
            carState.y + 0.15,
            carState.z + Math.sin(an) * rr,
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
    REPLAY.lastI = i0;
  }
  const tg = carState.air ? 0.3 : carState.loop ? 0.45 : hs > 32 ? 0.62 : 0.85;
  REPLAY.speed +=
    (tg - REPLAY.speed) * Math.min(1, (dt / Math.max(0.05, REPLAY.speed)) * 3);
  setT("rplX", `${REPLAY.speed.toFixed(2)}×`);
  REPLAY.p += dt * REPLAY.hz;
  byId("rplBar").style.transform =
    `scaleX(${clamp(REPLAY.p / (REPLAY.cnt - 1)).toFixed(3)})`;
  if (REPLAY.p >= REPLAY.cnt - 1) replayEnd();
}
// the director: cuts between five TV cameras, shorter shots in the air
function rplCam(rdt) {
  if (phase !== "replay") return;
  const fw = new THREE.Vector3(-Math.sin(carState.yaw), 0, -Math.cos(carState.yaw)),
    rt = new THREE.Vector3(Math.cos(carState.yaw), 0, -Math.sin(carState.yaw)),
    C = new THREE.Vector3(carState.x, carState.y + 0.55, carState.z);
  REPLAY.shotT -= rdt;
  if (REPLAY.shotT <= 0 || !REPLAY.shot) {
    const pool = carState.air
      ? ["side", "orbit", "low", "drone"]
      : ["chase", "side", "low", "orbit", "drone"];
    let s = REPLAY.shot ? null : carState.air ? "side" : "chase";
    while (!s || s === REPLAY.shot) s = pool[(Math.random() * pool.length) | 0];
    REPLAY.shot = s;
    REPLAY.shotT = s === "side" ? 2.8 : 2.2;
    REPLAY.oa = Math.random() * 6.283;
    REPLAY.sg = Math.random() < 0.5 ? -1 : 1;
    if (s === "side") {
      const j = rplIdx(Math.floor(REPLAY.p) + 30),
        o = j * REPLAY.F,
        bx = REPLAY.buf[o],
        by = REPLAY.buf[o + 1],
        bz = REPLAY.buf[o + 2],
        yw = REPLAY.buf[o + 3],
        rx = Math.cos(yw),
        rz = -Math.sin(yw);
      let P = null;
      for (const sg of [REPLAY.sg, -REPLAY.sg]) {
        const d = 9 + REPLAY.buf[o + 15] * 0.06,
          q = new THREE.Vector3(bx + rx * d * sg, by + 1.1, bz + rz * d * sg);
        if (!hitB(q.x, q.z, q.y, 0.8)) {
          P = q;
          break;
        }
      }
      REPLAY.fix = P || new THREE.Vector3(bx, by + 6, bz);
      REPLAY.fix.y = Math.max(
        REPLAY.fix.y,
        groundH(REPLAY.fix.x, REPLAY.fix.z, REPLAY.fix.y).h + 0.6,
      );
    }
    if (s === "chase") REPLAY.cp = null;
  }
  let P,
    fov = 50,
    T = C;
  const s = REPLAY.shot;
  if (s === "side") {
    P = REPLAY.fix.clone();
    fov = clamp(2 * Math.atan2(4.2, P.distanceTo(C)) * 57.3, 10, 52);
  } else if (s === "chase") {
    const want = C.clone()
      .addScaledVector(fw, -7.5)
      .add(new THREE.Vector3(0, 1.3, 0));
    REPLAY.cp = REPLAY.cp ? REPLAY.cp.lerp(want, 1 - Math.exp(-rdt * 5)) : want;
    P = REPLAY.cp.clone();
    T = C.clone().addScaledVector(fw, 4);
    fov = 56;
  } else if (s === "orbit") {
    REPLAY.oa += rdt * 0.5 * REPLAY.sg;
    P = C.clone().add(
      new THREE.Vector3(Math.sin(REPLAY.oa) * 6.8, 0.9, Math.cos(REPLAY.oa) * 6.8),
    );
    fov = 42;
  } else if (s === "low") {
    P = C.clone()
      .addScaledVector(fw, 4.6)
      .addScaledVector(rt, 2.7 * REPLAY.sg);
    P.y = carState.y + 0.32;
    T = C.clone().addScaledVector(fw, -1);
    fov = 62;
  } else {
    P = C.clone()
      .addScaledVector(fw, -13)
      .addScaledVector(rt, 5 * REPLAY.sg)
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
const PHOTO = {
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
  PHOTO.fil = i;
  renderer.domElement.style.filter = FILTERS[i][1];
  setT("phoF", FILTERS[i][0]);
}
function photoStart() {
  if (
    PHOTO.on ||
    !(phase === "play" || phase === "replay") ||
    (phase === "play" && cinematic.on)
  )
    return;
  PHOTO.on = true;
  PHOTO.prev = phase;
  phase = "photo";
  const c = new THREE.Vector3(carState.x, carState.y + 0.55, carState.z),
    d = camera.position.clone().sub(c);
  PHOTO.r = clamp(d.length(), 3, 30);
  PHOTO.az = Math.atan2(d.x, d.z);
  PHOTO.el = Math.asin(clamp(d.y / PHOTO.r, -1, 1));
  PHOTO.fov = clamp(camera.fov, 20, 70);
  PHOTO.save = {
    p: camera.position.clone(),
    q: camera.quaternion.clone(),
    fov: camera.fov,
  };
  document.body.classList.add("photo");
  byId("phoUI").hidden = false;
  byId("phoPrev").hidden = true;
  setFilter(PHOTO.fil);
  setT("phoC", PHOTO.card ? "CARD ON" : "CARD OFF");
  audio.shot(2400, 2100, 0.05, 0.08, "square");
}
function photoEnd() {
  if (!PHOTO.on) return;
  PHOTO.on = false;
  phase = PHOTO.prev;
  armPress = false;
  document.body.classList.remove("photo");
  byId("phoUI").hidden = true;
  byId("phoPrev").hidden = true;
  renderer.domElement.style.filter = "";
  camera.position.copy(PHOTO.save.p);
  camera.quaternion.copy(PHOTO.save.q);
  camera.fov = PHOTO.save.fov;
  camera.updateProjectionMatrix();
  last = performance.now();
}
function photoTick(dt) {
  const kk = (a, b) => (keyState[a] || keyState[b] ? 1 : 0);
  PHOTO.az += (kk("arrowleft", "a") - kk("arrowright", "d")) * dt * 1.3;
  PHOTO.el += (kk("arrowup", "w") - kk("arrowdown", "s")) * dt * 0.9;
  PHOTO.r *= Math.exp((kk("-", "x") - kk("=", "z")) * dt * 1.2);
  PHOTO.el = clamp(PHOTO.el, -0.12, 1.45);
  PHOTO.r = clamp(PHOTO.r, 2.6, 40);
  const c = new THREE.Vector3(carState.x, carState.y + 0.55, carState.z),
    P = c
      .clone()
      .add(
        new THREE.Vector3(
          Math.sin(PHOTO.az) * Math.cos(PHOTO.el) * PHOTO.r,
          Math.sin(PHOTO.el) * PHOTO.r,
          Math.cos(PHOTO.az) * Math.cos(PHOTO.el) * PHOTO.r,
        ),
      );
  const gy = groundH(P.x, P.z, P.y).h + 0.15;
  if (P.y < gy) P.y = gy;
  camera.position.copy(P);
  camera.lookAt(c);
  camera.fov = PHOTO.fov;
  camera.updateProjectionMatrix();
}
