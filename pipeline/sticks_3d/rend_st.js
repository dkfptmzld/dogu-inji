const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [html,out,mode]=process.argv.slice(2);
  const b=await chromium.launch({args:['--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:1920,height:1080}}); p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+html); await p.waitForFunction(()=>document.title==='done',null,{timeout:180000});
  const err=await p.evaluate(()=>window.ERR); if(err){console.log(err);process.exit(1);}
  const T=await p.evaluate(()=>window.TOTAL); fs.mkdirSync(out,{recursive:true});
  const times= mode? mode.split(',').map(Number) : [...Array(Math.round(T*30)).keys()].map(i=>i/30);
  for(let i=0;i<times.length;i++){ fs.writeFileSync(out+'/f'+String(i).padStart(4,'0')+'.png',Buffer.from(await p.evaluate(t=>frame(t),times[i]),'base64')); if(i%100===0)console.log(i,'/',times.length); }
  console.log('T',T,'done'); await b.close(); })();
