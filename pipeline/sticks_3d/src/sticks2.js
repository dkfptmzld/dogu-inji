import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import RIGHT from '../right.glb';
import LEFT from '../left.glb';
const buf=u=>u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength);
const V=(...a)=>new THREE.Vector3(...a);

export async function createScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1); renderer.toneMapping=THREE.NeutralToneMapping;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#f4f1ea');
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture; scene.environmentIntensity=0.5;
  scene.add(new THREE.HemisphereLight(0xfff8f0,0xc8b8a8,0.85));
  const key=new THREE.DirectionalLight(0xfff1e4,2.3); key.position.set(-0.2,0.7,0.35); key.castShadow=true;
  key.shadow.mapSize.set(2048,2048); Object.assign(key.shadow.camera,{left:-.35,right:.35,top:.35,bottom:-.35,near:.05,far:2}); key.shadow.radius=6; key.shadow.bias=-0.0003; key.shadow.normalBias=0.002;
  scene.add(key);
  const table=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshStandardMaterial({color:'#eadfcb',roughness:0.9}));
  table.rotation.x=-Math.PI/2; table.receiveShadow=true; scene.add(table);
  // 가져다 놓을 자리 (앞쪽)
  const pad=new THREE.Mesh(new RoundedBoxGeometry(0.21,0.002,0.05,2,0.001),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.9}));
  pad.position.set(0,0.001,0.075); pad.receiveShadow=true; scene.add(pad);
  // 막대 (네모난 산가지)
  const L=0.15, T=0.010;
  const geo=new RoundedBoxGeometry(L,T,T,3,0.0018);
  const COLORS={빨간:'#e53935',노란:'#fdd835',초록:'#43a047',파란:'#1e88e5',주황:'#fb8c00',보라:'#8e24aa'};
  const names=Object.keys(COLORS);
  const sticks={}; names.forEach((n,i)=>{ const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:COLORS[n],roughness:0.5}));
    m.castShadow=true; m.receiveShadow=true; m.position.set(((i%2)?0.006:-0.006), T/2, -0.03-i*0.022); m.userData.home=m.position.clone(); scene.add(m); sticks[n]=m; });
  const skin=new THREE.MeshPhysicalMaterial({color:'#e2a888',roughness:0.55,sheen:0.4,sheenColor:new THREE.Color('#ffd5c0'),sheenRoughness:0.5});
  async function loadHand(data,side){
    const gl=await new Promise((res,rej)=>new GLTFLoader().parse(buf(data),'',res,rej));
    gl.scene.traverse(o=>{ if(o.isSkinnedMesh){ o.material=skin; o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false; } });
    // 손가락 -Z, 손바닥 아래로 향하게 감싸기
    const inner=new THREE.Group(); inner.add(gl.scene); gl.scene.rotation.z=Math.PI;
    const mid=new THREE.Group(); mid.add(inner); inner.rotation.y=(side==='left'?Math.PI/2:-Math.PI/2);
    const o2=new THREE.Group(); o2.add(mid); mid.rotation.x=-Math.PI/2;
    const o3=new THREE.Group(); o3.add(o2); o2.rotation.z=Math.PI;
    const root=new THREE.Group(); root.add(o3); scene.add(root);
    const bones={}; gl.scene.traverse(o=>{ if(o.isBone) bones[o.name]=o; });
    // 손목이 잘린 단면이 보이지 않도록 소매 달기
    root.updateMatrixWorld(true);
    const w=bones['wrist'].getWorldPosition(new THREE.Vector3()), mc=bones['middle-finger-metacarpal'].getWorldPosition(new THREE.Vector3());
    const back=w.clone().sub(mc).normalize();
    const sleeveMat=new THREE.MeshStandardMaterial({color:'#8fa9c9',roughness:0.85});
    const sl=new THREE.Mesh(new THREE.CylinderGeometry(0.027,0.032,0.32,32,1,false),sleeveMat); sl.castShadow=true; sl.receiveShadow=true;
    const cuff=new THREE.Mesh(new THREE.TorusGeometry(0.027,0.005,12,40),sleeveMat); cuff.castShadow=true;
    const grp=new THREE.Group(); grp.add(sl); sl.position.y=0.16+0.004; grp.add(cuff); cuff.rotation.x=Math.PI/2; cuff.position.y=0.008;
    grp.position.copy(w.clone().addScaledVector(back,0.012)); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),back);
    root.add(grp);
    const rest={}; for(const k in bones){ rest[k]={p:bones[k].position.clone(), q:bones[k].quaternion.clone()}; }
    return {root,bones,rest,side,o3};
  }
  const hands={left:await loadHand(LEFT,'left'), right:await loadHand(RIGHT,'right')};
  // 평평한 뼈대 구조라서 관절을 직접 계산 (부모가 같다고 가정)
  const CH={index:['index-finger-phalanx-proximal','index-finger-phalanx-intermediate','index-finger-phalanx-distal','index-finger-tip'],
    middle:['middle-finger-phalanx-proximal','middle-finger-phalanx-intermediate','middle-finger-phalanx-distal','middle-finger-tip'],
    ring:['ring-finger-phalanx-proximal','ring-finger-phalanx-intermediate','ring-finger-phalanx-distal','ring-finger-tip'],
    pinky:['pinky-finger-phalanx-proximal','pinky-finger-phalanx-intermediate','pinky-finger-phalanx-distal','pinky-finger-tip'],
    thumb:['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip']};
  function resetHand(h){ for(const k in h.bones){ h.bones[k].position.copy(h.rest[k].p); h.bones[k].quaternion.copy(h.rest[k].q); } h.root.updateMatrixWorld(true); }
  function bend(h,chain,angles,palmDown){
    const bs=chain.map(n=>h.bones[n]); const parent=bs[0].parent; parent.updateMatrixWorld(true);
    const PW=parent.matrixWorld, PWinv=PW.clone().invert(), pq=new THREE.Quaternion(); parent.getWorldQuaternion(pq); const pqi=pq.clone().invert();
    // 월드 좌표에서 계산
    let pos=bs.map(b=>b.position.clone().applyMatrix4(PW)); let quat=bs.map(b=>pq.clone().multiply(b.quaternion));
    const palmN=palmDown.clone();
    for(let j=0;j<angles.length;j++){ if(!angles[j])continue;
      const dir=pos[j+1].clone().sub(pos[j]).normalize(); const lat=new THREE.Vector3().crossVectors(dir,palmN).normalize();
      const R=new THREE.Quaternion().setFromAxisAngle(lat,angles[j]);
      for(let k=j+1;k<bs.length;k++){ pos[k]=pos[k].clone().sub(pos[j]).applyQuaternion(R).add(pos[j]); }
      for(let k=j;k<bs.length;k++){ quat[k]=R.clone().multiply(quat[k]); } }
    bs.forEach((b,k)=>{ b.position.copy(pos[k].clone().applyMatrix4(PWinv)); b.quaternion.copy(pqi.clone().multiply(quat[k])); });
  }
  function pose(h,p){ resetHand(h); const down=V(0,-1,0).applyQuaternion(h.root.getWorldQuaternion(new THREE.Quaternion()));
    bend(h,CH.index,p.index,down); bend(h,CH.middle,p.curl,down); bend(h,CH.ring,p.curl.map(v=>v*1.03),down); bend(h,CH.pinky,p.curl.map(v=>v*1.06),down);
    bend(h,CH.thumb,p.thumb,down); h.root.updateMatrixWorld(true); }
  const tipOf=h=>h.bones['index-finger-tip'].getWorldPosition(new THREE.Vector3());
  // 손 배치: yaw(손가락 방향), pitch(손끝 숙임), 검지 끝을 target에
  function place(h,p,target,yaw,pitch,roll=0){
    h.root.position.set(0,0,0); h.root.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,roll,'YXZ')); h.root.updateMatrixWorld(true);
    pose(h,p); const t=tipOf(h); h.root.position.copy(target.clone().sub(t)); h.root.updateMatrixWorld(true); }
  const camera=new THREE.PerspectiveCamera(30,16/9,0.01,5);
  function resize(w,h){ renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  return {THREE,scene,renderer,camera,hands,pose,place,tipOf,sticks,COLORS,L,T,pad,resize,render:()=>renderer.render(scene,camera)};
}
