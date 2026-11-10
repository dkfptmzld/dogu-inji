// 색깔큐브 3D 모션그래픽. cube.html?s=1~4 로 장면을 고른다.
//  1 활동 소개 / 2 색깔 찾기 / 3 첫 번째 그림 만들기 / 4 정리 / 5 그림카드 순서(1~8번)
//  6~10 네 글자 이어 말하기: 6 소개 / 7~10 카드 묶음(7·7·7·8장)
// window.frame(t) → PNG(base64), window.TOTAL = 길이(초), window.EVENTS = 효과음 시각 [{t,type}]
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const W = 1920, H = 1080;
const SCN = +(new URLSearchParams(location.search).get('s') || 1);
const FONT = '"Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",sans-serif';
const ACC = '#e8743b', BG = '#f4f1ea';
const COL = { black: '#2a2a2a', red: '#e53935', blue: '#29b6f6', yellow: '#fdd835', green: '#2fa84f', orange: '#fb8c00' };
const NAME = { black: '검정색', red: '빨간색', blue: '파란색', yellow: '노란색', green: '초록색', orange: '주황색' };
const FACES = ['red', 'orange', 'black', 'yellow', 'blue', 'green'];          // 상자 면 순서 +x −x +y −y +z −z
const NORM = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(a => new THREE.Vector3(...a));
const V = (...a) => new THREE.Vector3(...a);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = p => p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const bounce = p => { const n = 7.5625, d = 2.75;
  if (p < 1/d) return n*p*p; if (p < 2/d) return n*(p -= 1.5/d)*p + .75; if (p < 2.5/d) return n*(p -= 2.25/d)*p + .9375; return n*(p -= 2.625/d)*p + .984375; };
const win = (t, a, b, f = 0.3) => clamp((t - a) / f) * (1 - clamp((t - (b - f)) / f));   // a~b 동안 보이고 앞뒤로 서서히

// ───────── 장면 기본 ─────────
const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.95;
const scene = new THREE.Scene(); scene.background = new THREE.Color(BG);
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
scene.add(new THREE.HemisphereLight('#ffffff', '#cdbfa8', 1.6));
const sun = new THREE.DirectionalLight('#fffaf0', 2.4); sun.position.set(-6, 14, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.radius = 6;
scene.add(sun);
// 탁자: 밝은 나무색 + 은은한 결
function tableTex() { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#e7dccb'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(150,120,80,${0.03 + Math.random() * 0.05})`; g.lineWidth = 1 + Math.random() * 3;
    g.beginPath(); const y = Math.random() * 1024; g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 140 + i) * 6); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t; }
const table = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: tableTex(), roughness: 0.92 }));
table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);

// ───────── 큐브 ─────────
function faceTex(color) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#e2bf8a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(140,95,45,${0.06 + Math.random() * 0.08})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + 6, 170, y - 6, 256, y + 3); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(128, 131, 104, 0, Math.PI * 2); g.fill();
  g.fillStyle = COL[color]; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fill();
  const hl = g.createRadialGradient(95, 90, 5, 110, 110, 110); hl.addColorStop(0, 'rgba(255,255,255,0.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const MATS = FACES.map(f => new THREE.MeshStandardMaterial({ map: faceTex(f), roughness: 0.6 }));
const CUBE_GEO = new RoundedBoxGeometry(1, 1, 1, 4, 0.09);
function upQuat(color, yaw = 0) { const i = FACES.indexOf(color);
  const q = new THREE.Quaternion().setFromUnitVectors(NORM[i], V(0, 1, 0));
  return new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw).multiply(q); }
function makeCube() { const m = new THREE.Mesh(CUBE_GEO, MATS.map(x => x.clone())); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
function glow(m, a) { m.material.forEach(x => x.emissive.setRGB(a * 0.35, a * 0.25, a * 0.1)); }

// ───────── 그림 카드 ─────────
const SP = 1.06;                                       // 큐브 간격
function cardTex(pat, hlCol = -1) { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 1024);
  const m = 70, s = (1024 - 2 * m) / 4; g.strokeStyle = '#d9d9d9'; g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(m + i * s, m); g.lineTo(m + i * s, 1024 - m); g.stroke(); g.beginPath(); g.moveTo(m, m + i * s); g.lineTo(1024 - m, m + i * s); g.stroke(); }
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { g.fillStyle = COL[pat[r][k]]; g.beginPath(); g.arc(m + (k + .5) * s, m + (r + .5) * s, s * 0.4, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const CARD = 4.4, CARD_T = 0.05;
function makeCard(pat, pages = 4) { const grp = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.85 });
  for (let i = 0; i < pages; i++) { const p = new THREE.Mesh(new RoundedBoxGeometry(CARD, CARD_T, CARD, 2, 0.02), paper);
    p.position.set(i * 0.025, CARD_T / 2 + i * CARD_T, -i * 0.02); p.castShadow = p.receiveShadow = true; grp.add(p); }
  const topY = pages * CARD_T + 0.002;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(CARD - 0.12, CARD - 0.12), new THREE.MeshStandardMaterial({ map: cardTex(pat), roughness: 0.8 }));
  face.rotation.x = -Math.PI / 2; face.position.set((pages - 1) * 0.025, topY, -(pages - 1) * 0.02); grp.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 12, 40), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.9, roughness: 0.25 }));
  ring.position.set(-CARD / 2 + 0.3, topY / 2 + 0.05, -CARD / 2 + 0.3); ring.rotation.y = Math.PI / 4; ring.castShadow = true; grp.add(ring);
  grp.userData = { face, topY, pages }; scene.add(grp); return grp; }
