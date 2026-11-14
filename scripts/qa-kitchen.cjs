// Conferência da cozinha (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): o fogão a lenha aparece
// na casa, E abre o caderno, a receita aprendida com a Helena é cozida e o prato recupera vigor.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-cozinha';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Cozinha QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    // Duas receitas aprendidas com a Helena (pelo próprio serviço) e ingredientes na mochila.
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const { performVillageService } = await import('/src/systems/village-services.ts');
      const s = v.snapshotState(); s.villageEconomy.coins = 500;
      for (let i = 0; i < 2; i++) if (!performVillageService(s, 'learn-dish').ok) throw Error('serviço da Helena falhou');
      Object.assign(s.inventory, { egg: 2, kale: 1, wood: 2, lettuce: 1, tomato: 1 }); s.villageProgress.vigor = 20;
      v.loadState(s); v.player.x = 24.5 * 32; v.player.y = 16.5 * 32 + 30;
    });
    await page.keyboard.down('w'); await page.waitForFunction(() => v.inHome); await page.keyboard.up('w'); await page.waitForTimeout(800);
    const stove = await page.evaluate(() => { const p = v.home.data.furniture.find((f) => f.kind === 'woodStove'); const img = v.homeView.objects.find((o) => o.getData('homeFurnitureId') === p.id); return { x: p.x, y: p.y, key: img.texture.key, w: Math.round(img.displayWidth), h: Math.round(img.displayHeight) }; });
    console.log('· fogão na casa:', JSON.stringify(stove));
    assert.equal(stove.key, 'home-furniture-woodStove'); assert.equal(stove.w, 64);
    // Em frente ao fogão: a dica muda e E abre o caderno.
    await page.evaluate(({ x, y }) => { v.player.x = (x + 1) * 32; v.player.y = (y + 1) * 32 + 14; v.player.facing = { x: 0, y: -1 }; }, stove);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Fogão a lenha · E abre o caderno de receitas')), true);
    await page.screenshot({ path: `${out}/casa-fogao.png` });
    await page.keyboard.press('e'); await page.waitForSelector('.cookbook-card');
    const cards = await page.evaluate(() => [...document.querySelectorAll('.cookbook-recipe h3')].map((h) => h.textContent));
    console.log('· caderno:', JSON.stringify(cards)); assert.deepEqual(cards, ['Omelete de couve', 'Salada da horta']);
    await page.screenshot({ path: `${out}/caderno.png` });
    // Salada: falta cenoura. Omelete: tudo na mochila.
    assert.equal(await page.locator('[data-cook="gardenSalad"]').isDisabled(), true);
    await page.locator('[data-cook="kaleOmelette"]').click(); await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ status: document.querySelector('.cookbook-status').textContent, inv: { egg: v.inventory.data.egg, kale: v.inventory.data.kale, wood: v.inventory.data.wood, dish: v.inventory.data.kaleOmelette } }));
    console.log('· cozinhou:', JSON.stringify(after)); assert.deepEqual(after.inv, { egg: 0, kale: 0, wood: 1, dish: 1 }); assert.match(after.status, /Omelete de couve pronto/);
    await page.screenshot({ path: `${out}/caderno-cozinhou.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const saved = await page.evaluate(async () => { const { loadSave } = await import('/src/systems/save.ts'); return loadSave()?.inventory.kaleOmelette; });
    assert.equal(saved, 1); console.log('· prato salvo no save');
    await page.evaluate(() => v.useVillageItem('kaleOmelette')); await page.waitForTimeout(300);
    const vigor = await page.evaluate(() => v.state.villageProgress.vigor);
    assert.equal(vigor, 60); console.log('· comeu: vigor 20 → 60');
    assert.deepEqual(errors, []); console.log('QA da cozinha: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
