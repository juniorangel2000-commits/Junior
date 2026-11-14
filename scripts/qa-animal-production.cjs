// Conferência de ovos e leite (Vite em 127.0.0.1:5190): abastecer o cocho, virar a manhã,
// recolher o ovo no ninho e ordenhar a vaca com o balde, dentro do galinheiro e do curral.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-producao';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Produção QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    // Fazenda pronta: galinheiro (id 1) e curral (id 2), com palha e balde na mochila.
    const enter = async (siteId) => {
      await page.evaluate(async (siteId) => {
        window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game; window.v = game.scene.getScene('Vale');
        const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts');
        const { farmDoorPoint } = await import('/src/systems/farm-interior.ts');
        const s = v.snapshotState();
        if (!s.farmConstruction) {
          s.time = 20 * 60; s.recruitedAnimals = ['forest-chicken-1', 'forest-chicken-2', 'forest-cow-1'];
          const site = (id, kind, x, animals) => ({ id, kind, x, y: 30, delivered: { ...FARM_BUILDINGS[kind].cost }, finished: true, animals, hay: 0, gateOpen: true, animalsOverride: { inside: true, until: 999999 } });
          s.farmConstruction = { version: 1, nextId: 3, sites: [site(1, 'coop', 30, ['forest-chicken-1', 'forest-chicken-2']), site(2, 'barn', 40, ['forest-cow-1'])] };
          s.animalPositions = { forest: [], property: [] }; s.inventory.hay = 20; s.inventory.milkPail = 1;
        }
        const door = farmDoorPoint(s.farmConstruction.sites[siteId - 1]); s.player = { x: door.x, y: door.y + 6, direction: 'up' }; v.loadState(s);
        // O carregamento não pode tratar a vaca recolhida como obstáculo e afastar o jogador.
        if (Math.hypot(v.player.x - door.x, v.player.y - door.y) > 30) throw new Error('Jogador deslocado para fora do alcance da porta ao carregar');
      }, siteId);
      await page.waitForTimeout(800); await page.keyboard.press('e');
      await page.waitForFunction(() => game.scene.isActive('Interior')); await page.waitForTimeout(1200);
    };
    const near = (kind) => page.evaluate((kind) => { const i = game.scene.getScene('Interior'), f = i.layout.fixtures.find((f) => f.kind === kind); i.player.x = f.x + f.w / 2; i.player.y = f.y + f.h + 12; }, kind);
    const morning = () => page.evaluate(() => { const i = game.scene.getScene('Interior'); i.state.day += 1; i.state.time = 6 * 60 + 1; });
    const inv = (id) => page.evaluate((id) => game.scene.getScene('Interior').state.inventory[id], id);

    await enter(1);
    await near('trough'); await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').site.trough), 12); console.log('· cocho do galinheiro com 12 palhas');
    await morning(); await page.waitForTimeout(600);
    const eggs = await page.evaluate(() => { const i = game.scene.getScene('Interior'); return { eggs: i.site.eggs, tex: i.view.fixtures.get('nest-1').texture.key }; });
    assert.deepEqual(eggs.eggs, [0, 1]); assert.equal(eggs.tex, 'interior-nest-egg'); console.log('· de manhã: 2 ovos nos ninhos');
    await page.screenshot({ path: `${out}/galinheiro-ovos.png` });
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), n = i.layout.fixtures.find((f) => f.id === 'nest-1'); i.player.x = n.x - 18; i.player.y = n.y + 16; });
    await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await inv('egg'), 1); console.log('· ovo recolhido para a mochila');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), p = i.layout; i.player.x = (p.doorX + 1) * 32; i.player.y = (p.height - 1.6) * 32; });
    await page.keyboard.down('s'); await page.waitForFunction(() => !game.scene.isActive('Interior') && game.scene.isActive('Vale')); await page.keyboard.up('s');
    await page.waitForTimeout(800);

    await enter(2);
    await near('trough'); await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => game.scene.getScene('Interior').site.trough), 8); console.log('· cocho do curral com 8 palhas');
    await morning(); await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => !!game.scene.getScene('Interior').animals[0].badge), true); console.log('· de manhã: vaca com leite');
    await page.evaluate(() => { const i = game.scene.getScene('Interior'), a = i.animals[0].brain; i.player.x = a.x - 30; i.player.y = a.y + 4; });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.body.innerText.includes('ordenha com o balde')), true);
    await page.keyboard.press('e'); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/curral-ordenha.png` });
    await page.waitForTimeout(1200);
    assert.equal(await inv('milk'), 1); console.log('· vaca ordenhada: 1 leite');
    assert.deepEqual(errors, []); console.log('QA de ovos e leite: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
