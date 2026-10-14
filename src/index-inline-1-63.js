// index-inline-1 63 — carstate
// Lines 98162-98435 of readable/index-inline-1.pretty.js (statement-aligned).
function frame(now) {
  requestAnimationFrame(frame);
  if (BATTERY_SAVER.on && now - BATTERY_SAVER.t < 31) return;
  BATTERY_SAVER.t = now;
  if (PAUSE.on) {
    last = now;
    composer.render();
    return;
  }
  if (
    window.__pause ||
    (isTouch &&
      innerHeight > innerWidth &&
      (phase === "play" || phase === "intro"))
  ) {
    last = now;
    return;
  }
  const rawMs = now - last,
    rdt = Math.min(0.05, rawMs / 1000);
  last = now;
  if (phase === "play" && !document.hidden) perfTick(rawMs);
  if (phase === "photo") {
    photoTick(rdt);
    composer.render();
    return;
  }
  let ts = 1;
  if (cinematic.on && cinematic.kind !== "arm") {
    cinematic.t += rdt;
    const p = cinematic.t / cinematic.dur,
      SD = SHOW[cinematic.kind];
    ts =
      SD && SD.ts
        ? SD.ts(Math.min(1, p))
        : p < 0.1
          ? lerp(1, 0.2, p / 0.1)
          : p < 0.82
            ? 0.2
            : lerp(0.2, 1, (p - 0.82) / 0.18);
    if (p >= 1) endCin();
  } else if (cinematic.on) {
    cinematic.t += rdt;
    const p = cinematic.t / cinematic.dur;
    ts = cinematic.rev
      ? p < 0.9
        ? cinematic.mv
          ? 0.12
          : 0.3
        : lerp(cinematic.mv ? 0.12 : 0.3, 1, (p - 0.9) / 0.1)
      : cinematic.full
        ? p < 0.84
          ? 0.22
          : lerp(0.22, 1, (p - 0.84) / 0.16)
        : cinematic.rt
          ? 1
          : 0.35;
    const bp = cinematic.full ? clamp((p - 0.08) / 0.7) : clamp(p / 0.75);
    carState.bayK = Math.max(carState.bayK, cinematic.k0 + (1 - cinematic.k0) * easeIO(bp));
    if (p > 0.66 && !cinematic.lit) {
      cinematic.lit = true;
      byId("cinS2").classList.add("on");
    }
    if (p >= 1) endCin();
  }
  if (carState.loop && !cinematic.on) ts = Math.min(ts, 0.6);
  if (phase === "replay") ts = REPLAY.speed;
  if (PHOTO_FINISH.on) ts = 0;
  if (MINI_SLOW.t > 0 && phase === "play") ts = Math.min(ts, 0.35);
  if (hitStop > 0) {
    hitStop -= rdt;
    if (phase === "play") ts = Math.min(ts, 0.05);
  }
  const dt = Math.max(1e-4, rdt * ts);
  clock += dt;
  if (phase !== "replay" && !PHOTO_FINISH.on) {
    updateTraffic(dt);
    updateLaunch(dt);
    updateRivals(dt);
  }
  updateMarker(clock);
  plume.update(dt, 0.8);
  rsmoke.update(dt, 0.35);
  updateWalkers(dt, clock);
  updateBoards(rdt, clock);
  updateTokens(clock);
  updateWheel(dt, clock);
  let st = { df: 0, mu: 1.45, geff: 9.81, ev: null },
    ev = null;
  if (phase === "cut") cutTick(rdt);
  else if (phase === "intro") introTick(rdt);
  else if (phase === "replay") replayTick(dt);
  else if (PHOTO_FINISH.on) pfTick(rdt);
  else if (!(cinematic.on && cinematic.freeze)) {
    const sub = 4;
    for (let i = 0; i < sub; i++) {
      st = step(dt / sub);
      if (st.ev) ev = st.ev;
    }
  }
  if (phase === "play" && currentMission) missionTick(dt, ev);
  else if (phase === "play") freeTick(dt, ev);
  // g-meter from horizontal acceleration in the car frame
  const vx = carState.air ? carState.vx : -Math.sin(carState.vyaw) * carState.v,
    vz = carState.air ? carState.vz : -Math.cos(carState.vyaw) * carState.v;
  const ax = (vx - prevVx) / dt,
    az = (vz - prevVz) / dt;
  prevVx = vx;
  prevVz = vz;
  const fw = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)],
    rt = [Math.cos(carState.yaw), -Math.sin(carState.yaw)];
  carState.glz += ((ax * fw[0] + az * fw[1]) / 9.81 - carState.glz) * Math.min(1, dt * 8);
  carState.glx += ((ax * rt[0] + az * rt[1]) / 9.81 - carState.glx) * Math.min(1, dt * 8);
  if (!isFinite(carState.glx)) carState.glx = 0;
  if (!isFinite(carState.glz)) carState.glz = 0;
  car.position.set(carState.x, carState.y, carState.z);
  car.rotation.set(carState.loop ? carState.loop.th : 0, carState.yaw, 0);
  body.rotation.set(carState.pitch, 0, carState.roll);
  carState.suspV = (carState.suspV || 0) + (-170 * (carState.susp || 0) - 13 * (carState.suspV || 0)) * dt;
  carState.susp = Math.max(-0.2, (carState.susp || 0) + carState.suspV * dt);
  if (carState.crash <= 0)
    body.position.y =
      (carState.susp || 0) +
      (carState.armed && !carState.air ? 0.02 : 0) +
      Math.sin(clock * 18) * 0.004 * clamp(carState.v / 30) +
      (carState.air ? Math.sin(clock * 9) * 0.012 : 0);
  wheels.forEach((w) => {
    w.spin.rotation.x -= (carState.v / w.r) * dt;
    if (w.front)
      w.steer.rotation.y = carState.steer * lerp(0.52, 0.075, clamp(carState.v / 75));
  });
  setWing(carState.dp, carState.ang);
  if (!cinematic.on && phase !== "intro")
    carState.bayK +=
      ((carState.armed ? 1 : 0) - carState.bayK) * Math.min(1, dt * (carState.armed ? 2.5 : 5));
  const bglow =
    phase === "intro"
      ? introGlow
      : (carState.bayK > 0.7 && carState.armed
          ? carState.spool < 1.2
            ? 1 + (5 * carState.spool) / 1.2
            : carState.thrust === 2
              ? 24
              : carState.thrust === 1
                ? 8
                : 5
          : 0) +
        (cinematic.lit ? 9 * Math.max(0, 1 - (cinematic.t / cinematic.dur - 0.66) * 4) : 0);
  bayPose(carState.bayK, bglow);
  if (
    phase !== "intro" &&
    carState.armed &&
    carState.bayK > 0.9 &&
    !carState.thrust &&
    Math.random() < 0.25
  ) {
    const n = BAY_PORTS[(Math.random() * 4) | 0],
      f2 = [-Math.sin(carState.yaw), -Math.cos(carState.yaw)],
      r2 = [Math.cos(carState.yaw), -Math.sin(carState.yaw)];
    gas.emit(
      carState.x - f2[0] * 2.45 + r2[0] * n[0],
      carState.y + n[1],
      carState.z - f2[1] * 2.45 + r2[1] * n[0],
      -f2[0] * 2,
      0.3,
      -f2[1] * 2,
      0.7,
      0.1,
      1.2,
    );
  }
  const heatK = clamp((carState.heat - 25) / 75);
  nozzleMat.emissive.setRGB(
    lerp(0.5, 1, heatK),
    lerp(0.84, 0.45, heatK),
    lerp(1, 0.2, heatK),
  );
  nozzleMat.emissiveIntensity = carState.armed
    ? carState.spool < 1.2
      ? 2 + (6 * carState.spool) / 1.2
      : carState.thrust
        ? 14
        : 5
    : 0;
  revMat.emissiveIntensity = !carState.air && carState.v < -0.2 ? 3.2 : 0;
  const tailM = car.userData.tail;
  tailM.material.emissiveIntensity = readInput().brk && phase === "play" ? 22 : 6;
  const gq = groundH(carState.x, carState.z, carState.y + 0.3).h;
  blob.position.set(carState.x, gq + 0.03, carState.z);
  blob.rotation.z = -carState.yaw;
  const hgt = carState.y - gq;
  blob.scale.setScalar(1 + hgt * 0.08);
  blob.material.opacity = 0.38 * clamp(1 - hgt / 14);
  gas.update(dt, 2.2);
  flame.update(dt, 1);
  dust.update(dt, 1.4);
  smoke.update(dt, 1.6);
  sparks.update(dt, 0.5);
  BOTS.forEach((b) => {
    const near =
      Math.hypot(b.position.x - carState.x, b.position.z - carState.z) < 18 || walkerEvent.wave > 0;
    const sp = near ? (servicing ? 9 : 5) : 1.5;
    const a = b.userData.arms;
    a[1].rotation.z = near
      ? -2.4 + Math.sin(clock * sp + b.userData.ph) * 0.5
      : Math.sin(clock * sp + b.userData.ph) * 0.1;
    a[0].rotation.z = Math.sin(clock * 1.2 + b.userData.ph) * 0.08;
  });
  PADS.forEach((p) => {
    if (p.beam.visible)
      p.beam.material.opacity = 0.22 + 0.08 * Math.sin(clock * 3);
  });
  sun.position.set(
    carState.x + sunDir.x * 400,
    carState.y + sunDir.y * 400,
    carState.z + sunDir.z * 400,
  );
  sun.target.position.set(carState.x, carState.y, carState.z);
  if (phase === "replay") rplCam(rdt);
  else if (PHOTO_FINISH.on) pfCam();
  else if (phase !== "intro" && phase !== "cut") updateCam(rdt);
  showTick();
  keyLight.intensity = phase === "intro" || (cinematic.on && cinematic.full) ? 48 : 0;
  keyLight.position.copy(camera.position).y += 0.9;
  skyG.position.copy(camera.position);
  if (window.__tip) window.__tip.visible = Math.floor(now / 600) % 2 === 0;
  if (flashT > 0) {
    flashT -= rdt;
    if (flashT <= 0) {
      byId("msgbig").textContent = "";
      byId("msgsmall").textContent = "";
    }
  }
  if (phase === "play") {
    hud(st);
    if ((mapTick = (mapTick + 1) % 2) === 0) drawMap(clock);
    updateNav();
    const dv = Math.round(SCORE.drift);
    setT("driftLive", dv > 0 ? `DRIFT ${dv.toLocaleString("en-US")}` : "");
    byId("driftLive").classList.toggle("on", dv > 0);
    setT(
      "mmfoot",
      `${SCORE.total.toLocaleString("en-US")} PTS · ${SCORE.tokens.size}/${TOKENS.length} TOKENS`,
    );
  } else if (!byId("nav").hidden) {
    byId("nav").hidden = true;
    byId("turnCue").classList.remove("on");
  }
  v18Tick(rdt, dt);
  v19Tick(rdt, dt);
  v20Tick(rdt, dt);
  v21Tick(rdt, dt);
  v22Tick(rdt, dt);
  v23Tick(rdt, dt);
  v26Frame(rdt, dt);
  v27Frame(rdt, dt);
  v28Frame(rdt, dt);
  composer.render();
  clipFrame();
}
applyVehicle(SELECTED_VEHICLE());
renderHome();
updateTraffic(0);
place(3.5, 440, 0);
requestAnimationFrame(frame);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  [gas, dust, smoke, sparks, flame, plume, rsmoke].forEach(
    (p) => (p.mat.uniforms.scale.value = innerHeight * 0.5),
  );
});
