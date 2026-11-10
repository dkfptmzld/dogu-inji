// ═════════ 3~4주차: 지오보드(3-1) · 파이프 블록(4-1) ═════════
// 빌드: base.js(색깔큐브와 같은 장면 기본·글씨 도구) + 이 파일을 이어 붙여 w34.js 로 만든 뒤 esbuild.
// w34.html?s=번호 로 장면 선택. 렌더: $env:PAGE="w34.html"; node render.js <번호> <폴더>
// 지오보드 1~8 → videos/03-1/1~8.mp4, 파이프 블록 11~17 → videos/04-1/1~7.mp4
// 내용은 김유천 대리님 카톡 영상(2026-11-09) 설명을 따랐다.

const EVENTS = []; const ev = (t, type, p = 0) => EVENTS.push({ t: +t.toFixed(3), type, p });
const ez = (t, a, d) => ease(clamp((t - a) / d));
function arcMove(o, from, to, p, h = 1.5) { o.position.copy(from).lerp(to, p); o.position.y += Math.sin(p * Math.PI) * h; }
function setCam(pos, look) { camera.position.copy(pos); camera.lookAt(look); camera.updateMatrixWorld(); }
function render3D() { renderer.render(scene, camera); g.drawImage(cv, 0, 0); }
// 엄지로 '꾹' 누르는 자리 표시(주황 고리 + 글씨)
function pressMark(v, a, t, text = '꾹!') { if (a <= 0) return; const [x, y] = proj(v); g.save(); g.globalAlpha = a;
  const r = 30 + 6 * Math.sin(t * 9); g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 7; g.strokeStyle = ACC; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  pill(text, x, y - 78, a, { size: 38, bg: '#1f2a37' }); }
function recolorPouch(p, cloth, hole, cord) { p.children[0].material = p.children[0].material.clone(); p.children[0].material.color.set(cloth);
  p.children[1].material = p.children[1].material.clone(); p.children[1].material.color.set(hole);
  for (const i of [2, 3]) { p.children[i].material = p.children[i].material.clone(); p.children[i].material.color.set(cord); } return p; }
const yellowPouch = (x, z) => recolorPouch(makePouch(x, z), '#f2cf1d', '#5a4a08', '#c9a512');

// ───────── 지오보드 ─────────
const GB = { blue: '#2f8fe0', pink: '#e23ca6', yellow: '#f2d21b' };
const BAND = { yellow: '#f4c81a', red: '#e8344a', blue: '#14245e', green: '#22a65a' };
const BNAME = { yellow: '노란색', red: '빨간색', blue: '파란색', green: '초록색' };
const PEG_N = 11, GSZ = 6.2, PEG_SP = GSZ / (PEG_N + 0.6);
function pegPos(board, c, r) { return V(board.position.x + (c - (PEG_N - 1) / 2) * PEG_SP, board.userData.top + 0.16, board.position.z + (r - (PEG_N - 1) / 2) * PEG_SP); }
function makeGeoboard(color = GB.blue, back = false) {
  const grp = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.0 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(GSZ, 0.22, GSZ, 3, 0.08), mat); base.position.y = 0.11; base.castShadow = base.receiveShadow = true; grp.add(base);
  for (const sx of [-1, 1]) { const tab = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.2, 1.4, 2, 0.05), mat); tab.position.set(sx * (GSZ / 2 + 0.1), 0.1, 0); tab.castShadow = true; grp.add(tab); }
  const pegG = new THREE.CylinderGeometry(0.075, 0.09, 0.2, 14), pegs = new THREE.InstancedMesh(pegG, mat, PEG_N * PEG_N); let i = 0;
  const m4 = new THREE.Matrix4();
  for (let r = 0; r < PEG_N; r++) for (let c = 0; c < PEG_N; c++) { m4.makeTranslation((c - (PEG_N - 1) / 2) * PEG_SP, 0.32, (r - (PEG_N - 1) / 2) * PEG_SP); pegs.setMatrixAt(i++, m4); }
  pegs.castShadow = true; grp.add(pegs);
  if (back) {   // 뒷면: 가운데를 중심으로 동그라미 무늬
    const lm = new THREE.MeshBasicMaterial({ color: '#8cc6f5', transparent: true, opacity: 0.8 });
    for (const rr of [1.2, 2.2, 2.9]) { const ring = new THREE.Mesh(new THREE.RingGeometry(rr - 0.015, rr + 0.015, 96), lm); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.225; grp.add(ring); }
  }
  grp.userData.top = 0.22; scene.add(grp); return grp; }
// 고무줄: 두 못 사이에 걸린 납작한 고리
function bandPath(a, b, r = 0.11) {
  const d = b.clone().sub(a); d.y = 0; let L = d.length(); if (L < 1e-3) { d.set(1, 0, 0); L = 1; }
  const u = d.normalize(), n = V(-u.z, 0, u.x); const pts = [];
  for (let k = 0; k <= 16; k++) { const t = Math.PI / 2 + k / 16 * Math.PI; pts.push(a.clone().add(u.clone().multiplyScalar(Math.cos(t) * r)).add(n.clone().multiplyScalar(Math.sin(t) * r))); }
  for (let k = 0; k <= 16; k++) { const t = -Math.PI / 2 + k / 16 * Math.PI; pts.push(b.clone().add(u.clone().multiplyScalar(Math.cos(t) * r)).add(n.clone().multiplyScalar(Math.sin(t) * r))); }
  return new THREE.CatmullRomCurve3(pts, true); }