function cellPos(gx, gz, r, k) { return V(gx + (k - 1.5) * SP, 0.5, gz + (r - 1.5) * SP); }
function guideGrid(gx, gz) { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.strokeStyle = 'rgba(120,100,80,0.45)'; g.lineWidth = 5; g.setLineDash([18, 12]);
  const s = 512 / 4; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { g.beginPath(); g.roundRect(k * s + 8, r * s + 8, s - 16, s - 16, 14); g.stroke(); }
  const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(4 * SP, 4 * SP), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(gx, 0.005, gz); scene.add(m); return m; }

// ───────── 주머니 ─────────
function makePouch(x, z) { const grp = new THREE.Group();
  const prof = [[0.01,0],[1.0,0.04],[1.45,0.35],[1.62,0.95],[1.55,1.6],[1.25,2.1],[1.0,2.35],[1.12,2.55],[1.3,2.72]].map(([r, y]) => new THREE.Vector2(r, y));
  const cloth = new THREE.MeshStandardMaterial({ color: '#d7262b', roughness: 0.75, side: THREE.DoubleSide });
  const lg = new THREE.LatheGeometry(prof, 96), pa = lg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x);
    const w = y > 1.9 ? 1 + 0.09 * Math.sin(a * 16) * clamp((y - 1.9) / 0.5) : 1 + 0.025 * Math.sin(a * 5 + y * 3);   // 입구 주름 + 몸통 구김
    pa.setX(i, x * w); pa.setZ(i, z * w); }
  lg.computeVertexNormals();
  const bag = new THREE.Mesh(lg, cloth); bag.castShadow = bag.receiveShadow = true; grp.add(bag);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), new THREE.MeshStandardMaterial({ color: '#4a0a0c', roughness: 1 }));
  hole.rotation.x = -Math.PI / 2; hole.position.y = 2.3; grp.add(hole);
  const cordM = new THREE.MeshStandardMaterial({ color: '#a8151b', roughness: 0.6 });
  const cord = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.06, 10, 48), cordM); cord.rotation.x = Math.PI / 2; cord.position.y = 2.36; grp.add(cord);
  const path = new THREE.CatmullRomCurve3([V(0.9, 2.36, 0.6), V(1.5, 2.0, 1.2), V(1.7, 0.9, 1.5), V(2.1, 0.06, 1.9)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(path, 30, 0.055, 8), cordM));
  grp.position.set(x, 0, z); scene.add(grp); return grp; }

// ───────── 2D 덧그림 (글씨·화살표) ─────────
const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
function proj(v) { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function pill(text, x, y, alpha, opt = {}) { if (alpha <= 0) return; const fs = opt.size || 58;
  g.save(); g.globalAlpha = alpha; g.font = `900 ${fs}px ${FONT}`; const sw = opt.swatch ? fs * 0.9 : 0;
  const w = g.measureText(text).width + 90 + (sw ? sw + 18 : 0), h = fs * 1.75;
  g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 18; g.shadowOffsetY = 5; g.fillStyle = opt.bg || ACC;
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.shadowColor = 'transparent';
  if (opt.border) { g.lineWidth = 6; g.strokeStyle = opt.border; g.stroke(); }
  let tx = x; if (sw) { const cx = x - w / 2 + 45 + sw / 2; g.fillStyle = opt.swatch; g.beginPath(); g.arc(cx, y, sw / 2, 0, Math.PI * 2); g.fill();
    g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); tx = x + (sw + 18) / 2; }
  g.fillStyle = opt.color || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, tx, y + 3); g.restore(); }
