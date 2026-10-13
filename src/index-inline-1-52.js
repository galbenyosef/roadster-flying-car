// index-inline-1 52 — math
// Lines 94838-95180 of readable/index-inline-1.pretty.js (statement-aligned).
V26.T.drone = (M, dt, ev, el) => {
  const D = DRN,
    g = D.g,
    left = DRNV.time - el;
  g.visible = true;
  let obj,
    tt = `${Math.max(0, left).toFixed(1)} s left`;
  if (phase === "cut") return ["", tt];
  if (!D.att) {
    const d3 = Math.hypot(
      S.x - g.position.x,
      S.y + 0.5 - g.position.y,
      S.z - g.position.z,
    );
    D.gt += dt;
    const stall = d3 < 25 && D.gt % 11 > 9.9;
    if (stall && !D.st) {
      D.st = true;
      audio.fail();
      pop("GLITCH · SHE STALLS", 0);
    }
    if (!stall) D.st = false;
    // rhythm: she darts away when you close in, then tires for a few seconds. That is your window.
    D.mt = (D.mt || 0) - dt;
    if (D.mode === "dart" && D.mt <= 0) {
      D.mode = "tired";
      D.mt = DRNV.tiredT;
    } else if (D.mode === "tired" && D.mt <= 0) {
      D.mode = "cruise";
      D.mt = 1.5;
    } else if (
      (D.mode || "cruise") === "cruise" &&
      D.mt <= 0 &&
      d3 < DRNV.near &&
      D.lock <= 0
    ) {
      D.mode = "dart";
      D.mt = DRNV.dartT;
      pop("SHE BOLTS", 0);
    }
    D.s +=
      (stall
        ? 2
        : D.mode === "dart"
          ? DRNV.dart
          : D.mode === "tired"
            ? DRNV.tired
            : DRNV.base) * dt;
    // jukes: when you get close she darts sideways and up or down
    D.jt -= dt;
    if (d3 < DRNV.juke && D.jt <= 0 && !stall) {
      D.jt = 1.8 + Math.random() * 0.9;
      const a = Math.random() * 6.283;
      D.jx = Math.cos(a) * 7;
      D.jz = Math.sin(a) * 7;
      D.jy = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3);
      audio.whoosh && audio.whoosh();
    }
    const k = Math.min(1, dt * 2.2);
    D.ox += (D.jx - D.ox) * k;
    D.oy += (D.jy - D.oy) * k;
    D.oz += (D.jz - D.oz) * k;
    D.jx *= Math.exp(-dt * 0.6);
    D.jy *= Math.exp(-dt * 0.6);
    D.jz *= Math.exp(-dt * 0.6);
    const pos = drn2At(D.s),
      tgt = pos.add(
        V3x(
          D.ox + Math.sin(clock * 1.7) * 1.5,
          D.oy + Math.sin(clock * 2.3) * 0.6,
          D.oz + Math.cos(clock * 1.3) * 1.5,
        ),
      );
    const prev = g.position.clone();
    g.position.lerp(tgt, Math.min(1, dt * 4));
    {
      const gy = groundH(g.position.x, g.position.z, 999).h + 4;
      if (g.position.y < gy) g.position.y = gy;
    }
    const v = g.position.clone().sub(prev);
    if (v.lengthSq() > 1e-6) {
      g.rotation.y = Math.atan2(v.x, v.z);
      g.rotation.z = clamp(-v.x * 0.6, -0.35, 0.35) * 0.4;
      g.rotation.x = clamp(v.length() / dt / 40, 0, 0.35);
    }
    drnSpin(clock * (stall ? 0.3 : D.mode === "tired" ? 0.6 : 1), true);
    // the tether: fires inside 7 m, holds while you stay inside 12 m, locks after 1 s
    D.snap = Math.max(0, D.snap - dt);
    if (D.lock > 0 || (d3 < DRNV.lockR && D.snap <= 0)) {
      if (d3 > DRNV.holdR) {
        D.lock = 0;
        D.snap = 0.8;
        BEAM.visible = false;
        audio.fail();
        flash("TETHER SNAPPED", "get back inside 7 m", 1.2);
      } else {
        if (D.lock === 0) {
          audio.servo();
          pop("TETHER", 0);
        }
        D.lock += dt;
        beam(
          V3x(S.x, S.y + 1.15, S.z),
          g.position.clone().add(V3x(0, -0.45, 0)),
          true,
          1,
        );
        if (D.lock >= DRNV.lockT) {
          D.att = true;
          D.lock = 0;
          audio.chime();
          pop("DRONE DOCKED · AIR REFILLED", 600);
          S.tank = 100;
          M.dockT = el;
          dockCut(() => {
            showSub(
              "MAE",
              "You got her! Bring her home: the roof of the diner. Gently, those are pies.",
              4.5,
            );
            DZ.visible = true;
            zoneColor(0xffc24a);
            DZ.position.set(DRN_ROOF[0], DRN_ROOF[1], DRN_ROOF[2]);
          });
          return ["", tt];
        }
      }
    } else BEAM.visible = false;
    meter(D.lock > 0 ? "TETHER" : null, (D.lock / DRNV.lockT) * 100);
    obj =
      D.lock > 0
        ? `Hold her · tether ${Math.round((D.lock / DRNV.lockT) * 100)}% · stay inside 12 m`
        : d3 > 80
          ? `Catch Mae's drone · ${Math.round(d3)} m · ${KY("boost")} to close in`
          : stall
            ? "GLITCH! She stalls · get inside 7 m now"
            : D.mode === "tired"
              ? `She is tiring · ${Math.round(d3)} m · close in NOW`
              : `Catch the drone · ${Math.round(d3)} m · get inside 7 m to fire the tether`;
  }
  if (D.att) {
    meter(null);
    const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)];
    g.position.set(
      S.x - fw[0] * 0.2,
      S.y + 2.4 + Math.sin(clock * 3) * 0.08,
      S.z - fw[1] * 0.2,
    );
    g.rotation.set(0, S.yaw, 0);
    drnSpin(clock, false);
    obj = S.air
      ? "Land on the DINER ROOF (follow the beam) · softly"
      : "Lift off and land on the DINER ROOF";
    if (ev && ev.land != null) {
      const b = DINER.b;
      if (
        S.x > b[0] - 0.5 &&
        S.x < b[1] + 0.5 &&
        S.z > b[2] - 0.5 &&
        S.z < b[3] + 0.5 &&
        S.y > 6
      ) {
        finish(
          true,
          "Six pies, not one crumb out of place. Mae is buying you dinner for a month.",
          { time: el, land: ev.land },
        );
        return ["", ""];
      } else
        flash("NOT THE ROOF", "lift off and land on top of the diner", 1.6);
    }
  }
  if (!M.done && left <= 0) {
    finish(
      false,
      "Out of time. Boost to close the gap, then let go of boost and match her speed.",
      { time: null },
    );
    return ["", ""];
  }
  return [obj, tt];
};

