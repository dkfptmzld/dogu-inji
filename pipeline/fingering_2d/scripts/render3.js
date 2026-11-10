const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const [dir,out,mode]=process.argv.slice(2); const fps=30;
  const b = await chromium.launch({args:['--allow-file-access-from-files','--disable-web-security']});
  const p = await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+dir+'/steps.html'); await p.evaluate(()=>window.ready);
  const T=await p.evaluate(()=>window.SEQ_T); fs.mkdirSync(out,{recursive:true});
  const grab=async t=>Buffer.from(await p.evaluate(t=>{drawSeq(t);return document.getElementById('c').toDataURL('image/png').split(',')[1];},t),'base64');
  const times = mode==='preview' ? [0.8,1.6,3.4+0.8,5*3.4+0.2,5*3.4+1.5,9*3.4+1.5,10*3.4+1.0,10*3.4+3.9] : [...Array(Math.round(T*fps)).keys()].map(i=>i/fps);
  for(let i=0;i<times.length;i++) fs.writeFileSync(out+'/f'+String(i).padStart(4,'0')+'.png',await grab(times[i]));
  console.log('T',T,'frames',times.length); await b.close();
})();
