// index-inline-1 40 — connect
// Lines 91082-91409 of readable/index-inline-1.pretty.js (statement-aligned).
function watchOffer(kind) {
  watchK = kind;
  watchT = kind === "launch" ? 6 : 5;
  setT("watchTxt", kind === "launch" ? "WATCH LIFTOFF" : "WATCH TOUCHDOWN");
  byId("watchChip").classList.add("on");
}
function watchGo() {
  if (!watchK || phase !== "play" || cinematic.on) return;
  const k = watchK;
  watchK = null;
  byId("watchChip").classList.remove("on");
  startShow(k);
}
byId("watchChip").addEventListener("click", watchGo);

/* ---- pause menu: camera, wing, units, cinematics, music and battery live here now ---- */
const PAUSE = { on: false };
const BATTERY_SAVER = { on: store.get("rfc_bat") === "1", t: 0 };
function pauseLabels() {
  setT("pCam", "CAMERA · " + ["CHASE", "FAR", "BONNET"][camMode]);
  setT("pWing", "WING · " + WMODES[wingSel]);
  setT("pUnits", "UNITS · " + (metric ? "KM/H" : "MPH"));
  setT("pCine", "CINEMATICS · " + (showOn ? "ON" : "OFF"));
  setT("pMusic", "MUSIC · " + (MUSIC.on ? "ON" : "OFF"));
  setT("pBat", "BATTERY 30 FPS · " + (BATTERY_SAVER.on ? "ON" : "OFF"));
  byId("pRestart").hidden = !currentMission;
}
function pauseOpen() {
  if (phase !== "play" || PAUSE.on) return;
  PAUSE.on = true;
  for (const k in keyState) keyState[k] = false;
  for (const k in T) if (typeof T[k] === "boolean") T[k] = false;
  pauseLabels();
  byId("pause").hidden = false;
}
function pauseClose() {
  PAUSE.on = false;
  byId("pause").hidden = true;
  last = performance.now();
}
byId("pResume").addEventListener("click", pauseClose);
byId("pRestart").addEventListener("click", () => {
  pauseClose();
  respawn(true);
});
byId("pQuit").addEventListener("click", () => {
  pauseClose();
  toMenu();
});
byId("pCam").addEventListener("click", () => {
  camMode = (camMode + 1) % 3;
  pauseLabels();
});
byId("pWing").addEventListener("click", () => {
  cycleWing();
  pauseLabels();
});
byId("pUnits").addEventListener("click", () => {
  metric = !metric;
  pauseLabels();
});
byId("pCine").addEventListener("click", () => {
  showOn = !showOn;
  pauseLabels();
});
byId("pMusic").addEventListener("click", () => {
  MUSIC.set(!MUSIC.on);
  pauseLabels();
});
byId("pBat").addEventListener("click", () => {
  BATTERY_SAVER.on = !BATTERY_SAVER.on;
  store.set("rfc_bat", BATTERY_SAVER.on ? "1" : "0");
  pauseLabels();
});

