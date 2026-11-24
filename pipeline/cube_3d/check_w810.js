// 확인용: node check_w810.js <출력 폴더> <장면들...> → 장면마다 25%·55%·88% 시각 화면 3장
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const out = process.argv[2]; const scenes = process.argv.slice(3); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const url = 'file:///' + path.resolve(__dirname, 'w810.html').split(path.sep).join('/');
  for (const s of scenes) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(url + '?s=' + s);
    try { await p.waitForFunction(() => document.title === 'done', null, { timeout: 30000 }); } catch (e) { console.log(s, 'TIMEOUT', errs.join('|')); await p.close(); continue; }
    const T = await p.evaluate(() => window.TOTAL); const ts = (process.env.TS ? process.env.TS.split(',').map(Number) : [0.25, 0.55, 0.88]).map(f => +(T * f).toFixed(2));
    for (const [k, t] of ts.entries()) { try { fs.writeFileSync(path.join(out, `${s}_${k}.png`), Buffer.from(await p.evaluate(t => frame(t), t), 'base64')); } catch (e) { console.log(s, 'ERR', e.message.slice(0, 200)); break; } }
    console.log(s, 'T', T.toFixed(1), errs.length ? 'ERRS ' + errs.join('|').slice(0, 200) : ''); await p.close(); }
  await b.close(); })();
