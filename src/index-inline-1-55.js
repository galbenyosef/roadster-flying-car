// index-inline-1 55 — carstate
// Lines 95839-96147 of readable/index-inline-1.pretty.js (statement-aligned).
MISSION_REBUILD.T.bigair = (M, dt, ev, el) => {
  const left = 60 - el;
  if (
    ev &&
    ev.land != null &&
    ev.ramp &&
    ev.ramp.name === "MEGA RAMP" &&
    ev.clean
  ) {
    M.best = Math.max(M.best, ev.air);
    const off = Math.hypot(carState.x - BIG_AIR_ZONE.x, carState.z - BIG_AIR_ZONE.z),
      inZ = off < BIG_AIR_ZONE.r;
    if (ev.air >= 2 && inZ) {
      finish(
        true,
        `${ev.air.toFixed(2)} s in the air, ${off.toFixed(1)} m from the centre.`,
        { time: el },
      );
      return ["", ""];
    }
    flash(
      `${ev.air.toFixed(2)} s · ${inZ ? "in the zone" : carState.z < BIG_AIR_ZONE.z ? "too long" : "too short"}`,
      ev.air < 2
        ? "need 2.00 s of air"
        : carState.z < BIG_AIR_ZONE.z
          ? "a little less speed"
          : "a little more speed",
      1.8,
    );
  }
  if (!M.done && left <= 0) {
    finish(
      false,
      `Best was ${M.best.toFixed(2)} s. About 75 mph into the Mega Ramp lands in the zone.`,
      { time: null },
    );
    return ["", ""];
  }
  return [
    `Mega Ramp · 2.00 s of air AND land in the gold zone`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 11 LOOP THE LOOP v2: two full loops inside 60 s ---- */
MISSION_REBUILD.setup.loop = (d) => {
  currentMission.loops = 0;
  currentMission.back = true;
};
MISSION_REBUILD.T.loop = (M, dt, ev, el) => {
  const left = 60 - el,
    L = LOOPS[0];
  if (M.loops === 1 && !M.back && carState.z > L.z + 40) M.back = true;
  if (ev && ev.loop) {
    M.loops++;
    M.back = false;
    audio.chime();
    if (M.loops >= 2) {
      finish(true, "Two loops. Upside down twice and not a scratch.", {
        time: el,
      });
      return ["", ""];
    }
    flash("LOOP 1 ✓", "swing round and hit it again", 1.8);
  }
  if (!M.done && left <= 0) {
    finish(
      false,
      `Out of time after ${M.loops} loop${M.loops === 1 ? "" : "s"}.`,
      { time: null },
    );
    return ["", ""];
  }
  return [
    carState.loop
      ? "Hold the throttle, keep it rolling"
      : M.loops === 0
        ? "Line up with the yellow chevrons, 55 mph or more"
        : M.back
          ? "Loop 2: line up again, 55 mph or more"
          : "Loop 2: turn round, back to the entry",
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 12 SKY TOUR v2: a VIP on board who hates bumps, boost and hard landings ---- */
MISSION_REBUILD.setup.skytour = (d) => {
  currentMission.vip = 100;
  currentMission.ring = 0;
  TOUR_MARKERS.visible = true;
  TOUR_MARKERS.children.forEach((m, k) =>
    m.material.emissive.set(k === 0 ? 0xffb35c : 0x28e0ff),
  );
  PADS.forEach((p) => (p.beam.visible = false));
};
MISSION_REBUILD.T.skytour = (M, dt, ev, el) => {
  const left = 150 - el;
  const hit = impactTick(dt, ev);
  if (hit) {
    const c = Math.min(30, hit * 2.2);
    M.vip -= c;
    pop(`VIP SHAKEN −${Math.round(c)}%`, 0, true);
  }
  if (ev && ev.land != null && ev.land > 2) {
    const c = Math.min(40, (ev.land - 2) * 12);
    M.vip -= c;
    pop(`HARD LANDING · VIP −${Math.round(c)}%`, 0, true);
  }
  if (carState.thrust === 2 && !cinematic.on) {
    M.vip -= 7 * dt;
    M.bw = (M.bw || 0) + dt;
    if (M.bw > 0.6 && !M.bs) {
      M.bs = true;
      showSub("VIP", "Easy on the rocket, please. I just had lunch.", 3);
    }
  }
  const hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  if (hs > 40) M.vip -= 4 * dt;
  meter("VIP COMFORT", Math.max(0, M.vip), null, M.vip < 30);
  if (M.vip <= 0) {
    finish(
      false,
      "The VIP asked to be let out. Gentle: no boost, no bumps, soft landings.",
      { time: null },
    );
    return ["", ""];
  }
  if (M.ring < STOUR.length) {
    const R = STOUR[M.ring];
    if (Math.hypot(carState.x - R[0], carState.y + 0.5 - R[1], carState.z - R[2]) < 6.8) {
      TOUR_MARKERS.children[M.ring].material.emissive.set(0x3a4a55);
      M.ring++;
      carState.tank = Math.min(100, carState.tank + 25);
      audio.ping();
      pop("SKY RING · +25% AIR", 200);
      if (M.ring < STOUR.length)
        TOUR_MARKERS.children[M.ring].material.emissive.set(0xffb35c);
      else {
        PADS.forEach((p) => (p.beam.visible = p.label === "L"));
        flash("ALL RINGS", "now land on the tower deck, softly", 1.8);
      }
    }
  } else if (ev && ev.land != null && ev.pad && ev.pad.label === "L") {
    finish(
      true,
      `VIP delivered. Comfort ${Math.round(M.vip)}%. They want to do it again.`,
      { time: el, land: ev.land },
    );
    return ["", ""];
  }
  if (!M.done && left <= 0) {
    finish(false, "Out of time.", { time: null });
    return ["", ""];
  }
  return [
    M.ring < STOUR.length
      ? `Sky ring ${M.ring + 1} of ${STOUR.length} · ${STOUR[M.ring][3]} · no boost`
      : "Land on the TOWER DECK, softly",
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 13 STUNT SHOW v2: 15,000 points AND four different kinds of trick. One trick type caps at 5,000. ---- */
const STUNT_SHOW = { need: 15000, cap: 5000, types: 4, time: 75 },
  TRICK_KINDS = {
    AIR: "AIR",
    SPIN: "SPIN",
    DRIFT: "DRIFT",
    NEAR: "NEAR MISS",
    LOOP: "LOOP",
  };
MISSION_REBUILD.setup.stuntshow = (d) => {
  currentMission.tp = {};
  currentMission.pts = 0;
  MISSION_REBUILD.onTrick = (L) => {
    currentMission.tp[L.ty] = (currentMission.tp[L.ty] || 0) + L.got;
  };
};
function ssScore(M) {
  let s = 0,
    n = 0;
  for (const k in M.tp) {
    s += Math.min(STUNT_SHOW.cap, M.tp[k]);
    if (M.tp[k] > 0) n++;
  }
  return { s, n };
}
MISSION_REBUILD.T.stuntshow = (M, dt, ev, el) => {
  const left = STUNT_SHOW.time - el,
    { s, n } = ssScore(M),
    live = Math.round(SCORE.drift || 0),
    cur = s;
  meter(
    "SHOW",
    Math.min(100, (cur / STUNT_SHOW.need) * 100),
    `${cur.toLocaleString("en-US")} / ${STUNT_SHOW.need.toLocaleString("en-US")}`,
  );
  if (cur >= STUNT_SHOW.need && n >= STUNT_SHOW.types) {
    finish(
      true,
      `${cur.toLocaleString("en-US")} points from ${n} kinds of trick. The crowd is on its feet.`,
      { time: el, pts: cur },
    );
    return ["", ""];
  }
  if (left <= 0) {
    finish(
      false,
      `${cur.toLocaleString("en-US")} points, ${n} of ${STUNT_SHOW.types} trick types. Mix it up: air, spins, drifts, near misses, the loop.`,
      { time: null },
    );
    return ["", ""];
  }
  const miss = Object.keys(TRICK_KINDS)
    .filter((k) => !(M.tp[k] > 0))
    .map((k) => TRICK_KINDS[k]);
  return [
    `Tricks ${n}/${STUNT_SHOW.types}${n < STUNT_SHOW.types ? " · try: " + miss.slice(0, 3).join(", ") : ""}${live ? ` · drift +${live}` : ""}`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 14 HOT CELL (new): a prototype cell that only cools in the wind. Under 50 mph it cooks. ---- */
const HOT_CELL = {
  x: 99.2,
  z: 560,
  gx: 380,
  gz: 432,
  r: 6.5,
  time: 48,
  up: 10,
  down: 6,
  fan: 45,
};
MISSIONS.push({
  id: "hotcell",
  r: 2200,
  n: "14",
  t: "Hot Cell",
  b: "Megafab prototype cell on board. It only cools in the wind: under 50 mph it heats up fast. Through the jam, across town, stop at the Megafab gate. 48 s.",
  spawn: () => place(HOT_CELL.x, HOT_CELL.z, 0),
});
MISSION_REBUILD.setup.hotcell = (d) => {
  jamOn();
  currentMission.heat = 25;
  currentMission.stop = 0;
  DROP_ZONE.visible = true;
  zoneColor(0xff7a2a);
  DROP_ZONE.position.set(HOT_CELL.gx, 0, HOT_CELL.gz);
};
MISSION_REBUILD.T.hotcell = (M, dt, ev, el) => {
  const left = HOT_CELL.time - el,
    hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v),
    fast = hs * MPH >= 50;
  const gd = Math.hypot(HOT_CELL.gx - carState.x, HOT_CELL.gz - carState.z),
    fan = gd < HOT_CELL.fan;
  if (fan && !M.fan) {
    M.fan = true;
    pop("MEGAFAB COOLANT · STOP IN THE ZONE", 0);
  }
  if (!cinematic.on)
    M.heat = clamp(M.heat + (fast ? -HOT_CELL.down : fan ? -2 : HOT_CELL.up) * dt, 0, 100);
  meter("CELL HEAT", M.heat, `${Math.round(M.heat)}%`, M.heat > 70);
  if (M.heat > 80 && !fast) shake = Math.max(shake, 0.06);
  const inZ =
    Math.hypot(carState.x - HOT_CELL.gx, carState.z - HOT_CELL.gz) < HOT_CELL.r &&
    !carState.air &&
    Math.abs(carState.v) < 2.5;
  if (inZ) {
    M.stop += dt;
    if (M.stop > 0.6) {
      finish(
        true,
        `Cell delivered at ${Math.round(M.heat)}%. Megafab says thanks.`,
        { time: el },
      );
      return ["", ""];
    }
  } else M.stop = 0;
  if (M.heat >= 100) {
    audio.boom();
    shake = 0.6;
    finish(
      false,
      "Thermal runaway. Keep it over 50 mph: fly the jam flat out, drift the corners.",
      { time: null },
    );
    return ["", ""];
  }
  if (!M.done && left <= 0) {
    finish(false, "Out of time.", { time: null });
    return ["", ""];
  }
  return [
    fan
      ? "Coolant on · stop inside the orange zone"
      : `${fast ? "Cooling" : "HEATING! Faster"} · gate ${Math.round(gd)} m`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
};

/* ---- 15 LAUNCH DAY v2: start across town with less time ---- */
MISSION_REBUILD.setup.launchday = (d) => {
  resetLaunch(LAUNCH.cycle - 44);
  place(291.2, 288, -Math.PI / 2);
  PADS.forEach((p) => (p.beam.visible = p.label === "L"));
};

/* ---- the list: numbered by difficulty, every mission its own idea ---- */
