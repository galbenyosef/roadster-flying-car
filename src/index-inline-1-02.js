// index-inline-1 02 — math
// Lines 78930-79257 of readable/index-inline-1.pretty.js (statement-aligned).
{
  const r = rng(2026);
  for (let bi = 0; bi < BLOCK_COUNT; bi++)
    for (let bj = 0; bj < BLOCK_COUNT; bj++) {
      const x0 = blockMin(bi) + 3,
        x1 = blockMax(bi) - 3,
        z0 = blockMin(bj) + 3,
        z1 = blockMax(bj) - 3,
        cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2;
      const sp = SPECIAL[bi + "," + bj];
      const dist = district(bi, bj);
      if (dist === "strip")
        for (let z = blockMin(bj) + 7; z < blockMax(bj) - 5; z += 13)
          PALMS.push([bi === 11 ? blockMax(bi) - 2.1 : blockMin(bi) + 2.1, z]);
      if (sp && sp.plaza) {
        PADS.push({
          label: "BOX",
          name: "BOX",
          x: cx,
          z: cz,
          y: 0.2,
          r: 8,
          box: true,
          color: 0xffb35c,
        });
        continue;
      }
      if (sp && sp.pad) {
        addB(x0 + 4, x1 - 4, z0 + 4, z1 - 4, sp.h, 1);
        const col = { A: 0x28e0ff, B: 0x5be3a0, C: 0xff2bd6 }[sp.pad];
        PADS.push({
          label: sp.pad,
          name: "PAD " + sp.pad,
          x: cx,
          z: cz,
          y: sp.h,
          r: 10,
          color: col,
        });
        continue;
      }
      if (sp && sp.diner) {
        DINER = { x0, x1, z0, z1, b: [x0 + 5, x0 + 43, z0 + 6, z0 + 22] };
        addB(x0 + 5, x0 + 43, z0 + 6, z0 + 22, 7.5, -1);
        continue;
      }
      if (sp && sp.fab) {
        MEGAFAB = { x0, x1, z0, z1, h: 32 };
        addB(x0, x1, z0, z1, 32, 6);
        continue;
      }
      if (sp && sp.wheel) {
        WHEEL = { x: cx, z: cz, y: 50, R: 40, rot: 0 };
        addB(cx - 15, cx + 15, cz - 7, cz + 7, 6, -1);
        continue;
      }
      if (dist === "launch" || dist === "stunt") continue;
      if (dist === "park") {
        if (bi === 15 && bj === 9) PONDS.push([cx, cz, 24, 15]);
        for (let i = 0; i < 34; i++) {
          const x = lerp(x0, x1, r()),
            z = lerp(z0, z1, r());
          if (
            PONDS.some(
              ([px, pz, a, b]) =>
                ((x - px) / (a + 3)) ** 2 + ((z - pz) / (b + 3)) ** 2 < 1,
            )
          )
            continue;
          TREES.push([x, z, 0.8 + r() * 0.8]);
        }
        continue;
      }
      if (dist === "strip") {
        const face = bi === 11 ? 1 : -1;
        const lots =
          r() < 0.5
            ? [[z0, z1]]
            : (() => {
                const m = lerp(z0, z1, 0.42 + r() * 0.16);
                return [
                  [z0, m - 2],
                  [m + 2, z1],
                ];
              })();
        for (const [c, e] of lots) {
          const ph = Math.round(15 + r() * 10);
          addB(x0, x1, c, e, ph, 4);
          const tw = (x1 - x0) * (0.42 + r() * 0.18),
            td = (e - c) * (0.5 + r() * 0.25),
            tx = face > 0 ? x0 + tw / 2 + 3 : x1 - tw / 2 - 3,
            tz = (c + e) / 2 + (r() - 0.5) * (e - c - td) * 0.6;
          addB(
            tx - tw / 2,
            tx + tw / 2,
            tz - td / 2,
            tz + td / 2,
            Math.round(ph + 70 + Math.pow(r(), 1.2) * 170),
            r() < 0.55 ? 4 : 1,
          );
          if (e - c > 26)
            BOARDS.push({
              x: face > 0 ? x1 + 0.2 : x0 - 0.2,
              z: (c + e) / 2,
              y: ph * 0.55,
              rot: face > 0 ? Math.PI / 2 : -Math.PI / 2,
              w: Math.min(24, (e - c) * 0.72),
              h: Math.min(9, ph * 0.6),
              k: (bi * 7 + bj) % 3,
            });
        }
        continue;
      }
      if (dist === "residential") {
        const n = 3,
          cw = (x1 - x0) / n,
          cd = (z1 - z0) / n;
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const lx = x0 + cw * i,
              lz = z0 + cd * j;
            const tr = r();
            if (!isTouch || tr < 0.4)
              TREES.push([
                lx + 2.5 + r() * 3,
                lz + 2.5 + r() * 3,
                0.55 + r() * 0.45,
              ]);
            if (r() < 0.12) {
              TREES.push([lx + cw / 2, lz + cd / 2, 0.8 + r() * 0.4]);
              continue;
            }
            const w = cw * (0.5 + r() * 0.22),
              d = cd * (0.5 + r() * 0.22),
              hx = lx + cw / 2 + (r() - 0.5) * (cw - w) * 0.5,
              hz = lz + cd / 2 + (r() - 0.5) * (cd - d) * 0.5;
            addB(
              hx - w / 2,
              hx + w / 2,
              hz - d / 2,
              hz + d / 2,
              Math.round(6 + r() * 6),
              3,
            );
          }
        continue;
      }
      if (dist === "industrial") {
        const m = lerp(z0, z1, 0.5);
        addB(x0, x1, z0, m - 9, Math.round(10 + r() * 6), 5);
        if (r() < 0.7)
          addB(
            x0,
            x0 + (x1 - x0) * (0.5 + r() * 0.2),
            m + 9,
            z1,
            Math.round(9 + r() * 5),
            5,
          );
        for (let s = 0; s < 7; s++) {
          const cxx = lerp(x1 - 8, x1 - 3, r()) - s * 0,
            czz = m + 9 + s * 3.1;
          if (czz > z1 - 3) break;
          const st = 1 + ((r() * 3) | 0);
          const bx = x1 - 10 + r() * 4;
          addB(bx - 3, bx + 3, czz - 1.25, czz + 1.25, st * 2.6, -1);
          for (let q = 0; q < st; q++)
            CONT.push([bx, czz, q * 2.6 + 1.3, (r() * 5) | 0]);
        }
        continue;
      }
      // downtown core
      const d = Math.hypot(cx, cz);
      const core = Math.max(0, 1 - d / 440);
      if (r() < 0.06 && d > 260) continue; // parking lot
      const pat = r();
      const lots = [];
      const g = 3;
      if (pat < 0.3) lots.push([x0, x1, z0, z1]);
      else if (pat < 0.55) {
        const m = lerp(x0, x1, 0.35 + r() * 0.3);
        lots.push([x0, m - g / 2, z0, z1], [m + g / 2, x1, z0, z1]);
      } else if (pat < 0.8) {
        const m = lerp(z0, z1, 0.35 + r() * 0.3);
        lots.push([x0, x1, z0, m - g / 2], [x0, x1, m + g / 2, z1]);
      } else {
        const mx = lerp(x0, x1, 0.4 + r() * 0.2),
          mz = lerp(z0, z1, 0.4 + r() * 0.2);
        lots.push(
          [x0, mx - g / 2, z0, mz - g / 2],
          [mx + g / 2, x1, z0, mz - g / 2],
          [x0, mx - g / 2, mz + g / 2, z1],
          [mx + g / 2, x1, mz + g / 2, z1],
        );
      }
      for (const [a, b, c, e] of lots) {
        const h = Math.round(
          12 + r() * 26 + core * core * (40 + Math.pow(r(), 1.3) * 190),
        );
        const ins = r() < 0.4 ? r() * 5 : 0;
        addB(a + ins, b - ins, c + ins, e - ins, h, (r() * 3) | 0);
        if (h > 70 && r() < 0.5) {
          const w = (b - a) * 0.55,
            dd = (e - c) * 0.55,
            mx = (a + b) / 2,
            mz = (c + e) / 2;
          addB(
            mx - w / 2,
            mx + w / 2,
            mz - dd / 2,
            mz + dd / 2,
            h + Math.round(20 + r() * 50),
            (r() * 3) | 0,
          );
        }
      }
    }
}
// skyline ring outside the playable grid
{
  const r = rng(404);
  const RING = isTouch ? 1 : 2;
  for (let bi = -RING; bi < BLOCK_COUNT + RING; bi++)
    for (let bj = -RING; bj < BLOCK_COUNT + RING; bj++) {
      if (bi >= 0 && bj >= 0 && bi < BLOCK_COUNT && bj < BLOCK_COUNT) continue;
      const x0 = blockMin(bi) + 3,
        x1 = blockMax(bi) - 3,
        z0 = blockMin(bj) + 3,
        z1 = blockMax(bj) - 3;
      const ring = Math.max(-bi, -bj, bi - BLOCK_COUNT + 1, bj - BLOCK_COUNT + 1);
      const h = Math.round(
        18 + r() * (ring === 1 ? 60 : ring === 2 ? 100 : 150),
      );
      if (r() < 0.5) {
        addB(x0, x1, z0, z1, h, (r() * 3) | 0);
      } else {
        const m = lerp(x0, x1, 0.5);
        addB(x0, m - 1.5, z0, z1, h, (r() * 3) | 0);
        addB(
          m + 1.5,
          x1,
          z0,
          z1,
          Math.round(h * (0.5 + r() * 0.8)),
          (r() * 3) | 0,
        );
      }
    }
}
// facade textures: 0 stone office, 1 glass, 2 concrete, 3 house, 4 casino gold, 5 warehouse
const CITYMATS = [];
function winTex(seed, base, g0, g1, lit, dens = 1, panels = false) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const x = c.getContext("2d");
  const ec = document.createElement("canvas");
  ec.width = 512;
  ec.height = 1024;
  const e = ec.getContext("2d");
  e.fillStyle = "#000";
  e.fillRect(0, 0, 512, 1024);
  const er = rng(seed * 7 + 3);
  x.fillStyle = base;
  x.fillRect(0, 0, 512, 1024);
  const r = rng(seed);
  for (let i = 0; i < 5000; i++) {
    x.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    x.fillRect(r() * 512, r() * 1024, 2, 2);
  }
  if (panels)
    for (let y = 0; y < 1024; y += 6) {
      x.fillStyle = "rgba(0,0,0,.09)";
      x.fillRect(0, y, 512, 2);
    }
  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 32; col++) {
      if (r() > dens) continue;
      const X = col * 16,
        Y = row * 32;
      const g = x.createLinearGradient(0, Y + 5, 0, Y + 27);
      g.addColorStop(0, g1);
      g.addColorStop(1, g0);
      x.fillStyle = g;
      x.fillRect(X + 2, Y + 5, 12, 22);
      {
        const q = er();
        if (q < 0.4) {
          e.globalAlpha = 0.5 + er() * 0.5;
          e.fillStyle = q < 0.05 ? "#bfe3ff" : q < 0.27 ? "#ffd59a" : "#ffb766";
          e.fillRect(X + 2, Y + 5, 12, 22);
          e.globalAlpha = 1;
        }
      }
      const k = r();
      if (k < lit) {
        x.fillStyle = "rgba(255,236,200,.35)";
        x.fillRect(X + 2, Y + 5, 12, 22);
      } else if (k > 0.9) {
        x.fillStyle = "rgba(20,24,30,.45)";
        x.fillRect(X + 2, Y + 5, 12, 22);
      }
      x.fillStyle = "rgba(255,255,255,.18)";
      x.fillRect(X + 2, Y + 5, 12, 2);
    }
    if (!panels) {
      x.fillStyle = "rgba(0,0,0,.12)";
      x.fillRect(0, row * 32, 512, 3);
      x.fillStyle = "rgba(255,255,255,.1)";
      x.fillRect(0, row * 32 + 3, 512, 1);
    }
  }
  if (!panels)
    for (let col = 0; col < 32; col += 4) {
      x.fillStyle = "rgba(0,0,0,.14)";
      x.fillRect(col * 16, 0, 2, 1024);
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const et = new THREE.CanvasTexture(ec);
  et.wrapS = et.wrapT = THREE.RepeatWrapping;
  et.colorSpace = THREE.SRGBColorSpace;
  t.userData.em = et;
  return t;
}
