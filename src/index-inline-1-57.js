// index-inline-1 57 — currentmission
// Lines 96382-96726 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const _mt = mapTarget23;
  mapTarget23 = function (d, pd) {
    const R = (n) => RAMPS.find((r) => r.name === n);
    if (d === "launch")
      return currentMission.rs === "stage" ? null : { x: DRAG.x, z: DRAG.z1 };
    if (d === "rings") return RING_RUN[Math.min(currentMission.ring, RING_RUN.length - 1)];
    if (d === "courier")
      return currentMission.step === 0
        ? { x: DROPS[0][0], z: DROPS[0][1] }
        : currentMission.step === 1
          ? ROOF2
          : { x: VAN_MODEL.position.x, z: VAN_MODEL.position.z };
    if (d === "ramps") return R(STUNT_YARD[Math.min(currentMission.step, STUNT_YARD.length - 1)].n);
    if (d === "pad") {
      if (!carState.air && carState.tank < 24 && currentMission.got && currentMission.got.size < CANS.length) {
        let b = null,
          bd = 1e9;
        CANS.forEach((c, i) => {
          if (currentMission.got.has(i)) return;
          const q = Math.hypot(c.x - carState.x, c.z - carState.z);
          if (q < bd) {
            bd = q;
            b = c;
          }
        });
        currentMission.tgtCan = true;
        return b;
      }
      currentMission.tgtCan = false;
      return pd("B");
    }
    if (d === "truck") return currentMission.cleared ? TRUCK_JUMP_ZONE : R("TRUCK JUMP");
    if (d === "relay") return pd(currentMission.seq[Math.min(currentMission.step, 3)]);
    if (d === "bigair") return currentMission.best > 0 ? BIG_AIR_ZONE : R("MEGA RAMP");
    if (d === "loop")
      return currentMission.loops === 1 && !currentMission.back
        ? { x: LOOPS[0].x, z: LOOPS[0].z + 60 }
        : { x: LOOPS[0].x, z: LOOPS[0].z };
    if (d === "hotcell") return { x: HOT_CELL.gx, z: HOT_CELL.gz };
    return _mt(d, pd);
  };
  const _nl = navLabel23;
  navLabel23 = function (d) {
    const o = {
      launch: "FINISH LINE",
      rings: currentMission.ring >= RING_RUN.length - 1 ? "GOLD RING" : `RING ${currentMission.ring + 1}`,
      courier: ["DROP ZONE", "ROOFTOP PARTY", "MAE'S TRUCK"][
        Math.min(2, currentMission.step)
      ],
      ramps: (STUNT_YARD[currentMission.step] || STUNT_YARD[3]).n,
      pad: currentMission.tgtCan ? "AIR CANISTER" : "PAD B",
      truck: currentMission.cleared ? "GOLD BOX" : "TRUCK JUMP",
      relay: currentMission.seq
        ? currentMission.seq[Math.min(currentMission.step, 3)] === "BOX"
          ? "THE BOX"
          : "PAD " + currentMission.seq[Math.min(currentMission.step, 3)]
        : "",
      bigair: currentMission.best > 0 ? "GOLD ZONE" : "MEGA RAMP",
      loop: currentMission.loops === 1 && !currentMission.back ? "LOOP ENTRY" : "THE LOOP",
      hotcell: "MEGAFAB GATE",
    }[d];
    return o || _nl(d);
  };
  const _ft = filmTargets;
  filmTargets = function (id) {
    const R = (n) => {
        const r = RAMPS.find((q) => q.name === n);
        return {
          x: r.x + r.fx * r.L * 0.5,
          y: r.H,
          z: r.z + r.fz * r.L * 0.5,
          l: n,
        };
      },
      pd = (l) => {
        const p = PADS.find((q) => q.label === l);
        return { x: p.x, y: p.y, z: p.z, l: p.name };
      };
    switch (id) {
      case "rings":
        return RING_RUN.filter((r, i) => i % 2 === 0 || i === RING_RUN.length - 1).map(
          (r, i, a) => ({
            x: r.x,
            y: r.y,
            z: r.z,
            l: i === a.length - 1 ? "GOLD FINISH" : `RING ${RING_RUN.indexOf(r) + 1}`,
          }),
        );
      case "courier":
        return [
          { x: DROPS[0][0], y: 0, z: DROPS[0][1], l: "ORDER 1 · STREET DROP" },
          { x: ROOF2.x, y: ROOF2.h, z: ROOF2.z, l: "ORDER 2 · ROOFTOP PARTY" },
          {
            x: VAN_MODEL.position.x,
            y: 2,
            z: VAN_MODEL.position.z,
            l: "ORDER 3 · MAE'S TRUCK",
          },
        ];
      case "ramps":
        return STUNT_YARD.map((q) => R(q.n));
      case "pad":
        return [
          { x: CANS[0].x, y: 1.5, z: CANS[0].z, l: "AIR CANISTERS" },
          { x: CANS[2].x, y: 1.5, z: CANS[2].z, l: "MORE CANISTERS" },
          pd("B"),
        ];
      case "truck":
        return [
          R("TRUCK JUMP"),
          {
            x: RAMPS.find((r) => r.name === "TRUCK JUMP").x,
            y: 2,
            z: -150,
            l: "THREE HAULERS",
          },
          { x: TRUCK_JUMP_ZONE.x, y: 0, z: TRUCK_JUMP_ZONE.z, l: "GOLD BOX · STOP" },
        ];
      case "hotcell":
        return [
          { x: 96, y: 2, z: 300, l: "THE JAM" },
          { x: 96, y: 0, z: 192, l: "TURN RIGHT" },
          { x: HOT_CELL.gx, y: 0, z: HOT_CELL.gz, l: "MEGAFAB GATE" },
        ];
      case "bigair":
        return [R("MEGA RAMP"), { x: BIG_AIR_ZONE.x, y: 0, z: BIG_AIR_ZONE.z, l: "GOLD ZONE" }];
    }
    return _ft(id);
  };
}

