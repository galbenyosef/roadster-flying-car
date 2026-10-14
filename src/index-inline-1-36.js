// index-inline-1 36 — replay
// Lines 89804-90083 of readable/index-inline-1.pretty.js (statement-aligned).
const BARKS = {
  VEX: {
    start: [
      "Lights out, rookie. Try to keep my tail lights in view.",
      "Welcome to my Strip. Nobody passes me here.",
      "I will wave at you from the finish line.",
    ],
    passedBy: [
      "Lucky line. It will not happen twice.",
      "Enjoy the view up front. It is temporary.",
      "Okay. Now it is personal.",
    ],
    passes: [
      "Excuse me. King coming through.",
      "Back in my mirrors, where you belong.",
      "Too slow in that corner, Zero.",
    ],
    lastlap: [
      "Last lap. This is where legends get made. Mine.",
      "One lap left. Do not blink.",
    ],
    win: [
      "…Fine. Tonight the Strip is yours.",
      "Nobody has beaten me here in three years. Respect.",
    ],
    lose: [
      "Back of the line, rookie.",
      "Come back when you drive the car, not the other way round.",
    ],
    chase: [
      "Got the pod. Come and get it.",
      "Seventy metres, Zero. Not one more.",
    ],
    far: [
      "Losing me already?",
      "Where did you go? I can barely see your lights.",
    ],
    close: [
      "Close enough to read my plate. Back off.",
      "You are good at following. Ever tried leading?",
    ],
  },
  RAZOR: {
    start: ["Stay out of my lane.", "I hit corners, not brakes."],
    passes: ["Moved you.", "Out of the way!"],
    passedBy: ["Cheap move.", "I will trade paint for that."],
    crash: [
      "Ha! Pick your car up off the road.",
      "That one is going to leave a mark.",
    ],
    lastlap: ["Final lap. Elbows out."],
  },
  GHOST: {
    start: ["…", "I will be where you are not looking."],
    passes: ["Boo.", "You did not see me."],
    passedBy: ["Noted.", "Interesting line."],
    lastlap: ["The Strip remembers."],
  },
};
const RADIO = { t: 0, cd: 0, used: {} };
function radio(who, cat, force) {
  const B = BARKS[who];
  if (!B || !B[cat] || phase === "replay" || phase === "photo") return;
  if (!force && clock < RADIO.cd) return;
  const L = B[cat],
    k = who + cat;
  if (RADIO.used[k] == null) RADIO.used[k] = (Math.random() * L.length) | 0;
  const line = L[RADIO.used[k]++ % L.length];
  RADIO.cd = clock + 4.2;
  const R = RIVALS.find((r) => r.n === who);
  byId("radio").style.setProperty("--rc", R ? R.col : "#fff");
  setT("rdWho", who);
  setT("rdTxt", line);
  byId("radio").classList.add("on");
  RADIO.t = 3.6;
  audio.noise(2600, 900, 0.14, 0.13, "bandpass");
  setTimeout(() => audio.noise(2200, 1300, 0.08, 0.07, "bandpass"), 130);
}
function radioTick(dt) {
  if (RADIO.t > 0) {
    RADIO.t -= dt;
    if (RADIO.t <= 0) byId("radio").classList.remove("on");
  }
}
function radioRace(pos) {
  if (!currentMission || currentMission.rs !== "run") return;
  if (currentMission.lastPos == null) {
    currentMission.lastPos = pos;
    return;
  }
  if (pos === currentMission.lastPos) return;
  const el = clock - currentMission.t0;
  const was = currentMission.lastPos;
  currentMission.lastPos = pos;
  if (el < 3) return;
  if (pos < was) {
    let best = null,
      bd = 1e9;
    for (const r of RIVALS) {
      const d = currentMission.pprog - r.prog;
      if (d >= 0 && d < bd) {
        bd = d;
        best = r;
      }
    }
    if (best) radio(best.n, "passedBy");
  } else {
    let best = null,
      bd = 1e9;
    for (const r of RIVALS) {
      const d = r.prog - currentMission.pprog;
      if (d >= 0 && d < bd) {
        bd = d;
        best = r;
      }
    }
    if (best) radio(best.n, "passes");
  }
}

