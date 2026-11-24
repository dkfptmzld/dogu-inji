// ═════════ 8~10주차 장면 (w810_body.js 다음에 이어 붙임) ═════════
const fin = (t, T) => { fade(1 - clamp(t / 0.4)); fade(clamp((t - (T - 0.5)) / 0.5)); };
function counter(text, a) { pill(text, W - 250, 215, a, { size: 54, bg: '#1f2a37' }); }
function pressMark(v, a, t, text = '꾹!') { if (a <= 0) return; const [x, y] = proj(v); g.save(); g.globalAlpha = a;
  const r = 30 + 6 * Math.sin(t * 9); g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 7; g.strokeStyle = ACC; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  pill(text, x, y - 80, a, { size: 38, bg: '#1f2a37' }); }
function fingerMark(v, a, label) { if (a <= 0) return; const [x, y] = proj(v); g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10;
  g.fillStyle = '#f5cca8'; g.beginPath(); g.ellipse(x, y, 26, 34, 0, 0, Math.PI * 2); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 6; g.strokeStyle = ACC; g.stroke(); g.fillStyle = '#fff3e8'; g.beginPath(); g.ellipse(x, y - 14, 15, 11, 0, 0, Math.PI * 2); g.fill(); g.restore();
  if (label) pill(label, x, y - 70, a, { size: 30, bg: ACC }); }

// ═════════ 8-2 산가지 ═════════
const STK_CAM = () => setCam(V(0, 16.2, 3.2), V(0, 0, -0.2));
function stickRow() { return [...Array(25)].map((_, i) => { const m = makeStick(i); m.userData.home = V(0, STICK_T / 2, -0.5 - i * 0.165); m.position.copy(m.userData.home); return m; }); }
function whitePad() { const p = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 })); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.004, 2.35); p.receiveShadow = true; scene.add(p); return p; }
// 1 소개
function s81() { STK_CAM(); whitePad(); const st = stickRow(); const D0 = 0.8, DD = 0.17, T = D0 + 25 * DD + 6.5;
  st.forEach((m, i) => ev(D0 + i * DD + 0.25, 'tok', i)); ev(D0 + 25 * DD + 0.4, 'ding');
  return { T, frame(t) { st.forEach((m, i) => { const p = ez(t, D0 + i * DD, 0.3); m.visible = t > D0 + i * DD; m.position.copy(m.userData.home); m.position.y += 2.5 * (1 - p); });
    render3D(); title('알록달록 색깔 막대기 25개', win(t, 0.3, D0 + 25 * DD + 1.2));
    const n = st.filter((m, i) => t >= D0 + i * DD + 0.25).length; if (n) counter(`${n}개`, win(t, D0, T - 0.5));
    title('손가락으로 옮겨 보고 맞춰 보아요', win(t, D0 + 25 * DD + 1.2, T - 0.4));
    badge('양손 검지로 하나씩 끌어오며 세어요', win(t, D0 + 25 * DD + 1.6, T - 0.4)); fin(t, T); } }; }
// 2~4 검지로 k개씩 끌어오며 세기
function scrape(k) { return () => { STK_CAM(); whitePad(); const st = stickRow(); const n = Math.ceil(25 / k), D = [0, 1.45, 1.9, 2.25][k], S0 = 3.0, T = S0 + n * D + 3.6;
  const dest = i => V(0, STICK_T / 2, 0.45 + (24 - i) * 0.165);
  for (let j = 0; j < n; j++) { ev(S0 + j * D + 0.2, 'tok', j); ev(S0 + j * D + 0.45, 'whoosh'); ev(S0 + j * D + 1.2, 'count', Math.min(25, (j + 1) * k)); } ev(T - 3.2, 'ding');
  return { T, frame(t) { let cur = -1, curP = 0;
    st.forEach((m, i) => { const j = Math.floor(i / k), p = ez(t, S0 + j * D + 0.45, 0.75); m.position.copy(m.userData.home).lerp(dest(i), p); if (t > S0 + j * D && t < S0 + (j + 1) * D) { cur = j; curP = p; } });
    render3D();
    title(`양손 검지로 ${k}개씩 끌어오며 세어요`, win(t, 0.3, T - 3.3));
    if (cur >= 0) { const last = Math.min(24, cur * k + k - 1), z = st[last].position.z - 0.22, tt = t - S0 - cur * D;
      for (const sx of [-1.5, 1.5]) fingerMark(V(sx, 0.2, z), win(tt, 0.05, D - 0.15, 0.15), cur === 0 && sx < 0 ? '검지' : ''); }
    const nn = st.filter((m, i) => t >= S0 + Math.floor(i / k) * D + 1.2).length; if (t > S0) counter(`${nn}개`, win(t, S0, T - 0.5));
    badge(k === 1 ? '한 번에 한 개씩' : k === 2 ? '이번엔 한 번에 두 개씩' : '마지막은 한 번에 세 개씩', win(t, 0.6, S0 + 2 * D));
    badge('25개 모두 셌어요! 잘하셨어요', win(t, T - 3.2, T - 0.5)); fin(t, T); } }; }; }
// 5~6 세모·네모 포개어 쌓기
function stack(tri) { return () => { setCam(V(0, 7.2, 8.4), V(0, 0.8, -0.8)); const st = [...Array(25)].map((_, i) => { const m = makeStick(i); m.userData.home = V(0, STICK_T / 2, -3.4 - i * 0.165); m.position.copy(m.userData.home); return m; });
  const slot = tri ? triSlot : sqSlot, per = 0.8, S0 = 3.0, T = S0 + 25 * per + 4;
  st.forEach((m, i) => { ev(S0 + i * per + 0.62, 'tok', i); }); ev(T - 3.4, 'ding');
  const first = tri ? 3 : 4;
  return { T, frame(t) { st.forEach((m, i) => { const s = slot(i), p = ez(t, S0 + i * per, 0.65); arcMove(m, m.userData.home, s.pos, p, 1.2); m.rotation.set(0, s.ry * p, (s.tilt || 0) * p); });
    render3D();
    title(tri ? '막대기를 서로 포개어 세모를 만들어요' : '막대기를 서로 포개어 네모를 만들어요', win(t, 0.3, S0 + first * per + 0.6));
    title('그 위로 가지런히 높이 쌓아 올려요', win(t, S0 + first * per + 0.6, T - 3.5));
    const n = st.filter((m, i) => t >= S0 + i * per + 0.62).length; if (t > S0) counter(`${n} / 25`, win(t, S0, T - 0.5));
    badge(tri ? '세모 탑 완성!' : '네모 탑 완성!', win(t, T - 3.4, T - 0.5)); fin(t, T); } }; }; }
