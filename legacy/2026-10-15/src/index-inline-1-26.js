// index-inline-1 26 — math
// Lines 86307-86654 of readable/index-inline-1.pretty.js (statement-aligned).
function skidMark(x, y, z, yaw, len = 0.9) {
  _sq.setFromEuler(_se.set(-Math.PI / 2, yaw, 0, "YXZ"));
  _sm.compose(_sv.set(x, y, z), _sq, _ss.set(1, len, 1));
  SKID.m.setMatrixAt(SKID.i, _sm);
  SKID.i = (SKID.i + 1) % SKID.n;
  SKID.m.count = Math.max(SKID.m.count, SKID.i);
  if (SKID.m.count < SKID.n && SKID.i === 0) SKID.m.count = SKID.n;
  SKID.m.instanceMatrix.needsUpdate = true;
}
// solid ramps: drive up the slope from the front, but the sides and the back are walls
function rampCollide(dt) {
  for (const r of RAMPS) {
    const dx = S.x - r.x,
      dz = S.z - r.z;
    if (dx * dx + dz * dz > r.R2 + 80) continue;
    const f = dx * r.fx + dz * r.fz,
      l = dx * r.fz - dz * r.fx,
      m = 1.05;
    if (f < -m || f > r.L + m || Math.abs(l) > r.W / 2 + m) continue;
    const surf = 0.2 + (r.H * clamp(f, 0, r.L)) / r.L;
    if (S.y >= surf - 0.55) continue;
    const dl = r.W / 2 + m - Math.abs(l),
      db = r.L + m - f;
    let nx, nz;
    if (dl < db) {
      const sg = Math.sign(l) || 1;
      nx = r.fz * sg;
      nz = -r.fx * sg;
      S.x += nx * dl;
      S.z += nz * dl;
    } else {
      nx = r.fx;
      nz = r.fz;
      S.x += nx * db;
      S.z += nz * db;
    }
    impact(nx, nz, dt);
  }
}
// solid loop: away from the two entry lanes the ring is a wall you can't drive through
function loopCollide(dt) {
  if (S.loop) return;
  for (const L of LOOPS) {
    if (L.twin) continue;
    const dx = S.x - L.x,
      dz = S.z - L.z,
      d = dx * L.fx + dz * L.fz;
    if (Math.abs(d) > L.R + 1.2) continue;
    const m = dx * L.rx + dz * L.rz;
    if (m < -L.W / 2 - 1.2 || m > L.w + L.W / 2 + 1.2) continue;
    const dd = clamp(d, -L.R, L.R),
      h1 = 0.22 + L.R - Math.sqrt(Math.max(0, L.R * L.R - dd * dd));
    if (h1 < 0.55 || S.y >= h1 - 0.1 || h1 > S.y + 1.45) continue;
    const th = d >= 0 ? Math.asin(dd / L.R) : Math.PI * 2 + Math.asin(dd / L.R),
      c = (L.w * th) / (Math.PI * 2);
    if (Math.abs(m - c) > L.W / 2 + 1.05) continue;
    const dLow = Math.sqrt(
        Math.max(0, L.R * L.R - (L.R - 0.33) * (L.R - 0.33)),
      ),
      q = L.R - (S.y + 1.45 - 0.22),
      dHigh = Math.sqrt(Math.max(0, L.R * L.R - q * q)),
      sg = Math.sign(d) || 1;
    const target =
        Math.abs(d) > (dLow + dHigh) / 2 ? dHigh + 0.05 : dLow - 0.05,
      push = (target - Math.abs(d)) * sg;
    S.x += L.fx * push;
    S.z += L.fz * push;
    const nx = L.fx * Math.sign(push),
      nz = L.fz * Math.sign(push);
    impact(nx, nz, dt);
  }
}
// street furniture
function propCollide(dt) {
  if (S.air || S.y > 8) return;
  const cx = Math.floor(S.x / CELL),
    cz = Math.floor(S.z / CELL);
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) {
      const Lp = PROPS.get(GK(cx + a, cz + b));
      if (!Lp) continue;
      for (const p of Lp) {
        const dx = S.x - p[0],
          dz = S.z - p[1];
        if (Math.abs(dx) > 3 || Math.abs(dz) > 3 || S.y > p[3]) continue;
        const d = Math.hypot(dx, dz),
          mm = p[2] + 1.05;
        if (d < mm && d > 1e-4) {
          const nx = dx / d,
            nz = dz / d;
          S.x = p[0] + nx * mm;
          S.z = p[1] + nz * mm;
          impact(nx, nz, dt);
        }
      }
    }
}
function impact(nx, nz, dt) {
  const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)];
  let sp;
  if (S.air) {
    const vn = S.vx * nx + S.vz * nz;
    if (vn < 0) {
      S.vx -= vn * nx * 1.35;
      S.vz -= vn * nz * 1.35;
    }
    sp = Math.max(0, -vn);
  } else {
    const vd = [-Math.sin(S.vyaw), -Math.cos(S.vyaw)],
      vn = (vd[0] * nx + vd[1] * nz) * S.v;
    if (vn < 0) {
      const tx = vd[0] * S.v - vn * nx,
        tz = vd[1] * S.v - vn * nz,
        tl = Math.hypot(tx, tz);
      sp = -vn;
      S.v = Math.sign(S.v || 1) * tl * (sp > 2.5 ? 0.88 : 0.997);
      if (tl > 0.5) {
        let ta = Math.atan2(-tx, -tz);
        if (S.v < 0) ta += Math.PI;
        S.vyaw = ta;
        S.yaw += angD(ta, S.yaw) * Math.min(1, dt * 12);
      } else S.vyaw = S.yaw;
    } else sp = 0;
  }
  if (sp > 6 && SCORE.drift > 0) {
    SCORE.drift = 0;
    pop("DRIFT LOST", 0, true);
  }
  if (sp > 2) {
    scrape = 0.25;
    const cx = S.x - nx * 1,
      cz = S.z - nz * 1;
    for (let k = 0; k < 3; k++) {
      const r = Math.random;
      sparks.emit(
        cx,
        S.y + 0.45,
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
  if (sp > 9 && S.bump <= 0) {
    shake = Math.min(1, sp / 25);
    audio.boom();
    S.bump = 0.4;
    if (sp > 14) comboEnd(true);
  }
}
function trafficCollide(dt) {
  if (S.y > 2.2) return;
  const spd = S.air ? Math.hypot(S.vx, S.vz) : Math.abs(S.v);
  for (const c of TRAFFIC) {
    const fx = -Math.sin(c.yaw),
      fz = -Math.cos(c.yaw);
    const dx = S.x - c.x,
      dz = S.z - c.z,
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
        S.x += nx * ox;
        S.z += nz * ox;
      } else {
        const sg = Math.sign(ll) || 1;
        nx = fz * sg;
        nz = -fx * sg;
        S.x += nx * ol;
        S.z += nz * ol;
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
      if (!S.air)
        S.v *= c.type === "hauler" ? 0.45 : 1 - Math.min(0.45, mr * 0.35);
      if (spd > 6) {
        shake = Math.max(shake, Math.min(0.9, spd / 30));
        const r = Math.random;
        for (let k = 0; k < Math.min(30, spd * 1.2); k++)
          sparks.emit(
            S.x - nx * 1.1,
            S.y + 0.5 + r() * 0.5,
            S.z - nz * 1.1,
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
        dx = S.x - r.g.position.x,
        dz = S.z - r.g.position.z,
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
          S.x += nx * ox;
          S.z += nz * ox;
        } else {
          const sg = Math.sign(ll) || 1;
          nx = fz * sg;
          nz = -fx * sg;
          S.x += nx * ol;
          S.z += nz * ol;
        }
        impact(nx, nz, dt);
        r.sp *= 0.9;
      }
    }
  for (const w of WALKERS) {
    const dx = S.x - w.x,
      dz = S.z - w.z,
      d = Math.hypot(dx, dz);
    if (d < 1.35 && d > 1e-3) {
      const nx = dx / d,
        nz = dz / d;
      S.x += nx * (1.35 - d);
      S.z += nz * (1.35 - d);
      impact(nx, nz, dt);
      if (w.hit <= 0) {
        w.hit = 1;
        if (spd > 4) pop("BUMPED A CREWBOT", 0, true);
      }
    }
  }
}
function loopStep(dt, I, locked) {
  const Lp = S.loop,
    L = Lp.L,
    g = 9.81;
  let a = -g * Math.sin(Lp.th);
  if (!locked && I.thr)
    a += Math.min(
      8,
      (POWER * veh.pmul * (1 + 0.1 * U("power"))) / Math.max(S.v, 1) / MASS,
    );
  if (!locked && I.brk) a -= 6;
  a -= 0.0005 * S.v * S.v;
  S.v = Math.max(0, S.v + a * dt);
  Lp.th += (S.v / L.R) * dt;
  const th = Lp.th,
    lat = Lp.lat0 + L.w * Math.min(1, th / (Math.PI * 2));
  if (th >= Math.PI * 2) {
    S.loop = null;
    S.x = L.x + L.rx * (Lp.lat0 + L.w);
    S.z = L.z + L.rz * (Lp.lat0 + L.w);
    S.y = groundH(S.x, S.z, 1).h;
    S.yaw = S.vyaw = L.yaw;
    audio.boom();
    shake = 0.35;
    pop("LOOP THE LOOP", 1500);
    flash("360°", "all the way round", 1.4);
    return { df: 0, mu: 1.45, geff: 9.81, ev: { loop: true } };
  }
  if (th > 0.5 && ((S.v * S.v) / L.R < -g * Math.cos(th) + 0.4 || S.v < 1)) {
    S.loop = null;
    const T = [L.fx * Math.cos(th), Math.sin(th), L.fz * Math.cos(th)];
    S.air = true;
    S.vx = T[0] * S.v;
    S.vz = T[2] * S.v;
    S.vy = T[1] * S.v;
    S.airT = 0;
    S.jumpR = null;
    S.x += -L.fx * Math.sin(th) * 0.6;
    S.z += -L.fz * Math.sin(th) * 0.6;
    flash("TOO SLOW", "the loop needs 55 mph or more", 1.8);
    audio.fail();
    return { df: 0, mu: 1.45, geff: 9.81, ev: null };
  }
  S.x = L.x + L.fx * L.R * Math.sin(th) + L.rx * lat;
  S.z = L.z + L.fz * L.R * Math.sin(th) + L.rz * lat;
  S.y = 0.22 + L.R * (1 - Math.cos(th));
  S.thrust = 0;
  S.state = "LOOP";
  S.steer *= 0.9;
  audio.update(S.v, I.thr && !locked, 0, true, false, false, false);
  return { df: 0, mu: 1.45, geff: 9.81, ev: null };
}