function title(text, alpha) { pill(text, W / 2, 86, alpha); }
function badge(text, alpha) { pill(text, W / 2, H - 92, alpha, { size: 66 }); }
function numberAt(v, n, alpha, s = 1) { if (alpha <= 0) return; const [x, y] = proj(v); g.save(); g.globalAlpha = alpha;
  g.translate(x, y); g.scale(s, s); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 54, 0, Math.PI * 2); g.fill();
  g.shadowColor = 'transparent'; g.lineWidth = 7; g.strokeStyle = ACC; g.stroke(); g.fillStyle = '#1f2a37'; g.font = `900 60px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, 4); g.restore(); }
function outline3D(cx, cz, w, d, y, alpha, t) { if (alpha <= 0) return; const pts = [V(cx - w/2, y, cz - d/2), V(cx + w/2, y, cz - d/2), V(cx + w/2, y, cz + d/2), V(cx - w/2, y, cz + d/2)].map(proj);
  g.save(); g.globalAlpha = alpha * (0.7 + 0.3 * Math.sin(t * 7)); g.lineJoin = 'round';
  for (const [lw, col] of [[18, 'rgba(255,255,255,0.9)'], [9, ACC]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); }
  g.restore(); }
function arrow2D(x0, y0, x1, y1, alpha) { if (alpha <= 0) return; const ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
  g.save(); g.globalAlpha = alpha; g.translate(x1, y1); g.rotate(ang + Math.PI); const sw = 24, hw = 64, hl = 66;
  const path = () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(hl, -hw / 2); g.lineTo(hl, -sw / 2); g.lineTo(L, -sw / 2); g.lineTo(L, sw / 2); g.lineTo(hl, sw / 2); g.lineTo(hl, hw / 2); g.closePath(); };
  g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 12; path(); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#fff'; g.stroke();
  g.shadowColor = 'transparent'; path(); g.fillStyle = ACC; g.fill(); g.restore(); }
function fade(a) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.fillStyle = BG; g.fillRect(0, 0, W, H); g.restore(); }

// ───────── 도안 ─────────
const P_INTRO = Array.from({ length: 4 }, () => ['blue', 'orange', 'yellow', 'green']);
const P_ONE = Array.from({ length: 4 }, () => ['black', 'red', 'red', 'black']);
const P_LAST = [['black','red','green','orange'],['green','blue','black','yellow'],['orange','red','orange','blue'],['red','yellow','black','green']];
const EVENTS = []; const ev = (t, type, p = 0) => EVENTS.push({ t: +t.toFixed(3), type, p });

// ═════════ 1. 활동 소개 ═════════
function scene1() { camera.position.set(0, 9.2, 7.6); camera.lookAt(0.15, 0, 0.35);
  const GX = -2.75, CX = 2.95, card = makeCard(P_INTRO); card.position.set(CX, 0, 0); guideGrid(GX, 0);
  const cubes = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const m = makeCube(); m.userData = { home: cellPos(GX, 0, r, k), q: upQuat(P_INTRO[r][k], (Math.random() - .5) * 0.08) }; cubes.push(m); }
  const D0 = 1.2, STEP = 0.42, FALL = 0.55, DONE = D0 + 16 * STEP + FALL, T = DONE + 6.2;
  cubes.forEach((m, i) => ev(D0 + i * STEP + FALL * 0.75, 'tok', i)); ev(DONE + 0.3, 'ding');
  return { T, frame(t) {
    cubes.forEach((m, i) => { const p = clamp((t - (D0 + i * STEP)) / FALL); m.visible = p > 0; const h = m.userData.home;
      m.position.set(h.x, h.y + 4.5 * (1 - bounce(p)), h.z); m.quaternion.copy(m.userData.q); });
    renderer.render(scene, camera); g.drawImage(cv, 0, 0);
    title('카드 그림과 똑같이 블록 색깔을 맞춰요', win(t, 0.2, T - 0.9));
    const [ax, ay] = proj(V(CX - 2.5, 0.2, 0)), [bx, by] = proj(V(GX + 2.3, 0.2, 0));
    arrow2D(ax, ay, bx, by, win(t, DONE + 0.4, T - 1.2) * 0.95);
    badge('그림과 똑같나요?', win(t, DONE + 0.6, T - 1.0));
    fade(1 - clamp(t / 0.5)); fade(clamp((t - (T - 0.7)) / 0.7)); } }; }

// ═════════ 2. 색깔 찾기 ═════════
function scene2() { camera.position.set(0, 3.6, 4.6); camera.lookAt(0, 1.05, 0);
  const TILT = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.75);   // 들어 올릴 때 윗면이 화면을 보도록
  const cube = makeCube(), red = makeCube(); red.visible = false;
  const ORDER = ['black', 'red', 'blue', 'yellow', 'green', 'orange']; const D = ORDER.map(c => c === 'orange' ? 9.4 : 6.4);   // 색 하나당 문구 약 5초 (현장 피드백: 3초는 빠름)
  const ST = D.reduce((a, d, i) => (a.push(i ? a[i - 1] + D[i - 1] : 0.5), a), []); const T = ST[5] + D[5] + 0.6;
  ORDER.forEach((c, i) => { ev(ST[i], 'whoosh'); ev(ST[i] + 1.25, 'pop', i); }); ev(ST[5] + 2.6, 'pop', 6);
  return { T, frame(t) {
    let i = 0; while (i < 5 && t >= ST[i + 1]) i++; const tt = t - ST[i], col = ORDER[i], prev = ORDER[(i + 5) % 6];
    const q0 = upQuat(prev, 0.35), q1 = upQuat(col, 0.35), pr = ease(clamp(tt / 0.85));
    cube.quaternion.copy(q0).slerp(q1, pr);
    const lift = ease(clamp((tt - 0.95) / 0.6)) * (1 - ease(clamp((tt - (D[i] - 0.9)) / 0.7)));
    let x = 0; const isO = col === 'orange';
    if (isO) { const s = ease(clamp((tt - 2.2) / 0.7)) * (1 - ease(clamp((tt - (D[i] - 1.1)) / 0.6))); x = 1.25 * s;
      red.visible = s > 0.01; red.scale.setScalar(Math.max(0.01, s)); red.quaternion.copy(upQuat('red', -0.35)); red.position.set(-1.25 * s, 0.5 + 1.1 * lift, 0); }
    else red.visible = false;
    if (t < ST[0]) { cube.quaternion.copy(upQuat('orange', 0.35)); }
    cube.quaternion.premultiply(new THREE.Quaternion().slerp(TILT, lift));
    if (red.visible) red.quaternion.premultiply(new THREE.Quaternion().slerp(TILT, lift));
    cube.position.set(x, 0.5 + Math.sin(pr * Math.PI) * 0.35 + 1.1 * lift, 0);
    renderer.render(scene, camera); g.drawImage(cv, 0, 0);
    const a = win(tt, 1.0, D[i] - 0.5);
    pill(NAME[col], W / 2, 92, a, { swatch: COL[col], size: 70, bg: '#ffffff', color: '#1f2a37', border: COL[col] === COL.black ? '#555' : COL[col] });
    badge(NAME[col] + '을 찾아 높이 들어 주세요', a);
    if (isO) { const b = win(tt, 2.8, D[i] - 1.0);
      const [rx, ry] = proj(red.position.clone().add(V(0, 0.9, 0))), [ox, oy] = proj(cube.position.clone().add(V(0, 0.9, 0)));
      pill('빨간색', rx, ry - 30, b, { size: 44, bg: '#fff', color: '#1f2a37', border: COL.red });
      pill('주황색', ox, oy - 30, b, { size: 44, bg: '#fff', color: '#1f2a37', border: COL.orange });
      pill('빨간색과 헷갈리지 않게 잘 보세요!', W / 2, H - 210, b, { size: 46, bg: '#1f2a37' }); }
    fade(1 - clamp(t / 0.5)); fade(clamp((t - (T - 0.6)) / 0.6)); } }; }

// ═════════ 3. 첫 번째 그림 만들기 ═════════
function scene3() { camera.position.set(0, 9.2, 7.6); camera.lookAt(0.15, 0, 0.35);
  const GX = -2.75, CX = 2.95, card = makeCard(P_ONE); card.position.set(CX, 0, 0); guideGrid(GX, 0);
  const TXT = ['검정색 4개를 세로로 맞춰요', '빨간색 4개를 옆에 맞춰요', '빨간색 4개를 그 옆에 맞춰요', '마지막으로 검정색 4개를 맞춰요'];
  const cubes = []; for (let k = 0; k < 4; k++) for (let r = 0; r < 4; r++) { const m = makeCube(); m.userData = { home: cellPos(GX, 0, r, k), q: upQuat(P_ONE[r][k], (Math.random() - .5) * 0.08), k, r }; cubes.push(m); }
  const C0 = 0.8, CD = 5.6, HL = 1.3, ARR = 1.0, FLY = 0.75, END = C0 + 4 * CD, T = END + 4.4;
  cubes.forEach(m => { const { k, r } = m.userData; ev(C0 + k * CD + HL + r * ARR + FLY, 'tok', k * 4 + r); });
  for (let k = 0; k < 4; k++) ev(C0 + k * CD, 'pop', k); ev(END + 0.2, 'ding');
  return { T, frame(t) {
    const kk = Math.min(3, Math.floor((t - C0) / CD)), tt = t - C0 - kk * CD;
    cubes.forEach(m => { const { k, r, home, q } = m.userData; const t0 = C0 + k * CD + HL + r * ARR, p = clamp((t - t0) / FLY);
      m.visible = t >= t0; const from = V(home.x, 0.5, 6.8), e = easeOut(p);
      m.position.copy(from.lerp(home, e)); m.position.y = 0.5 + Math.sin(p * Math.PI) * 1.4; m.quaternion.copy(q); glow(m, 0); });
    renderer.render(scene, camera); g.drawImage(cv, 0, 0);
    if (t >= C0 && t < END) { const a = win(tt, 0, CD - 0.2, 0.3);
      const cx = CX + (kk - 1.5) * ((CARD - 0.6) / 4); outline3D(cx, 0, (CARD - 0.6) / 4 + 0.05, CARD - 0.5, 0.22, a, t);
      outline3D(GX + (kk - 1.5) * SP, 0, SP, 4 * SP, 0.02, a * 0.9, t);
      title(TXT[kk], a);
      cubes.filter(m => m.userData.k === kk).forEach(m => { const t1 = C0 + kk * CD + HL + m.userData.r * ARR + FLY;
        const s = clamp((t - t1) / 0.2); numberAt(m.userData.home.clone().add(V(0, 0.6, 0)), m.userData.r + 1, s * (1 - clamp((t - t1 - 0.9) / 0.3)), 0.8 + 0.2 * s); }); }
    badge('완성! 그림과 똑같나요?', win(t, END + 0.1, T - 0.8));
    fade(1 - clamp(t / 0.5)); fade(clamp((t - (T - 0.7)) / 0.7)); } }; }

// ═════════ 4. 정리 ═════════
function scene4() { camera.position.set(0.5, 11.8, 9.0); camera.lookAt(0.5, 0, 0.45);
  const GX = -4.1, CX = 0.75, PX = 5.5, PZ = -0.2;
  const card = makeCard(P_ONE, 8); card.position.set(CX, 0, 0);
  const top = new THREE.Group(); const tp = new THREE.Mesh(new THREE.BoxGeometry(CARD, 0.02, CARD), new THREE.MeshStandardMaterial({ color: '#f4f4f4', emissive: '#9a9a9a', roughness: 0.85 }));
  const tf = new THREE.Mesh(new THREE.PlaneGeometry(CARD - 0.12, CARD - 0.12), new THREE.MeshStandardMaterial({ map: cardTex(P_LAST), roughness: 0.8, transparent: true }));
  tf.rotation.x = -Math.PI / 2; tf.position.y = 0.011; tp.castShadow = true; tp.position.z = CARD / 2; tf.position.z = CARD / 2;
  top.add(tp, tf); top.position.set(CX + 0.1, card.userData.topY + 0.012, -CARD / 2 - 0.08); scene.add(top);
  const pouch = makePouch(PX, PZ); const MOUTH = V(PX, 2.6, PZ);
  const cubes = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const m = makeCube(); m.userData = { home: cellPos(GX, 0, r, k), q: upQuat(P_LAST[r][k], (Math.random() - .5) * 0.08) }; cubes.push(m); }
  // 현장 피드백(김유천 대리): 어르신들이 블록 세기에만 집중해 카드 순서를 안 맞추고 담음
  // → ① 카드를 첫 장으로 넘겨(크게·길게 강조) 먼저 주머니에 넣고, ② 그다음 블록 16개를 센다. 카드는 8장.
  const FL0 = 2.4, FL = 2.4, HOLD0 = FL0 + FL + 0.2, HOLD1 = HOLD0 + 5.0, ZO = 1.4;
  const CARD0 = HOLD1 + 0.9, CARDD = 1.9, K0 = CARD0 + CARDD + 1.2, KD = 0.95, KEND = K0 + 16 * KD, T = KEND + 4.4;
  ev(FL0, 'whoosh'); ev(HOLD0, 'ding'); ev(CARD0, 'whoosh'); ev(CARD0 + CARDD, 'pop');
  cubes.forEach((m, i) => { ev(K0 + i * KD, 'count', i); ev(K0 + i * KD + 0.7, 'tok', i); }); ev(KEND + 0.4, 'ding');
  const camW = [V(0.5, 11.8, 9.0), V(0.5, 0, 0.45)], camC = [V(CX + 0.4, 8.0, 6.4), V(CX + 0.2, 0, 0.0)];
  return { T, frame(t) {
    const z = ease(clamp((t - HOLD1) / ZO));                                 // 카드 클로즈업 → 전체 화면
    camera.position.copy(camC[0]).lerp(camW[0], z); camera.lookAt(camC[1].clone().lerp(camW[1], z)); camera.updateMatrixWorld();
    const fp = ease(clamp((t - FL0) / FL)); top.rotation.x = -Math.PI * fp; top.visible = fp < 0.97; tf.material.opacity = 1 - clamp((fp - 0.75) / 0.25);
    cubes.forEach((m, i) => { const t0 = K0 + i * KD, p = clamp((t - t0 - 0.15) / 0.6), h = m.userData.home;
      const e = ease(p), pos = h.clone().lerp(MOUTH, e); pos.y = h.y + (MOUTH.y - h.y) * e + Math.sin(p * Math.PI) * 2.6;
      m.position.copy(pos); m.quaternion.copy(m.userData.q); const sc = 1 - 0.55 * clamp((p - 0.7) / 0.3); m.scale.setScalar(sc);
      m.visible = p < 1; glow(m, t >= t0 - 0.15 && t < t0 + 0.2 ? 1 : 0); });
    const cp = ease(clamp((t - CARD0) / CARDD)); const cpos = V(CX, 0, 0).lerp(V(PX, 2.4, PZ), cp); cpos.y += Math.sin(cp * Math.PI) * 2.2;
    card.position.copy(cpos); card.scale.setScalar(1 - 0.85 * clamp((cp - 0.55) / 0.45)); card.visible = cp < 1;
    renderer.render(scene, camera); g.drawImage(cv, 0, 0);
    const TOPY = card.userData.topY + 0.06;
    title('지금 맨 위는 마지막 그림이에요', win(t, 0.3, FL0));
    title('① 먼저 그림카드를 첫 장으로 넘겨요', win(t, FL0, HOLD0));
    const ha = win(t, HOLD0, HOLD1 + 0.3);
    outline3D(CX, 0, CARD - 0.05, CARD - 0.05, TOPY, ha, t);
    title('✔ 첫 번째 그림이 맨 위로!', ha);
    badge('첫 번째 그림이 맨 위에 와야 다음 시간에 안 헷갈려요', win(t, HOLD0 + 0.6, HOLD1 + 0.3));
    title('① 그림카드를 먼저 복주머니에 넣어요', win(t, HOLD1 + 0.3, K0 - 0.4));
    title('② 블록을 하나씩 세면서 복주머니에 담아요', win(t, K0 - 0.4, KEND + 0.4));
    cubes.forEach((m, i) => { const t0 = K0 + i * KD; const s = clamp((t - t0) / 0.15);
      numberAt(m.userData.home.clone().add(V(0, 0.9, 0)), i + 1, s * (1 - clamp((t - t0 - 0.75) / 0.2)), 0.85 + 0.25 * s); });
    const n = cubes.filter((m, i) => t >= K0 + i * KD + 0.75).length;
    if (t >= K0) pill(`담은 블록 ${n}개 / 16개`, W - 330, H - 92, win(t, K0, T - 0.8), { size: 46, bg: '#1f2a37' });
    badge('정리 끝! 잘하셨어요', win(t, KEND + 0.4, T - 0.8));
    fade(1 - clamp(t / 0.5)); fade(clamp((t - (T - 0.7)) / 0.7)); } }; }

// ═════════ 5. 그림카드 순서 (실제 카드 사진에서 옮김, 1번 → 8번) ═════════
const P_ALL = [P_ONE, P_INTRO,
  [['green','red','red','green'],['red','green','green','red'],['red','green','green','red'],['green','red','red','green']],
  [['orange','blue','blue','orange'],['orange','orange','orange','orange'],['orange','green','black','orange'],['orange','red','yellow','orange']],
  [['green','red','red','yellow'],['black','green','yellow','red'],['black','yellow','green','red'],['yellow','black','black','green']],
  [['green','black','black','green'],['red','blue','orange','red'],['red','yellow','green','red'],['green','black','black','green']],
  [['orange','black','red','green'],['black','orange','green','red'],['red','blue','yellow','black'],['blue','red','black','yellow']],
  P_LAST];
function scene5() { camera.position.set(0, 13.0, 5.6); camera.lookAt(0, 0, 0.75);
  const S = 0.6, HALF = CARD * S / 2, pos = P_ALL.map((_, i) => V((i % 4 - 1.5) * 3.3, 0, i < 4 ? -1.35 : 2.25));
  const cards = P_ALL.map((p, i) => { const c = makeCard(p, 1); c.scale.setScalar(S); return c; });
  const D0 = 1.4, STEP = 1.5, FALL = 0.55, DONE = D0 + 7 * STEP + FALL, HL = DONE + 0.8, T = HL + 6.0;
  cards.forEach((c, i) => ev(D0 + i * STEP + FALL * 0.8, 'pop', i)); ev(HL, 'ding');
  return { T, frame(t) {
    cards.forEach((c, i) => { const p = clamp((t - (D0 + i * STEP)) / FALL); c.visible = p > 0;
      c.position.copy(pos[i]); c.position.y = 3.5 * (1 - easeOut(p)); c.rotation.y = (1 - easeOut(p)) * 0.4; });
    renderer.render(scene, camera); g.drawImage(cv, 0, 0);
    title('그림카드 순서를 알아봐요 (1번 → 8번)', win(t, 0.3, HL));
    cards.forEach((c, i) => { const s = clamp((t - (D0 + i * STEP + FALL * 0.6)) / 0.25);
      numberAt(pos[i].clone().add(V(-HALF, 0.3, -HALF)), i + 1, s, 0.8 + 0.25 * s); });
    const a = win(t, HL, T - 0.6);
    outline3D(pos[0].x, pos[0].z, CARD * S + 0.15, CARD * S + 0.15, 0.1, a, t);
    title('항상 1번 그림부터 시작해요', a);
    badge('정리할 때도 1번이 맨 위로 오게 해요', win(t, HL + 0.8, T - 0.6));
    fade(1 - clamp(t / 0.5)); fade(clamp((t - (T - 0.7)) / 0.7)); } }; }
// ═════════ 네 글자 이어 말하기 (2주차 2번째) — 6 소개 / 7~10 카드 묶음 ═════════
// 사진(네 글자 이어 말하기\KakaoTalk_20261102_234932392*.jpg) 순서 그대로. 정답은 넣지 않음(강사님이 직접).
const WORDS = ['일기','코스','감언','전화','세종','고추','요리','청양','연탄','숯불','대한','연지','만리','동문','구사',
  '이심','군고','개과','군밤','스케','동거','배드','선글','호루','오토','남녀','배추','주간','만세'];
const GROUPS = [[0, 7], [7, 14], [14, 21], [21, 29]];
const CW = 6.2, CH = 4.2, LX = [0.17, 0.37, 0.62, 0.82];          // 카드 크기, 글자 4칸의 가로 위치(비율)
function wordTex(w) { const c = document.createElement('canvas'); c.width = 1480; c.height = 1000; const g = c.getContext('2d');
  g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, 1480, 1000);
  const sh = g.createLinearGradient(0, 0, 1480, 1000); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.0)');
  sh.addColorStop(0.5, 'rgba(225,232,240,0.35)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, 1480, 1000);   // 코팅 반사
  const OR = '#ef8a4c', LN = '#1d1d1d';
  g.font = `900 360px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  [...w].forEach((ch, i) => { g.save(); g.translate(LX[i] * 1480, 520); g.scale(0.74, 1.05);      // 사진 카드처럼 좁고 긴 글자
    g.lineWidth = 20; g.strokeStyle = LN; g.strokeText(ch, 0, 0); g.fillStyle = OR; g.fillText(ch, 0, 0); g.restore(); });
  for (const f of [LX[2], LX[3]]) { const x = f * 1480, y = 515;              // ○○ : 사진처럼 길쭉한 주황 고리
    g.beginPath(); g.ellipse(x, y, 118, 205, 0, 0, Math.PI * 2); g.ellipse(x, y, 62, 140, 0, 0, Math.PI * 2, true);
    g.fillStyle = OR; g.fill('evenodd'); g.lineWidth = 9; g.strokeStyle = LN;
    g.beginPath(); g.ellipse(x, y, 118, 205, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(x, y, 62, 140, 0, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function makeWordCard(w) { const grp = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(CW, 0.04, CH, 2, 0.015), new THREE.MeshStandardMaterial({ color: '#eef1f3', roughness: 0.3 }));
  body.position.y = 0.02; body.castShadow = body.receiveShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.16, CH - 0.16), new THREE.MeshStandardMaterial({ map: wordTex(w), roughness: 0.32 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.042; grp.add(body, face); scene.add(grp); return grp; }
const cardPt = (grp, f, dz = 0) => V(grp.position.x + (f - 0.5) * CW, 0.1, grp.position.z + dz);
function timerRing(x, y, frac, n, alpha) { if (alpha <= 0) return; g.save(); g.globalAlpha = alpha; const R = 70;
  g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, R + 14, 0, Math.PI * 2); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 16; g.strokeStyle = '#eadfce'; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = ACC; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); g.stroke();
  g.fillStyle = '#1f2a37'; g.font = `900 78px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + 4); g.restore(); }

// 손 들기 그림(2D): 손바닥 + 손가락, 살짝 흔들림
function handUp(x, y, alpha, tt, s = 1) { if (alpha <= 0) return; g.save(); g.globalAlpha = alpha; g.translate(x, y + 30 * (1 - easeOut(clamp(tt / 0.5))));
  g.scale(s, s); g.rotate(Math.sin(tt * 6) * 0.12); g.lineJoin = 'round'; g.lineCap = 'round';
  const skin = '#f6c9a0', ln = '#7a4a2a';
  const shape = () => { g.beginPath(); g.roundRect(-60, -20, 120, 130, 40);
    [[-48, -95, 26, 100], [-18, -125, 28, 130], [14, -118, 28, 122], [44, -90, 26, 95]].forEach(([fx, fy, fw, fh]) => g.roundRect(fx - fw / 2, fy, fw, fh, fw / 2));
    g.save(); g.translate(-62, 40); g.rotate(-0.7); g.roundRect(-14, -70, 28, 80, 14); g.restore(); };
  g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 16; g.fillStyle = skin; shape(); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 6; g.strokeStyle = ln; shape(); g.stroke();
  g.fillStyle = '#5b8def'; g.beginPath(); g.roundRect(-58, 105, 116, 70, 16); g.fill(); g.stroke(); g.restore(); }
function scene6() {
  const HL1 = 2.2, HL2 = 6.2, SAY = 10.2, T = 15.0; ev(0.5, 'whoosh'); ev(HL1, 'pop', 0); ev(HL2, 'pop', 3); ev(SAY, 'ding');
  return { T, frame(t) { plainBG();
    bigWord('허수', W / 2 + 900 * (1 - easeOut(clamp((t - 0.5) / 0.6))), clamp((t - 0.5) / 0.6), 0.85);
    title('네 글자 이어 말하기', win(t, 0.3, HL1));
    title('① 앞의 두 글자를 봐요', win(t, HL1, HL2));
    title('② 뒤에 올 두 글자를 머릿속으로 생각해요', win(t, HL2, SAY));
    title('③ 생각나면 손을 높이 들어 발표해요!', win(t, SAY, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// 화면 가득 큰 글자 (사용자 요청: 3D 카드 없이 글자만 크게)
function bigWord(w, cx, alpha, s = 1) { if (alpha <= 0) return; const OR = '#ef8a4c', LN = '#1d1d1d', SP2 = 410 * s, Y = H / 2 + 20;
  g.save(); g.globalAlpha = alpha; g.lineJoin = 'round'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${500 * s}px ${FONT}`;
  [...w].forEach((ch, i) => { g.save(); g.translate(cx + (i - 1.5) * SP2, Y); g.scale(0.8, 1.05);
    g.lineWidth = 26 * s; g.strokeStyle = LN; g.strokeText(ch, 0, 0); g.fillStyle = OR; g.fillText(ch, 0, 0); g.restore(); });
  for (const i of [2, 3]) { const x = cx + (i - 1.5) * SP2, y = Y - 8 * s, outer = [150 * s, 250 * s], inner = [80 * s, 172 * s];
    g.beginPath(); g.ellipse(x, y, outer[0], outer[1], 0, 0, Math.PI * 2); g.ellipse(x, y, inner[0], inner[1], 0, 0, Math.PI * 2, true); g.fillStyle = OR; g.fill('evenodd');
    g.lineWidth = 11 * s; g.strokeStyle = LN; g.beginPath(); g.ellipse(x, y, outer[0], outer[1], 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(x, y, inner[0], inner[1], 0, 0, Math.PI * 2); g.stroke(); }
  g.restore(); }
function plainBG() { g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, W, H); }

function sceneWords(gi) {
  const [a, b] = GROUPS[gi], list = WORDS.slice(a, b);
  const IN = 0.6, THINK = 5, HOLD = 2.0, OUT = 0.5, PER = IN + THINK + HOLD + OUT, S0 = 0.5, T = S0 + list.length * PER + 0.6;
  list.forEach((_, i) => { const s = S0 + i * PER; ev(s, 'whoosh'); ev(s + IN + THINK, 'pop', i); });
  return { T, frame(t) { plainBG();
    list.forEach((w, i) => { const s = S0 + i * PER; if (t < s || t > s + PER) return;
      const pin = easeOut(clamp((t - s) / IN)), pout = ease(clamp((t - (s + PER - OUT)) / OUT));
      bigWord(w, W / 2 + 900 * (1 - pin) - 900 * pout, Math.min(pin, 1 - pout)); });
    const i = Math.max(0, Math.min(list.length - 1, Math.floor((t - S0) / PER))), tt = t - S0 - i * PER;
    pill(`${a + i + 1} / ${WORDS.length}`, 140, 80, 1, { size: 40, bg: '#1f2a37' });
    const th = clamp((tt - IN) / THINK);                                             // 생각 시간: 아래 가는 막대
    g.fillStyle = '#ece5d8'; g.fillRect(360, H - 70, W - 720, 16); g.fillStyle = ACC; g.fillRect(360, H - 70, (W - 720) * th, 16);
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

const S = [null, scene1, scene2, scene3, scene4, scene5, scene6, () => sceneWords(0), () => sceneWords(1), () => sceneWords(2), () => sceneWords(3)][SCN]();
window.TOTAL = S.T; window.EVENTS = EVENTS;
window.frame = t => { g.clearRect(0, 0, W, H); S.frame(t); return out.toDataURL('image/png').split(',')[1]; };
document.fonts.load(`900 60px ${FONT}`).then(() => { document.title = 'done'; });
