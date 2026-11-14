// Conferência das abelhas (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): colmeia povoada
// na Propriedade (mel em 4 dias) e colmeia vazia junto a um ipê dos Campos (enxame e coleta).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-abelhas';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Abelhas QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const s = v.snapshotState(); s.time = 9 * 60; Object.assign(s.inventory, { beehive: 1, emptyHive: 1 });
      v.loadState(s); v.player.x = 30.5 * 32; v.player.y = 24.5 * 32; v.player.facing = { x: 0, y: -1 };
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => { v.nextInteractionAt = 0; return v.useVillageItem('beehive'); }); await page.waitForTimeout(600);
    const hive = await page.evaluate(() => { const m = v.snapshotState().machines.items[0]; return { kind: m.kind, job: !!m.job }; });
    console.log('· colmeia instalada:', JSON.stringify(hive)); assert.deepEqual(hive, { kind: 'beehive', job: true });
    await page.evaluate(() => { v.player.y += 20; }); await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/colmeia-trabalhando.png` });
    // Quatro dias depois: o balão do mel e E recolhe.
    await page.evaluate(() => { v.state.day += 4; v.player.y -= 20; v.nextInteractionAt = 0; }); await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/colmeia-mel-pronto.png` });
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => v.inventory.data.honey), 1); console.log('· 1 mel recolhido');
    // Campos Abertos: colmeia vazia junto ao primeiro ipê.
    await page.evaluate(() => { v.player.x = 816; v.player.y = 2190; v.snapshotState(); });
    await page.keyboard.down('s'); await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields'); await page.keyboard.up('s');
    await page.evaluate(async () => { window.f = game.scene.getScene('Campos'); const { FIELDS_IPES } = await import('/src/data/open-fields.ts'); const i = FIELDS_IPES[0]; f.player.x = i.x + 10; f.player.y = i.y + 20; f.player.facing = { x: 1, y: 0 }; });
    await page.waitForTimeout(600);
    await page.evaluate(() => f.useVillageItem('emptyHive')); await page.waitForTimeout(600);
    const trap = await page.evaluate(() => f.state.beekeeping?.traps[0]);
    console.log('· colmeia no ipê:', JSON.stringify(trap)); assert.ok(trap);
    await page.screenshot({ path: `${out}/colmeia-no-ipe.png` });
    // Dia do enxame: a arte muda e E recolhe a colmeia povoada.
    await page.evaluate(async () => { const { swarmDay } = await import('/src/systems/beekeeping.ts'); const t = f.state.beekeeping.traps[0]; f.state.day = swarmDay(t, t.day + 3000); f.player.x = t.x - 20; f.player.y = t.y + 6; });
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Colmeia com enxame')), true);
    await page.screenshot({ path: `${out}/colmeia-com-enxame.png` });
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => f.state.inventory.beehive), 1); console.log('· colmeia povoada recolhida');
    assert.deepEqual(errors, []); console.log('QA das abelhas: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
