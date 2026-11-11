/* =========================================================
   Krishnajith C Vinod — Portfolio script
   1) UI: theme, nav, reveal, tilt, typewriter
   2) 3D: background crystal (spin waves), band-structure lab, atomic cluster
   Three.js is loaded with dynamic import so the page still works if the CDN fails.
   ========================================================= */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(hover: none)').matches;

/* ---------------- THEME ---------------- */
const root = document.documentElement;
try {
  const saved = localStorage.getItem('kcv-theme');
  if (saved) root.dataset.theme = saved;
} catch (e) { /* storage unavailable */ }

function toggleTheme() {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('kcv-theme', root.dataset.theme); } catch (e) {}
  window.dispatchEvent(new CustomEvent('themechange', { detail: root.dataset.theme }));
}
$$('.theme-toggle, .theme-toggle-m').forEach(b => b.addEventListener('click', toggleTheme));

/* ---------------- SMALL UI BITS ---------------- */
$('#year').textContent = new Date().getFullYear();

const menuBtn = $('.menu-btn');
const mobileMenu = $('.mobile-menu');
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.hasAttribute('hidden');
  mobileMenu.toggleAttribute('hidden', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
$$('.mobile-menu a').forEach(a => a.addEventListener('click', () => mobileMenu.setAttribute('hidden', '')));

$$('[data-toggle]').forEach(btn => {
  const target = document.getElementById(btn.dataset.toggle);
  btn.addEventListener('click', () => {
    const open = target.classList.toggle('open');
    btn.firstChild.textContent = open ? 'Show less ' : 'Read more ';
  });
});

/* typewriter role */
(function rotator() {
  const el = $('.role-rotator');
  const roles = [
    'Theoretical Condensed Matter',
    'Machine Learning for Materials',
    'AI for Physics Discovery',
    'Deep Learning for Physics',
    'Emergent Phenomena',
    'Computational Physics'
  ];
  if (reduceMotion) return;
  let r = 0, i = roles[0].length, deleting = true;
  function tick() {
    const word = roles[r];
    if (deleting) {
      i--;
      if (i <= 0) { deleting = false; r = (r + 1) % roles.length; }
    } else {
      i++;
      if (i >= roles[r].length) { deleting = true; el.textContent = roles[r]; return setTimeout(tick, 2200); }
    }
    el.textContent = roles[r].slice(0, Math.max(i, 0)) || ' ';
    setTimeout(tick, deleting ? 35 : 70);
  }
  setTimeout(tick, 2600);
})();

/* reveal on scroll */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
}, { threshold: 0.12 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; revealObs.observe(el); });

/* active nav */
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.dataset.section;
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('[data-section]').forEach(s => navObs.observe(s));

/* 3D tilt + glare on cards */
if (!isTouch && !reduceMotion) {
  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      const max = el.classList.contains('panel') ? 4 : 9;
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* pointer state shared with the 3D scene */
const pointer = { x: 0, y: 0, cx: innerWidth / 2, cy: innerHeight / 2 };
const glow = $('.cursor-glow');
const holo = $('.holo-inner');
window.addEventListener('pointermove', e => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  pointer.cx = e.clientX; pointer.cy = e.clientY;
  if (e.pointerType === 'mouse') {
    document.body.classList.add('has-pointer');
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }
  if (holo && !reduceMotion) {
    holo.style.transform = `rotateY(${-18 + pointer.x * 10}deg) rotateX(${6 + pointer.y * 8}deg)`;
  }
}, { passive: true });

/* ---------------- 3D ---------------- */
const PASTEL = {
  mint: 0x6ff5c9, sky: 0x7cc8ff, peach: 0xffb98a, pink: 0xff94c2,
  lemon: 0xffe47a, coral: 0xff8a8a, lilac: 0xb8b4ff
};

(async function boot3D() {
  try {
    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    try { initBackground(THREE, RoomEnvironment); } catch (e) { console.warn('bg3d', e); }
    try { initAINet(THREE, OrbitControls); } catch (e) { console.warn('ainet', e); }
    try { initBandLab(THREE, OrbitControls, RoomEnvironment); } catch (e) { console.warn('bandlab', e); }
    try { initCluster(THREE, OrbitControls, RoomEnvironment); } catch (e) { console.warn('cluster', e); }
  } catch (err) {
    console.warn('3D disabled:', err);
  } finally {
    setTimeout(() => document.body.classList.add('loaded'), 350);
  }
})();

/* soft round sprite for particles */
function makeDotTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRenderer(THREE, canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', ...opts });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  return renderer;
}

/* =========================================================
   BACKGROUND: cubic crystal with precessing spins
   ========================================================= */
