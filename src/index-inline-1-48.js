// index-inline-1 48 — math
// Lines 93611-93895 of readable/index-inline-1.pretty.js (statement-aligned).
const DRN_PTS = [
  [150, 350, 18],
  [60, 300, 24],
  [0, 330, 30],
  [-3, 250, 34],
  [0, 203, 30],
  [60, 200, 26],
  [96, 203, 22],
  [96, 255, 20],
  [100, 300, 16],
  [40, 370, 14],
  [120, 385, 20],
];
const DRN_PATH = (() => {
  const P = DRN_PTS.map((p) => new THREE.Vector3(p[0], p[2], p[1])),
    c = new THREE.CatmullRomCurve3(P, true, "centripetal");
  const n = 600,
    pts = c.getSpacedPoints(n);
  for (const q of pts) {
    let roof = 0;
    for (let a = -6; a <= 6; a += 3)
      for (let b = -6; b <= 6; b += 3)
        roof = Math.max(roof, groundH(q.x + a, q.z + b, 999).h);
    q.y = Math.max(q.y, roof + 9);
  }
  for (let k = 0; k < 3; k++)
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length],
        b = pts[(i + 1) % pts.length];
      pts[i].y = Math.max(pts[i].y, (a.y + b.y) / 2 - 1);
    }
  let L = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    L += pts[i].distanceTo(pts[i - 1]);
    cum.push(L);
  }
  L += pts[0].distanceTo(pts[pts.length - 1]);
  return { pts, cum, L };
})();
function drnAt(s) {
  const P = DRN_PATH;
  s = ((s % P.L) + P.L) % P.L;
  let lo = 0,
    hi = P.cum.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (P.cum[m] <= s) lo = m;
    else hi = m - 1;
  }
  const a = P.pts[lo],
    b = P.pts[(lo + 1) % P.pts.length],
    seg = (lo + 1 < P.cum.length ? P.cum[lo + 1] : P.L) - P.cum[lo];
  return a.clone().lerp(b, clamp((s - P.cum[lo]) / Math.max(0.01, seg)));
}
function drnSpin(t, red) {
  DRONE.rot.forEach((r, i) => {
    r.rotation.y = t * 40 * (i % 2 ? 1 : -1);
  });
  const blink = Math.floor(t * 4) % 2 === 0;
  DRONE.ledR.emissiveIntensity = red ? (blink ? 9 : 1) : 4;
  DRONE.ledB.emissiveIntensity = red ? 0.5 : blink ? 7 : 2;
}
function droneTick(M, dt, ev, el) {
  const D = DRONE,
    g = D.g,
    left = 100 - el;
  g.visible = true;
  let obj,
    tt = `${Math.max(0, left).toFixed(1)} s left`;
  if (!D.att) {
    const pos = drnAt(D.s),
      d3 = Math.hypot(
        carState.x - g.position.x,
        carState.y + 0.5 - g.position.y,
        carState.z - g.position.z,
      ),
      close = d3 < 22;
    D.gt = (D.gt || 0) + dt;
    const stall = close && D.gt % 9 > 7.5;
    if (stall && !D.st) {
      D.st = true;
      audio.fail();
      pop("GLITCH · DOCK NOW", 0);
    }
    if (!stall) D.st = false;
    D.s += (stall ? 0 : 11 + (close ? 4 : 0)) * dt;
    D.y += ((close ? 6 : 0) - D.y) * Math.min(1, dt * 1.5);
    const jx = Math.sin(clock * 1.7) * 2.2,
      jz = Math.cos(clock * 1.3) * 2.2;
    const tgt = pos.add(
      new THREE.Vector3(jx, D.y + Math.sin(clock * 2.3) * 0.6, jz),
    );
    const prev = g.position.clone();
    g.position.lerp(tgt, Math.min(1, dt * 4));
    const v = g.position.clone().sub(prev);
    if (v.lengthSq() > 1e-6) {
      g.rotation.y = Math.atan2(v.x, v.z);
      g.rotation.z = clamp(-v.x * 0.6, -0.35, 0.35) * 0.4;
      g.rotation.x = clamp(v.length() / dt / 40, 0, 0.35);
    }
    drnSpin(clock * (stall ? 0.3 : 1), true);
    if (d3 < 6.5) {
      D.dock += dt;
      if (D.dock >= 1.2) {
        D.att = true;
        audio.chime();
        pop("DRONE DOCKED", 400);
        flash("DRONE DOCKED", "now set her down on the DINER ROOF", 2.2);
        showSub(
          "MAE",
          "You got her! Bring her home, roof of the diner. Gently, those are pies.",
          4.5,
        );
        DROP_ZONE.visible = true;
        zoneColor(0xffc24a);
        DROP_ZONE.position.set(DRN_ROOF[0], DRN_ROOF[1], DRN_ROOF[2]);
      }
    } else D.dock = Math.max(0, D.dock - dt * 0.8);
    if (D.att) {
    } else if (D.dock > 0)
      obj = `Stay with her · docking ${Math.min(1.2, D.dock).toFixed(1)} / 1.2 s`;
    else
      obj =
        d3 > 60
          ? `Catch Mae's drone · ${Math.round(d3)} m · boost to close in`
          : stall
            ? `GLITCH! She stalls · get within 6 m now`
            : `Catch Mae's drone · ${Math.round(d3)} m · get within 6 m`;
  }
  if (D.att) {
    const fw = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)];
    g.position.set(
      carState.x - fw[0] * 0.2,
      carState.y + 2.4 + Math.sin(clock * 3) * 0.08,
      carState.z - fw[1] * 0.2,
    );
    g.rotation.set(0, carState.yaw, 0);
    drnSpin(clock, false);
    obj = carState.air
      ? "Land on the DINER ROOF (follow the beam) · softly"
      : `Lift off and land on the DINER ROOF`;
    if (ev && ev.land != null) {
      const b = DINER.b;
      if (
        carState.x > b[0] - 0.5 &&
        carState.x < b[1] + 0.5 &&
        carState.z > b[2] - 0.5 &&
        carState.z < b[3] + 0.5 &&
        carState.y > 6
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
      "Out of time. Boost to close the gap, then match her speed with hover.",
      { time: null },
    );
    return ["", ""];
  }
  return [obj, tt];
}
function droneReset() {
  Object.assign(DRONE, { s: 0, y: 0, dock: 0, att: false, gt: 0, st: false });
  DRONE.g.position.copy(drnAt(0));
  DRONE.g.visible = false;
}
MISSIONS.push({
  id: "drone",
  r: 700,
  n: "02",
  t: "Rogue Drone",
  b: "Mae's delivery drone lost its signal with six pies on board. Catch it in the air (it stalls every few seconds), stay within 6 m for 1.2 s to dock, then land on the diner roof. 100 s.",
  spawn: () => {
    droneReset();
    place(CAR_START.x, CAR_START.z, Math.PI / 2);
  },
});
MEDAL.drone = { t: 30, s: 50 };
GHOSTABLE.add("drone");
FLY_MISSIONS.add("drone");

