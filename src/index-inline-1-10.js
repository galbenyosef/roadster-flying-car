// index-inline-1 10 — math
// Lines 81220-81499 of readable/index-inline-1.pretty.js (statement-aligned).
function updateTraffic(dt) {
  const M = new THREE.Matrix4(),
    W = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    Y = new THREE.Vector3(0, 1, 0),
    V = new THREE.Vector3(),
    One = new THREE.Vector3(1, 1, 1),
    S3 = new THREE.Vector3();
  updateSignals(dt);
  for (const c of TRAFFIC) {
    const fx = -Math.sin(c.yaw),
      fz = -Math.cos(c.yaw);
    const ahead = (ox, oz, lat, reach) => {
      const dx = ox - c.x,
        dz = oz - c.z,
        f = dx * fx + dz * fz,
        l = Math.abs(dx * fz - dz * fx);
      return f > 0 && f < reach && l < lat;
    };
    let blocked = carState.y < 2.5 && ahead(carState.x, carState.z, 2.4, c.T.L / 2 + 6),
      byLight = false;
    if (!blocked && c.ghost <= 0)
      for (const o of TRAFFIC) {
        if (o !== c && ahead(o.x, o.z, 1.7, c.T.L / 2 + o.T.L / 2 + 3.5)) {
          blocked = true;
          break;
        }
      }
    // red lights: stop before the crosswalk of the next inner intersection
    if (!blocked) {
      const nxt =
          -HALF +
          (c.dir > 0
            ? Math.ceil((c.pos + HALF) / BLOCK_PITCH + 1e-6)
            : Math.floor((c.pos + HALF) / BLOCK_PITCH - 1e-6)) *
            BLOCK_PITCH,
        dd = (nxt - c.pos) * c.dir,
        st = c.axis === "z" ? SIGNALS.state.ns : SIGNALS.state.ew;
      if (
        nxt > -HALF + 1 &&
        nxt < HALF - 1 &&
        st !== "g" &&
        dd > c.T.L / 2 + 9 &&
        dd < c.T.L / 2 + (st === "a" ? 15 : 24)
      )
        byLight = true;
    }
    c.wait = blocked ? c.wait + dt : 0;
    blocked = blocked || byLight;
    c.ghost = Math.max(0, c.ghost - dt);
    if (c.wait > 9 && !(carState.y < 2.5 && ahead(carState.x, carState.z, 2.4, c.T.L / 2 + 6))) {
      c.ghost = 2;
      c.wait = 0;
    }
    if (c.kt > 0 || Math.abs(c.ox || 0) + Math.abs(c.oz || 0) > 0.6 || c.jam)
      blocked = true;
    const tv = blocked ? 0 : c.sp;
    c.v += clamp(tv - c.v, -9 * dt, 4 * dt);
    const prev = c.pos;
    c.pos += c.dir * c.v * dt;
    const k = Math.round((prev + HALF) / BLOCK_PITCH),
      cross = -HALF + k * BLOCK_PITCH;
    if ((prev - cross) * (c.pos - cross) <= 0 && prev !== c.pos) {
      const ch = Math.random();
      if (
        ch < 0.3 &&
        cross > -HALF + 1 &&
        cross < HALF - 1 &&
        c.type !== "hauler" &&
        !NOTRAF(c.axis === "x" ? "z" : "x", cross) &&
        !c.jam &&
        !(TRAFBLOCK && TRAFBLOCK(c.axis === "x" ? "z" : "x", cross))
      ) {
        const nl = c.line;
        c.axis = c.axis === "x" ? "z" : "x";
        c.line = cross;
        c.pos = nl;
        c.dir = Math.random() < 0.5 ? 1 : -1;
      }
    }
    if (c.pos > HALF - BLOCK_PITCH * 0.5) {
      c.pos = HALF - BLOCK_PITCH * 0.5;
      c.dir = -1;
    }
    if (c.pos < -HALF + BLOCK_PITCH * 0.5) {
      c.pos = -HALF + BLOCK_PITCH * 0.5;
      c.dir = 1;
    }
    const off = 3.2 * c.dir;
    if (c.axis === "x") {
      c.x = c.pos;
      c.z = c.line + off;
      c.yaw = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      c.z = c.pos;
      c.x = c.line - off;
      c.yaw = c.dir > 0 ? Math.PI : 0;
    }
    if (c.kt > 0) {
      c.kt -= dt;
      c.ox += c.kvx * dt;
      c.oz += c.kvz * dt;
      c.oyaw += c.kspin * dt;
      const fr = Math.exp(-2.4 * dt);
      c.kvx *= fr;
      c.kvz *= fr;
      c.kspin *= Math.exp(-2.8 * dt);
    } else if (c.ox || c.oz || c.oyaw) {
      const k = Math.min(1, dt * 0.7);
      c.ox -= c.ox * k;
      c.oz -= c.oz * k;
      c.oyaw -= c.oyaw * k;
      if (Math.abs(c.ox) + Math.abs(c.oz) + Math.abs(c.oyaw) < 0.04)
        c.ox = c.oz = c.oyaw = 0;
    }
    if (c.ox || c.oz || c.oyaw) {
      c.x += c.ox;
      c.z += c.oz;
      c.yaw += c.oyaw;
    }
    Q.setFromAxisAngle(Y, c.yaw);
    M.compose(V.set(c.x, 0, c.z), Q, One);
    c.T.meshes.forEach((m) => m.setMatrixAt(c.idx, M));
    c.T.wheels.forEach((w, j) => {
      W.compose(S3.set(w[0], w[1], w[2]), scratchQuat, scratchVec3.set(0.3, c.T.wr, c.T.wr));
      W.premultiply(M);
      TRAFFIC.wheels.setMatrixAt(c.wb + j, W);
    });
  }
  for (const T of Object.values(VEHICLE_TYPES))
    if (T.meshes)
      T.meshes.forEach((m) => {
        m.instanceMatrix.needsUpdate = true;
      });
  TRAFFIC.wheels.instanceMatrix.needsUpdate = true;
}

