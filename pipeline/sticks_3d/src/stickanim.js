import { createScene } from './sticks2.js';
(async()=>{
  const W=1920,H=1080; const cv=document.getElementById('c'); cv.width=W; cv.height=H;
  const S=await createScene(cv); S.resize(W,H); const {THREE}=S; const V=(...a)=>new THREE.Vector3(...a);
  S.camera.position.set(0,0.47,0.47); S.camera.lookAt(0,0.0,-0.035); S.camera.updateMatrixWorld();
  const out=document.createElement('canvas'); out.width=W; out.height=H; const g=out.getContext('2d');
  const P={index:[0.06,0.1,0.05], curl:[1.35,1.45,0.9], thumb:[0.25,0.45,0.45]};
  const PRESS={index:[0.12,0.16,0.12], curl:[1.35,1.45,0.9], thumb:[0.25,0.45,0.45]};
  const SEQ=['파란','빨간','초록'];
  const SLOT=[V(0,S.T/2,0.062),V(0,S.T/2,0.075),V(0,S.T/2,0.088)];
  const SEG=7.2, END=3.0, OUT=0.8, TOTAL=SEQ.length*SEG+END+OUT;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)); const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const lerp=(a,b,p)=>a.clone().lerp(b,p);
  const e=S.L/2+0.0032;
  // 시간별 막대 중심 위치와 손끝 간격
  function stickPath(home,slot,t){
    // 반환: 막대 중심, 손 상태(off: 바깥으로 떨어진 거리, up: 위로 든 거리)
    const lift=0.045;
    const k=[[0,null],[1.2,'approach'],[2.4,'press'],[2.8,'lift'],[3.6,'carry'],[5.0,'lower'],[5.6,'release'],[6.1,'leave'],[7.2,'end']];
    let c=home.clone(), off=0.11, up=0.07, press=0;
    if(t<1.2){ off=0.11; up=0.07; }
    else if(t<2.4){ const p=ease((t-1.2)/1.2); off=0.11+(0.006-0.11)*p; up=0.07*(1-p); }
    else if(t<2.8){ const p=ease((t-2.4)/0.4); off=0.006*(1-p); up=0; press=p; }
    else if(t<3.6){ const p=ease((t-2.8)/0.8); c=lerp(home,home.clone().add(V(0,lift,0)),p); off=0; up=0; press=1; }
    else if(t<5.0){ const p=ease((t-3.6)/1.4); const a=home.clone().add(V(0,lift,0)), b=slot.clone().add(V(0,lift,0)); c=lerp(a,b,p); off=0; up=0; press=1; }
    else if(t<5.6){ const p=ease((t-5.0)/0.6); c=lerp(slot.clone().add(V(0,lift,0)),slot,p); off=0; up=0; press=1; }
    else if(t<6.1){ const p=ease((t-5.6)/0.5); c=slot.clone(); off=0.008*p; up=0.01*p; press=1-p; }
    else { const p=ease(clamp((t-6.1)/1.0)); c=slot.clone(); off=0.008+0.1*p; up=0.01+0.06*p; }
    return {c,off,up,press};
  }
  function bubble(x,y,text,color,alpha){ if(alpha<=0)return; g.save(); g.globalAlpha=alpha; g.font='800 54px "Noto Sans CJK KR",sans-serif';
    const tw=g.measureText(text).width, w=tw+150, h=96; g.shadowColor='rgba(0,0,0,.18)'; g.shadowBlur=16; g.shadowOffsetY=4;
    g.fillStyle='#fff'; g.beginPath(); g.roundRect(x-w/2,y-h/2,w,h,48); g.fill(); g.shadowColor='transparent';
    g.lineWidth=6; g.strokeStyle=color; g.stroke(); g.fillStyle=color; g.beginPath(); g.roundRect(x-w/2+30,y-17,62,34,10); g.fill();
    g.fillStyle='#1f2a37'; g.textBaseline='middle'; g.textAlign='left'; g.fillText(text,x-w/2+112,y+3); g.restore(); }
  function arrowDown(x,y,len,alpha){ if(alpha<=0)return; g.save(); g.globalAlpha=alpha; g.translate(x,y);
    const sw=24,hw=64,hl=60; const path=()=>{g.beginPath(); g.moveTo(0,0); g.lineTo(-hw/2,-hl); g.lineTo(-sw/2,-hl); g.lineTo(-sw/2,-len); g.lineTo(sw/2,-len); g.lineTo(sw/2,-hl); g.lineTo(hw/2,-hl); g.closePath();};
    g.lineJoin='round'; g.shadowColor='rgba(0,0,0,.2)'; g.shadowBlur=10; path(); g.lineWidth=12; g.strokeStyle='#fff'; g.stroke(); g.shadowColor='transparent'; path(); g.fillStyle='#e8743b'; g.fill(); g.restore(); }
  function arrowSide(x,y,len,alpha){ if(alpha<=0)return; g.save(); g.globalAlpha=alpha; g.translate(x,y); g.rotate(-Math.PI/2); arrowDown(0,0,len,1); g.restore(); }
  const proj=v=>{ const p=v.clone().project(S.camera); return [(p.x+1)/2*W,(1-p.y)/2*H]; };
  function frame(T){
    const outA=1-clamp((T-(SEQ.length*SEG+END))/OUT);
    // 막대 위치 초기화
    for(const n in S.sticks){ const m=S.sticks[n]; m.position.copy(m.userData.home); m.material.emissive.setRGB(0,0,0); }
    const k=Math.min(SEQ.length-1,Math.floor(T/SEG)), t=T-k*SEG, done=T>=SEQ.length*SEG;
    for(let j=0;j<k||(done&&j<SEQ.length);j++){ S.sticks[SEQ[j]].position.copy(SLOT[j]); }
    let hs={c:null,off:0.11,up:0.07,press:0};
    if(!done){ const m=S.sticks[SEQ[k]]; hs=stickPath(m.userData.home,SLOT[k],t); m.position.copy(hs.c);
      const glow=clamp(t/0.3)*(1-clamp((t-2.4)/0.3))*(0.5+0.5*Math.sin(t*8)); m.material.emissive.set(S.COLORS[SEQ[k]]).multiplyScalar(0.55*glow); }
    // 손
    const center = hs.c || S.sticks[SEQ[Math.min(k,SEQ.length-1)]].position.clone();
    const away = done ? 1 : 0;
    const off=done?0.11:hs.off, up=done?0.07:hs.up;
    const pr=hs.press||0; const pose={index:P.index.map((v,i)=>v+(PRESS.index[i]-v)*pr),curl:P.curl,thumb:P.thumb};
    const pitch=-0.82+up*2.0;
    S.place(S.hands.left, pose, center.clone().add(V(-e-off,up,0)), -1.15, pitch);
    S.place(S.hands.right,pose, center.clone().add(V( e+off,up,0)),  1.15, pitch);
    S.render();
    g.globalAlpha=1; g.drawImage(cv,0,0);
    if(!done){ const col=S.COLORS[SEQ[k]]; const a=clamp(t/0.35)*(1-clamp((t-6.4)/0.4));
      bubble(W/2,90,SEQ[k]+' 막대를 가져와요',col,a);
      const h0=S.sticks[SEQ[k]].userData.home; const [ex,ey]=proj(h0.clone().add(V(-S.L/2,0.005,0)));
      const bob=Math.sin(t*6)*12; arrowSide(ex-18-bob,ey,190,clamp(t/0.35)*(1-clamp((t-1.6)/0.4)));
    } else {
      g.save(); g.globalAlpha=clamp((T-SEQ.length*SEG)/0.4)*outA; g.font='900 64px "Noto Sans CJK KR",sans-serif'; const txt='잘했어요! 세 개 모두 가져왔어요';
      const w=g.measureText(txt).width+90; g.fillStyle='#e8743b'; g.beginPath(); g.roundRect(W/2-w/2,60,w,104,52); g.fill();
      g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,W/2,114); g.restore();
    }
    if(outA<1){ g.save(); g.globalAlpha=1-outA; g.fillStyle='#f4f1ea'; g.fillRect(0,0,W,H); g.restore(); }
    return out.toDataURL('image/png').split(',')[1];
  }
  await document.fonts.load('800 54px "Noto Sans CJK KR"');
  window.TOTAL=TOTAL; window.frame=frame; document.title='done';
})().catch(e=>{window.ERR=String(e.stack||e);document.title='done';});
