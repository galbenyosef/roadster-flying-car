// index-inline-1 46 — calloutstate
// Lines 92974-93264 of readable/index-inline-1.pretty.js (statement-aligned).
const REVEAL_CUES = [
  [
    0.25,
    () => {
      audio.unlock();
      shake = Math.max(shake, 0.05);
      revealGas(0);
    },
  ],
  [0.55, () => revealGas(0)],
  [1.15, () => audio.hinge()],
  [1.55, () => audio.click(true)],
  [2.65, () => audio.servo()],
  [2.79, () => audio.servo()],
  [2.93, () => audio.servo()],
  [3.07, () => audio.servo()],
  [
    3.9,
    () => {
      audio.ignite();
      revealGas(1);
    },
  ],
  [4.3, () => revealGas(1)],
];
function revealGas(kind) {
  car.updateMatrixWorld();
  const r = Math.random,
    back = new THREE.Vector3(
      -Math.sin(carState.yaw),
      0,
      -Math.cos(carState.yaw),
    ).multiplyScalar(-1);
  if (kind === 0) {
    for (let i = 0; i < 10; i++) {
      const p = body.localToWorld(
        new THREE.Vector3((r() - 0.5) * PLATE_W, PLATE_Y - PLATE_H * r(), PLATE_Z + 0.04),
      );
      gas.emit(
        p.x,
        p.y,
        p.z,
        back.x * 1.2 + (r() - 0.5) * 0.6,
        (r() - 0.3) * 0.5,
        back.z * 1.2 + (r() - 0.5) * 0.6,
        0.6,
        0.05,
        0.7,
      );
    }
  } else
    for (const [x, y] of BAY_PORTS)
      for (let i = 0; i < 4; i++) {
        const p = body.localToWorld(new THREE.Vector3(x, y, 2.42));
        gas.emit(
          p.x,
          p.y,
          p.z,
          back.x * (4 + r() * 3) + (r() - 0.5),
          (r() - 0.5) * 0.6,
          back.z * (4 + r() * 3) + (r() - 0.5),
          0.7,
          0.08,
          1.4,
        );
      }
}
function revealPose(t) {
  const sl = easeIO(clamp((t - 0.25) / 0.35)),
    jit = t > 0.25 && t < 0.45 ? Math.sin(t * 160) * 0.002 : 0;
  platePivot.position.z = PLATE_Z + 0.04 * sl;
  platePivot.position.y = PLATE_Y + 0.012 * sl + jit;
  // a hinge motor with a damped spring: overshoot about 6%, settled in 0.7 s
  let th = 0;
  if (t > 1.15) {
    const u = t - 1.15,
      sg = 7,
      wd = 8;
    th =
      1 - Math.exp(-sg * u) * (Math.cos(wd * u) + (sg / wd) * Math.sin(wd * u));
  }
  platePivot.rotation.x = -2.25 * th;
  bayNoz.forEach((n, i) => {
    const u = clamp((t - 2.65 - i * 0.14) / 0.42);
    n.position.z = lerp(2.24, 2.35, u > 0 ? easeBack(u) : 0);
  });
  bayCoreMat.emissiveIntensity =
    t < 3.8
      ? 0
      : t < 4.6
        ? ((t - 3.8) / 0.8) * 11 * (0.85 + Math.random() * 0.3)
        : lerp(11, 5, clamp((t - 4.6) / 0.8));
  nozzleMat.emissiveIntensity = t < 3.8 ? 0 : Math.min(5, (t - 3.8) * 7);
}
var calloutState = null;
function revealCallout(sh, t) {
  const L = byId("callouts");
  if (!calloutState || calloutState.sh !== sh) {
    L.innerHTML = '<svg width="100%" height="100%"></svg>';
    const d = document.createElement("div");
    d.className = "co";
    d.innerHTML = `<b>${sh.co[0]}</b><span>${sh.co[1]}</span>`;
    L.appendChild(d);
    const ln = document.createElementNS("http://www.w3.org/2000/svg", "line"),
      dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("r", "0");
    L.firstChild.append(ln, dot);
    calloutState = { sh, d, ln, dot, on: false };
  }
  const u = (t - sh.t0) / (sh.t1 - sh.t0);
  if (!calloutState.on && u > 0.18) {
    calloutState.on = true;
    calloutState.d.classList.add("on");
    calloutState.ln.classList.add("on");
    calloutState.dot.setAttribute("r", "4.5");
    audio.ping();
  }
  car.updateMatrixWorld();
  const v = body.localToWorld(sh.a()).project(camera),
    W = innerWidth,
    H = innerHeight,
    x = (v.x * 0.5 + 0.5) * W,
    y = (-v.y * 0.5 + 0.5) * H,
    left = x > W * 0.55,
    lx = clamp(x + (left ? -150 : 150), 90, W - 90),
    ly = clamp(y - H * 0.16, H * 0.16, H * 0.64);
  calloutState.ln.setAttribute("x1", x);
  calloutState.ln.setAttribute("y1", y);
  calloutState.ln.setAttribute("x2", lx);
  calloutState.ln.setAttribute("y2", ly);
  calloutState.dot.setAttribute("cx", x);
  calloutState.dot.setAttribute("cy", y);
  calloutState.d.classList.toggle("l", left);
  calloutState.d.style.transform = `translate(${lx}px,${ly}px) translate(${left ? "-100%" : "0"},-50%)`;
  calloutState.d.style.opacity = calloutState.on ? Math.min(1, (1 - u) / 0.1) : 0;
}
function revealTick(dt) {
  const t = cinematic.t;
  revealPose(t);
  while (cinematic.cue < REVEAL_CUES.length && t >= REVEAL_CUES[cinematic.cue][0]) {
    REVEAL_CUES[cinematic.cue][1]();
    cinematic.cue++;
  }
  const sh = RSHOT.find((s) => t < s.t1) || null,
    V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  car.updateMatrixWorld();
  let P, Lk, fov;
  if (sh) {
    const u = clamp((t - sh.t0) / (sh.t1 - sh.t0)),
      e = sh === RSHOT[3] ? easeIO(u) : u;
    P = car.localToWorld(V(sh.P[0]).lerp(V(sh.P[1]), e));
    Lk = car.localToWorld(V(sh.L[0]).lerp(V(sh.L[1]), e));
    fov = lerp(sh.f[0], sh.f[1], e);
    if (cinematic.shot !== sh) {
      cinematic.shot = sh;
      byId("cinK").textContent = sh.k;
      byId("cinS").textContent = sh.s;
    }
  } else {
    const u = easeIO(clamp((t - 5) / 0.4)),
      s3 = RSHOT[3];
    P = car.localToWorld(V(s3.P[1]).lerp(V([0, 1.9, 6.2]), u));
    Lk = car.localToWorld(V(s3.L[1]).lerp(V([0, 0.75, -6]), u));
    fov = lerp(52, 58, u);
    if (calloutState) {
      byId("callouts").innerHTML = "";
      calloutState = null;
    }
  }
  camera.position.copy(P);
  camera.lookAt(Lk);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  revealLight();
  camera.updateMatrixWorld();
  if (sh) revealCallout(sh, t);
  if (currentMission && !currentMission.done) currentMission.t0 += dt;
}
function skipCin() {
  if (!cinematic.on || phase !== "play") return;
  if (cinematic.rev || cinematic.kind === "hover") {
    cinematic.t = cinematic.dur;
    if (cinematic.rev) {
      revealPose(REVEAL_DUR);
      while (cinematic.cue < REVEAL_CUES.length) {
        if (REVEAL_CUES[cinematic.cue][0] >= 3.9 && REVEAL_CUES[cinematic.cue][0] < 4) audio.ignite();
        cinematic.cue++;
      }
    }
  }
}
byId("cinSkip").addEventListener("click", (e) => {
  e.stopPropagation();
  skipCin();
});
addEventListener("keydown", (e) => {
  if (e.key === "Enter" && cinematic.on && (cinematic.rev || cinematic.kind === "hover"))
    skipCin();
});