function initBackground(THREE, RoomEnvironment) {
  const canvas = $('#bg3d');
  const renderer = makeRenderer(THREE, canvas);
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 0, 18);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 8, 10); scene.add(key);
  const rimA = new THREE.PointLight(PASTEL.mint, 40, 30); rimA.position.set(-6, 4, 4); scene.add(rimA);
  const rimB = new THREE.PointLight(PASTEL.peach, 40, 30); rimB.position.set(8, -4, 3); scene.add(rimB);

  const dotTex = makeDotTexture(THREE);

  /* ----- crystal ----- */
  const crystalRoot = new THREE.Group();   // position / scroll / pointer tilt
  const spinner = new THREE.Group();       // auto rotation
  crystalRoot.add(spinner);
  scene.add(crystalRoot);

  const N = 5, a = 1.25, off = (N - 1) / 2;
  const sites = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    sites.push({ p: new THREE.Vector3((i - off) * a, (j - off) * a, (k - off) * a), sub: (i + j + k) % 2 });
  }
  const count = sites.length;

  const atomGeo = new THREE.SphereGeometry(0.22, 32, 16);
  const atomMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08,
    iridescence: 0.5, iridescenceIOR: 1.4, sheen: 0.4, sheenColor: new THREE.Color(PASTEL.sky)
  });
  const atoms = new THREE.InstancedMesh(atomGeo, atomMat, count);
  const colA = new THREE.Color(PASTEL.sky), colB = new THREE.Color(PASTEL.peach);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
  sites.forEach((s, idx) => {
    m4.compose(s.p, q.identity(), sc.set(1, 1, 1));
    atoms.setMatrixAt(idx, m4);
    atoms.setColorAt(idx, s.sub ? colB : colA);
  });
  spinner.add(atoms);

  // bonds
  const bondGeo = new THREE.CylinderGeometry(0.028, 0.028, a, 8);
  const bondMat = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.4, transparent: true, opacity: 0.35 });
  const bondList = [];
  const dirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    const p = new THREE.Vector3((i - off) * a, (j - off) * a, (k - off) * a);
    const idx = [i, j, k];
    dirs.forEach((d, axis) => {
      if (idx[axis] < N - 1) bondList.push({ p: p.clone().addScaledVector(d, a / 2), d });
    });
  }
  const bonds = new THREE.InstancedMesh(bondGeo, bondMat, bondList.length);
  bondList.forEach((b, i) => {
    q.setFromUnitVectors(up, b.d);
    m4.compose(b.p, q, sc.set(1, 1, 1));
    bonds.setMatrixAt(i, m4);
  });
  spinner.add(bonds);

  // spins (shaft + head share matrices)
  const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8); shaftGeo.translate(0, -0.05, 0);
  const headGeo = new THREE.ConeGeometry(0.09, 0.24, 14); headGeo.translate(0, 0.43, 0);
  const spinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1, emissive: 0x223344, emissiveIntensity: 0.4 });
  const shafts = new THREE.InstancedMesh(shaftGeo, spinMat, count);
  const heads = new THREE.InstancedMesh(headGeo, spinMat, count);
  spinner.add(shafts, heads);
  const cUp = new THREE.Color(PASTEL.mint), cMid = new THREE.Color(PASTEL.lemon), cDown = new THREE.Color(PASTEL.pink);
  const tmpC = new THREE.Color();
  // initialise instance colours
  for (let i = 0; i < count; i++) { shafts.setColorAt(i, cUp); heads.setColorAt(i, cUp); }

  // orbit rings + "electrons"
  const ringGroup = new THREE.Group();
  crystalRoot.add(ringGroup);
  const ringDefs = [
    { r: 5.0, color: PASTEL.sky,   rot: [1.2, 0.2, 0.3],  speed: 0.6 },
    { r: 5.5, color: PASTEL.mint,  rot: [1.75, -0.5, 0.0], speed: -0.45 },
    { r: 6.0, color: PASTEL.peach, rot: [1.4, 0.9, -0.4], speed: 0.35 }
  ];
  const electrons = [];
  ringDefs.forEach(def => {
    const holder = new THREE.Group();
    holder.rotation.set(...def.rot);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(def.r, 0.018, 8, 200),
      new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.55 })
    );
    holder.add(ring);
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 12),
      new THREE.MeshBasicMaterial({ color: def.color })
    );
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: def.color, transparent: true, opacity: 0.8, depthWrite: false }));
    halo.scale.setScalar(0.9);
    e.add(halo);
    holder.add(e);
    electrons.push({ mesh: e, r: def.r, speed: def.speed, phase: Math.random() * 6.28 });
    ringGroup.add(holder);
  });

  // holographic platform
  const padTexCanvas = document.createElement('canvas');
  padTexCanvas.width = padTexCanvas.height = 256;
  const pg = padTexCanvas.getContext('2d');
  const pgr = pg.createRadialGradient(128, 128, 10, 128, 128, 128);
  pgr.addColorStop(0, 'rgba(124,200,255,0.55)');
  pgr.addColorStop(0.5, 'rgba(111,245,201,0.18)');
  pgr.addColorStop(1, 'rgba(124,200,255,0)');
  pg.fillStyle = pgr; pg.fillRect(0, 0, 256, 256);
  const padTex = new THREE.CanvasTexture(padTexCanvas); padTex.colorSpace = THREE.SRGBColorSpace;
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ map: padTex, transparent: true, depthWrite: false }));
  pad.rotation.x = -Math.PI / 2; pad.position.y = -4.2;
  const padRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.48, 128), new THREE.MeshBasicMaterial({ color: PASTEL.sky, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  padRing.rotation.x = -Math.PI / 2; padRing.position.y = -4.18;
  const padRing2 = new THREE.Mesh(new THREE.RingGeometry(4.3, 4.34, 128), new THREE.MeshBasicMaterial({ color: PASTEL.mint, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  padRing2.rotation.x = -Math.PI / 2; padRing2.position.y = -4.18;
  crystalRoot.add(pad, padRing, padRing2);

  /* ----- neural-network constellation ----- */
  const nn = new THREE.Group();
  scene.add(nn);
  const layers = [3, 5, 6, 5, 2];
  const nodes = [];
  const nodeMat = new THREE.MeshStandardMaterial({ color: PASTEL.sky, emissive: PASTEL.mint, emissiveIntensity: 0.45, roughness: 0.3, transparent: true, opacity: 0 });
  const nodeGeo = new THREE.SphereGeometry(0.16, 20, 12);
  layers.forEach((n, li) => {
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(nodeGeo, nodeMat);
      m.position.set((li - (layers.length - 1) / 2) * 1.9, (k - (n - 1) / 2) * 1.05, Math.sin(li * 1.3 + k) * 0.6);
      nn.add(m);
      nodes.push({ li, m });
    }
  });
  const edges = [];
  const edgePos = [];
  for (let li = 0; li < layers.length - 1; li++) {
    const A = nodes.filter(n => n.li === li), B = nodes.filter(n => n.li === li + 1);
    A.forEach(na => B.forEach(nb => {
      edges.push([na.m.position, nb.m.position]);
      edgePos.push(...na.m.position.toArray(), ...nb.m.position.toArray());
    }));
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: PASTEL.sky, transparent: true, opacity: 0 });
  nn.add(new THREE.LineSegments(edgeGeo, edgeMat));
  // signal pulses travelling along edges
  const P = 40;
  const pulsePos = new Float32Array(P * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = new THREE.PointsMaterial({ size: 0.38, map: dotTex, color: PASTEL.lemon, transparent: true, opacity: 0, depthWrite: false });
  nn.add(new THREE.Points(pulseGeo, pulseMat));
  const pulses = Array.from({ length: P }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), v: 0.4 + Math.random() * 0.6 }));

  /* ----- particle field ----- */
  const PC = isTouch ? 700 : 1500;
  const pPos = new Float32Array(PC * 3), pCol = new Float32Array(PC * 3);
  const palette = Object.values(PASTEL).map(h => new THREE.Color(h));
  for (let i = 0; i < PC; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 80;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    pPos[i * 3 + 2] = -Math.random() * 45 + 6;
    const c = palette[(Math.random() * palette.length) | 0];
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.22, map: dotTex, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
  const field = new THREE.Points(pGeo, pMat);
  scene.add(field);

  /* ----- floating wireframe polyhedra ----- */
  const polys = [];
  const polyGeos = [
    new THREE.IcosahedronGeometry(1.2, 0), new THREE.OctahedronGeometry(1.1, 0),
    new THREE.TetrahedronGeometry(1.1, 0), new THREE.DodecahedronGeometry(1.0, 0),
    new THREE.TorusKnotGeometry(0.8, 0.22, 80, 10)
  ];
  const polyColors = [PASTEL.mint, PASTEL.peach, PASTEL.sky, PASTEL.pink, PASTEL.lemon, PASTEL.lilac];
  for (let i = 0; i < 9; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: polyColors[i % polyColors.length], wireframe: true, transparent: true, opacity: 0.32 });
    const m = new THREE.Mesh(polyGeos[i % polyGeos.length], mat);
    m.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 26 - 6, -10 - Math.random() * 18);
    m.userData = { rs: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.3), y0: m.position.y, ph: Math.random() * 6 };
    scene.add(m);
    polys.push(m);
  }

  /* ----- theme reaction ----- */
  function applyTheme(t) {
    const light = t === 'light';
    pMat.color.set(light ? 0x8a9cc4 : 0xffffff);
    pMat.opacity = light ? 0.95 : 0.85;
    bondMat.color.set(light ? 0x7f9cc8 : 0xcfe8ff);
    bondMat.opacity = light ? 0.55 : 0.35;
    edgeMat.color.set(light ? 0x4a8fd6 : PASTEL.sky);
    polys.forEach(p => { p.material.opacity = light ? 0.5 : 0.32; });
    renderer.toneMappingExposure = light ? 1.0 : 1.15;
  }
  applyTheme(root.dataset.theme);
  window.addEventListener('themechange', e => applyTheme(e.detail));

  /* ----- spin-wave packets (click to launch) ----- */
  const packets = [];
  const worldPos = sites.map(() => new THREE.Vector3());
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let lastLaunch = 0;

  function launchFrom(index, time) {
    packets.push({ r0: sites[index].p.clone(), t0: time });
    if (packets.length > 6) packets.shift();
    lastLaunch = time;
  }

  window.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, input, label, .panel, .r-card, .pub, .t-card, .topbar, .siderail, canvas#bandCanvas, canvas#clusterCanvas')) return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    spinner.updateMatrixWorld(true);
    let best = -1, bestD = Infinity;
    sites.forEach((s, i) => {
      worldPos[i].copy(s.p).applyMatrix4(spinner.matrixWorld);
      const d = raycaster.ray.distanceSqToPoint(worldPos[i]);
      if (d < bestD) { bestD = d; best = i; }
    });
    const scale = crystalRoot.scale.x;
    if (best >= 0 && bestD < (2.2 * scale) ** 2) launchFrom(best, clock.getElapsedTime());
  });

  /* ----- layout per viewport ----- */
  const layout = { x: 4.8, y: -0.4, s: 0.86, nnX: -7.5, nnS: 1 };
  function computeLayout() {
    const w = innerWidth;
    if (w < 760)       Object.assign(layout, { x: 0,   y: 2.9,  s: 0.5,  nnX: 0, nnS: 0.5 });
    else if (w < 1100) Object.assign(layout, { x: 3.6, y: 0.6,  s: 0.66, nnX: -4.5, nnS: 0.8 });
    else               Object.assign(layout, { x: 4.8, y: -0.4, s: 0.86, nnX: -7.5, nnS: 1 });
  }
  computeLayout();

  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    computeLayout();
  }
  window.addEventListener('resize', onResize);

  /* ----- animation ----- */
  const clock = new THREE.Clock();
  const speed = reduceMotion ? 0.25 : 1;
  const S = new THREE.Vector3();
  const qv = new THREE.Vector3(0.55, 0.15, 0.35);
  const tilt = { x: 0, y: 0 };
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); requestAnimationFrame(frame); }
  });

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05) * speed;
    const t = clock.getElapsedTime() * speed;
    const vh = innerHeight;
    const sY = scrollY / vh;                 // in screens
    const heroT = Math.min(sY, 1.3);

    // idle auto-launch so the crystal is never static
    if (!reduceMotion && t - lastLaunch > 5.5) launchFrom((Math.random() * count) | 0, t);

    // crystal placement (moves back and to the side as you scroll)
    const tx = layout.x + heroT * 2.2;
    const ty = layout.y + heroT * 1.0;
    const tz = -heroT * 7;
    crystalRoot.position.x += (tx - crystalRoot.position.x) * 0.08;
    crystalRoot.position.y += (ty - crystalRoot.position.y) * 0.08;
    crystalRoot.position.z += (tz - crystalRoot.position.z) * 0.08;
    const ts = layout.s;
    crystalRoot.scale.setScalar(crystalRoot.scale.x + (ts - crystalRoot.scale.x) * 0.08);

    tilt.x += ((pointer.y * 0.35) - tilt.x) * 0.05;
    tilt.y += ((pointer.x * 0.5) - tilt.y) * 0.05;
    crystalRoot.rotation.x = 0.25 - tilt.x + sY * 0.15;
    crystalRoot.rotation.z = -0.08;
    spinner.rotation.y += dt * 0.18;
    spinner.rotation.x = Math.sin(t * 0.2) * 0.08;
    crystalRoot.rotation.y = tilt.y;
    ringGroup.rotation.y = t * 0.08;

    electrons.forEach(el => {
      const ang = el.phase + t * el.speed;
      el.mesh.position.set(Math.cos(ang) * el.r, Math.sin(ang) * el.r, 0);
    });
    padRing.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
    padRing2.rotation.z = t * 0.2;

    // spins: precessing ferromagnet + click-launched wave packets
    for (let p = packets.length - 1; p >= 0; p--) if (t - packets[p].t0 > 7) packets.splice(p, 1);
    for (let i = 0; i < count; i++) {
      const r = sites[i].p;
      let amp = 0;
      for (const pk of packets) {
        const tau = t - pk.t0;
        const d = r.distanceTo(pk.r0);
        const front = d - 2.3 * tau;
        amp += Math.exp(-(front * front) / 0.8) * Math.exp(-tau / 2.4);
      }
      const theta = Math.min(0.32 + 2.5 * amp, 2.9);
      const phi = qv.x * r.x + qv.y * r.y + qv.z * r.z - 1.6 * t;
      S.set(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)).normalize();
      q.setFromUnitVectors(up, S);
      m4.compose(r, q, sc.set(1, 1, 1));
      shafts.setMatrixAt(i, m4);
      heads.setMatrixAt(i, m4);

      const flip = (1 - S.y) / 2; // 0 = up, 1 = down
      if (flip < 0.5) tmpC.copy(cUp).lerp(cMid, flip * 2); else tmpC.copy(cMid).lerp(cDown, (flip - 0.5) * 2);
      shafts.setColorAt(i, tmpC); heads.setColorAt(i, tmpC);

      const s = 1 + amp * 0.55;
      m4.compose(r, q.identity(), sc.set(s, s, s));
      atoms.setMatrixAt(i, m4);
    }
    shafts.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = atoms.instanceMatrix.needsUpdate = true;
    shafts.instanceColor.needsUpdate = heads.instanceColor.needsUpdate = true;

    // neural net: fades in after the hero
    const nnA = Math.max(0, Math.min(1, (sY - 0.55) / 0.6)) * (sY < 7 ? 1 : Math.max(0, 1 - (sY - 7)));
    nodeMat.opacity = nnA * 0.95;
    edgeMat.opacity = nnA * (root.dataset.theme === 'light' ? 0.4 : 0.22);
    pulseMat.opacity = nnA;
    nn.visible = nnA > 0.01;
    nn.position.set(layout.nnX, -1 + Math.sin(t * 0.4) * 0.3 - (sY - 1) * 0.6, -4);
    nn.rotation.y = 0.5 + Math.sin(t * 0.15) * 0.25 + tilt.y * 0.5;
    nn.rotation.x = tilt.x * 0.4;
    nn.scale.setScalar(layout.nnS);
    if (nn.visible) {
      pulses.forEach((pl, i) => {
        pl.t += dt * pl.v;
        if (pl.t > 1) { pl.t = 0; pl.e = (Math.random() * edges.length) | 0; }
        const [A, B] = edges[pl.e];
        pulsePos[i * 3] = A.x + (B.x - A.x) * pl.t;
        pulsePos[i * 3 + 1] = A.y + (B.y - A.y) * pl.t;
        pulsePos[i * 3 + 2] = A.z + (B.z - A.z) * pl.t;
      });
      pulseGeo.attributes.position.needsUpdate = true;
    }

    // particles & polyhedra parallax
    field.rotation.y = t * 0.01 + pointer.x * 0.03;
    field.position.y = sY * 2.2;
    polys.forEach(m => {
      m.rotation.x += m.userData.rs.x * dt;
      m.rotation.y += m.userData.rs.y * dt;
      m.position.y = m.userData.y0 + sY * 3.2 + Math.sin(t * 0.5 + m.userData.ph) * 0.6;
    });

    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  crystalRoot.position.set(layout.x, layout.y, 0);
  crystalRoot.scale.setScalar(layout.s * 0.6);
  requestAnimationFrame(frame);
}