// 7 정리: 위에서부터 하나씩 빼며 25개 세기 → 주머니
function s87() { setCam(V(0.8, 9.0, 10.0), V(0.8, 0.6, -0.4)); const st = [...Array(25)].map((_, i) => { const m = makeStick(i + 3); placeStick(m, sqSlot(i)); m.userData.s = sqSlot(i); return m; });
  const pouch = yellowPouch(5.6, 1.2); pouch.scale.setScalar(0.75); const MOUTH = V(5.6, 1.9, 1.2);
  const per = 0.72, S0 = 2.6, T = S0 + 25 * per + 4; for (let k = 0; k < 25; k++) ev(S0 + k * per + 0.5, 'count', k + 1); ev(T - 3.4, 'ding');
  return { T, frame(t) { st.forEach((m, i) => { const k = 24 - i, p = ez(t, S0 + k * per, 0.6); arcMove(m, m.userData.s.pos, MOUTH, p, 1.4); m.rotation.y = m.userData.s.ry; m.visible = p < 0.98; m.scale.setScalar(1 - 0.5 * p); });
    render3D(); title('위에서부터 하나씩 빼며 개수를 세어요', win(t, 0.3, T - 3.5));
    const n = st.filter((m, i) => t >= S0 + (24 - i) * per + 0.5).length; if (t > S0) counter(`${n} / 25`, win(t, S0, T - 0.5));
    badge('주머니에 담아 정리해요', win(t, S0 + 1, T - 3.5)); badge('25개 정리 끝! 잘하셨어요', win(t, T - 3.4, T - 0.5)); fin(t, T); } }; }

// ═════════ 9-1 스트로우 블록 ═════════
const resamp = (pts, n = 24) => { const c = new THREE.CatmullRomCurve3(pts); return [...Array(n + 1)].map((_, i) => c.getPointAt(i / n)); };
const lerpPts = (A, B, p) => A.map((a, i) => a.clone().lerp(B[i], p));
function strawShow(m, pts, p = 1) { if (p <= 0.02) { m.visible = false; return; } m.visible = true;
  const c = new THREE.CatmullRomCurve3(pts), n = Math.max(2, Math.round(24 * p)); setStraw(m, [...Array(n + 1)].map((_, i) => c.getPointAt(p * i / n))); }
function hubShow(h, pos, p = 1) { h.visible = p > 0.01; h.position.copy(pos); h.scale.setScalar(0.85 * (p < 1 ? easeOut(p) * 1.15 - 0.15 * p : 1)); }
const FRONT = (y = 3.0) => { setCam(V(0, y, 11.5), V(0, y, 0)); table.visible = false; };
function rig(nS, nH, cols) { const G = new THREE.Group(); scene.add(G);
  const S = [...Array(nS)].map((_, i) => { const m = makeStraw(cols ? cols[i] : i, [V(0, 0, 0), V(0.1, 0, 0)]); G.add(m); return m; });
  const Hh = [...Array(nH)].map(() => { const h = makeHub(); G.add(h); return h; }); return { G, S, H: Hh }; }
const segPts = (a, b, n = 24) => { const A = a.clone().lerp(b, 0.05), B = a.clone().lerp(b, 0.95); return [...Array(n + 1)].map((_, i) => A.clone().lerp(B, i / n)); };
const arcPts = (c, r, a0, a1, n = 24) => [...Array(n + 1)].map((_, i) => { const a = a0 + (a1 - a0) * i / n; return V(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0); });
// 1 소개: 접시의 빨대 + 상자의 꽂이
function s91() { setCam(V(0, 11.5, 6.8), V(0, 0, 0.3));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.01, 0], [1.6, 0.05], [2.1, 0.6], [2.35, 1.1], [2.5, 1.15]].map(([r, y]) => new THREE.Vector2(r, y)), 64), new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.6, side: THREE.DoubleSide }));
  bowl.position.set(-2.2, 0, 0); bowl.castShadow = bowl.receiveShadow = true; scene.add(bowl);
  const straws = [...Array(25)].map((_, i) => { const a = -0.5 + (i % 13) * 0.08, z = -1.6 + i * 0.13; return makeStraw(i, segPts(V(-3.6 + a, 0.25 + (i % 3) * 0.05, z), V(-0.8 + a, 1.3, z + 0.3))); });
  const tray = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.3, 3.0, 2, 0.08), mat('#c8935a', 0.8)); tray.position.set(2.4, 0.15, 0.4); tray.castShadow = tray.receiveShadow = true; scene.add(tray);
  let sd = 3; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const hubs = [...Array(18)].map(() => { const h = makeHub(); h.position.set(2.4 + (rnd() - 0.5) * 1.1, 0.42 + rnd() * 0.1, 0.4 + (rnd() - 0.5) * 2.4); h.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); return h; });
  const demoS = makeStraw(3, segPts(V(-1.4, 0.6, 3.1), V(1.4, 0.6, 3.1))), demoH = makeHub(); demoS.visible = false;
  const T = 13; ev(0.6, 'pop'); ev(3.0, 'pop'); ev(6.3, 'whoosh'); ev(7.6, 'tok'); ev(8.0, 'ding');
  return { T, frame(t) { const p = ez(t, 6.2, 1.2); demoS.visible = t > 6.2; demoS.position.set(0, 0, -2.6 * (1 - p));
    demoH.position.copy(V(2.4, 0.5, 0.4).lerp(V(1.62, 0.6, 3.1), ez(t, 6.6, 1.0))); demoH.position.y += Math.sin(ez(t, 6.6, 1.0) * Math.PI) * 1.2; demoH.visible = t > 6.6; demoH.rotation.set(0, Math.PI / 2, 0);
    render3D(); title('빨대처럼 길다란 블록에 노란 꽂이를 끼워요', win(t, 0.3, T - 0.4));
    const [x1, y1] = proj(V(-2.2, 1.2, -2.6)), [x2, y2] = proj(V(2.4, 0.4, -1.3));
    pill('빨대 블록 25개', x1, y1, win(t, 0.8, 6.0), { size: 40, bg: '#1f2a37' }); pill('꽂이 (올록볼록 노란 고리)', x2, y2, win(t, 3.0, 6.0), { size: 40, bg: '#1f2a37' });
    pressMark(V(1.55, 0.6, 3.1), win(t, 7.5, 10.5), t, '꾹 꽂아요');
    badge('저와 함께 다양한 모양을 만들어 봐요', win(t, 8.5, T - 0.4)); fin(t, T); } }; }
