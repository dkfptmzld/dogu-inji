// ═════════ 8~10주차: 산가지(8-2) · 스트로우 블록(9-1) · 매듭풀기(9-2) · 고리블록(10-2) ═════════
// 빌드: base.js + 이 파일 → w810.js → esbuild → w810.bundle.js, w810.html?s=번호
// 내용은 김유천 대리님 카톡(2026-11-23) 영상·설명을 따랐다. 손은 넣지 않고 물건이 스스로 움직이며 글씨로 안내(지오보드와 같은 방식).

const EVENTS = []; const ev = (t, type, p = 0) => EVENTS.push({ t: +t.toFixed(3), type, p });
const ez = (t, a, d) => ease(clamp((t - a) / d));
function arcMove(o, from, to, p, h = 1.5) { o.position.copy(from).lerp(to, p); o.position.y += Math.sin(p * Math.PI) * h; }
function setCam(pos, look) { camera.position.copy(pos); camera.lookAt(look); camera.updateMatrixWorld(); }
function render3D() { renderer.render(scene, camera); g.drawImage(cv, 0, 0); }
const mat = (color, r = 0.5, m = 0) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });
function recolorPouch(p, cloth, hole, cord) { p.children[0].material = p.children[0].material.clone(); p.children[0].material.color.set(cloth);
  p.children[1].material = p.children[1].material.clone(); p.children[1].material.color.set(hole);
  for (const i of [2, 3]) { p.children[i].material = p.children[i].material.clone(); p.children[i].material.color.set(cord); } return p; }
const yellowPouch = (x, z) => recolorPouch(makePouch(x, z), '#f2cf1d', '#5a4a08', '#c9a512');

// ───────── 산가지 막대기 ─────────
const STICK_C = ['#f06292', '#42a5f5', '#fdd835', '#66bb6a', '#ef5350', '#ab47bc', '#ffa726'];
const STICK_L = 4.4, STICK_T = 0.15;
const STICK_GEO = new RoundedBoxGeometry(STICK_L, STICK_T, STICK_T, 2, 0.03);
function makeStick(i) { const m = new THREE.Mesh(STICK_GEO, mat(STICK_C[i % STICK_C.length], 0.45)); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
// 세모·네모로 포개 쌓기: k번째 막대(0부터)의 자리 [위치, y회전, 기울기]
function triSlot(k) { const L = k % 3, lay = Math.floor(k / 3), s = 3.1, R = s / Math.sqrt(3);
  const A = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return V(Math.cos(a) * R, 0, Math.sin(a) * R); });
  const p = A[L], q = A[(L + 1) % 3], mid = p.clone().add(q).multiplyScalar(0.5), d = q.clone().sub(p);
  const y = STICK_T / 2 + lay * STICK_T * 1.02 + STICK_T * 0.5;
  return { pos: V(mid.x, y, mid.z), ry: -Math.atan2(d.z, d.x), tilt: Math.atan2(STICK_T, s) }; }           // 한쪽 끝이 다음 막대 위로(세모를 포개는 방법)
function sqSlot(k) { const lay = Math.floor(k / 2), side = k % 2, h = 1.55;
  const y = STICK_T / 2 + lay * STICK_T * 0.98; const z = side ? h : -h;
  return lay % 2 === 0 ? { pos: V(0, y, z), ry: 0, tilt: 0 } : { pos: V(z, y, 0), ry: Math.PI / 2, tilt: 0 }; }
function placeStick(m, s) { m.position.copy(s.pos); m.rotation.set(0, s.ry, s.tilt || 0); }

