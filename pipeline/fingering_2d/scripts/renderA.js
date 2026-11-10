// pA.html → A안 프레임 렌더.  node renderA.js <assets 폴더> <출력 폴더> <모양 번호> [미리보기 시각들 "1.5,4,9"]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, out, k, mode] = process.argv.slice(2); const fps = 30;
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///' + path.resolve(dir, 'pA.html').replace(/\\/g, '/') + '?k=' + k);
  await p.evaluate(() => window.ready);
  const T = await p.evaluate(() => window.TA); fs.mkdirSync(out, { recursive: true });
  console.log('순서:', (await p.evaluate(() => window.ORDER_INFO)).join(' | '));
  const grab = async t => Buffer.from(await p.evaluate(t => { drawA(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t), 'base64');
  const times = mode ? mode.split(',').map(Number) : [...Array(Math.round(T * fps)).keys()].map(i => i / fps);
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(out, 'f' + String(i).padStart(4, '0') + '.png'), await grab(times[i]));
  console.log('k', k, 'T', T.toFixed(1), 'frames', times.length); await b.close();
})();
