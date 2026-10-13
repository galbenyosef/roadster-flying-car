// index-inline-1 57 — the
// Lines 96382-96726 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const _mt = mapTarget23;
  mapTarget23 = function (d, pd) {
    const R = (n) => RAMPS.find((r) => r.name === n);
    if (d === "launch")
      return M.rs === "stage" ? null : { x: DRAG.x, z: DRAG.z1 };
    if (d === "rings") return RR[Math.min(M.ring, RR.length - 1)];
    if (d === "courier")
      return M.step === 0
        ? { x: DROPS[0][0], z: DROPS[0][1] }
        : M.step === 1
          ? ROOF2
          : { x: VAN.position.x, z: VAN.position.z };
    if (d === "ramps") return R(SY[Math.min(M.step, SY.length - 1)].n);
    if (d === "pad") {
      if (!S.air && S.tank < 24 && M.got && M.got.size < CANS.length) {
        let b = null,
          bd = 1e9;
        CANS.forEach((c, i) => {
          if (M.got.has(i)) return;
          const q = Math.hypot(c.x - S.x, c.z - S.z);
          if (q < bd) {
            bd = q;
            b = c;
          }
        });
        M.tgtCan = true;
        return b;
      }
      M.tgtCan = false;
      return pd("B");
    }
    if (d === "truck") return M.cleared ? TJZ : R("TRUCK JUMP");
    if (d === "relay") return pd(M.seq[Math.min(M.step, 3)]);
    if (d === "bigair") return M.best > 0 ? BAZ : R("MEGA RAMP");
    if (d === "loop")
      return M.loops === 1 && !M.back
        ? { x: LOOPS[0].x, z: LOOPS[0].z + 60 }
        : { x: LOOPS[0].x, z: LOOPS[0].z };
    if (d === "hotcell") return { x: HC.gx, z: HC.gz };
    return _mt(d, pd);
  };
  const _nl = navLabel23;
  navLabel23 = function (d) {
    const o = {
      launch: "FINISH LINE",
      rings: M.ring >= RR.length - 1 ? "GOLD RING" : `RING ${M.ring + 1}`,
      courier: ["DROP ZONE", "ROOFTOP PARTY", "MAE'S TRUCK"][
        Math.min(2, M.step)
      ],
      ramps: (SY[M.step] || SY[3]).n,
      pad: M.tgtCan ? "AIR CANISTER" : "PAD B",
      truck: M.cleared ? "GOLD BOX" : "TRUCK JUMP",
      relay: M.seq
        ? M.seq[Math.min(M.step, 3)] === "BOX"
          ? "THE BOX"
          : "PAD " + M.seq[Math.min(M.step, 3)]
        : "",
      bigair: M.best > 0 ? "GOLD ZONE" : "MEGA RAMP",
      loop: M.loops === 1 && !M.back ? "LOOP ENTRY" : "THE LOOP",
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
        return RR.filter((r, i) => i % 2 === 0 || i === RR.length - 1).map(
          (r, i, a) => ({
            x: r.x,
            y: r.y,
            z: r.z,
            l: i === a.length - 1 ? "GOLD FINISH" : `RING ${RR.indexOf(r) + 1}`,
          }),
        );
      case "courier":
        return [
          { x: DROPS[0][0], y: 0, z: DROPS[0][1], l: "ORDER 1 · STREET DROP" },
          { x: ROOF2.x, y: ROOF2.h, z: ROOF2.z, l: "ORDER 2 · ROOFTOP PARTY" },
          {
            x: VAN.position.x,
            y: 2,
            z: VAN.position.z,
            l: "ORDER 3 · MAE'S TRUCK",
          },
        ];
      case "ramps":
        return SY.map((q) => R(q.n));
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
          { x: TJZ.x, y: 0, z: TJZ.z, l: "GOLD BOX · STOP" },
        ];
      case "hotcell":
        return [
          { x: 96, y: 2, z: 300, l: "THE JAM" },
          { x: 96, y: 0, z: 192, l: "TURN RIGHT" },
          { x: HC.gx, y: 0, z: HC.gz, l: "MEGAFAB GATE" },
        ];
      case "bigair":
        return [R("MEGA RAMP"), { x: BAZ.x, y: 0, z: BAZ.z, l: "GOLD ZONE" }];
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
  keyL.position.copy(car.localToWorld(V3x(-2.4, 2.9, 3.4)));
  keyL.intensity = 14;
}
function v26Frame(rdt, dt) {
  if (cin.on && cin.rev) {
    bloom.strength = Math.min(bloom.strength, 0.18);
  }
  if (!(M && !M.done && M.def.id === "launch")) {
    const t = $("tree");
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
      S.air &&
      S.y - groundH(S.x, S.z, S.y).h > 12
    )
      r[0] = `Hold ${KY("brake")} to drop faster · ` + r[0];
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
  const L = MIS.map((m, k) => [m, k])
    .filter(([m]) => !m.hidden && !isNaN(parseInt(m.n, 10)))
    .sort((a, b) => parseInt(a[0].n, 10) - parseInt(b[0].n, 10))
    .map((x) => x[1]);
  const p = L.indexOf(i);
  return p >= 0 && p < L.length - 1 ? L[p + 1] : -1;
}

