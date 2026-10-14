// index-inline-1 16 — connect
// Lines 83136-83478 of readable/index-inline-1.pretty.js (statement-aligned).
const audio = {
  ok: false,
  init() {
    if (this.ok) return;
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      this.c = new A();
    } catch (e) {
      return;
    }
    const c = this.c;
    this.ok = true;
    this.m = c.createGain();
    this.m.gain.value = 0.55;
    const comp = c.createDynamicsCompressor();
    this.m.connect(comp);
    comp.connect(c.destination);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate),
      d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.nb = nb;
    const mk = (type, f) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.start();
      return o;
    };
    this.o1 = mk("sawtooth", 80);
    this.o2 = mk("sine", 400);
    this.o3 = mk("triangle", 160);
    this.lp = c.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 900;
    this.lp.Q.value = 4;
    this.g1 = c.createGain();
    this.g1.gain.value = 0;
    this.o1.connect(this.lp);
    this.o3.connect(this.lp);
    this.lp.connect(this.g1);
    this.g1.connect(this.m);
    this.g2 = c.createGain();
    this.g2.gain.value = 0;
    this.o2.connect(this.g2);
    this.g2.connect(this.m);
    const loop = (type, f, q) => {
      const s = c.createBufferSource();
      s.buffer = nb;
      s.loop = true;
      const fl = c.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = f;
      fl.Q.value = q;
      const g = c.createGain();
      g.gain.value = 0;
      s.connect(fl);
      fl.connect(g);
      g.connect(this.m);
      s.start();
      return { fl, g };
    };
    this.wind = loop("bandpass", 700, 0.6);
    this.road = loop("lowpass", 300, 0.7);
    this.hiss = loop("highpass", 1600, 0.4);
    this.roar = loop("lowpass", 420, 0.8);
    this.sub = mk("sine", 42);
    this.sg = c.createGain();
    this.sg.gain.value = 0;
    this.sub.connect(this.sg);
    this.sg.connect(this.m);
    this.scr = loop("bandpass", 2600, 1.5);
  },
  update(v, thr, thrust, onRoad, air, scr, spool) {
    if (!this.ok) return;
    const t = this.c.currentTime,
      r = 0.06;
    this.o1.frequency.setTargetAtTime(40 + v * 5.2, t, r);
    this.o3.frequency.setTargetAtTime(80 + v * 10.4, t, r);
    this.o2.frequency.setTargetAtTime(300 + v * 22, t, r);
    this.lp.frequency.setTargetAtTime(500 + v * 40 + (thr ? 800 : 0), t, r);
    this.g1.gain.setTargetAtTime(
      0.05 + (thr ? 0.12 : 0.03) * clamp(v / 40 + 0.3),
      t,
      r,
    );
    this.g2.gain.setTargetAtTime(clamp(v / 90) * (thr ? 0.05 : 0.02), t, r);
    this.wind.g.gain.setTargetAtTime(
      Math.min(0.35, (v * v) / 22000) + (air ? 0.05 : 0),
      t,
      r,
    );
    this.wind.fl.frequency.setTargetAtTime(400 + v * 14, t, r);
    this.road.g.gain.setTargetAtTime(
      air ? 0 : Math.min(0.25, v / 180) * (onRoad ? 1 : 2.2),
      t,
      r,
    );
    this.hiss.g.gain.setTargetAtTime(
      thrust === 1 ? 0.34 : thrust === 2 ? 0.22 : spool ? 0.06 : 0,
      t,
      0.05,
    );
    this.roar.g.gain.setTargetAtTime(
      thrust === 2 ? 0.6 : thrust === 1 ? 0.12 : 0,
      t,
      0.05,
    );
    this.sg.gain.setTargetAtTime(thrust === 2 ? 0.25 : 0, t, 0.05);
    this.scr.g.gain.setTargetAtTime(scr ? 0.18 : 0, t, 0.03);
  },
  shot(f0, f1, d, g, type = "sine") {
    if (!this.ok) return;
    const c = this.c,
      t = c.currentTime,
      o = c.createOscillator(),
      gg = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + d);
    gg.gain.setValueAtTime(g, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(gg);
    gg.connect(this.m);
    o.start(t);
    o.stop(t + d + 0.05);
  },
  noise(f0, f1, d, g, type = "lowpass") {
    if (!this.ok) return;
    const c = this.c,
      t = c.currentTime,
      s = c.createBufferSource();
    s.buffer = this.nb;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + d);
    const gg = c.createGain();
    gg.gain.setValueAtTime(g, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f);
    f.connect(gg);
    gg.connect(this.m);
    s.start(t);
    s.stop(t + d + 0.05);
  },
  click(on) {
    this.noise(3000, 1500, 0.05, 0.35, "highpass");
    this.shot(on ? 600 : 400, on ? 900 : 250, 0.08, 0.08, "triangle");
    if (on) {
      this.noise(300, 4000, 1.2, 0.18, "bandpass");
      this.shot(120, 420, 1.2, 0.05, "sawtooth");
    }
  },
  servo() {
    this.shot(200, 420, 0.45, 0.05, "sawtooth");
  },
  boom() {
    this.shot(90, 30, 0.7, 0.6);
    this.noise(3000, 200, 0.6, 0.45);
  },
  crash() {
    this.shot(110, 25, 1.1, 0.8);
    this.noise(5000, 150, 1.2, 0.7);
    this.noise(3000, 800, 0.4, 0.4, "highpass");
  },
  chime() {
    [880, 1318.5, 1760].forEach((f, i) =>
      setTimeout(() => this.shot(f, f, 0.6, 0.12), i * 90),
    );
  },
  ping() {
    this.shot(1500, 1480, 0.35, 0.12);
  },
  fail() {
    this.shot(330, 160, 0.6, 0.15, "square");
  },
  hit() {
    this.shot(72, 30, 1, 0.75);
    this.noise(2200, 120, 0.55, 0.35);
  },
  whoosh() {
    this.noise(300, 3500, 0.45, 0.22, "bandpass");
  },
  unlock() {
    this.noise(6000, 2500, 0.04, 0.45, "highpass");
    this.shot(190, 80, 0.18, 0.35, "square");
  },
  hinge() {
    this.shot(120, 360, 1.2, 0.07, "sawtooth");
    this.noise(700, 3200, 1.3, 0.14, "bandpass");
  },
  ignite() {
    this.shot(64, 28, 1.3, 0.6);
    this.noise(180, 6500, 0.9, 0.32, "bandpass");
    this.noise(3500, 250, 1.6, 0.26);
  },
  riser(d) {
    if (!this.ok) return;
    const c = this.c,
      t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.nb;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 2.5;
    f.frequency.setValueAtTime(160, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + d);
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + d * 0.96);
    g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25);
    s.connect(f);
    f.connect(g);
    g.connect(this.m);
    s.start(t);
    s.stop(t + d + 0.4);
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(48, t);
    o.frequency.exponentialRampToValueAtTime(196, t + d);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.001, t);
    g2.gain.exponentialRampToValueAtTime(0.07, t + d);
    g2.gain.exponentialRampToValueAtTime(0.001, t + d + 0.2);
    o.connect(lp);
    lp.connect(g2);
    g2.connect(this.m);
    o.start(t);
    o.stop(t + d + 0.3);
  },
  seq(list) {
    list.forEach(([ms, fn]) => setTimeout(() => this[fn](), ms));
  },
  launch(d) {
    if (!this.ok) return;
    const g = clamp(1 - d / 1600) * 0.8 + 0.05;
    const c = this.c,
      t = c.currentTime,
      s = c.createBufferSource();
    s.buffer = this.nb;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(90, t);
    f.frequency.linearRampToValueAtTime(420, t + 3);
    f.frequency.linearRampToValueAtTime(120, t + 14);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.001, t);
    gg.gain.exponentialRampToValueAtTime(g, t + 1.2);
    gg.gain.exponentialRampToValueAtTime(0.001, t + 16);
    s.connect(f);
    f.connect(gg);
    gg.connect(this.m);
    s.start(t);
    s.stop(t + 16.5);
    this.shot(50, 28, 4, g * 0.8);
  },
};

