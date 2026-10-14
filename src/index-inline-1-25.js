// index-inline-1 25 — carstate
// Lines 85961-86306 of readable/index-inline-1.pretty.js (statement-aligned).
function mapTarget() {
  if (!currentMission && STORY.on) {
    const k = storyNext();
    if (k >= 0) return { x: CHAPTERS[k].at[0], z: CHAPTERS[k].at[1] };
  }
  if (!currentMission || currentMission.done) return null;
  const d = currentMission.def.id,
    pd = (l) => PADS.find((p) => p.label === l);
  {
    const x = mapTarget23(d, pd);
    if (x !== undefined) return x;
  }
  if (d === "hover") return pd("BOX");
  if (d === "pad") return pd("B");
  if (d === "rings") return currentMission.ring < RINGS.length ? RINGS[currentMission.ring] : pd("C");
  if (d === "relay") return pd(["A", "C", "B"][Math.min(2, currentMission.step)]);
  if (d === "deck") return pd("L");
  if (d === "race" || d === "final") return RACE.gates[currentMission.cp];
  if (d === "truck") return RAMPS.find((r) => r.name === "TRUCK JUMP");
  if (d === "loop") return { x: LOOPS[0].x, z: LOOPS[0].z };
  if (d === "bigair") return RAMPS.find((r) => r.name === "MEGA RAMP");
  if (d === "courier") {
    const q = DROPS[Math.min(currentMission.step, DROPS.length - 1)];
    return { x: q[0], z: q[1] };
  }
  if (d === "ramps") {
    let b = null,
      bd = 1e9;
    for (const r of RAMPS) {
      if (r.name === "POND JUMP" || currentMission.hit.has(r.name)) continue;
      const dd = Math.hypot(r.x - carState.x, r.z - carState.z);
      if (dd < bd) {
        bd = dd;
        b = r;
      }
    }
    return b;
  }
  if (d === "chase")
    return { x: RIVALS[0].g.position.x, z: RIVALS[0].g.position.z };
  if (d === "skytour")
    return currentMission.ring < STOUR.length
      ? { x: STOUR[currentMission.ring][0], z: STOUR[currentMission.ring][2] }
      : pd("L");
  if (d === "catch") return { x: VIEWPOINT[0], z: VIEWPOINT[1] };
  return null;
}
function drawMap(t) {
  const c = mapCtx,
    W = 200,
    R = 100,
    sc = R / 230;
  c.clearRect(0, 0, W, W);
  c.save();
  c.beginPath();
  c.arc(R, R, R - 3, 0, 7);
  c.clip();
  c.fillStyle = "#4a515b";
  c.fillRect(0, 0, W, W);
  c.translate(R, R);
  c.rotate(carState.yaw);
  const i0 = Math.max(-2, blockOf(carState.x - 300)),
    i1 = Math.min(BLOCK_COUNT + 1, blockOf(carState.x + 300)),
    j0 = Math.max(-2, blockOf(carState.z - 300)),
    j1 = Math.min(BLOCK_COUNT + 1, blockOf(carState.z + 300));
  for (let bi = i0; bi <= i1; bi++)
    for (let bj = j0; bj <= j1; bj++) {
      const inside = bi >= 0 && bj >= 0 && bi < BLOCK_COUNT && bj < BLOCK_COUNT,
        ds = inside ? district(bi, bj) : "out";
      c.fillStyle = {
        park: "#3d6b3a",
        strip: "#54462c",
        industrial: "#2c3036",
        residential: "#39352f",
        core: "#22262d",
        launch: "#6b6f75",
        stunt: "#5a4a28",
        out: "#1a1d22",
      }[ds];
      c.fillRect(
        (blockMin(bi) - carState.x) * sc,
        (blockMin(bj) - carState.z) * sc,
        (BLOCK_PITCH - ROAD_WIDTH) * sc,
        (BLOCK_PITCH - ROAD_WIDTH) * sc,
      );
    }
  for (const [px, pz, a, b] of PONDS) {
    c.fillStyle = "#3f7fa6";
    c.beginPath();
    c.ellipse((px - carState.x) * sc, (pz - carState.z) * sc, a * sc, b * sc, 0, 0, 7);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.55)";
  for (const v of TRAFFIC) {
    const x = (v.x - carState.x) * sc,
      z = (v.z - carState.z) * sc;
    if (Math.abs(x) < R && Math.abs(z) < R)
      c.fillRect(x - 1.2, z - 1.2, 2.4, 2.4);
  }
  if (RACE.on || CHASE.on)
    for (const r of RIVALS) {
      if (!r.g.visible) continue;
      const x = (r.g.position.x - carState.x) * sc,
        z = (r.g.position.z - carState.z) * sc;
      c.fillStyle = r.col;
      c.beginPath();
      c.arc(x, z, 4, 0, 7);
      c.fill();
    }
  TOKENS.forEach((k, i) => {
    if (SCORE.tokens.has(i)) return;
    const x = (k.x - carState.x) * sc,
      z = (k.z - carState.z) * sc;
    if (Math.abs(x) > R || Math.abs(z) > R) return;
    c.fillStyle = "#a77bff";
    c.beginPath();
    c.moveTo(x, z - 3.5);
    c.lineTo(x + 3, z);
    c.lineTo(x, z + 3.5);
    c.lineTo(x - 3, z);
    c.fill();
  });
  for (const p of PADS) {
    const x = (p.x - carState.x) * sc,
      z = (p.z - carState.z) * sc;
    c.fillStyle = "#" + p.color.toString(16).padStart(6, "0");
    c.beginPath();
    c.arc(x, z, 4.5, 0, 7);
    c.fill();
  }
  const tg = mapTarget();
  let tAng = null;
  if (tg) {
    const x = (tg.x - carState.x) * sc,
      z = (tg.z - carState.z) * sc,
      dd = Math.hypot(x, z);
    if (dd < R - 10) {
      c.strokeStyle = "#fff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, z, 7 + 2 * Math.sin(t * 5), 0, 7);
      c.stroke();
    } else tAng = Math.atan2(z, x) + carState.yaw;
  }
  drawEvents(c, sc);
  drawRing(c, sc);
  c.restore();
  if (tAng !== null) {
    const ex = R + Math.cos(tAng) * (R - 12),
      ez = R + Math.sin(tAng) * (R - 12);
    c.save();
    c.translate(ex, ez);
    c.rotate(tAng);
    c.fillStyle = "#fff";
    c.beginPath();
    c.moveTo(8, 0);
    c.lineTo(-6, -6);
    c.lineTo(-6, 6);
    c.fill();
    c.restore();
  }
  c.strokeStyle = "rgba(243,239,231,.35)";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(R, R, R - 3, 0, 7);
  c.stroke();
  c.fillStyle = "#ffb35c";
  c.beginPath();
  c.moveTo(R, R - 9);
  c.lineTo(R + 6.5, R + 7);
  c.lineTo(R, R + 3);
  c.lineTo(R - 6.5, R + 7);
  c.closePath();
  c.fill();
  c.font = "700 10px JetBrains Mono, monospace";
  c.textAlign = "center";
  for (const lm of LANDMARKS) {
    const dx = (lm.x - carState.x) * sc,
      dz = (lm.z - carState.z) * sc,
      sx = dx * Math.cos(carState.yaw) - dz * Math.sin(carState.yaw),
      sz = dx * Math.sin(carState.yaw) + dz * Math.cos(carState.yaw);
    if (Math.hypot(sx, sz) < R - 16) {
      c.fillStyle = "rgba(0,0,0,.6)";
      c.fillText(lm.n, R + sx + 1, R + sz + 1);
      c.fillStyle = "#fff";
      c.fillText(lm.n, R + sx, R + sz);
    }
  }
  const nx = R + Math.sin(carState.yaw) * (R - 13),
    nz = R - Math.cos(carState.yaw) * (R - 13);
  c.fillStyle = "#fff";
  c.font = "700 14px JetBrains Mono, monospace";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("N", nx, nz);
}

