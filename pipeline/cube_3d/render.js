// node render.js <장면 1~4> <출력 폴더> [미리보기 시각 "1,5,9"] [나눠 돌리기: 몇번째/몇개 "0/3"]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [s, out, mode, part] = process.argv.slice(2);
  const gpu = process.env.GPU === '1';
  const args = ['--allow-file-access-from-files', ...(gpu ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])];
  const b = await chromium.launch({ args });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); p.on('pageerror', e => console.log('ERR', e.message));
  const page = process.env.PAGE || 'cube.html';      // 3~4주차는 PAGE=w34.html
  await p.goto('file:///' + path.resolve(__dirname, page).replace(/\\/g, '/') + '?s=' + s);
  await p.waitForFunction(() => document.title === 'done', null, { timeout: 180000 });
  const T = await p.evaluate(() => window.TOTAL); fs.mkdirSync(out, { recursive: true });
  if (!mode || mode === '-') fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify({ T, events: await p.evaluate(() => window.EVENTS) }));
  let idx = mode && mode !== '-' ? mode.split(',').map(Number) : [...Array(Math.round(T * 30)).keys()].map(i => i / 30);
  const items = idx.map((t, i) => [t, i]); let mine = items;
  if (part) { const [k, n] = part.split('/').map(Number); mine = items.filter(([, i]) => i % n === k); }
  const t0 = Date.now();
  for (let j = 0; j < mine.length; j++) { const [t, i] = mine[j];
    fs.writeFileSync(path.join(out, 'f' + String(i).padStart(4, '0') + '.png'), Buffer.from(await p.evaluate(t => frame(t), t), 'base64'));
    if (j % 100 === 0) console.log(s, part || '', j, '/', mine.length, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
  console.log('scene', s, 'T', T.toFixed(1), 'frames', mine.length, ((Date.now() - t0) / 1000).toFixed(0) + 's'); await b.close();
})();