/* ---- per-frame: the plate reveal is lit from the side, bloom held down, so the car reads clearly ---- */
RSHOT[0].P = [
  [-3.6, 1.4, 7.6],
  [-1.45, 0.55, 4.25],
];
RSHOT[0].L = [
  [0, 0.62, 0.4],
  [0, 0.46, 2.3],
];
RSHOT[0].f = [40, 26];
{
  const pm = plate.material[4];
  pm.roughness = 0.72;
  pm.color.setScalar(0.84);
}
function revealLight() {
  car.updateMatrixWorld();
  keyLight.position.copy(car.localToWorld(vec3(-2.4, 2.9, 3.4)));
  keyLight.intensity = 14;
}
function v26Frame(rdt, dt) {
  if (cinematic.on && cinematic.rev) {
    bloom.strength = Math.min(bloom.strength, 0.18);
  }
  if (!(currentMission && !currentMission.done && currentMission.def.id === "launch")) {
    const t = byId("tree");
    if (t && t.classList.contains("on")) t.classList.remove("on");
  }
}
// the way down from the deck: brake in the air drops at 6 m/s instead of 3
{
  const _l = launchDayTick;
  launchDayTick = function (M, dt, ev, el) {
    const r = _l(M, dt, ev, el);
    if (
      r &&
      r[0] &&
      M.step === 1 &&
      carState.air &&
      carState.y - groundH(carState.x, carState.z, carState.y).h > 12
    )
      r[0] = `Hold ${KEY_LABELS("brake")} to drop faster · ` + r[0];
    return r;
  };
}
// rebuilt missions start fresh: old best times, medals and ghosts were for a different test
{
  if (store.get("rfc_v26m") !== "1") {
    [
      "launch",
      "drone",
      "rings",
      "courier",
      "ramps",
      "pad",
      "truck",
      "chase",
      "relay",
      "bigair",
      "loop",
      "skytour",
      "stuntshow",
      "launchday",
    ].forEach((id) => {
      ["rfc_", "rfc_med_", "rfc_gh_"].forEach((k) => {
        try {
          localStorage.removeItem(k + id);
        } catch (e) {}
      });
    });
    store.set("rfc_v26m", "1");
  }
  GHOSTABLE.add("hotcell");
}
// NEXT TEST follows the numbers on the list, not the order the tests were written in
function nextMis(i) {
  const L = MISSIONS.map((m, k) => [m, k])
    .filter(([m]) => !m.hidden && !isNaN(parseInt(m.n, 10)))
    .sort((a, b) => parseInt(a[0].n, 10) - parseInt(b[0].n, 10))
    .map((x) => x[1]);
  const p = L.indexOf(i);
  return p >= 0 && p < L.length - 1 ? L[p + 1] : -1;
}

/* ================= V27: clean screens, progress locks, fairer rings and drone, harder Showdown, orbit, sharing ================= */

