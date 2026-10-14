// index-inline-1 60 — cloud
// Lines 97291-97634 of readable/index-inline-1.pretty.js (statement-aligned).
async function progCard() {
  const p = progStats(),
    W = 1200,
    H = 675,
    cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d");
  let bg = null;
  try {
    composer.render();
    bg = renderer.domElement;
  } catch (e) {}
  if (bg) {
    const sw = bg.width,
      sh = bg.height,
      ar = W / H;
    let w = sw,
      h = sh,
      ox = 0,
      oy = 0;
    if (sw / sh > ar) {
      w = sh * ar;
      ox = (sw - w) / 2;
    } else {
      h = sw / ar;
      oy = (sh - h) / 2;
    }
    x.drawImage(bg, ox, oy, w, h, 0, 0, W, H);
  } else {
    x.fillStyle = "#07080c";
    x.fillRect(0, 0, W, H);
  }
  const gr = x.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, "rgba(6,8,11,.92)");
  gr.addColorStop(0.62, "rgba(6,8,11,.55)");
  gr.addColorStop(1, "rgba(6,8,11,.15)");
  x.fillStyle = gr;
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff";
  x.font = "900 92px Saira, Arial Black, sans-serif";
  x.fillText("ROADSTER", 64, 150);
  x.fillStyle = "#FFB35C";
  x.font = '700 22px "JetBrains Mono", monospace';
  x.fillText("THE FLYING CAR · UNOFFICIAL FAN GAME", 68, 190);
  const row = (lab, val, y, col) => {
    x.fillStyle = "rgba(255,255,255,.6)";
    x.font = '600 22px "JetBrains Mono", monospace';
    x.fillText(lab, 68, y);
    x.fillStyle = col || "#fff";
    x.font = "800 52px Saira, Arial, sans-serif";
    x.fillText(val, 68, y + 56);
  };
  row(
    "STORY",
    p.done ? "COMPLETE · ORBIT" : `CHAPTER ${p.ch + 1} OF ${p.chN}`,
    280,
  );
  row("TESTS CLEARED", `${p.c} / ${p.n}`, 400);
  x.font = "800 52px Saira, Arial, sans-serif";
  let mx = 68;
  [
    [p.g, "#ffc84a", "GOLD"],
    [p.s, "#d9dde3", "SILVER"],
    [p.b, "#cd8a52", "BRONZE"],
  ].forEach(([v, c, l]) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(mx + 22, 560, 22, 0, 7);
    x.fill();
    x.fillStyle = "#fff";
    x.fillText(String(v), mx + 56, 578);
    mx += 56 + x.measureText(String(v)).width + 46;
  });
  x.fillStyle = "rgba(255,255,255,.6)";
  x.font = '600 22px "JetBrains Mono", monospace';
  x.fillText("MEDALS", 68, 520);
  const u = siteURL();
  if (u) {
    x.fillStyle = "#38d6ff";
    x.font = '700 24px "JetBrains Mono", monospace';
    x.fillText(u.replace(/^https?:\/\//, "").replace(/\/$/, ""), 68, 640);
  }
  return await new Promise((r) =>
    cv.toBlob(
      (b) => r(new File([b], "roadster-progress.png", { type: "image/png" })),
      "image/png",
    ),
  );
}
async function shareProgress() {
  const p = progStats(),
    t = p.done
      ? `I finished the whole story of ROADSTER: The Flying Car and rode the rocket to orbit. ${p.g} gold medals. Your turn.`
      : `I'm on chapter ${p.ch + 1} of ${p.chN} in ROADSTER: The Flying Car · ${p.c}/${p.n} tests cleared · ${p.g} gold. Can you fly it better?`;
  // the card is made ahead of time: share sheets and pop-ups only open straight from a tap
  const f = SHARE.card || null;
  cardSoon();
  const r = await shareOut(t, siteURL(), f);
  if (r === "intent")
    flash(
      "SHARE ON X",
      f ? "post opened · your progress card was saved" : "post opened",
      2.6,
    );
}
function cardSoon() {
  clearTimeout(SHARE.ct);
  SHARE.ct = setTimeout(async () => {
    try {
      SHARE.card = await progCard();
    } catch (e) {}
  }, 400);
}

/* ---- the best moment: replay the run with the TV cameras, record it in 9:16, share the clip ---- */
const MOMENT = { on: false, tag: "", text: "" };
{
  const _cf = clipFrame;
  clipFrame = function () {
    _cf();
    if (!CLIP.on || !MOMENT.on || !MOMENT.tag) return;
    const x = CLIP.x,
      W = CLIP.cv.width,
      u = (CLIP.cv.height / 1280) * (CLIP.vert ? 1 : 1.6);
    x.font = `800 ${Math.round(22 * u)}px Saira, Arial, sans-serif`;
    const tw = x.measureText(MOMENT.tag).width;
    x.fillStyle = "rgba(6,8,11,.62)";
    x.fillRect(W - tw - 56 * u, 30 * u, tw + 32 * u, 44 * u);
    x.fillStyle = "#FFC24A";
    x.fillText(MOMENT.tag, W - tw - 40 * u, 61 * u);
  };
}
function momentStart() {
  if (phase !== "result" || !M) return;
  const d = M.def,
    med = M.medal ? ["", "BRONZE", "SILVER", "GOLD"][M.medal] : "",
    tm = M.lastTime;
  MOMENT.tag = `TEST ${d.n} · ${d.t.toUpperCase()}${tm != null ? ` · ${tm.toFixed(2)} s` : ""}${med ? " · " + med : ""}`;
  MOMENT.text = `${d.t}${tm != null ? ` in ${tm.toFixed(2)} s` : ""}${med ? ` · ${med}` : ""} in ROADSTER: The Flying Car.${M.shareTxt && /RC-/.test(M.shareTxt) ? " Beat me: " + M.shareTxt.match(/RC-\S+/)[0] : ""}`;
  $("result").hidden = true;
  phase = "play";
  if (!replayStart()) {
    phase = "result";
    $("result").hidden = false;
    flash("MOMENT", "drive a few seconds first", 1.4);
    return;
  }
  RPL.fromRes = true;
  MOMENT.on = true;
  clipStart(true);
  if (!CLIP.on) {
    MOMENT.on = false;
  }
}
{
  const _re = replayEnd;
  replayEnd = function () {
    _re();
    if (MOMENT.on) {
      MOMENT.on = false;
      MOMENT.ready = true;
    }
  };
}
async function shareClip() {
  if (!CLIP.blob) return;
  const name = `roadster-moment-${Date.now()}.${CLIP.ext}`,
    f = new File([CLIP.blob], name, { type: CLIP.blob.type || "video/mp4" });
  const t = MOMENT.text || "My best moment in ROADSTER: The Flying Car.",
    ch = (t.match(/RC-\S+/) || [])[0],
    u = siteURL();
  const r = await shareOut(t, u ? u + (ch ? "#c=" + ch : "") : "", f);
  if (r === "intent")
    setT("clipMsg", "Clip saved · attach it to the post that just opened on X");
}

/* ---- accounts: sign in with Google or X to keep progress in the cloud (needs cloud.json on your own site) ---- */
const CLOUD = {
  cfg: null,
  ready: false,
  user: null,
  A: null,
  F: null,
  auth: null,
  db: null,
  pushT: 0,
  busy: false,
  base: "https://www.gstatic.com/firebasejs/10.12.2/",
};
async function cloudInit() {
  try {
    let cfg = window.__cloudCfg || null;
    if (!cfg && /^https?:$/.test(location.protocol)) {
      const r = await fetch("cloud.json", { cache: "no-store" });
      if (r.ok) cfg = await r.json();
    }
    if (!cfg || !cfg.apiKey) return;
    SHARE.site = cfg.site || "";
    CLOUD.cfg = cfg;
    const b = window.__fbBase || CLOUD.base;
    const [app, A, F] = await Promise.all([
      import(b + "firebase-app.js"),
      import(b + "firebase-auth.js"),
      import(b + "firebase-firestore.js"),
    ]);
    CLOUD.A = A;
    CLOUD.F = F;
    const fa = app.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      appId: cfg.appId,
    });
    CLOUD.auth = A.getAuth(fa);
    CLOUD.db = F.getFirestore(fa);
    CLOUD.ready = true;
    try {
      await A.getRedirectResult(CLOUD.auth);
    } catch (e) {}
    A.onAuthStateChanged(CLOUD.auth, (u) => {
      CLOUD.user = u || null;
      acctPaint();
      if (u) cloudSync(true);
    });
    acctPaint();
  } catch (e) {
    CLOUD.err = String((e && e.message) || e);
    acctPaint();
  }
}
async function cloudSignIn(kind) {
  if (!CLOUD.ready) return;
  const A = CLOUD.A,
    p = kind === "x" ? new A.TwitterAuthProvider() : new A.GoogleAuthProvider();
  setT("acctMsg", "Opening sign-in…");
  try {
    await A.signInWithPopup(CLOUD.auth, p);
  } catch (e) {
    const c = (e && e.code) || "";
    if (/popup-blocked|operation-not-supported/.test(c)) {
      try {
        await A.signInWithRedirect(CLOUD.auth, p);
        return;
      } catch (_) {}
    }
    setT(
      "acctMsg",
      /closed-by-user|cancelled/.test(c)
        ? "Sign-in cancelled."
        : /unauthorized-domain/.test(c)
          ? "This site is not on the Firebase authorized domains list yet."
          : /operation-not-allowed/.test(c)
            ? `${kind === "x" ? "X" : "Google"} sign-in is not switched on in Firebase yet.`
            : "Sign-in failed. Try again.",
    );
  }
}
async function cloudSync(first) {
  if (!CLOUD.user || CLOUD.busy) return;
  CLOUD.busy = true;
  const F = CLOUD.F,
    u = CLOUD.user,
    ref = F.doc(CLOUD.db, "players", u.uid);
  try {
    const snap = await F.getDoc(ref),
      d = snap.exists() ? snap.data() : null,
      loc = progressScore();
    if (first && d && d.save && (d.score || 0) > loc) {
      let once = false;
      try {
        once = sessionStorage.getItem("rfc_cloud_pull") === String(d.score);
        sessionStorage.setItem("rfc_cloud_pull", String(d.score));
      } catch (e) {}
      if (!once && loadCode(d.save)) {
        flash("CLOUD SAVE", "your progress is back · reloading", 2.2);
        setTimeout(() => location.reload(), 1200);
        return;
      }
      CLOUD.busy = false;
      setT("acctMsg", "Signed in. Cloud save is ahead of this device.");
      acctPaint();
      return;
    }
    if (!d || loc >= (d.score || 0)) {
      await F.setDoc(
        ref,
        {
          save: saveCode(),
          score: loc,
          name: u.displayName || "",
          updated: F.serverTimestamp(),
        },
        { merge: true },
      );
    }
    CLOUD.last = Date.now();
    setT("acctMsg", "Progress saved to your account.");
    acctPaint();
  } catch (e) {
    setT(
      "acctMsg",
      "Could not reach the cloud save. Your progress is still on this device.",
    );
  } finally {
    CLOUD.busy = false;
  }
}
function cloudSoon() {
  if (!CLOUD.user) return;
  clearTimeout(CLOUD.pushT);
  CLOUD.pushT = setTimeout(() => cloudSync(false), 2500);
}
function acctPaint() {
  const b = $("acct");
  if (!b) return;
  b.hidden = !CLOUD.ready;
  if (!CLOUD.ready) return;
  const u = CLOUD.user;
  b.innerHTML = u
    ? `<i>${(u.displayName || "?").trim().charAt(0).toUpperCase()}</i>${CLOUD.last ? "SAVED" : "SIGNED IN"}`
    : "SIGN IN";
  b.classList.toggle("in", !!u);
  setT(
    "acctWho",
    u
      ? `Signed in as ${u.displayName || "player"}${u.providerData && u.providerData[0] ? ` · ${/twitter/.test(u.providerData[0].providerId) ? "X" : "Google"}` : ""}`
      : "Sign in to keep your progress on every device.",
  );
  ["acctG", "acctX"].forEach((id) => {
    const e = $(id);
    if (e) e.hidden = !!u;
  });
  const o = $("acctOut");
  if (o) o.hidden = !u;
}
{
  const _f = finish;
  finish = function (ok, reason, stats) {
    const r = _f(ok, reason, stats);
    cloudSoon();
    return r;
  };
}