/* ---- 03 RING RUN v2: ten rings, a clock that only refills at a ring, finish through the gold ring. No pad. ---- */
// rings 1-6 run down the boulevard; 7-10 drop low, climb a street canyon, turn right and finish low
const RR = (() => {
  const L = RINGS.map((r) => ({
    x: r.x,
    y: r.y,
    z: r.z,
    nx: 0,
    nz: 1,
    m: r.m,
    R: 4.6,
  }));
  const add = (x, y, z, nx, nz, R = 4.6) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.28, 12, 56),
      glowMat(0x28e0ff, 3.2),
    );
    m.position.set(x, y, z);
    m.rotation.y = Math.atan2(nx, nz);
    prop(m);
    L.push({ x, y, z, nx, nz, m, R });
  };
  add(0, 12, -120, 0, 1);
  add(0, 30, -192, 0, 1);
  add(70, 38, -192, 1, 0);
  add(150, 14, -192, 1, 0, 5.4);
  return L;
})();
const RRT = { start: 11, per: 22, base: 0.8, turn: 1.6 };
function rrBonus(i) {
  const a = RR[i],
    b = RR[i + 1];
  if (!b) return 0;
  const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  return d / RRT.per + RRT.base + (a.nx !== b.nx ? RRT.turn : 0);
}
function rrPaint(k) {
  RR.forEach((r, i) => {
    r.m.visible = true;
    const last = i === RR.length - 1;
    r.m.material.emissive.set(
      i < k
        ? 0x3a4a55
        : i === k
          ? last
            ? 0xffd24a
            : 0xffb35c
          : last
            ? 0xc9a23a
            : 0x28e0ff,
    );
    r.m.material.emissiveIntensity = i === k ? 4.2 : i < k ? 1 : 2.6;
  });
}
V26.setup.rings = (d) => {
  rrPaint(0);
  Object.assign(M, {
    ring: 0,
    left: RRT.start,
    px: S.x,
    py: S.y,
    pz: S.z,
    tot: 0,
  });
};
V26.T.rings = (M, dt, ev, el) => {
  const k = M.ring,
    r = RR[k];
  if (!cin.on) M.left -= dt;
  if (r) {
    const dp = (M.px - r.x) * r.nx + (M.pz - r.z) * r.nz,
      dc = (S.x - r.x) * r.nx + (S.z - r.z) * r.nz;
    if (dp * dc <= 0 && (dp !== 0 || dc !== 0) && Math.abs(dp - dc) < 30) {
      const u = dp / (dp - dc || 1),
        ix = lerp(M.px, S.x, u),
        iy = lerp(M.py, S.y, u) + 0.6,
        iz = lerp(M.pz, S.z, u),
        off = Math.hypot(ix - r.x, iy - r.y, iz - r.z);
      if (off < r.R) {
        M.ring++;
        const b = rrBonus(k);
        M.left += b;
        audio.ping();
        burst(r.x, r.y, r.z, 30, 9);
        if (M.ring >= RR.length) {
          rrPaint(RR.length);
          audio.chime();
          finish(
            true,
            `All ten rings with ${Math.max(0, M.left).toFixed(1)} s on the clock.`,
            { time: el },
          );
          return ["", ""];
        }
        rrPaint(M.ring);
        flash(`RING ${M.ring} / ${RR.length}`, `+${b.toFixed(1)} s`, 1);
      } else if (off < 22)
        flash("MISSED RING", "turn round and go through it", 1.4);
    }
  }
  M.px = S.x;
  M.py = S.y;
  M.pz = S.z;
  meter(
    "RING CLOCK",
    Math.min(100, (M.left / 12) * 100),
    `${Math.max(0, M.left).toFixed(1)} s`,
    M.left < 3,
  );
  if (M.left <= 0) {
    finish(
      false,
      `Out of time after ${M.ring} of ${RR.length} rings. Boost between rings, then line up early.`,
      { time: null },
    );
    return ["", ""];
  }
  const nx = RR[M.ring];
  return [
    `Ring ${M.ring + 1} of ${RR.length}${M.ring === RR.length - 1 ? " · GOLD FINISH" : ""} · ${Math.round(Math.hypot(nx.x - S.x, nx.z - S.z))} m`,
    `${el.toFixed(1)} s`,
  ];
};