/* ---- music: one synthwave track in three layers, built in Web Audio ---- */
const MUSIC = {
  on: store.get("rfc_music") !== "0",
  ok: false,
  step: 0,
  next: 0,
  bpm: 104,
  lay: { cruise: 0, speed: 0, flight: 0 },
  drop: 0,
  set(v) {
    this.on = v;
    store.set("rfc_music", v ? "1" : "0");
    if (this.ok)
      this.master.gain.setTargetAtTime(v ? 0.32 : 0, audio.c.currentTime, 0.2);
  },
  init() {
    if (this.ok || !audio.ok) return;
    const c = audio.c;
    this.ok = true;
    this.master = c.createGain();
    this.master.gain.value = this.on ? 0.32 : 0;
    this.duck = c.createGain();
    this.lp = c.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 18000;
    this.lp.Q.value = 0.7;
    this.duck.connect(this.lp);
    this.lp.connect(this.master);
    this.master.connect(audio.m);
    for (const k of ["cruise", "speed", "flight"]) {
      const g = c.createGain();
      g.gain.value = 0;
      g.connect(this.duck);
      this["g_" + k] = g;
    }
    this.dl = c.createDelay(1);
    this.dl.delayTime.value = (60 / this.bpm) * 0.75;
    this.fb = c.createGain();
    this.fb.gain.value = 0.33;
    this.dl.connect(this.fb);
    this.fb.connect(this.dl);
    this.dl.connect(this.g_flight);
    this.next = c.currentTime + 0.1;
    setInterval(() => this.sched(), 40);
  },
  chords: [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
  ],
  hz: (m) => 440 * Math.pow(2, (m - 69) / 12),
  tone(dest, type, f, t, d, g, a = 0.005, cut = 0) {
    const c = audio.c,
      o = c.createOscillator(),
      e = c.createGain();
    o.type = type;
    o.frequency.value = f;
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(g, t + a);
    e.gain.exponentialRampToValueAtTime(0.0005, t + d);
    if (cut) {
      const f2 = c.createBiquadFilter();
      f2.type = "lowpass";
      f2.frequency.value = cut;
      o.connect(f2);
      f2.connect(e);
    } else o.connect(e);
    e.connect(dest);
    o.start(t);
    o.stop(t + d + 0.05);
    return o;
  },
  noise(dest, t, d, g, type, f) {
    const c = audio.c,
      s = c.createBufferSource();
    s.buffer = audio.nb;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    const e = c.createGain();
    e.gain.setValueAtTime(g, t);
    e.gain.exponentialRampToValueAtTime(0.0005, t + d);
    s.connect(fl);
    fl.connect(e);
    e.connect(dest);
    s.start(t, Math.random() * 1.5);
    s.stop(t + d + 0.02);
  },
  kick(t, g = 0.9) {
    const c = audio.c,
      o = c.createOscillator(),
      e = c.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    e.gain.setValueAtTime(g, t);
    e.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(e);
    e.connect(this.g_speed);
    o.start(t);
    o.stop(t + 0.4);
  },
  sched() {
    if (!this.ok) return;
    const c = audio.c,
      sp = 60 / this.bpm / 4;
    while (this.next < c.currentTime + 0.25) {
      const t = this.next,
        s = this.step % 16,
        bar = Math.floor(this.step / 16) % 4,
        ch = this.chords[bar];
      if (this.lay.cruise > 0.01) {
        if (s % 2 === 0) {
          const n = ch[0] - 24 + (s % 8 === 4 ? 12 : 0);
          this.tone(
            this.g_cruise,
            "sawtooth",
            this.hz(n),
            t,
            sp * 1.7,
            0.22,
            0.004,
            520 + 300 * this.lay.speed,
          );
        }
        if (s === 0)
          for (const n of ch)
            for (const dt of [-0.07, 0.07]) {
              const o = this.tone(
                this.g_cruise,
                "sawtooth",
                this.hz(n) * Math.pow(2, dt / 12),
                t,
                sp * 16,
                0.035,
                0.5,
                1400,
              );
            }
      }
      if (this.lay.speed > 0.01) {
        if (s % 4 === 0) this.kick(t);
        if (s === 4 || s === 12) {
          this.noise(this.g_speed, t, 0.18, 0.35, "bandpass", 1900);
          this.tone(this.g_speed, "triangle", 190, t, 0.1, 0.12);
        }
        if (s % 2 === 0)
          this.noise(this.g_speed, t, 0.05, 0.12, "highpass", 7500);
      }
      if (this.lay.flight > 0.01) {
        const arp = [0, 1, 2, 1, 0, 2, 1, 2],
          n = ch[arp[s % 8]] + 12 + (s >= 8 ? 12 : 0);
        this.tone(
          this.g_flight,
          "square",
          this.hz(n),
          t,
          sp * 0.9,
          0.05,
          0.004,
          2600,
        );
        this.tone(
          this.dl,
          "square",
          this.hz(n),
          t,
          sp * 0.9,
          0.025,
          0.004,
          2600,
        );
      }
      this.step++;
      this.next += sp;
    }
  },
  tick(dt) {
    if (!this.ok) {
      if (audio.ok) this.init();
      return;
    }
    const c = audio.c,
      t = c.currentTime,
      hs = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v),
      play = phase === "play" || phase === "replay";
    const L = LAUNCH;
    if (L.st === "up" && L.t < 0.3 && !this.dropped) {
      this.dropped = true;
      this.drop = 8;
      this.noise(this.g_speed, t, 1.8, 0.5, "highpass", 3000);
      this.kick(t, 1.2);
    }
    if (L.st !== "up") this.dropped = false;
    this.drop = Math.max(0, this.drop - dt);
    const tc = play || phase === "title" || phase === "result" ? 1 : 0.6,
      tsp = play
        ? Math.max(
            clamp((hs - 30) / 10),
            COMBO.n >= 2 ? 1 : 0,
            this.drop > 0 ? 1 : 0,
          )
        : 0,
      tfl = play && carState.air && (carState.armed || carState.airT > 0.6) ? 1 : 0;
    this.lay.cruise = tc;
    this.lay.speed = tsp;
    this.lay.flight = tfl;
    this.g_cruise.gain.setTargetAtTime(tc * 0.9, t, 0.4);
    this.g_speed.gain.setTargetAtTime(tsp * 0.85, t, 0.5);
    this.g_flight.gain.setTargetAtTime(tfl * 0.7, t, 0.6);
    this.lp.frequency.setTargetAtTime(
      L.st === "count" ? 280 : 18000,
      t,
      L.st === "count" ? 0.8 : 0.05,
    );
    this.duck.gain.setTargetAtTime(RADIO.t > 0 || cinematic.on ? 0.45 : 1, t, 0.15);
  },
};
addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === "m" && (phase === "play" || phase === "title")) {
    MUSIC.set(!MUSIC.on);
    flash(MUSIC.on ? "MUSIC ON" : "MUSIC OFF", "", 1);
  }
  if (k === "g" && watchK) watchGo();
});

/* ---- clips: record the replay straight to a video, 16:9 or 9:16 ---- */
const CLIP = {
  on: false,
  cv: document.createElement("canvas"),
  rec: null,
  chunks: [],
  blob: null,
  ext: "webm",
};
CLIP.x = CLIP.cv.getContext("2d");
function clipMime() {
  const L = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const m of L) {
    try {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    } catch (e) {}
  }
  return null;
}