// ───────── 매듭풀기: 육각 그림판 + 색깔끈 ─────────
const KN_C = ['#f48fb1', '#ffa726', '#b39ddb', '#3949ab', '#4dd0e1', '#ff7043', '#e53935', '#a1887f', '#1e88e5', '#283593'];
const KN_NAME = ['분홍', '주황', '연보라', '남색', '하늘', '귤색', '빨강', '갈색', '파랑', '진파랑'];
const HOLES = 22, HEX_R = 3.35, HOLE_R = 2.75, BOARD_T = 0.22;
function holePos(i) { const a = -Math.PI / 2 + (i + 0.5) / HOLES * Math.PI * 2; return V(Math.cos(a) * HOLE_R, BOARD_T, Math.sin(a) * HOLE_R); }
function makeKnotBoard() { const sh = new THREE.Shape(); const pts = [...Array(6)].map((_, i) => { const a = i / 6 * Math.PI * 2; return [Math.cos(a) * HEX_R, Math.sin(a) * HEX_R]; });
  const rc = 0.45; pts.forEach(([x, y], i) => { const [px, py] = pts[(i + 5) % 6], [nx, ny] = pts[(i + 1) % 6];
    const a = [x + (px - x) * rc / HEX_R, y + (py - y) * rc / HEX_R], b = [x + (nx - x) * rc / HEX_R, y + (ny - y) * rc / HEX_R];
    i ? sh.lineTo(...a) : sh.moveTo(...a); sh.quadraticCurveTo(x, y, ...b); });
  for (let i = 0; i < HOLES; i++) { const p = holePos(i), h = new THREE.Path(); h.absarc(p.x, -p.z, 0.12, 0, Math.PI * 2, true); sh.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: BOARD_T, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24 });
  geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat('#1c1c1f', 0.7)); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
const KNOB_GEO = (() => { const sh = new THREE.Shape(); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? 0.14 : 0.2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g2 = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); g2.rotateX(-Math.PI / 2); return g2; })();
// 끈 한 줄: 양끝 꽃 모양 꼭지 + 가는 줄. a,b = 두 끝 위치, lift = 가운데 높이(겹친 순서)
function cordCurve(a, b, lift, slack = 0) { const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + lift;
  const n = V(-(b.z - a.z), 0, b.x - a.x).normalize().multiplyScalar(slack); m.add(n);
  return new THREE.CatmullRomCurve3([a.clone().add(V(0, 0.08, 0)), a.clone().lerp(m, 0.5).add(V(0, lift * 0.2, 0)), m, b.clone().lerp(m, 0.5).add(V(0, lift * 0.2, 0)), b.clone().add(V(0, 0.08, 0))]); }
function makeCord(ci) { const grp = new THREE.Group(); const c = KN_C[ci];
  const k1 = new THREE.Mesh(KNOB_GEO, mat(c, 0.4)), k2 = new THREE.Mesh(KNOB_GEO, mat(c, 0.4)); k1.castShadow = k2.castShadow = true;
  const line = new THREE.Mesh(new THREE.BufferGeometry(), mat(c, 0.5)); line.castShadow = true; grp.add(k1, k2, line);
  grp.userData = { k1, k2, line, c }; scene.add(grp); return grp; }
function setCord(cd, a, b, lift = 0.1, slack = 0) { const u = cd.userData; u.k1.position.copy(a); u.k2.position.copy(b);
  u.line.geometry.dispose(); u.line.geometry = new THREE.TubeGeometry(cordCurve(a, b, lift, slack), 40, 0.035, 6); }

// ───────── 스트로우 블록 ─────────
const STR_C = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5'];
const STR_M = STR_C.map(c => mat(c, 0.35));
const HUB_M = mat('#f6c21a', 0.45);
function makeHub() { const grp = new THREE.Group(); const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), HUB_M); core.castShadow = true; grp.add(core);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.24, 8), HUB_M);
    p.position.set(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0); p.rotation.z = a - Math.PI / 2; p.castShadow = true; grp.add(p); }
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), HUB_M); b.position.z = s * 0.14; grp.add(b); }
  scene.add(grp); return grp; }
