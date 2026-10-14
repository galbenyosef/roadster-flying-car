// index-inline-1 56 — keep
// Lines 96148-96381 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const set = (id, o) => {
    const m = MISSIONS.find((q) => q.id === id);
    if (m) Object.assign(m, o);
  };
  set("launch", {
    n: "01",
    t: "Drag Strip",
    r: 600,
    b: "Quarter mile on the boulevard against RAZOR. Open the plate, wait for GREEN, then hold BOOST. Roll before green and you are out.",
  });
  set("drone", {
    n: "02",
    r: 900,
    b: "Mae's delivery drone went rogue with six pies on board. It is fast and it dodges. Get inside 7 m to fire the tether, hold it 1 s, then land on the diner roof. 120 s.",
  });
  set("rings", {
    n: "03",
    r: 900,
    b: "Ten rings: down the boulevard, up a street canyon, round the corner to the gold finish. The clock only refills when you hit a ring.",
  });
  set("courier", {
    n: "04",
    r: 1100,
    b: "Three orders, three kinds of drop: a street zone, a rooftop party, then land on Mae's food truck while it drives. Hitting its sides, bumps and hard landings ruin the pies. 110 s.",
  });
  set("race", { n: "05" });
  set("ramps", {
    n: "06",
    r: 1200,
    b: "Four ramps in order, each with its own trick: a clean hop, 1.6 s of air, a 360 SPIN off the Mega Ramp, 2.0 s off Double Up. 100 s.",
  });
  set("pad", {
    n: "07",
    t: "Running on Fumes",
    r: 1300,
    b: "Your air tank is cracked: it leaks and will not refill, and 18% will not get you up 45 m. Grab blue air canisters on the streets, then climb to Pad B. 75 s.",
  });
  set("truck", {
    n: "08",
    r: 1300,
    b: "Hit the street ramp fast, clear all three haulers, then stop inside the gold box before the junction. 40 s.",
  });
  set("chase", {
    n: "09",
    r: 1800,
    b: "VEX has the telemetry pod and he is twice as fast tonight. Touch his rear bumper inside 90 s. Boost the straights, cut the corners, or fly across.",
  });
  set("relay", {
    n: "10",
    t: "Hot Pads",
    r: 1500,
    b: "Pads light up in a random order, each on its own countdown. Land on all four. A bullseye landing adds 2 s to the next one.",
  });
  set("bigair", {
    n: "11",
    r: 1500,
    b: "Mega Ramp: 2.0 s of air AND land inside the gold zone. Too fast overshoots, too slow falls short. 60 s.",
  });
  set("loop", {
    n: "12",
    r: 1500,
    b: "Two full loops inside 60 s, 55 mph or more each time.",
  });
  set("skytour", {
    n: "13",
    r: 1800,
    b: "A VIP on board. Four sky rings, then the tower deck. No boost, no bumps, soft landings, or the VIP walks. 150 s.",
  });
  set("stuntshow", {
    n: "14",
    r: 2200,
    b: "15,000 points AND four kinds of trick in 75 s: air, spins, drifts, near misses, the loop. One kind of trick counts 5,000 at most.",
  });
  set("hotcell", { n: "15" });
  set("launchday", {
    n: "16",
    r: 2600,
    b: "From across town: the tower deck before T-0, watch the liftoff, then beat the booster back to the gold VIEW POINT.",
  });
  set("final", { n: "17" });
  ["hover", "drift", "deck", "catch", "jam"].forEach((id) =>
    set(id, { hidden: true }),
  );
  Object.assign(MEDAL, {
    launch: { t: 5.55, s: 5.8 },
    drone: { t: 55, s: 80 },
    rings: { t: 32, s: 40 },
    courier: { t: 65, s: 85 },
    ramps: { t: 55, s: 75 },
    pad: { t: 42, s: 55 },
    truck: { t: 12, s: 20 },
    chase: { t: 40, s: 60 },
    relay: { t: 85, s: 105 },
    bigair: { t: 12, s: 25 },
    loop: { t: 28, s: 42 },
    skytour: { t: 85, s: 105 },
    stuntshow: { t: 45, s: 60 },
    hotcell: { t: 33, s: 39 },
  });
  FLY_MISSIONS.delete("pad");
}

