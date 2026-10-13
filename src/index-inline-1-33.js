// index-inline-1 33 — mis
// Lines 88888-89206 of readable/index-inline-1.pretty.js (statement-aligned).
function chaseEnd() {
  if (!CHASE.on) return;
  CHASE.on = false;
  Z70.visible = false;
  CHASE.group.visible = false;
  RIVALS.forEach((r) => (r.g.visible = false));
  rivalWheels();
}
function updateChase(dt) {
  const v = RIVALS[0],
    run = M && M.def.id === "chase" && M.rs === "run" && !M.done;
  if (run) {
    const sm = ((v.prog % CHASE.len) + CHASE.len) % CHASE.len;
    let dc = 1e9;
    for (const c of CHASE.corners) {
      let d = c - sm;
      if (d < 0) d += CHASE.len;
      dc = Math.min(dc, d);
    }
    const dd = Math.hypot(S.x - v.g.position.x, S.z - v.g.position.z),
      rb = dd > 80 ? -5 : dd < 25 ? 6 : 0;
    v.bcd = Math.max(0, (v.bcd || 0) - dt);
    v.bst = Math.max(0, (v.bst || 0) - dt);
    if (dd < VX.trig && v.bcd <= 0) {
      v.bst = 3;
      v.bcd = VX.cd;
      radio("VEX", "boost", true);
    }
    const vt = Math.min(
      v.bst > 0 ? VX.boost : VX.cruise + rb * VX.rb,
      VX.c0 + dc * VX.c1,
    );
    v.sp += clamp(vt - v.sp, -VX.dec * dt, (v.bst > 0 ? VX.ab : VX.a) * dt);
    v.prog += v.sp * dt;
  }
  const p = pathAtP(CHASE, v.prog),
    q = pathAtP(CHASE, v.prog + 4);
  v.g.position.set(p.x, 0, p.z);
  v.g.rotation.y = Math.atan2(-(q.x - p.x), -(q.z - p.z));
  v.spin -= (v.sp / 0.36) * dt;
  Z70.position.set(p.x, 0.32, p.z);
}
function updateRivals(dt) {
  if (CHASE.on) {
    updateChase(dt);
    rivalWheels();
    return;
  }
  if (!RACE.on) return;
  const run = M && M.def.race && M.rs === "run" && !M.done;
  const pp = M ? M.pprog || 0 : 0;
  for (const [ri, r] of RIVALS.entries()) {
    if (run) {
      const sm = (((r.prog + RACE.off) % RACE.len) + RACE.len) % RACE.len;
      let dc = 1e9;
      for (const c of RACE.corners) {
        let d = c - sm;
        if (d < 0) d += RACE.len;
        dc = Math.min(dc, d);
      }
      const rb = clamp((pp - r.prog) / 200, RACE.rb[0], RACE.rb[1]) * 4,
        vt = Math.min(RACE.rv[ri] + rb, RACE.cv[0] + dc * RACE.cv[1]);
      r.sp += clamp(vt - r.sp, -16 * dt, (RACE.acc || 7) * dt);
      r.prog += r.sp * dt;
    }
    const p = pathAt(r.prog + RACE.off),
      q = pathAt(r.prog + RACE.off + 4),
      yaw = Math.atan2(-(q.x - p.x), -(q.z - p.z));
    r.g.position.set(p.x + -p.tz * -r.lat * -1, 0, p.z + p.tx * -r.lat * -1);
    r.g.rotation.y = yaw;
    r.spin -= (r.sp / 0.36) * dt;
  }
  rivalWheels();
}