/* ---------------- physics ---------------- */
function rocketCollide(dt) {
  if (!ROCKET.g.visible) return;
  const R = ROCKET.g.position,
    dx = carState.x - R.x,
    dz = carState.z - R.z,
    d = Math.hypot(dx, dz);
  if (d < 5.8 && carState.y > R.y - 3 && carState.y < R.y + 70) {
    const nx = dx / (d || 1),
      nz = dz / (d || 1);
    carState.x = R.x + nx * 5.8;
    carState.z = R.z + nz * 5.8;
    impact(nx, nz, dt);
  }
}
function bldCollide(dt) {
  rocketCollide(dt);
  rampCollide(dt);
  loopCollide(dt);
  propCollide(dt);
  let hit = false;
  for (let it = 0; it < 3; it++) {
    const m = 1.15,
      b = hitB(carState.x, carState.z, carState.y, m);
    if (!b) break;
    hit = true;
    const d = [
        carState.x - (b.x0 - m),
        b.x1 + m - carState.x,
        carState.z - (b.z0 - m),
        b.z1 + m - carState.z,
      ],
      mn = Math.min(...d);
    let nx = 0,
      nz = 0;
    if (mn === d[0]) {
      carState.x = b.x0 - m;
      nx = -1;
    } else if (mn === d[1]) {
      carState.x = b.x1 + m;
      nx = 1;
    } else if (mn === d[2]) {
      carState.z = b.z0 - m;
      nz = -1;
    } else {
      carState.z = b.z1 + m;
      nz = 1;
    }
    impact(nx, nz, dt);
  }
  const E = HALF + 6;
  let nx = 0,
    nz = 0;
  if (carState.x > E) {
    carState.x = E;
    nx = -1;
  } else if (carState.x < -E) {
    carState.x = -E;
    nx = 1;
  }
  if (carState.z > E) {
    carState.z = E;
    nz = -1;
  } else if (carState.z < -E) {
    carState.z = -E;
    nz = 1;
  }
  if (nx || nz) {
    impact(nx, nz, dt);
    if (flashT <= 0) flash("CITY LIMIT", "", 1);
  }
  return hit;
}
// landing: suspension compresses, nose slams and rebounds, dust and sparks scale with the hit, speed is scrubbed
function landFx(imp, fw) {
  rplLand = imp;
  camOffV.y -= Math.min(3.2, imp * 0.2);
  if (imp > 11) hitStop = Math.max(hitStop, 0.05);
  carState.suspV = (carState.suspV || 0) - Math.min(2.2, imp * 0.14);
  carState.pitchV = (carState.pitchV || 0) - Math.min(2.5, imp * 0.12);
  shake = Math.max(shake, Math.min(0.7, imp * 0.045));
  if (!carState.armed || carState.ball) carState.v *= 1 - Math.min(0.22, imp * 0.011);
  const r = Math.random,
    n = Math.min(40, Math.round(imp * 2.5));
  for (let k = 0; k < n; k++) {
    const an = r() * 6.283,
      rr = 1.2 + r() * 1.4;
    dust.emit(
      carState.x + Math.cos(an) * rr,
      carState.y + 0.15,
      carState.z + Math.sin(an) * rr,
      Math.cos(an) * (4 + imp * 0.5),
      0.4 + r() * 1.2,
      Math.sin(an) * (4 + imp * 0.5),
      1.2,
      1.1,
      2.6,
    );
  }
  if (imp > 8) {
    for (let k = 0; k < 20; k++)
      sparks.emit(
        carState.x - fw[0] * 1.6 + (r() - 0.5) * 1.4,
        carState.y + 0.12,
        carState.z - fw[1] * 1.6 + (r() - 0.5) * 1.4,
        (r() - 0.5) * 6 - fw[0] * carState.v * 0.3,
        1 + r() * 3,
        (r() - 0.5) * 6 - fw[1] * carState.v * 0.3,
        0.45,
        0.16,
        0,
      );
    audio.noise(2400, 300, 0.35, 0.35, "bandpass");
  }
  for (const sd of [-0.93, 0.93])
    skidMark(
      carState.x - fw[0] * 1.38 + Math.cos(carState.yaw) * sd,
      carState.y + 0.03,
      carState.z - fw[1] * 1.38 - Math.sin(carState.yaw) * sd,
      carState.yaw,
      1.6,
    );
}
// tyre marks: a ring buffer of dark quads on the road
const SKID_MARKS = (() => {
  const n = 700,
    g = new THREE.PlaneGeometry(0.3, 1);
  const m = new THREE.InstancedMesh(
    g,
    new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    n,
  );
  m.count = 0;
  m.frustumCulled = false;
  scene.add(m);
  return { m, n, i: 0 };
})();
const scratchQuatSkid = new THREE.Quaternion(),
  scratchEulerSkid = new THREE.Euler(),
  scratchMatrixSkid = new THREE.Matrix4(),
  scratchVecSkidA = new THREE.Vector3(),
  scratchVecSkidB = new THREE.Vector3();
