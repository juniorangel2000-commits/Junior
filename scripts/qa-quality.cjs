// Conferência da qualidade (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): galinha amiga bota
// ovo excelente, carinho no interior, estrela na mochila e queijo que herda a qualidade do leite.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-qualidade';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Qualidade QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts');
      const { farmPlacementReason } = await import('/src/systems/farm-construction.ts');
      const s = v.snapshotState(); s.time = 20 * 60; s.recruitedAnimals = ['forest-chicken-1'];
      let spot; for (let r = 0; r < 20 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) { const x = 30 + dx, y = 22 + dy; if (!farmPlacementReason(s, 'coop', x, y, (a, b) => v.farmPlacementTileReason(a, b))) spot = { x, y }; }
      s.farmConstruction = { version: 1, nextId: 2, sites: [{ id: 1, kind: 'coop', x: spot.x, y: spot.y, delivered: { ...FARM_BUILDINGS.coop.cost }, finished: true, animals: ['forest-chicken-1'], hay: 0, gateOpen: true, trough: 12 }] };
      s.animalCare = { day: s.day, animals: { 'forest-chicken-1': { bond: 24 } } };
      s.animalPositions = { forest: [], property: [] }; Object.assign(s.inventory, { cheesePress: 1, milk: 1 });
      s.itemQuality = { milk: { good: 0, excellent: 1, seen: 1 } };
      const { farmDoorPoint } = await import('/src/systems/farm-interior.ts'); const d = farmDoorPoint(s.farmConstruction.sites[0]);
      s.player = { x: d.x, y: d.y + 6, direction: 'up' }; v.loadState(s);
    });
    await page.waitForTimeout(1200); await page.keyboard.press('e');
    await page.waitForFunction(() => game.scene.isActive('Interior')); await page.waitForTimeout(1500);
    // Carinho na galinha: amizade 24 → 25 (excelente).
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), a = i.animals[0]; a.brain.x = 200; a.brain.y = 200; i.player.x = 216; i.player.y = 200; });
    await page.waitForTimeout(400);
    const prompt = await page.evaluate(() => document.querySelector('#ui')?.innerText ?? '');
    assert.match(prompt, /E carinho · amizade 24\/30 · produz bom/); console.log('· dica: E carinho · amizade 24/30');
    await page.keyboard.press('e'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/carinho.png` });
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').state.animalCare.animals['forest-chicken-1'].bond), 25); console.log('· carinho: amizade 25');
    // Na manhã seguinte o ovo sai excelente.
    await page.evaluate(() => { const i = game.scene.getScene('Interior'); i.state.day += 1; i.state.time = 6 * 60 + 1; }); await page.waitForTimeout(800);
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), f = i.layout.fixtures.find((f) => f.id === 'nest-1'); if (i.animals[0]) { i.animals[0].brain.x = 40; i.animals[0].brain.y = 300; } i.player.x = f.x - 18; i.player.y = f.y + 16; });
    await page.waitForTimeout(400); await page.keyboard.press('e'); await page.waitForTimeout(400);
    const q = await page.evaluate(() => game.scene.getScene('Interior').state.itemQuality);
    console.log('· registro:', JSON.stringify(q)); assert.equal(q.egg.excellent, 1);
    await page.keyboard.press('i'); await page.waitForTimeout(400);
    await page.locator('[data-bag-item="item:egg"]').click(); await page.waitForTimeout(200);
    const detail = await page.locator('.backpack-detail').innerText(); console.log('· mochila:', detail.replace(/\s+/g, ' ').slice(0, 120));
    assert.match(detail, /Qualidade: 1 excelente/); assert.equal(await page.locator('[data-bag-item="item:egg"] .slot-quality-excellent').count(), 1);
    await page.screenshot({ path: `${out}/mochila-ovo-excelente.png` });
    await page.keyboard.press('i'); await page.waitForTimeout(300);
    // Sai para a Propriedade: o registro vai junto e a queijeira faz queijo excelente.
    await page.evaluate(() => { const i = game.scene.getScene('Interior'); i.player.x = (i.layout.doorX + 1) * 32; i.player.y = (i.layout.height - 1.6) * 32; });
    await page.keyboard.down('s'); await page.waitForFunction(() => !game.scene.isActive('Interior') && game.scene.isActive('Vale')); await page.keyboard.up('s');
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => v.snapshotState().itemQuality?.egg?.excellent), 1); console.log('· ovo excelente continua na Propriedade');
    const spots = [[28, 24], [32, 26], [36, 24], [26, 28]]; let placed = false;
    for (const [x, y] of spots) { placed = await page.evaluate(async ({ x, y }) => { v.player.x = x * 32 + 16; v.player.y = y * 32 + 16; v.player.facing = { x: 0, y: -1 }; v.nextInteractionAt = 0; await v.useVillageItem('cheesePress'); return !!v.snapshotState().machines?.items.length; }, { x, y }); if (placed) break; }
    assert.ok(placed, 'sem lugar para a queijeira');
    await page.evaluate(async () => { v.nextInteractionAt = 0; await v.useVillageItem('milk'); });
    assert.equal(await page.evaluate(() => v.snapshotState().machines.items[0].job?.quality), 2); console.log('· queijeira carregada com leite excelente');
    await page.evaluate(() => { v.state.day += 1; }); await page.waitForTimeout(600);
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    const cheese = await page.evaluate(() => v.snapshotState().itemQuality?.cheese); console.log('· queijo:', JSON.stringify(cheese)); assert.equal(cheese?.excellent, 1);
    const saved = await page.evaluate(() => { const k = Object.keys(localStorage).find((k) => !/backup|recent|preserved/.test(k) && localStorage.getItem(k).includes('"cheese":{"good"')); return k && JSON.parse(localStorage.getItem(k)).itemQuality; });
    console.log('· save:', JSON.stringify(saved)); assert.equal(saved?.cheese?.excellent, 1);
    assert.deepEqual(errors, []); console.log('QA da qualidade: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