/* ---- 04 SPECIAL DELIVERY v2: three different drops, and six pies that hate bumps ---- */
// 1: stop in a street zone · 2: land on a rooftop party · 3: lower the last order onto Mae's food truck, on the move
function pickRoof(cx, cz, d0, d1, h0, h1, tx, tz) {
  let best = null,
    bs = 1e9;
  for (const b of BLD) {
    if (b.style < 0 || b.style === 3 || b.h < h0 || b.h > h1) continue;
    const w = b.x1 - b.x0,
      l = b.z1 - b.z0;
    if (w < 26 || l < 26 || w > 60 || l > 60) continue;
    const x = (b.x0 + b.x1) / 2,
      z = (b.z0 + b.z1) / 2,
      d = Math.hypot(x - cx, z - cz);
    if (d < d0 || d > d1) continue;
    if (PADS.some((p) => Math.hypot(p.x - x, p.z - z) < 60)) continue;
    let flat = true;
    for (const [a, c] of [
      [0, 0],
      [-6, -6],
      [6, 6],
      [-6, 6],
      [6, -6],
    ]) {
      if (Math.abs(groundH(x + a, z + c, 999).h - b.h) > 0.3) flat = false;
    }
    if (!flat) continue;
    const sc = Math.abs(d - (d0 + d1) / 2) + Math.hypot(x - tx, z - tz) * 0.25;
    if (sc < bs) {
      bs = sc;
      best = { x, z, h: b.h };
    }
  }
  return best;
}
const FT = { x0: -384, x1: -192, z0: -288, z1: -96 };
// the food truck, 1.45x a van: a 3.3 m x 4.5 m roof at 4.5 m you can land on, solid sides
