// index-inline-1 31 — lerp
// Lines 88199-88539 of readable/index-inline-1.pretty.js (statement-aligned).
function cutTick(dt) {
  cut.t += dt;
  const D = cut.def,
    t = cut.t;
  D.cues.forEach((c, i) => {
    if (!cut.fired.has(i) && t >= c[0]) {
      cut.fired.add(i);
      c[1]();
    }
  });
  if (t >= D.dur) {
    endCut();
    return;
  }
  const cam = D.cam(t, dt);
  camera.position.copy(cam.p);
  camera.lookAt(cam.tg);
  camera.fov = cam.fov || 45;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
$("cutSkip").addEventListener("click", () => {
  if (cut) endCut();
  else if (cin.on && cin.freeze) cin.t = cin.dur;
});
// opening: Zero walks out of the diner, gets in, and the Roadster pulls out
const DN = DINER.b,
  DOOR = new THREE.Vector3((DN[0] + DN[1]) / 2, 0.2, DN[3] + 1.4),
  CARP = new THREE.Vector3(DN[0] + 14, 0, DN[3] + 15);
const OPENING = {
  dur: 11.8,
  setup() {
    applyVehicle(VSEL().fly ? VSEL() : VEH[0]);
    place(CARP.x, CARP.z, Math.PI / 2);
    S.v = 0;
    ZERO.visible = true;
    ZERO.scale.setScalar(1);
    ZERO.position.copy(DOOR);
    ZERO.rotation.y = 0;
  },
  path: [
    [DOOR.x, DOOR.z],
    [DOOR.x - 4, DOOR.z + 6],
    [CARP.x - 1.2, CARP.z + 2.2],
  ],
  cues: [
    [0.3, () => showSub("", "LAS VEGAS · 7:42 AM", 2.8)],
    [
      3.4,
      () =>
        showSub(
          "MAE · SKYLINE DINER",
          "Zero! She's charged and she's yours. Win the Strip, and the payload seat on Skyline One is yours too.",
          4.4,
        ),
    ],
    [8.2, () => showSub("ZERO", "( thumbs up )", 1.8)],
    [
      9.4,
      () => {
        audio.noise(420, 140, 0.14, 0.3, "lowpass");
      },
    ],
  ],
  zeroAt(t) {
    const P = this.path;
    if (t < 3.4) return { p: P[0], walk: 0, yaw: 0 };
    const u = clamp((t - 3.4) / 4.6),
      L1 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]),
      L2 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]),
      s = u * (L1 + L2);
    if (s < L1) {
      const k = s / L1;
      return {
        p: [lerp(P[0][0], P[1][0], k), lerp(P[0][1], P[1][1], k)],
        walk: u < 1 ? 1 : 0,
        yaw: Math.atan2(P[1][0] - P[0][0], P[1][1] - P[0][1]),
      };
    }
    const k = (s - L1) / L2;
    return {
      p: [lerp(P[1][0], P[2][0], k), lerp(P[1][1], P[2][1], k)],
      walk: u < 1 ? 1 : 0,
      yaw: Math.atan2(P[2][0] - P[1][0], P[2][1] - P[1][1]),
    };
  },
  cam(t, dt) {
    const z = this.zeroAt(t);
    ZERO.position.set(z.p[0], 0.2, z.p[1]);
    ZERO.rotation.y = z.yaw;
    animZero(ZERO, t * 7, z.walk);
    if (t > 8.6) ZERO.scale.setScalar(Math.max(0.001, 1 - (t - 8.6) / 0.6));
    if (t > 9.2) ZERO.visible = false;
    const V = (a, b, c) => new THREE.Vector3(a, b, c);
    if (t < 3.2) {
      const e = easeIO(t / 3.2);
      return {
        p: V(
          lerp(CARP.x - 70, CARP.x - 52, e),
          lerp(20, 14, e),
          lerp(CARP.z + 80, CARP.z + 60, e),
        ),
        tg: V(DOOR.x + 6, 5, DOOR.z),
        fov: 48,
      };
    }
    if (t < 8) {
      const e = easeIO((t - 3.2) / 4.8);
      return {
        p: V(
          DOOR.x + lerp(9, 6, e),
          lerp(2.4, 1.9, e),
          DOOR.z + lerp(12, 10, e),
        ),
        tg: V(ZERO.position.x, 1.3, ZERO.position.z),
        fov: 40,
      };
    }
    if (t < 10.6) {
      const e = easeIO((t - 8) / 2.6);
      return {
        p: V(
          CARP.x + lerp(-7, -6, e),
          lerp(1.1, 1.4, e),
          CARP.z + lerp(6, 4, e),
        ),
        tg: V(CARP.x, 0.7, CARP.z),
        fov: 38,
      };
    }
    const e = easeIO(clamp((t - 10.6) / 1.2)),
      a = lerp(Math.atan2(4, -6), 0, e),
      rr = lerp(7.2, 5.3, e);
    return {
      p: V(
        CARP.x + Math.cos(a) * rr,
        lerp(1.4, 1.55, e),
        CARP.z + Math.sin(a) * rr,
      ),
      tg: V(CARP.x - lerp(0, 6, e), lerp(0.7, 0.75, e), CARP.z),
      fov: lerp(38, 58, e),
    };
  },
};

