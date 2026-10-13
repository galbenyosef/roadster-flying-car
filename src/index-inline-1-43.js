// index-inline-1 43 — math
// Lines 92059-92369 of readable/index-inline-1.pretty.js (statement-aligned).
function freeTick(dt, ev) {
  if (M || phase !== "play") {
    evPX = S.x;
    evPZ = S.z;
    return;
  }
  if (S.y < 4)
    for (const t of EVT.traps) {
      const a =
        t.ax === "z" ? [evPZ, S.z, t.z, S.x, t.x] : [evPX, S.x, t.x, S.z, t.z];
      if (
        (a[0] - a[2]) * (a[1] - a[2]) <= 0 &&
        a[0] !== a[1] &&
        Math.abs(a[3] - a[4]) < 8.5
      ) {
        const mph = Math.abs(S.v) * MPH;
        evResult(
          "SPEED TRAP",
          t.id,
          Math.round(mph),
          [70, 95, 120],
          (v) => `${v} mph`,
        );
        audio.ping();
      }
    }
  const inZ = EVT.zones.find(
    (q) => Math.hypot(S.x - q.x, S.z - q.z) < q.r && S.y < 3,
  );
  if (inZ) {
    if (!EVT.zone || EVT.zone.q !== inZ) EVT.zone = { q: inZ, pts: 0 };
    if (!S.air && S.dr > 0.3 && Math.abs(S.slip) > 0.12 && S.v > 11)
      EVT.zone.pts += S.v * Math.abs(S.slip) * dt * 14;
    setT(
      "driftLive",
      EVT.zone.pts > 0 ? `DRIFT ZONE ${Math.round(EVT.zone.pts)}` : "",
    );
  } else if (EVT.zone) {
    const z = EVT.zone;
    EVT.zone = null;
    if (z.pts > 120)
      evResult(
        "DRIFT ZONE",
        z.q.id,
        Math.round(z.pts),
        [600, 1200, 2000],
        (v) => `${v.toLocaleString("en-US")} pts`,
      );
  }
  if (ev && ev.land != null && ev.ramp && ev.clean && ev.air > 0.6)
    evResult(
      "AIR · " + ev.ramp.name,
      "R" + ev.ramp.name,
      Math.round(ev.air * 100) / 100,
      [1, 1.6, 2.2],
      (v) => `${v.toFixed(2)} s`,
    );
  if (ev && ev.land != null) sigCheck();
  evPX = S.x;
  evPZ = S.z;
}
function drawEvents(c, sc) {
  c.lineWidth = 2;
  for (const t of EVT.traps) {
    const x = (t.x - S.x) * sc,
      z = (t.z - S.z) * sc;
    if (Math.abs(x) > 110 || Math.abs(z) > 110) continue;
    c.strokeStyle = "#28e0ff";
    c.beginPath();
    if (t.ax === "z") {
      c.moveTo(x - 4, z);
      c.lineTo(x + 4, z);
    } else {
      c.moveTo(x, z - 4);
      c.lineTo(x, z + 4);
    }
    c.stroke();
  }
  for (const q of EVT.zones) {
    const x = (q.x - S.x) * sc,
      z = (q.z - S.z) * sc;
    if (Math.abs(x) > 110 || Math.abs(z) > 110) continue;
    c.strokeStyle = "#ff4fd8";
    c.beginPath();
    c.arc(x, z, q.r * sc, 0, 7);
    c.stroke();
  }
}

