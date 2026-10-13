// index-inline-1 24 — math
// Lines 85625-85960 of readable/index-inline-1.pretty.js (statement-aligned).
function failCrash(v, lim = LIMIT) {
  if (M && !M.done && M.def.id === "tutorial") {
    comboEnd(true);
    flash(
      "TOO HARD",
      `${v.toFixed(1)} m/s · land under ${LIMIT} m/s: let go of HOVER sooner`,
      2.6,
    );
    return;
  }
  if (wipeout(v)) return;
  if (M && !M.done)
    finish(
      false,
      lim === LIMIT
        ? `Hard landing at ${v.toFixed(1)} m/s. The limit is ${LIMIT} m/s: let go of SPACE earlier and let the thrusters settle you.`
        : `Hard landing at ${v.toFixed(1)} m/s. Even the suspension stops at ${lim} m/s.`,
      { time: null, land: v },
    );
}

/* ---------------- the launch complex: countdown, liftoff, booster landing ---------------- */
const LAUNCH = { st: "idle", t: 60, cycle: 150, y: 0, v: 0 };
const plume = new Puffs(isTouch ? 400 : 800, 0xffe2b8, true, 0.95),
  rsmoke = new Puffs(isTouch ? 500 : 900, 0xe9e6e1, false, 0.55);
function resetLaunch(t) {
  Object.assign(LAUNCH, { st: "idle", t: t || 0, y: 0, v: 0 });
  ROCKET.g.visible = true;
  ROCKET.g.rotation.set(0, 0, 0);
  ROCKET.g.position.set(LS.mount.x, ROCKET.base, LS.mount.z);
}
function emitPlume(k) {
  const R = ROCKET.g.position,
    r = Math.random,
    y = R.y - 1.5;
  for (let i = 0; i < Math.ceil(3 * k); i++)
    plume.emit(
      R.x + (r() - 0.5) * 4,
      y,
      R.z + (r() - 0.5) * 4,
      (r() - 0.5) * 5,
      -35 - r() * 25,
      (r() - 0.5) * 5,
      0.45,
      6.5,
      12,
    );
  for (let i = 0; i < Math.ceil(2 * k); i++) {
    if (y < 45) {
      const a = r() * 6.283;
      rsmoke.emit(
        R.x + Math.cos(a) * 6,
        2 + r() * 2,
        R.z + Math.sin(a) * 6,
        Math.cos(a) * (18 + r() * 25),
        1 + r() * 4,
        Math.sin(a) * (18 + r() * 25),
        4.5,
        6,
        10,
      );
    } else
      rsmoke.emit(
        R.x + (r() - 0.5) * 3,
        y - 4,
        R.z + (r() - 0.5) * 3,
        (r() - 0.5) * 3,
        -2,
        (r() - 0.5) * 3,
        6,
        5,
        5,
      );
  }
}
function updateLaunch(dt) {
  const L = LAUNCH,
    R = ROCKET;
  L.t += dt;
  const d = Math.hypot(S.x - LS.mount.x, S.z - LS.mount.z);
  if (L.st === "idle" && L.t >= L.cycle - 10) {
    L.st = "count";
    L.t = 0;
  } else if (L.st === "count") {
    if (L.t > 7.5) emitPlume(0.5);
    if (L.t >= 10) {
      L.st = "up";
      L.t = 0;
      L.v = 0;
      setTimeout(() => audio.launch(d), Math.min(4, d / 343) * 1000);
      if (phase === "play" && d < 650 && (!M || M.done || M.def.id === "deck"))
        maybeShow("launch");
    }
  } else if (L.st === "up") {
    L.v += Math.min(40, 6 + L.t * 3) * dt;
    L.y += L.v * dt;
    R.g.position.y = R.base + L.y;
    R.g.rotation.z = -clamp((L.y - 300) / 2200) * 0.55;
    R.g.position.x = LS.mount.x + Math.max(0, L.y - 300) * 0.12;
    emitPlume(1);
    {
      const dl = Math.min(4, d / 343);
      if (L.t > dl && L.t < dl + 5 && d < 700 && phase === "play")
        shake = Math.max(shake, 0.22 * (1 - d / 700));
    }
    if (L.y > 2600) {
      L.st = "gone";
      L.t = 0;
      R.g.visible = false;
    }
  } else if (L.st === "gone") {
    if (L.t > 14) {
      L.st = "down";
      L.t = 0;
      L.half = false;
      R.g.visible = true;
      R.g.rotation.set(0, 0, 0);
      R.g.position.set(LS.lz.x, 1300, LS.lz.z);
    }
  } else if (L.st === "down") {
    const u = clamp(L.t / 15);
    R.g.position.y = 0.5 + 1300 * (1 - u) * (1 - u);
    if (u > 0.3) emitPlume(0.7);
    if (!L.half && u >= 0.5) {
      L.half = true;
      if (phase === "play" && d < 800 && (!M || M.done || M.def.id === "deck"))
        maybeShow("land");
    }
    if (u >= 1) {
      L.st = "landed";
      L.t = 0;
      if (d < 900) audio.boom();
      if (phase === "play" && d < 900) pop("BOOSTER LANDED", 0);
    }
  } else if (L.st === "landed") {
    if (L.t > 30) resetLaunch(0);
  }
  R.arm.rotation.y +=
    ((L.st === "idle" ? 0 : -1.35) - R.arm.rotation.y) * Math.min(1, dt * 1.5);
  R.beacon.visible = Math.floor(clock * 1.6) % 2 === 0;
  const ui = $("launchUI");
  let txt = "";
  if (phase === "play" && !M && L.st === "idle" && L.cycle - L.t <= 30)
    txt = `LIFTOFF IN ${Math.ceil(L.cycle - L.t)}`;
  if (phase === "play" && (d < 1200 || (M && M.def.id === "deck"))) {
    if (L.st === "count") txt = `LAUNCH · T-${Math.ceil(10 - L.t)}`;
    else if (L.st === "up" && L.t < 6) txt = "LIFTOFF";
    else if (L.st === "down") txt = "BOOSTER LANDING";
  }
  if (ui.textContent !== txt) {
    ui.textContent = txt;
    ui.classList.toggle("on", !!txt);
  }
}