// 2 동그라미 → 핸들 팔운동 10번
function s92() { FRONT(3.0); const r = 2.0, Ls = Math.PI * r / 2, R = rig(4, 4); R.G.position.set(0, 1.0, 0); R.G.scale.setScalar(0.9);
  const pt = (s, k) => k < 1e-4 ? V(s, 0, 0) : V(Math.sin(s * k) / k, (1 - Math.cos(s * k)) / k, 0);
  const S0 = 2.6, SD = 1.5, B0 = S0 + 4 * SD + 1.4, BD = 2.6, A0 = B0 + BD + 1.6, AC = 1.7, T = A0 + 10 * AC + 3.6;
  for (let i = 0; i < 4; i++) { ev(S0 + i * SD, 'pop', i); ev(S0 + i * SD + 1.05, 'tok', i); } ev(B0, 'whoosh'); ev(B0 + BD, 'tok'); ev(B0 + BD + 0.2, 'ding');
  for (let c = 0; c < 10; c++) ev(A0 + c * AC + AC / 4, 'count', c + 1); ev(T - 3.2, 'ding');
  return { T, frame(t) { const k = ez(t, B0, BD) / r;
    R.S.forEach((m, i) => { const a = -2 * Ls + i * Ls + 0.08, b = a + Ls - 0.16; strawShow(m, [...Array(25)].map((_, j) => pt(a + (b - a) * j / 24, k)), ez(t, S0 + i * SD, 0.9)); });
    R.H.forEach((h, i) => hubShow(h, pt(-2 * Ls + (i + 1) * Ls, k), ez(t, S0 + i * SD + 1.0, 0.3)));
    R.G.rotation.z = t > A0 ? 0.5 * Math.sin((t - A0) / AC * Math.PI * 2) * (1 - clamp((t - (A0 + 10 * AC)) / 0.6)) : 0;
    R.G.position.y = 1.0; render3D();
    title('빨대 4개를 꽂이로 길게 이어요', win(t, 0.3, B0 - 0.2));
    title('양쪽을 잡고 둥글게 말아 꽂이에 끼워요', win(t, B0 - 0.2, A0 - 0.3)); pressMark(V(0, 1.0 + 0.9 * 2 * r * 0.98, 0).applyMatrix4(new THREE.Matrix4()), win(t, B0 + BD - 0.3, A0 - 0.3), t, '꾹!');
    title('자동차 핸들처럼 잡고 팔운동!', win(t, A0 - 0.3, A0 + 10 * AC));
    if (t > A0) { const c = Math.min(10, Math.floor((t - A0 - AC / 4) / AC) + 1); if (c > 0) counter(`${c} / 10`, win(t, A0, A0 + 10 * AC + 0.5)); }
    badge('동그라미 완성!', win(t, B0 + BD, A0 - 0.3)); badge('앞으로 나란히 → 크게 왼쪽·오른쪽 10번', win(t, A0, A0 + 10 * AC));
    title('다 했으면 목에 걸어 목걸이처럼!', win(t, A0 + 10 * AC, T - 0.4)); badge('어르신들이 아주 좋아하세요', win(t, A0 + 10 * AC + 0.4, T - 0.4)); fin(t, T); } }; }
// 3 세모
function s93() { FRONT(2.8); const s = 3.6, h = s * Math.sqrt(3) / 2, R = rig(3, 3, [2, 1, 3]); R.G.position.set(0, 0.9, 0);
  const A = V(-s / 2, 0, 0), B = V(s / 2, 0, 0), up = V(0, s, 0), Ap = V(0, h, 0);
  const S0 = 2.4, T = 19.5; ev(S0, 'pop'); ev(S0 + 1.2, 'tok'); ev(S0 + 1.5, 'tok'); ev(5.6, 'pop'); ev(7.6, 'tok'); ev(9.8, 'whoosh'); ev(11.6, 'tok'); ev(12.0, 'ding');
  return { T, frame(t) { const bend = ez(t, 9.8, 1.8);
    strawShow(R.S[0], segPts(A, B), ez(t, S0, 1.0)); hubShow(R.H[0], A, ez(t, S0 + 1.1, 0.3)); hubShow(R.H[1], B, ez(t, S0 + 1.4, 0.3));
    const tl = A.clone().add(up).lerp(Ap, bend), tr = B.clone().add(up).lerp(Ap, bend);
    strawShow(R.S[1], segPts(A, tl), ez(t, 5.6, 1.0)); strawShow(R.S[2], segPts(B, tr), ez(t, 5.9, 1.0)); hubShow(R.H[2], tl.clone().add(V(0, 0.1 * (1 - bend), 0)), ez(t, 7.5, 0.3));
    render3D();
    title('빨대 양쪽에 꽂이를 꽂아요', win(t, 0.3, 5.4)); title('그 위로 빨대 두 개를 꽂아요', win(t, 5.4, 7.3)); title('한쪽에만 꽂이를 꽂고', win(t, 7.3, 9.6));
    title('이번엔 꽂이의 옆 부분에 꾹 눌러 끼워요', win(t, 9.6, 12.0)); pressMark(V(0, 0.9 + h, 0), win(t, 11.2, 13.6), t, '옆 부분에 꾹!');
    title('세모 완성!', win(t, 12.0, T - 0.4)); badge('동그라미는 위, 세모는 옆에 끼워요', win(t, 12.6, T - 0.4)); fin(t, T); } }; }
// 4 세모 변신: 뒤집기 → 빨대 2개 위로 → 둥글게 → 도토리·아이스크림·배드민턴채
function iceGeom() { const s = 3.4, h = s * Math.sqrt(3) / 2, cy = h / 3;     // 뒤집은 세모(무게중심 0) + 위 동그라미
  const a = V(-s / 2, cy, 0), b = V(s / 2, cy, 0), ap = V(0, cy - h, 0), c = V(0, cy + 1.35, 0), r = c.distanceTo(a);
  const aA = Math.atan2(a.y - c.y, a.x - c.x) + Math.PI * 2, aB = Math.atan2(b.y - c.y, b.x - c.x);
  return { a, b, ap, c, r, top: V(0, c.y + r, 0), tri: [segPts(ap, b), segPts(b, a), segPts(a, ap)], loopL: arcPts(c, r, aA, Math.PI / 2 + 0.05), loopR: arcPts(c, r, aB, Math.PI / 2 - 0.05) }; }
function s94() { FRONT(3.0); const I = iceGeom(), R = rig(5, 4, [1, 2, 3, 4, 0]); R.G.position.set(0, 2.2, 0);
  const F0 = 2.2, FD = 1.3, U0 = 5.2, L0 = 8.4, LD = 1.8, T = 22; ev(F0, 'whoosh'); ev(U0, 'pop'); ev(U0 + 1.0, 'tok'); ev(7.2, 'tok'); ev(L0, 'whoosh'); ev(L0 + LD, 'tok'); ev(L0 + LD + 0.3, 'ding');
  ['도토리', '아이스크림', '배드민턴채', '체'].forEach((s, i) => ev(12 + i * 1.2, 'pop', i));
  return { T, frame(t) { const f = ez(t, F0, FD); R.G.rotation.z = Math.PI * (1 - f); const bend = ez(t, L0, LD);
    I.tri.forEach((p, i) => strawShow(R.S[i], p)); [I.ap, I.b, I.a].forEach((p, i) => hubShow(R.H[i], p));
    const stL = I.a.clone().add(V(0, 3.0, 0)), stR = I.b.clone().add(V(0, 3.0, 0));
    strawShow(R.S[3], lerpPts(segPts(I.a, stL), I.loopL, bend), ez(t, U0, 0.9)); strawShow(R.S[4], lerpPts(segPts(I.b, stR), I.loopR, bend), ez(t, U0 + 0.3, 0.9));
    hubShow(R.H[3], stL.clone().lerp(I.top, bend), ez(t, 7.1, 0.3));
    render3D();
    title('세모를 뒤집으면 꽂이 두 개가 위로 와요', win(t, 0.3, U0 - 0.1)); title('빨대 두 개를 위로 꽂아요', win(t, U0 - 0.1, L0 - 0.1));
    title('두 손으로 둥글게 모아 꽂이에 끼워요', win(t, L0 - 0.1, 11.6)); title('어떤 모양이 보이나요?', win(t, 11.6, T - 0.4));
    ['도토리', '아이스크림', '배드민턴채', '체'].forEach((s, i) => { const x = W / 2 + (i % 2 ? 1 : -1) * 520, y = 360 + Math.floor(i / 2) * 260; pill(s + '?', x, y, win(t, 12 + i * 1.2, T - 0.4), { size: 50, bg: '#fff', color: '#1f2a37', border: ACC }); });
    badge('어떤 대답이든 칭찬해 주세요!', win(t, 16.4, T - 0.4)); fin(t, T); } }; }
