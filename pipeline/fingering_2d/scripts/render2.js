const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const [dir,out,mode]=process.argv.slice(2); const fps=30;
  const b = await chromium.launch({args:['--allow-file-access-from-files','--disable-web-security']});
  const p = await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+dir+'/steps.html'); await p.evaluate(()=>window.ready);
  const totals=await p.evaluate(()=>window.TOTALS);
  const jobs = mode==='preview' ? [[0,0.8],[0,2.0],[0,4.0],[4,1.0],[7,2.2],[10,7.0]] : null;
  const grab=async(k,t)=>Buffer.from(await p.evaluate(([k,t])=>{draw(k,t);return document.getElementById('c').toDataURL('image/png').split(',')[1];},[k,t]),'base64');
  if(jobs){ fs.mkdirSync(out,{recursive:true}); for(let i=0;i<jobs.length;i++) fs.writeFileSync(out+'/p'+i+'.png',await grab(...jobs[i])); }
  else for(let k=0;k<totals.length;k++){ const d=out+'/s'+(k+1); fs.mkdirSync(d,{recursive:true});
    const n=Math.round(totals[k]*fps); for(let i=0;i<n;i++) fs.writeFileSync(d+'/f'+String(i).padStart(4,'0')+'.png',await grab(k,i/fps)); console.log('step',k+1,n); }
  await b.close();
})();