/* ---------------- CrewBot pedestrians walking the sidewalks (instanced) ---------------- */
const WALKERS = [];
{
  const n = isTouch ? 36 : 72,
    r = rng(512);
  const body = new THREE.MeshStandardMaterial({
      color: 0x2d3139,
      metalness: 0.6,
      roughness: 0.35,
    }),
    light = new THREE.MeshStandardMaterial({
      color: 0xe9ecef,
      metalness: 0.3,
      roughness: 0.4,
    });
  const mk = (g, m, c) => {
    const im = new THREE.InstancedMesh(g, m, c);
    im.castShadow = true;
    scene.add(im);
    return im;
  };
  WALKERS.torso = mk(new THREE.CapsuleGeometry(0.23, 0.5, 3, 8), light, n);
  WALKERS.head = mk(new THREE.SphereGeometry(0.16, 8, 6), body, n);
  WALKERS.visor = mk(
    new THREE.BoxGeometry(0.24, 0.035, 0.05),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 2.8) }),
    n,
  );
  const lg = new THREE.CapsuleGeometry(0.075, 0.55, 2, 5);
  lg.translate(0, -0.35, 0);
  WALKERS.legs = mk(lg, body, n * 2);
  const ag = new THREE.CapsuleGeometry(0.055, 0.46, 2, 5);
  ag.translate(0, -0.28, 0);
  WALKERS.arms = mk(ag, body, n * 2);
  for (let i = 0; i < n; i++) {
    let bi, bj;
    do {
      bi = (r() * BLOCK_COUNT) | 0;
      bj = (r() * BLOCK_COUNT) | 0;
    } while (
      district(bi, bj) === "park" ||
      district(bi, bj) === "launch" ||
      district(bi, bj) === "stunt" ||
      SPECIAL[bi + "," + bj]
    );
    const a = blockMin(bi) + 1.7,
      b = blockMax(bi) - 1.7,
      c = blockMin(bj) + 1.7,
      d = blockMax(bj) - 1.7;
    WALKERS.push({
      a,
      b,
      c,
      d,
      per: 2 * (b - a + (d - c)),
      s: r() * 400,
      sp: (0.9 + r() * 0.6) * (r() < 0.5 ? 1 : -1),
      ph: r() * 6,
      x: 0,
      z: 0,
      yaw: 0,
      hit: 0,
      wave: 0,
    });
  }
}
function walkerPos(w) {
  let s = ((w.s % w.per) + w.per) % w.per;
  const L1 = w.b - w.a,
    L2 = w.d - w.c;
  if (s < L1) return [w.a + s, w.c, Math.PI / 2];
  s -= L1;
  if (s < L2) return [w.b, w.c + s, 0];
  s -= L2;
  if (s < L1) return [w.b - s, w.d, -Math.PI / 2];
  s -= L1;
  return [w.a, w.d - s, Math.PI];
}
const walkerEvent = { look: 0, wave: 0, px: 0, pz: 0 };
function updateWalkers(dt, t) {
  const M = new THREE.Matrix4(),
    L = new THREE.Matrix4(),
    TM = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler(),
    V = new THREE.Vector3(),
    One = new THREE.Vector3(1, 1, 1);
  WALKERS.forEach((w, i) => {
    const near = Math.hypot(w.x - carState.x, w.z - carState.z);
    w.wave =
      (near < 14 && !carState.air) || walkerEvent.wave > 0
        ? Math.min(1, w.wave + dt * 3)
        : Math.max(0, w.wave - dt * 2);
    const ev = walkerEvent.look > 0 || walkerEvent.wave > 0;
    if (w.hit > 0) w.hit = Math.max(0, w.hit - dt);
    else if (!ev) w.s += w.sp * dt * (w.wave > 0.5 ? 0.25 : 1);
    w.ph += dt * Math.abs(w.sp) * 5.5 * (w.hit > 0 || ev ? 0 : 1);
    const [x, z, yw] = walkerPos(w);
    w.x = x;
    w.z = z;
    const wy = ev
      ? Math.atan2(walkerEvent.px - x, walkerEvent.pz - z)
      : yw + (w.sp < 0 ? Math.PI : 0);
    if (w.yaw == null || !isFinite(w.yaw)) w.yaw = wy;
    w.yaw +=
      (((((wy - w.yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) %
        (2 * Math.PI)) -
        Math.PI) *
      Math.min(1, dt * (ev ? 4 : 30));
    const tilt = w.hit > 0 ? Math.sin(w.hit * Math.PI) * 0.6 : 0;
    const bob = Math.abs(Math.sin(w.ph)) * 0.03;
    Q.setFromEuler(E.set(tilt, w.yaw, 0, "YXZ"));
    M.compose(V.set(x, 0.2 + bob, z), Q, One);
    L.makeTranslation(0, 1.22, 0);
    WALKERS.torso.setMatrixAt(i, TM.multiplyMatrices(M, L));
    L.makeTranslation(0, 1.8, 0);
    WALKERS.head.setMatrixAt(i, TM.multiplyMatrices(M, L));
    L.makeTranslation(0, 1.82, 0.15);
    WALKERS.visor.setMatrixAt(i, TM.multiplyMatrices(M, L));
    for (const sd of [-1, 1]) {
      const sw = Math.sin(w.ph) * 0.55 * sd;
      Q.setFromEuler(E.set(sw, 0, 0));
      L.compose(V.set(sd * 0.12, 0.92, 0), Q, One);
      WALKERS.legs.setMatrixAt(
        i * 2 + (sd > 0 ? 1 : 0),
        TM.multiplyMatrices(M, L),
      );
      const up = sd > 0 ? w.wave : 0;
      Q.setFromEuler(E.set(-sw * 0.8, 0, sd * (0.08 + up * 2.5)));
      L.compose(V.set(sd * 0.32, 1.52, 0), Q, One);
      WALKERS.arms.setMatrixAt(
        i * 2 + (sd > 0 ? 1 : 0),
        TM.multiplyMatrices(M, L),
      );
    }
  });
  ["torso", "head", "visor", "legs", "arms"].forEach((k) => {
    WALKERS[k].instanceMatrix.needsUpdate = true;
  });
}

/* ---------------- STUNT YARD: open lots with kicker ramps on the west side ---------------- */
const blockCenter = (i) => -HALF + i * BLOCK_PITCH + BLOCK_PITCH / 2;
