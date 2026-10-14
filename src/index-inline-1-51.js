// index-inline-1 51 — math
// Lines 94533-94837 of readable/index-inline-1.pretty.js (statement-aligned).
MISSION_REBUILD.T.launch = (M, dt, ev, el) => {
  const R = RIVALS[1];
  R.g.visible = true;
  if (M.rs === "stage") {
    const ready = carState.armed && carState.spool >= 1.2 && !cinematic.on;
    M.tr += ready ? dt : 0;
    M.st = (M.st || 0) + dt;
    if (!ready && M.st > 9) M.tr += dt;
    if (Math.abs(carState.v) > 0.6 && M.tr > 0) {
      M.jump = true;
    }
    if (M.tr > 0) {
      if (!M.clr) {
        M.clr = 1;
        flashT = 0;
        byId("msgbig").textContent = "";
        byId("msgsmall").textContent = "";
      }
      const n = M.tr < 0.5 ? 1 : M.tr < 1 ? 2 : M.tr < 1.5 ? 3 : 3;
      treeSet(n);
      if (!M.gw) M.gw = 1.5 + 0.45 + Math.random() * 0.6;
      if (M.tr >= M.gw && !M.jump) {
        M.rs = "run";
        M.go = clock;
        treeSet(4);
        audio.ignite();
        shake = Math.max(shake, 0.15);
      }
    }
    if (M.jump) {
      treeSet(M.tr < 0.5 ? 1 : M.tr < 1 ? 2 : 3, true);
      audio.fail();
      finish(
        false,
        "Jump start: you rolled before the green. Wait for green, then go.",
        { time: null },
      );
      return ["", ""];
    }
    if (M.tr <= 0)
      return [
        carState.armed
          ? carState.spool < 1.2
            ? "Spooling the thrusters…"
            : "Hold still · watch the lights"
          : `Stage: press ${KEY_LABELS("rocket")} for ROCKET MODE, then wait`,
        "STAGING",
      ];
    return ["Wait for GREEN · do not move", "STAGED"];
  }
  // the run
  const t = clock - M.go;
  if (M.rt == null && carState.v > 0.6) M.rt = t;
  if (t > M.react && M.rdone == null) {
    R.sp = Math.min(106, R.sp + razorAcc(R.sp) * dt);
    M.rz -= R.sp * dt;
    if (M.rz <= DRAG.z1) M.rdone = t - (DRAG.z1 - M.rz) / Math.max(1, R.sp);
  } else if (M.rdone != null) {
    R.sp = Math.max(0, R.sp - 12 * dt);
    M.rz -= R.sp * dt;
  }
  R.g.position.set(DRAG.rx, 0, M.rz);
  R.spin -= (R.sp / 0.36) * dt;
  rivalWheels();
  if (M.pdone == null && carState.z <= DRAG.z1) {
    M.pdone = t;
    M.trap = Math.abs(carState.v || Math.hypot(carState.vx, carState.vz)) * MPH;
  }
  if (t > 1.2) {
    const el2 = byId("tree");
    if (el2) el2.classList.remove("on");
  }
  const pd = M.pdone,
    rd = M.rdone;
  if (pd != null && (rd == null || pd <= rd)) {
    const by = rd != null ? rd - pd : null;
    finish(
      true,
      `You beat RAZOR${by != null ? ` by ${by.toFixed(2)} s` : ""}. Reaction ${(M.rt || 0).toFixed(2)} s · ${pd.toFixed(2)} s @ ${Math.round(M.trap)} mph.`,
      { time: pd },
    );
    return ["", ""];
  }
  if (rd != null && (pd != null || t > rd + 3)) {
    finish(
      false,
      `RAZOR took it in ${rd.toFixed(2)} s${pd != null ? ` · you ran ${pd.toFixed(2)} s` : ""}. Launch on green and hold BOOST all the way.`,
      { time: null },
    );
    return ["", ""];
  }
  if (t > 20) {
    finish(false, "Too slow off the line.", { time: null });
    return ["", ""];
  }
  const gap = carState.z - M.rz;
  return [
    carState.armed
      ? `Hold ${KEY_LABELS("boost")} + ${KEY_LABELS("gas")} · ${gap > 0 ? "RAZOR ahead " + gap.toFixed(0) + " m" : "you lead by " + (-gap).toFixed(0) + " m"}`
      : `Open the plate: ${KEY_LABELS("rocket")}`,
    `${t.toFixed(2)} s`,
  ];
};

