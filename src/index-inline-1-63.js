// index-inline-1 63 — math
// Lines 98162-98435 of readable/index-inline-1.pretty.js (statement-aligned).
function frame(now) {
  requestAnimationFrame(frame);
  if (BAT.on && now - BAT.t < 31) return;
  BAT.t = now;
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
  if (cin.on && cin.kind !== "arm") {
    cin.t += rdt;
    const p = cin.t / cin.dur,
      SD = SHOW[cin.kind];
    ts =
      SD && SD.ts
        ? SD.ts(Math.min(1, p))
        : p < 0.1
          ? lerp(1, 0.2, p / 0.1)
          : p < 0.82
            ? 0.2
            : lerp(0.2, 1, (p - 0.82) / 0.18);
    if (p >= 1) endCin();
  } else if (cin.on) {
    cin.t += rdt;
    const p = cin.t / cin.dur;
    ts = cin.rev
      ? p < 0.9
        ? cin.mv
          ? 0.12
          : 0.3
        : lerp(cin.mv ? 0.12 : 0.3, 1, (p - 0.9) / 0.1)
      : cin.full
        ? p < 0.84
          ? 0.22
          : lerp(0.22, 1, (p - 0.84) / 0.16)
        : cin.rt
          ? 1
          : 0.35;
    const bp = cin.full ? clamp((p - 0.08) / 0.7) : clamp(p / 0.75);
    S.bayK = Math.max(S.bayK, cin.k0 + (1 - cin.k0) * easeIO(bp));
    if (p > 0.66 && !cin.lit) {
      cin.lit = true;
      $("cinS2").classList.add("on");
    }
    if (p >= 1) endCin();
  }
  if (S.loop && !cin.on) ts = Math.min(ts, 0.6);
  if (phase === "replay") ts = RPL.speed;
  if (PF.on) ts = 0;
  if (MS.t > 0 && phase === "play") ts = Math.min(ts, 0.35);
  if (hitStop > 0) {
    hitStop -= rdt;
    if (phase === "play") ts = Math.min(ts, 0.05);
  }
  const dt = Math.max(1e-4, rdt * ts);
  clock += dt;
  if (phase !== "replay" && !PF.on) {
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
  else if (PF.on) pfTick(rdt);
  else if (!(cin.on && cin.freeze)) {
    const sub = 4;
    for (let i = 0; i < sub; i++) {
      st = step(dt / sub);
      if (st.ev) ev = st.ev;
    }
  }
  if (phase === "play" && M) missionTick(dt, ev);
  else if (phase === "play") freeTick(dt, ev);
  // g-meter from horizontal acceleration in the car frame
  const vx = S.air ? S.vx : -Math.sin(S.vyaw) * S.v,
    vz = S.air ? S.vz : -Math.cos(S.vyaw) * S.v;
  const ax = (vx - pvx) / dt,
    az = (vz - pvz) / dt;
  pvx = vx;
  pvz = vz;
  const fw = [-Math.sin(S.yaw), -Math.cos(S.yaw)],
    rt = [Math.cos(S.yaw), -Math.sin(S.yaw)];
  S.glz += ((ax * fw[0] + az * fw[1]) / 9.81 - S.glz) * Math.min(1, dt * 8);
  S.glx += ((ax * rt[0] + az * rt[1]) / 9.81 - S.glx) * Math.min(1, dt * 8);
  if (!isFinite(S.glx)) S.glx = 0;
  if (!isFinite(S.glz)) S.glz = 0;
  car.position.set(S.x, S.y, S.z);
  car.rotation.set(S.loop ? S.loop.th : 0, S.yaw, 0);
  body.rotation.set(S.pitch, 0, S.roll);
  S.suspV = (S.suspV || 0) + (-170 * (S.susp || 0) - 13 * (S.suspV || 0)) * dt;
  S.susp = Math.max(-0.2, (S.susp || 0) + S.suspV * dt);
  if (S.crash <= 0)
    body.position.y =
      (S.susp || 0) +
      (S.armed && !S.air ? 0.02 : 0) +
      Math.sin(clock * 18) * 0.004 * clamp(S.v / 30) +
      (S.air ? Math.sin(clock * 9) * 0.012 : 0);
  wheels.forEach((w) => {
    w.spin.rotation.x -= (S.v / w.r) * dt;
    if (w.front)
      w.steer.rotation.y = S.steer * lerp(0.52, 0.075, clamp(S.v / 75));
  });
  setWing(S.dp, S.ang);
  if (!cin.on && phase !== "intro")
    S.bayK +=
      ((S.armed ? 1 : 0) - S.bayK) * Math.min(1, dt * (S.armed ? 2.5 : 5));
  const bglow =
    phase === "intro"
      ? introGlow
      : (S.bayK > 0.7 && S.armed
          ? S.spool < 1.2
            ? 1 + (5 * S.spool) / 1.2
            : S.thrust === 2
              ? 24
              : S.thrust === 1
                ? 8
                : 5
          : 0) +
        (cin.lit ? 9 * Math.max(0, 1 - (cin.t / cin.dur - 0.66) * 4) : 0);
  bayPose(S.bayK, bglow);
  if (
    phase !== "intro" &&
    S.armed &&
    S.bayK > 0.9 &&
    !S.thrust &&
    Math.random() < 0.25
  ) {
    const n = BAYP[(Math.random() * 4) | 0],
      f2 = [-Math.sin(S.yaw), -Math.cos(S.yaw)],
      r2 = [Math.cos(S.yaw), -Math.sin(S.yaw)];
    gas.emit(
      S.x - f2[0] * 2.45 + r2[0] * n[0],
      S.y + n[1],
      S.z - f2[1] * 2.45 + r2[1] * n[0],
      -f2[0] * 2,
      0.3,
      -f2[1] * 2,
      0.7,
      0.1,
      1.2,
    );
  }
  const heatK = clamp((S.heat - 25) / 75);
  nozzleMat.emissive.setRGB(
    lerp(0.5, 1, heatK),
    lerp(0.84, 0.45, heatK),
    lerp(1, 0.2, heatK),
  );
  nozzleMat.emissiveIntensity = S.armed
    ? S.spool < 1.2
      ? 2 + (6 * S.spool) / 1.2
      : S.thrust
        ? 14
        : 5
    : 0;
  revMat.emissiveIntensity = !S.air && S.v < -0.2 ? 3.2 : 0;
  const tailM = car.userData.tail;
  tailM.material.emissiveIntensity = inp().brk && phase === "play" ? 22 : 6;
  const gq = groundH(S.x, S.z, S.y + 0.3).h;
  blob.position.set(S.x, gq + 0.03, S.z);
  blob.rotation.z = -S.yaw;
  const hgt = S.y - gq;
  blob.scale.setScalar(1 + hgt * 0.08);
  blob.material.opacity = 0.38 * clamp(1 - hgt / 14);
  gas.update(dt, 2.2);
  flame.update(dt, 1);
  dust.update(dt, 1.4);
  smoke.update(dt, 1.6);
  sparks.update(dt, 0.5);
  BOTS.forEach((b) => {
    const near =
      Math.hypot(b.position.x - S.x, b.position.z - S.z) < 18 || WEV.wave > 0;
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
    S.x + sunDir.x * 400,
    S.y + sunDir.y * 400,
    S.z + sunDir.z * 400,
  );
  sun.target.position.set(S.x, S.y, S.z);
  if (phase === "replay") rplCam(rdt);
  else if (PF.on) pfCam();
  else if (phase !== "intro" && phase !== "cut") updateCam(rdt);
  showTick();
  keyL.intensity = phase === "intro" || (cin.on && cin.full) ? 48 : 0;
  keyL.position.copy(camera.position).y += 0.9;
  skyG.position.copy(camera.position);
  if (window.__tip) window.__tip.visible = Math.floor(now / 600) % 2 === 0;
  if (flashT > 0) {
    flashT -= rdt;
    if (flashT <= 0) {
      $("msgbig").textContent = "";
      $("msgsmall").textContent = "";
    }
  }
  if (phase === "play") {
    hud(st);
    if ((mapTick = (mapTick + 1) % 2) === 0) drawMap(clock);
    updateNav();
    const dv = Math.round(SCORE.drift);
    setT("driftLive", dv > 0 ? `DRIFT ${dv.toLocaleString("en-US")}` : "");
    $("driftLive").classList.toggle("on", dv > 0);
    setT(
      "mmfoot",
      `${SCORE.total.toLocaleString("en-US")} PTS · ${SCORE.tokens.size}/${TOKENS.length} TOKENS`,
    );
  } else if (!$("nav").hidden) {
    $("nav").hidden = true;
    $("turnCue").classList.remove("on");
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
applyVehicle(VSEL());
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
