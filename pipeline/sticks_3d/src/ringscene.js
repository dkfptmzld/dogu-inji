import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import RIGHT from '../right.glb';
import LEFT from '../left.glb';

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];
const BONES = {
  thumb:  ['thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'],
  index:  ['index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-tip'],
  middle: ['middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-tip'],
  ring:   ['ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-tip'],
  pinky:  ['pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-tip'],
};
const SPREAD = { thumb: 0.05, index: 0.16, middle: 0.02, ring: -0.13, pinky: -0.28 };
const buf = u => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);

function bandGeometry() {
  // 단면: 둥근 직사각형 (안쪽 반지름 1, 두께 T, 높이 H) → 회전체
  const T = 0.24, H = 0.52, rr = 0.09, pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)); } };
  corner(1 + rr, -H / 2 + rr, Math.PI);           // 안쪽 아래
  corner(1 + T - rr, -H / 2 + rr, -Math.PI / 2);  // 바깥 아래
  corner(1 + T - rr, H / 2 - rr, 0);              // 바깥 위
  corner(1 + rr, H / 2 - rr, Math.PI / 2);        // 안쪽 위
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, 64);
  g.computeVertexNormals();
  return { g, H };
}

export async function createRingScene(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opts.preserve, alpha: false });
  renderer.setPixelRatio(opts.pixelRatio || Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background || '#f4f1ea');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight(0xfff6ee, 0xb89a88, 0.9));
  const key = new THREE.DirectionalLight(0xfff1e6, 2.6);
  key.position.set(-0.15, 0.35, 0.8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera; sc.left = -0.25; sc.right = 0.25; sc.top = 0.25; sc.bottom = -0.25; sc.near = 0.05; sc.far = 2;
  key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.002;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe0d0, 0.8); rim.position.set(0.4, 0.2, -0.3); scene.add(rim);

  // 뒤 배경판 (부드러운 그림자)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShadowMaterial({ opacity: 0.06 }));
  back.position.z = -0.06; back.receiveShadow = true; scene.add(back);

  const skin = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9926c'), roughness: 0.5, metalness: 0,
    sheen: 0.35, sheenColor: new THREE.Color('#ffd0b8'), sheenRoughness: 0.6,
    clearcoat: 0.08, clearcoatRoughness: 0.6,
  });

  const loader = new GLTFLoader();
  const load = data => new Promise((res, rej) => loader.parse(buf(data), '', res, rej));
  const hands = opts.hands || ['right'];
  const handObjs = {};
  const gap = 0.115;
  for (let hi = 0; hi < hands.length; hi++) {
    const side = hands[hi];
    const gl = await load(side === 'left' ? LEFT : RIGHT);
    const root = new THREE.Group(); root.add(gl.scene);
    // 손가락이 위(+Y), 손바닥이 카메라(+Z)를 보게
    gl.scene.rotation.set(0, 0, Math.PI);
    root.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    scene.add(root);
    let mesh; gl.scene.traverse(o => { if (o.isSkinnedMesh) { mesh = o; o.material = skin; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    root.updateMatrixWorld(true);
    // 손가락 벌리기 (손바닥 법선 기준 회전)
    const normalW = new THREE.Vector3(0, 0, 1);
    for (const f of FINGERS) {
      const bone = gl.scene.getObjectByName(BONES[f][0]);
      const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
      const axis = normalW.clone().applyQuaternion(pq.invert());
      const a = SPREAD[f] * (side === 'left' ? -1 : 1);
      bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, a));
    }
    root.updateMatrixWorld(true);
    // 위치 맞추기: 손목~손끝 박스 중심
    const box = new THREE.Box3().setFromObject(root, true);
    const c = box.getCenter(new THREE.Vector3());
    root.position.x -= c.x - (hands.length === 2 ? (hi === 0 ? -gap : gap) : 0);
    root.position.y -= c.y; root.position.z -= c.z;
    root.updateMatrixWorld(true);
    handObjs[side] = { root, mesh, scene: gl.scene, side };
  }

  // 손가락 축과 단면 크기 측정
  const tmp = new THREE.Vector3();
  function fingerInfo(h, f) {
    const [b0, b1, tipName] = BONES[f].map(n => h.scene.getObjectByName(n));
    const p0 = b0.getWorldPosition(new THREE.Vector3()), p1 = b1.getWorldPosition(new THREE.Vector3()), tip = tipName.getWorldPosition(new THREE.Vector3());
    const dir = p1.clone().sub(p0).normalize();
    return { p0, p1, tip, dir, len: p0.distanceTo(p1) };
  }
  function crossSection(h, P, dir) {
    const pos = h.mesh.geometry.attributes.position;
    const side = new THREE.Vector3(0, 0, 1).cross(dir).normalize();   // 손가락 폭 방향
    const front = dir.clone().cross(side).normalize();               // 손바닥 방향
    const S = [], F = [];
    for (let i = 0; i < pos.count; i++) {
      h.mesh.getVertexPosition(i, tmp); tmp.applyMatrix4(h.mesh.matrixWorld);
      const rel = tmp.sub(P); const t = rel.dot(dir);
      if (Math.abs(t) > 0.005) continue;
      const a = rel.dot(side), b = rel.dot(front);
      if (Math.abs(a) > 0.0125 || Math.abs(b) > 0.022) continue;
      S.push(a); F.push(b);
    }
    const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.max(0, Math.min(a.length - 1, Math.floor(a.length * p)))]; };
    if (S.length < 6) return { rw: 0.009, rd: 0.008, side, front, center: P.clone() };
    const s0 = q(S, 0.03), s1 = q(S, 0.97), f0 = q(F, 0.03), f1 = q(F, 0.97);
    const center = P.clone().addScaledVector(side, (s0 + s1) / 2).addScaledVector(front, (f0 + f1) / 2);
    return { rw: (s1 - s0) / 2 * 1.04, rd: (f1 - f0) / 2 * 1.04, side, front, center };
  }

  const { g: bandGeo, H: BAND_H } = bandGeometry();
  const rings = [];   // {hand, finger, color, mesh, target:{pos,quat,scale}, start}
  const ringGroup = new THREE.Group(); scene.add(ringGroup);

  function makeMaterial(color) {
    return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), roughness: 0.38, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2, sheen: 0.0, sheenColor: new THREE.Color('#ffffff') });
  }

  // 손가락 위 k번째 자리의 위치·방향·크기
  function slot(handSide, finger, k) {
    const h = handObjs[handSide]; const F = fingerInfo(h, finger);
    let t = (finger === 'thumb' ? 0.45 : 0.55) * F.len; let res;
    for (let i = 0; i <= k; i++) {
      const P = F.p0.clone().addScaledVector(F.dir, t);
      const cs = crossSection(h, P, F.dir);
      const r = Math.max(cs.rw, cs.rd);
      const height = BAND_H * r * 0.95;
      if (i === k) {
        const P2 = F.p0.clone().addScaledVector(F.dir, t + height / 2);
        const cs2 = crossSection(h, P2, F.dir);
        const m = new THREE.Matrix4().makeBasis(cs2.side, F.dir, cs2.front);
        res = { pos: cs2.center, quat: new THREE.Quaternion().setFromRotationMatrix(m), scale: new THREE.Vector3(cs2.rw, Math.max(cs2.rw, cs2.rd), cs2.rd), F };
      }
      t += height * 1.02;
    }
    return res;
  }

  function setLayout(layout) {
    // layout: [{hand:'right', finger:'index', color:'#f00'}, ...] 순서대로
    rings.forEach(r => { ringGroup.remove(r.mesh); r.mesh.material.dispose(); });
    rings.length = 0;
    const count = {};
    layout.forEach((it, i) => {
      const key = it.hand + it.finger; const k = count[key] = (count[key] ?? -1) + 1;
      const s = slot(it.hand, it.finger, k);
      const mesh = new THREE.Mesh(bandGeo, makeMaterial(it.color));
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.position.copy(s.pos); mesh.quaternion.copy(s.quat); mesh.scale.copy(s.scale);
      ringGroup.add(mesh);
      rings.push({ ...it, mesh, target: s, index: i });
    });
  }

  // 애니메이션: 반지 i가 손끝 위에서 내려와 끼워짐
  const easeIn = p => p * p * p, easeOutBack = p => { const c = 1.9; p -= 1; return 1 + (c + 1) * p * p * p + c * p * p; };
  function poseAt(time, sched) {
    // sched: {start, gap, fall, settle}
    rings.forEach((r, i) => {
      const t0 = sched.start + i * sched.gap; const lt = time - t0; const T = r.target;
      if (lt < 0) { r.mesh.visible = false; return; }
      r.mesh.visible = true;
      const tipDist = T.F.tip.distanceTo(T.pos) + 0.05;
      if (lt < sched.fall) {
        const p = lt / sched.fall;
        const off = tipDist * (1 - easeIn(p));
        r.mesh.position.copy(T.pos).addScaledVector(T.F.dir, off);
        // 손끝을 지날 때 고무줄이 늘어났다가
        const stretch = 1 + 0.35 * Math.max(0, Math.min(1, (off - tipDist * 0.55) / (tipDist * 0.45)));
        r.mesh.scale.set(T.scale.x * stretch, T.scale.y, T.scale.z * stretch);
        r.mesh.quaternion.copy(T.quat).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.25 * (1 - p) * Math.sin(p * 10)));
      } else {
        const p = Math.min(1, (lt - sched.fall) / sched.settle);
        const e = easeOutBack(p);
        // 착 조여지는 느낌
        const k = 1 + 0.12 * (1 - e) ;
        r.mesh.position.copy(T.pos);
        r.mesh.quaternion.copy(T.quat);
        r.mesh.scale.set(T.scale.x * k, T.scale.y * (2 - k), T.scale.z * k);
      }
    });
  }
  function showAll() { rings.forEach(r => { r.mesh.visible = true; r.mesh.position.copy(r.target.pos); r.mesh.quaternion.copy(r.target.quat); r.mesh.scale.copy(r.target.scale); }); }

  const camera = new THREE.PerspectiveCamera(opts.fov || 24, 1, 0.01, 10);
  function resize(w, h) {
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const box = new THREE.Box3(); Object.values(handObjs).forEach(o => box.expandByObject(o.root, true));
    box.min.y += (box.max.y - box.min.y) * 0.22;   // 손목 아래쪽은 화면 밖으로
    const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const fitH = size.y * 1.06, fitW = size.x * 1.15;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const distH = fitH / 2 / Math.tan(vfov / 2), distW = fitW / 2 / Math.tan(vfov / 2) / camera.aspect;
    camera.position.set(ctr.x, ctr.y - size.y * 0.02, ctr.z + Math.max(distH, distW));
    camera.lookAt(ctr.x, ctr.y, ctr.z);
    camera.updateProjectionMatrix();
  }
  const render = () => renderer.render(scene, camera);
  return { THREE, scene, camera, renderer, resize, render, setLayout, poseAt, showAll, rings, handObjs, slot, FINGERS };
}