/* ---------------- street race: rounded circuit, gates, three rivals ---------------- */
// paths: rounded rectangles through the street grid. Each corner: [x, z, incoming dir, outgoing dir]
function mkPath(C, r = 14) {
  const pts = [];
  const arc = (c) => {
    const [cx, cz, a, b] = c,
      S0 = [cx - a[0] * r, cz - a[1] * r],
      O = [S0[0] + b[0] * r, S0[1] + b[1] * r],
      v0 = [S0[0] - O[0], S0[1] - O[1]],
      v1 = [a[0] * r, a[1] * r];
    for (let k = 0; k <= 8; k++) {
      const q = ((k / 8) * Math.PI) / 2;
      pts.push([
        O[0] + v0[0] * Math.cos(q) + v1[0] * Math.sin(q),
        O[1] + v0[1] * Math.cos(q) + v1[1] * Math.sin(q),
      ]);
    }
  };
  const line = (a, b) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]),
      n = Math.ceil(d / 4);
    for (let k = 1; k < n; k++)
      pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  };
  const L = C[C.length - 1];
  pts.push([L[0] + L[3][0] * r, L[1] + L[3][1] * r]);
  for (const c of C) {
    const st = [c[0] - c[2][0] * r, c[1] - c[2][1] * r];
    line(pts[pts.length - 1], st);
    arc(c);
  }
  pts.pop();
  let s = 0;
  const cum = pts.map((p, i) => {
    if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    return s;
  });
  const len =
    s +
    Math.hypot(
      pts[0][0] - pts[pts.length - 1][0],
      pts[0][1] - pts[pts.length - 1][1],
    );
  const corners = C.map((c) => {
    let best = 0,
      bd = 1e9;
    pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return cum[best];
  });
  const turns = C.map((c, i) => ({
    s: corners[i],
    dir: c[2][0] * c[3][1] - c[2][1] * c[3][0] > 0 ? "RIGHT" : "LEFT",
    c,
  }));
  return { pts, cum, len, corners, turns };
}
function pathAtP(Pa, s) {
  const L = Pa.len,
    Pp = Pa.pts,
    C = Pa.cum;
  s = ((s % L) + L) % L;
  let lo = 0,
    hi = Pp.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (C[m] <= s) lo = m;
    else hi = m - 1;
  }
  const a = Pp[lo],
    b = Pp[(lo + 1) % Pp.length],
    seg = (lo + 1 < Pp.length ? C[lo + 1] : L) - C[lo],
    u = seg > 0 ? (s - C[lo]) / seg : 0;
  const tx = b[0] - a[0],
    tz = b[1] - a[1],
    tl = Math.hypot(tx, tz) || 1;
  return {
    x: lerp(a[0], b[0], u),
    z: lerp(a[1], b[1], u),
    tx: tx / tl,
    tz: tz / tl,
  };
}
function projSP(Pa, x, z, s0) {
  let best = s0,
    bd = 1e18;
  for (let d = -60; d <= 60; d += 2) {
    const p = pathAtP(Pa, s0 + d),
      dd = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (dd < bd) {
      bd = dd;
      best = s0 + d;
    }
  }
  return ((best % Pa.len) + Pa.len) % Pa.len;
}
function nearestS(Pa, x, z) {
  let best = 0,
    bd = 1e18;
  for (let s = 0; s < Pa.len; s += 6) {
    const p = pathAtP(Pa, s),
      dd = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (dd < bd) {
      bd = dd;
      best = s;
    }
  }
  return projSP(Pa, x, z, best);
}
// chevron boards across the road just past every corner, pointing the way
const CHEV = (() => {
  const mk = (dir) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const x = c.getContext("2d");
    x.fillStyle = "#0d0e10";
    x.fillRect(0, 0, 512, 96);
    x.fillStyle = "#ffb020";
    for (let i = 0; i < 6; i++) {
      const cx = 48 + i * 84;
      x.beginPath();
      if (dir > 0) {
        x.moveTo(cx - 22, 10);
        x.lineTo(cx + 2, 10);
        x.lineTo(cx + 30, 48);
        x.lineTo(cx + 2, 86);
        x.lineTo(cx - 22, 86);
        x.lineTo(cx + 6, 48);
      } else {
        x.moveTo(cx + 22, 10);
        x.lineTo(cx - 2, 10);
        x.lineTo(cx - 30, 48);
        x.lineTo(cx - 2, 86);
        x.lineTo(cx + 22, 86);
        x.lineTo(cx - 6, 48);
      }
      x.closePath();
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return new THREE.MeshBasicMaterial({
      map: t,
      color: new THREE.Color(1.35, 1.35, 1.35),
    });
  };
  return {
    R: mk(1),
    L: mk(-1),
    back: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.6 }),
    post: new THREE.MeshStandardMaterial({
      color: 0x2a2e34,
      metalness: 0.6,
      roughness: 0.4,
    }),
  };
})();
function chevrons(Pa, group) {
  for (const t of Pa.turns) {
    const [cx, cz, a] = t.c;
    const lx = Math.round((cx + HALF) / P) * P - HALF,
      lz = Math.round((cz + HALF) / P) * P - HALF;
    const g = new THREE.Group();
    g.position.set(lx + a[0] * 12.5, 0, lz + a[1] * 12.5);
    g.rotation.y = Math.atan2(-a[0], -a[1]);
    const bd = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 2.6),
      t.dir === "RIGHT" ? CHEV.R : CHEV.L,
    );
    bd.position.y = 2.3;
    g.add(bd);
    const bk = new THREE.Mesh(
      new THREE.BoxGeometry(14.3, 2.9, 0.16),
      CHEV.back,
    );
    bk.position.set(0, 2.3, -0.1);
    g.add(bk);
    for (const sx of [-6.4, 6.4]) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.2, 0.22),
        CHEV.post,
      );
      p.position.set(sx, 0.6, -0.1);
      g.add(p);
    }
    group.add(g);
  }
}
// a loop through grid intersections (in driving order) -> lane-offset corners for mkPath (right-hand traffic)
