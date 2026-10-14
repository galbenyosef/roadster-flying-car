// index-inline-1 46 — rco
// Lines 92974-93264 of readable/index-inline-1.pretty.js (statement-aligned).
const RCUE = [
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
      -Math.sin(S.yaw),
      0,
      -Math.cos(S.yaw),
    ).multiplyScalar(-1);
  if (kind === 0) {
    for (let i = 0; i < 10; i++) {
      const p = body.localToWorld(
        new THREE.Vector3((r() - 0.5) * PW, PY - PH * r(), PZ + 0.04),
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
    for (const [x, y] of BAYP)
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
  platePivot.position.z = PZ + 0.04 * sl;
  platePivot.position.y = PY + 0.012 * sl + jit;
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
var rco = null;
function revealCallout(sh, t) {
  const L = $("callouts");
  if (!rco || rco.sh !== sh) {
    L.innerHTML = '<svg width="100%" height="100%"></svg>';
    const d = document.createElement("div");
    d.className = "co";
    d.innerHTML = `<b>${sh.co[0]}</b><span>${sh.co[1]}</span>`;
    L.appendChild(d);
    const ln = document.createElementNS("http://www.w3.org/2000/svg", "line"),
      dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("r", "0");
    L.firstChild.append(ln, dot);
    rco = { sh, d, ln, dot, on: false };
  }
  const u = (t - sh.t0) / (sh.t1 - sh.t0);
  if (!rco.on && u > 0.18) {
    rco.on = true;
    rco.d.classList.add("on");
    rco.ln.classList.add("on");
    rco.dot.setAttribute("r", "4.5");
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
  rco.ln.setAttribute("x1", x);
  rco.ln.setAttribute("y1", y);
  rco.ln.setAttribute("x2", lx);
  rco.ln.setAttribute("y2", ly);
  rco.dot.setAttribute("cx", x);
  rco.dot.setAttribute("cy", y);
  rco.d.classList.toggle("l", left);
  rco.d.style.transform = `translate(${lx}px,${ly}px) translate(${left ? "-100%" : "0"},-50%)`;
  rco.d.style.opacity = rco.on ? Math.min(1, (1 - u) / 0.1) : 0;
}
function revealTick(dt) {
  const t = cin.t;
  revealPose(t);
  while (cin.cue < RCUE.length && t >= RCUE[cin.cue][0]) {
    RCUE[cin.cue][1]();
    cin.cue++;
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
    if (cin.shot !== sh) {
      cin.shot = sh;
      $("cinK").textContent = sh.k;
      $("cinS").textContent = sh.s;
    }
  } else {
    const u = easeIO(clamp((t - 5) / 0.4)),
      s3 = RSHOT[3];
    P = car.localToWorld(V(s3.P[1]).lerp(V([0, 1.9, 6.2]), u));
    Lk = car.localToWorld(V(s3.L[1]).lerp(V([0, 0.75, -6]), u));
    fov = lerp(52, 58, u);
    if (rco) {
      $("callouts").innerHTML = "";
      rco = null;
    }
  }
  camera.position.copy(P);
  camera.lookAt(Lk);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  revealLight();
  camera.updateMatrixWorld();
  if (sh) revealCallout(sh, t);
  if (M && !M.done) M.t0 += dt;
}
function skipCin() {
  if (!cin.on || phase !== "play") return;
  if (cin.rev || cin.kind === "hover") {
    cin.t = cin.dur;
    if (cin.rev) {
      revealPose(REVEAL_DUR);
      while (cin.cue < RCUE.length) {
        if (RCUE[cin.cue][0] >= 3.9 && RCUE[cin.cue][0] < 4) audio.ignite();
        cin.cue++;
      }
    }
  }
}
$("cinSkip").addEventListener("click", (e) => {
  e.stopPropagation();
  skipCin();
});
addEventListener("keydown", (e) => {
  if (e.key === "Enter" && cin.on && (cin.rev || cin.kind === "hover"))
    skipCin();
});

/* ---- every mission says where to go ---- */
function mapTarget23(d, pd) {
  if (d === "tutorial") return tutTarget();
  if (d === "drone")
    return DRN.att
      ? { x: DRN_ROOF[0], z: DRN_ROOF[2] }
      : { x: DRN.g.position.x, z: DRN.g.position.z };
  if (d === "jam") return pd("A");
  if (d === "launchday") return M.step === 0 ? pd("L") : { x: VP[0], z: VP[1] };
  if (d === "stuntshow") {
    let b = null,
      bd = 1e9;
    for (const r of RAMPS) {
      if (r.name === "POND JUMP") continue;
      const dd = Math.hypot(r.x - S.x, r.z - S.z);
      if (dd < bd && dd > 14) {
        bd = dd;
        b = r;
      }
    }
    return b;
  }
  if (d === "launch")
    return M.started
      ? null
      : { x: S.x - Math.sin(S.yaw) * 200, z: S.z - Math.cos(S.yaw) * 200 };
  return undefined;
}
function navLabel23(d) {
  if (d === "drone") return DRN.att ? "DINER ROOF" : "DRONE";
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
      ][M.step] || ""
    );
  return (
    {
      jam: "PAD A ROOF",
      launchday: M.step === 0 ? "TOWER DECK" : "VIEW POINT",
      stuntshow: "NEAREST RAMP",
      launch: "STRAIGHT AHEAD",
    }[d] || ""
  );
}
const FLY = new Set([
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
  if (!FLY.has(d.id) || M.done || (d.id === "launchday" && M.step > 0))
    return obj;
  if (!S.armed && !S.air) return `ROCKET MODE first: ${KY("rocket")} · ${obj}`;
  if (S.armed && !S.air && S.spool >= 1.2 && !/lift|HOVER|SPACE/.test(obj))
    return `Hold ${KY("hover")} to lift off · ${obj}`;
  return obj;
}

/* ---- Chapter 1: FIRST DRIVE, a controls tutorial with no clock and no fail ---- */
// one control per step; the control to press glows (touch) or shows as keycaps (keyboard)
const TG1 = [50, 378];
const KEYS = {
  gas: ["W"],
  steer: ["A", "D"],
  brake: ["S"],
  rocket: ["SHIFT"],
  hover: ["SPACE"],
  boost: ["B"],
};
const TBTN = {
  gas: "tbGo",
  brake: "tbBr",
  rocket: "tbArm",
  hover: "tbHov",
  boost: "tbBst",
  steer: "joyBase",
};
