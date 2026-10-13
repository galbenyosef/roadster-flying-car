// index-inline-1 25 — math
// Lines 85961-86306 of readable/index-inline-1.pretty.js (statement-aligned).
function mapTarget() {
  if (!M && STORY.on) {
    const k = storyNext();
    if (k >= 0) return { x: CH[k].at[0], z: CH[k].at[1] };
  }
  if (!M || M.done) return null;
  const d = M.def.id,
    pd = (l) => PADS.find((p) => p.label === l);
  {
    const x = mapTarget23(d, pd);
    if (x !== undefined) return x;
  }
  if (d === "hover") return pd("BOX");
  if (d === "pad") return pd("B");
  if (d === "rings") return M.ring < RINGS.length ? RINGS[M.ring] : pd("C");
  if (d === "relay") return pd(["A", "C", "B"][Math.min(2, M.step)]);
  if (d === "deck") return pd("L");
  if (d === "race" || d === "final") return RACE.gates[M.cp];
  if (d === "truck") return RAMPS.find((r) => r.name === "TRUCK JUMP");
  if (d === "loop") return { x: LOOPS[0].x, z: LOOPS[0].z };
  if (d === "bigair") return RAMPS.find((r) => r.name === "MEGA RAMP");
  if (d === "courier") {
    const q = DROPS[Math.min(M.step, DROPS.length - 1)];
    return { x: q[0], z: q[1] };
  }
  if (d === "ramps") {
    let b = null,
      bd = 1e9;
    for (const r of RAMPS) {
      if (r.name === "POND JUMP" || M.hit.has(r.name)) continue;
      const dd = Math.hypot(r.x - S.x, r.z - S.z);
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
    return M.ring < STOUR.length
      ? { x: STOUR[M.ring][0], z: STOUR[M.ring][2] }
      : pd("L");
  if (d === "catch") return { x: VP[0], z: VP[1] };
  return null;
}
function drawMap(t) {
  const c = mctx,
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
  c.rotate(S.yaw);
  const i0 = Math.max(-2, blockOf(S.x - 300)),
    i1 = Math.min(NBK + 1, blockOf(S.x + 300)),
    j0 = Math.max(-2, blockOf(S.z - 300)),
    j1 = Math.min(NBK + 1, blockOf(S.z + 300));
  for (let bi = i0; bi <= i1; bi++)
    for (let bj = j0; bj <= j1; bj++) {
      const inside = bi >= 0 && bj >= 0 && bi < NBK && bj < NBK,
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
        (blockMin(bi) - S.x) * sc,
        (blockMin(bj) - S.z) * sc,
        (P - RW) * sc,
        (P - RW) * sc,
      );
    }
  for (const [px, pz, a, b] of PONDS) {
    c.fillStyle = "#3f7fa6";
    c.beginPath();
    c.ellipse((px - S.x) * sc, (pz - S.z) * sc, a * sc, b * sc, 0, 0, 7);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.55)";
  for (const v of TRAFFIC) {
    const x = (v.x - S.x) * sc,
      z = (v.z - S.z) * sc;
    if (Math.abs(x) < R && Math.abs(z) < R)
      c.fillRect(x - 1.2, z - 1.2, 2.4, 2.4);
  }
  if (RACE.on || CHASE.on)
    for (const r of RIVALS) {
      if (!r.g.visible) continue;
      const x = (r.g.position.x - S.x) * sc,
        z = (r.g.position.z - S.z) * sc;
      c.fillStyle = r.col;
      c.beginPath();
      c.arc(x, z, 4, 0, 7);
      c.fill();
    }
  TOKENS.forEach((k, i) => {
    if (SCORE.tokens.has(i)) return;
    const x = (k.x - S.x) * sc,
      z = (k.z - S.z) * sc;
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
    const x = (p.x - S.x) * sc,
      z = (p.z - S.z) * sc;
    c.fillStyle = "#" + p.color.toString(16).padStart(6, "0");
    c.beginPath();
    c.arc(x, z, 4.5, 0, 7);
    c.fill();
  }
  const tg = mapTarget();
  let tAng = null;
  if (tg) {
    const x = (tg.x - S.x) * sc,
      z = (tg.z - S.z) * sc,
      dd = Math.hypot(x, z);
    if (dd < R - 10) {
      c.strokeStyle = "#fff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, z, 7 + 2 * Math.sin(t * 5), 0, 7);
      c.stroke();
    } else tAng = Math.atan2(z, x) + S.yaw;
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
    const dx = (lm.x - S.x) * sc,
      dz = (lm.z - S.z) * sc,
      sx = dx * Math.cos(S.yaw) - dz * Math.sin(S.yaw),
      sz = dx * Math.sin(S.yaw) + dz * Math.cos(S.yaw);
    if (Math.hypot(sx, sz) < R - 16) {
      c.fillStyle = "rgba(0,0,0,.6)";
      c.fillText(lm.n, R + sx + 1, R + sz + 1);
      c.fillStyle = "#fff";
      c.fillText(lm.n, R + sx, R + sz);
    }
  }
  const nx = R + Math.sin(S.yaw) * (R - 13),
    nz = R - Math.cos(S.yaw) * (R - 13);
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
    dx = S.x - R.x,
    dz = S.z - R.z,
    d = Math.hypot(dx, dz);
  if (d < 5.8 && S.y > R.y - 3 && S.y < R.y + 70) {
    const nx = dx / (d || 1),
      nz = dz / (d || 1);
    S.x = R.x + nx * 5.8;
    S.z = R.z + nz * 5.8;
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
      b = hitB(S.x, S.z, S.y, m);
    if (!b) break;
    hit = true;
    const d = [
        S.x - (b.x0 - m),
        b.x1 + m - S.x,
        S.z - (b.z0 - m),
        b.z1 + m - S.z,
      ],
      mn = Math.min(...d);
    let nx = 0,
      nz = 0;
    if (mn === d[0]) {
      S.x = b.x0 - m;
      nx = -1;
    } else if (mn === d[1]) {
      S.x = b.x1 + m;
      nx = 1;
    } else if (mn === d[2]) {
      S.z = b.z0 - m;
      nz = -1;
    } else {
      S.z = b.z1 + m;
      nz = 1;
    }
    impact(nx, nz, dt);
  }
  const E = HALF + 6;
  let nx = 0,
    nz = 0;
  if (S.x > E) {
    S.x = E;
    nx = -1;
  } else if (S.x < -E) {
    S.x = -E;
    nx = 1;
  }
  if (S.z > E) {
    S.z = E;
    nz = -1;
  } else if (S.z < -E) {
    S.z = -E;
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
  S.suspV = (S.suspV || 0) - Math.min(2.2, imp * 0.14);
  S.pitchV = (S.pitchV || 0) - Math.min(2.5, imp * 0.12);
  shake = Math.max(shake, Math.min(0.7, imp * 0.045));
  if (!S.armed || S.ball) S.v *= 1 - Math.min(0.22, imp * 0.011);
  const r = Math.random,
    n = Math.min(40, Math.round(imp * 2.5));
  for (let k = 0; k < n; k++) {
    const an = r() * 6.283,
      rr = 1.2 + r() * 1.4;
    dust.emit(
      S.x + Math.cos(an) * rr,
      S.y + 0.15,
      S.z + Math.sin(an) * rr,
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
        S.x - fw[0] * 1.6 + (r() - 0.5) * 1.4,
        S.y + 0.12,
        S.z - fw[1] * 1.6 + (r() - 0.5) * 1.4,
        (r() - 0.5) * 6 - fw[0] * S.v * 0.3,
        1 + r() * 3,
        (r() - 0.5) * 6 - fw[1] * S.v * 0.3,
        0.45,
        0.16,
        0,
      );
    audio.noise(2400, 300, 0.35, 0.35, "bandpass");
  }
  for (const sd of [-0.93, 0.93])
    skidMark(
      S.x - fw[0] * 1.38 + Math.cos(S.yaw) * sd,
      S.y + 0.03,
      S.z - fw[1] * 1.38 - Math.sin(S.yaw) * sd,
      S.yaw,
      1.6,
    );
}
// tyre marks: a ring buffer of dark quads on the road
const SKID = (() => {
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
const _sq = new THREE.Quaternion(),
  _se = new THREE.Euler(),
  _sm = new THREE.Matrix4(),
  _sv = new THREE.Vector3(),
  _ss = new THREE.Vector3();