/* ---- every mission says where to go ---- */
function mapTarget23(d, pd) {
  if (d === "tutorial") return tutTarget();
  if (d === "drone")
    return DRONE.att
      ? { x: DRN_ROOF[0], z: DRN_ROOF[2] }
      : { x: DRONE.g.position.x, z: DRONE.g.position.z };
  if (d === "jam") return pd("A");
  if (d === "launchday") return currentMission.step === 0 ? pd("L") : { x: VIEWPOINT[0], z: VIEWPOINT[1] };
  if (d === "stuntshow") {
    let b = null,
      bd = 1e9;
    for (const r of RAMPS) {
      if (r.name === "POND JUMP") continue;
      const dd = Math.hypot(r.x - carState.x, r.z - carState.z);
      if (dd < bd && dd > 14) {
        bd = dd;
        b = r;
      }
    }
    return b;
  }
  if (d === "launch")
    return currentMission.started
      ? null
      : { x: carState.x - Math.sin(carState.yaw) * 200, z: carState.z - Math.cos(carState.yaw) * 200 };
  return undefined;
}
function navLabel23(d) {
  if (d === "drone") return DRONE.att ? "DINER ROOF" : "DRONE";
  if (d === "tutorial")
    return (
      [
        "GOLD GATE",
        "",
        "PARK GATE",
        "",
        "",
        "GOLD RING",
        "THE BOX",
        "",
        "PAD A ROOF",
      ][currentMission.step] || ""
    );
  return (
    {
      jam: "PAD A ROOF",
      launchday: currentMission.step === 0 ? "TOWER DECK" : "VIEW POINT",
      stuntshow: "NEAREST RAMP",
      launch: "STRAIGHT AHEAD",
    }[d] || ""
  );
}
const FLY_MISSIONS = new Set([
  "jam",
  "hover",
  "pad",
  "rings",
  "relay",
  "deck",
  "skytour",
  "launchday",
]);
function objHelp(d, obj) {
  if (!FLY_MISSIONS.has(d.id) || currentMission.done || (d.id === "launchday" && currentMission.step > 0))
    return obj;
  if (!carState.armed && !carState.air) return `ROCKET MODE first: ${KEY_LABELS("rocket")} · ${obj}`;
  if (carState.armed && !carState.air && carState.spool >= 1.2 && !/lift|HOVER|SPACE/.test(obj))
    return `Hold ${KEY_LABELS("hover")} to lift off · ${obj}`;
  return obj;
}

/* ---- Chapter 1: FIRST DRIVE, a controls tutorial with no clock and no fail ---- */
// one control per step; the control to press glows (touch) or shows as keycaps (keyboard)
const TUTORIAL_PAD = [50, 378];
const KEYS = {
  gas: ["W"],
  steer: ["A", "D"],
  brake: ["S"],
  rocket: ["SHIFT"],
  hover: ["SPACE"],
  boost: ["B"],
};
const TOUCH_BUTTONS = {
  gas: "tbGo",
  brake: "tbBr",
  rocket: "tbArm",
  hover: "tbHov",
  boost: "tbBst",
  steer: "joyBase",
};
