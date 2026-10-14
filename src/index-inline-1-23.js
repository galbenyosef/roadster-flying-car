// index-inline-1 23 — currentmission
// Lines 85178-85624 of readable/index-inline-1.pretty.js (statement-aligned).
function missionTick(dt, ev) {
  if (!currentMission || currentMission.done) return;
  const d = currentMission.def,
    el = clock - currentMission.t0;
  let obj = "",
    tt = "";
  if (d.id === "jam") {
    const left = 90 - el,
      early = false;
    obj =
      carState.armed && carState.air
        ? "Land on the PAD A roof · follow the beam"
        : early
          ? ""
          : carState.armed
            ? isTouch
              ? "Hold HOVER to lift off"
              : "Hold SPACE to lift off"
            : "Fly over the jam to the PAD A roof";
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.land != null && ev.pad && ev.pad.label === "A")
      finish(true, "Over the jam and onto the roof. Mae saw the whole thing.", {
        time: el,
        land: ev.land,
      });
    else if (!currentMission.done && left <= 0)
      finish(
        false,
        "Out of time. Open the plate, then hold to climb over the traffic.",
        { time: null },
      );
  }
  if (d.id === "launch_v0") {
    if (!currentMission.started && carState.v > 0.3) {
      currentMission.started = true;
      currentMission.ts = clock;
    }
    const t = currentMission.started ? clock - currentMission.ts : 0;
    obj = carState.armed
      ? carState.spool < 1.2
        ? "Spooling…"
        : "ROCKET MODE: hold B + W"
      : isTouch
        ? "Tap ROCKET to open the plate"
        : "Press SHIFT to open the plate";
    tt = `${t.toFixed(2)} s`;
    if (currentMission.started && carState.v * MPH >= 60)
      finish(
        t < 1.5,
        t < 1.5
          ? "0–60 mph under 1.5 s."
          : "Too slow. Use the launch assist: ROCKET MODE (SPACE + X), then hold B with W.",
        { time: t },
      );
    else if (currentMission.started && t > 4)
      finish(false, "Did not reach 60 mph in time.", { time: t });
  }
  if (d.id === "hover") {
    const agl = carState.y - groundH(carState.x, carState.z, carState.y).h;
    if (carState.air && agl >= 3) currentMission.hover += dt;
    obj =
      currentMission.hover < 8
        ? `Hold 3 m or higher: ${Math.min(8, currentMission.hover).toFixed(1)} / 8.0 s`
        : "Now land inside the BOX";
    tt = `${el.toFixed(1)} s`;
    if (ev && ev.land != null) {
      if (currentMission.hover >= 8 && ev.pad && ev.pad.label === "BOX")
        finish(true, "Clean landing in the box.", { time: el, land: ev.land });
      else if (currentMission.hover >= 8)
        flash("MISSED THE BOX", "lift off again and land inside it");
    }
  }
  if (d.id === "pad_v0") {
    const left = 60 - el;
    obj = "Fly to PAD B (follow the beam) and land on it";
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.land != null && ev.pad && ev.pad.label === "B")
      finish(true, "Landed on Pad B.", { time: el, land: ev.land });
    else if (left <= 0) finish(false, "Out of time.", { time: null });
  }
  if (d.id === "rings_v0") {
    tt = `${el.toFixed(1)} s`;
    if (currentMission.ring < RINGS.length) {
      const r = RINGS[currentMission.ring];
      obj = `Ring ${currentMission.ring + 1} of ${RINGS.length}`;
      if ((prevZ - r.z) * (carState.z - r.z) <= 0 && prevZ !== carState.z) {
        const dd = Math.hypot(carState.x - r.x, carState.y + 0.6 - r.y);
        if (dd < 4.6) {
          r.m.material.emissive.set(0x3a4a55);
          currentMission.ring++;
          audio.ping();
          if (currentMission.ring < RINGS.length)
            RINGS[currentMission.ring].m.material.emissive.set(0xffb35c);
          flash(`RING ${currentMission.ring}/${RINGS.length}`, "", 1);
        } else flash("MISSED RING", "turn around and go through it", 1.6);
      }
    } else {
      obj = "All rings done: land on Pad C";
      if (ev && ev.land != null && ev.pad && ev.pad.label === "C")
        finish(true, "All rings, clean landing on Pad C.", {
          time: el,
          land: ev.land,
        });
    }
  }
  if (d.id === "drift") {
    const left = 45 - el,
      cur = Math.round(currentMission.pts + SCORE.drift);
    obj = `Drift points: ${cur.toLocaleString("en-US")} / 4,000`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (cur >= 4000)
      finish(true, "Drift King. The rear end does what you say.", { time: el });
    else if (left <= 0)
      finish(false, `Out of time at ${cur.toLocaleString("en-US")} points.`, {
        time: null,
      });
  }
  if (d.id === "relay_v0") {
    const seq = ["A", "C", "B"],
      left = 120 - el,
      tgt = seq[currentMission.step];
    obj = `Land on PAD ${tgt} (${currentMission.step + 1}/3)`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.land != null && ev.pad && ev.pad.label === tgt) {
      currentMission.step++;
      audio.chime();
      if (currentMission.step >= 3)
        finish(true, "Three rooftops, three clean landings.", {
          time: el,
          land: ev.land,
        });
      else {
        flash(`PAD ${tgt} DONE`, `next: PAD ${seq[currentMission.step]}`, 1.6);
        PADS.forEach((p) => (p.beam.visible = p.label === seq[currentMission.step]));
      }
    } else if (left <= 0) finish(false, "Out of time.", { time: null });
  }
  if (d.id === "deck") {
    const Lc = LAUNCH,
      tz =
        Lc.st === "idle" ? Lc.cycle - Lc.t : Lc.st === "count" ? 10 - Lc.t : 0;
    if (!currentMission.onDeck) {
      obj = "Land on the TOWER DECK before T-0";
      tt = `T-${Math.max(0, tz).toFixed(1)} s`;
      if (ev && ev.land != null && ev.pad && ev.pad.label === "L") {
        currentMission.onDeck = true;
        audio.chime();
        flash("FRONT ROW SEAT", "stay on the deck · liftoff soon", 2.2);
      } else if (Lc.st === "up")
        finish(false, "The rocket left without you.", { time: null });
    } else {
      obj = "Stay on the deck. Enjoy the show.";
      tt =
        Lc.st === "up"
          ? `T+${Lc.t.toFixed(1)} s`
          : `T-${Math.max(0, tz).toFixed(1)} s`;
      if (Lc.st === "up" && !currentMission.shown) {
        currentMission.shown = true;
        if (!cinematic.on) startShow("launch");
      }
      if (Lc.st === "up" && Lc.y > 320 && !cinematic.on)
        finish(true, "You watched it go from 100 m up.", { time: el });
    }
  }
  if (d.race) {
    const G = RACE.gates;
    if (currentMission.rs === "grid") {
      currentMission.gt += dt;
      const n = 3 - Math.floor(currentMission.gt - 0.4);
      if (currentMission.gt > 0.4 && n >= 1 && currentMission.lastN !== n) {
        currentMission.lastN = n;
        flash(String(n), "", 0.8);
        audio.ping();
      }
      if (currentMission.gt >= 3.4) {
        currentMission.rs = "run";
        currentMission.t0 = clock;
        flash("GO!", "", 1);
        audio.ignite();
        setTimeout(() => radio("VEX", "start", true), 900);
      }
      obj = "Get ready";
      tt = "";
    } else {
      currentMission.sp = projS(carState.x, carState.z, currentMission.sp);
      const g = G[currentMission.cp];
      if (Math.hypot(carState.x - g.x, carState.z - g.z) < 12 && carState.y < 14) {
        currentMission.cp++;
        audio.ping();
        if (currentMission.cp >= G.length) {
          currentMission.cp = 0;
          currentMission.lap++;
          if (currentMission.lap < RACE.laps) {
            flash("FINAL LAP", "", 1.4);
            radio(
              ["VEX", "RAZOR", "GHOST"][(Math.random() * 3) | 0],
              "lastlap",
              true,
            );
          }
        }
      }
      const rel = (((currentMission.sp - RACE.off) % RACE.len) + RACE.len) % RACE.len,
        base = currentMission.cp === 0 && rel > RACE.len * 0.6 ? rel - RACE.len : rel;
      currentMission.pprog = currentMission.lap * RACE.len + base;
      const pos = 1 + RIVALS.filter((r) => r.prog > currentMission.pprog).length;
      currentMission.pos = pos;
      radioRace(pos);
      pfCheck();
      G.forEach((q, i) =>
        q.m.color.setRGB(...(i === currentMission.cp ? [3, 2.1, 0.4] : [0.25, 1.6, 1.9])),
      );
      obj = `LAP ${Math.min(RACE.laps, currentMission.lap + 1)}/${RACE.laps} · POSITION ${pos}/${RIVALS.length + 1}`;
      tt = `${el.toFixed(1)} s`;
      if (currentMission.lap >= RACE.laps) {
        const need = currentMission.story != null || RACE.final ? 1 : 3;
        radio("VEX", pos === 1 ? "win" : "lose", true);
        finish(
          pos <= need,
          pos === 1
            ? RACE.final
              ? "You beat VEX on his own Strip. The night is yours."
              : "First across the line. The Chrome Kings are speechless."
            : `Finished P${pos}.` +
                (pos > need ? " Only a win counts here: try again." : ""),
          { time: el, pos },
        );
      }
    }
  }
  if (d.id === "courier_v0") {
    const left = 120 - el,
      Q = DROPS[Math.min(currentMission.step, DROPS.length - 1)];
    obj = `Drop ${currentMission.step + 1} of ${DROPS.length}: stop inside the blue zone`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    DROP_ZONE.position.set(Q[0], 0, Q[1]);
    if (
      Math.hypot(carState.x - Q[0], carState.z - Q[1]) < 6 &&
      !carState.air &&
      Math.abs(carState.v) < 2.5
    ) {
      currentMission.dz += dt;
      if (currentMission.dz > 0.4) {
        currentMission.dz = 0;
        currentMission.step++;
        audio.chime();
        pop("DELIVERED", 300);
        if (currentMission.step >= DROPS.length) {
          DROP_ZONE.visible = false;
          finish(true, "Three orders, all still hot.", { time: el });
        } else flash(`DROP ${currentMission.step} DONE`, `next: drop ${currentMission.step + 1}`, 1.4);
      }
    } else currentMission.dz = 0;
    if (!currentMission.done && left <= 0)
      finish(false, "The food got cold. Out of time.", { time: null });
  }
  if (d.id === "ramps_v0") {
    const left = 75 - el;
    obj = `Ramps cleared: ${currentMission.hit.size} / 4 · land every jump`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (
      ev &&
      ev.land != null &&
      ev.ramp &&
      ev.clean &&
      ev.air > 0.5 &&
      !currentMission.hit.has(ev.ramp.name)
    ) {
      currentMission.hit.add(ev.ramp.name);
      ev.ramp.bar.color.setRGB(0.35, 0.38, 0.42);
      audio.chime();
      flash(`${ev.ramp.name} ✓`, `${currentMission.hit.size} of 4`, 1.3);
      if (currentMission.hit.size >= 4)
        finish(
          true,
          "Four ramps, four clean landings. VEX is impressed. He will not say it.",
          { time: el },
        );
    }
    if (!currentMission.done && left <= 0)
      finish(false, `Out of time at ${currentMission.hit.size} of 4 ramps.`, { time: null });
  }
  if (d.id === "chase") {
    const v = RIVALS[0];
    if (currentMission.rs === "grid") {
      currentMission.gt += dt;
      obj = "VEX is about to bolt…";
      tt = "";
      if (currentMission.gt > 2.2) {
        currentMission.rs = "run";
        currentMission.t0 = clock;
        flash("GO", "catch him · touch his bumper", 1.2);
        audio.ignite();
      }
    } else {
      [obj, tt] = chaseTick(currentMission, dt, el);
    }
  }
  if (d.id === "skytour_v0") {
    tt = `${el.toFixed(1)} s`;
    if (currentMission.ring < STOUR.length) {
      const R = STOUR[currentMission.ring];
      obj = `Sky ring ${currentMission.ring + 1} of ${STOUR.length} · ${R[3]}`;
      if (Math.hypot(carState.x - R[0], carState.y + 0.5 - R[1], carState.z - R[2]) < 6.8) {
        TOUR_MARKERS.children[currentMission.ring].material.emissive.set(0x3a4a55);
        currentMission.ring++;
        carState.tank = Math.min(100, carState.tank + 25);
        audio.ping();
        pop("SKY RING · +25% AIR", 200);
        if (currentMission.ring < STOUR.length)
          TOUR_MARKERS.children[currentMission.ring].material.emissive.set(0xffb35c);
        else {
          PADS.forEach((p) => (p.beam.visible = p.label === "L"));
          flash("ALL RINGS", "now land on the tower deck", 1.8);
        }
      }
    } else {
      obj = "Land on the TOWER DECK";
      if (ev && ev.land != null && ev.pad && ev.pad.label === "L")
        finish(true, "VIP delivered to the tower deck. Smooth.", {
          time: el,
          land: ev.land,
        });
    }
  }
  if (d.id === "catch") {
    const Lc = LAUNCH,
      tl = Lc.st === "gone" ? 29 - Lc.t : Lc.st === "down" ? 15 - Lc.t : 0,
      inZ =
        Math.hypot(carState.x - VIEWPOINT[0], carState.z - VIEWPOINT[1]) < 6 &&
        !carState.air &&
        Math.abs(carState.v) < 2.5;
    obj = inZ
      ? "In position. Watch it land."
      : "Reach the gold VIEW POINT and stop inside it";
    tt =
      Lc.st === "landed" ? "" : `TOUCHDOWN IN ${Math.max(0, tl).toFixed(1)} s`;
    if (Lc.st === "down" && Lc.t >= 7.5 && !currentMission.shown && !cinematic.on) {
      currentMission.shown = true;
      if (inZ || Math.hypot(carState.x - VIEWPOINT[0], carState.z - VIEWPOINT[1]) < 60) startShow("land");
    }
    if (Lc.st === "landed" && !currentMission.res) {
      currentMission.res = true;
      if (Math.hypot(carState.x - LAUNCH_SITE.lz.x, carState.z - LAUNCH_SITE.lz.z) < 26)
        finish(false, "Too close! Never stand on the landing zone.", {
          time: null,
        });
      else if (inZ)
        finish(true, "Touchdown, dead centre. You saw it all.", { time: el });
      else
        finish(false, "Missed it. Be inside the VIEW POINT before touchdown.", {
          time: null,
        });
    }
  }
  if (d.id === "truck_v0") {
    const left = 40 - el;
    obj = "Hit the street ramp fast and clear all three haulers";
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (
      ev &&
      ev.land != null &&
      ev.ramp &&
      ev.ramp.name === "TRUCK JUMP" &&
      ev.air > 0.8 &&
      ev.clean &&
      carState.z < -146
    )
      finish(true, "Three haulers, zero scratches.", { time: el });
    else if (!currentMission.done && left <= 0)
      finish(
        false,
        "Out of time. Take a longer run-up: the ramp needs speed.",
        { time: null },
      );
  }
  if (d.id === "bigair_v0") {
    const left = 60 - el;
    if (ev && ev.land != null && ev.ramp && ev.clean) {
      currentMission.best = Math.max(currentMission.best, ev.air);
      if (ev.air >= 2)
        finish(
          true,
          `${ev.air.toFixed(2)} s in the air. That is a lot of nothing.`,
          { time: el },
        );
      else
        flash(
          `${ev.air.toFixed(2)} s`,
          "not enough: more speed into the Mega Ramp",
          1.6,
        );
    }
    obj = `Best jump: ${currentMission.best.toFixed(2)} s · need 2.00 s`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (!currentMission.done && left <= 0)
      finish(
        false,
        `Best was ${currentMission.best.toFixed(2)} s. Hit the Mega Ramp flat out.`,
        { time: null },
      );
  }
  if (d.id === "loop_v0") {
    const left = 45 - el;
    obj = carState.loop
      ? "Hold the throttle, keep it rolling"
      : "Line up with the yellow chevrons, 55 mph or more";
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.loop)
      finish(true, "Upside down at speed, and back on four wheels.", {
        time: el,
      });
    else if (!currentMission.done && left <= 0)
      finish(false, "Out of time. Take a longer run-up at the loop.", {
        time: null,
      });
  }
  if (d.id === "stuntshow_v0") {
    const left = 60 - el,
      cur = Math.round(currentMission.pts + SCORE.drift);
    obj =
      `Stunt points: ${cur.toLocaleString("en-US")} / 5,000` +
      (COMBO.n >= 2 ? ` · ×${COMBO.mult.toFixed(1).replace(".0", "")}` : "");
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (cur >= 5000) finish(true, "The crowd is on its feet.", { time: el });
    else if (left <= 0)
      finish(false, `Out of time at ${cur.toLocaleString("en-US")} points.`, {
        time: null,
      });
  }
  if (MISSION_REBUILD.T[d.id]) {
    const r = MISSION_REBUILD.T[d.id](currentMission, dt, ev, el);
    if (r) [obj, tt] = r;
  }
  if (d.id === "tutorial") [obj, tt] = tutTick(currentMission, dt, ev, el);
  if (d.id === "launchday") [obj, tt] = launchDayTick(currentMission, dt, ev, el);
  if (d.id === "daily") [obj, tt] = dailyTick(currentMission, el);
  prevZ = carState.z;
  setT("mobj", touchText(objHelp(d, obj)));
  setT(
    "mtime",
    tt +
      (CHAL.on && currentMission && currentMission.def.id === CHAL.on.id && tt
        ? ` · beat ${CHAL.on.t.toFixed(2)} s`
        : ""),
  );
}
