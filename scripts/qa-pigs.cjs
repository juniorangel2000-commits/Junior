// Conferência dos porcos (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): chiqueiro pronto na
// Propriedade, interior com o porco, cocho com sobras, esterco no chão e a composteira.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-porcos';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Porcos QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts');
      const { farmPlacementReason } = await import('/src/systems/farm-construction.ts');
      const s = v.snapshotState(); s.time = 10 * 60; s.recruitedAnimals = ['farm-pig-1'];
      // Primeiro lugar livre perto da casa, pela mesma regra do jogo ao colocar a base.
      let spot; for (let r = 0; r < 20 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) { const x = 30 + dx, y = 22 + dy; if (!farmPlacementReason(s, 'pigsty', x, y, (a, b) => v.farmPlacementTileReason(a, b))) spot = { x, y }; }
      window.spot = spot;
      s.farmConstruction = { version: 1, nextId: 2, sites: [{ id: 1, kind: 'pigsty', x: spot.x, y: spot.y, delivered: { ...FARM_BUILDINGS.pigsty.cost }, finished: true, animals: ['farm-pig-1'], hay: 0, gateOpen: true }] };
      s.animalPositions = { forest: [], property: [] }; Object.assign(s.inventory, { carrot: 3, corn: 3, composter: 1, fiber: 3 });
      s.player = { x: (spot.x + 2.5) * 32, y: (spot.y + 6.5) * 32, direction: 'up' }; v.loadState(s);
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/chiqueiro-propriedade.png` });
    // Interior, à noite, com o porco dentro.
    await page.evaluate(async () => { const { farmDoorPoint } = await import('/src/systems/farm-interior.ts'); const st = v.snapshotState(); st.time = 20 * 60; const d = farmDoorPoint(st.farmConstruction.sites[0]); st.player = { x: d.x, y: d.y + 6, direction: 'up' }; v.loadState(st); });
    await page.waitForTimeout(800); await page.keyboard.press('e');
    await page.waitForFunction(() => game.scene.isActive('Interior')); await page.waitForTimeout(1500);
    const pig = await page.evaluate(() => { const i = game.scene.getScene('Interior'); return i.animals.map((a) => a.brain.kind); });
    console.log('· dentro do chiqueiro:', JSON.stringify(pig)); assert.deepEqual(pig, ['pig']);
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), f = i.layout.fixtures.find((f) => f.kind === 'trough'); i.player.x = f.x + f.w / 2; i.player.y = f.y + f.h + 12; });
    await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').site.trough), 6); console.log('· cocho com 6 sobras');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'); i.state.day += 1; i.state.time = 6 * 60 + 1; }); await page.waitForTimeout(700);
    const manure = await page.evaluate(() => game.scene.getScene('Interior').site.manure);
    console.log('· esterco de manhã:', JSON.stringify(manure)); assert.deepEqual(manure, [0]);
    await page.screenshot({ path: `${out}/chiqueiro-interior.png` });
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), f = i.layout.fixtures.find((f) => f.id === 'manure-1'); i.player.x = f.x + f.w + 10; i.player.y = f.y + 16; });
    await page.waitForTimeout(400); await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').state.inventory.manure), 1); console.log('· esterco recolhido');
    assert.deepEqual(errors, []); console.log('QA dos porcos: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
