// index-inline-1 26 — carstate
// Lines 86307-86654 of readable/index-inline-1.pretty.js (statement-aligned).
function skidMark(x, y, z, yaw, len = 0.9) {
  scratchQuatSkid.setFromEuler(scratchEulerSkid.set(-Math.PI / 2, yaw, 0, "YXZ"));
  scratchMatrixSkid.compose(scratchVecSkidA.set(x, y, z), scratchQuatSkid, scratchVecSkidB.set(1, len, 1));
  SKID_MARKS.m.setMatrixAt(SKID_MARKS.i, scratchMatrixSkid);
  SKID_MARKS.i = (SKID_MARKS.i + 1) % SKID_MARKS.n;
  SKID_MARKS.m.count = Math.max(SKID_MARKS.m.count, SKID_MARKS.i);
  if (SKID_MARKS.m.count < SKID_MARKS.n && SKID_MARKS.i === 0) SKID_MARKS.m.count = SKID_MARKS.n;
  SKID_MARKS.m.instanceMatrix.needsUpdate = true;
}
// solid ramps: drive up the slope from the front, but the sides and the back are walls
function rampCollide(dt) {
  for (const r of RAMPS) {
    const dx = carState.x - r.x,
      dz = carState.z - r.z;
    if (dx * dx + dz * dz > r.R2 + 80) continue;
    const f = dx * r.fx + dz * r.fz,
      l = dx * r.fz - dz * r.fx,
      m = 1.05;
    if (f < -m || f > r.L + m || Math.abs(l) > r.W / 2 + m) continue;
    const surf = 0.2 + (r.H * clamp(f, 0, r.L)) / r.L;
    if (carState.y >= surf - 0.55) continue;
    const dl = r.W / 2 + m - Math.abs(l),
      db = r.L + m - f;
    let nx, nz;
    if (dl < db) {
      const sg = Math.sign(l) || 1;
      nx = r.fz * sg;
      nz = -r.fx * sg;
      carState.x += nx * dl;
      carState.z += nz * dl;
    } else {
      nx = r.fx;
      nz = r.fz;
      carState.x += nx * db;
      carState.z += nz * db;
    }
    impact(nx, nz, dt);
  }
}
// solid loop: away from the two entry lanes the ring is a wall you can't drive through
function loopCollide(dt) {
  if (carState.loop) return;
  for (const L of LOOPS) {
    if (L.twin) continue;
    const dx = carState.x - L.x,
      dz = carState.z - L.z,
      d = dx * L.fx + dz * L.fz;
    if (Math.abs(d) > L.R + 1.2) continue;
    const m = dx * L.rx + dz * L.rz;
    if (m < -L.W / 2 - 1.2 || m > L.w + L.W / 2 + 1.2) continue;
    const dd = clamp(d, -L.R, L.R),
      h1 = 0.22 + L.R - Math.sqrt(Math.max(0, L.R * L.R - dd * dd));
    if (h1 < 0.55 || carState.y >= h1 - 0.1 || h1 > carState.y + 1.45) continue;
    const th = d >= 0 ? Math.asin(dd / L.R) : Math.PI * 2 + Math.asin(dd / L.R),
      c = (L.w * th) / (Math.PI * 2);
    if (Math.abs(m - c) > L.W / 2 + 1.05) continue;
    const dLow = Math.sqrt(
        Math.max(0, L.R * L.R - (L.R - 0.33) * (L.R - 0.33)),
      ),
      q = L.R - (carState.y + 1.45 - 0.22),
      dHigh = Math.sqrt(Math.max(0, L.R * L.R - q * q)),
      sg = Math.sign(d) || 1;
    const target =
        Math.abs(d) > (dLow + dHigh) / 2 ? dHigh + 0.05 : dLow - 0.05,
      push = (target - Math.abs(d)) * sg;
    carState.x += L.fx * push;
    carState.z += L.fz * push;
    const nx = L.fx * Math.sign(push),
      nz = L.fz * Math.sign(push);
    impact(nx, nz, dt);
  }
}
// street furniture
function propCollide(dt) {
  if (carState.air || carState.y > 8) return;
  const cx = Math.floor(carState.x / CELL),
    cz = Math.floor(carState.z / CELL);
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) {
      const Lp = PROPS.get(cellKey(cx + a, cz + b));
      if (!Lp) continue;
      for (const p of Lp) {
        const dx = carState.x - p[0],
          dz = carState.z - p[1];
        if (Math.abs(dx) > 3 || Math.abs(dz) > 3 || carState.y > p[3]) continue;
        const d = Math.hypot(dx, dz),
          mm = p[2] + 1.05;
        if (d < mm && d > 1e-4) {
          const nx = dx / d,
            nz = dz / d;
          carState.x = p[0] + nx * mm;
          carState.z = p[1] + nz * mm;
          impact(nx, nz, dt);
        }
      }
    }
}
function impact(nx, nz, dt) {
  const fw = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)];
  let sp;
  if (carState.air) {
    const vn = carState.vx * nx + carState.vz * nz;
    if (vn < 0) {
      carState.vx -= vn * nx * 1.35;
      carState.vz -= vn * nz * 1.35;
    }
    sp = Math.max(0, -vn);
  } else {
    const vd = [-Math.sin(carState.vyaw), -Math.cos(carState.vyaw)],
      vn = (vd[0] * nx + vd[1] * nz) * carState.v;
    if (vn < 0) {
      const tx = vd[0] * carState.v - vn * nx,
        tz = vd[1] * carState.v - vn * nz,
        tl = Math.hypot(tx, tz);
      sp = -vn;
      carState.v = Math.sign(carState.v || 1) * tl * (sp > 2.5 ? 0.88 : 0.997);
      if (tl > 0.5) {
        let ta = Math.atan2(-tx, -tz);
        if (carState.v < 0) ta += Math.PI;
        carState.vyaw = ta;
        carState.yaw += angleDelta(ta, carState.yaw) * Math.min(1, dt * 12);
      } else carState.vyaw = carState.yaw;
    } else sp = 0;
  }
  if (sp > 6 && SCORE.drift > 0) {
    SCORE.drift = 0;
    pop("DRIFT LOST", 0, true);
  }
  if (sp > 2) {
    scrape = 0.25;
    const cx = carState.x - nx * 1,
      cz = carState.z - nz * 1;
    for (let k = 0; k < 3; k++) {
      const r = Math.random;
      sparks.emit(
        cx,
        carState.y + 0.45,
        cz,
        (r() - 0.5) * 6 + nx * 3,
        2 + r() * 3,
        (r() - 0.5) * 6 + nz * 3,
        0.35,
        0.18,
        0,
      );
    }
  }
  if (sp > 9 && carState.bump <= 0) {
    shake = Math.min(1, sp / 25);
    audio.boom();
    carState.bump = 0.4;
    if (sp > 14) comboEnd(true);
  }
}
function trafficCollide(dt) {
  if (carState.y > 2.2) return;
  const spd = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  for (const c of TRAFFIC) {
    const fx = -Math.sin(c.yaw),
      fz = -Math.cos(c.yaw);
    const dx = carState.x - c.x,
      dz = carState.z - c.z,
      lf = dx * fx + dz * fz,
      ll = dx * fz - dz * fx;
    const pf = c.T.L / 2 + 2.1,
      pl = c.T.W / 2 + 1.0;
    c.nm = Math.max(0, (c.nm || 0) - dt);
    if (
      spd > 17 &&
      c.nm <= 0 &&
      Math.abs(lf) < pf &&
      Math.abs(ll) >= pl &&
      Math.abs(ll) < pl + 1.4 &&
      phase === "play"
    ) {
      c.nm = 4;
      pop("NEAR MISS", 250);
    }
    if (Math.abs(lf) < pf && Math.abs(ll) < pl) {
      c.nm = 4;
      const ox = pf - Math.abs(lf),
        ol = pl - Math.abs(ll);
      let nx, nz;
      if (ox < ol) {
        const sg = Math.sign(lf) || 1;
        nx = fx * sg;
        nz = fz * sg;
        carState.x += nx * ox;
        carState.z += nz * ox;
      } else {
        const sg = Math.sign(ll) || 1;
        nx = fz * sg;
        nz = -fx * sg;
        carState.x += nx * ol;
        carState.z += nz * ol;
      }
      const mr =
          c.type === "hauler"
            ? 0.06
            : c.type === "pickup"
              ? 0.5
              : c.type === "cab"
                ? 0.8
                : 0.7,
        kick = spd * mr * 0.75;
      if (spd > 3 && !c.jam) {
        c.kvx = -nx * kick;
        c.kvz = -nz * kick;
        c.kspin =
          (Math.random() < 0.5 ? -1 : 1) * Math.min(3.2, spd * 0.1) * mr;
        c.kt = 1.8;
        c.ox = c.ox || 0;
        c.oz = c.oz || 0;
        c.oyaw = c.oyaw || 0;
      }
      if (!carState.air)
        carState.v *= c.type === "hauler" ? 0.45 : 1 - Math.min(0.45, mr * 0.35);
      if (spd > 6) {
        shake = Math.max(shake, Math.min(0.9, spd / 30));
        const r = Math.random;
        for (let k = 0; k < Math.min(30, spd * 1.2); k++)
          sparks.emit(
            carState.x - nx * 1.1,
            carState.y + 0.5 + r() * 0.5,
            carState.z - nz * 1.1,
            (r() - 0.5) * 8 - nx * 4,
            1 + r() * 4,
            (r() - 0.5) * 8 - nz * 4,
            0.5,
            0.17,
            0,
          );
        if (spd > 14 && c.hitT !== clock) {
          c.hitT = clock;
          audio.crash();
          hitStop = 0.07;
          comboEnd(true);
          pop("SMASH", 0, true);
          if (RACE.on) radio("RAZOR", "crash");
        } else audio.hit();
      }
      impact(nx, nz, dt);
      c.v = 0;
      c.wait = 0;
    }
  }
  if (RACE.on || CHASE.on)
    for (const r of RIVALS) {
      if (!r.g.visible) continue;
      const yaw = r.g.rotation.y,
        fx = -Math.sin(yaw),
        fz = -Math.cos(yaw),
        dx = carState.x - r.g.position.x,
        dz = carState.z - r.g.position.z,
        lf = dx * fx + dz * fz,
        ll = dx * fz - dz * fx,
        pf = 4.4,
        pl = 2;
      if (Math.abs(lf) < pf && Math.abs(ll) < pl) {
        const ox = pf - Math.abs(lf),
          ol = pl - Math.abs(ll);
        let nx, nz;
        if (ox < ol) {
          const sg = Math.sign(lf) || 1;
          nx = fx * sg;
          nz = fz * sg;
          carState.x += nx * ox;
          carState.z += nz * ox;
        } else {
          const sg = Math.sign(ll) || 1;
          nx = fz * sg;
          nz = -fx * sg;
          carState.x += nx * ol;
          carState.z += nz * ol;
        }
        impact(nx, nz, dt);
        r.sp *= 0.9;
      }
    }
  for (const w of WALKERS) {
    const dx = carState.x - w.x,
      dz = carState.z - w.z,
      d = Math.hypot(dx, dz);
    if (d < 1.35 && d > 1e-3) {
      const nx = dx / d,
        nz = dz / d;
      carState.x += nx * (1.35 - d);
      carState.z += nz * (1.35 - d);
      impact(nx, nz, dt);
      if (w.hit <= 0) {
        w.hit = 1;
        if (spd > 4) pop("BUMPED A CREWBOT", 0, true);
      }
    }
  }
}
function loopStep(dt, I, locked) {
  const Lp = carState.loop,
    L = Lp.L,
    g = 9.81;
  let a = -g * Math.sin(Lp.th);
  if (!locked && I.thr)
    a += Math.min(
      8,
      (POWER * activeVehicle.pmul * (1 + 0.1 * upgradeLevel("power"))) / Math.max(carState.v, 1) / MASS,
    );
  if (!locked && I.brk) a -= 6;
  a -= 0.0005 * carState.v * carState.v;
  carState.v = Math.max(0, carState.v + a * dt);
  Lp.th += (carState.v / L.R) * dt;
  const th = Lp.th,
    lat = Lp.lat0 + L.w * Math.min(1, th / (Math.PI * 2));
  if (th >= Math.PI * 2) {
    carState.loop = null;
    carState.x = L.x + L.rx * (Lp.lat0 + L.w);
    carState.z = L.z + L.rz * (Lp.lat0 + L.w);
    carState.y = groundH(carState.x, carState.z, 1).h;
    carState.yaw = carState.vyaw = L.yaw;
    audio.boom();
    shake = 0.35;
    pop("LOOP THE LOOP", 1500);
    flash("360°", "all the way round", 1.4);
    return { df: 0, mu: 1.45, geff: 9.81, ev: { loop: true } };
  }
  if (th > 0.5 && ((carState.v * carState.v) / L.R < -g * Math.cos(th) + 0.4 || carState.v < 1)) {
    carState.loop = null;
    const T = [L.fx * Math.cos(th), Math.sin(th), L.fz * Math.cos(th)];
    carState.air = true;
    carState.vx = T[0] * carState.v;
    carState.vz = T[2] * carState.v;
    carState.vy = T[1] * carState.v;
    carState.airT = 0;
    carState.jumpR = null;
    carState.x += -L.fx * Math.sin(th) * 0.6;
    carState.z += -L.fz * Math.sin(th) * 0.6;
    flash("TOO SLOW", "the loop needs 55 mph or more", 1.8);
    audio.fail();
    return { df: 0, mu: 1.45, geff: 9.81, ev: null };
  }
  carState.x = L.x + L.fx * L.R * Math.sin(th) + L.rx * lat;
  carState.z = L.z + L.fz * L.R * Math.sin(th) + L.rz * lat;
  carState.y = 0.22 + L.R * (1 - Math.cos(th));
  carState.thrust = 0;
  carState.state = "LOOP";
  carState.steer *= 0.9;
  audio.update(carState.v, I.thr && !locked, 0, true, false, false, false);
  return { df: 0, mu: 1.45, geff: 9.81, ev: null };
}
