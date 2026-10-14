// index-inline-1 27 — math
// Lines 86655-87292 of readable/index-inline-1.pretty.js (statement-aligned).
function step(dt) {
  const I = inp(),
    locked =
      phase !== "play" ||
      (cin.on && cin.full && cin.kind === "arm") ||
      (M && M.def.race && M.rs === "grid");
  let ev = null;
  if (S.loop) return loopStep(dt, I, locked);
  if (S.crash > 0) {
    S.crash -= dt;
    if (M && !M.done && !M.def.race) M.t0 += dt;
    body.position.y = lerp(body.position.y, -0.16, Math.min(1, dt * 10));
    if (S.crash <= 0) {
      body.position.y = 0;
      if (!(M && M.done)) respawn();
    }
    audio.update(0, false, 0, true, false, false, false);
    return { df: 0, mu: 1.45, geff: 9.81, ev };
  }
  if (armPress && !locked && !veh.fly) {
    flash(
      "ROCKET MODE",
      "Roadster only · SPACE / HOVER fires the hop jets",
      1.6,
    );
    armPress = false;
  }
  S.hopCd = Math.max(0, (S.hopCd || 0) - dt);
  if (armPress && !locked) {
    S.armed = !S.armed;
    S.spool = 0;
    S.spoolQ = null;
    S.qPH = I.hover;
    S.qPB = I.boost;
    audio.click(S.armed);
    S.suspV = (S.suspV || 0) - 0.45;
    S.pitchV = (S.pitchV || 0) + (S.armed ? 0.55 : -0.3);
    shake = Math.max(shake, 0.08);
    if (S.armed) startArmCin();
    if (!S.armed && S.air) flash("THRUSTERS OFF", "free fall", 1.2);
  }
  armPress = false;
  if (S.armed) S.spool = Math.min(1.2, S.spool + dt);
  {
    const sp = S.armed && S.spool < 1.2 && !locked,
      eh = I.hover && !S.qPH,
      eb = I.boost && !S.qPB;
    S.qPH = I.hover;
    S.qPB = I.boost;
    if (sp && (eh || eb)) S.spoolQ = S.spoolQ ? null : eh ? "h" : "b";
    if (!S.armed) S.spoolQ = null;
  }
  const ready = S.armed && S.spool >= 1.2 && !S.thermal && S.tank > 0;
  if (ready && S.spoolQ) {
    if (S.spoolQ === "h") S.qH = 0.6;
    else S.qB = 0.5;
    S.spoolQ = null;
  }
  if (S.qH > 0) {
    S.qH -= dt;
    I.hover = true;
  }
  if (S.qB > 0) {
    S.qB -= dt;
    I.boost = true;
  }
  const G = groundH(S.x, S.z, S.y),
    gh = G.h,
    q = G.q,
    onRoad = true,
    agl = S.y - gh;
  S.bump = Math.max(0, (S.bump || 0) - dt);
  const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)];
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
    if (S.air) {
      tDp = 1;
      tAng = 22;
      label = "AUTO · STABILIZE";
    } else if (S.v < 19) {
      label = "AUTO · STOWED";
    } else if (I.brk || Math.abs(S.steer) > 0.3) {
      tDp = 1;
      tAng = 24;
      label = "AUTO · HIGH DOWNFORCE";
    } else if (I.thr && S.v > 38) {
      tDp = 1;
      tAng = 1;
      label = "AUTO · DRS";
    } else {
      tDp = 1;
      tAng = 11;
      label = "AUTO · TRACK";
    }
  }
  S.dp += clamp(tDp - S.dp, -dt / 1.2, dt / 1.2);
  S.ang += clamp(tAng - S.ang, -dt * 60, dt * 60);
  S.wingMode = label;
  const hs = S.air ? Math.hypot(S.vx, S.vz) : Math.abs(S.v);
  const df = 0.95 * hs * hs * (S.dp * lerp(0.25, 1, S.ang / 24) + 0.06);
  const mu =
    (onRoad || padAt(S.x, S.z, S.y) ? 1.45 : 0.72) *
    veh.grip *
    (1 + 0.07 * U("grip"));
  const geff = 9.81 + (S.air ? 0 : df / MASS);
  const trac = mu * geff;
  let thrusting = 0;
  const px = S.x,
    pz = S.z;
  if (!S.air) {
    // reverse: REV button / X, or hold brake once stopped (like most driving games)
    const wantRev = !locked && (I.rev || (I.brk && !I.thr && S.v <= 0.3));
    const hand = !locked && I.brk && Math.abs(S.steer) > 0.35 && S.v > 12; // brake + steer at speed = handbrake kick
    if (S.v >= 0 && !(wantRev && S.v <= 0.3)) {
      let a = 0;
      if (!locked && I.thr)
        a += Math.min(
          trac,
          (POWER * veh.pmul * (1 + 0.1 * U("power"))) / Math.max(S.v, 1) / MASS,
        );
      if (!locked && ready && I.boost) {
        a += BOOST_G * (1 + 0.12 * U("thrust")) * clamp((100 - S.v) / 25);
        S.tank -= 8.33 * dt;
        S.heat += 12 * (1 - 0.18 * U("cool")) * dt;
        thrusting = 2;
      }
      const drag =
        (0.5 * RHO * (CDA + S.dp * S.ang * 0.012) * S.v * S.v) / MASS +
        (onRoad ? 0.15 : 1.4);
      if (!I.thr && !I.brk && !I.rev && S.v > 0.5) a -= 1.96;
      if (!locked && (I.brk || I.rev))
        a -= hand
          ? trac * 0.22
          : trac * 0.96 + S.dp * S.ang * 0.0008 * S.v * S.v;
      S.v = Math.max(0, S.v + (a - drag) * dt);
      if (S.v < 0.05 && !I.thr) S.v = 0;
    } else {
      if (wantRev) S.v = Math.max(-8, S.v - 5 * (1 + S.v / 14) * dt);
      else S.v = Math.min(0, S.v + (I.thr ? 9 : 3) * dt);
    }
    const sIn = locked
      ? 0
      : clamp((I.left ? 1 : 0) - (I.right ? 1 : 0) + (T.steer || 0), -1, 1);
    S.steer += (sIn - S.steer) * Math.min(1, dt * (sIn ? 5 : 6));
    // arcade handling: yaw rate from the wheel, capped by speed. Asking for more lateral grip than the tyres have lets the rear step out (drift).
    const av = Math.abs(S.v),
      cap = Math.min(av * 0.2, 1.3 * lerp(1, 0.7, clamp((av - 15) / 45)));
    let yr = S.steer * cap * Math.sign(S.v) * (S.v < 0 ? 0.7 : 1);
    let want = 0;
    if (S.v > 11) {
      want = clamp((Math.abs(yr * S.v) - trac * 0.9) / (trac * 0.7));
      if (hand) want = Math.max(want, 0.9);
    }
    S.dr += (want - S.dr) * Math.min(1, dt * (want > S.dr ? 3.5 : 1.8));
    if (S.v <= 0) S.dr = 0;
    yr *= 1 + S.dr * 0.4;
    S.yaw += yr * dt;
    if (S.v <= 0) S.vyaw = S.yaw;
    else S.vyaw += angD(S.yaw, S.vyaw) * Math.min(1, lerp(9, 1.5, S.dr) * dt);
    S.slip = angD(S.yaw, S.vyaw);
    S.drift = S.dr;
    if (S.v > 0)
      S.v *= 1 - Math.min(0.4, Math.abs(Math.sin(S.slip)) * 0.28 * dt);
    const vd = [-Math.sin(S.vyaw), -Math.cos(S.vyaw)];
    S.x += vd[0] * S.v * dt;
    S.z += vd[1] * S.v * dt;
    bldCollide(dt);
    trafficCollide(dt);
    driftScore(dt);
    if (!locked && S.v > 6 && !S.loop)
      for (const L of LOOPS) {
        const dx = S.x - L.x,
          dz = S.z - L.z,
          d = dx * L.fx + dz * L.fz,
          lat = dx * L.rx + dz * L.rz;
        if (
          d > -0.6 &&
          d < 2 &&
          Math.abs(lat) < L.W / 2 &&
          -Math.sin(S.yaw) * L.fx + -Math.cos(S.yaw) * L.fz > 0.8
        ) {
          S.loop = { L, th: 0, lat0: lat };
          S.yaw = S.vyaw = L.yaw;
          S.dr = S.slip = 0;
          audio.whoosh();
          break;
        }
      }
    const G2 = groundH(S.x, S.z, S.y + 0.6),
      g2 = G2.h;
    if (g2 < S.y - 0.6) {
      S.air = true;
      S.vx = vd[0] * S.v;
      S.vz = vd[1] * S.v;
      S.vy = Math.max(0, S.gvy || 0);
      S.airT = 0;
      S.spinA = 0;
      S.jumpR = S.rampOn;
      S.rampOn = null;
      S.gvy = 0;
      S.ball = !!S.jumpR;
      S.hovUsed = false;
      if (S.jumpR && S.vy > 5.2) maybeShow("jump");
    } else {
      S.y = g2;
      const rp = G2.ramp;
      S.rampOn = rp || null;
      S.gvy = rp ? S.v * (rp.H / rp.L) * (vd[0] * rp.fx + vd[1] * rp.fz) : 0;
    }
    if (!locked && ready && I.hover) {
      S.air = true;
      S.airT = 0;
      S.jumpR = null;
      S.ball = false;
      S.rampOn = null;
      S.vx = vd[0] * S.v;
      S.vz = vd[1] * S.v;
      S.vy = 0.6;
      S.y += 0.05;
      audio.noise(300, 2500, 0.5, 0.3, "bandpass");
      maybeShow("hover");
    }
    if (!locked && !veh.fly && I.hover && S.hopCd <= 0) {
      S.air = true;
      S.vx = vd[0] * S.v;
      S.vz = vd[1] * S.v;
      S.vy = veh.hop;
      S.y += 0.05;
      S.hopCd = 2.2;
      audio.ignite();
      for (let q = 0; q < 24; q++) {
        const r2 = Math.random,
          an = r2() * 6.283;
        dust.emit(
          S.x + Math.cos(an) * 1.5,
          S.y + 0.2,
          S.z + Math.sin(an) * 1.5,
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
    S.airT = (S.airT || 0) + dt;
    const sIn = locked
      ? 0
      : clamp((I.left ? 1 : 0) - (I.right ? 1 : 0) + (T.steer || 0), -1, 1);
    S.steer += (sIn - S.steer) * Math.min(1, dt * 4);
    {
      const bl = (S.ball || !S.armed) && S.airT > 0.12,
        sr = bl ? 3.8 : 1.25;
      S.yaw += S.steer * sr * dt;
      if (bl) S.spinA = (S.spinA || 0) + S.steer * sr * dt;
    }
    S.vyaw = S.yaw;
    S.dr = S.drift = S.slip = 0;
    driftScore(dt);
    if (ready && I.boost && !locked) {
      thrusting = 2;
      const bk = 1 + 0.12 * U("thrust");
      S.vx += fw[0] * BOOST_A * bk * dt;
      S.vz += fw[1] * BOOST_A * bk * dt;
      S.vy += S.ball ? -9.81 * dt : ((agl > 120 ? 9.81 : 12.3) - 9.81) * dt;
      if (I.hover && agl < 120) S.vy += clamp((6 - S.vy) * 2.5, 0, 8) * dt;
      S.tank -= 8.33 * dt;
      S.heat += 12 * (1 - 0.18 * U("cool")) * dt;
    } else if (ready && S.ball && !locked && (I.hover || I.brk)) S.ball = false;
    if (thrusting === 2) {
    } else if (ready && !S.ball) {
      thrusting = 1;
      S.hovUsed = true;
      const ge = agl < 3 ? 0.8 : 1;
      let tv =
        I.hover && !locked
          ? 6 * (1 + 0.1 * U("thrust"))
          : I.brk && !locked
            ? agl > 8
              ? -6
              : -3
            : agl > 8
              ? -3
              : -1.5;
      if (I.hover && agl >= 110) tv = Math.min(0, 110 - agl);
      S.vy += clamp((tv - S.vy) * 2.8, -7, 8) * dt;
      if (I.thr && !locked) {
        S.vx += fw[0] * 7 * dt;
        S.vz += fw[1] * 7 * dt;
      }
      S.tank -= HOVER_DRAIN * ge * veh.drain * (1 - 0.15 * U("tank")) * dt;
      S.heat += 1.5 * (1 - 0.18 * U("cool")) * dt;
    } else if (S.armed && !S.ball && !locked && (S.tank <= 0 || S.thermal)) {
      S.vy += clamp((-3 - S.vy) * 2.2, -9.81, 12) * dt;
      S.reserve = true;
    } else S.vy -= 9.81 * dt;
    if (ready && !locked && thrusting) airVec(dt, thrusting, I);
    {
      const cap = BOOST_CAP,
        hh = Math.hypot(S.vx, S.vz);
      if (hh > cap && thrusting === 2) {
        const f = Math.max(cap / hh, Math.exp(-1.6 * dt));
        S.vx *= f;
        S.vz *= f;
      }
    }
    const h2 = Math.hypot(S.vx, S.vz),
      k = Math.exp(-(0.08 + h2 * 0.0022 + (I.brk && ready ? 0.5 : 0)) * dt);
    S.vx *= k;
    S.vz *= k;
    S.x += S.vx * dt;
    S.z += S.vz * dt;
    S.y += S.vy * dt;
    bldCollide(dt);
    trafficCollide(dt);
    const g2 = groundH(S.x, S.z, S.y).h;
    if (S.y <= g2) {
      const imp = -S.vy;
      S.y = g2;
      S.air = false;
      S.vy = 0;
      const pd = padAt(S.x, S.z, S.y);
      const lim = S.jumpR ? 26 : S.armed && !S.ball ? LIMIT : 15;
      if (imp >= lim) {
        S.crash = 1.2;
        S.v = 0;
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
            S.x + (r() - 0.5) * 2,
            S.y + 0.3,
            S.z + (r() - 0.5) * 4,
            (r() - 0.5) * 9,
            1 + r() * 5,
            (r() - 0.5) * 9,
            0.6,
            0.2,
            0,
          );
          dust.emit(
            S.x + (r() - 0.5) * 3,
            S.y + 0.2,
            S.z + (r() - 0.5) * 4,
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
        if (S.armed || pd)
          flash(
            pd ? `LANDED ON ${pd.name}` : "CLEAN LANDING",
            `${imp.toFixed(2)} m/s`,
            1.6,
          );
        ev = {
          land: imp,
          pad: pd,
          ramp: S.jumpR,
          air: S.airT || 0,
          clean: !S.hovUsed,
        };
        if (
          S.jumpR &&
          S.hovUsed &&
          M &&
          !M.done &&
          ["ramps", "truck", "bigair", "stuntshow"].includes(M.def.id)
        )
          flash(
            "HOVERED · NOT COUNTED",
            "ramp jumps count on wheels and boost only",
            1.8,
          );
        landFx(imp, fw);
        if ((S.jumpR || !S.armed) && S.airT > 0.7)
          pop(
            S.airT > 2 ? "BIG AIR" : "AIRTIME",
            Math.round(S.airT * 300 + (S.airT > 2 ? 250 : 0)),
          );
      }
      S.jumpR = null;
      S.ball = false;
    }
  }
  if (thrusting === 2 && !bPrev) {
    boostKick = 1;
    shake = Math.max(shake, 0.32);
    if (S.air) {
      S.vx += fw[0] * 3;
      S.vz += fw[1] * 3;
    } else S.v += 3;
  }
  bPrev = thrusting === 2;
  if (S.air && thrusting === 2 && !S.boostPrev) maybeShow("boost");
  S.boostPrev = S.air && thrusting === 2;
  S.tank = clamp(S.tank, 0, 100);
  if (thrusting === 0) S.heat = Math.max(25, S.heat - 6 * dt);
  if (S.heat >= 100 && !S.thermal) {
    S.thermal = true;
    S.heat = 100;
    flash(
      "THERMAL CUTOFF",
      "thrusters locked until 60°C · reserve descent at 3 m/s",
      2,
    );
    audio.fail();
  }
  if (S.thermal && S.heat <= 60) S.thermal = false;
  if (S.tank <= 0 && S.air && S.armed && !S.emptyWarned) {
    S.emptyWarned = true;
    flash(
      "AIR RESERVE",
      "tank empty · the thrusters set you down at 3 m/s",
      1.8,
    );
  }
  if (S.tank > 5) S.emptyWarned = false;
  const pd = !S.air ? padAt(S.x, S.z, S.y) : null;
  servicing = !!(pd && S.v < 3 && !V26.noServ);
  if (servicing) {
    S.tank = Math.min(100, S.tank + 25 * dt);
    S.heat = Math.max(25, S.heat - 12 * dt);
  }
  if (!S.air && !S.armed && !pd && !V26.noRegen)
    S.tank = Math.min(100, S.tank + 1.5 * dt);
  S.thrust = thrusting;
  S.state =
    S.crash > 0
      ? "CRASH"
      : S.air
        ? S.thermal
          ? "THERMAL"
          : thrusting === 2
            ? "BOOST"
            : thrusting === 1
              ? "HOVER"
              : "RECOVERY"
        : thrusting === 2
          ? "BOOST"
          : S.armed
            ? S.spool < 1.2
              ? "ARMING"
              : "ARMED"
            : S.v < -0.3
              ? "REVERSE"
              : "GROUND";
  const slope =
    !S.air && S.rampOn
      ? Math.atan(S.rampOn.H / S.rampOn.L) *
        (fw[0] * S.rampOn.fx + fw[1] * S.rampOn.fz)
      : 0;
  const ballistic = S.air && (S.ball || !S.armed);
  const pT = ballistic
    ? clamp(Math.atan2(S.vy, Math.max(hs, 8)) * 0.62, -0.55, 0.42)
    : (S.air
        ? clamp(-S.vy * 0.01, -0.06, 0.06)
        : clamp((S.glz || 0) * 0.026, -0.05, 0.04)) + slope;
  const w0 = ballistic ? 6 : slope ? 16 : 11;
  S.pitchV =
    (S.pitchV || 0) +
    (w0 * w0 * (pT - S.pitch) - 2 * 0.42 * w0 * (S.pitchV || 0)) * dt;
  S.pitch += S.pitchV * dt;
  {
    const rT = S.air
        ? thrusting && !S.ball
          ? clamp(
              -(S.vx * Math.cos(S.yaw) - S.vz * Math.sin(S.yaw)) * 0.02,
              -0.068,
              0.068,
            )
          : 0
        : clamp((S.glx || 0) * 0.032, -0.065, 0.065),
      wr = S.air ? 5 : 12;
    S.rollV =
      (S.rollV || 0) +
      (wr * wr * (rT - S.roll) - 2 * 0.45 * wr * (S.rollV || 0)) * dt;
    S.roll += S.rollV * dt;
  }
  // effects
  const fwv = fw,
    rt = [Math.cos(S.yaw), -Math.sin(S.yaw)],
    r = Math.random;
  if (thrusting === 2) {
    for (let k = 0; k < 4; k++) {
      const n = BAYP[k],
        bx = S.x - fwv[0] * 2.42 + rt[0] * n[0],
        bz = S.z - fwv[1] * 2.42 + rt[1] * n[0],
        by = S.y + n[1];
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
      const wx = S.x + rt[0] * c[0] - fwv[0] * c[1],
        wz = S.z + rt[1] * c[0] - fwv[1] * c[1];
      gas.emit(
        wx,
        S.y + 0.1,
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
        S.x + Math.cos(an) * rr,
        gh + 0.15,
        S.z + Math.sin(an) * rr,
        Math.cos(an) * (6 + r() * 4),
        0.3 + r(),
        Math.sin(an) * (6 + r() * 4),
        1.1,
        1,
        2.5,
      );
    }
  if (
    !S.air &&
    ((!onRoad && !pd && S.v > 6) || (S.drift > 0.15 && S.v > 10)) &&
    r() < 0.35
  ) {
    (onRoad ? smoke : dust).emit(
      S.x - fwv[0] * 1.6 + (r() - 0.5) * 1.8,
      S.y + 0.15,
      S.z - fwv[1] * 1.6 + (r() - 0.5) * 1.8,
      -fwv[0] * S.v * 0.2 + (r() - 0.5) * 2,
      0.4 + r(),
      -fwv[1] * S.v * 0.2 + (r() - 0.5) * 2,
      1.1,
      0.8,
      2,
    );
  }
  if (!S.air && S.dr > 0.3 && S.v > 10)
    for (const sd of [-0.8, 0.8]) {
      const r2 = Math.random;
      smoke.emit(
        S.x - fw[0] * 1.4 + Math.cos(S.yaw) * sd,
        S.y + 0.2,
        S.z - fw[1] * 1.4 - Math.sin(S.yaw) * sd,
        (r2() - 0.5) * 2,
        0.5 + r2(),
        (r2() - 0.5) * 2,
        1.4,
        0.7,
        2.6,
      );
    }
  if (!S.air && S.v > 8 && (S.dr > 0.35 || (I.brk && !locked && S.v > 14))) {
    S.skidD = (S.skidD || 0) + S.v * dt;
    if (S.skidD > 0.85) {
      S.skidD = 0;
      for (const sd of [-0.93, 0.93])
        skidMark(
          S.x - fw[0] * 1.38 + Math.cos(S.yaw) * sd,
          S.y + 0.03,
          S.z - fw[1] * 1.38 - Math.sin(S.yaw) * sd,
          S.vyaw,
        );
    }
  }
  audio.update(
    hs,
    I.thr && !locked,
    thrusting,
    onRoad,
    S.air,
    scrape > 0 || (S.dr > 0.35 && !S.air && S.v > 10),
    S.armed && S.spool < 1.2,
  );
  scrape = Math.max(0, scrape - dt);
  return { df, mu, geff, ev };
}