/* ---- instant replay: the last 10 s, re-shot with TV cameras and slow motion ---- */
const REPLAY = {
  N: 300,
  hz: 30,
  F: 17,
  i: 0,
  n: 0,
  acc: 0,
  on: false,
  p: 0,
  speed: 0.8,
  shotT: 0,
  shot: null,
};
REPLAY.buf = new Float32Array(REPLAY.N * REPLAY.F);
REPLAY.tb = new Float32Array(REPLAY.N * TRAFFIC.length * 3);
REPLAY.rb = new Float32Array(REPLAY.N * 12);
function recTick(dt) {
  if (phase !== "play" || (cinematic.on && cinematic.freeze) || carState.crash > 0) return;
  REPLAY.acc += dt;
  if (REPLAY.acc < 1 / REPLAY.hz) return;
  REPLAY.acc = Math.min(REPLAY.acc - 1 / REPLAY.hz, 1 / REPLAY.hz);
  const F = REPLAY.F,
    o = REPLAY.i * F,
    b = REPLAY.buf;
  b[o] = carState.x;
  b[o + 1] = carState.y;
  b[o + 2] = carState.z;
  b[o + 3] = carState.yaw;
  b[o + 4] = carState.pitch;
  b[o + 5] = carState.roll;
  b[o + 6] = carState.loop ? carState.loop.th : 0;
  b[o + 7] = carState.bayK;
  b[o + 8] = carState.thrust || 0;
  b[o + 9] = carState.susp || 0;
  b[o + 10] = carState.steer;
  b[o + 11] = carState.v;
  b[o + 12] = carState.armed ? 1 : 0;
  b[o + 13] = carState.air ? 1 : 0;
  b[o + 14] = rplLand;
  rplLand = 0;
  b[o + 15] = carState.air ? Math.hypot(carState.vx, carState.vz) : Math.abs(carState.v);
  b[o + 16] = carState.dr || 0;
  const to = REPLAY.i * TRAFFIC.length * 3;
  TRAFFIC.forEach((c, k) => {
    REPLAY.tb[to + k * 3] = c.x;
    REPLAY.tb[to + k * 3 + 1] = c.z;
    REPLAY.tb[to + k * 3 + 2] = c.yaw;
  });
  const ro = REPLAY.i * 12;
  RIVALS.forEach((r, k) => {
    REPLAY.rb[ro + k * 4] = r.g.position.x;
    REPLAY.rb[ro + k * 4 + 1] = r.g.position.z;
    REPLAY.rb[ro + k * 4 + 2] = r.g.rotation.y;
    REPLAY.rb[ro + k * 4 + 3] = r.g.visible ? 1 : 0;
  });
  REPLAY.i = (REPLAY.i + 1) % REPLAY.N;
  REPLAY.n = Math.min(REPLAY.N, REPLAY.n + 1);
}
function trafPose(get) {
  const Mx = new THREE.Matrix4(),
    W = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    Y = new THREE.Vector3(0, 1, 0),
    V = new THREE.Vector3(),
    One = new THREE.Vector3(1, 1, 1),
    S3 = new THREE.Vector3(),
    types = new Set();
  TRAFFIC.forEach((c, k) => {
    const p = get(c, k);
    Q.setFromAxisAngle(Y, p[2]);
    Mx.compose(V.set(p[0], 0, p[1]), Q, One);
    c.T.meshes.forEach((m) => m.setMatrixAt(c.idx, Mx));
    c.T.wheels.forEach((w, j) => {
      W.compose(S3.set(w[0], w[1], w[2]), scratchQuat, scratchVec3.set(0.3, c.T.wr, c.T.wr));
      W.premultiply(Mx);
      TRAFFIC.wheels.setMatrixAt(c.wb + j, W);
    });
    types.add(c.T);
  });
  types.forEach((T) =>
    T.meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true)),
  );
  TRAFFIC.wheels.instanceMatrix.needsUpdate = true;
}
let rplHintT = 0;
function rplHint() {
  if (phase !== "play" || REPLAY.n < 60) return;
  rplHintT = 4.5;
  byId("rplHint").classList.add("on");
}
function replayStart() {
  if (phase !== "play" || cinematic.on || REPLAY.on || REPLAY.n < 45 || carState.crash > 0)
    return false;
  if (
    currentMission &&
    !currentMission.done &&
    (currentMission.def.id === "deck" ||
      currentMission.def.id === "catch" ||
      (currentMission.def.race && currentMission.rs === "grid"))
  )
    return false;
  REPLAY.on = true;
  REPLAY.snap = Object.assign({}, carState);
  REPLAY.rsnap = RIVALS.map((r) => [
    r.g.position.x,
    r.g.position.z,
    r.g.rotation.y,
    r.g.visible,
    r.spin,
  ]);
  REPLAY.cnt = REPLAY.n;
  REPLAY.start = (REPLAY.i - REPLAY.n + REPLAY.N) % REPLAY.N;
  REPLAY.p = 0;
  REPLAY.speed = 0.85;
  REPLAY.shot = null;
  REPLAY.shotT = 0;
  REPLAY.lastI = -1;
  REPLAY.cam = camPos.clone();
  REPLAY.fov = camera.fov;
  rplHintT = 0;
  byId("rplHint").classList.remove("on");
  phase = "replay";
  document.body.classList.add("replay");
  byId("rplUI").hidden = false;
  byId("radio").classList.remove("on");
  audio.whoosh();
  return true;
}
function replayEnd() {
  if (!REPLAY.on) return;
  clipStop();
  REPLAY.on = false;
  Object.assign(carState, REPLAY.snap);
  trafPose((c) => [c.x, c.z, c.yaw]);
  RIVALS.forEach((r, k) => {
    const q = REPLAY.rsnap[k];
    r.g.position.x = q[0];
    r.g.position.z = q[1];
    r.g.rotation.y = q[2];
    r.g.visible = q[3];
    r.spin = q[4];
  });
  rivalWheels();
  camPos.copy(REPLAY.cam);
  camSpring = false;
  camera.fov = REPLAY.fov;
  phase = "play";
  document.body.classList.remove("replay");
  byId("rplUI").hidden = true;
  last = performance.now();
  if (REPLAY.fromRes) {
    REPLAY.fromRes = false;
    phase = "result";
    byId("result").hidden = false;
  }
}
function rplIdx(k) {
  return (REPLAY.start + Math.min(REPLAY.cnt - 1, Math.max(0, k))) % REPLAY.N;
}
