const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [html,out,part,parts]=process.argv.slice(2);
  const b=await chromium.launch({args:['--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+html); await p.waitForFunction(()=>document.title==='done',null,{timeout:180000});
  const T=await p.evaluate(()=>window.TOTAL); const n=Math.round(T*30); fs.mkdirSync(out,{recursive:true});
  for(let i=+part;i<n;i+=+parts){ fs.writeFileSync(out+'/f'+String(i).padStart(4,'0')+'.png',Buffer.from(await p.evaluate(t=>frame(t),i/30),'base64')); }
  console.log('part',part,'done'); await b.close(); })();
