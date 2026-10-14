// index-inline-1 58 — three
// Lines 96727-96973 of readable/index-inline-1.pretty.js (statement-aligned).
const MODELOCK = {
  raceBtn: { ch: "race", lbl: "STREET RACE" },
  yardBtn: { ch: "ramps", lbl: "STUNT YARD" },
  finalBtn: { ch: "final", lbl: "SHOWDOWN" },
  dailyBtn: { ch: "ramps", lbl: "DAILY RUN" },
};
function modeOpen(key) {
  const L = MODELOCK[key],
    ch = chapterOf(L.ch);
  return ch < 0 || STORY.done >= ch || clearedId(L.ch);
}
function lockPaint() {
  for (const k in MODELOCK) {
    const b = $(k);
    if (!b) continue;
    const open = modeOpen(k),
      ch = chapterOf(MODELOCK[k].ch);
    b.classList.toggle("locked", !open);
    b.innerHTML = open
      ? MODELOCK[k].lbl
      : `<span class="lk"></span>${MODELOCK[k].lbl}<small>CHAPTER ${ch + 1}</small>`;
    b.title = open ? "" : `Unlocks when the story reaches chapter ${ch + 1}`;
  }
  const order = misOrder();
  document.querySelectorAll("#mlist .mis").forEach((el, k) => {
    const i = order[k];
    if (i == null) return;
    const open = misOpen(i);
    el.classList.toggle("locked", !open);
    if (!open) {
      const b = el.querySelector(".b");
      if (b) b.innerHTML = `<span class="lk"></span>${misNeed(i)}`;
    }
  });
}
// block a locked button before its own handler runs
document.addEventListener(
  "click",
  (e) => {
    const b =
      e.target.closest &&
      e.target.closest("#raceBtn,#yardBtn,#finalBtn,#dailyBtn,#mlist .mis");
    if (!b) return;
    if (b.classList.contains("locked")) {
      e.stopImmediatePropagation();
      e.preventDefault();
      b.classList.remove("shake");
      void b.offsetWidth;
      b.classList.add("shake");
      audio.fail && audio.fail();
    }
  },
  true,
);
// progress lost to the old reload bug comes back from what was actually cleared
{
  let nd = 0;
  while (nd < CH.length && MIS[CH[nd].mis] && clearedId(MIS[CH[nd].mis].id))
    nd++;
  if (nd > STORY.done) {
    STORY.done = nd;
    store.set("rfc_story", String(nd));
  }
}
{
  const _r = renderMissionList;
  renderMissionList = function () {
    _r();
    lockPaint();
  };
}
{
  const _h = renderHome;
  renderHome = function () {
    _h();
    lockPaint();
    if (typeof cardSoon === "function") cardSoon();
  };
}
// a locked test can still be played from a friend's challenge code: challenges are open to everyone

