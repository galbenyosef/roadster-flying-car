// index-inline-1 23 — finish
// Lines 85178-85624 of readable/index-inline-1.pretty.js (statement-aligned).
function missionTick(dt, ev) {
  if (!M || M.done) return;
  const d = M.def,
    el = clock - M.t0;
  let obj = "",
    tt = "";
  if (d.id === "jam") {
    const left = 90 - el,
      early = false;
    obj =
      S.armed && S.air
        ? "Land on the PAD A roof · follow the beam"
        : early
          ? ""
          : S.armed
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
    else if (!M.done && left <= 0)
      finish(
        false,
        "Out of time. Open the plate, then hold to climb over the traffic.",
        { time: null },
      );
  }
  if (d.id === "launch_v0") {
    if (!M.started && S.v > 0.3) {
      M.started = true;
      M.ts = clock;
    }
    const t = M.started ? clock - M.ts : 0;
    obj = S.armed
      ? S.spool < 1.2
        ? "Spooling…"
        : "ROCKET MODE: hold B + W"
      : isTouch
        ? "Tap ROCKET to open the plate"
        : "Press SHIFT to open the plate";
    tt = `${t.toFixed(2)} s`;
    if (M.started && S.v * MPH >= 60)
      finish(
        t < 1.5,
        t < 1.5
          ? "0–60 mph under 1.5 s."
          : "Too slow. Use the launch assist: ROCKET MODE (SPACE + X), then hold B with W.",
        { time: t },
      );
    else if (M.started && t > 4)
      finish(false, "Did not reach 60 mph in time.", { time: t });
  }
  if (d.id === "hover") {
    const agl = S.y - groundH(S.x, S.z, S.y).h;
    if (S.air && agl >= 3) M.hover += dt;
    obj =
      M.hover < 8
        ? `Hold 3 m or higher: ${Math.min(8, M.hover).toFixed(1)} / 8.0 s`
        : "Now land inside the BOX";
    tt = `${el.toFixed(1)} s`;
    if (ev && ev.land != null) {
      if (M.hover >= 8 && ev.pad && ev.pad.label === "BOX")
        finish(true, "Clean landing in the box.", { time: el, land: ev.land });
      else if (M.hover >= 8)
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
    if (M.ring < RINGS.length) {
      const r = RINGS[M.ring];
      obj = `Ring ${M.ring + 1} of ${RINGS.length}`;
      if ((prevZ - r.z) * (S.z - r.z) <= 0 && prevZ !== S.z) {
        const dd = Math.hypot(S.x - r.x, S.y + 0.6 - r.y);
        if (dd < 4.6) {
          r.m.material.emissive.set(0x3a4a55);
          M.ring++;
          audio.ping();
          if (M.ring < RINGS.length)
            RINGS[M.ring].m.material.emissive.set(0xffb35c);
          flash(`RING ${M.ring}/${RINGS.length}`, "", 1);
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
      cur = Math.round(M.pts + SCORE.drift);
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
      tgt = seq[M.step];
    obj = `Land on PAD ${tgt} (${M.step + 1}/3)`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.land != null && ev.pad && ev.pad.label === tgt) {
      M.step++;
      audio.chime();
      if (M.step >= 3)
        finish(true, "Three rooftops, three clean landings.", {
          time: el,
          land: ev.land,
        });
      else {
        flash(`PAD ${tgt} DONE`, `next: PAD ${seq[M.step]}`, 1.6);
        PADS.forEach((p) => (p.beam.visible = p.label === seq[M.step]));
      }
    } else if (left <= 0) finish(false, "Out of time.", { time: null });
  }
  if (d.id === "deck") {
    const Lc = LAUNCH,
      tz =
        Lc.st === "idle" ? Lc.cycle - Lc.t : Lc.st === "count" ? 10 - Lc.t : 0;
    if (!M.onDeck) {
      obj = "Land on the TOWER DECK before T-0";
      tt = `T-${Math.max(0, tz).toFixed(1)} s`;
      if (ev && ev.land != null && ev.pad && ev.pad.label === "L") {
        M.onDeck = true;
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
      if (Lc.st === "up" && !M.shown) {
        M.shown = true;
        if (!cin.on) startShow("launch");
      }
      if (Lc.st === "up" && Lc.y > 320 && !cin.on)
        finish(true, "You watched it go from 100 m up.", { time: el });
    }
  }
  if (d.race) {
    const G = RACE.gates;
    if (M.rs === "grid") {
      M.gt += dt;
      const n = 3 - Math.floor(M.gt - 0.4);
      if (M.gt > 0.4 && n >= 1 && M.lastN !== n) {
        M.lastN = n;
        flash(String(n), "", 0.8);
        audio.ping();
      }
      if (M.gt >= 3.4) {
        M.rs = "run";
        M.t0 = clock;
        flash("GO!", "", 1);
        audio.ignite();
        setTimeout(() => radio("VEX", "start", true), 900);
      }
      obj = "Get ready";
      tt = "";
    } else {
      M.sp = projS(S.x, S.z, M.sp);
      const g = G[M.cp];
      if (Math.hypot(S.x - g.x, S.z - g.z) < 12 && S.y < 14) {
        M.cp++;
        audio.ping();
        if (M.cp >= G.length) {
          M.cp = 0;
          M.lap++;
          if (M.lap < RACE.laps) {
            flash("FINAL LAP", "", 1.4);
            radio(
              ["VEX", "RAZOR", "GHOST"][(Math.random() * 3) | 0],
              "lastlap",
              true,
            );
          }
        }
      }
      const rel = (((M.sp - RACE.off) % RACE.len) + RACE.len) % RACE.len,
        base = M.cp === 0 && rel > RACE.len * 0.6 ? rel - RACE.len : rel;
      M.pprog = M.lap * RACE.len + base;
      const pos = 1 + RIVALS.filter((r) => r.prog > M.pprog).length;
      M.pos = pos;
      radioRace(pos);
      pfCheck();
      G.forEach((q, i) =>
        q.m.color.setRGB(...(i === M.cp ? [3, 2.1, 0.4] : [0.25, 1.6, 1.9])),
      );
      obj = `LAP ${Math.min(RACE.laps, M.lap + 1)}/${RACE.laps} · POSITION ${pos}/${RIVALS.length + 1}`;
      tt = `${el.toFixed(1)} s`;
      if (M.lap >= RACE.laps) {
        const need = M.story != null || RACE.final ? 1 : 3;
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
      Q = DROPS[Math.min(M.step, DROPS.length - 1)];
    obj = `Drop ${M.step + 1} of ${DROPS.length}: stop inside the blue zone`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    DZ.position.set(Q[0], 0, Q[1]);
    if (
      Math.hypot(S.x - Q[0], S.z - Q[1]) < 6 &&
      !S.air &&
      Math.abs(S.v) < 2.5
    ) {
      M.dz += dt;
      if (M.dz > 0.4) {
        M.dz = 0;
        M.step++;
        audio.chime();
        pop("DELIVERED", 300);
        if (M.step >= DROPS.length) {
          DZ.visible = false;
          finish(true, "Three orders, all still hot.", { time: el });
        } else flash(`DROP ${M.step} DONE`, `next: drop ${M.step + 1}`, 1.4);
      }
    } else M.dz = 0;
    if (!M.done && left <= 0)
      finish(false, "The food got cold. Out of time.", { time: null });
  }
  if (d.id === "ramps_v0") {
    const left = 75 - el;
    obj = `Ramps cleared: ${M.hit.size} / 4 · land every jump`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (
      ev &&
      ev.land != null &&
      ev.ramp &&
      ev.clean &&
      ev.air > 0.5 &&
      !M.hit.has(ev.ramp.name)
    ) {
      M.hit.add(ev.ramp.name);
      ev.ramp.bar.color.setRGB(0.35, 0.38, 0.42);
      audio.chime();
      flash(`${ev.ramp.name} ✓`, `${M.hit.size} of 4`, 1.3);
      if (M.hit.size >= 4)
        finish(
          true,
          "Four ramps, four clean landings. VEX is impressed. He will not say it.",
          { time: el },
        );
    }
    if (!M.done && left <= 0)
      finish(false, `Out of time at ${M.hit.size} of 4 ramps.`, { time: null });
  }
  if (d.id === "chase") {
    const v = RIVALS[0];
    if (M.rs === "grid") {
      M.gt += dt;
      obj = "VEX is about to bolt…";
      tt = "";
      if (M.gt > 2.2) {
        M.rs = "run";
        M.t0 = clock;
        flash("GO", "catch him · touch his bumper", 1.2);
        audio.ignite();
      }
    } else {
      [obj, tt] = chaseTick(M, dt, el);
    }
  }
  if (d.id === "skytour_v0") {
    tt = `${el.toFixed(1)} s`;
    if (M.ring < STOUR.length) {
      const R = STOUR[M.ring];
      obj = `Sky ring ${M.ring + 1} of ${STOUR.length} · ${R[3]}`;
      if (Math.hypot(S.x - R[0], S.y + 0.5 - R[1], S.z - R[2]) < 6.8) {
        SKYR.children[M.ring].material.emissive.set(0x3a4a55);
        M.ring++;
        S.tank = Math.min(100, S.tank + 25);
        audio.ping();
        pop("SKY RING · +25% AIR", 200);
        if (M.ring < STOUR.length)
          SKYR.children[M.ring].material.emissive.set(0xffb35c);
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
        Math.hypot(S.x - VP[0], S.z - VP[1]) < 6 &&
        !S.air &&
        Math.abs(S.v) < 2.5;
    obj = inZ
      ? "In position. Watch it land."
      : "Reach the gold VIEW POINT and stop inside it";
    tt =
      Lc.st === "landed" ? "" : `TOUCHDOWN IN ${Math.max(0, tl).toFixed(1)} s`;
    if (Lc.st === "down" && Lc.t >= 7.5 && !M.shown && !cin.on) {
      M.shown = true;
      if (inZ || Math.hypot(S.x - VP[0], S.z - VP[1]) < 60) startShow("land");
    }
    if (Lc.st === "landed" && !M.res) {
      M.res = true;
      if (Math.hypot(S.x - LS.lz.x, S.z - LS.lz.z) < 26)
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
      S.z < -146
    )
      finish(true, "Three haulers, zero scratches.", { time: el });
    else if (!M.done && left <= 0)
      finish(
        false,
        "Out of time. Take a longer run-up: the ramp needs speed.",
        { time: null },
      );
  }
  if (d.id === "bigair_v0") {
    const left = 60 - el;
    if (ev && ev.land != null && ev.ramp && ev.clean) {
      M.best = Math.max(M.best, ev.air);
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
    obj = `Best jump: ${M.best.toFixed(2)} s · need 2.00 s`;
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (!M.done && left <= 0)
      finish(
        false,
        `Best was ${M.best.toFixed(2)} s. Hit the Mega Ramp flat out.`,
        { time: null },
      );
  }
  if (d.id === "loop_v0") {
    const left = 45 - el;
    obj = S.loop
      ? "Hold the throttle, keep it rolling"
      : "Line up with the yellow chevrons, 55 mph or more";
    tt = `${Math.max(0, left).toFixed(1)} s left`;
    if (ev && ev.loop)
      finish(true, "Upside down at speed, and back on four wheels.", {
        time: el,
      });
    else if (!M.done && left <= 0)
      finish(false, "Out of time. Take a longer run-up at the loop.", {
        time: null,
      });
  }
  if (d.id === "stuntshow_v0") {
    const left = 60 - el,
      cur = Math.round(M.pts + SCORE.drift);
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
  if (V26.T[d.id]) {
    const r = V26.T[d.id](M, dt, ev, el);
    if (r) [obj, tt] = r;
  }
  if (d.id === "tutorial") [obj, tt] = tutTick(M, dt, ev, el);
  if (d.id === "launchday") [obj, tt] = launchDayTick(M, dt, ev, el);
  if (d.id === "daily") [obj, tt] = dailyTick(M, el);
  prevZ = S.z;
  setT("mobj", tx(objHelp(d, obj)));
  setT(
    "mtime",
    tt +
      (CHAL.on && M && M.def.id === CHAL.on.id && tt
        ? ` · beat ${CHAL.on.t.toFixed(2)} s`
        : ""),
  );
}