/* ---------------- score: drift, near miss, tokens ---------------- */
const SCORE = {
  total: 0,
  drift: 0,
  idle: 0,
  tokens: new Set(
    (() => {
      try {
        return JSON.parse(store.get("rfc_tokens4") || "[]");
      } catch (e) {
        return [];
      }
    })(),
  ),
};
function pop(a, pts, bad) {
  if (phase !== "play") return;
  const cm = pts > 0 && !bad;
  if (cm && M && !M.done && M.def.id === "daily" && dailyMatch(a)) pts *= 2;
  if (cm) {
    pts = comboAdd(pts);
    S.tank = Math.min(100, S.tank + pts / 100);
  }
  SCORE.total += pts || 0;
  if (
    M &&
    !M.done &&
    (M.def.id === "stuntshow" || M.def.id === "daily") &&
    pts > 0
  )
    M.pts += pts;
  earn((pts || 0) / 5);
  const el = document.createElement("div");
  el.className = "pop" + (bad ? " bad" : "");
  el.innerHTML = `<b>${a}</b>${pts ? `<span>+${pts.toLocaleString("en-US")}</span>` : ""}${cm && COMBO.mult > 1 ? `<em>×${COMBO.mult.toFixed(1).replace(".0", "")}</em>` : ""}`;
  $("pops").prepend(el);
  setTimeout(() => el.remove(), 1900);
  while ($("pops").children.length > 4) $("pops").lastChild.remove();
}
function driftScore(dt) {
  if (phase !== "play") return;
  if (!S.air && S.dr > 0.3 && Math.abs(S.slip) > 0.12 && S.v > 11) {
    SCORE.drift += S.v * Math.abs(S.slip) * dt * 14;
    SCORE.idle = 0;
  } else if (SCORE.drift > 0) {
    SCORE.idle += dt;
    if (SCORE.idle > 0.8 || S.air) {
      const p = Math.round(SCORE.drift);
      SCORE.drift = 0;
      if (p >= 80) {
        pop("DRIFT", p);
        if (M && !M.done && M.def.id === "drift") M.pts += p;
      }
    }
  }
}
const TOKENS = [];
{
  const r = rng(777);
  const tall = BLD.filter(
    (b) =>
      b.style >= 0 &&
      b.style !== 3 &&
      b.h > 18 &&
      b.h < 140 &&
      b.x0 > -HALF &&
      b.x1 < HALF &&
      b.z0 > -HALF &&
      b.z1 < HALF &&
      !PADS.some((p) => p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1),
  );
  for (let i = 0; i < 9; i++) {
    const b = tall[(r() * tall.length) | 0];
    TOKENS.push({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, y: b.h + 2.4 });
  }
  for (let i = 0; i < 5; i++) {
    const l = -HALF + (1 + ((r() * (NBK - 1)) | 0)) * P,
      s =
        -HALF + P * 0.5 + (1 + ((r() * (NBK - 2)) | 0)) * P + (r() - 0.5) * 40,
      onx = r() < 0.5,
      up = r() < 0.4 ? 8 + r() * 16 : 0;
    TOKENS.push({
      x: onx ? s : l + (r() < 0.5 ? -3.2 : 3.2),
      z: onx ? l + (r() < 0.5 ? -3.2 : 3.2) : s,
      y: 1.4 + up,
    });
  }
  for (const k of PARK) {
    const [bi, bj] = k.split(",").map(Number);
    TOKENS.push({
      x: (blockMin(bi) + blockMax(bi)) / 2 + 18,
      z: (blockMin(bj) + blockMax(bj)) / 2 + 18,
      y: 1.8,
    });
  }
  for (let i = 0; i < 2; i++) {
    const bi = [4, 20][i],
      bj = [6, 17][i];
    TOKENS.push({ x: -HALF + bi * P, z: -HALF + bj * P + P / 2, y: 1.4 });
  }
  for (const rp of RAMPS) {
    if (rp.name === "POND JUMP") continue;
    TOKENS.push({
      x: rp.x + rp.fx * (rp.L + 13),
      z: rp.z + rp.fz * (rp.L + 13),
      y: rp.H + 3.4,
    });
  }
  TOKENS.push({ x: WHEEL.x, z: WHEEL.z, y: WHEEL.y + WHEEL.R + 6 });
  const g = new THREE.OctahedronGeometry(0.9, 0);
  g.scale(1, 1.3, 1);
  TOKENS.mesh = new THREE.InstancedMesh(
    g,
    new THREE.MeshStandardMaterial({
      color: 0x000,
      emissive: 0x9a62ff,
      emissiveIntensity: 3.2,
      metalness: 0.8,
      roughness: 0.2,
    }),
    TOKENS.length,
  );
  scene.add(TOKENS.mesh);
}
function updateTokens(t) {
  const M4 = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler(),
    V = new THREE.Vector3(),
    Z = new THREE.Vector3(0, 0, 0),
    One = new THREE.Vector3(1, 1, 1);
  TOKENS.forEach((k, i) => {
    const got = SCORE.tokens.has(i);
    Q.setFromEuler(E.set(0, t * 2 + i, 0));
    M4.compose(
      V.set(k.x, k.y + Math.sin(t * 2.2 + i) * 0.35, k.z),
      Q,
      got ? Z : One,
    );
    TOKENS.mesh.setMatrixAt(i, M4);
    if (
      !got &&
      phase === "play" &&
      Math.hypot(S.x - k.x, S.y + 0.5 - k.y, S.z - k.z) < 3.4
    ) {
      SCORE.tokens.add(i);
      store.set("rfc_tokens4", JSON.stringify([...SCORE.tokens]));
      audio.chime();
      pop(`SKY TOKEN ${SCORE.tokens.size}/${TOKENS.length}`, 500);
      checkUnlocks();
      for (let q = 0; q < 30; q++) {
        const r = Math.random;
        sparks.emit(
          k.x,
          k.y,
          k.z,
          (r() - 0.5) * 10,
          (r() - 0.2) * 8,
          (r() - 0.5) * 10,
          0.8,
          0.25,
          0,
        );
      }
    }
  });
  TOKENS.mesh.instanceMatrix.needsUpdate = true;
}
const mctx = $("mmap").getContext("2d");
const LANDMARKS = [
  { n: "HALO WHEEL", x: WHEEL.x, z: WHEEL.z },
  { n: "STUNT YARD", x: -HALF + 5 * P, z: -HALF + 11 * P },
  {
    n: "DINER",
    x: (DINER.b[0] + DINER.b[1]) / 2,
    z: (DINER.b[2] + DINER.b[3]) / 2,
  },
  { n: "MEGAFAB", x: (FAB.x0 + FAB.x1) / 2, z: (FAB.z0 + FAB.z1) / 2 },
  { n: "LAUNCH", x: LS.mount.x, z: LS.mount.z + 14 },
  { n: "PARK", x: 384, z: -240 },
];
