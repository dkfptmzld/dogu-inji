// 여러 손가락에 걸친 고무줄 (v3) — 좌표는 원본 그림 픽셀
function shade(c,f){return c.map(v=>Math.round(f>0?v+(255-v)*f:v*(1+f)));}
const css=(c,a=1)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
function drawRubber(g,B,opt={}){
  const W=opt.W||26, col=shade(B.color,0.06), F=B.fingers;
  const [cx,cy]=B.c, [dx,dy]=B.d; let nx=-dy, ny=dx; if(ny<0){nx=-nx;ny=-ny;}
  const lift=opt.lift||0, alpha=opt.alpha??1, loose=opt.loose||0;   // loose: 0=조여짐, 1=느슨
  const P=(t,s)=>[cx+dx*t+nx*(s-lift), cy+dy*t+ny*(s-lift)];
  const ta=F[0][0]+1, tb=(opt.tEnd!=null?opt.tEnd:F[F.length-1][1]-1);
  const fin=t=>{ for(const [a,b] of F) if(t>=a&&t<=b) return (t-a)/(b-a); return -1; };
  // 손가락 위에서는 둥근 손가락을 감싸 살짝 휘어짐, 사이는 팽팽한 직선
  const sag=t=>{ const m=fin(t); return m<0?0:(3.5+2*loose)*Math.sin(m*Math.PI); };
  const width=t=>{ let e=1e9; for(const [a,b] of F){ if(t>=a&&t<=b){e=0;break;} e=Math.min(e,Math.abs(t-a),Math.abs(t-b)); }
    let w=W*(e>0?(0.9+0.1*Math.max(0,1-e/8)):1); const end=Math.min(t-ta,tb-t); if(end<12) w*=0.5+0.5*Math.sqrt(Math.max(0,end)/12); return w*(1+0.12*loose); };
  g.save(); g.globalAlpha=alpha;
  const poly=(pts)=>{ g.beginPath(); pts.forEach(([t,s],i)=>{const q=P(t,s); i?g.lineTo(...q):g.moveTo(...q);}); };
  // 1) 뒤쪽 줄 — 손가락 사이 틈으로 얇게
  g.save(); g.filter='blur(1px)'; g.fillStyle=css(shade(col,-0.55),0.7);
  for(let k=0;k<F.length-1;k++){ const a=F[k][1]-2, b=F[k+1][0]+2; poly([[a,-W*0.5],[b,-W*0.5],[b,-W*0.28],[a,-W*0.28]]); g.fill(); }
  g.restore();
  // 2) 손가락 위 그림자 (밴드 아래쪽 진하게, 위쪽 옅게)
  g.save(); g.filter='blur(3px)';
  for(const [a,b] of F){ const pts=[]; for(let t=a+3;t<=b-3;t+=3) pts.push([t,sag(t)+W*0.3]); for(let t=b-3;t>=a+3;t-=3) pts.push([t,sag(t)+W*0.85]);
    g.fillStyle='rgba(105,45,25,0.33)'; poly(pts); g.fill(); }
  g.restore();
  // 3) 본체
  const top=[],bot=[]; for(let t=ta;t<=tb;t+=1.5){ const w=width(t),s=sag(t); top.push([t,s-w/2]); bot.push([t,s+w/2]); }
  const outline=[...top,...bot.slice().reverse()]; const body=()=>poly(outline);
  const [x0,y0]=P(0,-W/2),[x1,y1]=P(0,W/2); const gr=g.createLinearGradient(x0,y0,x1,y1);
  gr.addColorStop(0,css(shade(col,0.35))); gr.addColorStop(0.3,css(col)); gr.addColorStop(0.75,css(col)); gr.addColorStop(1,css(shade(col,-0.3)));
  body(); g.fillStyle=gr; g.fill();
  g.save(); body(); g.clip();
  // 손가락 둥근 면: 가장자리 쪽 살짝 어둡게 / 사이 구간은 늘어나 살짝 밝게
  for(const [a,b] of F){ const [ax,ay]=P(a,0),[bx,by]=P(b,0); const lg=g.createLinearGradient(ax,ay,bx,by);
    lg.addColorStop(0,'rgba(0,0,0,0.12)'); lg.addColorStop(0.25,'rgba(0,0,0,0)'); lg.addColorStop(0.75,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(0,0,0,0.12)');
    g.fillStyle=lg; poly([[a,-W*2],[b,-W*2],[b,W*2],[a,W*2]]); g.fill(); }
  for(let k=0;k<F.length-1;k++){ const a=F[k][1], b=F[k+1][0]; g.fillStyle='rgba(255,255,255,0.07)'; poly([[a,-W*2],[b,-W*2],[b,W*2],[a,W*2]]); g.fill(); }
  // 양 끝: 손가락 옆으로 돌아 들어가며 어두워짐
  for(const [e0,e1] of [[ta,ta+18],[tb,tb-18]]){ const [ax,ay]=P(e0,0),[bx,by]=P(e1,0); const lg=g.createLinearGradient(ax,ay,bx,by);
    lg.addColorStop(0,'rgba(0,0,0,0.5)'); lg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=lg; poly([[e0,-W*2],[e1,-W*2],[e1,W*2],[e0,W*2]]); g.fill(); }
  g.restore();
  // 4) 광택 — 원본 고무줄처럼 위쪽에 부드러운 빛
  g.save(); g.filter='blur(1.5px)'; g.lineCap='round';
  for(const gap of [false,true]){ g.beginPath(); let pen=false;
    for(let t=ta+14;t<tb-14;t+=3){ const on=fin(t)>=0; const q=P(t,sag(t)-W*0.2); if(on!==gap){ pen?g.lineTo(...q):g.moveTo(...q); pen=true; } else pen=false; }
    g.lineWidth=W*(gap?0.12:0.2); g.strokeStyle=`rgba(255,255,255,${gap?0.2:0.55})`; g.stroke(); }
  g.restore();
  // 5) 얇은 테두리
  body(); g.lineWidth=1.3; g.strokeStyle=css(shade(col,-0.6),0.5); g.stroke();
  g.restore();
}
// 살 눌림 레이어 (밴드 주변만)
function drawPinchR(g,B,warpImg,alpha,W=26){ if(alpha<=0)return; const F=B.fingers, [cx,cy]=B.c,[dx,dy]=B.d,nx=-dy,ny=dx;
  const P=(t,s)=>[cx+dx*t+nx*s, cy+dy*t+ny*s], a=F[0][0]-28, b=F[F.length-1][1]+28, h=W*2.6;
  g.save(); g.globalAlpha=alpha; g.beginPath(); [[a,-h],[b,-h],[b,h],[a,h]].forEach(([t,s],i)=>{const q=P(t,s); i?g.lineTo(...q):g.moveTo(...q);}); g.clip(); g.drawImage(warpImg,0,0); g.restore(); }

// 한 손가락에 걸고 옆 손가락으로 당겨 늘리기: upto=1 첫 손가락만, 1.5 = 두 번째로 당기는 중 ...
function drawRubberPull(g,B,upto,opt={}){
  const F=B.fingers, n=Math.max(1,Math.min(F.length,Math.floor(upto+1e-6))), fr=upto-n;
  const sub={...B, fingers:F.slice(0,n)};
  const o={...opt};
  if(fr>1e-3 && n<F.length){ const e=fr<0.5?2*fr*fr:1-Math.pow(-2*fr+2,2)/2; o.tEnd=F[n-1][1]-1+(F[n][1]-1-(F[n-1][1]-1))*e;
    o.W=(opt.W||26)*(1-0.08*Math.sin(fr*Math.PI)); }   // 당기는 동안 살짝 가늘어짐
  else if(n<F.length && fr<=1e-3 && n===1){ /* 첫 손가락에만 걸린 상태 */ }
  // 늘어난 길이에 따라 전체 두께 살짝 감소
  const total=(o.tEnd??F[n-1][1])-F[0][0], single=F[0][1]-F[0][0];
  o.W=(o.W||26)*Math.max(0.8,1-0.06*(total/single-1));
  drawRubber(g,sub,o);
}
