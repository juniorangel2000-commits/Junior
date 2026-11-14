// Conferência dos patos (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): o pato dentro do
// galinheiro, o ninho com ovo de pato e a coleta pelo E.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-patos';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Patos QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts'); const { farmDoorPoint } = await import('/src/systems/farm-interior.ts');
      const s = v.snapshotState(); s.time = 20 * 60; s.recruitedAnimals = ['farm-duck-1', 'forest-chicken-1'];
      s.farmConstruction = { version: 1, nextId: 2, sites: [{ id: 1, kind: 'coop', x: 30, y: 30, delivered: { ...FARM_BUILDINGS.coop.cost }, finished: true, animals: ['farm-duck-1', 'forest-chicken-1'], hay: 0, gateOpen: true, duckEggs: [0], eggs: [1] }] };
      s.animalPositions = { forest: [], property: [] };
      const door = farmDoorPoint(s.farmConstruction.sites[0]); s.player = { x: door.x, y: door.y + 6, direction: 'up' }; v.loadState(s);
    });
    await page.waitForTimeout(800); await page.keyboard.press('e');
    await page.waitForFunction(() => game.scene.isActive('Interior')); await page.waitForTimeout(1500);
    const inside = await page.evaluate(() => { const i = game.scene.getScene('Interior'); return { kinds: i.animals.map((a) => a.brain.kind), nest: i.view.fixtures.get('nest-1').texture.key }; });
    console.log('· dentro do galinheiro:', JSON.stringify(inside)); assert.ok(inside.kinds.includes('duck')); assert.equal(inside.nest, 'interior-nest-duck-egg');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), n = i.layout.fixtures.find((f) => f.id === 'nest-1'); i.player.x = n.x - 18; i.player.y = n.y + 16; });
    await page.waitForTimeout(400); await page.screenshot({ path: `${out}/galinheiro-pato.png` });
    assert.equal(await page.evaluate(() => document.body.innerText.includes('E recolhe o ovo de pato')), true);
    await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').state.inventory.duckEgg), 1); console.log('· ovo de pato recolhido');
    assert.deepEqual(errors, []); console.log('QA dos patos da criação: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