// 빨대 한 개: 점 목록(곡선)을 따라 굵은 관
function makeStraw(ci, pts) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.085, 10), STR_M[ci % 5]); m.castShadow = true; scene.add(m); m.userData.ci = ci; return m; }
function setStraw(m, pts) { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.085, 10); }
const line = (a, b, n = 8) => [...Array(n + 1)].map((_, i) => a.clone().lerp(b, i / n));
const arc = (c, r, a0, a1, n = 16) => [...Array(n + 1)].map((_, i) => { const a = a0 + (a1 - a0) * i / n; return V(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z); });
// 도형 설계: { hubs:[V], straws:[[ci, pts]] } (세로로 세운 판: x 가로, y 세로)
function shapeCircle(c = V(0, 3.2, 0), r = 2.0) { const hubs = [0, 1, 2, 3].map(i => V(c.x + Math.cos(Math.PI / 2 + i * Math.PI / 2) * r, c.y + Math.sin(Math.PI / 2 + i * Math.PI / 2) * r, 0));
  return { hubs, straws: [0, 1, 2, 3].map(i => [i, arc(c, r, Math.PI / 2 + i * Math.PI / 2 + 0.07, Math.PI / 2 + (i + 1) * Math.PI / 2 - 0.07)]) }; }
function shapeTri(c = V(0, 3.0, 0), s = 3.4, up = true) { const R = s / Math.sqrt(3), o = up ? Math.PI / 2 : -Math.PI / 2;
  const hubs = [0, 1, 2].map(i => V(c.x + Math.cos(o + i * 2 * Math.PI / 3) * R, c.y + Math.sin(o + i * 2 * Math.PI / 3) * R, 0));
  return { hubs, straws: [0, 1, 2].map(i => [i + 1, line(hubs[i].clone().lerp(hubs[(i + 1) % 3], 0.05), hubs[i].clone().lerp(hubs[(i + 1) % 3], 0.95))]) }; }
function shapeIce() { const t = shapeTri(V(0, 2.2, 0), 3.0, false); const a = t.hubs[1], b = t.hubs[2];   // 뒤집은 세모 위에 동그라미
  const c = a.clone().lerp(b, 0.5).add(V(0, 1.35, 0)), r = c.distanceTo(a), top = V(c.x, c.y + r, 0);
  const aA = Math.atan2(a.y - c.y, a.x - c.x), aB = Math.atan2(b.y - c.y, b.x - c.x);
  return { hubs: [...t.hubs, top], straws: [...t.straws, [4, arc(c, r, aA, Math.PI / 2 - 0.06)], [0, arc(c, r, Math.PI / 2 + 0.06, aB + Math.PI * 2)]] }; }
function shapeSquare(c = V(0, 3.1, 0), s = 3.3, rot = 0) { const hubs = [0, 1, 2, 3].map(i => { const a = rot + Math.PI / 4 + i * Math.PI / 2, R = s / Math.SQRT2; return V(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R, 0); });
  return { hubs, straws: [0, 1, 2, 3].map(i => [i, line(hubs[i].clone().lerp(hubs[(i + 1) % 4], 0.05), hubs[i].clone().lerp(hubs[(i + 1) % 4], 0.95))]) }; }
function shapeFish() { const N = V(2.4, 0, 0), J = V(-1.3, 0, 0), T1 = V(-2.7, 1.25, 0), T2 = V(-2.7, -1.25, 0);   // 둥근 몸통 + 세모 꼬리
  const bez = (a, c, b, n = 16) => [...Array(n + 1)].map((_, i) => { const u = i / n; return a.clone().multiplyScalar((1 - u) ** 2).add(c.clone().multiplyScalar(2 * u * (1 - u))).add(b.clone().multiplyScalar(u * u)); });
  const seg = (a, b) => line(a.clone().lerp(b, 0.06), a.clone().lerp(b, 0.94));
  return { hubs: [N, J, T1, T2], eye: V(1.3, 0.35, 0.1), straws: [[4, bez(J, V(0.5, 2.6, 0), N).slice(1, -1)], [3, bez(J, V(0.5, -2.6, 0), N).slice(1, -1)], [0, seg(J, T1)], [1, seg(T1, T2)], [2, seg(T2, J)]] }; }
