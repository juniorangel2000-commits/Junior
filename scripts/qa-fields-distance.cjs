// Conferência do distanciamento nos Campos Abertos (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional):
// o jogador se aproxima de cada animal solto e ele precisa se afastar. Uma vaca deitada
// levanta e foge. O cavalo domado não foge.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-campos-distancia';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(180000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Campos QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const v = game.scene.getScene('Vale'); v.state.time = 600; v.player.x = 816; v.player.y = 2190; v.snapshotState();
    });
    await page.keyboard.down('s'); await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields'); await page.keyboard.up('s');
    await page.evaluate(() => { window.s = game.scene.getScene('Campos'); });
    await page.waitForTimeout(800);
    /** Põe o jogador a ~90 px do animal, num ponto livre com visão, e mede a distância 2 s depois. */
    const approach = (id, setup) => page.evaluate(async ({ id, setup }) => {
      const { fieldsSafe } = await import('/src/data/open-fields.ts');
      const a = s.world.animals.find((a) => a.brain.id === id), b = a.brain;
      if (setup === 'rest') { a.rest.phase = 'resting'; b.resting = true; }
      const spots = [[-90, 0], [90, 0], [0, -90], [0, 90], [-64, -64], [64, 64], [-64, 64], [64, -64]].map(([dx, dy]) => ({ x: b.x + dx, y: b.y + dy }));
      const p = spots.find((p) => fieldsSafe(p) && b.lineClear(b, p)); if (!p) return { id, skipped: true };
      s.player.x = p.x; s.player.y = p.y; const before = Math.hypot(b.x - p.x, b.y - p.y);
      await new Promise((r) => setTimeout(r, 2000));
      return { id, kind: b.kind, before: Math.round(before), after: Math.round(Math.hypot(b.x - s.player.x, b.y - s.player.y)), mode: b.mode, phase: a.rest?.phase };
    }, { id, setup });
    const ids = await page.evaluate(() => s.world.animals.map((a) => a.brain.id));
    const results = [];
    for (const id of ids) {
      const r = await approach(id); results.push(r); console.log('·', JSON.stringify(r));
      assert.ok(!r.skipped, `sem ponto de aproximação para ${id}`);
      assert.ok(r.after > r.before + 20, `${id} não se afastou (${r.before} → ${r.after})`);
      // Leva o jogador para longe antes do próximo, para os outros se acalmarem.
      await page.evaluate(() => { s.player.x = 1500; s.player.y = 300; }); await page.waitForTimeout(300);
    }
    const cow = ids.find((id) => id.includes('cow'));
    await page.evaluate(() => { s.player.x = 1500; s.player.y = 300; }); await page.waitForTimeout(3500);
    const rest = await approach(cow, 'rest'); results.push({ ...rest, deitada: true }); console.log('· vaca deitada:', JSON.stringify(rest));
    assert.ok(rest.after > rest.before + 10, 'a vaca deitada não levantou para se afastar');
    await page.screenshot({ path: `${out}/campos-fuga.png` });
    fs.writeFileSync(`${out}/validacao.json`, JSON.stringify(results, null, 1));
    assert.deepEqual(errors, []); console.log('QA do distanciamento nos Campos: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