/* ================= V27: clean screens, progress locks, fairer rings and drone, harder Showdown, orbit, sharing ================= */

/* ---- nothing from a film may stay on screen after it ends or is skipped ---- */
function clearFilmOverlays() {
  const vs = $("vs");
  if (vs) {
    vs.classList.remove("on");
    vs.hidden = true;
  }
  const cd = $("card");
  if (cd) {
    cd.classList.remove("on");
    cd.hidden = true;
  }
  const f = $("flash");
  if (f) f.classList.remove("fl");
  $("cutUI").hidden = true;
  document.body.classList.remove("intro");
}
{
  const _e = endCut;
  endCut = function () {
    const was = !!cut;
    _e();
    if (was) {
      clearFilmOverlays();
      if (phase === "play" && M && !M.done) $("mission").hidden = false;
    }
  };
}
{
  const _c = endCin;
  endCin = function () {
    _c();
    $("callouts").innerHTML = "";
    document.body.classList.remove("cine", "show");
  };
}
// a safety net: if no film is running, film-only overlays are never visible
function overlayGuard() {
  if (cut || phase === "cut" || phase === "intro") return;
  const vs = $("vs");
  if (vs && !vs.hidden) {
    vs.classList.remove("on");
    vs.hidden = true;
  }
  if (phase === "play" && document.body.classList.contains("intro"))
    document.body.classList.remove("intro");
  if (!cin.on && document.body.classList.contains("cine"))
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
Object.assign(RRT, { start: 13.2, per: 18.3, base: 0.96, turn: 1.9 });
Object.assign(DRNV, { base: 17.1, dart: 27, tired: 11.7 });
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
    if (ok && M && !M.done) store.set("rfc_clr_" + M.def.id, "1");
    return _f(ok, reason, stats);
  };
}
function misOrder() {
  return MIS.map((m, k) => [m, k])
    .filter(([m]) => !m.hidden && !isNaN(parseInt(m.n, 10)))
    .sort((a, b) => parseInt(a[0].n, 10) - parseInt(b[0].n, 10))
    .map((x) => x[1]);
}
function chapterOf(id) {
  return CH.findIndex((c) => MIS[c.mis] && MIS[c.mis].id === id);
}
// a test opens when the one before it is cleared, or when the story has reached its chapter
function misOpen(i) {
  const L = misOrder(),
    p = L.indexOf(i);
  if (p <= 1) return true;
  const id = MIS[i].id,
    ch = chapterOf(id);
  if (clearedId(id)) return true;
  if (ch >= 0 && ch <= STORY.done) return true;
  return clearedId(MIS[L[p - 1]].id);
}
function misNeed(i) {
  const L = misOrder(),
    p = L.indexOf(i),
    prev = MIS[L[p - 1]],
    ch = chapterOf(MIS[i].id);
  return ch >= 0
    ? `Clear TEST ${prev.n} or reach chapter ${ch + 1}`
    : `Clear TEST ${prev.n} · ${prev.t}`;
}