function shapeHeart() { const bot = V(0, 0.9, 0), l = V(-2.1, 3.3, 0), r = V(2.1, 3.3, 0), mid = V(0, 3.6, 0);
  const cl = l.clone().lerp(mid, 0.5).add(V(0, 0.1, 0)), cr = r.clone().lerp(mid, 0.5).add(V(0, 0.1, 0)), rr = cl.distanceTo(l);
  const seg = (a, b) => line(a.clone().lerp(b, 0.05), a.clone().lerp(b, 0.95));
  return { hubs: [bot, l, r, mid], straws: [[0, seg(bot, l)], [0, seg(r, bot)], [2, arc(cl, rr, Math.PI + 0.1, 0.05)], [1, arc(cr, rr, Math.PI - 0.05, -0.1)]] }; }
function buildShape(sp, scale = 1, off = V(0, 0, 0)) {   // off = 도형 가운데가 올 자리
  const all = [...sp.hubs, ...sp.straws.flatMap(([, p]) => p)], bb = new THREE.Box3().setFromPoints(all), ctr = bb.getCenter(V(0, 0, 0));
  const T = p => p.clone().sub(ctr).multiplyScalar(scale).add(off);
  const res = { hubs: sp.hubs.map(h => { const m = makeHub(); m.position.copy(T(h)); m.scale.setScalar(Math.max(0.8, scale)); return m; }), straws: sp.straws.map(([ci, pts]) => makeStraw(ci, pts.map(T))) };
  if (sp.eye) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat('#1f2a37', 0.3)); e.position.copy(T(sp.eye)); scene.add(e); res.eye = e; }
  return res; }

// ───────── 고리 블록(체인) ─────────
const LINK_C = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
const LINK_M = LINK_C.map(c => mat(c, 0.35));
const LINK_GEO = (() => { const L = 0.5, R = 0.22, pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; let p;          // 틈(금) 있는 길쭉한 고리
    const per = 2 * L + 2 * Math.PI * R, s = 0.04 + u * (per - 0.08);
    if (s < L) p = V(-L / 2 + s, 0, R); else if (s < L + Math.PI * R) { const a = (s - L) / R; p = V(L / 2 + Math.sin(a) * R, 0, Math.cos(a) * R); }
    else if (s < 2 * L + Math.PI * R) p = V(L / 2 - (s - L - Math.PI * R), 0, -R); else { const a = (s - 2 * L - Math.PI * R) / R; p = V(-L / 2 - Math.sin(a) * R, 0, -Math.cos(a) * R); }
    pts.push(p); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.065, 10); })();
const LINK_SP = 0.66;
function makeLink(ci) { const m = new THREE.Mesh(LINK_GEO, LINK_M[ci % 6]); m.castShadow = true; scene.add(m); return m; }
// 곡선을 따라 고리를 사슬처럼 놓기(번갈아 눕히고 세움)
function chainOn(curve, links, closed = true, y = 0.09) { const n = links.length, L = curve.getLength();
  links.forEach((m, i) => { const u = closed ? i / n : (i * LINK_SP) / L; const p = curve.getPointAt(Math.min(1, u)), tg = curve.getTangentAt(Math.min(1, u));
    m.position.set(p.x, y + (i % 2 ? 0.07 : 0), p.z); m.rotation.set(0, -Math.atan2(tg.z, tg.x), 0); if (i % 2) m.rotateX(Math.PI / 2 * 0.85); }); }
const circleCurve = (c, r) => new THREE.CatmullRomCurve3([...Array(24)].map((_, i) => V(c.x + Math.cos(i / 24 * Math.PI * 2) * r, 0, c.z + Math.sin(i / 24 * Math.PI * 2) * r)), true);
const polyline = pts => new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);

