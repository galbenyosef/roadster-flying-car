// index-inline-1 22 — hidden
// Lines 85051-85177 of readable/index-inline-1.pretty.js (statement-aligned).
function finish(ok, reason, stats) {
  if (!M || M.done) return;
  M.done = true;
  const d = M.def;
  M.lastTime = stats.time;
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
  earn(reward);
  if (M.story != null) storyAfter(ok);
  const storyK = M.story;
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
      $("msgbig").textContent = "";
      $("msgsmall").textContent = "";
      $("result").hidden = false;
      $("rname").textContent = `TEST ${d.n} · ${d.t.toUpperCase()}`;
      $("rbig").textContent = ok ? "PASSED" : "FAILED";
      $("rbig").className = "big " + (ok ? "ok" : "bad");
      $("rstats").innerHTML = [
        tx(reason),
        (M && M.chalTxt) || "",
        (M && M.medalTxt) || "",
        (M && M.shareHTML) || "",
        tm != null ? `Time: ${tm.toFixed(2)} s` : "",
        stats.land != null
          ? `Touchdown: ${stats.land.toFixed(2)} m/s (limit ${LIMIT})`
          : "",
        `Air left: ${Math.round(S.tank)}%`,
        best ? `Best: ${best.toFixed(2)} s` : "",
        reward
          ? `<b style="color:var(--gold)">+${reward.toLocaleString("en-US")} CR${first ? " · first clear" : ""}</b>`
          : "",
      ]
        .filter(Boolean)
        .join("<br>");
      $("rnext").hidden = storyK == null ? nextMis(mission) < 0 : !ok;
      $("rnext").textContent = storyK != null ? "CONTINUE STORY" : "NEXT TEST";
      $("rquote").textContent =
        storyK != null
          ? ok
            ? `${CH[storyK].who}: “${CH[storyK].outro}”`
            : ""
          : "";
      if (d.race) raceEnd();
      if (d.id === "chase") chaseEnd();
      DZ.visible = false;
      SKYR.visible = false;
      renderMissionList();
    },
    (ok ? 900 : 1300) +
      (cin.on && cin.kind === "finish"
        ? Math.max(0, cin.dur - cin.t) * 1000
        : 0) +
      (PF.on ? (PF.dur - PF.t) * 1000 + 250 : 0),
  );
}
$("rretry").addEventListener("click", () => {
  if (STORY.on && STORY.cur >= 0 && CH[STORY.cur].mis === lastMission) {
    $("result").hidden = true;
    startChapter(STORY.cur);
  } else startMission(lastMission);
});
$("rnext").addEventListener("click", () => {
  if (STORY.on) continueStory();
  else {
    const n = nextMis(lastMission);
    if (n >= 0) startMission(n);
  }
});
$("rmenu").addEventListener("click", toMenu);
$("free").addEventListener("click", startFree);
$("menubtn").addEventListener("click", () => {
  if (phase === "play") pauseOpen();
  else toMenu();
});
function toMenu() {
  ghostHide();
  document.body.classList.remove("playing");
  if (cut) {
    cut = null;
    document.body.classList.remove("intro");
    $("cutUI").hidden = true;
  }
  if (cin.on) endCin();
  clearMissionProps();
  M = null;
  mission = null;
  applyVehicle(VSEL());
  renderHome();
  phase = "title";
  $("result").hidden = true;
  $("title").hidden = false;
  ["side", "console", "menubtn", "mission", "mm"].forEach(
    (id) => ($(id).hidden = true),
  );
  $("touch").hidden = true;
  renderMissionList();
}
document.querySelectorAll(".sw").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".sw")
      .forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
    curPaint = b.dataset.c;
    applyVehicle(veh);
  }),
);
