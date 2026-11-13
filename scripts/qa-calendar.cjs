// Conferência no navegador: estação, dia e ano na interface (servidor Vite em 127.0.0.1:5190).
const { chromium } = require('playwright');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-calendario'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(180000); page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Calendário');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'property');
    await page.waitForTimeout(800);
    const read = () => page.evaluate(() => ({ day: document.querySelector('#hud-day').textContent, year: document.querySelector('#hud-year').textContent, title: document.querySelector('.season-date').title }));
    console.log(JSON.stringify(await read()));
    await page.screenshot({ path: `${out}/hud-primavera.png`, clip: { x: 1030, y: 0, width: 250, height: 140 } });
    await page.evaluate(async () => { const game = (await import(document.querySelector('script[src*="main.ts"]').src)).game; const v = game.scene.getScene('Vale'); v.state.day = 142; });
    await page.waitForTimeout(800);
    console.log(JSON.stringify(await read()));
    await page.screenshot({ path: `${out}/hud-verao-ano2.png`, clip: { x: 1030, y: 0, width: 250, height: 140 } });
    console.log('erros', JSON.stringify(errors));
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