/* =========================================================
   NEURAL NETWORK LAB
   A tiny MLP (tanh hidden layers, sigmoid output, Adam) trained live.
   The 2D decision map works on its own; the 3D network view needs Three.js.
   ========================================================= */
const AILab = (function initAILab() {
  const heat = $('#heatCanvas');
  if (!heat) return null;
  const ctx = heat.getContext('2d');
  const spark = $('#lossSpark');
  const sctx = spark.getContext('2d');
  const off = document.createElement('canvas');
  const G = 56;
  off.width = off.height = G;
  const octx = off.getContext('2d');
  const img = octx.createImageData(G, G);

  const COL = { 0: [255, 185, 138], 1: [124, 200, 255] };   // peach / sky

  const st = {
    data: 'phase', layers: 2, neurons: 6, lr: 0.03,
    playing: !reduceMotion, epoch: 0, loss: NaN, acc: NaN, losses: [],
    points: [], probe: { x: 0, y: 0 }, hovering: false, net: null, version: 0, acts: null, visible: false
  };

  const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  class MLP {
    constructor(sizes) {
      this.sizes = sizes; this.L = sizes.length - 1; this.t = 0;
      this.W = []; this.b = []; this.gW = []; this.gb = []; this.mW = []; this.vW = []; this.mb = []; this.vb = [];
      for (let l = 0; l < this.L; l++) {
        const I = sizes[l], O = sizes[l + 1], sc = Math.sqrt(2 / (I + O));
        this.W.push(Float32Array.from({ length: I * O }, () => randn() * sc));
        this.b.push(new Float32Array(O));
        [this.gW, this.mW, this.vW].forEach(arr => arr.push(new Float32Array(I * O)));
        [this.gb, this.mb, this.vb].forEach(arr => arr.push(new Float32Array(O)));
      }
      this.a = sizes.map(n => new Float32Array(n));
      this.d = sizes.map(n => new Float32Array(n));
    }
    forward(x, y) {
      const { a, W, b, sizes, L } = this;
      a[0][0] = x; a[0][1] = y;
      for (let l = 0; l < L; l++) {
        const I = sizes[l], O = sizes[l + 1], w = W[l], bb = b[l], ai = a[l], ao = a[l + 1];
        for (let j = 0; j < O; j++) {
          let z = bb[j];
          const o = j * I;
          for (let i = 0; i < I; i++) z += w[o + i] * ai[i];
          ao[j] = l === L - 1 ? 1 / (1 + Math.exp(-z)) : Math.tanh(z);
        }
      }
      return a[L][0];
    }
    step(pts, lr) {
      const { L, sizes, W, a, d, gW, gb } = this;
      gW.forEach(g => g.fill(0)); gb.forEach(g => g.fill(0));
      let loss = 0, correct = 0;
      for (const p of pts) {
        const out = this.forward(p.x, p.y);
        loss -= p.c ? Math.log(out + 1e-7) : Math.log(1 - out + 1e-7);
        if ((out > 0.5) === (p.c === 1)) correct++;
        d[L][0] = out - p.c;
        for (let l = L - 1; l >= 0; l--) {
          const I = sizes[l], O = sizes[l + 1], w = W[l], ai = a[l], dO = d[l + 1], g = gW[l], gbl = gb[l];
          for (let j = 0; j < O; j++) {
            gbl[j] += dO[j];
            const o = j * I;
            for (let i = 0; i < I; i++) g[o + i] += dO[j] * ai[i];
          }
          if (l > 0) {
            const dI = d[l];
            for (let i = 0; i < I; i++) {
              let s = 0;
              for (let j = 0; j < O; j++) s += w[j * I + i] * dO[j];
              dI[i] = s * (1 - ai[i] * ai[i]);
            }
          }
        }
      }
      const n = Math.max(pts.length, 1);
      this.t++;
      const b1 = 0.9, b2 = 0.999, c1 = 1 - b1 ** this.t, c2 = 1 - b2 ** this.t;
      const adam = (P, Gr, M, V, decay) => {
        for (let k = 0; k < P.length; k++) {
          const g = Gr[k] / n + decay * P[k];
          M[k] = b1 * M[k] + (1 - b1) * g;
          V[k] = b2 * V[k] + (1 - b2) * g * g;
          P[k] -= lr * (M[k] / c1) / (Math.sqrt(V[k] / c2) + 1e-8);
        }
      };
      for (let l = 0; l < L; l++) { adam(W[l], gW[l], this.mW[l], this.vW[l], 1e-4); adam(this.b[l], gb[l], this.mb[l], this.vb[l], 0); }
      return { loss: loss / n, acc: correct / n };
    }
  }

  function makeData(name, n = 220) {
    const pts = [];
    const U = () => Math.random() * 2 - 1;
    for (let k = 0; k < n; k++) {
      let x = U(), y = U(), c;
      if (name === 'phase') {
        // ordered phase below a curved critical line T_c(h), with thermal noise near the boundary
        const Tc = 0.42 - 0.95 * x * x;
        c = y < Tc + randn() * 0.06 ? 1 : 0;
      } else if (name === 'circle') {
        c = Math.hypot(x, y) < 0.55 ? 1 : 0;
      } else if (name === 'xor') {
        if (Math.abs(x) < 0.06 || Math.abs(y) < 0.06) { k--; continue; }
        c = x * y > 0 ? 1 : 0;
      } else { // spiral
        c = k % 2;
        const r = (k / n) * 0.9 + 0.05, th = (k / n) * 3.2 * Math.PI + c * Math.PI;
        x = r * Math.cos(th) + randn() * 0.03; y = r * Math.sin(th) + randn() * 0.03;
      }
      pts.push({ x, y, c });
    }
    return pts;
  }

  const LABELS = {
    phase:  { x: 'field h →', y: 'temperature T →', b: 'Ordered', a: 'Disordered' },
    circle: { x: 'x₁ →', y: 'x₂ →', b: 'Class A', a: 'Class B' },
    xor:    { x: 'x₁ →', y: 'x₂ →', b: 'Class A', a: 'Class B' },
    spiral: { x: 'x₁ →', y: 'x₂ →', b: 'Arm A', a: 'Arm B' }
  };

  function newNet() {
    st.net = new MLP([2, ...Array(st.layers).fill(st.neurons), 1]);
    st.epoch = 0; st.losses = []; st.loss = NaN; st.acc = NaN; st.version++;
  }
  function setData(name) {
    st.data = name; st.points = makeData(name);
    const L = LABELS[name];
    $('#axX').textContent = L.x; $('#axY').textContent = L.y;
    $('#lgB').textContent = L.b; $('#lgA').textContent = L.a;
    newNet();
  }

  /* controls */
  $$('#ailab .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#ailab .seg-btn').forEach(x => x.classList.toggle('active', x === b));
    setData(b.dataset.data);
  }));
  const layersS = $('#layersSlider'), neuronsS = $('#neuronsSlider'), lrS = $('#lrSlider');
  layersS.addEventListener('input', () => { st.layers = +layersS.value; $('#layersOut').textContent = st.layers; newNet(); });
  neuronsS.addEventListener('input', () => { st.neurons = +neuronsS.value; $('#neuronsOut').textContent = st.neurons; newNet(); });
  lrS.addEventListener('input', () => { st.lr = 10 ** +lrS.value; $('#lrOut').textContent = st.lr.toFixed(3); });
  const playBtn = $('#aiPlay');
  const syncPlay = () => { playBtn.textContent = st.playing ? 'Pause' : 'Train'; };
  playBtn.addEventListener('click', () => { st.playing = !st.playing; syncPlay(); });
  $('#aiReset').addEventListener('click', newNet);
  $('#aiClear').addEventListener('click', () => { st.points = []; newNet(); });
  syncPlay();

  /* canvas interaction */
  const toData = e => {
    const r = heat.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: 1 - ((e.clientY - r.top) / r.height) * 2 };
  };
  heat.addEventListener('contextmenu', e => e.preventDefault());
  heat.addEventListener('pointerdown', e => {
    const p = toData(e);
    st.points.push({ x: p.x, y: p.y, c: (e.button === 2 || e.shiftKey) ? 0 : 1 });
  });
  heat.addEventListener('pointermove', e => { st.probe = toData(e); st.hovering = true; });
  heat.addEventListener('pointerleave', () => { st.hovering = false; });

  /* sizing */
  let W = 0, H = 0, SW = 0, SH = 0;
  const dpr = Math.min(devicePixelRatio, 2);
  function resize() {
    W = heat.width = Math.max(1, heat.clientWidth * dpr);
    H = heat.height = Math.max(1, heat.clientHeight * dpr);
    SW = spark.width = Math.max(1, spark.clientWidth * dpr);
    SH = spark.height = Math.max(1, spark.clientHeight * dpr);
  }
  new ResizeObserver(resize).observe(heat.parentElement);
  new ResizeObserver(resize).observe(spark);
  resize();

  /* drawing */
  function drawMap() {
    const net = st.net, d = img.data;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const x = (i + 0.5) / G * 2 - 1, y = 1 - (j + 0.5) / G * 2;
      const p = net.forward(x, y);
      const k = (j * G + i) * 4;
      let r = COL[0][0] + (COL[1][0] - COL[0][0]) * p;
      let g = COL[0][1] + (COL[1][1] - COL[0][1]) * p;
      let b = COL[0][2] + (COL[1][2] - COL[0][2]) * p;
      const conf = Math.abs(p - 0.5) * 2;            // fade toward white at the boundary
      const w = (1 - conf) * 0.55;
      d[k] = r + (255 - r) * w; d[k + 1] = g + (255 - g) * w; d[k + 2] = b + (255 - b) * w; d[k + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(off, 0, 0, W, H);
    ctx.globalAlpha = 1;

    const R = 4.2 * dpr;
    for (const p of st.points) {
      const px = (p.x + 1) / 2 * W, py = (1 - p.y) / 2 * H;
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2);
      const c = p.c ? [70, 160, 240] : [245, 130, 70];
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fill();
      ctx.lineWidth = 1.4 * dpr; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
    }
    // probe
    const pr = st.probe, px = (pr.x + 1) / 2 * W, py = (1 - pr.y) / 2 * H;
    ctx.beginPath(); ctx.arc(px, py, 9 * dpr, 0, Math.PI * 2);
    ctx.lineWidth = 2 * dpr; ctx.strokeStyle = '#0a0f1f'; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 2.5 * dpr, 0, Math.PI * 2); ctx.fillStyle = '#0a0f1f'; ctx.fill();
  }

  function drawSpark() {
    sctx.clearRect(0, 0, SW, SH);
    const L = st.losses;
    if (L.length < 2) return;
    const lo = Math.log(Math.min(...L) + 1e-4), hi = Math.log(Math.max(...L) + 1e-4);
    const grd = sctx.createLinearGradient(0, 0, SW, 0);
    grd.addColorStop(0, '#6ff5c9'); grd.addColorStop(0.5, '#7cc8ff'); grd.addColorStop(1, '#ffb98a');
    sctx.beginPath();
    L.forEach((v, i) => {
      const x = 8 * dpr + (i / (L.length - 1)) * (SW - 16 * dpr);
      const y = SH - 6 * dpr - ((Math.log(v + 1e-4) - lo) / (hi - lo || 1)) * (SH - 26 * dpr);
      i ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
    });
    sctx.strokeStyle = grd; sctx.lineWidth = 2 * dpr; sctx.stroke();
    sctx.fillStyle = root.dataset.theme === 'light' ? '#4d5a7d' : '#a7b3d1';
    sctx.font = `${10 * dpr}px JetBrains Mono, monospace`;
    sctx.fillText('training loss (log)', 10 * dpr, 14 * dpr);
  }

  const epochEl = $('#aiEpoch'), lossEl = $('#aiLoss'), accEl = $('#aiAcc'), probeEl = $('#probeOut');
  let t0 = performance.now();
  function loop(now) {
    if (!st.visible || document.hidden) return;
    if (st.playing && st.points.length) {
      for (let k = 0; k < 4; k++) {
        const r = st.net.step(st.points, st.lr);
        st.loss = r.loss; st.acc = r.acc; st.epoch++;
      }
      if (st.epoch % 8 === 0) { st.losses.push(st.loss); if (st.losses.length > 300) st.losses.shift(); }
    }
    if (!st.hovering) {
      const t = (now - t0) / 1000;
      st.probe = { x: Math.cos(t * 0.45) * 0.62, y: Math.sin(t * 0.7) * 0.62 };
    }
    drawMap();
    const out = st.net.forward(st.probe.x, st.probe.y);
    st.acts = st.net.a.map(a => Float32Array.from(a));
    probeEl.textContent = `P(${LABELS[st.data].b}) = ${out.toFixed(2)}`;
    probeEl.classList.toggle('show', st.hovering);
    epochEl.textContent = st.epoch;
    lossEl.textContent = Number.isFinite(st.loss) ? st.loss.toFixed(3) : '—';
    accEl.textContent = Number.isFinite(st.acc) ? (st.acc * 100).toFixed(1) + '%' : '—';
    drawSpark();
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(([e]) => {
    st.visible = e.isIntersecting;
    if (st.visible) requestAnimationFrame(loop);
  }, { threshold: 0.05 }).observe($('#ailab'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.visible) requestAnimationFrame(loop); });

  setData('phase');
  st.acts = st.net.a.map(a => Float32Array.from(a));
  return st;
})();

