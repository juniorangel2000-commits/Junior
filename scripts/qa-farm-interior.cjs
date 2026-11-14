// Conferência do interior do galinheiro: entrar pela porta à noite, ver os animais,
// sair pela porta e conferir que a galinha não aparece no cercado (Vite em 127.0.0.1:5190).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-interiores';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Galinheiro QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game; window.v = game.scene.getScene('Vale');
      const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts');
      const { farmDoorPoint } = await import('/src/systems/farm-interior.ts');
      const s = v.snapshotState(); s.time = 20 * 60; s.recruitedAnimals = ['forest-chicken-1'];
      s.farmConstruction = { version: 1, nextId: 2, sites: [{ id: 1, kind: 'coop', x: 30, y: 30, delivered: { ...FARM_BUILDINGS.coop.cost }, finished: true, animals: ['forest-chicken-1'], hay: 0, gateOpen: true }] };
      const door = farmDoorPoint(s.farmConstruction.sites[0]); s.animalPositions = { forest: [], property: [{ id: 'forest-chicken-1', x: door.x, y: door.y + 20, direction: 'down' }] };
      s.player = { x: door.x, y: door.y + 6, direction: 'up' }; v.loadState(s);
    });
    await page.waitForTimeout(800);
    const hidden = await page.evaluate(() => { const a = v.animals.animals.find((x) => x.id === 'forest-chicken-1'); return a ? a.sprite.visible : 'sem galinha'; });
    assert.equal(hidden, false); console.log('· à noite a galinha não aparece no cercado');
    const prompt = await page.evaluate(() => document.body.innerText.includes('Entrar no galinheiro'));
    assert.equal(prompt, true);
    await page.keyboard.press('e');
    await page.waitForFunction(() => game.scene.isActive('Interior'));
    await page.waitForTimeout(1500);
    const inside = await page.evaluate(() => { const i = game.scene.getScene('Interior'); return { animals: i.animals.length, location: document.body.innerText.includes('Galinheiro') }; });
    assert.equal(inside.animals, 1); assert.equal(inside.location, true);
    await page.screenshot({ path: `${out}/galinheiro-noite.png` });
    console.log('· dentro do galinheiro: 1 galinha');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'); const n = i.layout.fixtures.find((f) => f.kind === 'nest'); i.player.x = n.x - 18; i.player.y = n.y + 16; });
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Ninho')), true);
    console.log('· ninho identificado ao chegar perto');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), p = i.layout; i.player.x = (p.doorX + 1) * 32; i.player.y = (p.height - 1.6) * 32; });
    await page.keyboard.down('s'); await page.waitForFunction(() => !game.scene.isActive('Interior') && game.scene.isActive('Vale')); await page.keyboard.up('s');
    await page.waitForTimeout(800);
    const back = await page.evaluate(() => ({ area: document.querySelector('#ui')?.dataset.area, y: Math.round(game.scene.getScene('Vale').player.y) }));
    assert.equal(back.area, 'property'); console.log('· saiu pela porta e voltou à Propriedade');
    assert.deepEqual(errors, []); console.log('QA do interior: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
