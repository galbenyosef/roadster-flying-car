// index-inline-1 21 — byid
// Lines 84772-85050 of readable/index-inline-1.pretty.js (statement-aligned).
function renderGarage() {
  byId("glist").innerHTML = SKINS.map((s) => {
    const own = ECONOMY.skins.has(s.id),
      sel = ECONOMY.skin === s.id,
      can = ECONOMY.cr >= s.price;
    const E = (window.__EARN || {})[s.id];
    const btn = own
      ? sel
        ? '<button class="gbtn" disabled>EQUIPPED</button>'
        : `<button class="gbtn" data-sel="${s.id}">EQUIP</button>`
      : E
        ? `<button class="gbtn" disabled>EARN · ${Math.min(E.have(), window.__eNeed(E))} / ${window.__eNeed(E)}</button><div class="gt" style="margin-top:4px;opacity:.85">${E.txt}</div>`
        : `<button class="gbtn buy" data-buy="${s.id}" ${can ? "" : "disabled"}>${can ? "BUY" : "NEED"} · ${s.price.toLocaleString("en-US")} CR</button>`;
    return `<div class="gcar skin${sel ? " sel" : ""}${s.tier !== "STANDARD" ? " lux" : ""}" data-pick="${s.id}"><div class="sw2" style="background:${skinSwatch(s)}"></div><div class="gtier${s.tier === "PREMIUM" ? " prem" : ""}">${s.tier}${s.perk ? ` · +${Math.round(s.perk * 100)}% CREDITS` : ""}</div><div class="gn">${s.n}</div><div class="gt">${s.tag}</div>${btn}</div>`;
  }).join("");
}
function renderBoost() {
  byId("blist").innerHTML = UPGRADES.map((u) => {
    const l = upgradeLevel(u.id),
      c = UCOST[l],
      max = l >= 3;
    return `<div class="urow"><div><div class="un">${u.n}</div><div class="ud">${u.d}</div><div class="pips">${[0, 1, 2].map((i) => `<i class="${i < l ? "on" : ""}"></i>`).join("")}</div></div>
  ${max ? '<button class="gbtn" disabled>MAX</button>' : `<button class="gbtn buy" data-up="${u.id}" ${ECONOMY.cr >= c ? "" : "disabled"}>${c.toLocaleString("en-US")} CR</button>`}</div>`;
  }).join("");
}
function renderHome() {
  saveEco();
  renderMissionList();
  renderGarage();
  renderBoost();
  const k = storyNext();
  byId("sdots").innerHTML = CHAPTERS.map(
    (c, i) =>
      `<i class="${i < STORY.done ? "on" : i === k ? "cur" : ""}" title="${c.t}"></i>`,
  ).join("");
  byId("stitle").textContent =
    k < 0
      ? "Story complete · replay from Chapter 1"
      : `Chapter ${k + 1} · ${CHAPTERS[k].t[0] + CHAPTERS[k].t.slice(1).toLowerCase()}`;
  byId("storyBtn").textContent =
    k < 0
      ? "REPLAY STORY"
      : STORY.done === 0
        ? "START STORY"
        : "CONTINUE STORY";
  const sk = activeSkin();
  byId("skinSw").style.background = skinSwatch(sk);
  byId("skinN").textContent = sk.n;
  byId("skinT").textContent =
    sk.tier + (sk.perk ? ` · +${Math.round(sk.perk * 100)}% CREDITS` : "");
  if (ECONOMY.refund) {
    byId("glead").textContent =
      `One car now: the Roadster. Your old cars were refunded: +${ECONOMY.refund.toLocaleString("en-US")} CR.`;
  }
}
byId("storyBtn").addEventListener("click", startStory);
byId("yardBtn").addEventListener("click", () => {
  startFree();
  place(-668.8, -20, 0);
  flash("STUNT YARD", "6 ramps · wheels only · go fast", 2.6);
});
byId("finalBtn").addEventListener("click", () => {
  STORY.on = false;
  startMission(MISSIONS.findIndex((m) => m.id === "final"));
});
byId("raceBtn").addEventListener("click", () => {
  STORY.on = false;
  startMission(MISSIONS.findIndex((m) => m.id === "race"));
});
byId("home").addEventListener("click", (e) => {
  const b = e.target.closest("button,[data-pick]");
  if (!b) return;
  const d = b.dataset;
  if (d.tab) {
    document
      .querySelectorAll("#home .tabs button")
      .forEach((x) => x.classList.toggle("on", x.dataset.tab === d.tab));
    document
      .querySelectorAll("#home .tab")
      .forEach((s) => s.classList.toggle("on", s.id === "tab-" + d.tab));
    if (d.tab !== "garage") applySkin(activeSkin());
    audio.servo();
    return;
  }
  if (d.buy) {
    const sk = SKINS.find((x) => x.id === d.buy);
    if (ECONOMY.cr >= sk.price) {
      ECONOMY.cr -= sk.price;
      ECONOMY.skins.add(sk.id);
      ECONOMY.skin = sk.id;
      applySkin(sk);
      audio.chime();
      renderHome();
    }
    return;
  }
  if (d.sel || (d.pick && ECONOMY.skins.has(d.pick))) {
    ECONOMY.skin = d.sel || d.pick;
    applySkin(activeSkin());
    audio.servo();
    renderHome();
    return;
  }
  if (d.pick) {
    applySkin(SKINS.find((x) => x.id === d.pick));
    document
      .querySelectorAll("#glist .gcar")
      .forEach((c) => c.classList.toggle("pv", c.dataset.pick === d.pick));
    return;
  } // preview a skin you do not own yet
  if (d.up) {
    const l = upgradeLevel(d.up),
      c = UCOST[l];
    if (l < 3 && ECONOMY.cr >= c) {
      ECONOMY.cr -= c;
      ECONOMY.upg[d.up] = l + 1;
      audio.chime();
      renderHome();
    }
  }
});
MISSIONS.push({
  id: "jam",
  r: 300,
  n: "00",
  t: "Over the Jam",
  b: "The road ahead is jammed. Open the plate, lift over the traffic and land on the Pad A roof. 90 s.",
  spawn: () => place(CAR_START.x, CAR_START.z, Math.PI / 2),
});
function begin() {
  audio.init();
  document.body.classList.add("playing");
  byId("gate").hidden = true;
  byId("intro").hidden = true;
  document.body.classList.remove("intro");
  byId("title").hidden = true;
  byId("result").hidden = true;
  ["side", "console", "menubtn", "mm"].forEach((id) => (byId(id).hidden = false));
  byId("touch").hidden = !isTouch;
  phase = "play";
}
function startFree() {
  ghostHide();
  CHAL.on = null;
  ONCE.arm = ONCE.hover = false;
  STORY.on = false;
  clearMissionProps();
  mission = null;
  currentMission = null;
  applyVehicle(SELECTED_VEHICLE());
  begin();
  place(3.5, 440, 0);
  carState.tank = 100;
  carState.heat = 25;
  byId("mission").hidden = true;
  byId("lapcard").hidden = false;
  RINGS.forEach((r) => {
    r.m.visible = true;
    r.m.material.emissive.set(0x28e0ff);
  });
  PADS.forEach((p) => (p.beam.visible = true));
  flash(
    "FREE ROAM",
    `${KEY_LABELS("rocket")} = ROCKET MODE · ${KEY_LABELS("hover")} to lift off · ${TOKENS.length} sky tokens · Stunt Yard out west`,
    3.5,
  );
}
function startMission(i) {
  ONCE.arm = ONCE.hover = false;
  mission = i;
  lastMission = i;
  const d = MISSIONS[i];
  const pv = SELECTED_VEHICLE();
  applyVehicle(pv.fly ? pv : VEHICLES[0]);
  begin();
  clearMissionProps();
  if (d.id === "deck" || d.id === "launchday") {
    resetLaunch(LAUNCH.cycle - 60);
  }
  if (d.id === "catch") {
    resetLaunch(0);
    Object.assign(LAUNCH, { st: "gone", t: -6, half: false });
    ROCKET.g.visible = false;
  }
  if (d.id === "tutorial") TUTORIAL.live = false;
  d.spawn();
  if (d.id === "jam") jamOn();
  carState.tank = 100;
  carState.heat = 25;
  currentMission = {
    def: d,
    best: 0,
    t0: clock,
    started: false,
    done: false,
    hover: 0,
    ring: 0,
    landedT: null,
    pts: 0,
    step: 0,
    rs: "grid",
    gt: 0,
    lap: 0,
    cp: 0,
    sp: d.id === "chase" ? CHASE.s : RACE.off - 14,
    pprog: -14,
    tail: 0,
    far: 0,
    dz: 0,
    hit: new Set(),
  };
  ghostStart(d.id);
  SCORE.drift = 0;
  byId("mission").hidden = false;
  byId("lapcard").hidden = true;
  byId("mname").textContent = `TEST ${d.n} · ${d.t.toUpperCase()}`;
  RINGS.forEach((r, k) => {
    r.m.visible = d.id === "rings";
    r.m.material.emissive.set(k === 0 ? 0xffb35c : 0x28e0ff);
  });
  PADS.forEach(
    (p) =>
      (p.beam.visible =
        (d.id === "hover" && p.label === "BOX") ||
        (d.id === "jam" && p.label === "A") ||
        (d.id === "pad" && p.label === "B") ||
        (d.id === "rings" && p.label === "C") ||
        (d.id === "relay" && p.label === "A") ||
        (d.id === "deck" && p.label === "L") ||
        (d.id === "launchday" && p.label === "L")),
  );
  TOUR_MARKERS.visible = d.id === "skytour";
  TOUR_MARKERS.children.forEach((m, k) =>
    m.material.emissive.set(k === 0 ? 0xffb35c : 0x28e0ff),
  );
  if (d.id === "courier" || d.id === "catch") {
    DROP_ZONE.visible = true;
    zoneColor(d.id === "catch" ? 0xffc24a : 0x28e0ff);
    const q = d.id === "catch" ? VIEWPOINT : DROPS[0];
    DROP_ZONE.position.set(q[0], 0, q[1]);
  }
  if (d.id === "ramps")
    RAMPS.forEach((r) => {
      if (r.name !== "POND JUMP") r.bar.color.setRGB(0.4, 3, 1.2);
    });
  if (d.id === "truck" || d.id === "bigair") {
    const nm = d.id === "truck" ? "TRUCK JUMP" : "MEGA RAMP";
    RAMPS.forEach((r) => {
      if (r.name === nm) r.bar.color.setRGB(0.4, 3, 1.2);
    });
  }
  flash(d.t.toUpperCase(), d.b, 3.2);
  prevZ = carState.z;
  v26Setup(d);
  if (d.id === "final" && finalSeen) {
    flashT = 0;
    byId("msgbig").textContent = "";
    byId("msgsmall").textContent = "";
    rivalTags(true);
    flash("SHOWDOWN", "two laps · only a win counts", 2.2);
  } else if (d.id === "final") {
    finalSeen = true;
    flashT = 0;
    byId("msgbig").textContent = "";
    byId("msgsmall").textContent = "";
    startCut(SHOWDOWN, () => {
      rivalTags(true);
      begin();
      byId("mission").hidden = false;
      phase = "play";
      if (currentMission) {
        currentMission.t0 = clock;
        currentMission.gt = 0;
        if (currentMission.cutEnd) currentMission.cutEnd();
      }
      flash("SHOWDOWN", "two laps · only a win counts", 2.2);
    });
  }
}