// 5 물고기: 옆으로 돌리기 → 빨대·꽂이 더해 물고기
function s95() { FRONT(3.0); const I = iceGeom(), R = rig(5, 5, [1, 2, 3, 4, 0]); R.G.position.set(0, 3.0, 0);
  const rot = p => V(p.y, -p.x, 0);                                     // 시계 방향 90° (동그라미가 오른쪽 = 몸통)
  const Jt = rot(I.a), Jb = rot(I.b), N = rot(I.top), Tt = V(-3.4, 1.5, 0), Tb = V(-3.4, -1.5, 0);
  const body = { c: rot(I.c), r: I.r };
  const fishS = [segPts(Jb, Tt), segPts(Tt, Tb), segPts(Jt, Tb), resamp(rot0(I.loopL)), resamp(rot0(I.loopR))];
  function rot0(P) { return P.map(rot); }
  const iceS = [I.tri[0].map(rot), I.tri[1].map(rot), I.tri[2].map(rot), rot0(I.loopL), rot0(I.loopR)];
  const R0 = 2.0, RD = 1.4, M0 = 5.0, MD = 3.0, T = 20; ev(R0, 'whoosh'); ev(M0, 'pop'); ev(M0 + MD, 'tok'); ev(M0 + MD + 0.4, 'tok'); ev(M0 + MD + 0.6, 'ding');
  return { T, frame(t) { const rr = ez(t, R0, RD), m = ez(t, M0, MD);
    R.G.rotation.z = -Math.PI / 2 * (1 - rr);                         // 처음엔 아이스크림(세운 모양) → 옆으로
    const iceUp = [I.tri[0], I.tri[1], I.tri[2], I.loopL, I.loopR];
    R.S.forEach((s, i) => strawShow(s, t < R0 + RD ? iceS[i].map(p => p) : lerpPts(iceS[i], fishS[i], m)));
    [[rot(I.ap), Tb], [Jb, Jb], [Jt, Jt], [N, N]].forEach(([a, b], i) => hubShow(R.H[i], a.clone().lerp(b, m)));
    hubShow(R.H[4], Tt, ez(t, M0 + MD - 0.3, 0.4));
    render3D();
    title('아이스크림을 옆으로 돌려요', win(t, 0.3, M0 - 0.1)); badge('꽂이 두 개가 하나는 위, 하나는 아래로', win(t, 3.2, M0 - 0.1));
    title('빨대를 위아래로 꽂고 서로 엇갈리게 이어요', win(t, M0 - 0.1, M0 + MD + 0.5)); badge('무엇이 올 차례인지 어르신들과 이야기해요', win(t, M0 + 0.4, M0 + MD + 0.5));
    title('물고기 완성!', win(t, M0 + MD + 0.5, T - 0.4)); badge('순서와 규칙을 함께 익혀요', win(t, M0 + MD + 1.0, T - 0.4)); fin(t, T); } }; }
// 6 하나씩 빼기
function fishParts() { const I = iceGeom(), rot = p => V(p.y, -p.x, 0), Jt = rot(I.a), Jb = rot(I.b), N = rot(I.top), Tt = V(-3.4, 1.5, 0), Tb = V(-3.4, -1.5, 0);
  return { S: [segPts(Jb, Tt), segPts(Tt, Tb), segPts(Jt, Tb), I.loopL.map(rot), I.loopR.map(rot)], H: [Tb, Jb, Jt, N, Tt] }; }
function s96() { FRONT(3.0); const F = fishParts(), R = rig(5, 5, [1, 2, 3, 4, 0]); R.G.position.set(0, 3.0, 0);
  const order = [['H', 4], ['S', 1], ['H', 0], ['S', 0], ['S', 2], ['H', 3], ['S', 3], ['S', 4], ['H', 1], ['H', 2]], per = 1.1, S0 = 2.4, T = S0 + order.length * per + 5;
  order.forEach((o, i) => ev(S0 + i * per + 0.1, 'pop', i)); ev(T - 3.8, 'ding');
  return { T, frame(t) { R.S.forEach((s, i) => strawShow(s, F.S[i])); R.H.forEach((h, i) => hubShow(h, F.H[i]));
    order.forEach(([k, i], j) => { const p = ez(t, S0 + j * per, 0.7), o = k === 'S' ? R.S[i] : R.H[i]; o.position.set(0, -6 * p * p, 0); if (k === 'S') o.position.x = (i % 2 ? 1 : -1) * 2 * p; o.visible = o.visible && p < 0.98; });
    render3D(); title('물고기를 하나씩 하나씩 모두 빼요', win(t, 0.3, T - 3.9));
    badge('빼기 힘든 분은 선생님이 빨대 한쪽을 잡아 드려요', win(t, 1.4, S0 + order.length * per / 2 + 1));
    badge('손으로 끼고 빼는 것이 중요한 소근육 운동!', win(t, S0 + order.length * per / 2 + 1, T - 3.9));
    title('모두 뺐어요! 다음 모양을 만들어요', win(t, T - 3.8, T - 0.4)); fin(t, T); } }; }
// 7 네모 액자
function s97() { FRONT(2.9); const s = 3.4, R = rig(4, 4, [0, 1, 3, 4]); R.G.position.set(0, 1.2, 0);
  const A = V(-s / 2, 0, 0), B = V(s / 2, 0, 0), C = V(s / 2, s, 0), D = V(-s / 2, s, 0);
  const T = 21; [2.4, 5.4, 5.7, 8.6, 11.0].forEach((x, i) => ev(x, i ? 'tok' : 'pop', i)); ev(11.8, 'ding'); ev(14.6, 'pop');
  return { T, frame(t) { strawShow(R.S[0], segPts(A, B), ez(t, 2.2, 1.0)); hubShow(R.H[0], A, ez(t, 3.2, 0.3)); hubShow(R.H[1], B, ez(t, 3.5, 0.3));
    strawShow(R.S[1], segPts(A, D), ez(t, 4.6, 0.9)); strawShow(R.S[2], segPts(B, C), ez(t, 4.9, 0.9)); hubShow(R.H[2], C, ez(t, 7.0, 0.3)); hubShow(R.H[3], D, ez(t, 7.3, 0.3));
    strawShow(R.S[3], segPts(D, C), ez(t, 10.0, 1.0)); R.G.rotation.z = t > 14 ? 0.12 * Math.sin((t - 14) * 1.6) : 0;
    render3D();
    title('빨대 양쪽에 꽂이를 꽂아요', win(t, 0.3, 4.4)); title('위로 빨대 두 개를 꽂아요', win(t, 4.4, 6.8)); title('양쪽에 똑같이 꽂이를 두 개 끼워요', win(t, 6.8, 9.0));
    title('여기에 무엇이 오면 좋을까요?', win(t, 9.0, 11.6)); pressMark(V(0, 1.2 + s, 0), win(t, 9.0, 10.4), t, '?');
    title('네모난 액자 완성!', win(t, 11.6, T - 0.4)); badge('액자 자세로 찰칵! 사진도 찍어요', win(t, 14.4, T - 0.4));
    const fl = clamp(1 - Math.abs(t - 15.2) / 0.25); if (fl > 0) { g.save(); g.globalAlpha = fl * 0.8; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); } fin(t, T); } }; }
