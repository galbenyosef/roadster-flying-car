// index-inline-1 54 — carstate
// Lines 95528-95838 of readable/index-inline-1.pretty.js (statement-aligned).
function syPaint(k) {
  RAMPS.forEach((r) => {
    const i = STUNT_YARD.findIndex((q) => q.n === r.name);
    if (i < 0) r.bar.color.setRGB(0.35, 0.38, 0.42);
    else if (i < k) r.bar.color.setRGB(0.35, 0.38, 0.42);
    else if (i === k) r.bar.color.setRGB(0.4, 3, 1.2);
    else r.bar.color.setRGB(3, 1.9, 0.3);
  });
}
MISSION_REBUILD.setup.ramps = (d) => {
  currentMission.step = 0;
  syPaint(0);
};
MISSION_REBUILD.T.ramps = (M, dt, ev, el) => {
  const left = 100 - el,
    C = STUNT_YARD[M.step];
  if (ev && ev.land != null && ev.ramp) {
    if (ev.ramp.name !== C.n) {
      if (!ev.clean)
        flash("HOVERED · NOT COUNTED", "wheels and boost only", 1.4);
      else flash("WRONG RAMP", `next: ${C.n} (the green one)`, 1.4);
    } else {
      const L = MISSION_REBUILD.lastSpin,
        spun = !!(L && clock - L.t < 0.4 && L.deg >= 360);
      const ok = ev.clean && ev.air >= C.air && (!C.spin || spun);
      if (ok) {
        M.step++;
        audio.chime();
        pop(`${C.n} ✓`, 300);
        if (M.step >= STUNT_YARD.length) {
          syPaint(STUNT_YARD.length);
          finish(
            true,
            "Four ramps, four tricks, in order. VEX is impressed. He will not say it.",
            { time: el },
          );
          return ["", ""];
        }
        syPaint(M.step);
        flash(`${C.n} ✓`, `next: ${STUNT_YARD[M.step].n} · ${STUNT_YARD[M.step].say}`, 1.8);
      } else
        flash(
          "NOT YET",
          !ev.clean
            ? "hovering does not count"
            : C.spin && !spun
              ? "land a full 360: steer hard the whole way, straighten before touchdown"
              : `${ev.air.toFixed(2)} s of air · need ${C.air.toFixed(1)} s: more speed`,
          1.8,
        );
    }
  }
  if (!M.done && left <= 0) {
    finish(false, `Out of time at ramp ${M.step + 1} of 4.`, { time: null });
    return ["", ""];
  }
  return [
    `Ramp ${M.step + 1} / 4 · ${C.n} · ${C.say}`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 06 RUNNING ON FUMES (was Pad to Pad): a leaking air tank, canisters on the streets, Pad B 45 m up ---- */
const CANS = [
  [0, 120],
  [-96, 96],
  [-48, 0],
  [-192, 48],
  [-96, -60],
  [0, -40],
  [-144, 96],
].map(([x, z]) => {
  const g = new THREE.Group(),
    c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.6, 20),
      glowMat(0x38d6ff, 3.4),
    );
  g.add(c);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16),
    new THREE.MeshStandardMaterial({
      color: 0xdfe6ee,
      metalness: 0.8,
      roughness: 0.25,
    }),
  );
  cap.position.y = 0.95;
  g.add(cap);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.07, 8, 40),
    glowMat(0x38d6ff, 2.2),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.7;
  g.add(ring);
  g.position.set(x, 1.5, z);
  return { g: prop(g), x, z };
});
const FUME_TUNE = { start: 18, leak: 0.4, can: 14, time: 75 };
MISSION_REBUILD.setup.pad = (d) => {
  MISSION_REBUILD.noRegen = MISSION_REBUILD.noServ = true;
  place(3.2, 150, 0);
  carState.tank = FUME_TUNE.start;
  currentMission.got = new Set();
  CANS.forEach((c) => {
    c.g.visible = true;
  });
  PADS.forEach((p) => (p.beam.visible = p.label === "B"));
};
MISSION_REBUILD.T.pad = (M, dt, ev, el) => {
  const left = FUME_TUNE.time - el;
  if (!cinematic.on) carState.tank = Math.max(0, carState.tank - FUME_TUNE.leak * dt);
  CANS.forEach((c, i) => {
    if (M.got.has(i)) return;
    c.g.rotation.y += dt * 1.6;
    c.g.position.y = 1.5 + Math.sin(clock * 2 + i) * 0.15;
    if (Math.hypot(carState.x - c.x, carState.z - c.z) < 3.6 && carState.y < 5) {
      M.got.add(i);
      c.g.visible = false;
      carState.tank = Math.min(100, carState.tank + FUME_TUNE.can);
      audio.chime();
      burst(c.x, 1.5, c.z, 24, 7);
      pop(`AIR CANISTER +${FUME_TUNE.can}%`, 150);
    }
  });
  meter("AIR · LEAKING", carState.tank, `${Math.round(carState.tank)}%`, carState.tank < 12);
  if (ev && ev.land != null && ev.pad && ev.pad.label === "B") {
    finish(
      true,
      `Made it to the repair crew with ${Math.round(carState.tank)}% air left.`,
      { time: el, land: ev.land },
    );
    return ["", ""];
  }
  if (!M.done && left <= 0) {
    finish(
      false,
      "Out of time. Grab the blue canisters on the streets, then climb to Pad B.",
      { time: null },
    );
    return ["", ""];
  }
  if (carState.y < 6) M.down = true;
  if (!M.down)
    return [
      carState.armed
        ? `Hover off the roof · hold ${KEY_LABELS("brake")} to drop faster`
        : `${KEY_LABELS("rocket")} for ROCKET MODE, then hover off the roof`,
      `${Math.max(0, left).toFixed(1)} s left`,
    ];
  const need = carState.air
    ? ""
    : carState.tank < 22
      ? ` · grab canisters (${M.got.size}/${CANS.length})`
      : "";
  return [
    `Reach PAD B (45 m up)${need}`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 07 TRUCK JUMP v2: clear the haulers, then stop in the gold box before the junction ---- */
const TRUCK_JUMP_ZONE = { x: -668.8, z: -206, r: 7 };
MISSION_REBUILD.setup.truck = (d) => {
  RAMPS.forEach((r) => {
    if (r.name === "TRUCK JUMP") r.bar.color.setRGB(0.4, 3, 1.2);
  });
  currentMission.cleared = false;
  DROP_ZONE.visible = false;
};
MISSION_REBUILD.T.truck = (M, dt, ev, el) => {
  const left = 40 - el;
  if (!M.cleared) {
    if (
      ev &&
      ev.land != null &&
      ev.ramp &&
      ev.ramp.name === "TRUCK JUMP" &&
      ev.air > 0.8 &&
      ev.clean &&
      carState.z < -146
    ) {
      M.cleared = true;
      M.ct = el;
      audio.chime();
      pop("CLEARED THE HAULERS", 500);
      DROP_ZONE.visible = true;
      zoneColor(0xffc24a);
      DROP_ZONE.position.set(TRUCK_JUMP_ZONE.x, 0, TRUCK_JUMP_ZONE.z);
      flash("NOW STOP", "in the gold box · 5 s", 1.6);
    }
  } else {
    const inZ =
      Math.hypot(carState.x - TRUCK_JUMP_ZONE.x, carState.z - TRUCK_JUMP_ZONE.z) < TRUCK_JUMP_ZONE.r - 0.8 &&
      !carState.air &&
      Math.abs(carState.v) < 1;
    if (inZ) {
      finish(true, "Three haulers, zero scratches, parked in the box.", {
        time: el,
      });
      return ["", ""];
    }
    if (el - M.ct > 5) {
      finish(
        false,
        "Cleared the trucks, but missed the box. Brake as soon as you land.",
        { time: null },
      );
      return ["", ""];
    }
  }
  if (!M.done && left <= 0) {
    finish(false, "Out of time. Take a longer run-up: the ramp needs speed.", {
      time: null,
    });
    return ["", ""];
  }
  return [
    M.cleared
      ? `STOP in the gold box · ${Math.max(0, 5 - (el - M.ct)).toFixed(1)} s`
      : "Hit the street ramp fast and clear all three haulers",
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 08 CATCH VEX v2: he is about twice as fast now and boosts when you get close ---- */
var VEX_TUNE = {
  cruise: 72,
  rb: 1.5,
  boost: 96,
  c0: 22,
  c1: 0.62,
  dec: 20,
  a: 16,
  ab: 24,
  gap: 200,
  trig: 42,
  cd: 9,
};

/* ---- 09 HOT PADS (was Rooftop Relay): pads light up in a random order, each on its own countdown ---- */
MISSION_REBUILD.setup.relay = (d) => {
  const o = ["A", "B", "C"].sort(() => Math.random() - 0.5);
  o.push("BOX");
  Object.assign(currentMission, { seq: o, step: 0, bonus: 0 });
  hpNext(currentMission);
};
function hpNext(M) {
  const l = M.seq[M.step],
    p = PADS.find((q) => q.label === l);
  PADS.forEach((q) => (q.beam.visible = q === p));
  const d = Math.hypot(p.x - carState.x, p.y - carState.y, p.z - carState.z);
  M.leg = 10 + d / 12 + M.bonus;
  M.bonus = 0;
}
MISSION_REBUILD.T.relay = (M, dt, ev, el) => {
  const l = M.seq[M.step],
    p = PADS.find((q) => q.label === l);
  if (!cinematic.on) M.leg -= dt;
  if (ev && ev.land != null && ev.pad === p) {
    const off = Math.hypot(carState.x - p.x, carState.z - p.z);
    M.step++;
    audio.chime();
    if (off < 2.5) {
      M.bonus = 2;
      pop("BULLSEYE · +2 s", 300);
    }
    if (M.step >= M.seq.length) {
      finish(
        true,
        `Four hot pads${off < 2.5 ? ", bullseye on the last" : ""}.`,
        { time: el, land: ev.land },
      );
      return ["", ""];
    }
    hpNext(M);
    flash(
      `PAD ${l} ✓`,
      `next: ${M.seq[M.step] === "BOX" ? "THE BOX" : "PAD " + M.seq[M.step]} · ${M.leg.toFixed(0)} s`,
      1.6,
    );
  }
  meter(
    "PAD CLOCK",
    Math.min(100, (M.leg / 14) * 100),
    `${Math.max(0, M.leg).toFixed(1)} s`,
    M.leg < 4,
  );
  if (M.leg <= 0) {
    finish(false, `PAD ${l} went cold. Fly straight at it and land early.`, {
      time: null,
    });
    return ["", ""];
  }
  return [
    `${l === "BOX" ? "Land in THE BOX" : "Land on PAD " + l} (${M.step + 1}/4)`,
    `${el.toFixed(1)} s`,
  ];
};

/* ---- 10 BIG AIR v2: two seconds of air AND land in the gold zone. Too fast overshoots. ---- */
const BIG_AIR_ZONE = { x: -610, z: -104, r: 8 };
MISSION_REBUILD.setup.bigair = (d) => {
  RAMPS.forEach((r) => {
    if (r.name === "MEGA RAMP") r.bar.color.setRGB(0.4, 3, 1.2);
  });
  DROP_ZONE.visible = true;
  zoneColor(0xffc24a);
  DROP_ZONE.position.set(BIG_AIR_ZONE.x, 0, BIG_AIR_ZONE.z);
  currentMission.best = 0;
};
