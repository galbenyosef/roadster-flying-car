// index-inline-1 22 — byid
// Lines 85051-85177 of readable/index-inline-1.pretty.js (statement-aligned).
function finish(ok, reason, stats) {
  if (!currentMission || currentMission.done) return;
  currentMission.done = true;
  const d = currentMission.def;
  currentMission.lastTime = stats.time;
  medalCalc(ok, stats);
  ghostSave(ok, stats);
  shareCalc(ok);
  let best = parseFloat(store.get("rfc_" + d.id)) || null;
  const tm = stats.time;
  let first = best === null,
    reward = ok ? (first ? d.r : Math.round(d.r / 4)) : 0;
  if (d.race) {
    reward = (RACE.final ? [5000, 1500, 600, 200] : [1500, 700, 300, 100])[
      (stats.pos || 4) - 1
    ];
    first = false;
  }
  earnCredits(reward);
  if (currentMission.story != null) storyAfter(ok);
  const storyK = currentMission.story;
  if (ok && (best === null || tm < best)) {
    best = tm;
    store.set("rfc_" + d.id, tm.toFixed(3));
  }
  if (ok) audio.chime();
  else audio.fail();
  setTimeout(
    () => {
      phase = "result";
      flashT = 0;
      byId("msgbig").textContent = "";
      byId("msgsmall").textContent = "";
      byId("result").hidden = false;
      byId("rname").textContent = `TEST ${d.n} · ${d.t.toUpperCase()}`;
      byId("rbig").textContent = ok ? "PASSED" : "FAILED";
      byId("rbig").className = "big " + (ok ? "ok" : "bad");
      byId("rstats").innerHTML = [
        touchText(reason),
        (currentMission && currentMission.chalTxt) || "",
        (currentMission && currentMission.medalTxt) || "",
        (currentMission && currentMission.shareHTML) || "",
        tm != null ? `Time: ${tm.toFixed(2)} s` : "",
        stats.land != null
          ? `Touchdown: ${stats.land.toFixed(2)} m/s (limit ${LIMIT})`
          : "",
        `Air left: ${Math.round(carState.tank)}%`,
        best ? `Best: ${best.toFixed(2)} s` : "",
        reward
          ? `<b style="color:var(--gold)">+${reward.toLocaleString("en-US")} CR${first ? " · first clear" : ""}</b>`
          : "",
      ]
        .filter(Boolean)
        .join("<br>");
      byId("rnext").hidden = storyK == null ? nextMis(mission) < 0 : !ok;
      byId("rnext").textContent = storyK != null ? "CONTINUE STORY" : "NEXT TEST";
      byId("rquote").textContent =
        storyK != null
          ? ok
            ? `${CHAPTERS[storyK].who}: “${CHAPTERS[storyK].outro}”`
            : ""
          : "";
      if (d.race) raceEnd();
      if (d.id === "chase") chaseEnd();
      DROP_ZONE.visible = false;
      TOUR_MARKERS.visible = false;
      renderMissionList();
    },
    (ok ? 900 : 1300) +
      (cinematic.on && cinematic.kind === "finish"
        ? Math.max(0, cinematic.dur - cinematic.t) * 1000
        : 0) +
      (PHOTO_FINISH.on ? (PHOTO_FINISH.dur - PHOTO_FINISH.t) * 1000 + 250 : 0),
  );
}
byId("rretry").addEventListener("click", () => {
  if (STORY.on && STORY.cur >= 0 && CHAPTERS[STORY.cur].mis === lastMission) {
    byId("result").hidden = true;
    startChapter(STORY.cur);
  } else startMission(lastMission);
});
byId("rnext").addEventListener("click", () => {
  if (STORY.on) continueStory();
  else {
    const n = nextMis(lastMission);
    if (n >= 0) startMission(n);
  }
});
byId("rmenu").addEventListener("click", toMenu);
byId("free").addEventListener("click", startFree);
byId("menubtn").addEventListener("click", () => {
  if (phase === "play") pauseOpen();
  else toMenu();
});
function toMenu() {
  ghostHide();
  document.body.classList.remove("playing");
  if (activeCut) {
    activeCut = null;
    document.body.classList.remove("intro");
    byId("cutUI").hidden = true;
  }
  if (cinematic.on) endCin();
  clearMissionProps();
  currentMission = null;
  mission = null;
  applyVehicle(SELECTED_VEHICLE());
  renderHome();
  phase = "title";
  byId("result").hidden = true;
  byId("title").hidden = false;
  ["side", "console", "menubtn", "mission", "mm"].forEach(
    (id) => (byId(id).hidden = true),
  );
  byId("touch").hidden = true;
  renderMissionList();
}
document.querySelectorAll(".sw").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".sw")
      .forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
    curPaint = b.dataset.c;
    applyVehicle(activeVehicle);
  }),
);