/* ---- nothing from a film may stay on screen after it ends or is skipped ---- */
function clearFilmOverlays() {
  const vs = byId("vs");
  if (vs) {
    vs.classList.remove("on");
    vs.hidden = true;
  }
  const cd = byId("card");
  if (cd) {
    cd.classList.remove("on");
    cd.hidden = true;
  }
  const f = byId("flash");
  if (f) f.classList.remove("fl");
  byId("cutUI").hidden = true;
  document.body.classList.remove("intro");
}
{
  const _e = endCut;
  endCut = function () {
    const was = !!activeCut;
    _e();
    if (was) {
      clearFilmOverlays();
      if (phase === "play" && currentMission && !currentMission.done) byId("mission").hidden = false;
    }
  };
}
{
  const _c = endCin;
  endCin = function () {
    _c();
    byId("callouts").innerHTML = "";
    document.body.classList.remove("cine", "show");
  };
}
// a safety net: if no film is running, film-only overlays are never visible
function overlayGuard() {
  if (activeCut || phase === "cut" || phase === "intro") return;
  const vs = byId("vs");
  if (vs && !vs.hidden) {
    vs.classList.remove("on");
    vs.hidden = true;
  }
  if (phase === "play" && document.body.classList.contains("intro"))
    document.body.classList.remove("intro");
  if (!cinematic.on && document.body.classList.contains("cine"))
    document.body.classList.remove("cine", "show");
}

/* ---- slow-motion films: each kind at most twice per session, no dice ---- */
Object.assign(SESS, { arm: 0, hover: 0, boost: 0, jump: 0, miniN: 0 });
sessOK = function (kind) {
  const cap = { arm: 2, hover: 2, boost: 2, jump: 2 }[kind];
  if (cap == null) return true;
  if (SESS[kind] >= cap) return false;
  SESS[kind]++;
  return true;
};
sessMini = function () {
  const now = performance.now() / 1000;
  if (SESS.miniN >= 2 || now - SESS.mini < 25) return false;
  SESS.mini = now;
  SESS.miniN++;
  return true;
};
// the Rocket Mode plate film: the long version twice per session, the 1.3 s version after that
{
  const _r = revealOK;
  revealOK = function () {
    return _r() && sessOK("arm");
  };
}

/* ---- difficulty: Ring Run and Rogue Drone 20% easier, the Showdown 10% harder ---- */
Object.assign(RING_RUN_TUNE, { start: 13.2, per: 18.3, base: 0.96, turn: 1.9 });
Object.assign(DRONE_SPEEDS, { base: 17.1, dart: 27, tired: 11.7 });
// VEX's two Showdown laps: 139 s before, 126 s now (10% faster)
{
  const F = TRACKS.final;
  F.rv = F.rv.map((v) => v * 1.08);
  F.cv = [F.cv[0] * 1.18, F.cv[1]];
  F.acc = (F.acc || 7) * 1.18;
  F.rb = [F.rb[0], F.rb[1] * 1.1];
  MEDAL.final = { t: 125, s: 132 };
}

/* ---- progress locks: the test list opens in order, the big modes open with the story ---- */
function clearedId(id) {
  return !!(store.get("rfc_clr_" + id) || store.get("rfc_" + id));
}
{
  const _f = finish;
  finish = function (ok, reason, stats) {
    if (ok && currentMission && !currentMission.done) store.set("rfc_clr_" + currentMission.def.id, "1");
    return _f(ok, reason, stats);
  };
}
function misOrder() {
  return MISSIONS.map((m, k) => [m, k])
    .filter(([m]) => !m.hidden && !isNaN(parseInt(m.n, 10)))
    .sort((a, b) => parseInt(a[0].n, 10) - parseInt(b[0].n, 10))
    .map((x) => x[1]);
}
function chapterOf(id) {
  return CHAPTERS.findIndex((c) => MISSIONS[c.mis] && MISSIONS[c.mis].id === id);
}
// a test opens when the one before it is cleared, or when the story has reached its chapter
function misOpen(i) {
  const L = misOrder(),
    p = L.indexOf(i);
  if (p <= 1) return true;
  const id = MISSIONS[i].id,
    ch = chapterOf(id);
  if (clearedId(id)) return true;
  if (ch >= 0 && ch <= STORY.done) return true;
  return clearedId(MISSIONS[L[p - 1]].id);
}
function misNeed(i) {
  const L = misOrder(),
    p = L.indexOf(i),
    prev = MISSIONS[L[p - 1]],
    ch = chapterOf(MISSIONS[i].id);
  return ch >= 0
    ? `Clear TEST ${prev.n} or reach chapter ${ch + 1}`
    : `Clear TEST ${prev.n} · ${prev.t}`;
}