/* 3D view of the network: edges coloured by weight sign/size, nodes by activation */
function initAINet(THREE, OrbitControls) {
  if (!AILab) return;
  const canvas = $('#netCanvas');
  const stage = canvas.parentElement;
  const renderer = makeRenderer(THREE, canvas);
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.2, 10);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
  controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 0.9;
  controls.minAzimuthAngle = -1.1; controls.maxAzimuthAngle = 1.1;
  let dir = 1;

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(3, 5, 8); scene.add(dl);

  const cPos = new THREE.Color(PASTEL.mint), cNeg = new THREE.Color(PASTEL.pink);
  const cZero = new THREE.Color(0xdfe7f5);
  const bgDark = new THREE.Color(0x111a33), bgLight = new THREE.Color(0xe8eefb);
  const tmp = new THREE.Color();

  let group = null, nodes = null, edges = null, nodeMap = [], version = -1;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function build() {
    if (group) {
      scene.remove(group);
      group.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); });
    }
    const sizes = AILab.net.sizes;
    group = new THREE.Group();
    nodeMap = [];
    const total = sizes.reduce((s, n) => s + n, 0);
    const span = (sizes.length - 1) * 2.2;
    sizes.forEach((n, l) => {
      for (let k = 0; k < n; k++) {
        nodeMap.push({ l, k, p: new THREE.Vector3(l * 2.2 - span / 2, (k - (n - 1) / 2) * 0.78, Math.sin(k * 1.7 + l) * 0.25) });
      }
    });
    nodes = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.2, 24, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0x223344, emissiveIntensity: 0.25 }),
      total
    );
    nodeMap.forEach((nd, i) => { m4.compose(nd.p, q, sv.set(1, 1, 1)); nodes.setMatrixAt(i, m4); nodes.setColorAt(i, cZero); });
    group.add(nodes);

    const pos = [];
    let base = 0;
    const starts = sizes.map((n) => { const s = base; base += n; return s; });
    for (let l = 0; l < sizes.length - 1; l++) {
      for (let j = 0; j < sizes[l + 1]; j++) for (let i = 0; i < sizes[l]; i++) {
        pos.push(...nodeMap[starts[l] + i].p.toArray(), ...nodeMap[starts[l + 1] + j].p.toArray());
      }
    }
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    eg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
    edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
    group.add(edges);
    scene.add(group);

    fit.span = span; fit.height = Math.max(...sizes) * 0.78;
    fitCamera();
    version = AILab.version;
  }
  const fit = { span: 4, height: 4 };
  function fitCamera() {
    // distance needed so both the full width and height of the network fit the view
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dW = (fit.span / 2 + 0.45) / (tanV * camera.aspect);
    const dH = (fit.height / 2 + 0.9) / tanV;
    camera.position.setLength(Math.max(dW, dH));
  }

  function update() {
    if (version !== AILab.version) build();
    const net = AILab.net, sizes = net.sizes;
    const bg = root.dataset.theme === 'light' ? bgLight : bgDark;
    const col = edges.geometry.attributes.color.array;
    let e = 0;
    for (let l = 0; l < sizes.length - 1; l++) {
      const W = net.W[l];
      for (let k = 0; k < W.length; k++) {
        const w = W[k];
        const m = Math.min(1, Math.abs(w) / 1.6);
        tmp.copy(bg).lerp(w >= 0 ? cPos : cNeg, 0.12 + 0.88 * m);
        col[e++] = tmp.r; col[e++] = tmp.g; col[e++] = tmp.b;
        col[e++] = tmp.r; col[e++] = tmp.g; col[e++] = tmp.b;
      }
    }
    edges.geometry.attributes.color.needsUpdate = true;

    const acts = AILab.acts;
    const L = sizes.length - 1;
    nodeMap.forEach((nd, i) => {
      let a = acts && acts[nd.l] ? acts[nd.l][nd.k] : 0;
      if (nd.l === L) a = a * 2 - 1;                // sigmoid output -> [-1, 1]
      tmp.copy(cZero).lerp(a >= 0 ? cPos : cNeg, Math.min(1, Math.abs(a)));
      nodes.setColorAt(i, tmp);
      const s = 0.75 + 0.6 * Math.abs(a);
      m4.compose(nd.p, q, sv.set(s, s, s));
      nodes.setMatrixAt(i, m4);
    });
    nodes.instanceColor.needsUpdate = true;
    nodes.instanceMatrix.needsUpdate = true;
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
    if (group) fitCamera();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.05 }).observe(stage);
  function loop() {
    if (!visible || document.hidden) return;
    update();
    // gentle back-and-forth sweep so the layers stay readable
    const az = controls.getAzimuthalAngle();
    if (controls.autoRotate) {
      if (az > 1.0) dir = -1; else if (az < -1.0) dir = 1;
      controls.autoRotateSpeed = 0.9 * dir;
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) requestAnimationFrame(loop); });
}