/* ---- ORBIT v2: the Roadster flies into the rocket's payload bay, the fairing closes, liftoff, and the fairing opens in space ---- */
const FAIR_Y = 56; // top of the booster body, where the payload bay starts
function fairHalf(side, mat, inner) {
  // one clamshell half, hinged at its base on the outside edge
  const P = new THREE.Group(),
    th0 = side > 0 ? 0 : Math.PI,
    mk = (geo, y) => {
      const o = new THREE.Mesh(geo, mat);
      o.position.set(-side * 4.5, y, 0);
      o.castShadow = true;
      P.add(o);
      const i = new THREE.Mesh(geo, inner);
      i.position.copy(o.position);
      i.scale.setScalar(0.985);
      P.add(i);
    };
  mk(new THREE.CylinderGeometry(4.5, 4.5, 7, 40, 1, true, th0, Math.PI), 3.5);
  mk(new THREE.CylinderGeometry(0.5, 4.5, 12, 40, 1, true, th0, Math.PI), 13);
  P.position.set(side * 4.5, 0, 0);
  return P;
}
const FAIR = (() => {
  const white = new THREE.MeshStandardMaterial({
      color: 0xf4f5f6,
      metalness: 0.25,
      roughness: 0.35,
      side: THREE.FrontSide,
    }),
    inner = new THREE.MeshStandardMaterial({
      color: 0x2a2e35,
      metalness: 0.5,
      roughness: 0.6,
      side: THREE.BackSide,
    });
  const g = new THREE.Group();
  g.position.y = FAIR_Y;
  const R = fairHalf(1, white, inner),
    L = fairHalf(-1, white, inner);
  g.add(R, L);
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(4.3, 4.3, 0.5, 40),
    new THREE.MeshStandardMaterial({
      color: 0x2f343b,
      metalness: 0.7,
      roughness: 0.4,
    }),
  );
  deck.position.y = 0.25;
  g.add(deck);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.08, 8, 60),
    glowMat(0x38d6ff, 3),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.55;
  g.add(ring);
  const locks = [];
  for (const z of [-3.6, 3.6]) {
    const l = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      glowMat(0xff3030, 0),
    );
    l.position.set(0, 4, z);
    g.add(l);
    locks.push(l);
  }
  g.rotation.y = Math.PI / 2;
  g.visible = false;
  ROCKET.g.add(g);
  return { g, R, L, ring, locks };
})();
const NOSE = ROCKET.g.children.filter((o) => o.isMesh && o.position.y >= 60);
function fairOpen(k) {
  FAIR.R.rotation.z = -1.15 * k;
  FAIR.L.rotation.z = 1.15 * k;
}
function orbitMode(on) {
  FAIR.g.visible = on;
  NOSE.forEach((o) => (o.visible = !on));
  if (!on) {
    fairOpen(0);
    car.visible = true;
  }
}
// in space: the fairing halves drift apart and the Roadster floats out over the Earth
{
  const _sb = spaceBuild;
  spaceBuild = function () {
    const sp = _sb();
    if (sp.fr) return sp;
    const white = new THREE.MeshStandardMaterial({
        color: 0xf4f5f6,
        metalness: 0.25,
        roughness: 0.35,
      }),
      inner = new THREE.MeshStandardMaterial({
        color: 0x2a2e35,
        metalness: 0.5,
        roughness: 0.6,
        side: THREE.BackSide,
      });
    const g = new THREE.Group();
    g.position.y = -0.9;
    const R = fairHalf(1, white, inner),
      L = fairHalf(-1, white, inner);
    g.add(R, L);
    const stage = new THREE.Group(),
      body = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 9, 40), white);
    body.position.y = -4.5;
    stage.add(body);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(4.55, 4.55, 1.2, 40),
      new THREE.MeshStandardMaterial({ color: 0x15171a }),
    );
    band.position.y = -0.6;
    stage.add(band);
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 2.2, 2.6, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x2f343b,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    );
    bell.position.y = -10.3;
    stage.add(bell);
    const glow = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 6, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x9fd8ff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.rotation.x = Math.PI;
    glow.position.y = -14.5;
    stage.add(glow);
    g.add(stage);
    sp.sc.add(g);
    sp.rc.visible = true;
    sp.rc.traverse((o) => {
      o.visible = o.visible || o === sp.rc;
    });
    sp.fr = { g, R, L, stage, glow };
    return sp;
  };
}
function spaceSep(sp, u) {
  const F = sp.fr;
  if (!F) return;
  const k = easeIO(clamp((u - 1.2) / 2.4));
  F.R.rotation.z = -1.2 * k;
  F.L.rotation.z = 1.2 * k;
  F.R.position.x = 4.5 + u * u * 0.9 * k;
  F.L.position.x = -4.5 - u * u * 0.9 * k;
  F.R.position.y = F.L.position.y = -u * 0.6 * k;
  const d = Math.max(0, u - 3.8);
  F.stage.position.y = -d * d * 0.8;
  F.glow.material.opacity =
    u > 3.6 && u < 9 ? 0.55 * (0.7 + 0.3 * Math.sin(u * 30)) : 0;
  F.R.visible = F.L.visible = u < 16;
  F.stage.visible = u < 20;
}
