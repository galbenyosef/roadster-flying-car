// index-inline-1 62 — perf
// Lines 97932-98161 of readable/index-inline-1.pretty.js (statement-aligned).
progCard = async function () {
  const p = progStats(),
    W = 1200,
    H = 675,
    cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d");
  try {
    if (!HERO.naturalWidth) await HERO.decode();
  } catch (e) {}
  if (HERO.naturalWidth) x.drawImage(HERO, 0, 0, W, H);
  else {
    x.fillStyle = "#07080c";
    x.fillRect(0, 0, W, H);
  }
  const gr = x.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, "rgba(6,8,11,.9)");
  gr.addColorStop(0.36, "rgba(6,8,11,.66)");
  gr.addColorStop(0.56, "rgba(6,8,11,.12)");
  gr.addColorStop(1, "rgba(6,8,11,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, W, H);
  const vg = x.createLinearGradient(0, H * 0.72, 0, H);
  vg.addColorStop(0, "rgba(6,8,11,0)");
  vg.addColorStop(1, "rgba(6,8,11,.55)");
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);
  x.shadowColor = "rgba(0,0,0,.45)";
  x.shadowBlur = 14;
  x.fillStyle = "#fff";
  x.font = "900 92px Saira, Arial Black, sans-serif";
  x.fillText("ROADSTER", 64, 150);
  x.fillStyle = "#FFB35C";
  x.font = '700 22px "JetBrains Mono", monospace';
  x.fillText("THE FLYING CAR · UNOFFICIAL FAN GAME", 68, 190);
  const row = (lab, val, y, col) => {
    x.fillStyle = "rgba(255,255,255,.7)";
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
  ].forEach(([v, c]) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(mx + 22, 560, 22, 0, 7);
    x.fill();
    x.fillStyle = "#fff";
    x.fillText(String(v), mx + 56, 578);
    mx += 56 + x.measureText(String(v)).width + 46;
  });
  x.fillStyle = "rgba(255,255,255,.7)";
  x.font = '600 22px "JetBrains Mono", monospace';
  x.fillText("MEDALS", 68, 520);
  const u = siteURL();
  if (u) {
    x.fillStyle = "#38d6ff";
    x.font = '700 24px "JetBrains Mono", monospace';
    x.fillText(u.replace(/^https?:\/\//, "").replace(/\/$/, ""), 68, 640);
  }
  x.shadowBlur = 0;
  return await new Promise((r) =>
    cv.toBlob(
      (b) => r(new File([b], "roadster-progress.png", { type: "image/png" })),
      "image/png",
    ),
  );
};
function isPhone() {
  try {
    return (
      matchMedia("(pointer:coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  } catch (e) {
    return false;
  }
}
// a picture on the clipboard: pasting into the X post attaches it
function clipImage(file) {
  try {
    if (
      !file ||
      !navigator.clipboard ||
      !navigator.clipboard.write ||
      typeof ClipboardItem !== "function"
    )
      return null;
    return navigator.clipboard
      .write([new ClipboardItem({ [file.type]: file })])
      .then(
        () => true,
        () => false,
      );
  } catch (e) {
    return null;
  }
}
xIntent = function (text, url) {
  const u =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text) +
    (url ? "&url=" + encodeURIComponent(url) : "");
  let w = null;
  try {
    w = window.open(u, "_blank");
    if (w)
      try {
        w.opener = null;
      } catch (_) {}
  } catch (e) {}
  if (!w) {
    const done = () => flash("COPIED", "post text copied · paste it on X", 2.4),
      fail = () => flash("SHARE ON X", text, 4);
    try {
      navigator.clipboard
        .writeText(text + (url ? " " + url : ""))
        .then(done, fail);
    } catch (e) {
      fail();
    }
  }
  return !!w;
};
shareOut = async function (text, url, file) {
  const img = !!(file && /^image\//.test(file.type));
  // phones: the share sheet carries the picture straight into the X app
  if (file && isPhone()) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: text + (url ? " " + url : ""),
        });
        return "shared";
      }
    } catch (e) {
      if (e && e.name === "AbortError") return "cancel";
    }
  }
  // computers: the picture goes on the clipboard first (it has to happen inside the tap), then X opens with the post written
  const cp = img ? clipImage(file) : null;
  const opened = xIntent(text, url);
  if (cp) {
    const ok = await cp;
    if (ok && opened) return "paste";
  }
  if (file) saveBlob(file, file.name);
  return "intent";
};
shareProgress = async function () {
  const p = progStats(),
    t = p.done
      ? `I finished the whole story of ROADSTER: The Flying Car and rode the rocket to orbit. ${p.g} gold medals. Your turn.`
      : `I'm on chapter ${p.ch + 1} of ${p.chN} in ROADSTER: The Flying Car · ${p.c}/${p.n} tests cleared · ${p.g} gold. Can you fly it better?`;
  const f = SHARE.card || null;
  cardSoon();
  const r = await shareOut(t, siteURL(), f);
  if (r === "paste")
    flash(
      "SHARE ON X",
      `post opened · press ${/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl"}+V in it to add your Roadster card`,
      4.5,
    );
  else if (r === "intent")
    flash(
      "SHARE ON X",
      f
        ? "post opened · your Roadster card was saved, add it to the post"
        : "post opened",
      3.2,
    );
};

/* ---------------- loop ---------------- */
let last = performance.now(),
  pvx = 0,
  pvz = 0,
  mapTick = 0;
// adaptive resolution: drop the pixel ratio when frames run long, raise it again when there is headroom
const PERF = {
  acc: 0,
  n: 0,
  t: 0,
  dpr: renderer.getPixelRatio(),
  max: renderer.getPixelRatio(),
  min: isTouch ? 0.75 : 1,
  hold: 0,
  good: 0,
};
function perfTick(ms) {
  if (ms > 1500) return;
  PERF.acc += Math.min(ms, 100);
  PERF.n++;
  PERF.t += ms;
  if (PERF.t < 1500 || PERF.n < 4) return;
  const avg = PERF.acc / PERF.n;
  PERF.acc = PERF.n = PERF.t = 0;
  const now = performance.now();
  let d = PERF.dpr;
  if (avg > 23 && d > PERF.min) {
    d = Math.max(PERF.min, d - 0.25);
    PERF.hold = now + 12000;
    PERF.good = 0;
  } else if (avg < 17.8 && d < PERF.max && now > PERF.hold) {
    if (++PERF.good >= 3) {
      d = Math.min(PERF.max, d + 0.25);
      PERF.good = 0;
    }
  } else PERF.good = 0;
  if (d !== PERF.dpr) {
    PERF.dpr = d;
    renderer.setPixelRatio(d);
    composer.setPixelRatio(d);
  }
}