// 8 하트 → 하트 머리띠
function s98() { FRONT(3.0); const s = 3.4, R = rig(4, 4, [0, 1, 3, 4]); R.G.position.set(0, 3.0, 0); const d = s / Math.SQRT2;
  const B = V(0, -d, 0), L = V(-d, 0, 0), Tp = V(0, d, 0), Rr = V(d, 0, 0);
  const Hb = V(0, -2.6, 0), Hl = V(-2.2, 0.6, 0), Hm = V(0, 0.9, 0), Hr = V(2.2, 0.6, 0), cl = Hl.clone().lerp(Hm, 0.5), cr = Hr.clone().lerp(Hm, 0.5), rr = cl.distanceTo(Hl);
  const dia = [segPts(B, L), resamp(segPts(L, Tp)), resamp(segPts(Tp, Rr)), segPts(Rr, B)], heart = [segPts(Hb, Hl), arcPts(cl, rr, Math.PI + 0.1, 0.06), arcPts(cr, rr, Math.PI - 0.06, -0.1), segPts(Hr, Hb)];
  const sqS = [segPts(V(-s / 2, -s / 2, 0), V(s / 2, -s / 2, 0)), segPts(V(-s / 2, -s / 2, 0), V(-s / 2, s / 2, 0)), segPts(V(-s / 2, s / 2, 0), V(s / 2, s / 2, 0)), segPts(V(s / 2, -s / 2, 0), V(s / 2, s / 2, 0))];
  const R0 = 2.0, RD = 1.5, M0 = 6.0, MD = 3.0, D0 = 15.5, T = 25; ev(R0, 'whoosh'); ev(M0, 'whoosh'); ev(M0 + MD, 'tok'); ev(M0 + MD + 0.3, 'ding'); ev(D0, 'pop'); ev(D0 + 1.5, 'pop');
  return { T, frame(t) { const r = ez(t, R0, RD), m = ez(t, M0, MD), dp = ez(t, D0, 1.4);
    R.G.rotation.z = Math.PI / 4 * (r - 1);                           // 네모(기울기 0) → 마름모
    const st = t < R0 + RD ? [sqS[0], sqS[1], sqS[2], sqS[3]].map(P => P.map(p => p.clone().applyAxisAngle(V(0, 0, 1), Math.PI / 4))) : dia.map((P, i) => lerpPts(resamp(P), resamp(heart[i]), m));
    const drop = i => (i === 0 || i === 3) ? V(0, -7 * dp * dp, 0) : V(0, 1.2 * dp, 0);
    R.S.forEach((sm, i) => strawShow(sm, st[i].map(p => p.clone().add(drop(i)))));
    const hp = [[B, Hb], [L, Hl], [Tp, Hm], [Rr, Hr]].map(([a, b]) => a.clone().lerp(b, m));
    R.H.forEach((h, i) => hubShow(h, hp[i].clone().add(drop(i === 0 ? 0 : 1)).add(i === 0 ? V(0, 0, 0) : V(0, 0, 0))));
    render3D();
    title('네모를 비스듬히 잡으면 다이아몬드!', win(t, 0.3, M0 - 0.1)); badge('꽂이 네 개 중 위쪽을 하늘로', win(t, 3.6, M0 - 0.1));
    title('위쪽 빨대를 둥글게 모아 꽂이에 끼워요', win(t, M0 - 0.1, M0 + MD + 0.4)); title('예쁜 하트 완성!', win(t, M0 + MD + 0.4, D0 - 0.2)); badge('얼굴에 대고 하트 사진 찰칵!', win(t, M0 + MD + 1.2, D0 - 0.2));
    title('아래를 떼어 머리에 쓰면 하트 머리띠!', win(t, D0 - 0.2, T - 0.4)); badge('"무슨 띠예요?" "머리띠!" 함께 웃어요', win(t, D0 + 1.5, T - 0.4)); fin(t, T); } }; }
// 9 정리: 25개 세며 주머니
function s99() { setCam(V(0, 11.5, 7.0), V(0, 0, 0.3)); let sd = 11; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const straws = [...Array(25)].map((_, i) => { const c = V(-1.4 + (rnd() - 0.5) * 4, 0.1 + i * 0.01, (rnd() - 0.5) * 4), a = rnd() * Math.PI; const m = makeStraw(i, segPts(c.clone().add(V(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6)), c.clone().add(V(-Math.cos(a) * 1.6, 0, -Math.sin(a) * 1.6)))); return m; });
  const pouch = yellowPouch(4.4, 0.6); pouch.scale.setScalar(0.8); const MOUTH = V(4.4, 2.0, 0.6);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.3, 2.4, 2, 0.08), mat('#c8935a', 0.8)); tray.position.set(-5.4, 0.15, -1.6); tray.castShadow = true; scene.add(tray);
  const per = 0.55, S0 = 2.4, T = S0 + 25 * per + 4.5; straws.forEach((m, i) => ev(S0 + i * per + 0.4, 'count', i + 1)); ev(T - 3.8, 'ding');
  return { T, frame(t) { straws.forEach((m, i) => { const p = ez(t, S0 + i * per, 0.5); m.position.set(0, 0, 0); const c = new THREE.Box3().setFromObject(m).getCenter(V(0, 0, 0));
      const tgt = MOUTH.clone().sub(c); m.position.copy(tgt.multiplyScalar(p)); m.position.y += Math.sin(p * Math.PI) * 1.2; m.visible = p < 0.97; });
    render3D(); title('빨대 블록 25개를 세며 주머니에 담아요', win(t, 0.3, T - 3.9));
    const n = straws.filter((m, i) => t >= S0 + i * per + 0.4).length; if (t > S0) counter(`${n} / 25`, win(t, S0, T - 0.5));
    const [x, y] = proj(V(-5.4, 0.4, -2.9)); pill('꽂이·접시는 선생님이 거둬요', x + 60, y - 30, win(t, 1.0, T - 0.5), { size: 32, bg: '#1f2a37' });
    badge('정리 끝! 잘하셨어요', win(t, T - 3.8, T - 0.5)); fin(t, T); } }; }

