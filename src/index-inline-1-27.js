// index-inline-1 27 — carstate
// Lines 86655-87292 of readable/index-inline-1.pretty.js (statement-aligned).
function step(dt) {
  const I = readInput(),
    locked =
      phase !== "play" ||
      (cinematic.on && cinematic.full && cinematic.kind === "arm") ||
      (currentMission && currentMission.def.race && currentMission.rs === "grid");
  let ev = null;
  if (carState.loop) return loopStep(dt, I, locked);
  if (carState.crash > 0) {
    carState.crash -= dt;
    if (currentMission && !currentMission.done && !currentMission.def.race) currentMission.t0 += dt;
    body.position.y = lerp(body.position.y, -0.16, Math.min(1, dt * 10));
    if (carState.crash <= 0) {
      body.position.y = 0;
      if (!(currentMission && currentMission.done)) respawn();
    }
    audio.update(0, false, 0, true, false, false, false);
    return { df: 0, mu: 1.45, geff: 9.81, ev };
  }
  if (armPress && !locked && !activeVehicle.fly) {
    flash(
      "ROCKET MODE",
      "Roadster only · SPACE / HOVER fires the hop jets",
      1.6,
    );
    armPress = false;
  }
  carState.hopCd = Math.max(0, (carState.hopCd || 0) - dt);
  if (armPress && !locked) {
    carState.armed = !carState.armed;
    carState.spool = 0;
    carState.spoolQ = null;
    carState.qPH = I.hover;
    carState.qPB = I.boost;
    audio.click(carState.armed);
    carState.suspV = (carState.suspV || 0) - 0.45;
    carState.pitchV = (carState.pitchV || 0) + (carState.armed ? 0.55 : -0.3);
    shake = Math.max(shake, 0.08);
    if (carState.armed) startArmCin();
    if (!carState.armed && carState.air) flash("THRUSTERS OFF", "free fall", 1.2);
  }
  armPress = false;
  if (carState.armed) carState.spool = Math.min(1.2, carState.spool + dt);
  {
    const sp = carState.armed && carState.spool < 1.2 && !locked,
      eh = I.hover && !carState.qPH,
      eb = I.boost && !carState.qPB;
    carState.qPH = I.hover;
    carState.qPB = I.boost;
    if (sp && (eh || eb)) carState.spoolQ = carState.spoolQ ? null : eh ? "h" : "b";
    if (!carState.armed) carState.spoolQ = null;
  }
  const ready = carState.armed && carState.spool >= 1.2 && !carState.thermal && carState.tank > 0;
  if (ready && carState.spoolQ) {
    if (carState.spoolQ === "h") carState.qH = 0.6;
    else carState.qB = 0.5;
    carState.spoolQ = null;
  }
  if (carState.qH > 0) {
    carState.qH -= dt;
    I.hover = true;
  }
  if (carState.qB > 0) {
    carState.qB -= dt;
    I.boost = true;
  }
  const G = groundH(carState.x, carState.z, carState.y),
    gh = G.h,
    q = G.q,
    onRoad = true,
    agl = carState.y - gh;
  carState.bump = Math.max(0, (carState.bump || 0) - dt);
  const fw = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)];
  // active wing
  let tDp = 0,
    tAng = 0,
    label = "STOWED";
  const mode = WMODES[wingSel];
  if (mode === "ROAD") label = "ROAD · STOWED";
  else if (mode === "TRACK") {
    tDp = 1;
    tAng = 12;
    label = "TRACK · 12°";
  } else if (mode === "DRS") {
    tDp = 1;
    tAng = 1;
    label = "DRS · FLAT";
  } else {
    if (carState.air) {
      tDp = 1;
      tAng = 22;
      label = "AUTO · STABILIZE";
    } else if (carState.v < 19) {
      label = "AUTO · STOWED";
    } else if (I.brk || Math.abs(carState.steer) > 0.3) {
      tDp = 1;
      tAng = 24;
      label = "AUTO · HIGH DOWNFORCE";
    } else if (I.thr && carState.v > 38) {
      tDp = 1;
      tAng = 1;
      label = "AUTO · DRS";
    } else {
      tDp = 1;
      tAng = 11;
      label = "AUTO · TRACK";
    }
  }
  carState.dp += clamp(tDp - carState.dp, -dt / 1.2, dt / 1.2);
  carState.ang += clamp(tAng - carState.ang, -dt * 60, dt * 60);
  carState.wingMode = label;
  const hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  const df = 0.95 * hs * hs * (carState.dp * lerp(0.25, 1, carState.ang / 24) + 0.06);
  const mu =
    (onRoad || padAt(carState.x, carState.z, carState.y) ? 1.45 : 0.72) *
    activeVehicle.grip *
    (1 + 0.07 * upgradeLevel("grip"));
  const geff = 9.81 + (carState.air ? 0 : df / MASS);
  const trac = mu * geff;
  let thrusting = 0;
  const px = carState.x,
    pz = carState.z;
  if (!carState.air) {
    // reverse: REV button / X, or hold brake once stopped (like most driving games)
    const wantRev = !locked && (I.rev || (I.brk && !I.thr && carState.v <= 0.3));
    const hand = !locked && I.brk && Math.abs(carState.steer) > 0.35 && carState.v > 12; // brake + steer at speed = handbrake kick
    if (carState.v >= 0 && !(wantRev && carState.v <= 0.3)) {
      let a = 0;
      if (!locked && I.thr)
        a += Math.min(
          trac,
          (POWER * activeVehicle.pmul * (1 + 0.1 * upgradeLevel("power"))) / Math.max(carState.v, 1) / MASS,
        );
      if (!locked && ready && I.boost) {
        a += BOOST_G * (1 + 0.12 * upgradeLevel("thrust")) * clamp((100 - carState.v) / 25);
        carState.tank -= 8.33 * dt;
        carState.heat += 12 * (1 - 0.18 * upgradeLevel("cool")) * dt;
        thrusting = 2;
      }
      const drag =
        (0.5 * RHO * (CDA + carState.dp * carState.ang * 0.012) * carState.v * carState.v) / MASS +
        (onRoad ? 0.15 : 1.4);
      if (!I.thr && !I.brk && !I.rev && carState.v > 0.5) a -= 1.96;
      if (!locked && (I.brk || I.rev))
        a -= hand
          ? trac * 0.22
          : trac * 0.96 + carState.dp * carState.ang * 0.0008 * carState.v * carState.v;
      carState.v = Math.max(0, carState.v + (a - drag) * dt);
      if (carState.v < 0.05 && !I.thr) carState.v = 0;
    } else {
      if (wantRev) carState.v = Math.max(-8, carState.v - 5 * (1 + carState.v / 14) * dt);
      else carState.v = Math.min(0, carState.v + (I.thr ? 9 : 3) * dt);
    }
    const sIn = locked
      ? 0
      : clamp((I.left ? 1 : 0) - (I.right ? 1 : 0) + (T.steer || 0), -1, 1);
    carState.steer += (sIn - carState.steer) * Math.min(1, dt * (sIn ? 5 : 6));
    // arcade handling: yaw rate from the wheel, capped by speed. Asking for more lateral grip than the tyres have lets the rear step out (drift).
    const av = Math.abs(carState.v),
      cap = Math.min(av * 0.2, 1.3 * lerp(1, 0.7, clamp((av - 15) / 45)));
    let yr = carState.steer * cap * Math.sign(carState.v) * (carState.v < 0 ? 0.7 : 1);
    let want = 0;
    if (carState.v > 11) {
      want = clamp((Math.abs(yr * carState.v) - trac * 0.9) / (trac * 0.7));
      if (hand) want = Math.max(want, 0.9);
    }
    carState.dr += (want - carState.dr) * Math.min(1, dt * (want > carState.dr ? 3.5 : 1.8));
    if (carState.v <= 0) carState.dr = 0;
    yr *= 1 + carState.dr * 0.4;
    carState.yaw += yr * dt;
    if (carState.v <= 0) carState.vyaw = carState.yaw;
    else carState.vyaw += angleDelta(carState.yaw, carState.vyaw) * Math.min(1, lerp(9, 1.5, carState.dr) * dt);
    carState.slip = angleDelta(carState.yaw, carState.vyaw);
    carState.drift = carState.dr;
    if (carState.v > 0)
      carState.v *= 1 - Math.min(0.4, Math.abs(Math.sin(carState.slip)) * 0.28 * dt);
    const vd = [-Math.sin(carState.vyaw), -Math.cos(carState.vyaw)];
    carState.x += vd[0] * carState.v * dt;
    carState.z += vd[1] * carState.v * dt;
    bldCollide(dt);
    trafficCollide(dt);
    driftScore(dt);
    if (!locked && carState.v > 6 && !carState.loop)
      for (const L of LOOPS) {
        const dx = carState.x - L.x,
          dz = carState.z - L.z,
          d = dx * L.fx + dz * L.fz,
          lat = dx * L.rx + dz * L.rz;
        if (
          d > -0.6 &&
          d < 2 &&
          Math.abs(lat) < L.W / 2 &&
          -Math.sin(carState.yaw) * L.fx + -Math.cos(carState.yaw) * L.fz > 0.8
        ) {
          carState.loop = { L, th: 0, lat0: lat };
          carState.yaw = carState.vyaw = L.yaw;
          carState.dr = carState.slip = 0;
          audio.whoosh();
          break;
        }
      }
    const G2 = groundH(carState.x, carState.z, carState.y + 0.6),
      g2 = G2.h;
    if (g2 < carState.y - 0.6) {
      carState.air = true;
      carState.vx = vd[0] * carState.v;
      carState.vz = vd[1] * carState.v;
      carState.vy = Math.max(0, carState.gvy || 0);
      carState.airT = 0;
      carState.spinA = 0;
      carState.jumpR = carState.rampOn;
      carState.rampOn = null;
      carState.gvy = 0;
      carState.ball = !!carState.jumpR;
      carState.hovUsed = false;
      if (carState.jumpR && carState.vy > 5.2) maybeShow("jump");
    } else {
      carState.y = g2;
      const rp = G2.ramp;
      carState.rampOn = rp || null;
      carState.gvy = rp ? carState.v * (rp.H / rp.L) * (vd[0] * rp.fx + vd[1] * rp.fz) : 0;
    }
    if (!locked && ready && I.hover) {
      carState.air = true;
      carState.airT = 0;
      carState.jumpR = null;
      carState.ball = false;
      carState.rampOn = null;
      carState.vx = vd[0] * carState.v;
      carState.vz = vd[1] * carState.v;
      carState.vy = 0.6;
      carState.y += 0.05;
      audio.noise(300, 2500, 0.5, 0.3, "bandpass");
      maybeShow("hover");
    }
    if (!locked && !activeVehicle.fly && I.hover && carState.hopCd <= 0) {
      carState.air = true;
      carState.vx = vd[0] * carState.v;
      carState.vz = vd[1] * carState.v;
      carState.vy = activeVehicle.hop;
      carState.y += 0.05;
      carState.hopCd = 2.2;
      audio.ignite();
      for (let q = 0; q < 24; q++) {
        const r2 = Math.random,
          an = r2() * 6.283;
        dust.emit(
          carState.x + Math.cos(an) * 1.5,
          carState.y + 0.2,
          carState.z + Math.sin(an) * 1.5,
          Math.cos(an) * 8,
          0.5 + r2(),
          Math.sin(an) * 8,
          1,
          1.2,
          3,
        );
      }
    }
  } else {
    carState.airT = (carState.airT || 0) + dt;
    const sIn = locked
      ? 0
      : clamp((I.left ? 1 : 0) - (I.right ? 1 : 0) + (T.steer || 0), -1, 1);
    carState.steer += (sIn - carState.steer) * Math.min(1, dt * 4);
    {
      const bl = (carState.ball || !carState.armed) && carState.airT > 0.12,
        sr = bl ? 3.8 : 1.25;
      carState.yaw += carState.steer * sr * dt;
      if (bl) carState.spinA = (carState.spinA || 0) + carState.steer * sr * dt;
    }
    carState.vyaw = carState.yaw;
    carState.dr = carState.drift = carState.slip = 0;
    driftScore(dt);
    if (ready && I.boost && !locked) {
      thrusting = 2;
      const bk = 1 + 0.12 * upgradeLevel("thrust");
      carState.vx += fw[0] * BOOST_A * bk * dt;
      carState.vz += fw[1] * BOOST_A * bk * dt;
      carState.vy += carState.ball ? -9.81 * dt : ((agl > 120 ? 9.81 : 12.3) - 9.81) * dt;
      if (I.hover && agl < 120) carState.vy += clamp((6 - carState.vy) * 2.5, 0, 8) * dt;
      carState.tank -= 8.33 * dt;
      carState.heat += 12 * (1 - 0.18 * upgradeLevel("cool")) * dt;
    } else if (ready && carState.ball && !locked && (I.hover || I.brk)) carState.ball = false;
    if (thrusting === 2) {
    } else if (ready && !carState.ball) {
      thrusting = 1;
      carState.hovUsed = true;
      const ge = agl < 3 ? 0.8 : 1;
      let tv =
        I.hover && !locked
          ? 6 * (1 + 0.1 * upgradeLevel("thrust"))
          : I.brk && !locked
            ? agl > 8
              ? -6
              : -3
            : agl > 8
              ? -3
              : -1.5;
      if (I.hover && agl >= 110) tv = Math.min(0, 110 - agl);
      carState.vy += clamp((tv - carState.vy) * 2.8, -7, 8) * dt;
      if (I.thr && !locked) {
        carState.vx += fw[0] * 7 * dt;
        carState.vz += fw[1] * 7 * dt;
      }
      carState.tank -= HOVER_DRAIN * ge * activeVehicle.drain * (1 - 0.15 * upgradeLevel("tank")) * dt;
      carState.heat += 1.5 * (1 - 0.18 * upgradeLevel("cool")) * dt;
    } else if (carState.armed && !carState.ball && !locked && (carState.tank <= 0 || carState.thermal)) {
      carState.vy += clamp((-3 - carState.vy) * 2.2, -9.81, 12) * dt;
      carState.reserve = true;
    } else carState.vy -= 9.81 * dt;
    if (ready && !locked && thrusting) airVec(dt, thrusting, I);
    {
      const cap = BOOST_CAP,
        hh = Math.hypot(carState.vx, carState.vz);
      if (hh > cap && thrusting === 2) {
        const f = Math.max(cap / hh, Math.exp(-1.6 * dt));
        carState.vx *= f;
        carState.vz *= f;
      }
    }
    const h2 = Math.hypot(carState.vx, carState.vz),
      k = Math.exp(-(0.08 + h2 * 0.0022 + (I.brk && ready ? 0.5 : 0)) * dt);
    carState.vx *= k;
    carState.vz *= k;
    carState.x += carState.vx * dt;
    carState.z += carState.vz * dt;
    carState.y += carState.vy * dt;
    bldCollide(dt);
    trafficCollide(dt);
    const g2 = groundH(carState.x, carState.z, carState.y).h;
    if (carState.y <= g2) {
      const imp = -carState.vy;
      carState.y = g2;
      carState.air = false;
      carState.vy = 0;
      const pd = padAt(carState.x, carState.z, carState.y);
      const lim = carState.jumpR ? 26 : carState.armed && !carState.ball ? LIMIT : 15;
      if (imp >= lim) {
        carState.crash = 1.2;
        carState.v = 0;
        shake = 1;
        hitStop = 0.14;
        audio.crash();
        flash(
          "HARD LANDING",
          `${imp.toFixed(1)} m/s · limit ${lim} m/s · suspension failed`,
          2,
        );
        for (let k2 = 0; k2 < 50; k2++) {
          const r = Math.random;
          sparks.emit(
            carState.x + (r() - 0.5) * 2,
            carState.y + 0.3,
            carState.z + (r() - 0.5) * 4,
            (r() - 0.5) * 9,
            1 + r() * 5,
            (r() - 0.5) * 9,
            0.6,
            0.2,
            0,
          );
          dust.emit(
            carState.x + (r() - 0.5) * 3,
            carState.y + 0.2,
            carState.z + (r() - 0.5) * 4,
            (r() - 0.5) * 7,
            0.5 + r(),
            (r() - 0.5) * 7,
            1.4,
            1.5,
            3,
          );
        }
        failCrash(imp, lim);
      } else {
        landSpin(fw);
        audio.boom();
        if (carState.armed || pd)
          flash(
            pd ? `LANDED ON ${pd.name}` : "CLEAN LANDING",
            `${imp.toFixed(2)} m/s`,
            1.6,
          );
        ev = {
          land: imp,
          pad: pd,
          ramp: carState.jumpR,
          air: carState.airT || 0,
          clean: !carState.hovUsed,
        };
        if (
          carState.jumpR &&
          carState.hovUsed &&
          currentMission &&
          !currentMission.done &&
          ["ramps", "truck", "bigair", "stuntshow"].includes(currentMission.def.id)
        )
          flash(
            "HOVERED · NOT COUNTED",
            "ramp jumps count on wheels and boost only",
            1.8,
          );
        landFx(imp, fw);
        if ((carState.jumpR || !carState.armed) && carState.airT > 0.7)
          pop(
            carState.airT > 2 ? "BIG AIR" : "AIRTIME",
            Math.round(carState.airT * 300 + (carState.airT > 2 ? 250 : 0)),
          );
      }
      carState.jumpR = null;
      carState.ball = false;
    }
  }
  if (thrusting === 2 && !bPrev) {
    boostKick = 1;
    shake = Math.max(shake, 0.32);
    if (carState.air) {
      carState.vx += fw[0] * 3;
      carState.vz += fw[1] * 3;
    } else carState.v += 3;
  }
  bPrev = thrusting === 2;
  if (carState.air && thrusting === 2 && !carState.boostPrev) maybeShow("boost");
  carState.boostPrev = carState.air && thrusting === 2;
  carState.tank = clamp(carState.tank, 0, 100);
  if (thrusting === 0) carState.heat = Math.max(25, carState.heat - 6 * dt);
  if (carState.heat >= 100 && !carState.thermal) {
    carState.thermal = true;
    carState.heat = 100;
    flash(
      "THERMAL CUTOFF",
      "thrusters locked until 60°C · reserve descent at 3 m/s",
      2,
    );
    audio.fail();
  }
  if (carState.thermal && carState.heat <= 60) carState.thermal = false;
  if (carState.tank <= 0 && carState.air && carState.armed && !carState.emptyWarned) {
    carState.emptyWarned = true;
    flash(
      "AIR RESERVE",
      "tank empty · the thrusters set you down at 3 m/s",
      1.8,
    );
  }
  if (carState.tank > 5) carState.emptyWarned = false;
  const pd = !carState.air ? padAt(carState.x, carState.z, carState.y) : null;
  servicing = !!(pd && carState.v < 3 && !MISSION_REBUILD.noServ);
  if (servicing) {
    carState.tank = Math.min(100, carState.tank + 25 * dt);
    carState.heat = Math.max(25, carState.heat - 12 * dt);
  }
  if (!carState.air && !carState.armed && !pd && !MISSION_REBUILD.noRegen)
    carState.tank = Math.min(100, carState.tank + 1.5 * dt);
  carState.thrust = thrusting;
  carState.state =
    carState.crash > 0
      ? "CRASH"
      : carState.air
        ? carState.thermal
          ? "THERMAL"
          : thrusting === 2
            ? "BOOST"
            : thrusting === 1
              ? "HOVER"
              : "RECOVERY"
        : thrusting === 2
          ? "BOOST"
          : carState.armed
            ? carState.spool < 1.2
              ? "ARMING"
              : "ARMED"
            : carState.v < -0.3
              ? "REVERSE"
              : "GROUND";
  const slope =
    !carState.air && carState.rampOn
      ? Math.atan(carState.rampOn.H / carState.rampOn.L) *
        (fw[0] * carState.rampOn.fx + fw[1] * carState.rampOn.fz)
      : 0;
  const ballistic = carState.air && (carState.ball || !carState.armed);
  const pT = ballistic
    ? clamp(Math.atan2(carState.vy, Math.max(hs, 8)) * 0.62, -0.55, 0.42)
    : (carState.air
        ? clamp(-carState.vy * 0.01, -0.06, 0.06)
        : clamp((carState.glz || 0) * 0.026, -0.05, 0.04)) + slope;
  const w0 = ballistic ? 6 : slope ? 16 : 11;
  carState.pitchV =
    (carState.pitchV || 0) +
    (w0 * w0 * (pT - carState.pitch) - 2 * 0.42 * w0 * (carState.pitchV || 0)) * dt;
  carState.pitch += carState.pitchV * dt;
  {
    const rT = carState.air
        ? thrusting && !carState.ball
          ? clamp(
              -(carState.vx * Math.cos(carState.yaw) - carState.vz * Math.sin(carState.yaw)) * 0.02,
              -0.068,
              0.068,
            )
          : 0
        : clamp((carState.glx || 0) * 0.032, -0.065, 0.065),
      wr = carState.air ? 5 : 12;
    carState.rollV =
      (carState.rollV || 0) +
      (wr * wr * (rT - carState.roll) - 2 * 0.45 * wr * (carState.rollV || 0)) * dt;
    carState.roll += carState.rollV * dt;
  }
  // effects
  const fwv = fw,
    rt = [Math.cos(carState.yaw), -Math.sin(carState.yaw)],
    r = Math.random;
  if (thrusting === 2) {
    for (let k = 0; k < 4; k++) {
      const n = BAY_PORTS[k],
        bx = carState.x - fwv[0] * 2.42 + rt[0] * n[0],
        bz = carState.z - fwv[1] * 2.42 + rt[1] * n[0],
        by = carState.y + n[1];
      flame.emit(
        bx,
        by,
        bz,
        -fwv[0] * 26 + (r() - 0.5),
        r() - 0.5,
        -fwv[1] * 26 + (r() - 0.5),
        0.12,
        0.16,
        0.9,
      );
      if (k < 2)
        gas.emit(
          bx - fwv[0] * 0.6,
          by,
          bz - fwv[1] * 0.6,
          -fwv[0] * (20 + r() * 8) + (r() - 0.5) * 2,
          (r() - 0.3) * 1.5,
          -fwv[1] * (20 + r() * 8) + (r() - 0.5) * 2,
          0.5,
          0.22,
          3.4,
        );
    }
  }
  if (thrusting === 1)
    for (let k = 0; k < 2; k++) {
      const c = [
        [-0.7, -1.25],
        [0.7, -1.25],
        [-0.7, 1.2],
        [0.7, 1.2],
      ][(Math.random() * 4) | 0];
      const wx = carState.x + rt[0] * c[0] - fwv[0] * c[1],
        wz = carState.z + rt[1] * c[0] - fwv[1] * c[1];
      gas.emit(
        wx,
        carState.y + 0.1,
        wz,
        (r() - 0.5) * 1.5,
        -9 - r() * 5,
        (r() - 0.5) * 1.5,
        0.3,
        0.18,
        2.2,
      );
    }
  if (thrusting === 1 && agl < 5)
    for (let k = 0; k < 2; k++) {
      const an = r() * 6.283,
        rr = 1.5 + r();
      dust.emit(
        carState.x + Math.cos(an) * rr,
        gh + 0.15,
        carState.z + Math.sin(an) * rr,
        Math.cos(an) * (6 + r() * 4),
        0.3 + r(),
        Math.sin(an) * (6 + r() * 4),
        1.1,
        1,
        2.5,
      );
    }
  if (
    !carState.air &&
    ((!onRoad && !pd && carState.v > 6) || (carState.drift > 0.15 && carState.v > 10)) &&
    r() < 0.35
  ) {
    (onRoad ? smoke : dust).emit(
      carState.x - fwv[0] * 1.6 + (r() - 0.5) * 1.8,
      carState.y + 0.15,
      carState.z - fwv[1] * 1.6 + (r() - 0.5) * 1.8,
      -fwv[0] * carState.v * 0.2 + (r() - 0.5) * 2,
      0.4 + r(),
      -fwv[1] * carState.v * 0.2 + (r() - 0.5) * 2,
      1.1,
      0.8,
      2,
    );
  }
  if (!carState.air && carState.dr > 0.3 && carState.v > 10)
    for (const sd of [-0.8, 0.8]) {
      const r2 = Math.random;
      smoke.emit(
        carState.x - fw[0] * 1.4 + Math.cos(carState.yaw) * sd,
        carState.y + 0.2,
        carState.z - fw[1] * 1.4 - Math.sin(carState.yaw) * sd,
        (r2() - 0.5) * 2,
        0.5 + r2(),
        (r2() - 0.5) * 2,
        1.4,
        0.7,
        2.6,
      );
    }
  if (!carState.air && carState.v > 8 && (carState.dr > 0.35 || (I.brk && !locked && carState.v > 14))) {
    carState.skidD = (carState.skidD || 0) + carState.v * dt;
    if (carState.skidD > 0.85) {
      carState.skidD = 0;
      for (const sd of [-0.93, 0.93])
        skidMark(
          carState.x - fw[0] * 1.38 + Math.cos(carState.yaw) * sd,
          carState.y + 0.03,
          carState.z - fw[1] * 1.38 - Math.sin(carState.yaw) * sd,
          carState.vyaw,
        );
    }
  }
  audio.update(
    hs,
    I.thr && !locked,
    thrusting,
    onRoad,
    carState.air,
    scrape > 0 || (carState.dr > 0.35 && !carState.air && carState.v > 10),
    carState.armed && carState.spool < 1.2,
  );
  scrape = Math.max(0, scrape - dt);
  return { df, mu, geff, ev };
}
