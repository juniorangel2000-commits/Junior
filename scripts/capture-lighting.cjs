// Captura a Propriedade em vários horários (Vite em 127.0.0.1:5190) para comparar a iluminação.
// Uso: node scripts/capture-lighting.cjs <pasta>
const { chromium } = require('playwright');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/luz';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }); page.setDefaultTimeout(180000);
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Luz');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => { window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game; window.v = game.scene.getScene('Vale'); document.querySelector('#ui').style.visibility = 'hidden'; });
    const spots = { casa: null, lago: { x: 1180, y: 1480 } };
    for (const [name, pos] of Object.entries(spots)) for (const [label, minutes] of [['07h', 420], ['12h', 720], ['18h30', 1110], ['21h', 1260], ['02h', 120]]) {
      await page.evaluate(({ minutes, pos }) => { v.state.time = minutes; if (pos) { v.player.x = pos.x; v.player.y = pos.y; } }, { minutes, pos });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${name}-${label}.png` });
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
