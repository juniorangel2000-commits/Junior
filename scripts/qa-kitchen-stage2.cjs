// Conferência da cozinha, etapa 2 (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional):
// forno de barro na Propriedade (fornada pelo caderno, aceso, pronto em meio dia),
// fogueira portátil e efeito do suco de melancia na velocidade.
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
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Forno QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const s = v.snapshotState(); s.time = 9 * 60; s.villageProgress.recipes.push('homemadeBread');
      Object.assign(s.inventory, { clayOven: 1, flour: 2, egg: 1, milk: 1, wood: 5, fish: 1, campfire: 1, watermelonJuice: 1 });
      v.loadState(s); v.player.x = 30.5 * 32; v.player.y = 24.5 * 32; v.player.facing = { x: 0, y: -1 };
    });
    await page.waitForTimeout(800);
    // Instala o forno à frente do jogador.
    await page.evaluate(() => { v.nextInteractionAt = 0; return v.useVillageItem('clayOven'); }); await page.waitForTimeout(400);
    const placed = await page.evaluate(() => v.state.machines?.items.map((m) => ({ kind: m.kind, x: m.x, y: m.y })) ?? v.snapshotState().machines?.items);
    console.log('· forno instalado:', JSON.stringify(placed)); assert.equal(placed?.[0]?.kind, 'clayOven');
    // E no forno vazio abre o caderno na aba do forno.
    await page.evaluate(() => { v.nextInteractionAt = 0; }); await page.keyboard.press('e'); await page.waitForSelector('.cookbook-card');
    const tab = await page.evaluate(() => ({ eyebrow: document.querySelector('.cookbook-card .eyebrow').textContent, cards: [...document.querySelectorAll('.cookbook-recipe h3')].map((h) => h.textContent) }));
    console.log('· caderno do forno:', JSON.stringify(tab)); assert.equal(tab.eyebrow, 'FORNO DE BARRO'); assert.ok(tab.cards.includes('Pão caseiro'));
    await page.screenshot({ path: `${out}/forno-caderno.png` });
    await page.locator('[data-cook="homemadeBread"]').click(); await page.waitForTimeout(800);
    const job = await page.evaluate(() => { const m = v.snapshotState().machines.items[0]; return { recipe: m.job?.recipe, inv: { flour: v.inventory.data.flour, wood: v.inventory.data.wood } }; });
    console.log('· fornada:', JSON.stringify(job)); assert.equal(job.recipe, 'oven-homemadeBread'); assert.deepEqual(job.inv, { flour: 0, wood: 4 });
    await page.evaluate(() => { v.player.y += 20; }); await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/forno-aceso.png` });
    // Meio dia depois, o pão está pronto e E recolhe.
    await page.evaluate(() => { v.state.time += 12 * 60; v.player.y -= 20; v.nextInteractionAt = 0; }); await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/forno-pronto.png` });
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => v.inventory.data.homemadeBread), 1); console.log('· pão caseiro recolhido do forno');
    // Fogueira portátil: abre o caderno da fogueira e assa o peixe.
    await page.evaluate(() => v.ui.callbacks.onUseItem('campfire')); await page.waitForSelector('.cookbook-card');
    assert.equal(await page.evaluate(() => document.querySelector('.cookbook-card .eyebrow').textContent), 'FOGUEIRA PORTÁTIL');
    await page.locator('[data-cook="roastedFish"]').click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/fogueira.png` });
    assert.equal(await page.evaluate(() => v.inventory.data.roastedFish), 1); console.log('· peixe assado na fogueira');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    // Suco de melancia: 15% mais rápido.
    await page.evaluate(() => { v.nextInteractionAt = 0; return v.useVillageItem('watermelonJuice'); }); await page.waitForTimeout(500);
    const speed = await page.evaluate(() => v.player.speedMultiplier);
    console.log('· velocidade com o suco:', speed); assert.ok(Math.abs(speed - 1.15) < 1e-6);
    assert.deepEqual(errors, []); console.log('QA da cozinha, etapa 2: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
