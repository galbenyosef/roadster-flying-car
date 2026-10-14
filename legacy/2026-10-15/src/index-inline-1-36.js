// index-inline-1 36 — rpl
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
  $("radio").style.setProperty("--rc", R ? R.col : "#fff");
  setT("rdWho", who);
  setT("rdTxt", line);
  $("radio").classList.add("on");
  RADIO.t = 3.6;
  audio.noise(2600, 900, 0.14, 0.13, "bandpass");
  setTimeout(() => audio.noise(2200, 1300, 0.08, 0.07, "bandpass"), 130);
}
function radioTick(dt) {
  if (RADIO.t > 0) {
    RADIO.t -= dt;
    if (RADIO.t <= 0) $("radio").classList.remove("on");
  }
}
function radioRace(pos) {
  if (!M || M.rs !== "run") return;
  if (M.lastPos == null) {
    M.lastPos = pos;
    return;
  }
  if (pos === M.lastPos) return;
  const el = clock - M.t0;
  const was = M.lastPos;
  M.lastPos = pos;
  if (el < 3) return;
  if (pos < was) {
    let best = null,
      bd = 1e9;
    for (const r of RIVALS) {
      const d = M.pprog - r.prog;
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
      const d = r.prog - M.pprog;
      if (d >= 0 && d < bd) {
        bd = d;
        best = r;
      }
    }
    if (best) radio(best.n, "passes");
  }
}

/* ---- instant replay: the last 10 s, re-shot with TV cameras and slow motion ---- */
const RPL = {
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
RPL.buf = new Float32Array(RPL.N * RPL.F);
RPL.tb = new Float32Array(RPL.N * TRAFFIC.length * 3);
RPL.rb = new Float32Array(RPL.N * 12);
function recTick(dt) {
  if (phase !== "play" || (cin.on && cin.freeze) || S.crash > 0) return;
  RPL.acc += dt;
  if (RPL.acc < 1 / RPL.hz) return;
  RPL.acc = Math.min(RPL.acc - 1 / RPL.hz, 1 / RPL.hz);
  const F = RPL.F,
    o = RPL.i * F,
    b = RPL.buf;
  b[o] = S.x;
  b[o + 1] = S.y;
  b[o + 2] = S.z;
  b[o + 3] = S.yaw;
  b[o + 4] = S.pitch;
  b[o + 5] = S.roll;
  b[o + 6] = S.loop ? S.loop.th : 0;
  b[o + 7] = S.bayK;
  b[o + 8] = S.thrust || 0;
  b[o + 9] = S.susp || 0;
  b[o + 10] = S.steer;
  b[o + 11] = S.v;
  b[o + 12] = S.armed ? 1 : 0;
  b[o + 13] = S.air ? 1 : 0;
  b[o + 14] = rplLand;
  rplLand = 0;
  b[o + 15] = S.air ? Math.hypot(S.vx, S.vz) : Math.abs(S.v);
  b[o + 16] = S.dr || 0;
  const to = RPL.i * TRAFFIC.length * 3;
  TRAFFIC.forEach((c, k) => {
    RPL.tb[to + k * 3] = c.x;
    RPL.tb[to + k * 3 + 1] = c.z;
    RPL.tb[to + k * 3 + 2] = c.yaw;
  });
  const ro = RPL.i * 12;
  RIVALS.forEach((r, k) => {
    RPL.rb[ro + k * 4] = r.g.position.x;
    RPL.rb[ro + k * 4 + 1] = r.g.position.z;
    RPL.rb[ro + k * 4 + 2] = r.g.rotation.y;
    RPL.rb[ro + k * 4 + 3] = r.g.visible ? 1 : 0;
  });
  RPL.i = (RPL.i + 1) % RPL.N;
  RPL.n = Math.min(RPL.N, RPL.n + 1);
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
      W.compose(S3.set(w[0], w[1], w[2]), Q0, V2.set(0.3, c.T.wr, c.T.wr));
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
  if (phase !== "play" || RPL.n < 60) return;
  rplHintT = 4.5;
  $("rplHint").classList.add("on");
}
function replayStart() {
  if (phase !== "play" || cin.on || RPL.on || RPL.n < 45 || S.crash > 0)
    return false;
  if (
    M &&
    !M.done &&
    (M.def.id === "deck" ||
      M.def.id === "catch" ||
      (M.def.race && M.rs === "grid"))
  )
    return false;
  RPL.on = true;
  RPL.snap = Object.assign({}, S);
  RPL.rsnap = RIVALS.map((r) => [
    r.g.position.x,
    r.g.position.z,
    r.g.rotation.y,
    r.g.visible,
    r.spin,
  ]);
  RPL.cnt = RPL.n;
  RPL.start = (RPL.i - RPL.n + RPL.N) % RPL.N;
  RPL.p = 0;
  RPL.speed = 0.85;
  RPL.shot = null;
  RPL.shotT = 0;
  RPL.lastI = -1;
  RPL.cam = camPos.clone();
  RPL.fov = camera.fov;
  rplHintT = 0;
  $("rplHint").classList.remove("on");
  phase = "replay";
  document.body.classList.add("replay");
  $("rplUI").hidden = false;
  $("radio").classList.remove("on");
  audio.whoosh();
  return true;
}
function replayEnd() {
  if (!RPL.on) return;
  clipStop();
  RPL.on = false;
  Object.assign(S, RPL.snap);
  trafPose((c) => [c.x, c.z, c.yaw]);
  RIVALS.forEach((r, k) => {
    const q = RPL.rsnap[k];
    r.g.position.x = q[0];
    r.g.position.z = q[1];
    r.g.rotation.y = q[2];
    r.g.visible = q[3];
    r.spin = q[4];
  });
  rivalWheels();
  camPos.copy(RPL.cam);
  camSpring = false;
  camera.fov = RPL.fov;
  phase = "play";
  document.body.classList.remove("replay");
  $("rplUI").hidden = true;
  last = performance.now();
  if (RPL.fromRes) {
    RPL.fromRes = false;
    phase = "result";
    $("result").hidden = false;
  }
}
function rplIdx(k) {
  return (RPL.start + Math.min(RPL.cnt - 1, Math.max(0, k))) % RPL.N;
}