/* =========================================================
   BAND STRUCTURE LAB
   ========================================================= */
function initBandLab(THREE, OrbitControls, RoomEnvironment) {
  const canvas = $('#bandCanvas');
  const stage = canvas.parentElement;
  const renderer = makeRenderer(THREE, canvas);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(9.4, 6.6, 9.4);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.7;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI - 0.25;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(4, 10, 6); scene.add(dl);

  const RES = isTouch ? 90 : 130;
  const HALF = 3.0;                  // world half-width
  const state = { model: 'graphene', t: 1, d: 0, tp: 0 };

  const s3 = Math.sqrt(3);
  const models = {
    graphene: {
      k: 3.1, bands: 2,
      E(kx, ky, { t, d, tp }) {
        // nearest neighbours δ1=(0,1), δ2=(√3/2,-1/2), δ3=(-√3/2,-1/2)
        const re = Math.cos(ky) + 2 * Math.cos(s3 / 2 * kx) * Math.cos(ky / 2);
        const im = Math.sin(ky) - 2 * Math.cos(s3 / 2 * kx) * Math.sin(ky / 2);
        const f2 = re * re + im * im;
        const g = 2 * Math.cos(s3 * kx) + 4 * Math.cos(s3 / 2 * kx) * Math.cos(1.5 * ky);
        const root = Math.sqrt(d * d + t * t * f2);
        return [tp * g + root, tp * g - root];
      },
      formula: 'E<sub>±</sub>(k) = t′g(k) ± √( Δ² + t² |Σ<sub>δ</sub> e<sup>ik·δ</sup>|² )'
    },
    square: {
      k: Math.PI, bands: 1,
      E(kx, ky, { t, tp }) { return [-2 * t * (Math.cos(kx) + Math.cos(ky)) - 4 * tp * Math.cos(kx) * Math.cos(ky)]; },
      formula: 'E(k) = −2t (cos k<sub>x</sub> + cos k<sub>y</sub>) − 4t′ cos k<sub>x</sub> cos k<sub>y</sub>'
    },
    triangular: {
      k: 4.4, bands: 1,
      E(kx, ky, { t }) { return [-2 * t * (Math.cos(kx) + 2 * Math.cos(kx / 2) * Math.cos(s3 / 2 * ky))]; },
      formula: 'E(k) = −2t [ cos k<sub>x</sub> + 2 cos(k<sub>x</sub>/2) cos(√3 k<sub>y</sub>/2) ]'
    }
  };

  // geometry: (RES+1)^2 vertices, indexed
  function makeSurface() {
    const n = (RES + 1) * (RES + 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const idx = [];
    for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) {
      const a = j * (RES + 1) + i, b = a + 1, c = a + RES + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    return g;
  }
  renderer.toneMapping = THREE.NoToneMapping;
  const surfMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.5, transparent: true, opacity: 0.95 });
  const upper = new THREE.Mesh(makeSurface(), surfMat);
  const lower = new THREE.Mesh(makeSurface(), surfMat);
  scene.add(upper, lower);

  // grid lines on surfaces
  const STEP = Math.round(RES / 16);
  const lineCount = Math.floor(RES / STEP) + 1;
  const segPerSurf = lineCount * RES * 2;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
  function makeLines() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segPerSurf * 2 * 3), 3));
    return new THREE.LineSegments(g, lineMat);
  }
  const upperLines = makeLines(), lowerLines = makeLines();
  scene.add(upperLines, lowerLines);

  // floor: Brillouin zone outline + high-symmetry points
  const floorY = -2.6;
  const bzMat = new THREE.LineBasicMaterial({ color: PASTEL.lemon, transparent: true, opacity: 0.85 });
  const bz = new THREE.LineLoop(new THREE.BufferGeometry(), bzMat);
  scene.add(bz);
  const floorGrid = new THREE.GridHelper(HALF * 2, 12, 0x7cc8ff, 0x7cc8ff);
  floorGrid.material.transparent = true; floorGrid.material.opacity = 0.12;
  floorGrid.position.y = floorY;
  scene.add(floorGrid);
  const kMarkers = new THREE.Group(); scene.add(kMarkers);
  const kGeo = new THREE.SphereGeometry(0.07, 14, 10);
  const kMat = new THREE.MeshBasicMaterial({ color: PASTEL.pink });

  // hover marker
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0.7 }));
  marker.visible = drop.visible = false;
  scene.add(marker, drop);

  const stops = [PASTEL.pink, PASTEL.peach, PASTEL.lemon, PASTEL.mint, PASTEL.sky].map(h => new THREE.Color(h));
  const tmp = new THREE.Color();
  function grad(u) {
    u = Math.max(0, Math.min(0.9999, u)) * (stops.length - 1);
    const i = Math.floor(u);
    return tmp.copy(stops[i]).lerp(stops[i + 1], u - i);
  }

  let EY = 0.55; // energy -> world y scale
  function rebuild() {
    const M = models[state.model];
    const sK = HALF / M.k;          // k -> world
    // sample energies
    const n = RES + 1;
    const bandsE = [new Float32Array(n * n), new Float32Array(n * n)];
    let emin = Infinity, emax = -Infinity;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const kx = (i / RES * 2 - 1) * M.k, ky = (j / RES * 2 - 1) * M.k;
      const E = M.E(kx, ky, state);
      for (let b = 0; b < M.bands; b++) {
        bandsE[b][j * n + i] = E[b];
        if (E[b] < emin) emin = E[b];
        if (E[b] > emax) emax = E[b];
      }
    }
    EY = 3.6 / Math.max(emax - emin, 0.001);
    const mid = (emax + emin) / 2;
    const meshes = [upper, lower], lines = [upperLines, lowerLines];
    for (let b = 0; b < 2; b++) {
      const mesh = meshes[b];
      mesh.visible = lines[b].visible = b < M.bands;
      if (b >= M.bands) continue;
      const pos = mesh.geometry.attributes.position.array;
      const col = mesh.geometry.attributes.color.array;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const v = j * n + i;
        const E = bandsE[b][v];
        pos[v * 3] = (i / RES * 2 - 1) * HALF;
        pos[v * 3 + 1] = (E - mid) * EY;
        pos[v * 3 + 2] = (j / RES * 2 - 1) * HALF;
        const c = grad((E - emin) / (emax - emin || 1));
        col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.attributes.color.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();

      // grid lines
      const lp = lines[b].geometry.attributes.position.array;
      let w = 0;
      const put = v => { lp[w++] = pos[v * 3]; lp[w++] = pos[v * 3 + 1] + 0.004; lp[w++] = pos[v * 3 + 2]; };
      for (let L = 0; L < lineCount; L++) {
        const r = Math.min(L * STEP, RES);
        for (let i = 0; i < RES; i++) { put(r * n + i); put(r * n + i + 1); }         // along x
        for (let j = 0; j < RES; j++) { put(j * n + r); put((j + 1) * n + r); }       // along z
      }
      lines[b].geometry.attributes.position.needsUpdate = true;
      lines[b].geometry.computeBoundingSphere();
    }
    state.mid = mid; state.sK = sK;

    // Brillouin zone + special points
    const pts = [];
    kMarkers.clear();
    if (state.model === 'square') {
      const K = Math.PI * sK;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z]) => pts.push(new THREE.Vector3(x * K, floorY + 0.01, z * K)));
      [[0, 0], [1, 0], [1, 1]].forEach(([x, z]) => { const m = new THREE.Mesh(kGeo, kMat); m.position.set(x * K, floorY + 0.02, z * K); kMarkers.add(m); });
    } else {
      // hexagonal BZ: vertices are the K points
      const Kr = state.model === 'graphene' ? 4 * Math.PI / (3 * s3) : 4 * Math.PI / 3;
      const off = 0;
      for (let h = 0; h < 6; h++) {
        const ang = off + h * Math.PI / 3;
        const p = new THREE.Vector3(Math.cos(ang) * Kr * sK, floorY + 0.01, Math.sin(ang) * Kr * sK);
        pts.push(p);
        const m = new THREE.Mesh(kGeo, kMat); m.position.copy(p); kMarkers.add(m);
        // drop a faint line from the Dirac point up to the surface for graphene
        if (state.model === 'graphene') {
          const lg = new THREE.BufferGeometry().setFromPoints([p, new THREE.Vector3(p.x, (state.tp * models.graphene.E(Math.cos(ang) * Kr, Math.sin(ang) * Kr, { t: 0, d: 0, tp: 1 })[0] - mid) * EY, p.z)]);
          kMarkers.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: PASTEL.pink, transparent: true, opacity: 0.45 })));
        }
      }
      const g0 = new THREE.Mesh(kGeo, new THREE.MeshBasicMaterial({ color: PASTEL.sky })); g0.position.set(0, floorY + 0.02, 0); kMarkers.add(g0);
    }
    bz.geometry.dispose();
    bz.geometry = new THREE.BufferGeometry().setFromPoints(pts);

    $('#labFormula').innerHTML = models[state.model].formula;
  }

  // controls
  const gapWrap = $('#gapWrap'), tpWrap = $('#tpWrap');
  function syncDisabled() {
    gapWrap.classList.toggle('disabled', state.model !== 'graphene');
    tpWrap.classList.toggle('disabled', state.model === 'triangular');
  }
  $$('#bandlab .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#bandlab .seg-btn').forEach(x => x.classList.toggle('active', x === b));
    state.model = b.dataset.model;
    syncDisabled(); rebuild();
  }));
  const bind = (id, outId, key) => {
    const el = $(id), out = $(outId);
    el.addEventListener('input', () => { state[key] = parseFloat(el.value); out.textContent = state[key].toFixed(2); rebuild(); });
  };
  bind('#tSlider', '#tOut', 't');
  bind('#dSlider', '#dOut', 'd');
  bind('#tpSlider', '#tpOut', 'tp');
  syncDisabled();
  rebuild();

  // hover readout
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const rkx = $('#rkx'), rky = $('#rky'), rE = $('#rE');
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([upper, lower].filter(m => m.visible), false);
    if (!hits.length) { marker.visible = drop.visible = false; return; }
    const p = hits[0].point;
    const kx = p.x / state.sK, ky = p.z / state.sK;
    const E = p.y / EY + state.mid;
    rkx.textContent = kx.toFixed(2);
    rky.textContent = ky.toFixed(2);
    rE.textContent = (E / state.t).toFixed(3);
    marker.position.copy(p); marker.visible = true;
    drop.geometry.setFromPoints([p, new THREE.Vector3(p.x, floorY, p.z)]);
    drop.computeLineDistances(); drop.visible = true;
  });
  canvas.addEventListener('pointerleave', () => { marker.visible = drop.visible = false; });

  // theme
  function applyTheme(t) {
    const light = t === 'light';
    lineMat.color.set(light ? 0x2a3a66 : 0xffffff);
    lineMat.opacity = light ? 0.25 : 0.22;
    bzMat.color.set(light ? 0xe0a800 : PASTEL.lemon);
    floorGrid.material.opacity = light ? 0.25 : 0.12;
    marker.material.color.set(light ? 0x18213d : 0xffffff);
    drop.material.color.set(light ? 0x18213d : 0xffffff);
  }
  applyTheme(root.dataset.theme);
  window.addEventListener('themechange', e => applyTheme(e.detail));

  // size + render only when visible
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.05 }).observe(stage);
  function loop() {
    if (!visible || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) requestAnimationFrame(loop); });
}