// ═════════ 9-2 매듭풀기 ═════════
const BX = -1.5, KCAM = () => setCam(V(0.6, 12.6, 5.0), V(0.6, 0, 0.3));
const hp = i => holePos(i).add(V(BX, 0, 0));
const restPos = i => [V(3.9, 0.06, -3.4 + i * 0.75), V(5.6, 0.06, -3.4 + i * 0.75)];
const PAIRS1 = [[0, 11], [2, 13], [4, 15], [6, 17], [8, 19], [10, 21], [1, 9], [3, 16], [5, 20], [7, 14]], LEFT1 = [12, 18];
const PAIRS2 = [[0, 7], [3, 12], [5, 16], [9, 18], [1, 14], [11, 20], [6, 21], [2, 17], [8, 15], [4, 13]], LEFT2 = [10, 19];
function knotSetup() { const b = makeKnotBoard(); b.position.x = BX; const cords = [...Array(10)].map((_, i) => makeCord(i)); cords.forEach((c, i) => { const [a, e] = restPos(i); setCord(c, a, e, 0.05); }); return { b, cords }; }
function lift(i, weave) { return weave ? 0.08 + i * 0.05 + (i % 2 ? 0.06 : 0) : 0.08 + i * 0.05; }
function placeCord(c, i, pairs, p1, p2, weave) { const [r1, r2] = restPos(i), [h1, h2] = [hp(pairs[i][0]), hp(pairs[i][1])];
  const a = r1.clone().lerp(h1, p1), e = r2.clone().lerp(h2, p2); a.y += Math.sin(p1 * Math.PI) * 1.2; e.y += Math.sin(p2 * Math.PI) * 1.2;
  setCord(c, a, e, p1 >= 1 && p2 >= 1 ? lift(i, weave) : 0.25, weave ? (i % 2 ? 0.35 : -0.35) * p2 : 0); }
function holeRings(list, a, t) { list.forEach(i => { const [x, y] = proj(hp(i)); if (a <= 0) return; g.save(); g.globalAlpha = a; g.lineWidth = 8; g.strokeStyle = ACC; g.beginPath(); g.arc(x, y, 26 + 5 * Math.sin(t * 8), 0, Math.PI * 2); g.stroke(); g.restore(); }); }
// 1 소개
function s101() { KCAM(); const { b, cords } = knotSetup(); const T = 12; ev(0.5, 'whoosh'); cords.forEach((c, i) => ev(2 + i * 0.3, 'pop', i)); ev(6, 'ding');
  return { T, frame(t) { b.position.y = 3 * (1 - ez(t, 0.4, 0.9)); cords.forEach((c, i) => { c.visible = t > 2 + i * 0.3; c.scale.setScalar(Math.max(0.01, ez(t, 2 + i * 0.3, 0.3))); });
    render3D(); title('올록볼록 구멍이 난 검정 그림판', win(t, 0.3, 6.2)); badge('색깔끈 10개 · 끈 담는 봉투', win(t, 2.4, 6.2));
    title('알록달록한 끈을 손가락으로 끼고 빼 봐요', win(t, 6.2, T - 0.4)); badge('손끝을 쓰는 소근육 활동이에요', win(t, 6.6, T - 0.4)); fin(t, T); } }; }
// 2 끼우기 / 4 얼키설키 끼우기
function insert(weave) { return () => { KCAM(); const { cords } = knotSetup(); const pairs = weave ? PAIRS2 : PAIRS1, per = 1.9, S0 = 2.6, E = S0 + 10 * per, T = E + 6;
  cords.forEach((c, i) => { ev(S0 + i * per + 0.7, 'tok', i); ev(S0 + i * per + 1.4, 'tok', i + 1); }); ev(E + 0.3, 'pop'); ev(E + 2.6, 'ding');
  return { T, frame(t) { cords.forEach((c, i) => placeCord(c, i, pairs, ez(t, S0 + i * per, 0.7), ez(t, S0 + i * per + 0.6, 0.8), weave));
    render3D();
    title(weave ? '이번엔 끈을 서로 엇갈리게 얼키설키 끼워요' : '색깔끈을 내 마음대로 길게 끼워요', win(t, 0.3, E));
    const cur = Math.floor((t - S0) / per); if (cur >= 0 && cur < 10) { const tt = t - S0 - cur * per; pressMark(hp(pairs[cur][tt < 0.95 ? 0 : 1]), win(tt, 0.5, per - 0.1, 0.15), t, '꾹!'); }
    const n = cords.filter((c, i) => t >= S0 + i * per + 1.4).length; if (t > S0) counter(`${n} / 10`, win(t, S0, E + 0.4));
    holeRings(weave ? LEFT2 : LEFT1, win(t, E + 0.3, T - 0.4), t); title('다 끼우면 구멍 두 개가 남아요', win(t, E, T - 0.4));
    badge(weave ? '얼키설키 완성!' : '끈 10개 모두 끼웠어요!', win(t, E + 0.6, T - 0.4)); fin(t, T); } }; }; }
// 3 위에서부터 빼기 / 5 빼서 가지런히 → 봉투
function remove(weave) { return () => { KCAM(); const { cords } = knotSetup(); const pairs = weave ? PAIRS2 : PAIRS1, per = 1.7, S0 = 2.6, E = S0 + 10 * per;
  const bagT = weave ? E + 1.2 : 0, T = weave ? E + 7.5 : E + 4;
  let bag = null; if (weave) { bag = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.16, 3.0, 2, 0.08), new THREE.MeshStandardMaterial({ color: '#dfe8ee', roughness: 0.15, transparent: true, opacity: 0.55 })); bag.position.set(4.6, 0.08, 0.4); scene.add(bag); bag.visible = false; }
  for (let j = 0; j < 10; j++) { ev(S0 + j * per + 0.15, 'pop', j); ev(S0 + j * per + 1.1, 'count', j + 1); } if (weave) ev(bagT + 0.8, 'whoosh'); ev(T - 3.2, 'ding');
  return { T, frame(t) { cords.forEach((c, i) => { const j = 9 - i, p = ez(t, S0 + j * per + 0.4, 0.8); placeCord(c, i, pairs, 1 - p, 1 - p, weave);
      const hl = win(t, S0 + j * per, S0 + j * per + 0.6, 0.15); c.userData.line.material.emissive.set(c.userData.c).multiplyScalar(hl * 0.6);
      if (weave) { const q = ez(t, bagT + 0.2 + i * 0.1, 0.8); if (q > 0) { c.position.copy(V(4.6, 0.3 + i * 0.03, -0.6 + i * 0.22).sub(V(4.75, 0, -3.4 + i * 0.75)).multiplyScalar(q)); c.position.y += Math.sin(q * Math.PI) * 1.0; } } });
    if (bag) bag.visible = t > bagT;
    render3D();
    title('가장 위에 있는 끈부터 하나씩 빼요', win(t, 0.3, E)); const cur = Math.floor((t - S0) / per);
    if (cur >= 0 && cur < 10) { const i = 9 - cur, m = hp(pairs[i][0]).lerp(hp(pairs[i][1]), 0.5).add(V(0, 0.6, 0)); const [x, y] = proj(m); pill('맨 위!', x, y - 40, win(t - S0 - cur * per, 0.05, 0.7, 0.15), { size: 36, bg: ACC }); }
    const n = Math.max(0, Math.min(10, Math.floor((t - S0 - 1.1) / per) + 1)); if (t > S0) counter(`${n} / 10`, win(t, S0, T - 0.5));
    if (weave) { title('바닥에 가지런히 놓고 봉투에 10개를 담아요', win(t, E, T - 3.3)); }
    badge(weave ? '정리 끝! 잘하셨어요' : '모두 뺐어요! 차곡차곡 잘하셨어요', win(t, T - 3.2, T - 0.5)); fin(t, T); } }; }; }