/* ---- the story: 14 chapters and the orbit, in the same order as the difficulty ---- */
{
  const C = (id, t, act, who, intro, outro, at, o) =>
      Object.assign({ t, mis: missionIndex(id), act, who, intro, outro, at }, o || {}),
    old = CHAPTERS.slice(),
    keep = (id) => old.find((c) => MISSIONS[c.mis] && MISSIONS[c.mis].id === id) || {};
  const N = [
    keep("tutorial"),
    keep("drone"),
    C(
      "rings",
      "NEON RINGS",
      0,
      "CONTROL",
      "Zero, Launch Control. Ten rings: the boulevard, a street canyon, gold ring to finish. Your clock only refills at a ring.",
      "Clean lines. Mae says she's drowning in orders.",
      [3.5, 352],
    ),
    C(
      "courier",
      "SPECIAL DELIVERY",
      0,
      "MAE",
      "Three orders: a street drop, a rooftop party, then my truck. It won't stop for you. And sugar, the pies bruise.",
      "Five stars. Oh, and the Chrome Kings heard about you. They want a race.",
      keep("courier").at,
    ),
    keep("race"),
    C(
      "ramps",
      "STUNT YARD",
      1,
      "VEX · CHROME KINGS",
      "Racing's one thing. Four ramps, four tricks, in order. The green ramp is the next one.",
      "Not bad. Control's been calling you. Something about a leak.",
      [-668.8, -20],
    ),
    C(
      "pad",
      "RUNNING ON FUMES",
      1,
      "CONTROL",
      "Zero, your air tank's cracked. It leaks and it won't refill. Repair crew's on Pad B, 45 metres up. Blue canisters on the streets.",
      "Patched up. Now the Kings want you over three trucks.",
      [3.5, 200],
    ),
    C(
      "truck",
      "TRUCK JUMP",
      1,
      "VEX · CHROME KINGS",
      "Three haulers across the street. Clear them, then park it in the gold box. Don't kiss the trucks.",
      "Cleared them and parked it. Fine. But I've still got something of yours. Catch me.",
      [-668.8, -50],
    ),
    C(
      "chase",
      "CATCH VEX",
      1,
      "VEX · CHROME KINGS",
      "You want the pod? I'm twice as fast tonight. Come take it off my bumper.",
      "...Fine. You caught me. Nobody catches me.",
      [-380.8, -30],
      { boss: true },
    ),
    C(
      "stuntshow",
      "STUNT SHOW",
      1,
      "GHOST · CHROME KINGS",
      "The crowd's here. Fifteen thousand points, four kinds of trick. Same trick over and over? Boring.",
      "They loved it. Control has a VIP for you.",
      [-668.8, -20],
    ),
    C(
      "skytour",
      "SKY TOUR",
      2,
      "CONTROL",
      "VIP on board. Four sky rings, then the tower deck. No boost, no bumps. They spook easy.",
      "The VIP says that beat the rocket. Megafab has a hot one for you.",
      [3.5, 160],
    ),
    C(
      "hotcell",
      "HOT CELL",
      2,
      "CONTROL",
      "Prototype cell from Megafab. It only cools in the wind. Under fifty, it cooks. Don't stop till the gate.",
      "Cell's safe. Launch is in minutes. Get to the tower.",
      [99.2, 578],
    ),
    Object.assign({}, keep("launchday"), { at: [306, 291.2] }),
    keep("final"),
    keep("orbit"),
  ];
  CHAPTERS.length = 0;
  N.forEach((c) => CHAPTERS.push(c));
}
// progress carries over: a chapter counts if its mission was cleared in the old order
{
  const v = store.get("rfc_story_v");
  if (v !== "26" && !(+v > 26)) {
    const done = +(store.get("rfc_story") || 0),
      oldOrder = [
        "tutorial",
        "drone",
        "pad",
        "courier",
        "race",
        "rings",
        "ramps",
        "truck",
        "loop",
        "chase",
        "stuntshow",
        "skytour",
        "launchday",
        "final",
        "orbit",
      ],
      cleared = new Set(oldOrder.slice(0, done));
    let nd = 0;
    while (nd < CHAPTERS.length && cleared.has(MISSIONS[CHAPTERS[nd].mis].id)) nd++;
    STORY.done = nd;
    store.set("rfc_story", String(nd));
    store.set("rfc_story_v", "26");
  }
}

/* ---- every mission says where to go, and the films show the real route ---- */
