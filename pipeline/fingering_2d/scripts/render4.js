const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const [dir,out,which,mode]=process.argv.slice(2); const fps=30;
  const b = await chromium.launch({args:['--allow-file-access-from-files','--disable-web-security']});
  const p = await b.newPage({viewport:{width:1920,height:1080}});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+dir+'/p2.html'); await p.evaluate(()=>window.ready);
  const T=await p.evaluate(w=>w==='A'?window.TA:window.TB, which); fs.mkdirSync(out,{recursive:true});
  const grab=async t=>Buffer.from(await p.evaluate(([w,t])=>{(w==='A'?drawA:drawB)(t);return document.getElementById('c').toDataURL('image/png').split(',')[1];},[which,t]),'base64');
  const times = mode ? mode.split(',').map(Number) : [...Array(Math.round(T*fps)).keys()].map(i=>i/fps);
  for(let i=0;i<times.length;i++) fs.writeFileSync(out+'/f'+String(i).padStart(4,'0')+'.png',await grab(times[i]));
  console.log(which,'T',T.toFixed(1),'frames',times.length); await b.close();
})();
