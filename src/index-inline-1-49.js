// index-inline-1 49 — math
// Lines 93896-94243 of readable/index-inline-1.pretty.js (statement-aligned).
function routeFilm(k, onEnd) {
  const C = CHAPTERS[k],
    id = MISSIONS[C.mis].id,
    V = (a, b, c) => new THREE.Vector3(a, b, c);
  let T = filmTargets(id).filter((q) => Math.hypot(q.x - carState.x, q.z - carState.z) > 20);
  const car = V(carState.x, carState.y, carState.z),
    per = T.length > 4 ? 1.9 : 2.4,
    t0 = 2.8,
    dur = t0 + T.length * per + 1.6;
  const anchors = [];
  let prev = car;
  T.forEach((q) => {
    const tg = V(q.x, (q.y || 0) + 1.5, q.z);
    let dx = tg.x - prev.x,
      dz = tg.z - prev.z;
    const dl = Math.hypot(dx, dz) || 1;
    dx /= dl;
    dz /= dl;
    const lo = (q.y || 0) < 5;
    anchors.push({
      tg,
      p: V(
        tg.x - dx * (lo ? 12 : 26) - dz * (lo ? 4 : 12),
        tg.y + (lo ? 34 : 13),
        tg.z - dz * (lo ? 12 : 26) + dx * (lo ? 4 : 12),
      ),
      l: q.l,
    });
    prev = tg;
  });
  const yaw = carState.yaw,
    back = V(carState.x + Math.sin(yaw) * 6, carState.y + 1.9, carState.z + Math.cos(yaw) * 6),
    ahead = V(carState.x - Math.sin(yaw) * 6, carState.y + 0.8, carState.z - Math.cos(yaw) * 6);
  const cues = [
    [0.15, () => chapterCard(k, null)],
    [1.2, () => showSub(C.who, C.intro, Math.min(7, dur - 1.5))],
  ];
  anchors.forEach((a, i) =>
    cues.push([
      t0 + i * per + 0.9,
      () => {
        flash(
          `${i + 1} · ${a.l}`,
          i === anchors.length - 1
            ? T.length > 1
              ? "the finish"
              : "your target"
            : "then",
          1.4,
        );
        audio.ping();
      },
    ]),
  );
  cues.push([
    dur - 1.4,
    () => {
      flashT = 0;
      byId("msgbig").textContent = "";
      byId("msgsmall").textContent = "";
    },
  ]);
  const def = {
    dur,
    cues,
    setup() {},
    cam(t) {
      if (t < t0 || (!anchors.length && t < dur - 1.6)) {
        const a = yaw + Math.PI * 0.15 + t * 0.32,
          e = easeIO(clamp(t / t0));
        return {
          p: V(
            car.x + Math.sin(a) * lerp(5.2, 7.5, e),
            car.y + lerp(0.6, 2.6, e),
            car.z + Math.cos(a) * lerp(5.2, 7.5, e),
          ),
          tg: V(car.x, car.y + 0.6, car.z),
          fov: lerp(34, 44, e),
        };
      }
      const n = anchors.length;
      let i = Math.floor((t - t0) / per);
      if (i >= n) {
        const e = easeIO(clamp((t - (t0 + n * per)) / 1.6)),
          A = anchors[n - 1],
          p = A.p.clone().lerp(back, e);
        p.y += Math.sin(e * Math.PI) * Math.min(70, A.p.distanceTo(back) * 0.3);
        return { p, tg: A.tg.clone().lerp(ahead, e), fov: lerp(48, 58, e) };
      }
      const u = (t - t0 - i * per) / per,
        e = easeIO(clamp(u / 0.55)),
        A = anchors[i],
        P0 = i
          ? anchors[i - 1].p
          : V(
              car.x + Math.sin(yaw) * 7,
              car.y + 2.6,
              car.z + Math.cos(yaw) * 7,
            ),
        L0 = i ? anchors[i - 1].tg : V(car.x, car.y + 0.6, car.z);
      // fly to the next target, then drift round it
      const orb = (u - 0.55) * 0.35,
        p = P0.clone().lerp(A.p, e);
      p.y += Math.sin(e * Math.PI) * Math.min(60, P0.distanceTo(A.p) * 0.25);
      if (u > 0.55) {
        const dx = p.x - A.tg.x,
          dz = p.z - A.tg.z,
          c = Math.cos(orb),
          s = Math.sin(orb);
        p.x = A.tg.x + dx * c - dz * s;
        p.z = A.tg.z + dx * s + dz * c;
      }
      return { p, tg: L0.clone().lerp(A.tg, e), fov: 48 };
    },
  };
  startCut(def, onEnd);
}

