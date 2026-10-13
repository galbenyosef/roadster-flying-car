// index-inline-1 28 — lerp
// Lines 87293-87641 of readable/index-inline-1.pretty.js (statement-aligned).
const fmtT = (t) =>
  `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

/* ---------------- camera ---------------- */
// launch + landing: wide side-on shots from the open viewing field, so the tower never sits between the camera and the rocket
function launchCam(t) {
  const m = LS.mount,
    R = ROCKET.g.position,
    V = (a, b, c) => new THREE.Vector3(a, b, c);
  if (t < 2.6) {
    const e = easeIO(t / 2.6);
    return {
      p: V(m.x - lerp(30, 34, e), lerp(7, 8.5, e), m.z - lerp(150, 142, e)),
      tg: V(m.x, lerp(22, 26, e) + Math.max(0, R.y - ROCKET.base) * 0.7, m.z),
      fov: lerp(36, 38, e),
    };
  }
  const e = easeIO(clamp((t - 2.6) / 7.5));
  return {
    p: V(m.x - lerp(40, 95, e), lerp(18, 46, e), m.z - lerp(230, 370, e)),
    tg: V(R.x, R.y + 26, R.z),
    fov: lerp(40, 50, e),
  };
}
function landCam(t) {
  const z = LS.lz,
    R = ROCKET.g.position,
    V = (a, b, c) => new THREE.Vector3(a, b, c);
  if (t < 5) {
    const e = easeIO(t / 5);
    return {
      p: V(z.x + lerp(52, 50, e), lerp(5, 4, e), z.z - lerp(165, 150, e)),
      tg: V(R.x, R.y + 22, R.z),
      fov: lerp(34, 30, e),
    };
  }
  const e = easeIO(clamp((t - 5) / 3.5));
  return {
    p: V(z.x + lerp(40, 34, e), lerp(2.8, 2.4, e), z.z - lerp(100, 92, e)),
    tg: V(z.x, Math.max(12, R.y + 18), z.z),
    fov: lerp(42, 44, e),
  };
}
const camPos = new THREE.Vector3(0, 5, 20),
  look = new THREE.Vector3();
let fovK = 0,
  lens = 0;
let viewOff = false;
function setOffset(on) {
  const want = on && innerWidth > 760;
  if (want) {
    camera.setViewOffset(
      innerWidth,
      innerHeight,
      -innerWidth * 0.2,
      0,
      innerWidth,
      innerHeight,
    );
    viewOff = true;
  } else if (viewOff) {
    camera.clearViewOffset();
    viewOff = false;
  }
}
function updateCam(dt) {
  setOffset(phase === "title");
  if (cin.on && cin.kind !== "arm") {
    const p = clamp(cin.t / cin.dur),
      e = easeIO(clamp(p / 0.9));
    car.updateMatrixWorld();
    let P, Tg;
    const gy = groundH(S.x, S.z, S.y).h;
    if (cin.kind === "hover") {
      const a = lerp(2.55, 0.95, e),
        rr = lerp(5.4, 7.4, e);
      P = car.localToWorld(
        new THREE.Vector3(Math.sin(a) * rr, 0, Math.cos(a) * rr),
      );
      P.y = lerp(gy + 0.28, S.y + 2.6, easeIO(clamp((p - 0.15) / 0.75)));
      Tg = car.localToWorld(new THREE.Vector3(0, 0.25, 0));
    } else if (cin.kind === "jump") {
      const hv = Math.hypot(S.vx, S.vz) || 1,
        fx = S.vx / hv,
        fz = S.vz / hv,
        sx = -fz,
        sz = fx,
        a = lerp(-0.7, 0.9, e),
        rr = lerp(8.5, 6.2, e);
      P = new THREE.Vector3(
        S.x + (sx * Math.cos(a) + fx * Math.sin(a)) * rr,
        S.y + lerp(0.5, 1.7, e),
        S.z + (sz * Math.cos(a) + fz * Math.sin(a)) * rr,
      );
      Tg = new THREE.Vector3(S.x, S.y + 0.35, S.z);
    } else if (cin.kind === "finish") {
      const sh = finishCam();
      camera.position.copy(sh.p);
      camera.lookAt(sh.tg);
      camera.fov = sh.fov;
      camera.updateProjectionMatrix();
      return;
    } else if (cin.kind === "launch" || cin.kind === "land") {
      const sh = cin.kind === "launch" ? launchCam(cin.t) : landCam(cin.t);
      camera.position.copy(sh.p);
      camera.lookAt(sh.tg);
      camera.fov = sh.fov;
      camera.updateProjectionMatrix();
      return;
    } else {
      P = car.localToWorld(
        new THREE.Vector3(
          lerp(4.6, 7.6, e),
          lerp(0.7, 1.9, e),
          lerp(7.4, -1.2, e),
        ),
      );
      Tg = car.localToWorld(new THREE.Vector3(0, 0.45, lerp(1.4, -0.2, e)));
    }
    const tw = clamp((p - 0.86) / 0.14);
    if (tw > 0) {
      P.lerp(
        car.localToWorld(
          new THREE.Vector3(0, S.air ? 3.4 : 1.7, S.air ? 8 : 5.6),
        ),
        easeIO(tw),
      );
    }
    camera.position.copy(P);
    camera.lookAt(Tg);
    camera.fov = lerp(cin.kind === "hover" ? 44 : 38, 34, e) + tw * 18;
    camera.updateProjectionMatrix();
    return;
  }
  if (cin.on && cin.full && camMode !== 2) {
    const p = clamp(cin.t / cin.dur),
      e = easeIO(clamp(p / 0.92));
    const a = lerp(0.8, -0.32, e),
      rr = lerp(5.6, 2.35, e),
      y = lerp(1.35, 0.52, easeIO(clamp(p / 0.7)));
    car.updateMatrixWorld();
    const P = new THREE.Vector3(Math.sin(a) * rr, y, 2.3 + Math.cos(a) * rr);
    camera.position.copy(car.localToWorld(P));
    const sh = p > 0.08 && p < 0.2 ? 0.012 : 0;
    camera.position.x += (Math.random() - 0.5) * sh;
    camera.position.y += (Math.random() - 0.5) * sh;
    camera.lookAt(car.localToWorld(new THREE.Vector3(0, 0.45, 2.25)));
    camera.fov = lerp(40, 27, e);
    camera.updateProjectionMatrix();
    return;
  }
  const fw = new THREE.Vector3(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
  const cp = new THREE.Vector3(S.x, S.y, S.z);
  const hs = S.air ? Math.hypot(S.vx, S.vz) : Math.abs(S.v);
  let desired, target;
  if (phase === "title") {
    const a = clock * 0.14 + 2.2,
      rk = veh.model === "pickup" ? 1.35 : veh.model === "cab" ? 1.1 : 1;
    desired = cp
      .clone()
      .add(
        new THREE.Vector3(
          Math.sin(a) * 6.6 * rk,
          (1.15 + Math.sin(clock * 0.35) * 0.25) * rk,
          Math.cos(a) * 6.6 * rk,
        ),
      );
    target = cp.clone().add(new THREE.Vector3(0, 0.55, 0));
  } else if (S.loop && camMode !== 2) {
    const L = S.loop.L;
    desired = new THREE.Vector3(
      L.x - L.rx * 24 - L.fx * 6,
      0.2 + L.R * 0.85,
      L.z - L.rz * 24 - L.fz * 6,
    );
    target = cp.clone().add(new THREE.Vector3(0, 0.5, 0));
  } else if (camMode === 1) {
    desired = cp
      .clone()
      .addScaledVector(fw, -14 - hs * 0.03)
      .add(new THREE.Vector3(0, 4.5, 0));
    target = cp
      .clone()
      .addScaledVector(fw, 8)
      .add(new THREE.Vector3(0, 0.8, 0));
  } else if (camMode === 2) {
    desired = cp
      .clone()
      .addScaledVector(fw, 1.75)
      .add(new THREE.Vector3(0, 0.98, 0));
    target = cp
      .clone()
      .addScaledVector(fw, 20)
      .add(new THREE.Vector3(0, 0.9 - (S.air ? 2 : 0), 0));
  } else if (S.thrust === 2) {
    desired = cp
      .clone()
      .addScaledVector(fw, -10.5)
      .add(new THREE.Vector3(0, 2.1, 0));
    target = cp
      .clone()
      .addScaledVector(fw, 5)
      .add(new THREE.Vector3(0, 0.9, 0));
  } else if (S.air) {
    desired = cp
      .clone()
      .addScaledVector(fw, -8)
      .add(new THREE.Vector3(0, 3.4, 0));
    target = cp
      .clone()
      .addScaledVector(fw, 3)
      .add(new THREE.Vector3(0, -0.4, 0));
  } else {
    const vd = new THREE.Vector3(-Math.sin(S.vyaw), 0, -Math.cos(S.vyaw)),
      cf = fw
        .clone()
        .lerp(vd, clamp(S.dr * 0.6))
        .normalize();
    desired = cp
      .clone()
      .addScaledVector(
        cf,
        -5.3 - hs * 0.034 - clamp(S.glz || 0, -1.2, 1.6) * 0.42,
      )
      .add(new THREE.Vector3(0, 1.55 + hs * 0.003 + (S.armed ? 0.35 : 0), 0));
    target = cp
      .clone()
      .addScaledVector(S.v >= 0 ? vd : fw, 6 + hs * 0.05)
      .add(new THREE.Vector3(0, 0.75, 0));
  }
  const spr = phase === "play" && camMode !== 2 && !S.loop && !S.crash;
  if (spr) {
    const want = desired.clone().sub(cp);
    if (!camSpring || camOff.distanceTo(want) > 45) {
      camOff.copy(camPos).sub(cp);
      if (camOff.length() > 60) camOff.copy(want);
      camOffV.set(0, 0, 0);
      camSpring = true;
    }
    const w = S.air ? 5.2 : 7.2,
      ac = want
        .sub(camOff)
        .multiplyScalar(w * w)
        .addScaledVector(camOffV, -2 * w),
      h = Math.min(dt, 0.05);
    camOffV.addScaledVector(ac, h);
    camOff.addScaledVector(camOffV, h);
    camPos.copy(cp).add(camOff);
  } else {
    camSpring = false;
    const k = camMode === 2 && phase !== "title" ? 1 : 1 - Math.exp(-dt * 6);
    camPos.lerp(desired, k);
  }
  const gy = groundH(camPos.x, camPos.z, camPos.y).h + 0.4;
  if (camPos.y < gy) camPos.y = gy;
  look.lerp(target, camMode === 2 ? 1 : 1 - Math.exp(-dt * 12));
  camera.position.copy(camPos);
  if (camMode !== 2 && !S.loop) {
    const ox = S.x,
      oy = S.y + 1.2,
      oz = S.z,
      dx = camPos.x - ox,
      dy = camPos.y - oy,
      dz = camPos.z - oz;
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      if (hitB(ox + dx * t, oz + dz * t, oy + dy * t, 0.6)) {
        const tt = Math.max(0.12, (i - 1) / 16);
        camera.position.set(ox + dx * tt, oy + dy * tt, oz + dz * tt);
        break;
      }
    }
  }
  const tq = performance.now() / 1000;
  if (shake > 0) {
    camera.position.x += snz(tq, 47, 71, 113) * shake * 0.34;
    camera.position.y += snz(tq, 53, 79, 131) * shake * 0.34;
    shake = Math.max(0, shake - dt * 2.5);
  }
  if (S.thrust === 2)
    camera.position.addScaledVector(
      new THREE.Vector3(snz(tq, 61, 89, 97), snz(tq, 67, 83, 101), 0),
      0.035,
    );
  camera.lookAt(look);
  if (phase === "play" && camMode === 0 && !S.loop) {
    camRoll +=
      (clamp(
        -S.steer * clamp(hs / 50) * 0.03 -
          (S.dr || 0) * Math.sign(S.slip || 0) * 0.025,
        -0.055,
        0.055,
      ) -
        camRoll) *
      Math.min(1, dt * 3);
    camera.rotateZ(camRoll);
  } else camRoll = 0;
  lens +=
    ((S.thrust === 2 && camMode === 0 ? 1 : 0) - lens) * Math.min(1, dt * 3);
  fovK += ((S.thrust ? 1 : 0) - fovK) * Math.min(1, dt * 4);
  camera.fov =
    (phase === "title"
      ? 40
      : 58 + clamp(hs / 110) * 14 + fovK * 4 - lens * 12 + boostKick * 9) -
    (cin.on && !cin.full ? 9 * Math.sin(Math.PI * clamp(cin.t / cin.dur)) : 0);
  camera.updateProjectionMatrix();
}

/* ---------------- HUD ---------------- */
const STATE_LABEL = {
  ARMING: "SPOOLING",
  ARMED: "ROCKET MODE",
  LOOP: "360° LOOP",
};
car.rotation.order = "YXZ";
const gctx = $("gball").getContext("2d");
function drawG() {
  const c = gctx,
    w = 148,
    h = 148,
    cx = 74,
    cy = 74,
    R = 62;
  c.clearRect(0, 0, w, h);
  c.strokeStyle = "rgba(243,239,231,.25)";
  c.lineWidth = 2;
  [1, 0.66, 0.33].forEach((k) => {
    c.beginPath();
    c.arc(cx, cy, R * k, 0, 7);
    c.stroke();
  });
  c.beginPath();
  c.moveTo(cx - R, cy);
  c.lineTo(cx + R, cy);
  c.moveTo(cx, cy - R);
  c.lineTo(cx, cy + R);
  c.stroke();
  const gx = clamp(S.glx / 3, -1, 1),
    gz = clamp(-S.glz / 3, -1, 1);
  c.fillStyle = "#FFB35C";
  c.beginPath();
  c.arc(cx + gx * R, cy + gz * R, 8, 0, 7);
  c.fill();
  c.fillStyle = "#9BA4B0";
  c.font = "700 18px JetBrains Mono, monospace";
  c.textAlign = "center";
  c.fillText(`${Math.hypot(S.glx, S.glz).toFixed(1)}g`, cx, h - 6);
}
const _tc = {};
