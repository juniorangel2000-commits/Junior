// Conferência no navegador: ipês, corte com machadinha de ferro, toco e madeira nobre.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/cenarios/ipes-campos-abertos/qa';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Ipê QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => {document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area === 'property';});
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const v = game.scene.getScene('Vale');
      const eco = await import('/src/systems/economy.ts');
      const tools = await import('/src/systems/tool-instances.ts');
      v.inventory.data.hatchet = 1; tools.syncToolInstances(v.inventory.data); v.state.inventory = v.inventory.data;
      eco.configureTool(v.state, 'hatchet', 0);
      v.state.time = 720; v.player.x = 816; v.player.y = 2190; v.snapshotState();
    });
    await page.keyboard.down('s');
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields');
    await page.keyboard.up('s');
    await page.evaluate(async () => {
      window.s = game.scene.getScene('Campos');
      window.d = await import('/src/data/open-fields.ts');
      const ipe = d.FIELDS_IPES[0]; s.player.x = ipe.x; s.player.y = ipe.y + 44; s.state.time = 720;s.cameras.main.stopFollow().setZoom(1.4).centerOn(ipe.x,ipe.y-110);
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/ipe-de-pe.png` });

    // Machadinha de pedra: recusa sem golpe.
    await page.keyboard.press('e');
    await page.waitForTimeout(400);
    const stone = await page.evaluate(() => s.state.openFields?.hits?.['ipe-0'] ?? 0);
    assert.equal(stone, 0);
    const prompt = await page.evaluate(() => document.body.innerText.includes('machadinha de pedra') || document.body.innerText.includes('ferro'));
    assert.equal(prompt, true);
    console.log('pedra recusada');

    // Machadinha de ferro: seis golpes derrubam o ipê.
    await page.evaluate(async () => { const eco = await import('/src/systems/economy.ts'); eco.configureTool(s.state, 'hatchet', 1); s.updateHUD(); });
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('e');
      await page.waitForFunction(()=>s.swing?.hit||s.state.openFields?.felled?.['ipe-0']!==undefined);
      if(i===2)await page.screenshot({path:`${out}/ipe-golpe.png`});
      await page.waitForFunction(()=>!s.swing);
    }
    const after = await page.evaluate(() => ({ felled: s.state.openFields?.felled?.['ipe-0'], hits: s.state.openFields?.hits, drops: (s.state.groundItems?.items??[]).filter((i) => i.space === 'openFields').map((i) => [i.item, i.amount]), hardwood: s.state.inventory.hardwood, branch: s.state.inventory.branch }));
    console.log(JSON.stringify(after));
    assert.equal(after.felled, 1);
    const has = (id) => after[id] + after.drops.filter(([i]) => i === id).reduce((n, [, a]) => n + a, 0);
    assert.equal(has('hardwood'), 1);
    assert.equal(has('branch') >= 2, true);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/ipe-toco.png` });

    // Recolhe a madeira nobre e mostra na mochila.
    await page.evaluate(async () => { const g = await import('/src/systems/ground-items.ts'); const p = s.state.groundItems.items.find((i) => i.item === 'hardwood'); if (p) { s.player.x = p.x; s.player.y = p.y + 6; g.collectGroundItems(s.getGroundItemRuntime()); } });
    assert.equal(await page.evaluate(() => s.state.inventory.hardwood), 1);
    await page.evaluate(() => s.ui.toggleInventory(s.state.inventory));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/mochila-madeira-nobre.png` });
    assert.equal(await page.locator('[data-bag-item="item:hardwood"]').count(), 1);
    await page.evaluate(() => s.ui.closeModal());

    // Mapa completo com os ipês.
    const url = await page.evaluate(() => s.captureMap());
    fs.writeFileSync(`${out}/mapa-campos-ipes.png`, Buffer.from(url.split(',')[1], 'base64'));

    // Salvar e continuar mantém o toco.
    await page.evaluate(() => s.mainMenu());
    await page.locator('#continue-game').click();
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields');
    assert.equal(await page.evaluate(() => game.scene.getScene('Campos').state.openFields.felled['ipe-0']), 1);
    console.log('recarregado com o toco');
    assert.deepEqual(errors, []);
    console.log('QA OK');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
