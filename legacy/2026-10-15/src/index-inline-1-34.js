// index-inline-1 34 — three
// Lines 89207-89480 of readable/index-inline-1.pretty.js (statement-aligned).
const DZ = (() => {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.3, 2.4, 2.8),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 6, 56), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.3;
  g.add(ring);
  const bm = new THREE.MeshBasicMaterial({
    color: 0x28e0ff,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 5.6, 70, 32, 1, true),
    bm,
  );
  beam.position.y = 35;
  g.add(beam);
  g.userData = { m, bm };
  g.visible = false;
  scene.add(g);
  return g;
})();
function zoneColor(hex) {
  const c = new THREE.Color(hex);
  DZ.userData.m.color.copy(c).multiplyScalar(2.6);
  DZ.userData.bm.color.copy(c);
}
const SKYR = (() => {
  const g = new THREE.Group();
  STOUR.forEach((r, i) => {
    const pv = STOUR[i - 1] || [48, 30, 144];
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.36, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: 0x28e0ff,
        emissiveIntensity: 3.2,
      }),
    );
    m.position.set(r[0], r[1], r[2]);
    m.rotation.y = Math.atan2(r[0] - pv[0], r[2] - pv[2]);
    g.add(m);
  });
  g.visible = false;
  scene.add(g);
  return g;
})();
function clearMissionProps() {
  jamOff();
  tutHide();
  v26Clear();
  DZ.visible = false;
  SKYR.visible = false;
  chaseEnd();
  raceEnd();
  RAMPS.forEach((r) => r.bar.color.setRGB(3, 1.9, 0.3));
}
function navLabel() {
  if (!M && STORY.on) return "Z MARKER";
  if (!M || M.done) return "";
  const d = M.def.id;
  {
    const x = navLabel23(d);
    if (x) return x;
  }
  return (
    {
      hover: "THE BOX",
      pad: "PAD B",
      rings: M.ring < RINGS.length ? `RING ${M.ring + 1}` : "PAD C",
      relay: "PAD " + ["A", "C", "B"][Math.min(2, M.step)],
      deck: "TOWER DECK",
      race: `GATE ${M.cp + 1}/${RACE.gates.length}`,
      final: `GATE ${M.cp + 1}/${RACE.gates.length}`,
      truck: "TRUCK JUMP",
      bigair: "MEGA RAMP",
      loop: "THE LOOP",
      courier: `DROP ${Math.min(M.step + 1, DROPS.length)}/${DROPS.length}`,
      ramps: "NEXT RAMP",
      chase: "VEX",
      skytour: M.ring < STOUR.length ? STOUR[M.ring][3] : "TOWER DECK",
      catch: "VIEW POINT",
    }[d] || ""
  );
}
function updateNav() {
  const tg = phase === "play" && !cin.on ? mapTarget() : null,
    el = $("nav"),
    tc = $("turnCue");
  if (!tg) {
    if (!el.hidden) el.hidden = true;
    tc.classList.remove("on");
    return;
  }
  if (el.hidden) el.hidden = false;
  const dx = tg.x - S.x,
    dz = tg.z - S.z,
    fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)],
    rt = [Math.cos(S.yaw), -Math.sin(S.yaw)],
    a = Math.atan2(dx * rt[0] + dz * rt[1], dx * fw[0] + dz * fw[1]),
    dist = Math.hypot(dx, dz);
  $("navA").style.transform = `rotate(${a.toFixed(2)}rad)`;
  setT("navT", navLabel());
  setT(
    "navD",
    dist < 1000
      ? `${Math.round(dist / 5) * 5} m`
      : `${(dist / 1000).toFixed(1)} km`,
  );
  let cue = null;
  if (M && !M.done && (M.def.race || M.def.id === "chase") && M.rs === "run") {
    const Pa = M.def.race ? RACE : CHASE;
    let bd = 1e9,
      bt = null;
    for (const t of Pa.turns) {
      let d = t.s - 10 - M.sp;
      d = ((d % Pa.len) + Pa.len) % Pa.len;
      if (d < bd) {
        bd = d;
        bt = t;
      }
    }
    if (bt && bd < 170) cue = { dir: bt.dir, d: bd };
  }
  if (cue && flashT <= 0) {
    tc.classList.add("on");
    tc.classList.toggle("now", cue.d < 55);
    tc.classList.toggle("l", cue.dir === "LEFT");
    setT("tcT", `${cue.dir} TURN`);
    setT("tcD", cue.d < 12 ? "NOW" : `${Math.round(cue.d / 5) * 5} m`);
    setT("tcA", cue.dir === "RIGHT" ? "›››" : "‹‹‹");
  } else tc.classList.remove("on");
}
function storyNext() {
  return STORY.done < CH.length ? STORY.done : -1;
}
function updateMarker(t) {
  const k = storyNext(),
    show = STORY.on && phase === "play" && !M && k >= 0;
  MK.visible = show;
  if (!show) return;
  const a = CH[k].at;
  MK.position.set(a[0], 0, a[1]);
  MK.userData.sp.position.y = 4.5 + Math.sin(t * 2.5) * 0.4;
  MK.children[0].rotation.z = t;
  if (Math.hypot(S.x - a[0], S.z - a[1]) < 6 && S.y < 4 && !cin.on)
    startChapter(k);
}
function startChapter(k) {
  STORY.on = true;
  STORY.cur = k;
  const C = CH[k];
  if (C.orbit) {
    startOrbit(k);
    return;
  }
  startMission(C.mis);
  M.story = k;
  if (M.def.id === "final") {
    M.cutEnd = () => showSub(C.who, C.intro, 5);
    if (!M.cutEnd.played && finalSeen && phase === "play")
      showSub(C.who, C.intro, 5);
    return;
  }
  flashT = 0;
  $("msgbig").textContent = "";
  $("msgsmall").textContent = "";
  if (k === 0) place(CARP.x, CARP.z, Math.PI / 2);
  if (k === 0 || SEEN_CH.has(k)) {
    SEEN_CH.add(k);
    phase = "play";
    M.t0 = clock;
    showSub(C.who, C.intro, k === 0 ? 6 : 5.5);
    return;
  }
  SEEN_CH.add(k);
  storyFilm(k);
}
function startStory() {
  STORY.on = true;
  applyVehicle(VSEL());
  if (STORY.done >= CH.length) {
    STORY.done = 0;
    store.set("rfc_story", "0");
  }
  if (STORY.done === 0) {
    startCut(OPENING, () => {
      startChapter(0);
    });
    return;
  }
  mission = null;
  M = null;
  begin();
  clearMissionProps();
  place(DINER.x0 - 8 + 3.2, (DINER.z0 + DINER.z1) / 2, 0);
  S.tank = 100;
  S.heat = 25;
  $("mission").hidden = true;
  PADS.forEach((p) => (p.beam.visible = false));
  RINGS.forEach((r) => (r.m.visible = false));
  const k = storyNext();
  flash(
    `CHAPTER ${k + 1} · ${CH[k].t}`,
    "drive to the gold Z marker on your map",
    3.4,
  );
}
function storyAfter(ok) {
  const k = M.story;
  if (ok) {
    STORY.done = Math.max(STORY.done, k + 1);
    store.set("rfc_story", String(STORY.done));
  }
}
function continueStory() {
  ONCE.arm = ONCE.hover = false;
  $("result").hidden = true;
  mission = null;
  M = null;
  clearMissionProps();
  begin();
  $("mission").hidden = true;
  PADS.forEach((p) => (p.beam.visible = false));
  RINGS.forEach((r) => (r.m.visible = false));
  const k = storyNext();
  if (k < 0) {
    flash("STORY COMPLETE", "Zero made the team. Free roam is all yours.", 4);
    showSub(
      "CONTROL",
      "Take the night off, Zero. Rocket flies again in a few minutes.",
      5,
    );
    return;
  }
  flash(
    `CHAPTER ${k + 1} · ${CH[k].t}`,
    "drive to the gold Z marker on your map",
    3.4,
  );
  setTimeout(() => showSub(CH[k].who, "Meet me at the marker.", 3.5), 1200);
}
/* ---------------- SHOWDOWN: the final race intro + photo finish ---------------- */
function vsShow(on) {
  const el = $("vs");
  if (on) {
    $("vsL2").textContent = "ROADSTER · " + SKIN().n;
    el.hidden = false;
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
  } else {
    el.classList.remove("on");
    setTimeout(() => {
      if (!el.classList.contains("on")) el.hidden = true;
    }, 500);
  }
}
const rivalTags = (on) =>
  RIVALS.forEach((r) =>
    r.g.children.forEach((c) => {
      if (c.isSprite) c.visible = on;
    }),
  );
