// Headless smoke: node tests/smoke.mjs [url]   (serve the folder first, e.g. python3 -m http.server 8124)
import { chromium, devices } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:8124/';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
let fail = 0; const out = {};
for (const [name, opts] of [['mobile', devices['Pixel 7']], ['iphone', devices['iPhone 13']], ['desktop', { viewport: { width: 1280, height: 800 } }]]) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?debug=1', { waitUntil: 'networkidle' });
  const click = sel => opts.hasTouch ? page.tap(sel) : page.click(sel);
  await page.screenshot({ path: `/tmp/ss-${name}-menu.png` });
  await click('#b-inf'); await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({ x: __ss.game.piece.x, cells: __ss.game.piece.cells.join() }));
  await click('#pad [data-a=left]'); await click('#pad [data-a=rot]');
  const after = await page.evaluate(() => ({ x: __ss.game.piece.x, cells: __ss.game.piece.cells.join() }));
  for (let i = 0; i < 4; i++) await click('#pad [data-a=drop]');
  if (!opts.hasTouch) { await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(800); await page.screenshot({ path: `/tmp/ss-${name}-play.png` });
  const placed = await page.evaluate(() => __ss.game.grid.flat().filter(Boolean).length + __ss.game.cleared); const dropScore = await page.evaluate(() => __ss.game.score);
  const box = await page.evaluate(() => { const r = document.getElementById('board').getBoundingClientRect(); return { w: r.width, h: r.height, fits: r.right <= innerWidth && r.bottom <= innerHeight }; });
  // secrets: cabinet tap launches, exit returns, bonus added
  const secrets = [];
  for (const k of ['brick', 'pong', 'ice']) {
    await page.evaluate(() => __ss.showCabinet()); const vis = await page.isVisible('#cabinet');
    const s0 = await page.evaluate(() => __ss.game.score);
    await click('#cabinet'); await page.waitForTimeout(700);
    const key = await page.evaluate(() => __ss.secret && __ss.secret.key); const shown = await page.isVisible('#sec-cv');
    const cv = await page.$('#sec-cv'); const bb = await cv.boundingBox();
    if (opts.hasTouch) { await page.touchscreen.tap(bb.x + bb.width * 0.5, bb.y + bb.height * 0.6); await page.touchscreen.tap(bb.x + 20, bb.y + bb.height - 10); }
    else { await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * 0.6); await page.keyboard.press(' '); }
    await page.waitForTimeout(1500); await page.screenshot({ path: `/tmp/ss-${name}-${k}.png` });
    await click('#sec-exit'); await page.waitForTimeout(200);
    const back = await page.evaluate(() => !__ss.secret && document.getElementById('game').classList.contains('active'));
    const s1 = await page.evaluate(() => __ss.game.score);
    secrets.push({ k, vis, key, shown, back, bonus: s1 - s0 });
    if (!vis || key !== k || !shown || !back) fail++;
  }
  // time run jump via debug param + game over screen
  await page.goto(url + '?debug=1&level=12', { waitUntil: 'networkidle' });
  const tr = await page.evaluate(() => ({ mode: __ss.game.mode, level: __ss.game.level, colors: __ss.game.def.colors, blocks: __ss.game.grid.flat().filter(Boolean).length }));
  await page.screenshot({ path: `/tmp/ss-${name}-tr12.png` });
  await page.evaluate(() => { __ss.game.end(false); }); await page.waitForTimeout(1200);
  const overShown = await page.isVisible('#over');
  await click('#o-menu'); await click('#b-lb'); const lb = await page.textContent('#lb-tr');
  await page.screenshot({ path: `/tmp/ss-${name}-lb.png` });
  out[name] = { moved: before.x - after.x === 1, rotated: before.cells !== after.cells, placed, dropScore, box, secrets, tr, overShown, errors };
  if (errors.length || !(before.x - after.x === 1) || placed < 3 || dropScore < 1 || !box.fits || tr.level !== 12 || !overShown) fail++;
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1)); console.log(fail ? 'SMOKE FAIL ' + fail : 'SMOKE PASS');
await browser.close(); process.exit(fail ? 1 : 0);
