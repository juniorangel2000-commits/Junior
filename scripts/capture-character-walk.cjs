const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const output = path.resolve(__dirname, '../docs/previa-personagem');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: '/tmp/after-rain-walk-video', size: { width: 1280, height: 800 } } });
  try {
    const page = await context.newPage(), beginning = Date.now(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');
    await page.locator('#new-game').waitFor();
    await page.evaluate(async () => { const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.scene = game.scene.scenes[0]; });
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Clara');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => scene.running && !scene.paused);
    await page.getByRole('button', { name: 'Fechar missões', exact: true }).click();
    await page.evaluate(() => {
      for (let y = 20; y < 65; y++) for (let x = 12; x < 85; x++) {
        let clear = true;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (scene.blocked(x + dx, y + dy)) clear = false;
        if (clear) {
          scene.player.x = x * 32 + 16 + 61;
          scene.player.y = y * 32 + 16 - 25;
          document.querySelector('.toast-stack').replaceChildren();
          return;
        }
      }
      throw Error('No clear walking area');
    });
    await page.waitForTimeout(800);
    const trimStart = (Date.now() - beginning) / 1000;
    await page.waitForTimeout(500);
    for (const keys of [['s'], ['s','a'], ['a'], ['a','w'], ['w'], ['w','d'], ['d'], ['d','s']]) {
      // One event task per turn avoids accidental cardinal frames between diagonal keys.
      await page.evaluate(keys => {
        for (const key of ['w','a','s','d']) {
          const keyCode = key.toUpperCase().charCodeAt(0);
          window.dispatchEvent(new KeyboardEvent(keys.includes(key) ? 'keydown' : 'keyup', { key, code: `Key${key.toUpperCase()}`, keyCode, which: keyCode, bubbles: true }));
        }
      }, keys);
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => scene.input.keyboard.resetKeys());
    await page.waitForTimeout(700);
    const duration = (Date.now() - beginning) / 1000 - trimStart;
    const video = page.video();
    await page.close();
    await video.saveAs('/tmp/after-rain-walk-full.webm');
    await fs.writeFile('/tmp/after-rain-walk-trim.json', JSON.stringify({ trimStart, duration }));
    if (errors.length) throw Error(errors.join('\n'));
    console.log(JSON.stringify({ video: '/tmp/after-rain-walk-full.webm', trimStart, duration }));
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