// ═════════ 10-2 고리블록 ═════════
const RCAM = () => setCam(V(0, 10.4, 4.4), V(0, 0, 0.4));
function chainPoses(curve, n, closed = true) { const L = curve.getLength(); return [...Array(n)].map((_, i) => { const u = closed ? i / n : Math.min(1, (i * LINK_SP) / L);
  const p = curve.getPointAt(u), tg = curve.getTangentAt(u); return { pos: V(p.x, 0.09 + (i % 2 ? 0.07 : 0), p.z), ry: -Math.atan2(tg.z, tg.x), up: i % 2 }; }); }
function setLink(m, ps) { m.position.copy(ps.pos); m.rotation.set(0, ps.ry, 0); if (ps.up) m.rotateX(Math.PI / 2 * 0.85); }
function lerpPose(a, b, p) { let d = b.ry - a.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return { pos: a.pos.clone().lerp(b.pos, p), ry: a.ry + d * p, up: p < 0.5 ? a.up : b.up }; }
const crownR = 20 * LINK_SP / (2 * Math.PI);
// 1 소개
function s111() { setCam(V(0, 5.6, 3.2), V(0, 0, 0.1)); const ls = [3, 2, 1].map(c => makeLink(c));
  const start = [V(-1.4, 0.09, 0), V(0, 0.09, 0), V(1.4, 0.09, 0)].map(p => ({ pos: p, ry: Math.PI / 2, up: 0 }));
  const joined = [{ pos: V(-0.66, 0.09, 0), ry: 0, up: 0 }, { pos: V(0, 0.16, 0), ry: 0, up: 1 }, { pos: V(0.66, 0.09, 0), ry: 0, up: 0 }];
  const T = 14; ev(0.6, 'pop'); ev(5.4, 'whoosh'); ev(6.4, 'tok'); ev(7.6, 'tok'); ev(8.2, 'ding');
  return { T, frame(t) { const p = [ez(t, 5.6, 1.0), ez(t, 5.0, 1.4), ez(t, 6.8, 1.0)]; ls.forEach((m, i) => setLink(m, lerpPose(start[i], joined[i], i === 0 ? p[0] * 0 + ez(t, 5.0, 1.4) : p[i])));
    render3D(); title('가운데 금이 있는 고리 블록', win(t, 0.3, 5.0)); pressMark(V(0, 0.15, 0.22), win(t, 1.6, 5.0), t, '금 간 곳');
    title('금 간 곳끼리 끼워 서로 연결해요', win(t, 5.0, T - 0.4)); badge('고리블록 50개로 다양한 모양을 만들어요', win(t, 8.4, T - 0.4)); fin(t, T); } }; }
// 2 왕관 20개
function s112() { RCAM(); const ls = [...Array(20)].map((_, i) => makeLink(i)), P = chainPoses(circleCurve(V(0, 0, 0.2), crownR), 20);
  const per = 0.5, S0 = 2.2, E = S0 + 20 * per, T = E + 6; ls.forEach((m, i) => ev(S0 + i * per + 0.2, 'count', i + 1)); ev(E + 0.3, 'ding');
  return { T, frame(t) { ls.forEach((m, i) => { const p = ez(t, S0 + i * per, 0.35); setLink(m, P[i]); m.position.y += 2 * (1 - p); m.visible = t > S0 + i * per; });
    render3D(); title('고리 20개를 쭉 이어요', win(t, 0.3, E)); const n = ls.filter((m, i) => t >= S0 + i * per + 0.2).length; if (t > S0) counter(`${n} / 20`, win(t, S0, T - 0.5));
    title('둥글게 끼워 머리에 쓰면 왕관 완성!', win(t, E, T - 0.4)); badge('어르신 머리에 씌워 드려요', win(t, E + 0.6, T - 0.4)); fin(t, T); } }; }
// 3 왕관 꾸미기(5개씩 양옆)
function legCurve(side) { const x = side * crownR; return polyline([V(x, 0, 0.2), V(x + side * 0.25, 0, 0.2 + 1.6), V(x + side * 0.1, 0, 0.2 + 3.4)]); }
function s113() { RCAM(); camera.position.set(0, 13.4, 7.2); camera.lookAt(0, 0, 1.2); camera.updateMatrixWorld();
  const crown = [...Array(20)].map((_, i) => makeLink(i)), P = chainPoses(circleCurve(V(0, 0, 0.2), crownR), 20); crown.forEach((m, i) => setLink(m, P[i]));
  const legs = [-1, 1].map(s => { const ps = chainPoses(legCurve(s), 6, false).slice(1); return ps.map((p, i) => { const m = makeLink(i + (s > 0 ? 3 : 0)); return { m, p }; }); });
  const per = 0.6, S0 = 2.4, E = S0 + 10 * per, T = E + 6; for (let k = 0; k < 10; k++) ev(S0 + k * per + 0.2, 'count', (k % 5) + 1); ev(E + 0.4, 'ding');
  return { T, frame(t) { legs.forEach((L, s) => L.forEach(({ m, p }, i) => { const k = s * 5 + i, q = ez(t, S0 + k * per, 0.35); setLink(m, p); m.position.y += 2 * (1 - q); m.visible = t > S0 + k * per; }));
    render3D(); title('새로 5개씩 이어 왕관 옆에 끼워요', win(t, 0.3, E)); const n = Math.max(0, Math.min(10, Math.floor((t - S0 - 0.2) / per) + 1));
    if (t > S0) counter(n <= 5 ? `왼쪽 ${n} / 5` : `오른쪽 ${n - 5} / 5`, win(t, S0, E + 0.5));
    title('더욱 풍성한 왕관 완성!', win(t, E, T - 0.4)); badge('다시 머리에 써 보아요', win(t, E + 0.6, T - 0.4)); fin(t, T); } }; }
// 4 목걸이(30개)
function s114() { RCAM(); camera.position.set(0, 13.4, 7.2); camera.lookAt(0, 0, 1.2); camera.updateMatrixWorld();
  const crown = chainPoses(circleCurve(V(0, 0, 0.2), crownR), 20), legs = [-1, 1].flatMap(s => chainPoses(legCurve(s), 6, false).slice(1));
  const R30 = 30 * LINK_SP / (2 * Math.PI), N = chainPoses(circleCurve(V(0, 0, 1.0), R30), 30);
  const ls = [...Array(30)].map((_, i) => makeLink(i)); const from = [...crown, ...legs]; const to = [...Array(30)].map((_, i) => N[i < 20 ? (i + 25) % 30 : (i - 20 < 5 ? 25 - 5 + (i - 20) : 15 + (i - 25))]);
  const M0 = 3.0, MD = 3.2, T = M0 + MD + 7; ev(M0, 'whoosh'); ev(M0 + MD, 'tok'); ev(M0 + MD + 0.3, 'ding');
  return { T, frame(t) { const m = ez(t, M0, MD); ls.forEach((l, i) => setLink(l, lerpPose(from[i], to[i], m)));
    render3D(); title('옆에 붙인 고리 10개를 떼어', win(t, 0.3, M0)); title('왕관에 쭉 이어 더 큰 동그라미로', win(t, M0, M0 + MD + 0.3));
    title('목걸이 완성! 목에 걸어 드려요', win(t, M0 + MD + 0.3, T - 0.4)); badge('고리 30개 목걸이', win(t, M0 + MD + 0.8, T - 0.4)); fin(t, T); } }; }