/* ---- signature spots: ten secret landings, each a one-time slow-mo and a photo prompt ---- */
const SPOTS = (() => {
  const L = [],
    B = BLD.slice().sort((a, b) => b.h - a.h),
    roof = (b, n) => ({
      n,
      x: (b.x0 + b.x1) / 2,
      z: (b.z0 + b.z1) / 2,
      y: b.h,
      r: Math.max(6, Math.min(b.x1 - b.x0, b.z1 - b.z0) / 2),
      b,
    });
  L.push(roof(B[0], "THE NEEDLE"), roof(B[1], "SECOND SPIRE"));
  const cas = B.find((b) => b.style === 4);
  if (cas) L.push(roof(cas, "CASINO CROWN"));
  const fab = BLD.filter((b) => b.style === 6).sort(
    (a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0),
  )[0];
  if (fab) L.push(roof(fab, "MEGAFAB ROOF"));
  const dn = bldAt((DINER.x0 + DINER.x1) / 2, (DINER.z0 + DINER.z1) / 2);
  if (dn) L.push(roof(dn, "DINER ROOF"));
  const pL = PADS.find((p) => p.label === "L");
  L.push({ n: "TOWER DECK", x: pL.x, z: pL.z, y: pL.y, r: 6 });
  const pC = PADS.find((p) => p.label === "C");
  L.push({ n: "PAD C", x: pC.x, z: pC.z, y: pC.y, r: 6 });
  L.push({ n: "BOOSTER PAD", x: LS.lz.x, z: LS.lz.z, y: 0, r: 16 });
  L.push({ n: "VIEW POINT", x: VP[0], z: VP[1], y: 0, r: 6 });
  const ro = B.find(
    (b) =>
      b.h > 60 &&
      Math.hypot((b.x0 + b.x1) / 2 - WHEEL.x, (b.z0 + b.z1) / 2 - WHEEL.z) <
        260,
  );
  if (ro) L.push(roof(ro, "WHEEL VIEW"));
  return L.slice(0, 10);
})();
const SPOTF = new Set(
  (() => {
    try {
      return JSON.parse(store.get("rfc_sig") || "[]");
    } catch (e) {
      return [];
    }
  })(),
);
function sigCheck() {
  for (const q of SPOTS) {
    if (SPOTF.has(q.n)) continue;
    const inside = q.b
      ? S.x > q.b.x0 && S.x < q.b.x1 && S.z > q.b.z0 && S.z < q.b.z1
      : Math.hypot(S.x - q.x, S.z - q.z) < q.r;
    if (inside && Math.abs(S.y - q.y) < 2.5) {
      SPOTF.add(q.n);
      store.set("rfc_sig", JSON.stringify([...SPOTF]));
      miniSlow();
      MS.t = 1.2;
      flash(
        `SIGNATURE SPOT ${SPOTF.size}/${SPOTS.length}`,
        `${q.n} · press P for a photo`,
        3,
      );
      pop("SIGNATURE SPOT", 1000);
      audio.chime();
      if (isTouch) $("tbPho").classList.add("act");
      setTimeout(() => $("tbPho").classList.remove("act"), 2500);
      return;
    }
  }
}

