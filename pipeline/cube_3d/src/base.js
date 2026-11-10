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
