import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createScene } from './sticks2.js';
(async()=>{
  const W=1920,H=1080; const cv=document.getElementById('c'); cv.width=W; cv.height=H;
  const S=await createScene(cv); S.resize(W,H); const V=(...a)=>new THREE.Vector3(...a);
  // 기존 막대·받침 치우고 10개 새로 배치
  for(const n in S.sticks) S.scene.remove(S.sticks[n]); S.scene.remove(S.pad);
  const COLS=['#e53935','#fdd835','#43a047','#1e88e5','#fb8c00','#8e24aa','#ec407a','#29b6f6','#8d6e63','#7cb342'];
  const geo=new RoundedBoxGeometry(S.L,S.T,S.T,3,0.0018);
  const N=10, SRC0=-0.012, SRCSP=0.0165, DST0=0.150, DSTSP=0.0122;
  const sticks=COLS.map((c,i)=>{ const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:c,roughness:0.5}));
    m.castShadow=m.receiveShadow=true; m.userData.home=V((i%2?0.005:-0.005),S.T/2,SRC0-i*SRCSP); m.position.copy(m.userData.home); S.scene.add(m); return m; });
  const slot=j=>V(0,S.T/2,DST0-j*DSTSP);
  const pad=new THREE.Mesh(new RoundedBoxGeometry(0.205,0.002,N*DSTSP+0.02,2,0.001),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.9}));
  pad.position.set(0,0.001,DST0-(N-1)*DSTSP/2); pad.receiveShadow=true; S.scene.add(pad);
  S.camera.position.set(0,0.60,0.52); S.camera.lookAt(0,0,0.0); S.camera.updateMatrixWorld();
  const out=document.createElement('canvas'); out.width=W; out.height=H; const g=out.getContext('2d');
  const P0={index:[0.06,0.1,0.05], curl:[1.35,1.45,0.9], thumb:[0.25,0.45,0.45]};
  const P1={index:[0.12,0.16,0.12], curl:[1.35,1.45,0.9], thumb:[0.25,0.45,0.45]};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)); const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const D=4.0, LEAVE=1.0, HOLD=2.2, FADE=0.8, TOTAL=N*D+LEAVE+HOLD+FADE, LIFT=0.035, e=S.L/2+0.0032;
  // 손 상태: c(손끝 사이 가운데), off(바깥으로 벌어진 정도), up(들림), press(누름)
  const OUTSIDE={c:V(0,S.T/2,0.02),off:0.12,up:0.08,press:0};
  const mix=(a,b,p)=>({c:a.c.clone().lerp(b.c,p),off:a.off+(b.off-a.off)*p,up:a.up+(b.up-a.up)*p,press:a.press+(b.press-a.press)*p});
  const hover=(c)=>({c:c.clone(),off:0.03,up:0.022,press:0});
  function state(T){
    // 반환: 손 상태, 들고 있는 막대 번호와 위치
    if(T>=N*D){ const p=ease(clamp((T-N*D)/LEAVE)); return {hand:mix(hover(slot(N-1)),OUTSIDE,p),carry:-1}; }
    const i=Math.floor(T/D), t=T-i*D, home=sticks[i].userData.home, dst=slot(i);
    const from = i===0 ? OUTSIDE : hover(slot(i-1));
    const grab={c:home.clone(),off:0,up:0,press:1};
    if(t<1.2) return {hand:mix(from,hover(home),ease(t/1.2)),carry:-1,i,t};
    if(t<1.5) return {hand:mix(hover(home),grab,ease((t-1.2)/0.3)),carry:-1,i,t};
    if(t<1.9){ const c=home.clone().lerp(home.clone().add(V(0,LIFT,0)),ease((t-1.5)/0.4)); return {hand:{c,off:0,up:0,press:1},carry:i,pos:c,i,t}; }
    if(t<2.9){ const a=home.clone().add(V(0,LIFT,0)), b=dst.clone().add(V(0,LIFT,0)); const c=a.lerp(b,ease((t-1.9)/1.0)); return {hand:{c,off:0,up:0,press:1},carry:i,pos:c,i,t}; }
    if(t<3.3){ const c=dst.clone().add(V(0,LIFT,0)).lerp(dst,ease((t-2.9)/0.4)); return {hand:{c,off:0,up:0,press:1},carry:i,pos:c,i,t}; }
    if(t<3.6) return {hand:mix({c:dst.clone(),off:0,up:0,press:1},hover(dst),ease((t-3.3)/0.3)),carry:-1,i,t,placed:true};
    return {hand:hover(dst),carry:-1,i,t,placed:true};
  }
  function bubble(text,alpha){ if(alpha<=0)return; g.save(); g.globalAlpha=alpha; g.font='900 60px "Noto Sans CJK KR",sans-serif';
    const w=g.measureText(text).width+110, h=110, x=W/2, y=82; g.shadowColor='rgba(0,0,0,.18)'; g.shadowBlur=18; g.shadowOffsetY=5;
    g.fillStyle='#e8743b'; g.beginPath(); g.roundRect(x-w/2,y-h/2,w,h,55); g.fill(); g.shadowColor='transparent';
    g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,x,y+3); g.restore(); }
  function frame(T){
    const st=state(Math.min(T,N*D+LEAVE));
    const done=T>=N*D;
    sticks.forEach((m,j)=>{ m.material.emissive.setRGB(0,0,0);
      const moved = done || j<(st.i??N) || (j===st.i && st.placed);
      m.position.copy(moved?slot(j):m.userData.home); });
    if(st.carry>=0) sticks[st.carry].position.copy(st.pos);
    // 다음에 가져올 막대 살짝 반짝
    if(!done && st.t<1.4){ const a=Math.sin(clamp(st.t/1.4)*Math.PI)*0.4; sticks[st.i].material.emissive.set(COLS[st.i]).multiplyScalar(a); }
    const h=st.hand, pitch=-0.82+h.up*2.0, pr=h.press;
    const pose={index:P0.index.map((v,k)=>v+(P1.index[k]-v)*pr),curl:P0.curl,thumb:P0.thumb};
    S.place(S.hands.left, pose, h.c.clone().add(V(-e-h.off,h.up,0)), -1.15, pitch);
    S.place(S.hands.right,pose, h.c.clone().add(V( e+h.off,h.up,0)),  1.15, pitch);
    S.render(); g.globalAlpha=1; g.drawImage(cv,0,0);
    const fadeOut=clamp((T-(N*D+LEAVE+HOLD))/FADE);
    bubble('갯수를 세어주세요', clamp(T/0.5)*(1-fadeOut));
    if(fadeOut>0){ g.save(); g.globalAlpha=fadeOut; g.fillStyle='#f4f1ea'; g.fillRect(0,0,W,H); g.restore(); }
    return out.toDataURL('image/png').split(',')[1];
  }
  await document.fonts.load('900 60px "Noto Sans CJK KR"');
  window.TOTAL=TOTAL; window.frame=frame; document.title='done';
})().catch(e=>{window.ERR=String(e.stack||e);document.title='done';});
