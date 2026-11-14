// Conferência de ponta a ponta da cadeia que leva à cesta do cavalo: dia 1 na Primavera,
// compra de sementes na loja real da Rosa, plantio, rega diária, colheita na Primavera,
// guarda até o Verão, milho no Verão e cesta no serviço real da Helena.
// Servidor Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-cadeia-cesta';
fs.mkdirSync(out, { recursive: true });
const log = (...a) => console.log('·', ...a);

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Cadeia QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    const hud = () => page.evaluate(() => `${document.querySelector('#hud-day').textContent} · ${document.querySelector('#hud-year').textContent}`);
    assert.equal(await hud(), 'Primavera 1 · Ano 1');
    log('dia 1:', await hud());

    // 1. Sementes na loja real da Rosa.
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const v = game.scene.getScene('Vale'); v.state.damiaoIntroduction = true; v.state.time = 600; v.state.villageEconomy.coins = 300; v.enterVillage();
    });
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'village');
    await page.evaluate(async () => { window.vila = game.scene.getScene('Vila'); const { VILLAGE_NPCS } = await import('/src/data/village.ts'); vila.setMerchantRoom('rosa'); vila.shop.open(VILLAGE_NPCS.find((n) => n.id === 'rosa')); });
    const rosaTabs = await page.evaluate(() => [...document.querySelectorAll('[data-village-tab]')].map((b) => b.dataset.villageTab).join(',') + ' · ' + (document.querySelector('.village-panel')?.innerText ?? '').slice(0, 160).replace(/\n/g, ' | '));
    log('abas da Rosa:', rosaTabs);
    await page.locator('[data-village-tab="buy"]').click({ timeout: 10000 });
    const bought = {};
    for (const seed of ['carrotSeeds', 'strawberrySeeds', 'cornSeeds']) {
      await page.locator(`[data-trade-item="${seed}"]`).click();
      await page.locator('[data-trade-action="buy"]').click();
      await page.waitForTimeout(150);
      bought[seed] = await page.evaluate((s) => vila.inventory.data[s], seed);
    }
    await page.screenshot({ path: `${out}/1-rosa-sementes.png` });
    assert.deepEqual(bought, { carrotSeeds: 1, strawberrySeeds: 1, cornSeeds: 1 });
    const sellsHarvest = await page.evaluate(() => ['carrot', 'strawberry', 'corn'].some((i) => document.querySelector(`[data-trade-item="${i}"]`)));
    assert.equal(sellsHarvest, false);
    log('Rosa vendeu as sementes e não vende colheitas:', JSON.stringify(bought));
    await page.locator('[data-village-close]').first().click();
    await page.evaluate(() => { vila.setMerchantRoom(); Object.assign(vila.state.inventory, vila.inventory.data); vila.leave(); });
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'property');

    // 2. Plantio na Primavera: cenoura e morango aceitos, milho recusado sem gastar semente.
    const spring = await page.evaluate(() => {
      window.v = game.scene.getScene('Vale'); v.inventory.data.hoe = Math.max(1, v.inventory.data.hoe);
      const ground = { area: 'property', terrainAt: () => 'grass', occupied: () => false, reserved: () => false };
      for (const x of [21, 22, 23]) { const p = v.farming.prepare(x, 20, v.inventory, ground); if (!p.ok && !p.message.includes('preparada')) throw Error(p.message); }
      const day = v.state.day;
      return { carrot: v.farming.plant(21, 20, v.inventory, day, 'carrot').ok, strawberry: v.farming.plant(22, 20, v.inventory, day, 'strawberry').ok, corn: v.farming.plant(23, 20, v.inventory, day, 'corn'), cornSeeds: v.inventory.data.cornSeeds };
    });
    assert.equal(spring.carrot, true); assert.equal(spring.strawberry, true); assert.equal(spring.corn.ok, false); assert.equal(spring.cornSeeds, 1);
    log('Primavera: cenoura e morango plantados; milho recusado:', spring.corn.message);

    // 3. Rega diária até colher (cada noite avança um dia, como dormir).
    const waterDay = () => page.evaluate(() => { for (const c of v.farming.crops) v.farming.water(c.x, c.y); v.state.day += 1; });
    const settle = () => page.waitForTimeout(250);
    const harvested = {};
    for (let i = 0; i < 9; i++) {
      await waterDay(); await settle();
      const r = await page.evaluate(() => { const got = {}; for (const c of [...v.farming.crops]) if (c.growth >= 1) { const id = c.crop, before = v.inventory.data[id]; if (v.farming.harvest(c.x, c.y, v.inventory).ok) got[id] = (got[id] ?? 0) + v.inventory.data[id] - before; } return { day: v.state.day, got }; });
      for (const [id, n] of Object.entries(r.got)) { harvested[id] = (harvested[id] ?? 0) + n; log(`dia ${r.day}: colheu ${n} ${id}`); }
      if (r.day === 5) await page.screenshot({ path: `${out}/2-primavera-crescendo.png` });
    }
    assert.ok(harvested.carrot >= 1 && harvested.strawberry >= 1, JSON.stringify(harvested));

    // 4. Virada para o Verão: o morango (rebrota) murcha; a colheita guardada continua na mochila.
    await page.evaluate(() => { v.state.day = 29; });
    await settle();
    const summer = await page.evaluate(() => ({ hud: `${document.querySelector('#hud-day').textContent}`, strawberryPlant: !!v.farming.cropAt(22, 20), carrot: v.inventory.data.carrot, strawberry: v.inventory.data.strawberry }));
    assert.equal(summer.hud, 'Verão 1'); assert.equal(summer.strawberryPlant, false); assert.ok(summer.carrot >= 1 && summer.strawberry >= 1);
    log('Verão 1: morango de Primavera murchou; guardados na mochila:', `cenoura ${summer.carrot}, morango ${summer.strawberry}`);

    // 5. Milho no Verão: 8 dias regados.
    const cornPlanted = await page.evaluate(() => v.farming.plant(23, 20, v.inventory, v.state.day, 'corn').ok);
    assert.equal(cornPlanted, true);
    for (let i = 0; i < 8; i++) { await waterDay(); await settle(); }
    const corn = await page.evaluate(() => { const before = v.inventory.data.corn, r = v.farming.harvest(23, 20, v.inventory); return { ok: r.ok, got: v.inventory.data.corn - before, day: v.state.day, regrows: !!v.farming.cropAt(23, 20) }; });
    assert.equal(corn.ok, true); assert.ok(corn.got >= 1);
    await page.screenshot({ path: `${out}/3-verao-milho.png` });
    log(`dia ${corn.day} (Verão ${corn.day - 28}): colheu ${corn.got} milho; o pé fica para rebrotar: ${corn.regrows}`);

    // 6. Cesta no serviço real da Helena.
    await page.evaluate(() => { v.persist(); v.enterVillage(); });
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'village');
    await page.evaluate(async () => { window.vila = game.scene.getScene('Vila'); const { VILLAGE_NPCS } = await import('/src/data/village.ts'); vila.shop.open(VILLAGE_NPCS.find((n) => n.id === 'helena')); });
    await page.locator('[data-village-tab="services"]').click();
    const before = await page.evaluate(() => ({ carrot: vila.inventory.data.carrot, strawberry: vila.inventory.data.strawberry, corn: vila.inventory.data.corn, coins: vila.state.villageEconomy.coins }));
    const order = page.locator('[data-village-service="create-harvest-basket"]'); await order.scrollIntoViewIfNeeded(); await order.click();
    const after = await page.evaluate(() => ({ basket: vila.inventory.data.harvestBasket, carrot: vila.inventory.data.carrot, strawberry: vila.inventory.data.strawberry, corn: vila.inventory.data.corn, coins: vila.state.villageEconomy.coins }));
    await page.screenshot({ path: `${out}/4-helena-cesta.png` });
    assert.deepEqual(after, { basket: 1, carrot: before.carrot - 1, strawberry: before.strawberry - 1, corn: before.corn - 1, coins: before.coins - 20 });
    log('Helena preparou 1 cesta: -1 cenoura, -1 morango, -1 milho, -20 C');

    // 7. Próximo passo da doma: deixar a cesta no cocho dos Campos Abertos.
    const fieldsHaveTrough = await page.evaluate(async () => { const d = await import('/src/data/open-fields.ts'); return Object.keys(d).filter((k) => /TROUGH|COCHO/i.test(k)); });
    log('cocho nos Campos Abertos:', fieldsHaveTrough.length ? fieldsHaveTrough.join(', ') : 'NÃO EXISTE (etapa 5 não implementada)');
    assert.deepEqual(errors, []);
    console.log('QA da cadeia até a cesta: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