/* =========================================================
   GROUP: 55-atom icosahedral cluster with ligand shell
   ========================================================= */
function initCluster(THREE, OrbitControls, RoomEnvironment) {
  const canvas = $('#clusterCanvas');
  const stage = canvas.parentElement;
  const renderer = makeRenderer(THREE, canvas);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.6, 11);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
  controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 1.4;

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.3); d1.position.set(3, 5, 6); scene.add(d1);
  const pl = new THREE.PointLight(PASTEL.mint, 30, 20); pl.position.set(-4, -2, 3); scene.add(pl);

  const uniq = (geo, r) => {
    const p = geo.attributes.position, seen = new Map();
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i).setLength(r);
      const key = v.toArray().map(x => x.toFixed(3)).join(',');
      if (!seen.has(key)) seen.set(key, v);
    }
    return [...seen.values()];
  };

  const core = [new THREE.Vector3()];
  const shell1 = uniq(new THREE.IcosahedronGeometry(1, 0), 1.05);
  const shell2 = uniq(new THREE.IcosahedronGeometry(1, 1), 2.1);
  const ligands = uniq(new THREE.IcosahedronGeometry(1, 1), 3.05);

  const group = new THREE.Group(); scene.add(group);
  const metal = [...core, ...shell1, ...shell2];
  const atomGeo = new THREE.SphereGeometry(0.42, 32, 18);
  const atomMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.15, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.4 });
  const atoms = new THREE.InstancedMesh(atomGeo, atomMat, metal.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  const cA = new THREE.Color(PASTEL.peach), cB = new THREE.Color(PASTEL.pink), cC = new THREE.Color(PASTEL.lemon);
  metal.forEach((p, i) => {
    m4.compose(p, q, sv.set(1, 1, 1));
    atoms.setMatrixAt(i, m4);
    atoms.setColorAt(i, i === 0 ? cC : i <= 12 ? cB : cA);
  });
  group.add(atoms);

  const ligGeo = new THREE.SphereGeometry(0.2, 20, 12);
  const ligMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const ligs = new THREE.InstancedMesh(ligGeo, ligMat, ligands.length);
  const lc = [new THREE.Color(PASTEL.mint), new THREE.Color(PASTEL.sky)];
  ligands.forEach((p, i) => { m4.compose(p, q, sv.set(1, 1, 1)); ligs.setMatrixAt(i, m4); ligs.setColorAt(i, lc[i % 2]); });
  group.add(ligs);

  // bonds: metal–metal (short) and metal–ligand
  const seg = [];
  for (let i = 0; i < metal.length; i++) for (let j = i + 1; j < metal.length; j++) {
    if (metal[i].distanceTo(metal[j]) < 1.25) seg.push(metal[i], metal[j]);
  }
  ligands.forEach((L, i) => seg.push(L, shell2[i].clone()));
  const bondGeo = new THREE.BufferGeometry().setFromPoints(seg);
  const bondMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  group.add(new THREE.LineSegments(bondGeo, bondMat));

  // breathing pulse on click
  let pulseT = -10;
  const clock = new THREE.Clock();
  canvas.addEventListener('click', () => { pulseT = clock.getElapsedTime(); });

  function applyTheme(t) { bondMat.color.set(t === 'light' ? 0x51618a : 0xffffff); }
  applyTheme(root.dataset.theme);
  window.addEventListener('themechange', e => applyTheme(e.detail));

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.05 }).observe(stage);
  function loop() {
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    const tau = t - pulseT;
    const breathe = 1 + 0.025 * Math.sin(t * 2) + (tau < 3 ? 0.18 * Math.sin(tau * 9) * Math.exp(-tau * 1.6) : 0);
    group.scale.setScalar(breathe);
    group.rotation.x = Math.sin(t * 0.3) * 0.15;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) requestAnimationFrame(loop); });
}