/* ---- route previews: every story chapter opens with a film of where you have to go ---- */
function filmTargets(id) {
  const pd = (l) => {
      const p = PADS.find((q) => q.label === l);
      return { x: p.x, y: p.y, z: p.z, l: p.name };
    },
    R = (n) => {
      const r = RAMPS.find((q) => q.name === n);
      return {
        x: r.x + r.fx * r.L * 0.5,
        y: r.H,
        z: r.z + r.fz * r.L * 0.5,
        l: n,
      };
    };
  switch (id) {
    case "pad":
      return [pd("A"), pd("B")];
    case "rings":
      return RINGS.map((r, i) => ({
        x: r.x,
        y: r.y,
        z: r.z,
        l: `RING ${i + 1}`,
      })).concat([pd("C")]);
    case "skytour":
      return STOUR.map((r) => ({ x: r[0], y: r[1], z: r[2], l: r[3] })).concat([
        pd("L"),
      ]);
    case "courier":
      return DROPS.map((q, i) => ({
        x: q[0],
        y: 0,
        z: q[1],
        l: `DROP ${i + 1}`,
      }));
    case "relay":
      return [pd("A"), pd("C"), pd("B")];
    case "race":
    case "final": {
      const G = RACE.gates,
        n = G.length,
        st = Math.max(1, Math.floor(n / 5));
      const o = [];
      for (let i = 0; i < n; i += st)
        o.push({ x: G[i].x, y: 0, z: G[i].z, l: `GATE ${i + 1}` });
      return o.slice(0, 6);
    }
    case "ramps":
    case "stuntshow": {
      const o = RAMPS.filter((r) => r.name !== "POND JUMP")
        .sort(
          (a, b) =>
            Math.hypot(a.x - carState.x, a.z - carState.z) - Math.hypot(b.x - carState.x, b.z - carState.z),
        )
        .slice(0, 4);
      return o.map((r) => R(r.name));
    }
    case "truck":
      return [
        R("TRUCK JUMP"),
        {
          x: RAMPS.find((r) => r.name === "TRUCK JUMP").x,
          y: 2,
          z: -150,
          l: "THREE HAULERS",
        },
      ];
    case "bigair":
      return [R("MEGA RAMP")];
    case "loop":
      return [{ x: LOOPS[0].x, y: LOOPS[0].R, z: LOOPS[0].z, l: "THE LOOP" }];
    case "chase":
      return [
        {
          x: RIVALS[0].g.position.x,
          y: 1,
          z: RIVALS[0].g.position.z,
          l: "VEX · THE POD",
        },
      ];
    case "deck":
      return [pd("L")];
    case "launchday":
      return [pd("L"), { x: VIEWPOINT[0], y: 0, z: VIEWPOINT[1], l: "VIEW POINT" }];
    case "catch":
      return [{ x: VIEWPOINT[0], y: 0, z: VIEWPOINT[1], l: "VIEW POINT" }];
    case "jam":
      return [{ x: 96, y: 2, z: 300, l: "THE JAM" }, pd("A")];
    case "hover":
      return [pd("BOX")];
  }
  return [];
}