/* ---- Rogue Drone: its own opening film ---- */
const DRONE_FILM = {
  dur: 11,
  setup() {
    droneReset();
    DRONE.g.visible = true;
    DRONE.g.position.set(DRN_ROOF[0], DRN_ROOF[1] + 0.6, DRN_ROOF[2]);
    DRONE.g.rotation.set(0, 0, 0);
  },
  cues: [
    [
      0.3,
      () =>
        showSub(
          "MAE · SKYLINE DINER",
          "Meet the new delivery drone. Six pies for Launch Control. What could possibly go wrong?",
          3.6,
        ),
    ],
    [
      3.9,
      () => {
        audio.fail();
        flash("SIGNAL LOST", "DRONE 01 · AUTOPILOT ERROR", 2);
      },
    ],
    [6.4, () => showSub("MAE", "Zero! My pies! Get after it!", 3)],
    [
      9.3,
      () => {
        flashT = 0;
        byId("msgbig").textContent = "";
        byId("msgsmall").textContent = "";
      },
    ],
  ],
  cam(t) {
    const V = (a, b, c) => new THREE.Vector3(a, b, c),
      R = DRN_ROOF,
      g = DRONE.g,
      s0 = drnAt(0);
    let red = t > 3.9;
    if (t < 3.2) {
      g.position.set(R[0], R[1] + 0.6 + Math.max(0, t - 2) * 1.2, R[2]);
    } else if (t < 6.4) {
      const u = (t - 3.2) / 3.2;
      g.position.set(
        R[0] + Math.sin(t * 9) * 0.25 * (t > 3.9 ? 1 : 0),
        R[1] + 2 + u * 10,
        R[2] + Math.cos(t * 7) * 0.2 * (t > 3.9 ? 1 : 0),
      );
      g.rotation.z = t > 3.9 ? Math.sin(t * 6) * 0.25 : 0;
    } else {
      const u = easeIO(clamp((t - 6.4) / 3)),
        a = V(R[0], R[1] + 12, R[2]);
      g.position.copy(a.lerp(s0, u));
      g.rotation.z = Math.sin(t * 4) * 0.15;
    }
    drnSpin(t, red);
    if (t < 3.2) {
      const a = t * 0.25 + 0.6;
      return {
        p: V(R[0] + Math.sin(a) * 9, R[1] + 3.2, R[2] + Math.cos(a) * 9),
        tg: V(R[0], R[1] + 1, R[2]),
        fov: 38,
      };
    }
    if (t < 6.4) {
      const u = easeIO((t - 3.2) / 3.2);
      return {
        p: V(R[0] + 6, R[1] - 4.5, R[2] + 11),
        tg: g.position.clone(),
        fov: lerp(40, 30, u),
      };
    }
    if (t < 9.4) {
      const u = easeIO((t - 6.4) / 3);
      return {
        p: V(R[0] + 6, R[1] + lerp(-4.5, 10, u), R[2] + lerp(11, 24, u)),
        tg: g.position.clone(),
        fov: lerp(30, 44, u),
      };
    }
    const u = easeIO(clamp((t - 9.4) / 1.6)),
      yaw = carState.yaw;
    return {
      p: V(
        carState.x + Math.sin(yaw) * lerp(18, 6, u),
        carState.y + lerp(9, 1.9, u),
        carState.z + Math.cos(yaw) * lerp(18, 6, u),
      ),
      tg: V(carState.x - Math.sin(yaw) * 6, carState.y + 0.8, carState.z - Math.cos(yaw) * 6),
      fov: lerp(48, 58, u),
    };
  },
};
function storyFilm(k) {
  const C = CHAPTERS[k],
    go = () => {
      begin();
      byId("mission").hidden = false;
      phase = "play";
      if (currentMission) {
        currentMission.t0 = clock;
        if (currentMission.def.race) currentMission.gt = 0;
      }
      snapCam();
    };
  if (MISSIONS[C.mis].id === "drone") {
    startCut(DRONE_FILM, () => {
      go();
      DRONE.g.position.copy(drnAt(0));
    });
    return;
  }
  routeFilm(k, go);
}

