// index-inline-1 53 — three
// Lines 95181-95527 of readable/index-inline-1.pretty.js (statement-aligned).
const VANK = 1.45,
  VANS = {
    on: false,
    hw: 1.67,
    z0: -1.89,
    z1: 4.5,
    top: 3.1 * 1.45,
    cz0: -4.64,
    ctop: 2.3 * 1.45,
  };
const FTP = Object.assign(
  {},
  mkPath([
    [FT.x0 + 3.2, FT.z0 + 3.2, [0, -1], [1, 0]],
    [FT.x1 - 3.2, FT.z0 + 3.2, [1, 0], [0, 1]],
    [FT.x1 - 3.2, FT.z1 - 3.2, [0, 1], [-1, 0]],
    [FT.x0 + 3.2, FT.z1 - 3.2, [-1, 0], [0, -1]],
  ]),
);
const ROOF2 = pickRoof(
  DROPS[0][0],
  DROPS[0][1],
  170,
  330,
  18,
  46,
  (FT.x0 + FT.x1) / 2,
  (FT.z0 + FT.z1) / 2,
) || { x: -315.7, z: -30.5, h: 22 };
const VAN = (() => {
  const g = new THREE.Group(),
    white = new THREE.MeshStandardMaterial({
      color: 0xf1efe9,
      roughness: 0.45,
      metalness: 0.1,
    }),
    teal = new THREE.MeshStandardMaterial({ color: 0x1f9d94, roughness: 0.4 }),
    dark = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6 }),
    glass = new THREE.MeshStandardMaterial({
      color: 0x1b2633,
      metalness: 0.6,
      roughness: 0.15,
    });
  const box = (w, h, l, x, y, z, m) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    g.add(o);
    return o;
  };
  box(2.3, 2.5, 4.4, 0, 1.85, 0.9, white);
  box(2.2, 1.7, 1.9, 0, 1.45, -2.25, white);
  box(2.1, 0.75, 0.05, 0, 1.85, -3.21, glass);
  box(2.32, 0.34, 4.42, 0, 0.78, 0.9, teal);
  box(2.34, 0.3, 4.46, 0, 2.95, 0.9, teal);
  const aw = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.5, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xd8343d }),
  );
  aw.position.set(1.22, 2.45, 0.9);
  aw.rotation.z = -0.5;
  g.add(aw);
  for (const [x, z] of [
    [-1, -2.2],
    [1, -2.2],
    [-1, 2.1],
    [1, 2.1],
  ]) {
    const w = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16),
      dark,
    );
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    g.add(w);
  }
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.55, 32),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(3, 2, 0.4),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 3.12, 0.9);
  g.add(pad);
  const tag = labelSprite("MAE'S TRUCK", "#ffc24a", 0.2);
  tag.position.set(0, 4.4, 0.9);
  g.add(tag);
  g.userData = { pad, s: 0, v: 0 };
  g.scale.setScalar(VANK);
  return prop(g);
})();
const ROOFZ = (() => {
  const g = new THREE.Group(),
    r = new THREE.Mesh(
      new THREE.RingGeometry(5.2, 6, 56),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.8, 0.6, 2.2),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.3;
  g.add(r);
  const b = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 5.6, 40, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff5fd2,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  b.position.y = 20;
  g.add(b);
  g.position.set(ROOF2.x, ROOF2.h, ROOF2.z);
  return prop(g);
})();
const PIEBOX = (() => {
  const g = new THREE.Group(),
    m = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xd9a35b, roughness: 0.8 }),
    );
  g.add(m);
  const s = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.06, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xb3121b }),
  );
  s.position.y = 0.05;
  g.add(s);
  return prop(g);
})();
function vanTick(dt) {
  const U = VAN.userData,
    sm = ((U.s % FTP.len) + FTP.len) % FTP.len;
  let dc = 1e9;
  for (const c of FTP.corners) {
    let d = c - sm;
    if (d < 0) d += FTP.len;
    dc = Math.min(dc, d);
  }
  const vt = Math.min(16, 8 + dc * 0.14);
  U.v += clamp(vt - U.v, -6 * dt, 4 * dt);
  U.s += U.v * dt;
  const p = pathAtP(FTP, U.s),
    q = pathAtP(FTP, U.s + 4);
  VAN.position.set(p.x, 0, p.z);
  VAN.rotation.y = Math.atan2(-(q.x - p.x), -(q.z - p.z));
}
function vanTop() {
  const o = V3x(0, 3.1, 0.9);
  VAN.updateMatrixWorld();
  return VAN.localToWorld(o);
}
V26.setup.courier = (d) => {
  Object.assign(M, { step: 0, pie: 100, dz: 0, hand: 0 });
  DZ.visible = true;
  zoneColor(0x28e0ff);
  DZ.position.set(DROPS[0][0], 0, DROPS[0][1]);
  VAN.visible = true;
  ROOFZ.visible = true;
  VAN.userData.s = 0;
  VAN.userData.v = 10;
  vanTick(0);
  clearLines({ z: [FT.x0, FT.x1], x: [FT.z0, FT.z1] });
};
V26.T.courier = (M, dt, ev, el) => {
  const left = 110 - el,
    v0 = { x: VAN.position.x, z: VAN.position.z, r: VAN.rotation.y },
    onR = onVanRoof();
  vanTick(dt);
  vanCarry(v0, onR);
  vanCollide(M);
  VANS.on = true;
  if (S.air) {
    M.avx = S.vx;
    M.avz = S.vz;
  }
  let obj = "";
  // pies: every bump and every hard landing costs
  const hit =
    M.clamp || onVanRoof() ? ((V26.hs0 = null), 0) : impactTick(dt, ev);
  if (hit) {
    const c = Math.min(35, hit * 2.4);
    M.pie -= c;
    pop(`PIES BUMPED −${Math.round(c)}%`, 0, true);
    shake = Math.max(shake, 0.2);
  }
  if (ev && ev.land != null && ev.land > 2.6) {
    const c = Math.min(40, (ev.land - 2.6) * 16);
    M.pie -= c;
    pop(`HARD LANDING · PIES −${Math.round(c)}%`, 0, true);
  }
  meter("PIES", Math.max(0, M.pie), null, M.pie < 30);
  if (M.pie <= 0) {
    finish(
      false,
      "The pies are pancakes. Smooth inputs, soft landings, no bumps.",
      { time: null },
    );
    return ["", ""];
  }
  if (M.step === 0) {
    const Q = DROPS[0],
      inZ =
        Math.hypot(S.x - Q[0], S.z - Q[1]) < 6 && !S.air && Math.abs(S.v) < 2.5;
    obj = "Order 1 · stop inside the blue zone";
    if (inZ) {
      M.dz += dt;
      if (M.dz > 0.5) {
        M.step = 1;
        M.dz = 0;
        audio.chime();
        pop("ORDER 1 DELIVERED", 300);
        if (S.tank < 70) {
          S.tank = 70;
          pop("TIP · AIR TOPPED UP", 0);
        }
        DZ.position.set(ROOF2.x, ROOF2.h, ROOF2.z);
        zoneColor(0xff5fd2);
        ROOFZ.visible = false;
        flash(
          "ORDER 2 · ROOFTOP PARTY",
          "land inside the pink ring on the roof",
          2.2,
        );
        showSub(
          "MAE",
          "Order two is a rooftop party. Land on the roof, inside the ring. Soft!",
          4,
        );
      }
    } else M.dz = 0;
  } else if (M.step === 1) {
    obj = "Order 2 · land inside the pink ring on the ROOF";
    if (ev && ev.land != null) {
      if (Math.hypot(S.x - ROOF2.x, S.z - ROOF2.z) < 6.5 && S.y > ROOF2.h - 1) {
        M.step = 2;
        audio.chime();
        pop("ORDER 2 DELIVERED", 400);
        if (S.tank < 70) {
          S.tank = 70;
          pop("TIP · AIR TOPPED UP", 0);
        }
        DZ.visible = false;
        flash(
          "ORDER 3 · MAE'S TRUCK",
          "it is moving · land on its roof and hold on 2 s",
          2.4,
        );
        showSub(
          "MAE",
          "Last one goes on my food truck. It won't stop for you, sugar. Match its speed, hover right over it.",
          5,
        );
      } else if (S.y > 4)
        flash("WRONG ROOF", "the pink ring, on top of the building", 1.4);
    }
  } else {
    // order 3: land on the roof of Mae's moving truck and ride it for 2 s
    const U = VAN.userData,
      vf = [-Math.sin(VAN.rotation.y), -Math.cos(VAN.rotation.y)],
      on = onVanRoof();
    if (ev && ev.land != null && on && !M.clamp) {
      const rel = Math.hypot(
        (M.avx || 0) - vf[0] * U.v,
        (M.avz || 0) - vf[1] * U.v,
      );
      if (rel <= 6) {
        M.clamp = 1e-4;
        S.v = 0;
        S.vx = S.vz = 0;
        V26.hs0 = null;
        audio.hit();
        pop("CLAMPED ON THE TRUCK", 300);
        flash("HOLD ON", "2 s on the roof", 1.4);
      } else {
        const c = Math.min(30, rel * 2.5);
        M.pie -= c;
        pop(`TOO FAST −${Math.round(c)}%`, 0, true);
        flash("TOO FAST", "match the truck's speed, then drop on", 1.6);
        const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)];
        S.v =
          ((M.avx || 0) - vf[0] * U.v) * fw[0] +
          ((M.avz || 0) - vf[1] * U.v) * fw[1];
      }
    }
    if (M.clamp) {
      if (on && !S.air) {
        S.v = 0;
        M.clamp += dt;
        meter(
          "ON THE TRUCK",
          (M.clamp / 2) * 100,
          `${Math.min(2, M.clamp).toFixed(1)} / 2.0 s`,
        );
        if (M.clamp >= 2) {
          audio.chime();
          const T = vanTop();
          burst(T.x, T.y + 0.5, T.z, 40, 8);
          finish(
            true,
            `Landed on a moving truck with ${Math.round(M.pie)}% of the pies perfect. Mae owes you.`,
            { time: el },
          );
          return ["", ""];
        }
      } else {
        M.clamp = 0;
        flash("OFF THE TRUCK", "fly back and land on the roof", 1.4);
      }
    }
    const T = vanTop(),
      dh = Math.hypot(S.x - T.x, S.z - T.z);
    obj = M.clamp
      ? "Hold on · riding Mae's truck"
      : `Order 3 · LAND on Mae's truck · ${Math.round(dh)} m${dh < 30 ? ` · it is doing ${Math.round(U.v * MPH)} mph` : ""}`;
  }
  if (!M.done && left <= 0) {
    VANS.on = false;
    finish(false, "Out of time. The food went cold.", { time: null });
    return ["", ""];
  }
  return [obj, `${Math.max(0, left).toFixed(1)} s left`];
};

/* ---- 05 STUNT YARD v2: four ramps in order, each with its own trick ---- */
const SY = [
  { n: "NORTH HOP", air: 0.4, say: "any clean landing" },
  { n: "WIDE KICKER", air: 1.6, say: "1.6 s of air" },
  {
    n: "MEGA RAMP",
    air: 0.6,
    spin: true,
    say: "land a 360 SPIN (steer in the air)",
  },
  { n: "DOUBLE UP", air: 2, say: "2.0 s of air" },
];