// 5 팔찌
function s115() { setCam(V(0, 6.4, 2.8), V(0, 0, 0.4)); const n = 9, ls = [...Array(n)].map((_, i) => makeLink(i + 1)), R7 = r => chainPoses(circleCurve(V(0, 0, 0.3), r * LINK_SP / (2 * Math.PI)), r);
  const P8 = R7(8), per = 0.7, S0 = 2.4, E = S0 + 8 * per, T = E + 9; ls.forEach((m, i) => i < 8 && ev(S0 + i * per + 0.2, 'count', i + 1)); ev(E + 0.3, 'ding'); ev(E + 3.4, 'pop');
  const P9 = R7(9);
  return { T, frame(t) { const grow = ez(t, E + 3.4, 1.0), back = ez(t, E + 6.0, 1.0), k = grow * (1 - back);
    ls.forEach((m, i) => { if (i < 8) { const p = ez(t, S0 + i * per, 0.35); setLink(m, lerpPose(P8[i], P9[i], k)); m.position.y += 2 * (1 - p); m.visible = t > S0 + i * per; }
      else { setLink(m, P9[8]); m.visible = k > 0.05; m.position.y += 1.5 * (1 - k); } });
    render3D(); title('고리 7~8개를 이어 팔찌를 만들어요', win(t, 0.3, E)); const c = ls.filter((m, i) => i < 8 && t >= S0 + i * per + 0.2).length; if (t > S0) counter(`${c + (k > 0.5 ? 1 : 0)}개`, win(t, S0, T - 0.5));
    title('손목에 걸어 보아요', win(t, E, E + 3.2)); title('손목에 맞게 더 끼우거나 빼요', win(t, E + 3.2, T - 0.4)); badge('사람마다 손목 굵기가 달라요', win(t, E + 3.6, T - 0.4)); fin(t, T); } }; }
// 6 도안: 하트·사람·자동차
function heartCurve() { const hp2 = []; for (let i = 0; i <= 48; i++) { const t = i / 48 * Math.PI * 2; hp2.push(V(16 * Math.sin(t) ** 3, 0, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))).multiplyScalar(0.17).add(V(0, 0, 0.5))); } return [new THREE.CatmullRomCurve3(hp2, true)]; }
function personCurves() { return [circleCurve(V(0, 0, -2.3), 0.85), polyline([V(0, 0, -1.4), V(0, 0, 1.0)]), polyline([V(-2.1, 0, -0.5), V(0, 0, -0.8), V(2.1, 0, -0.5)]), polyline([V(-1.3, 0, 3.0), V(0, 0, 1.0), V(1.3, 0, 3.0)])]; }
function carCurves() { return [polyline([V(-3.3, 0, 1.0), V(-3.3, 0, -0.1), V(-1.7, 0, -0.3), V(-0.9, 0, -1.5), V(1.2, 0, -1.5), V(2.0, 0, -0.3), V(3.3, 0, -0.1), V(3.3, 0, 1.0), V(-3.3, 0, 1.0)]), circleCurve(V(-1.8, 0, 1.6), 0.75), circleCurve(V(1.8, 0, 1.6), 0.75)]; }
function s116() { RCAM(); const designs = [['하트', heartCurve()], ['사람', personCurves()], ['자동차', carCurves()]];
  const sets = designs.map(([, cs]) => cs.flatMap((c, ci) => { const closed = c.closed, n = Math.max(3, Math.round(c.getLength() / LINK_SP)); return chainPoses(c, n, closed).map((p, i) => ({ p, m: makeLink(i + ci * 2) })); }));
  const DD = 9.0, S0 = 1.6, T = S0 + 3 * DD + 1.5;
  sets.forEach((L, d) => { ev(S0 + d * DD, 'pop', d); ev(S0 + d * DD + 4.6, 'ding'); });
  return { T, frame(t) { sets.forEach((L, d) => { const t0 = S0 + d * DD, per = 3.6 / L.length; L.forEach(({ m, p }, i) => { const q = ez(t, t0 + i * per, 0.25); setLink(m, p); m.position.y += 1.5 * (1 - q); m.visible = t > t0 + i * per && t < t0 + DD - 0.3; }); });
    render3D(); const d = Math.min(2, Math.max(0, Math.floor((t - S0) / DD)));
    title(`도안을 보고 ${designs[d][0]} 모양을 만들어요`, win(t, S0 + d * DD - (d ? 0 : 1.2), S0 + (d + 1) * DD - 0.2)); badge('손으로 모양을 내며 이어요', win(t, 0.6, T - 0.4)); fin(t, T); } }; }
// 7 정리 50개
function s117() { RCAM(); let sd = 21; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const ls = [...Array(50)].map((_, i) => { const m = makeLink(i); m.position.set(-1.2 + (rnd() - 0.5) * 6, 0.09 + rnd() * 0.06, (rnd() - 0.5) * 4.6); m.rotation.set(0, rnd() * 6, (rnd() - 0.5) * 0.3); m.userData.home = m.position.clone(); return m; });
  const pouch = yellowPouch(4.6, 0.6); pouch.scale.setScalar(0.8); const MOUTH = V(4.6, 2.0, 0.6);
  const per = 0.26, S0 = 2.4, T = S0 + 50 * per + 4.5; ls.forEach((m, i) => ev(S0 + i * per + 0.3, 'count', i % 20)); ev(T - 3.8, 'ding');
  return { T, frame(t) { ls.forEach((m, i) => { const p = ez(t, S0 + i * per, 0.45); arcMove(m, m.userData.home, MOUTH, p, 1.2); m.visible = p < 0.97; });
    render3D(); title('하나씩 빼서 50개가 맞는지 세어요', win(t, 0.3, T - 3.9)); const n = ls.filter((m, i) => t >= S0 + i * per + 0.3).length; if (t > S0) counter(`${n} / 50`, win(t, S0, T - 0.5));
    badge('나눠 드린 주머니에 담아 정리해요', win(t, 1.2, T - 3.9)); badge('정리 끝! 잘하셨어요', win(t, T - 3.8, T - 0.5)); fin(t, T); } }; }

const SCENES = { 901: pvSticks, 902: pvStraw, 903: pvKnot, 904: pvRing,
  81: s81, 82: scrape(1), 83: scrape(2), 84: scrape(3), 85: stack(true), 86: stack(false), 87: s87,
  91: s91, 92: s92, 93: s93, 94: s94, 95: s95, 96: s96, 97: s97, 98: s98, 99: s99,
  101: s101, 102: insert(false), 103: remove(false), 104: insert(true), 105: remove(true),
  111: s111, 112: s112, 113: s113, 114: s114, 115: s115, 116: s116, 117: s117 };
const S = SCENES[SCN]();
window.TOTAL = S.T; window.EVENTS = EVENTS;
window.frame = t => { g.clearRect(0, 0, W, H); S.frame(t); return out.toDataURL('image/png').split(',')[1]; };
document.fonts.load(`900 60px ${FONT}`).then(() => { document.title = 'done'; });