/* ---- story: 15 chapters in three acts, ending in orbit ---- */
const ACTS = ["NEW IN TOWN", "MAKING A NAME", "THE STRIP"];
MIS.push(
  {
    id: "launchday",
    r: 2000,
    n: "19",
    t: "Launch Day",
    b: "Land on the tower deck before T-0 and watch the liftoff. Then beat the booster back: stop inside the gold VIEW POINT before it touches down.",
    spawn: () => place(387.5, 540, 0),
  },
  {
    id: "orbit",
    r: 0,
    n: "--",
    hidden: true,
    t: "Orbit",
    b: "",
    spawn: () => {},
  },
  {
    id: "daily",
    r: 600,
    n: "D",
    hidden: true,
    t: "Daily Run",
    b: "60 seconds. Every trick counts, chains multiply. One run a day, the same for everyone.",
    spawn: () => dailySpawn(),
  },
);
{
  const old = CH.slice(),
    byMis = (id) => old.find((c) => MIS[c.mis] && MIS[c.mis].id === id),
    mk = (id, t, o) =>
      Object.assign({}, byMis(id) || {}, { t, mis: MI(id) }, o || {});
  const N = [
    mk("jam", "OVER THE JAM", { act: 0 }),
    mk("hover", "LIFT OFF", { act: 0 }),
    mk("pad", "ROOFTOPS", { act: 0 }),
    mk("drift", "SIDEWAYS", { act: 0 }),
    mk("race", "CHROME KINGS", { act: 0, boss: true }),
    mk("rings", "NEON RINGS", { act: 1 }),
    mk("ramps", "STUNT YARD", { act: 1 }),
    mk("truck", "TRUCK JUMP", { act: 1 }),
    mk("loop", "LOOP THE LOOP", { act: 1 }),
    mk("chase", "CATCH VEX", {
      act: 1,
      boss: true,
      who: "VEX · CHROME KINGS",
      intro: "You want the pod? Come take it off my bumper.",
      outro: "...Fine. You caught me. Nobody catches me.",
    }),
    mk("stuntshow", "STUNT SHOW", { act: 2 }),
    mk("skytour", "SKY TOUR", { act: 2 }),
    mk("launchday", "LAUNCH DAY", {
      act: 2,
      who: "CONTROL",
      intro: "Deck first, Zero. Then race the booster home.",
      outro: "Deck, liftoff and the catch. Control is impressed.",
      at: [VP[0] - 30, VP[1] - 60],
    }),
    mk("final", "SHOWDOWN", { act: 2, boss: true }),
    {
      t: "ORBIT",
      mis: MI("orbit"),
      act: 2,
      who: "MAE",
      intro: "",
      outro: "",
      at: [VP[0] + 10, VP[1] - 24],
      orbit: true,
    },
  ];
  CH.length = 0;
  N.forEach((c) => CH.push(c));
}
// progress from the 18-chapter story carries over: a chapter counts if its test was cleared before
{
  const v = store.get("rfc_story_v");
  if (v !== "22" && !(+v > 22)) {
    const done = +(store.get("rfc_story") || 0),
      oldOrder = [
        "launch",
        "hover",
        "pad",
        "rings",
        "drift",
        "race",
        "courier",
        "ramps",
        "truck",
        "chase",
        "relay",
        "skytour",
        "bigair",
        "stuntshow",
        "deck",
        "catch",
        "loop",
        "final",
      ],
      cleared = new Set(oldOrder.slice(0, done));
    if (cleared.has("launch")) cleared.add("jam");
    if (cleared.has("deck") && cleared.has("catch")) cleared.add("launchday");
    let nd = 0;
    while (nd < CH.length && cleared.has(MIS[CH[nd].mis].id)) nd++;
    STORY.done = nd;
    store.set("rfc_story", String(nd));
    store.set("rfc_story_v", "22");
  }
}

/* ---- Catch VEX: touch his bumper to win; losing him fades his trail instead of failing ---- */
MIS.find((m) => m.id === "chase").t = "Catch VEX";
MIS.find((m) => m.id === "chase").b =
  "VEX has the telemetry pod. Touch his rear bumper within 90 s. Lose him and his trail fades, but the chase goes on.";
MEDAL.chase = { t: 15, s: 30 };
MEDAL.launchday = { k: "off", t: 2, s: 4, u: " m from centre" };
MEDAL.daily = { k: "pts", t: 9000, s: 6000, hi: true, u: " pts" };
function chaseTick(M, dt, el) {
  const v = RIVALS[0],
    dd = Math.hypot(S.x - v.g.position.x, S.y - 0.4, S.z - v.g.position.z);
  M.sp = projSP(CHASE, S.x, S.z, M.sp);
  const fade = clamp(1 - (dd - 45) / 90, 0.12, 1);
  Z70.material.opacity = 0.6 * fade;
  CHASE.group.traverse((o) => {
    if (o.material && o.material.opacity != null && o !== Z70) {
      o.material.transparent = true;
      o.material.opacity = fade;
    }
  });
  Z70.material.color.setRGB(...(dd < 15 ? [3, 2.1, 0.4] : [0.3, 2.2, 2.6]));
  const left = 90 - el;
  if (dd < 5.6) {
    finish(true, "Bumper to bumper. He hands over the pod.", { time: el });
    return ["", ""];
  }
  if (left <= 0) {
    finish(false, "He got away. Boost on the straights and cut the corners.", {
      time: null,
    });
    return ["", ""];
  }
  return [
    dd > 70
      ? `He is getting away · ${Math.round(dd)} m`
      : `Catch VEX · ${Math.round(dd)} m to his bumper`,
    `${Math.max(0, left).toFixed(1)} s left`,
  ];
}

/* ---- Launch Day: the deck, the liftoff, then race the booster back to the view point ---- */
