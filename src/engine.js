// 선언적 3D 뷰어: step 배열을 0..i 까지 재생한 "목표 상태"와 현재 씬을 비교(diff)해서
// 추가/삭제/변경된 파트만 애니메이션합니다. 그래서 앞/뒤/점프 이동이 모두 같은 코드로 동작합니다.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
const circle = (x, y, r, cw) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, TAU, cw); return p; };

const ONE = new THREE.Vector3(1, 1, 1);

function geometry({ s, d, p }) {
  let g;
  if (s === 'box') g = new THREE.BoxGeometry(d[0], d[1], d[2]).translate(0, d[1] / 2, 0);
  else if (s === 'cyl') g = new THREE.CylinderGeometry(d[2], d[0], d[1], 40).translate(0, d[1] / 2, 0);
  else if (s === 'sph') g = new THREE.SphereGeometry(d[0], 20, 14);
  else if (s === 'wire') g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(d[0].map((v) => new THREE.Vector3(...v))), 24, d[1], 6);
  else if (s === 'tube') { // 속이 빈 원통 (shape y → 월드 -z 로 회전되므로 대칭 형상만 사용)
    const sh = new THREE.Shape(); sh.absarc(0, 0, d[0], 0, TAU, false); sh.holes.push(circle(0, 0, d[1], true));
    g = new THREE.ExtrudeGeometry(sh, { depth: d[2], bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2);
  } else if (s === 'slab') { // 구멍 뚫린 판: holes 는 월드 좌표라 판 중심 기준으로 변환
    const [w, h, dp, holes] = d, sh = new THREE.Shape();
    sh.moveTo(-w / 2, -dp / 2); sh.lineTo(w / 2, -dp / 2); sh.lineTo(w / 2, dp / 2); sh.lineTo(-w / 2, dp / 2); sh.closePath();
    holes.forEach(([hx, hz, r]) => sh.holes.push(circle(hx - p[0], -(hz - p[2]), r, true)));
    g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 32 }).rotateX(-Math.PI / 2);
  }
  return g;
}

export function createViewer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d111a');
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight('#ffffff', '#334466', 0.5));
  const sun = new THREE.DirectionalLight('#ffffff', 1.3); sun.position.set(6, 12, 8); scene.add(sun);
  const grid = new THREE.GridHelper(60, 60, '#2a3344', '#171e2b'); grid.position.y = -1.65; scene.add(grid);

  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const ctl = new OrbitControls(cam, canvas);
  ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.495;
  const camGoal = { p: new THREE.Vector3(10, 6, 13), t: new THREE.Vector3(0, 3, 0), busy: false };
  cam.position.copy(camGoal.p); ctl.target.copy(camGoal.t);
  ctl.addEventListener('start', () => (camGoal.busy = false)); // 사용자가 돌리면 자동 카메라 이동 중단

  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height;
    cam.setViewOffset(r.width, r.height, 0, r.height * (r.width > 800 ? 0.16 : 0.28), r.width, r.height); // 하단 설명 카드에 가리지 않도록 장면을 위로 올림
    cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas.parentElement); resize();

  const cur = new Map(); // id → mesh
  const dying = new Set();
  const dispose = (m) => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); m.userData.edge?.material.dispose(); };

  function create(sp, grow, from = 0) {
    const g = geometry(sp);
    const mat = new THREE.MeshStandardMaterial({
      color: sp.c, metalness: sp.mt ? 0.45 : 0, roughness: sp.mt ? 0.4 : 0.5, envMapIntensity: 0.6,
      emissive: sp.em || '#000000', emissiveIntensity: 0.9, transparent: true, opacity: from,
    });
    const m = new THREE.Mesh(g, mat);
    if (sp.s === 'box' || sp.s === 'slab') {
      m.userData.edge = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: '#05070c', transparent: true, opacity: 0 }));
      m.add(m.userData.edge);
    }
    m.position.set(...sp.p);
    if (grow) { // 증착되는 것처럼 아래에서 위로 자람 (구는 커짐, 와이어는 페이드만)
      if (sp.s === 'sph') m.scale.setScalar(0.001); else if (sp.s !== 'wire') m.scale.y = 0.001;
    }
    m.userData.t0 = performance.now() / 1000 + (sp.dl || 0);
    scene.add(m); target(m, sp); return m;
  }
  function target(m, sp) {
    const u = m.userData;
    Object.assign(u, { sp, tp: new THREE.Vector3(...sp.p), tc: new THREE.Color(sp.c), te: new THREE.Color(sp.em || '#000000'), to: sp.o ?? 1 });
  }

  function show(steps, i) {
    // 0..i 재생 → 목표 상태
    const S = new Map(); let cp = null;
    for (let j = 0; j <= i; j++) {
      const s = steps[j]; cp = s.cam || cp;
      for (const k of s.del || []) for (const [id, p] of S) if (id === k || p.g === k) S.delete(id);
      for (const p of s.add || []) S.set(p.id, p);
      for (const [k, v] of Object.entries(s.set || {})) for (const [id, p] of S) if (id === k || p.g === k) S.set(id, { ...p, ...v });
    }
    for (const [id, m] of cur) if (!S.has(id)) { m.userData.to = 0; dying.add(m); cur.delete(id); }
    for (const [id, sp] of S) {
      const m = cur.get(id), same = m && m.userData.sp.s === sp.s && JSON.stringify(m.userData.sp.d) === JSON.stringify(sp.d);
      if (same) { target(m, sp); continue; }
      if (m) { const o = m.material.opacity; dispose(m); cur.set(id, create(sp, false, o)); } // 형상이 바뀌면 즉시 교체
      else cur.set(id, create(sp, true));
    }
    if (cp) { camGoal.p.set(...cp[0]); camGoal.t.set(...cp[1]); camGoal.busy = true; }
  }

  let last = performance.now() / 1000;
  renderer.setAnimationLoop(() => {
    const now = performance.now() / 1000, dt = Math.min(now - last, 0.1); last = now;
    const k = 1 - Math.exp(-dt * 6);
    const step = (m) => {
      const u = m.userData; if (now < u.t0) return;
      const mt = m.material;
      m.position.lerp(u.tp, k); mt.color.lerp(u.tc, k); mt.emissive.lerp(u.te, k);
      mt.opacity += (u.to - mt.opacity) * k;
      m.scale.lerp(ONE, k * 0.8);
      mt.transparent = mt.opacity < 0.995; mt.depthWrite = !mt.transparent;
      if (u.edge) u.edge.material.opacity = mt.opacity * 0.5;
    };
    cur.forEach(step);
    dying.forEach((m) => { step(m); if (m.material.opacity < 0.02) { dying.delete(m); dispose(m); } });
    if (camGoal.busy) {
      const c = 1 - Math.exp(-dt * 2.8);
      cam.position.lerp(camGoal.p, c); ctl.target.lerp(camGoal.t, c);
      if (cam.position.distanceTo(camGoal.p) < 0.02) camGoal.busy = false;
    }
    ctl.update(); renderer.render(scene, cam);
  });

  return { show };
}