/* ---- story: act 1 rebuilt without the plain hover and drift tests ---- */
{
  const at = (x, z) => [x, z];
  CHAPTERS[1] = {
    t: "ROGUE DRONE",
    mis: missionIndex("drone"),
    act: 0,
    who: "MAE",
    intro:
      "My drone! It's got six pies and no brain. Catch it before it reaches the desert.",
    outro:
      "You flew that like you were born up there. Launch Control just called. They want you.",
    at: at(CAR_START.x - 12, CAR_START.z - 6),
  };
  CHAPTERS[3] = Object.assign({}, CHAPTERS[3], {
    t: "SPECIAL DELIVERY",
    mis: missionIndex("courier"),
    act: 0,
    who: "MAE",
    intro:
      "Three hot orders, all over town. Stop inside each glowing zone. Fly if you like. Two minutes.",
    outro:
      "Five stars, sugar. Oh, and the Chrome Kings heard about you. They want a race.",
    at: at(DINER.x0 - 4.8, (DINER.z0 + DINER.z1) / 2 + 24),
  });
}
["hover", "drift"].forEach((id) => {
  const m = MISSIONS.find((q) => q.id === id);
  if (m) m.hidden = true;
});

/* ================= V26: every mission rebuilt around its own idea, harder as you go ================= */
var MISSION_REBUILD = {
  T: {},
  noRegen: false,
  noServ: false,
  props: [],
  lastTrick: null,
  hs0: null,
};
const vec3 = (a, b, c) => new THREE.Vector3(a, b, c);

/* ---- slow-motion showcases: at most twice per session each, then only by chance ---- */
var SESS = { hover: 0, boost: 0, jump: 0, mini: -99 };
function sessOK(kind) {
  const cap = { hover: 2, boost: 2, jump: 3 }[kind];
  if (cap == null) return true;
  const n = SESS[kind];
  if (n >= cap) return false;
  if (n > 0 && Math.random() > 0.45) return false;
  SESS[kind]++;
  return true;
}
function sessMini() {
  const now = performance.now() / 1000;
  if (now - SESS.mini < 25) return false;
  SESS.mini = now;
  return true;
}

/* ---- trick log: every scored trick, with its type and what it was worth after the chain ---- */
function trickType(a) {
  return /AIR/.test(a)
    ? "AIR"
    : /SPIN|REVERSE/.test(a)
      ? "SPIN"
      : /DRIFT/.test(a) && !/LOST/.test(a)
        ? "DRIFT"
        : /NEAR/.test(a)
          ? "NEAR"
          : /LOOP/.test(a)
            ? "LOOP"
            : null;
}
{
  const _pop = pop;
  pop = function (a, pts, bad) {
    const before = currentMission && currentMission.pts != null ? currentMission.pts : 0;
    const r = _pop(a, pts, bad);
    const ty = trickType(a);
    if (ty && pts > 0 && !bad && phase === "play") {
      MISSION_REBUILD.lastTrick = {
        a,
        ty,
        t: clock,
        pts,
        got: currentMission && currentMission.pts != null ? currentMission.pts - before : pts,
      };
      if (currentMission && !currentMission.done && MISSION_REBUILD.onTrick) MISSION_REBUILD.onTrick(MISSION_REBUILD.lastTrick);
    }
    return r;
  };
}

/* ---- one meter under the mission line: pies, comfort, cell heat, tether, ring clock ---- */
function meter(label, v, txt, bad) {
  const el = byId("mMeter");
  if (!el) return;
  if (label == null) {
    if (!el.hidden) el.hidden = true;
    return;
  }
  if (el.hidden) el.hidden = false;
  setT("mmL", label);
  setT("mmV", txt != null ? txt : `${Math.round(v)}%`);
  const u = byId("mmU");
  u.style.transform = `scaleX(${clamp(v / 100).toFixed(3)})`;
  el.classList.toggle("bad", !!bad);
  el.classList.toggle("warn", !bad && v < 35);
}

/* ---- props: small meshes that live only inside one mission ---- */