// ═════════ 미리보기(정지 화면) ═════════
function pvSticks() { setCam(V(0, 13, 7.5), V(0, 0, 0.6));
  const tri = []; for (let k = 0; k < 24; k++) { const m = makeStick(k); const s = triSlot(k); placeStick(m, s); m.position.x -= 3.2; tri.push(m); }
  const sq = []; for (let k = 0; k < 24; k++) { const m = makeStick(k + 3); placeStick(m, sqSlot(k)); m.position.x += 3.4; sq.push(m); }
  return { T: 1, frame() { render3D(); title('막대기를 서로 포개어 높이 쌓아요', 1); const [x1, y1] = proj(V(-3.2, 0, 3.0)), [x2, y2] = proj(V(3.4, 0, 3.0));
    pill('세모', x1, y1 + 40, 1, { size: 48, bg: '#1f2a37' }); pill('네모', x2, y2 + 40, 1, { size: 48, bg: '#1f2a37' }); badge('색깔 막대기 25개', 1); } }; }
function pvKnot() { setCam(V(0, 12.5, 4.5), V(0, 0, 0.3));
  const b = makeKnotBoard(); const pairs = [[0, 11], [2, 13], [4, 15], [6, 17], [8, 19], [10, 21], [1, 9], [3, 16], [5, 20], [7, 14]];
  pairs.forEach(([a, c], i) => { const cd = makeCord(i); setCord(cd, holePos(a), holePos(c), 0.08 + i * 0.05); });
  return { T: 1, frame() { render3D(); title('가장 위에 있는 끈부터 하나씩 빼요', 1); badge('구멍 22개 · 색깔끈 10개 → 구멍 2개가 남아요', 1); } }; }
function pvStraw() { setCam(V(0, 3.0, 15.5), V(0, 3.0, 0)); table.visible = false;
  const L = [['동그라미', shapeCircle(V(0, 0, 0), 2.0), -6.0, 5.0], ['세모', shapeTri(V(0, 0, 0), 3.4), -2.0, 5.0], ['아이스크림', shapeIce(), 2.0, 4.6], ['네모', shapeSquare(V(0, 0, 0), 3.3), 6.0, 5.0],
    ['물고기', shapeFish(), -4.0, 0.4], ['하트', shapeHeart(), 3.0, 0.4]];
  L.forEach(([, sp, x, y]) => buildShape(sp, 0.6, V(x, y, 0)));
  return { T: 1, frame() { render3D(); title('빨대 블록과 노란 꽂이로 모양 만들기', 1);
    L.forEach(([s, , x, y]) => { const [px, py] = proj(V(x, y - 1.75, 0)); pill(s, px, py, 1, { size: 34, bg: '#1f2a37' }); }); } }; }
function pvRing() { setCam(V(0, 12.5, 5.5), V(0, 0, 0.4));
  const crown = [...Array(20)].map((_, i) => makeLink(i)); chainOn(circleCurve(V(-4.2, 0, -0.6), 20 * LINK_SP / (2 * Math.PI)), crown);
  const brace = [...Array(8)].map((_, i) => makeLink(i + 2)); chainOn(circleCurve(V(-4.2, 0, 3.4), 8 * LINK_SP / (2 * Math.PI)), brace);
  const hp = []; for (let i = 0; i <= 48; i++) { const t = i / 48 * Math.PI * 2; hp.push(V(16 * Math.sin(t) ** 3, 0, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))).multiplyScalar(0.15).add(V(2.6, 0, 0.3))); }
  const hc = new THREE.CatmullRomCurve3(hp, true); const heart = [...Array(Math.round(hc.getLength() / LINK_SP))].map((_, i) => makeLink(i)); chainOn(hc, heart);
  return { T: 1, frame() { render3D(); title('고리를 이어 왕관·팔찌·하트를 만들어요', 1);
    [['왕관 20개', -4.2, -2.9], ['팔찌 8개', -4.2, 4.6], ['하트', 2.6, 3.2]].forEach(([s, x, z]) => { const [px, py] = proj(V(x, 0, z)); pill(s, px, py, 1, { size: 40, bg: '#1f2a37' }); }); } }; }