function makeBand(color, a, b) { const m = new THREE.Mesh(new THREE.TubeGeometry(bandPath(a, b), 120, 0.035, 8, true), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  m.castShadow = true; m.userData = { a: a.clone(), b: b.clone() }; scene.add(m); return m; }
function setBand(m, a, b) { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(bandPath(a, b), 120, 0.035, 8, true); }
// 여러 못을 도는 고무줄(도형)
function polyCurve(pts, r = 0.1) { const c = pts.reduce((s, p) => s.add(p.clone()), V(0, 0, 0)).multiplyScalar(1 / pts.length);
  const q = pts.map(p => { const d = p.clone().sub(c); d.y = 0; return p.clone().add(d.normalize().multiplyScalar(r)); }); const dense = [];
  q.forEach((a, i) => { const b = q[(i + 1) % q.length]; for (let k = 0; k < 10; k++) dense.push(a.clone().lerp(b, k / 10)); });
  return new THREE.CatmullRomCurve3(dense, true, 'centripetal'); }
function makePolyBand(color, pts) { const m = new THREE.Mesh(new THREE.TubeGeometry(polyCurve(pts), 240, 0.035, 8, true), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  m.castShadow = true; scene.add(m); return m; }
// 탁자 위에 놓인 고무줄
function makeLooseBand(color, x, z, rad = 0.42, seed = 0) { const pts = []; for (let k = 0; k < 24; k++) { const t = k / 24 * Math.PI * 2;
    pts.push(V(Math.cos(t) * rad * (1 + 0.08 * Math.sin(t * 3 + seed)), 0.04, Math.sin(t) * rad * 0.85)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.035, 8, true), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  m.castShadow = true; m.position.set(x, 0, z); m.rotation.y = seed; scene.add(m); return m; }
function bandPile(color, x, z, n = 3) { return Array.from({ length: n }, (_, i) => { const m = makeLooseBand(color, x + i * 0.12, z + i * 0.05, 0.42, i * 1.7 + x); m.position.y = i * 0.02; return m; }); }

// ═════════ 지오보드 1: 활동 소개 ═════════
function g1() { setCam(V(0.45, 12.6, 2.2), V(0.45, 0, 0.15));   // 정면(거의 위에서)
  const b = makeGeoboard(); b.position.x = -0.8;
  const piles = ['yellow', 'red', 'blue', 'green'].map((c, i) => bandPile(BAND[c], 4.2, -2.1 + i * 1.35, 2));
  const A = pegPos(b, 1, 9), B = pegPos(b, 9, 9), band = makeBand(BAND.yellow, A, A); band.visible = false;
  const T = 16; ev(0.5, 'whoosh'); piles.forEach((p, i) => ev(1.6 + i * 0.35, 'pop', i)); ev(8.0, 'pop'); ev(10.2, 'tok'); ev(10.6, 'ding');
  return { T, frame(t) {
    const d = ez(t, 0.4, 0.9); b.position.y = 3 * (1 - d) + 0.0; b.rotation.z = 0.15 * (1 - d);
    piles.forEach((p, i) => p.forEach(m => { const s = ez(t, 1.6 + i * 0.35, 0.4); m.scale.setScalar(Math.max(0.01, s)); }));
    const st = clamp((t - 8.6) / 1.5); band.visible = t > 8.6; if (band.visible) setBand(band, A, A.clone().lerp(B, ease(st)));
    piles[0][1].visible = t < 8.6;
    render3D();
    title('올록볼록 판에 고무줄을 꾹 눌러 끼워요', win(t, 0.6, 7.6));
    pressMark(A, win(t, 7.8, 10.3), t, '엄지로 꾹!');
    title('규칙과 순서에 맞게 끼워 보아요', win(t, 7.6, T - 0.6));
    badge('고무줄 4가지 색: 노랑·빨강·파랑·초록', win(t, 2.6, 7.4));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 2: 준비하기(꺼내서 색깔별로 나누기) ═════════
function g2() { setCam(V(0.3, 14.2, 2.6), V(0.3, 0, 0.2));
  const pouch = yellowPouch(-6.5, -2.9), b = makeGeoboard(); pouch.scale.setScalar(0.7); b.position.set(-1.4, 0, 0.6);
  const cols = ['yellow', 'blue', 'red', 'green'], bands = []; let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  cols.forEach((c, ci) => { for (let k = 0; k < 3; k++) { const m = makeLooseBand(BAND[c], 0, 0, 0.42, rnd() * 6);
    m.userData = { c: ci, mess: V(1.6 + rnd() * 3.2, 0, -1.6 + rnd() * 3.4), sorted: V(2.4 + k * 0.55, 0, -2.4 + ci * 1.45 + k * 0.04) }; bands.push(m); } });
  const OUT = 1.0, SORT0 = 5.2, SD = 2.8, T = SORT0 + 4 * SD + 3.2;
  ev(OUT, 'whoosh'); cols.forEach((c, ci) => { ev(SORT0 + ci * SD, 'pop', ci); for (let k = 0; k < 3; k++) ev(SORT0 + ci * SD + 0.5 + k * 0.45 + 0.5, 'tok', k); }); ev(T - 2.4, 'ding');
  const MOUTH = V(-6.5, 1.9, -2.9), boardHome = b.position.clone();
  return { T, frame(t) {
    const po = ez(t, OUT, 1.2); arcMove(b, MOUTH, boardHome, po, 2.2); b.visible = t > OUT;
    bands.forEach((m, i) => { const u = m.userData, p0 = ez(t, OUT + 0.4 + i * 0.08, 1.0);
      m.visible = t > OUT + 0.4 + i * 0.08; arcMove(m, MOUTH, u.mess, p0, 1.8);
      const t1 = SORT0 + u.c * SD + 0.5 + (i % 3) * 0.45, p1 = ez(t, t1, 0.5); if (t > t1) arcMove(m, u.mess, u.sorted, p1, 1.0); });
    render3D();
    title('주머니에서 그림판과 고무줄을 꺼내요', win(t, 0.4, SORT0 - 0.2));
    if (t > SORT0 - 0.2) { const ci = Math.min(3, Math.floor((t - SORT0) / SD)); title(`${BNAME[cols[ci]]}은 ${BNAME[cols[ci]]}끼리 모아요`, win(t, SORT0 - 0.2, T - 2.6)); }
    cols.forEach((c, ci) => { const [x, y] = proj(V(4.4, 0.2, -2.4 + ci * 1.45)); pill(BNAME[c], x + 150, y, win(t, SORT0 + ci * SD + 0.2, T - 0.5), { size: 40, swatch: BAND[c], bg: '#fff', color: '#1f2a37', border: BAND[c] }); });
    badge('색깔별 정리 끝! 활동 준비 완료', win(t, T - 2.6, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 3: 손가락 스트레칭(2D 손 그림) ═════════
function drawHand(cx, cy, s, c, mir) {          // c: 0 = 활짝 편 손, 1 = 쥔 손
  g.save(); g.translate(cx, cy); g.scale(mir ? -s : s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const skin = '#f5cca8', ln = '#9a6440', sp = 1 + 0.28 * (1 - c);
  const fx = [-78, -26, 26, 76].map(x => x * sp), fl = [175, 205, 192, 150].map(l => l * (1 - 0.66 * c)), ang = [-0.16, -0.05, 0.05, 0.16].map(a => a * (1 - c));
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)], tips = [];
  const ta = -0.95 * (1 - c) - 0.25 * c, tl = 140 * (1 - 0.35 * c), [tx, ty] = rot(0, -tl, ta); tips.push([-100 + tx, 110 + ty]);
  const shape = () => { g.beginPath(); g.roundRect(-112, -20, 224, 260, 70);
    fx.forEach((x, i) => { g.save(); g.translate(x, 0); g.rotate(ang[i]); g.roundRect(-26, -fl[i], 52, fl[i] + 40, 26); g.restore(); });
    g.save(); g.translate(-100, 110); g.rotate(ta); g.roundRect(-28, -tl, 56, tl + 30, 28); g.restore(); };
  fx.forEach((x, i) => { const [a, b] = rot(0, -fl[i] + 14, ang[i]); tips.push([x + a, b]); });
  g.fillStyle = skin; g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 20; shape(); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 7; g.strokeStyle = ln; shape(); g.stroke();
  g.fillStyle = '#5b8def'; g.beginPath(); g.roundRect(-118, 230, 236, 90, 22); g.fill(); g.stroke();      // 소매
  for (const [w, col] of [[20, '#7a5a00'], [12, BAND.yellow]]) {                                       // 손끝에 건 고무줄
    g.lineWidth = w; g.strokeStyle = col; g.beginPath(); tips.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); }
  g.restore(); }
function bigCount(n, x, y, a) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 20;
  g.beginPath(); g.arc(x, y, 120, 0, Math.PI * 2); g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 12; g.strokeStyle = ACC; g.stroke();
  g.fillStyle = '#1f2a37'; g.font = `900 130px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + 8); g.restore(); }
function g3() {
  const INTRO = 4.5, CY = 1.5, R0 = INTRO + 0.8, L0 = R0 + 10 * CY + 1.6, T = L0 + 10 * CY + 3.2;
  for (let k = 0; k < 10; k++) { ev(R0 + k * CY + 0.55, 'count', k); ev(L0 + k * CY + 0.55, 'count', k); } ev(R0 - 0.5, 'pop'); ev(L0 - 0.5, 'pop'); ev(T - 2.8, 'ding');
  return { T, frame(t) { g.fillStyle = BG; g.fillRect(0, 0, W, H);
    const right = t < L0 - 0.8; let c = 0, n = 0;
    const st = right ? R0 : L0; if (t > st) { const k = Math.floor((t - st) / CY), tt = (t - st) - k * CY; if (k < 10) { c = Math.sin(clamp(tt / CY) * Math.PI); n = k + 1; } else n = 10; }
    drawHand(W / 2 - 160, H / 2 + 10, 1.25, ease(c), !right);
    title('고무줄을 손끝에 걸고 쥐었다 폈다 해요', win(t, 0.3, INTRO + 0.4));
    badge('엄지와 검지에 걸고 → 새끼손가락까지 끼워요', win(t, 0.8, INTRO + 0.2));
    title(right ? '오른손 10번' : '왼손 10번', win(t, R0 - 0.6, T - 3.0));
    if (t > R0 - 0.2 && n > 0) bigCount(n, W / 2 + 380, H / 2, 1);
    badge('손에 힘을 꽉 주고 천천히!', win(t, R0, T - 3.0));
    badge('스트레칭 끝! 잘하셨어요', win(t, T - 2.8, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// 계단 모양(4·5·8에서 같이 씀): k번째 고무줄 = (k, 10-k) → (10, 10-k)
const STAIR = ['yellow', 'red', 'blue', 'yellow', 'red', 'blue'];
const stairA = (b, k) => pegPos(b, k, 10 - k), stairB = (b, k) => pegPos(b, 10, 10 - k);

// ═════════ 지오보드 4: 계단 모양 ═════════
function g4() { setCam(V(0.45, 12.6, 2.2), V(0.45, 0, 0.15));   // 정면(거의 위에서)
  const b = makeGeoboard(); b.position.x = -0.8;
  const piles = { yellow: bandPile(BAND.yellow, 4.2, -1.5, 2), red: bandPile(BAND.red, 4.2, 0, 2), blue: bandPile(BAND.blue, 4.2, 1.5, 2) };
  const S0 = 2.0, PER = 4.6, T = S0 + 6 * PER + 3.6, bands = STAIR.map((c, k) => { const m = makeBand(BAND[c], stairA(b, k), stairA(b, k)); m.visible = false; return m; });
  STAIR.forEach((c, k) => { ev(S0 + k * PER, 'pop', k); ev(S0 + k * PER + 2.9, 'tok', k); }); ev(T - 3.2, 'ding');
  const used = { yellow: 0, red: 0, blue: 0 };
  return { T, frame(t) {
    Object.values(piles).forEach(p => p.forEach(m => m.visible = true)); for (const c in used) used[c] = 0;
    bands.forEach((m, k) => { const s = S0 + k * PER, p = clamp((t - s - 1.4) / 1.4); m.visible = t > s + 1.4;
      if (t > s + 1.4) { used[STAIR[k]]++; setBand(m, stairA(b, k), stairA(b, k).lerp(stairB(b, k), ease(p))); } });
    for (const c in used) piles[c].forEach((m, i) => m.visible = i >= used[c]);
    render3D();
    title('규칙에 맞게 계단 모양을 만들어요', win(t, 0.3, S0));
    const k = Math.floor((t - S0) / PER);
    if (k >= 0 && k < 6) { const c = STAIR[k], s = S0 + k * PER;
      title(k === 0 ? '노란색: 맨 아래 끝까지 쭉 끼워요' : `${BNAME[c]}: 끝에서 한 칸 빼고 끼워요`, win(t, s, s + PER));
      pressMark(stairA(b, k), win(t, s + 0.6, s + 3.0), t, '엄지로 꾹!'); }
    badge('노랑 → 빨강 → 파랑 순서로 반복해요', win(t, S0 + 0.5, T - 3.4));
    badge('계단 모양 완성!', win(t, T - 3.2, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 5: 고무줄 빼기 ═════════
function g5() { setCam(V(0.45, 12.6, 2.2), V(0.45, 0, 0.15));   // 정면(거의 위에서)
  const b = makeGeoboard(); b.position.x = -0.8;
  const bands = STAIR.map((c, k) => makeBand(BAND[c], stairA(b, k), stairB(b, k)));
  const home = { yellow: V(4.2, 0, -1.5), red: V(4.2, 0, 0), blue: V(4.2, 0, 1.5) }, cnt = { yellow: 0, red: 0, blue: 0 };
  const loose = STAIR.map((c, k) => { const m = makeLooseBand(BAND[c], 0, 0, 0.42, k * 1.3); m.visible = false; m.userData.to = home[c].clone().add(V(cnt[c] * 0.14, cnt[c]++ * 0.02, 0)); return m; });
  const S0 = 2.2, PER = 3.0, order = [5, 4, 3, 2, 1, 0], T = S0 + 6 * PER + 3.4;
  order.forEach((k, j) => { ev(S0 + j * PER + 0.4, 'pop', j); ev(S0 + j * PER + 2.2, 'tok', j); }); ev(T - 3.0, 'ding');
  return { T, frame(t) {
    order.forEach((k, j) => { const s = S0 + j * PER, m = bands[k], A = stairA(b, k), B = stairB(b, k), L = loose[k];
      const p = ez(t, s + 0.9, 0.8); m.visible = p < 1; if (t > s + 0.9 && p < 1) setBand(m, A, B.clone().lerp(A, p));
      L.visible = p >= 1; if (p >= 1) arcMove(L, A.clone().setY(0), L.userData.to, ez(t, s + 1.7, 0.6), 1.4); });
    render3D();
    title('뺄 때도 엄지로 끝 점을 꾹 누르고 하나씩!', win(t, 0.3, T - 3.2));
    const j = Math.floor((t - S0) / PER); if (j >= 0 && j < 6) pressMark(stairA(b, order[j]), win(t, S0 + j * PER + 0.2, S0 + j * PER + 1.9), t, '꾹 누르고 빼요');
    badge('고무줄이 튀면 다칠 수 있어요. 천천히!', win(t, 1.0, T - 3.2));
    badge('색깔별로 다시 정리해요', win(t, T - 3.0, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 6: 뒷면 꽃무늬 ═════════
function g6() { setCam(V(0.45, 12.6, 2.2), V(0.45, 0, 0.15));   // 정면(거의 위에서)
  const front = makeGeoboard(), back = makeGeoboard(GB.blue, true); front.position.x = back.position.x = -0.8; back.visible = false;
  const piles = ['yellow', 'red', 'green', 'blue'].map((c, i) => bandPile(BAND[c], 4.2, -2.1 + i * 1.4, 2));
  const C = 5, L = [['yellow', [C, 0], [C, 10], '노란색: 가운데 위 → 아래로 세로로'], ['red', [0, C], [10, C], '빨간색: 가로로 → 십자 모양이 돼요'],
    ['green', [0, 0], [10, 10], '초록색: 대각선으로'], ['blue', [10, 0], [0, 10], '파란색: 반대쪽 대각선으로'],
    ['yellow', [3, 0], [7, 10], '남은 대각선은 좋아하는 색으로!'], ['red', [7, 0], [3, 10], '남은 대각선은 좋아하는 색으로!']];
  const FL = 0.8, S0 = 4.4, PER = 3.6, T = S0 + L.length * PER + 3.8;
  const bands = L.map(([c, a]) => { const m = makeBand(BAND[c], pegPos(back, ...a), pegPos(back, ...a)); m.visible = false; return m; });
  ev(FL, 'whoosh'); L.forEach((l, k) => { ev(S0 + k * PER, 'pop', k); ev(S0 + k * PER + 2.6, 'tok', k); }); ev(T - 3.4, 'ding');
  return { T, frame(t) {
    const f = clamp((t - FL) / 2.0); const lift = Math.sin(f * Math.PI) * 1.6;
    front.visible = f < 0.5; back.visible = f >= 0.5; front.rotation.x = -Math.PI * ease(Math.min(f, 0.5) * 2) / 2; back.rotation.x = Math.PI / 2 * (1 - ease(clamp((f - 0.5) * 2)));
    front.position.y = back.position.y = lift;
    bands.forEach((m, k) => { const s = S0 + k * PER, p = clamp((t - s - 1.2) / 1.4), [, a, bb] = L[k]; m.visible = t > s + 1.2;
      if (m.visible) setBand(m, pegPos(back, ...a), pegPos(back, ...a).lerp(pegPos(back, ...bb), ease(p))); });
    piles.forEach((p, i) => p.forEach((m, j) => { const used = L.filter((l, k) => l[0] === ['yellow', 'red', 'green', 'blue'][i] && t > S0 + k * PER + 1.2).length; m.visible = j >= used; }));
    render3D();
    title('판을 뒤집으면 점 모양이 달라요', win(t, 0.3, S0));
    const k = Math.floor((t - S0) / PER);
    if (k >= 0 && k < L.length) { const s = S0 + k * PER; title(L[k][3], win(t, s, s + PER)); pressMark(pegPos(back, ...L[k][1]), win(t, s + 0.5, s + 2.7), t, '엄지로 꾹!'); }
    badge('알록달록 꽃무늬 완성!', win(t, T - 3.4, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 7: 도안 따라 만들기(집·돛단배) ═════════
function g7() { setCam(V(0, 15.6, 2.8), V(0, 0, 0.25));
  const pb = makeGeoboard(GB.pink), yb = makeGeoboard(GB.yellow); pb.position.x = -3.7; yb.position.x = 3.7;
  const P = (b, pts) => pts.map(([c, r]) => pegPos(b, c, r));
  const shapes = [
    [pb, BAND.yellow, [[1, 5], [5, 1], [9, 5]]], [pb, BAND.blue, [[2, 5], [8, 5], [8, 10], [2, 10]]], [pb, BAND.green, [[4, 7], [6, 7], [6, 10], [4, 10]]], [pb, '#ffffff', [[6, 2], [7, 2], [7, 3.6], [6, 3.6]]],
    [yb, BAND.blue, [[5, 1], [5, 8]]], [yb, BAND.red, [[5.3, 1.2], [9, 6.6], [5.3, 6.6]]], [yb, BAND.green, [[1, 8], [9, 8], [8, 10], [2, 10]]], [yb, BAND.red, [[5, 1], [3.4, 1.8], [5, 2.6]]]];
  const S0 = 3.0, PER = 1.6, T = S0 + shapes.length * PER + 5.0;
  const ms = shapes.map(([b, col, pts]) => { const m = pts.length === 2 ? makeBand(col, ...P(b, pts)) : makePolyBand(col, P(b, pts)); m.visible = false; return m; });
  ms.forEach((m, i) => ev(S0 + i * PER + 0.3, 'tok', i)); ev(S0 + 4 * PER - 0.2, 'pop'); ev(T - 4.4, 'ding');
  return { T, frame(t) {
    ms.forEach((m, i) => { const p = ez(t, S0 + i * PER, 0.4); m.visible = p > 0; m.position.y = 0.6 * (1 - p); });
    render3D();
    title('도안을 보고 상상력을 발휘해 만들어요', win(t, 0.3, T - 4.6));
    const [lx, ly] = proj(V(-3.7, 0, 3.6)), [rx, ry] = proj(V(3.7, 0, 3.6));
    pill('집', lx, ly + 20, win(t, S0 + 3 * PER, T - 0.5), { size: 52, bg: '#fff', color: '#1f2a37', border: GB.pink });
    pill('돛단배', rx, ry + 20, win(t, S0 + 7 * PER, T - 0.5), { size: 52, bg: '#fff', color: '#1f2a37', border: '#d6b400' });
    title('집·돛단배처럼 다양한 모양을 만들어 보세요!', win(t, T - 4.6, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 지오보드 8: 정리 ═════════
function g8() { setCam(V(0.3, 14.2, 2.6), V(0.3, 0, 0.2));
  const b = makeGeoboard(); b.position.set(-1.6, 0, 0.3);
  const bands = STAIR.map((c, k) => makeBand(BAND[c], stairA(b, k), stairB(b, k)));
  const colsAll = ['yellow', 'red', 'blue', 'green'], sortPos = c => V(2.3, 0, -2.2 + colsAll.indexOf(c) * 1.3);
  const extra = makeLooseBand(BAND.green, 2.3, 1.7, 0.42, 2);
  const cnt = { yellow: 0, red: 0, blue: 0, green: 1 };
  const loose = STAIR.map((c, k) => { const m = makeLooseBand(BAND[c], 0, 0, 0.42, k * 1.1); m.visible = false; m.userData.to = sortPos(c).add(V(cnt[c]++ * 0.14, 0, 0)); return m; });
  const bag = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.06, 1.6, 2, 0.02), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.15 }));
  bag.position.set(4.6, 0.04, -0.4); bag.castShadow = true; scene.add(bag);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 0.08), new THREE.MeshStandardMaterial({ color: '#c9d6e3' })); zip.position.set(4.6, 0.08, -1.15); scene.add(zip);
  const pouch = yellowPouch(-6.6, -2.9), MOUTH = V(-6.6, 1.9, -2.9); pouch.scale.setScalar(0.7);
  const R0 = 1.4, RD = 0.9, B0 = R0 + 6 * RD + 1.2, Z0 = B0 + 2.6, P0 = Z0 + 2.0, T = P0 + 3.0 + 3.4;
  [5, 4, 3, 2, 1, 0].forEach((k, j) => ev(R0 + j * RD + 0.3, 'tok', j)); ev(B0, 'whoosh'); ev(Z0 + 0.6, 'pop'); ev(P0, 'whoosh'); ev(P0 + 1.4, 'whoosh'); ev(T - 3.2, 'ding');
  const bagHome = bag.position.clone(), boardHome = b.position.clone();
  return { T, frame(t) {
    [5, 4, 3, 2, 1, 0].forEach((k, j) => { const s = R0 + j * RD, p = ez(t, s, 0.4), L = loose[k]; bands[k].visible = p < 1;
      if (t > s && p < 1) setBand(bands[k], stairA(b, k), stairB(b, k).lerp(stairA(b, k), p));
      L.visible = p >= 1; if (p >= 1) arcMove(L, stairA(b, k).setY(0), L.userData.to, ez(t, s + 0.4, 0.5), 1.2);
      const q = ez(t, B0 + j * 0.15, 0.7); if (t > B0 + j * 0.15) arcMove(L, L.userData.to, bagHome.clone().add(V((j % 3) * 0.4 - 0.4, 0.06, (j > 2 ? 0.3 : -0.2))), q, 1.2); });
    { const q = ez(t, B0 + 0.9, 0.7); if (t > B0 + 0.9) arcMove(extra, V(2.3, 0, 1.7), bagHome.clone().add(V(0.6, 0.06, 0.2)), q, 1.2); }
    zip.material.color.set(t > Z0 + 0.6 ? '#7f9cbf' : '#c9d6e3');
    const pb = ez(t, P0, 1.2), pp = ez(t, P0 + 1.4, 1.2), sc = Math.max(0.05, 1 - pb);
    arcMove(bag, bagHome, MOUTH, pb, 2.5); bag.scale.setScalar(sc); zip.visible = pb < 0.05; zip.position.copy(bag.position).add(V(0, 0.04, -0.75));
    [...loose, extra].forEach(m => { if (pb > 0) { m.position.lerp(MOUTH, pb); m.scale.setScalar(sc); } });
    arcMove(b, boardHome, MOUTH, pp, 2.5); b.scale.setScalar(Math.max(0.05, 1 - pp));
    render3D();
    title('고무줄을 하나씩 빼서 색깔별로 나눠요', win(t, 0.3, B0 - 0.2));
    title('하얀 봉투에 담고 손가락으로 꾹 눌러 닫아요', win(t, B0 - 0.2, P0 - 0.2));
    pressMark(V(4.6, 0.1, -1.15), win(t, Z0, P0 - 0.3), t, '꾹 눌러 닫기');
    title('그림판과 봉투를 주머니에 담아요', win(t, P0 - 0.2, T - 3.4));
    badge('정리 끝! 잘하셨어요', win(t, T - 3.2, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ───────── 파이프 블록 ─────────
const PIPE = { red: '#ec2f3a', yellow: '#f5dd1e', green: '#2ee05a', pink: '#f04fb5' };
const PU = 0.9, PR = 0.2, HALF = PU / 2, YAX = V(0, 1, 0);
const DX = V(1, 0, 0), DZ = V(0, 0, 1), NX = V(-1, 0, 0), NZ = V(0, 0, -1);
const pipeMat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 });
function cyl(r, len, mat, dir, center) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 28), mat); m.quaternion.setFromUnitVectors(YAX, dir.clone().normalize());
  m.position.copy(center); m.castShadow = true; return m; }
// 곧은 블록: d 방향, d 쪽 끝이 굵다(끼우는 쪽)
function mkStraight(color, d) { const g = new THREE.Group(), mat = pipeMat(color);
  g.add(cyl(PR, PU * 0.98, mat, d, V(0, 0, 0))); g.add(cyl(PR * 1.2, 0.26, mat, d, d.clone().multiplyScalar(HALF - 0.13))); return g; }
// ㄴ자 블록: d1 쪽과 d2 쪽을 잇는다
function mkElbow(color, d1, d2) { const g = new THREE.Group(), mat = pipeMat(color), c = d1.clone().add(d2).multiplyScalar(HALF), pts = [];
  for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI / 2; pts.push(c.clone().sub(d2.clone().multiplyScalar(HALF * Math.cos(a))).sub(d1.clone().multiplyScalar(HALF * Math.sin(a)))); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, PR * 1.08, 20), mat); m.castShadow = true; g.add(m);
  g.add(cyl(PR * 1.2, 0.24, mat, d1, d1.clone().multiplyScalar(HALF - 0.12))); g.add(cyl(PR * 1.2, 0.24, mat, d2, d2.clone().multiplyScalar(HALF - 0.12))); return g; }
function mkCross(color, dirs) { const g = new THREE.Group(), mat = pipeMat(color);
  dirs.forEach(d => { g.add(cyl(PR, HALF, mat, d, d.clone().multiplyScalar(HALF / 2))); g.add(cyl(PR * 1.2, 0.24, mat, d, d.clone().multiplyScalar(HALF - 0.12))); });
  const hub = new THREE.Mesh(new THREE.BoxGeometry(PR * 2.3, PR * 2.3, PR * 2.3), mat); hub.castShadow = true; g.add(hub); return g; }
function mkWheel() { const g = new THREE.Group(), mat = pipeMat('#3fd84a');
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 32), mat); rim.rotation.x = Math.PI / 2; g.add(rim);
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.07), mat); s.rotation.y = k * Math.PI / 6; g.add(s); }
  g.add(cyl(0.12, 0.2, mat, YAX, V(0, 0, 0))); g.traverse(o => o.castShadow = true); return g; }
function mkSmall(color) { const g = new THREE.Group(), mat = pipeMat(color); g.add(cyl(PR * 0.9, 0.5, mat, DX, V(0, 0, 0))); g.add(cyl(PR * 1.15, 0.18, mat, DX, V(0.2, 0, 0))); return g; }
// 조립 설계(칸 단위). kind: s(곧은)·e(ㄴ자)·x(십자)·t(T자)
const CANE = [['s', 0, 0, [DZ]], ['s', 0, 1, [DZ]], ['s', 0, 2, [DZ]], ['s', 0, 3, [DZ]], ['s', 0, 4, [DZ]], ['e', 0, -1, [DZ, NX]], ['s', -1, -1, [DX]], ['e', -2, -1, [DX, DZ]]];
const FRAME = [['e', 0, 0, [DX, DZ]], ['s', 1, 0, [DX]], ['e', 2, 0, [NX, DZ]], ['s', 0, 1, [DZ]], ['s', 2, 1, [DZ]], ['e', 0, 2, [DX, NZ]], ['e', 2, 2, [NX, NZ]], ['s', 1, 2, [DX]]];
const WINDMILL = [['x', 0, 0, [DX, DZ, NX, NZ]], ['s', 1, 0, [DX]], ['e', 2, 0, [NX, DZ]], ['s', 0, 1, [DZ]], ['e', 0, 2, [NZ, NX]], ['s', -1, 0, [NX]], ['e', -2, 0, [DX, NZ]], ['s', 0, -1, [NZ]], ['e', 0, -2, [DZ, DX]]];
const KCOL = { s: PIPE.yellow, e: PIPE.red, x: PIPE.green, t: PIPE.pink };
function mkPiece([kind, , , dirs]) { return kind === 's' ? mkStraight(KCOL.s, dirs[0]) : kind === 'e' ? mkElbow(KCOL.e, dirs[0], dirs[1]) : mkCross(KCOL[kind], dirs); }
const cellW = (o, cx, cz) => V(o.x + cx * PU, PR, o.z + cz * PU);
// 도안 종이: 설계를 색 굵은 선으로 그린 그림
function designSheet(plan, x, z, w = 3.6, d = 4.8) {
  const xs = plan.map(p => p[1]), zs = plan.map(p => p[2]), mnx = Math.min(...xs) - 0.6, mxx = Math.max(...xs) + 0.6, mnz = Math.min(...zs) - 0.6, mxz = Math.max(...zs) + 0.6;
  const sc = Math.min(700 / (mxx - mnx), 980 / (mxz - mnz)), ox = 420 - (mnx + mxx) / 2 * sc, oz = 580 - (mnz + mxz) / 2 * sc;
  const draw = c => { c.lineCap = 'round'; plan.forEach(([k, cx, cz, dirs]) => { const X = ox + cx * sc, Z = oz + cz * sc, h = sc / 2;
      c.strokeStyle = KCOL[k]; c.lineWidth = sc * 0.42;
      if (k === 's') { c.beginPath(); c.moveTo(X - dirs[0].x * h, Z - dirs[0].z * h); c.lineTo(X + dirs[0].x * h, Z + dirs[0].z * h); c.stroke(); }
      else if (k === 'e') { const [a, b] = dirs; c.beginPath(); c.moveTo(X + a.x * h, Z + a.z * h); c.quadraticCurveTo(X, Z, X + b.x * h, Z + b.z * h); c.stroke(); }
      else { dirs.forEach(dd => { c.beginPath(); c.moveTo(X, Z); c.lineTo(X + dd.x * h, Z + dd.z * h); c.stroke(); }); }
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.25)'; });
    plan.forEach(([k, cx, cz]) => { c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.arc(ox + cx * sc, oz + cz * sc, 4, 0, 7); c.fill(); }); };
  const s = makeSheet(draw, w, d); s.position.set(x, 0.015, z); return s; }
function makeSheet(drawFn, w = 4.2, d = 5.8) { const c = document.createElement('canvas'); c.width = 840; c.height = 1160; const x = c.getContext('2d');
  x.fillStyle = '#fbfbfb'; x.fillRect(0, 0, 840, 1160); drawFn(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const side = new THREE.MeshStandardMaterial({ color: '#f3f3f3' });
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, 0.03, d, 2, 0.01), [side, side, new THREE.MeshStandardMaterial({ map: t, roughness: 0.3 }), side, side, side]);
  m.receiveShadow = true; m.position.y = 0.015; scene.add(m); return m; }
// 블록 무더기: 같은 모양끼리 줄지어 놓은 자리
function pileSpot(kind, i) { const row = { e: 0, s: 1, x: 2, t: 2, o: 3 }[kind], col = kind === 't' ? 2.6 + i * 0.75 : i * 0.75; return V(2.6 + col, PR, -2.3 + row * 1.15); }
function mkKindForPile(kind, i) { if (kind === 'e') return mkElbow(PIPE.red, DX, DZ); if (kind === 's') return mkStraight(PIPE.yellow, DZ);
  if (kind === 'x') return mkCross(PIPE.green, [DX, DZ, NX, NZ]); if (kind === 't') return mkCross(PIPE.pink, [DX, NX, DZ]);
  return i === 0 ? mkWheel() : mkSmall(['#ff8a1c', '#a06bff', '#3a8bff', '#b6f03a'][i - 1]); }
const KIT = [['e', 6], ['s', 6], ['x', 2], ['t', 2], ['o', 5]];   // 모두 21개
function makeKit() { const all = []; KIT.forEach(([k, n]) => { for (let i = 0; i < n; i++) { const m = mkKindForPile(k, i); m.userData = { kind: k, home: pileSpot(k, i) }; m.position.copy(m.userData.home); scene.add(m); all.push(m); } }); return all; }
// 설계대로 조립: 블록을 무더기에서 꺼내 칸 자리로 날린다
function assembler(plan, origin, t0, per) { const pcs = plan.map(p => { const m = mkPiece(p); scene.add(m); m.visible = false; return m; });
  return { pcs, frame(t, from) { pcs.forEach((m, i) => { const s = t0 + i * per, p = ez(t, s, per * 0.6); m.visible = t > s;
      const to = cellW(origin, plan[i][1], plan[i][2]); if (m.visible) arcMove(m, from(plan[i][0]), to, p, 1.6); }); } }; }

// ═════════ 파이프 블록 1: 활동 소개 ═════════
function p1() { setCam(V(0.6, 11.0, 7.2), V(0.6, 0, 0.5));
  const sh = designSheet(CANE, -3.4, 0.2), kit = makeKit();
  const T = 15; ev(0.6, 'whoosh'); kit.forEach((m, i) => ev(1.4 + i * 0.07, 'tok', i)); ev(9.0, 'pop'); ev(10.6, 'tok'); ev(11.0, 'ding');
  const a = mkStraight(PIPE.yellow, DX), b = mkStraight(PIPE.yellow, DX); scene.add(a, b); a.visible = b.visible = false;
  return { T, frame(t) {
    sh.position.y = 0.015 + 3 * (1 - ez(t, 0.4, 0.8));
    kit.forEach((m, i) => { const p = ez(t, 1.2 + i * 0.07, 0.4); m.scale.setScalar(Math.max(0.01, p)); });
    a.visible = b.visible = t > 9.0; a.position.set(-0.3 - 0.6 * (1 - ez(t, 9.6, 1.0)), PR + 1.2, 2.6); b.position.set(0.6, PR + 1.2, 2.6);
    render3D();
    title('파이프 모양 블록을 도안처럼 꾹 눌러 끼워요', win(t, 0.3, 8.8));
    const [sx, sy] = proj(V(-3.4, 0, 2.8)); pill('도안', sx, sy + 30, win(t, 1.2, 8.8), { size: 44, bg: '#1f2a37' });
    title('작은 쪽을 큰 쪽에 꾹! 하면 끼워져요', win(t, 8.8, T - 0.5));
    badge('다양한 모양을 만들어 보아요', win(t, 3.0, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 파이프 블록 2: 같은 모양끼리 분류 + 양쪽 크기 ═════════
function p2() {
  const kit = makeKit(); let s = 3; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  kit.forEach(m => { m.userData.mess = V(-2.2 + rnd() * 5.4, PR, -2.2 + rnd() * 4.2); m.userData.spin = rnd() * 6; });
  const ORD = ['e', 's', 'x', 't', 'o'], NAME = { e: 'ㄴ자 블록', s: '곧은 블록', x: '십자 블록', t: 'T자 블록', o: '그 밖의 블록' };
  const S0 = 2.4, SD = 2.4, Z0 = S0 + ORD.length * SD + 0.6, T = Z0 + 9.5;
  ORD.forEach((k, i) => ev(S0 + i * SD, 'pop', i)); ev(Z0, 'whoosh'); ev(Z0 + 6.2, 'tok'); ev(Z0 + 6.6, 'ding');
  const A = mkStraight(PIPE.yellow, DX), B = mkStraight(PIPE.yellow, DX); scene.add(A, B); A.visible = B.visible = false;
  return { T, frame(t) {
    const z = ez(t, Z0, 1.6);
    setCam(V(0.6, 11.0, 7.2).lerp(V(0.2, 3.2, 3.0), z), V(0.6, 0, 0.5).lerp(V(0.2, 1.0, 0), z));
    kit.forEach(m => { const u = m.userData, k = ORD.indexOf(u.kind), p = ez(t, S0 + k * SD + 0.4, 1.0);
      m.position.copy(u.mess).lerp(u.home, p); m.position.y += Math.sin(p * Math.PI) * 1.0; m.rotation.y = u.spin * (1 - p); m.visible = z < 0.5; });
    A.visible = B.visible = z > 0.5; const j = ez(t, Z0 + 4.8, 1.4);
    A.position.set(-0.05 - 0.9 * (1 - j), 1.0, 0); B.position.set(0.85, 1.0, 0);
    render3D();
    title('먼저 같은 모양끼리 나눠요', win(t, 0.3, S0 - 0.1));
    ORD.forEach((k, i) => { const v = k === 't' ? pileSpot('t', 1).add(V(0.9, 0, 0)) : pileSpot(k, 0).add(V(-0.7, 0, 0)); const [x, y] = proj(v); pill(NAME[k], k === 't' ? x + 90 : x - 110, y, win(t, S0 + i * SD, Z0), { size: 34, bg: '#fff', color: '#1f2a37', border: ACC }); });
    if (t > S0 - 0.1 && t < Z0) { const i = Math.min(4, Math.floor((t - S0) / SD)); title(`${NAME[ORD[i]]}끼리 모아요`, win(t, S0 - 0.1, Z0)); }
    title('블록 양쪽 크기가 달라요', win(t, Z0 + 0.4, Z0 + 4.6));
    const [bx, by] = proj(V(0.85 + HALF - 0.13, 1.0 + 0.3, 0)), [sx, sy] = proj(V(0.85 - HALF + 0.05, 1.0 + 0.3, 0));
    pill('큰 쪽', bx + 40, by - 70, win(t, Z0 + 1.6, Z0 + 4.8), { size: 46, bg: ACC }); pill('작은 쪽', sx - 40, sy - 70, win(t, Z0 + 2.4, Z0 + 4.8), { size: 46, bg: '#1f2a37' });
    title('작은 쪽을 큰 쪽에 꾹 눌러 끼워요', win(t, Z0 + 4.6, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// 조립 장면 공통(지팡이·액자·바람개비)
function buildScene(plan, steps, finishText, per = 1.9, intro = 'Z', selfMode = false) {
  setCam(V(0.6, 11.0, 7.2), V(0.6, 0, 0.5));
  const sh = designSheet(plan, -3.6, 0.2), kit = makeKit(), origin = V(0.2, 0, -0.8);
  const used = { e: 0, s: 0, x: 0, t: 0 }, src = plan.map(p => kit.find(m => m.userData.kind === p[0] && !m.userData.taken && (m.userData.taken = true)));
  const S0 = 3.2, T = S0 + plan.length * per + 4.0, asm = assembler(plan, origin, S0, per);
  plan.forEach((p, i) => { ev(S0 + i * per, 'whoosh', i); ev(S0 + i * per + per * 0.6, 'tok', i); }); ev(T - 3.6, 'ding');
  return { T, frame(t) {
    src.forEach((m, i) => m.visible = t < S0 + i * per);
    asm.frame(t, () => V(0, 0, 0)); asm.pcs.forEach((m, i) => { if (t > S0 + i * per) { const p = ez(t, S0 + i * per, per * 0.6); arcMove(m, src[i].userData.home, cellW(origin, plan[i][1], plan[i][2]), p, 1.6); } });
    render3D();
    title(steps.intro, win(t, 0.3, S0 - 0.1));
    steps.list.forEach(([from, to, text]) => title(text, win(t, S0 + from * per - 0.1, S0 + to * per - 0.1)));
    const [sx, sy] = proj(V(-3.6, 0, 2.7)); pill(selfMode ? '그림을 보고 똑같이!' : '도안', sx, sy + 30, win(t, 0.6, T - 0.5), { size: 40, bg: '#1f2a37' });
    badge(finishText, win(t, T - 3.6, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 파이프 블록 3: 지팡이 ═════════
const p3 = () => buildScene(CANE, { intro: '첫 번째 그림: 지팡이를 만들어요', list: [[0, 5, '노란 곧은 블록 5개를 한 줄로 꾹꾹'], [5, 6, '빨간 ㄴ자 블록을 끼워요'], [6, 7, '노란 블록 하나 더'], [7, 8.9, '마지막은 무슨 색일까요? 빨간 ㄴ자 블록!']] }, '지팡이 완성!');

// ═════════ 파이프 블록 4: 하나씩 빼서 정리 ═════════
function p4() { setCam(V(0.6, 11.0, 7.2), V(0.6, 0, 0.5));
  const sh = designSheet(CANE, -3.6, 0.2), kit = makeKit(), origin = V(0.2, 0, -0.8);
  const src = CANE.map(p => kit.find(m => m.userData.kind === p[0] && !m.userData.taken && (m.userData.taken = true)));
  const pcs = CANE.map(p => { const m = mkPiece(p); scene.add(m); m.position.copy(cellW(origin, p[1], p[2])); return m; });
  const S0 = 2.2, per = 1.3, T = S0 + CANE.length * per + 3.4, order = [7, 6, 5, 4, 3, 2, 1, 0];
  order.forEach((k, j) => ev(S0 + j * per + 0.2, 'pop', j)); ev(T - 3.0, 'ding');
  return { T, frame(t) {
    order.forEach((k, j) => { const s = S0 + j * per, p = ez(t, s, per * 0.7); arcMove(pcs[k], cellW(origin, CANE[k][1], CANE[k][2]), src[k].userData.home, p, 1.6);
      pcs[k].visible = p < 1; src[k].visible = p >= 1; });
    render3D();
    title('다음 그림을 위해 하나씩 빼요', win(t, 0.3, T - 3.2));
    badge('같은 모양끼리 다시 정리해요', win(t, 1.0, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

// ═════════ 파이프 블록 5: 네모난 액자 ═════════
const p5 = () => buildScene(FRAME, { intro: '두 번째 그림: 네모난 액자 (노랑 4개·빨강 4개)', list: [[0, 1, '빨간 ㄴ자 블록을 찾아요'], [1, 2, '옆에 노란 블록을 꾹'], [2, 3, '다시 빨간 ㄴ자 블록'], [3, 5, '밑으로 내려가며 노란 블록 양쪽에'], [5, 7, '아래 빨간 ㄴ자 블록을 하나씩'], [7, 9.4, '마지막 노란 블록을 사이에 꾹!']] }, '네모난 액자 완성!');

// ═════════ 파이프 블록 6: 바람개비(스스로) ═════════
const p6 = () => buildScene(WINDMILL, { intro: '세 번째 그림: 바람개비는 스스로 만들어 보세요', list: [[0, 9.6, '그림을 보고 빠지지 않게 꾹꾹 끼워요']] }, '바람개비 완성!', 1.2, 'Z', true);

// ═════════ 파이프 블록 7: 정리(도안 첫 장 위로 + 블록 21개 세기) ═════════
function p7() { setCam(V(0.6, 11.0, 7.2), V(0.6, 0, 0.5));
  const sheets = [WINDMILL, FRAME, CANE].map((pl, i) => { const s = designSheet(pl, -3.6 + i * 0.05, 0.2 - i * 0.05); s.position.y = 0.015 + i * 0.035; return s; });
  const kit = makeKit(); let sd = 5; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  kit.forEach(m => { m.userData.mess = V(-0.9 + rnd() * 2.6, PR, -1.6 + rnd() * 3.6); m.userData.spin = rnd() * 6; });
  const pouch = yellowPouch(6.6, 2.6), MOUTH = V(6.6, 2.0, 2.6); pouch.scale.setScalar(0.8);
  const S1 = 4.6, CD = 0.75, C0 = S1 + 0.6, P0 = C0 + 21 * CD + 1.4, T = P0 + 2.4 + 3.4;
  ev(1.2, 'pop'); kit.forEach((m, i) => { ev(C0 + i * CD, 'count', i); ev(C0 + i * CD + 0.45, 'tok', i); }); ev(P0, 'whoosh'); ev(T - 3.2, 'ding');
  return { T, frame(t) {
    kit.forEach((m, i) => { const u = m.userData, p = ez(t, C0 + i * CD, 0.55); m.position.copy(u.mess).lerp(u.home, p); m.position.y += Math.sin(p * Math.PI) * 1.0;
      m.rotation.y = u.spin * (1 - p); const q = ez(t, P0 + i * 0.05, 0.9); if (q > 0) { m.position.lerp(MOUTH, q); m.scale.setScalar(Math.max(0.05, 1 - q)); } });
    render3D();
    title('도안은 첫 장(지팡이)이 위로 오게 펼쳐요', win(t, 0.3, S1));
    outline3D(-3.5, 0.1, 3.7, 4.9, 0.12, win(t, 1.0, S1), t);
    title('블록을 모양별로 세면서 정리해요', win(t, S1, P0 - 0.2));
    kit.forEach((m, i) => { const s = clamp((t - C0 - i * CD) / 0.15); numberAt(m.userData.home.clone().add(V(0, 0.7, 0)), i + 1, s * (1 - clamp((t - C0 - i * CD - 0.6) / 0.2)), 0.7 + 0.2 * s); });
    const n = kit.filter((m, i) => t >= C0 + i * CD + 0.45).length; if (t > C0) pill(`블록 ${n}개 / 21개`, W - 260, 200, win(t, C0, T - 0.5), { size: 44, bg: '#1f2a37' });
    badge('빨강 6 · 노랑 6 · 초록 2 · 분홍 2 · 나머지 5', win(t, S1 + 0.4, P0 - 0.2));
    title('나눠 드린 주머니에 블록을 담아요', win(t, P0 - 0.2, T - 3.4));
    badge('정리 끝! 잘하셨어요', win(t, T - 3.2, T - 0.5));
    fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); } }; }

const SCENES = { 1: g1, 2: g2, 3: g3, 4: g4, 5: g5, 6: g6, 7: g7, 8: g8, 11: p1, 12: p2, 13: p3, 14: p4, 15: p5, 16: p6, 17: p7 };
const S = SCENES[SCN]();
window.TOTAL = S.T; window.EVENTS = EVENTS;
window.frame = t => { g.clearRect(0, 0, W, H); S.frame(t); return out.toDataURL('image/png').split(',')[1]; };
document.fonts.load(`900 60px ${FONT}`).then(() => { document.title = 'done'; });