/* ---------------- story: chapters, markers between them ---------------- */
const MI = (id) => MIS.findIndex((m) => m.id === id);
const CH = [
  {
    t: "OVER THE JAM",
    mis: MI("jam"),
    who: "MAE",
    intro: "Plate. Then hold.",
    outro:
      "Right over the top of them! Now let's see you hover like you mean it.",
    at: [3.5, 452],
  },
  {
    t: "LIFT OFF",
    mis: MI("hover"),
    who: "MAE",
    intro: "Plaza, the painted box. Hover, hold it, then set her down soft.",
    outro: "Soft as a pancake. Launch Control wants a word with you.",
    at: [48, 372],
  },
  {
    t: "ROOFTOPS",
    mis: MI("pad"),
    who: "CONTROL",
    intro:
      "Zero, Launch Control. Take her from the Pad A roof to Pad B. Clock's running.",
    outro: "Clean. You'd make a fine courier.",
    at: [3.5, 200],
  },
  {
    t: "NEON RINGS",
    mis: MI("rings"),
    who: "CONTROL",
    intro: "Six rings down the boulevard, then Pad C. Thread them.",
    outro: "Nice lines. Somebody noticed you. Heads up.",
    at: [3.5, 372],
  },
  {
    t: "SIDEWAYS",
    mis: MI("drift"),
    who: "VEX · CHROME KINGS",
    intro: "So you're the new toy. Can you slide, or just float? 4,000 points.",
    outro: "Okay. Okay. The Chrome Kings want a real race.",
    at: [3.5, 470],
  },
  {
    t: "CHROME KINGS",
    mis: MI("race"),
    who: "VEX · CHROME KINGS",
    intro:
      "Two laps: boulevard, park, the fab, home. Watch the arrows. Beat me and we'll talk.",
    outro: "...Fine. You're fast. Mae's been calling, she needs a driver.",
    at: [3.2, 410],
  },
  {
    t: "SPECIAL DELIVERY",
    mis: MI("courier"),
    who: "MAE",
    intro:
      "Three orders, still hot. Drop zones are on your map. Stop inside each one. Don't make me reheat anything.",
    outro:
      "Five stars, sugar. Oh, and the Kings say they'll be waiting at the Stunt Yard.",
    at: [0, 0],
  },
  {
    t: "STUNT YARD",
    mis: MI("ramps"),
    who: "VEX · CHROME KINGS",
    intro:
      "Racing's one thing. Can you fly without the jets? Four ramps. Land every one.",
    outro: "Not bad. Now the real one: three trucks, one street over.",
    at: [-668.8, -20],
  },
  {
    t: "TRUCK JUMP",
    mis: MI("truck"),
    who: "VEX · CHROME KINGS",
    intro:
      "Three haulers parked across the street. Hit the ramp hard and fly over them. Don't kiss the trucks.",
    outro:
      "You actually cleared them. Fine. But I've still got something of yours. Catch me.",
    at: [-668.8, -50],
  },
  {
    t: "TAIL VEX",
    mis: MI("chase"),
    who: "CONTROL",
    intro:
      "Zero, VEX lifted our telemetry pod. Stay on his tail, inside 70 m. Step outside the ring and he's gone.",
    outro: "He pulled over and handed it back. Kids. Get back to the rooftops.",
    at: [-380.8, -30],
  },
  {
    t: "ROOFTOP RELAY",
    mis: MI("relay"),
    who: "CONTROL",
    intro: "Three rooftops. A, then C, then B. Each pad tops up your air.",
    outro: "Perfect relay. We have a VIP who wants the sky tour.",
    at: [48, 372],
  },
  {
    t: "SKY TOUR",
    mis: MI("skytour"),
    who: "CONTROL",
    intro:
      "VIP on board. Four sky rings: the wheel, the diner, Megafab, the tower. Each ring tops up your air.",
    outro:
      "The VIP says that beat the rocket. The Kings want one more stunt from you.",
    at: [3.5, 160],
  },
  {
    t: "BIG AIR",
    mis: MI("bigair"),
    who: "VEX · CHROME KINGS",
    intro: "Mega Ramp. Two seconds in the air or it doesn't count.",
    outro:
      "Two seconds of nothing but sky. Respect. Now give the crowd a show.",
    at: [-610, 40],
  },
  {
    t: "STUNT SHOW",
    mis: MI("stuntshow"),
    who: "VEX · CHROME KINGS",
    intro:
      "Everything counts: air, drifts, near misses. Thirty-five hundred points, one minute.",
    outro: "The crowd loved it. Control's calling you for the launch.",
    at: [-668.8, -20],
  },
  {
    t: "FRONT ROW SEAT",
    mis: MI("deck"),
    who: "CONTROL",
    intro: "Tower deck, 100 metres up, before T-0. Best seat in the house.",
    outro: "Liftoff! Now get down there. It's coming back.",
    at: [387.5, 556],
  },
  {
    t: "BOOSTER CATCH",
    mis: MI("catch"),
    who: "CONTROL",
    intro:
      "The booster is coming home. Viewing field, inside the gold ring, before touchdown. Do not stand on the pad.",
    outro:
      "Touchdown, dead centre. VEX says there is a loop at the Stunt Yard with your name on it.",
    at: [20, 372],
  },
  {
    t: "LOOP THE LOOP",
    mis: MI("loop"),
    who: "VEX · CHROME KINGS",
    intro:
      "We built a loop in the arena. Nobody's gone all the way round yet. Fifty-five miles an hour, minimum.",
    outro: "All the way round, upside down. Okay, Zero. One race left.",
    at: [-816, 60],
  },
  {
    t: "SHOWDOWN",
    mis: MI("final"),
    who: "VEX · CHROME KINGS",
    intro: "Last race. The whole Strip, two laps. Winner owns the night.",
    outro: "...You won. Fair and square. The Strip is yours, Zero.",
    at: [3.5, 300],
  },
];
CH[6].at = [DINER.x0 - 4.8, (DINER.z0 + DINER.z1) / 2 + 24];
const STORY = { done: jget("rfc_story", 0), on: false, cur: -1 };
// v14 inserted chapters 7-9 and 11: keep the first six, replay the rest in the new order
{
  const v = store.get("rfc_story_v");
  if (v !== "16" && !(+v > 16)) {
    STORY.done =
      v === "15"
        ? STORY.done >= 17
          ? 18
          : STORY.done
        : Math.min(STORY.done, v === "14" ? 8 : 6);
    store.set("rfc_story", String(STORY.done));
    store.set("rfc_story_v", "16");
  }
}
const MK = (() => {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(3, 2, 0.4),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 5, 48), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.35;
  g.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 4.6, 60, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffc24a,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  beam.position.y = 30;
  g.add(beam);
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const x = cv.getContext("2d");
  x.fillStyle = "#ffc24a";
  x.beginPath();
  x.arc(128, 128, 120, 0, 7);
  x.fill();
  x.fillStyle = "#0b0c0e";
  x.font = "900 150px Saira, Arial Black, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("Z", 128, 138);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, depthWrite: false }),
  );
  sp.scale.set(3.4, 3.4, 1);
  sp.position.y = 4.5;
  g.add(sp);
  g.userData.sp = sp;
  g.visible = false;
  scene.add(g);
  return g;
})();
// mission props: a ground zone (drops, view point) and the sky-tour rings
const DROPS = [
    [-192, 192],
    [-576, -288],
    [96, -480],
  ],
  VP = [600, 440];
const STOUR = [
  [-48, 104, 144, "HALO WHEEL"],
  [200, 78, 300, "SKYLINE DINER"],
  [432, 54, 432, "MEGAFAB"],
  [552, 128, 528, "LAUNCH TOWER"],
];
