// index-inline-1 30 — three
// Lines 87858-88198 of readable/index-inline-1.pretty.js (statement-aligned).
function introTick(dt) {
  const t0 = introT;
  introT += dt;
  const t = introT;
  if (t >= ICUT[ICUT.length - 1]) {
    endIntro();
    return;
  }
  let s = 0;
  while (t >= ICUT[s + 1]) s++;
  if (s !== introShot) {
    introShot = s;
    icut(s === 0);
    $("ilines").classList.toggle("on", s === 1 || s === 2);
    if (s === 5) {
      $("itext").classList.remove("slam");
      $("itext").innerHTML = "";
      $("ihero").classList.add("on");
    }
  }
  ITXT.forEach(([at, a, b]) => {
    if (t0 < at && t >= at) itext(a, b);
  });
  ISND.forEach(([at, fn]) => {
    if (t0 < at && t >= at) audio[fn]();
  });
  const u = (t - ICUT[s]) / (ICUT[s + 1] - ICUT[s]),
    e = easeIO(u);
  let hy = 0,
    bk = 0;
  introGlow = 0;
  S.x = 3.5;
  S.z = introZ(t);
  S.v = introV(t);
  S.yaw = 0;
  if (s === 3) {
    bk = clamp((u - 0.3) / 0.5);
    introGlow = u > 0.7 ? 2 + 9 * clamp((u - 0.7) / 0.25) : 0;
  }
  if (s === 4) {
    bk = 1;
    introGlow = 9;
    hy = 3.2 * easeIO(clamp((u - 0.05) / 0.8));
  }
  if (s === 5) {
    hy = lerp(3.2, 0, easeIO(clamp((u - 0.15) / 0.7)));
    bk = 1 - clamp((u - 0.84) / 0.16);
    introGlow = 9 * bk;
  }
  S.y = hy;
  S.bayK = bk;
  const r = Math.random;
  if (introGlow > 3 && r() < 0.5) {
    const n = BAYP[(r() * 4) | 0];
    gas.emit(
      S.x + n[0],
      S.y + n[1],
      S.z + 2.5,
      (r() - 0.5) * 0.6,
      0.2 + r() * 0.4,
      3 + r() * 2,
      0.9,
      0.12,
      1.4,
    );
  }
  if (S.v > 20 && r() < 0.5) {
    for (const sx of [-0.9, 0.9])
      dust.emit(
        S.x + sx,
        0.25,
        S.z + 1.6,
        (r() - 0.5) * 2,
        0.3 + r() * 0.5,
        8 + r() * 6,
        0.6,
        0.5,
        1.6,
      );
  }
  if (s === 3 && u < 0.35 && r() < 0.7) {
    for (const sx of [-0.9, 0.9])
      smoke.emit(
        S.x + sx,
        0.2,
        S.z + 1.4,
        (r() - 0.5) * 1.5,
        0.4 + r(),
        3 + r() * 3,
        1.2,
        0.6,
        2.4,
      );
  }
  if ((s === 4 || s === 5) && hy > 0.05) {
    for (let k = 0; k < 3; k++) {
      const c = [
        [-0.7, -1.25],
        [0.7, -1.25],
        [-0.7, 1.2],
        [0.7, 1.2],
      ][(r() * 4) | 0];
      gas.emit(
        S.x + c[0],
        S.y + 0.1,
        S.z + c[1],
        (r() - 0.5) * 1.5,
        -9 - r() * 5,
        (r() - 0.5) * 1.5,
        0.3,
        0.18,
        2.2,
      );
    }
    if (hy < 5)
      for (let k = 0; k < 3; k++) {
        const an = r() * 6.283,
          rr = 1.5 + r();
        dust.emit(
          S.x + Math.cos(an) * rr,
          0.2,
          S.z + Math.sin(an) * rr,
          Math.cos(an) * (7 + r() * 5),
          0.3 + r(),
          Math.sin(an) * (7 + r() * 5),
          1.2,
          1.1,
          2.6,
        );
      }
  }
  const C = ICAM[s];
  car.position.set(S.x, S.y, S.z);
  car.rotation.set(0, 0, 0);
  car.updateMatrixWorld();
  let P, Tg;
  if (C.aerial) {
    P = new THREE.Vector3(
      S.x + lerp(-34, -12, e),
      lerp(120, 30, e),
      S.z + lerp(170, 62, e),
    );
    Tg = new THREE.Vector3(S.x, lerp(0, 2, e), S.z - lerp(80, 28, e));
  } else if (C.byWorld) {
    P = new THREE.Vector3(-5.4, 0.55, introZ(3.55));
    Tg = new THREE.Vector3(S.x, 0.6, S.z);
  } else {
    let pl, tl;
    if (C.orbit) {
      const a = lerp(2.35, 1.65, e),
        rr = lerp(8.6, 6.8, e);
      pl = [Math.sin(a) * rr, lerp(2.4, 1.5, e), Math.cos(a) * rr];
      tl = [0, lerp(1.25, 0.95, e), 0];
    } else {
      pl = LV(C.p0, C.p1, e);
      tl = LV(C.t0, C.t1, e);
    }
    P = car.localToWorld(V3(pl));
    Tg = car.localToWorld(V3(tl));
  }
  camera.position.copy(P);
  if (ishake > 0) {
    camera.position.x += (r() - 0.5) * ishake * 0.12;
    camera.position.y += (r() - 0.5) * ishake * 0.12;
    ishake = Math.max(0, ishake - dt * 3);
  }
  camera.lookAt(Tg);
  ipunch = Math.max(0, ipunch - dt * 2.6);
  camera.fov = lerp(C.f0, C.f1, e) - 8 * ipunch * ipunch;
  camera.updateProjectionMatrix();
}
$("ignite").addEventListener("click", startIntro);
$("gate").addEventListener("pointerdown", (e) => {
  if (e.target.id !== "ignite") startIntro();
});
$("skip").addEventListener("click", endIntro);
{
  const h = $("ihero").querySelector(".hr");
  h.innerHTML = "ROADSTER"
    .split("")
    .map((c, i) => `<span style="--i:${i}">${c}</span>`)
    .join("");
}
{
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const x = c.getContext("2d"),
    d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  $("grain").style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------------- ZERO: the crash-test mannequin who drives the Roadster ---------------- */
function zeroModel() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({
      color: 0xe9dcc4,
      roughness: 0.5,
      metalness: 0.05,
    }),
    joint = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.5 }),
    scarf = new THREE.MeshStandardMaterial({ color: 0xc4222e, roughness: 0.6 });
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#ffd23a";
  x.fillRect(0, 0, 128, 128);
  x.fillStyle = "#111";
  for (const a of [0, Math.PI]) {
    x.beginPath();
    x.moveTo(64, 64);
    x.arc(64, 64, 62, a, a + Math.PI / 2);
    x.closePath();
    x.fill();
  }
  const mt = new THREE.CanvasTexture(c);
  mt.colorSpace = THREE.SRGBColorSpace;
  const mark = new THREE.MeshBasicMaterial({ map: mt });
  const add = (geo, m, px, py, pz, par) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(px, py, pz);
    o.castShadow = true;
    (par || g).add(o);
    return o;
  };
  add(new THREE.CapsuleGeometry(0.25, 0.5, 4, 12), skin, 0, 1.27, 0);
  add(new THREE.CircleGeometry(0.1, 20), mark, 0, 1.4, 0.255);
  add(new THREE.BoxGeometry(0.44, 0.16, 0.26), joint, 0, 0.94, 0);
  add(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), joint, 0, 1.66, 0);
  add(
    new THREE.TorusGeometry(0.12, 0.045, 8, 20),
    scarf,
    0,
    1.66,
    0,
  ).rotation.x = Math.PI / 2;
  const head = add(new THREE.SphereGeometry(0.19, 20, 16), skin, 0, 1.88, 0);
  head.scale.set(1, 1.1, 1);
  for (const s of [-1, 1]) {
    const m = add(new THREE.CircleGeometry(0.075, 20), mark, s * 0.192, 1.9, 0);
    m.rotation.y = (s * Math.PI) / 2;
  }
  const legs = [-1, 1].map((s) => {
    const pv = new THREE.Group();
    pv.position.set(s * 0.12, 0.92, 0);
    g.add(pv);
    add(new THREE.CapsuleGeometry(0.085, 0.62, 4, 10), skin, 0, -0.4, 0, pv);
    add(new THREE.BoxGeometry(0.14, 0.08, 0.26), joint, 0, -0.86, 0.05, pv);
    return pv;
  });
  const arms = [-1, 1].map((s) => {
    const pv = new THREE.Group();
    pv.position.set(s * 0.35, 1.56, 0);
    g.add(pv);
    add(new THREE.CapsuleGeometry(0.065, 0.5, 4, 10), skin, 0, -0.32, 0, pv);
    return pv;
  });
  g.userData = { legs, arms };
  return g;
}
function animZero(g, ph, walk) {
  const s = Math.sin(ph) * 0.6 * walk;
  g.userData.legs[0].rotation.x = s;
  g.userData.legs[1].rotation.x = -s;
  g.userData.arms[0].rotation.x = -s * 0.8;
  g.userData.arms[1].rotation.x = s * 0.8;
}
const ZERO = zeroModel();
ZERO.visible = false;
scene.add(ZERO);