/* ---------------- phone extras: haptics + full screen ---------------- */
const buzz = (ms) => {
  try {
    if (isTouch && navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
};
for (const [k, ms] of [
  ["crash", 90],
  ["boom", 25],
  ["hit", 35],
  ["ping", 12],
  ["ignite", 30],
]) {
  const f = audio[k];
  audio[k] = function () {
    buzz(ms);
    return f.apply(this, arguments);
  };
}
{
  const b = byId("fsBtn");
  const fsOn = () =>
    !!(document.fullscreenElement || document.webkitFullscreenElement);
  const sync = () => {
    b.classList.toggle("on", fsOn());
  };
  const go = (e) => {
    e.stopPropagation();
    const d = document.documentElement,
      rq = d.requestFullscreen || d.webkitRequestFullscreen,
      ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (fsOn()) {
      ex && ex.call(document);
      return;
    }
    if (
      !rq ||
      !(document.fullscreenEnabled || document.webkitFullscreenEnabled)
    ) {
      flash(
        "FULL SCREEN",
        "not allowed inside this app · open the link in Chrome for the full view",
        3.2,
      );
      return;
    }
    try {
      const pr = rq.call(d, { navigationUI: "hide" });
      if (pr && pr.then)
        pr.then(() => {
          try {
            screen.orientation &&
              screen.orientation.lock &&
              screen.orientation.lock("landscape").catch(() => {});
          } catch (_) {}
        }).catch(() =>
          flash(
            "FULL SCREEN",
            "not allowed inside this app · open the link in Chrome",
            3.2,
          ),
        );
    } catch (_) {}
  };
  b.addEventListener("click", go);
  byId("fsBtn2").addEventListener("click", go);
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
}
/* ---------------- state ---------------- */
const angleDelta = (a, b) =>
  ((((a - b + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
  Math.PI;
const HOVER_DRAIN = 1.9,
  MASS = 2000,
  POWER = 9e5,
  CDA = 0.82,
  RHO = 1.225,
  MPH = 2.23694,
  LIMIT = 3.5;