/* ---- 02 ROGUE DRONE v2: a faster drone on a 1.5 km loop over the streets, a tether lock and a docking film ---- */
// corners sit on intersections so the loop flies down the street canyons, never through a tower
const DRN2_PTS = [
  [150, 350, 22],
  [96, 384, 26],
  [0, 384, 30],
  [0, 192, 40],
  [-192, 192, 48],
  [-192, 0, 40],
  [0, 0, 34],
  [192, 0, 44],
  [192, 288, 36],
];
const DRONE_RING = (() => {
  const P = [];
  DRN2_PTS.forEach((p, i) => {
    const q = DRN2_PTS[(i + 1) % DRN2_PTS.length],
      d = Math.hypot(q[0] - p[0], q[1] - p[1]),
      n = Math.max(1, Math.round(d / 36));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      P.push(
        vec3(lerp(p[0], q[0], u), lerp(p[2], q[2], u), lerp(p[1], q[1], u)),
      );
    }
  });
  const c = new THREE.CatmullRomCurve3(P, true, "centripetal");
  const pts = c.getSpacedPoints(900);
  for (const q of pts) {
    let roof = 0;
    for (let a = -5; a <= 5; a += 2.5)
      for (let b = -5; b <= 5; b += 2.5)
        roof = Math.max(roof, groundH(q.x + a, q.z + b, 999).h);
    q.y = Math.max(q.y, roof + 9);
  }
  for (let k = 0; k < 4; k++)
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length],
        b = pts[(i + 1) % pts.length];
      pts[i].y = Math.max(pts[i].y, (a.y + b.y) / 2 - 0.8);
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
function drn2At(s) {
  const P = DRONE_RING;
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
const DRONE_SPEEDS = {
  base: 19,
  dart: 30,
  tired: 13,
  dartT: 2.4,
  tiredT: 3.2,
  near: 15,
  juke: 14,
  lockR: 7,
  holdR: 12,
  lockT: 1.2,
  time: 120,
  s0: 70,
};
// the old helpers now point at the new loop, so the opening film hands over cleanly
drnAt = function (s) {
  return drn2At(DRONE_SPEEDS.s0 + s);
};
droneReset = function () {
  Object.assign(DRONE, {
    s: DRONE_SPEEDS.s0,
    y: 0,
    dock: 0,
    att: false,
    gt: 0,
    st: false,
    mode: "cruise",
    mt: 0,
    lock: 0,
    jt: 0,
    jx: 0,
    jy: 0,
    jz: 0,
    ox: 0,
    oy: 0,
    oz: 0,
    snap: 0,
  });
  DRONE.g.position.copy(drn2At(DRONE_SPEEDS.s0));
  DRONE.g.visible = false;
};
function dockPos() {
  return vec3(carState.x, carState.y + 2.4, carState.z);
}
function dockCut(onEnd) {
  const d0 = DRONE.g.position.clone(),
    c = vec3(carState.x, carState.y, carState.z),
    yaw = carState.yaw,
    y0 = DRONE.g.rotation.y,
    tc = clock;
  const def = {
    dur: 3.4,
    setup() {},
    cues: [
      [
        0.05,
        () => {
          audio.servo();
          flash("TETHER LOCK", "reeling her in", 1.4);
        },
      ],
      [0.9, () => audio.servo()],
      [
        2.15,
        () => {
          audio.hit();
          shake = Math.max(shake, 0.3);
          const p = dockPos();
          burst(p.x, p.y - 0.3, p.z, 46, 8);
          flash("DRONE DOCKED", "six pies · not one crumb", 1.8);
        },
      ],
    ],
    cam(t) {
      const u = easeIO(clamp((t - 0.3) / 1.8)),
        p = dockPos(),
        g = DRONE.g;
      g.position.copy(d0.clone().lerp(p, u));
      g.position.y += Math.sin(u * Math.PI) * 1.1;
      g.rotation.set(0, lerp(y0, yaw, u), 0);
      drnSpin(tc + t, u < 1);
      if (t < 2.2)
        beam(
          vec3(c.x, c.y + 1.15, c.z),
          g.position.clone().add(vec3(0, -0.45, 0)),
          true,
          1.5,
        );
      else BEAM.visible = false;
      const a = yaw + 0.9 + t * 0.5,
        r = lerp(9, 6.8, easeIO(clamp(t / 3.4))),
        mid = g.position.clone().lerp(vec3(c.x, c.y + 1, c.z), 0.55);
      return {
        p: vec3(
          c.x + Math.sin(a) * r,
          c.y + lerp(3.4, 2.1, u),
          c.z + Math.cos(a) * r,
        ),
        tg: mid,
        fov: lerp(46, 40, u),
      };
    },
  };
  startCut(def, () => {
    BEAM.visible = false;
    begin();
    byId("mission").hidden = false;
    phase = "play";
    if (currentMission) currentMission.t0 += clock - tc;
    snapCam();
    onEnd && onEnd();
  });
}
MISSION_REBUILD.setup.drone = (d) => {
  Object.assign(DRONE, {
    s: DRONE_SPEEDS.s0,
    y: 0,
    dock: 0,
    att: false,
    gt: 0,
    st: false,
    mode: "cruise",
    mt: 0,
    lock: 0,
    jt: 0,
    jx: 0,
    jy: 0,
    jz: 0,
    ox: 0,
    oy: 0,
    oz: 0,
    snap: 0,
  });
  DRONE.g.visible = true;
  DRONE.g.position.copy(drn2At(DRONE_SPEEDS.s0));
};