/* ---------------- subtitles + chapter cards ---------------- */
let subTok = 0;
function showSub(who, txt, dur = 4.5) {
  const el = $("sub");
  $("subWho").textContent = who || "";
  $("subTxt").textContent = txt;
  el.classList.remove("on");
  void el.offsetWidth;
  el.classList.add("on");
  const tk = ++subTok;
  setTimeout(() => {
    if (tk === subTok) el.classList.remove("on");
  }, dur * 1000);
}
function hideSub() {
  subTok++;
  $("sub").classList.remove("on");
}
function chapterCard(k, done) {
  const C = CH[k];
  $("cardN").textContent =
    `ACT ${(C.act || 0) + 1} · ${ACTS[C.act || 0]} · CHAPTER ${k + 1} OF ${CH.length}`;
  $("cardT").textContent = C.t;
  $("cardO").textContent = tx(MIS[C.mis].b);
  const el = $("card");
  el.hidden = false;
  el.classList.remove("on");
  void el.offsetWidth;
  el.classList.add("on");
  audio.hit();
  setTimeout(() => {
    el.classList.remove("on");
    setTimeout(() => {
      el.hidden = true;
    }, 400);
    done && done();
  }, 2900);
}

/* ---------------- cutscenes (letterboxed, skippable) ---------------- */
let cut = null;
function startCut(def, onEnd) {
  audio.init();
  cut = { t: 0, def, onEnd, fired: new Set() };
  phase = "cut";
  document.body.classList.add("intro");
  $("cutUI").hidden = false;
  $("title").hidden = true;
  $("result").hidden = true;
  ["side", "console", "menubtn", "mission", "mm"].forEach(
    (id) => ($(id).hidden = true),
  );
  $("touch").hidden = true;
  def.setup && def.setup();
}
function endCut() {
  if (!cut) return;
  const f = cut.onEnd;
  cut = null;
  document.body.classList.remove("intro");
  $("cutUI").hidden = true;
  hideSub();
  ZERO.visible = false;
  f && f();
}
