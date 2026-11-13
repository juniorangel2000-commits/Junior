// Conferência no navegador: cultivo por dias regados, texto do canteiro, fases, colheita
// e conversão de um canteiro de save antigo (servidor Vite em 127.0.0.1:5190).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-cultivo-por-dias';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Horta QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'property');
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      window.v = game.scene.getScene('Vale');
      v.state.time = 600;
      v.inventory.data.hoe = Math.max(1, v.inventory.data.hoe); v.inventory.data.seeds = Math.max(2, v.inventory.data.seeds);
      const ground = { area: 'property', terrainAt: () => 'grass', occupied: () => false, reserved: () => false };
      for (const [x, y] of [[21, 20], [22, 21]]) { const p = v.farming.prepare(x, y, v.inventory, ground); if (!p.ok && !p.message.includes('preparada')) throw Error(p.message); }
      v.state.preparedSoil = v.farming.preparedSoil; v.state.restoredFarmSoil = v.farming.restoredFarmSoil;
      const r = v.farming.plant(21, 20, v.inventory, v.state.day);
      if (!r.ok) throw Error(r.message);
      v.player.x = 21 * 32 + 16; v.player.y = 19 * 32 + 20; v.player.facing = { x: 0, y: 1 }; v.updateHUD();
    });
    const prompt = () => page.evaluate(() => document.body.innerText);
    await page.waitForTimeout(600);
    assert.match(await prompt(), /Nabo · faltam 4 dias regados · precisa de água/);
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => { v.farming.water(21, 20); v.updateHUD(); });
      await page.waitForTimeout(250);
      if (i === 0) assert.match(await prompt(), /Nabo · faltam 4 dias regados · regado hoje/);
      await page.evaluate(() => { v.state.day += 1; });
      await page.waitForTimeout(500);
      if (i === 1) await page.screenshot({ path: `${out}/nabo-dia-3.png` });
    }
    await page.evaluate(() => v.updateHUD());
    await page.waitForTimeout(400);
    assert.match(await prompt(), /Colher nabo/);
    await page.screenshot({ path: `${out}/nabo-pronto.png` });
    const crop = await page.evaluate(() => v.farming.cropAt(21, 20));
    assert.deepEqual({ days: crop.days, growth: crop.growth, day: crop.day }, { days: 4, growth: 1, day: 5 });
    const harvested = await page.evaluate(() => { const before = v.inventory.data.turnip; const r = v.farming.harvest(21, 20, v.inventory); return { ok: r.ok, gained: v.inventory.data.turnip - before }; });
    assert.deepEqual(harvested, { ok: true, gained: 1 });
    console.log('ciclo por dias ok');

    // Save antigo: canteiro sem crop/days/day continua válido e é convertido ao carregar.
    await page.evaluate(() => { v.snapshotState?.(); v.persist(); });
    // O jogo grava ao sair da página; a edição do save antigo entra na abertura seguinte.
    const key = await page.evaluate(async () => { const slots = await import('/src/systems/save-slot-keys.ts'); return slots.saveKeys(slots.activeSaveKey()).main; });
    await page.addInitScript((key) => {
      if (sessionStorage.getItem('qa-legacy')) return; sessionStorage.setItem('qa-legacy', '1');
      const s = JSON.parse(localStorage.getItem(key)); s.crops = [{ x: 22, y: 21, growth: 0.7, watered: true }];
      s.restoredFarmSoil = (s.restoredFarmSoil || []).filter((p) => p.x !== 22 || p.y !== 21); localStorage.setItem(key, JSON.stringify(s));
    }, key);
    await page.reload();
    await page.locator('#continue-game').click();
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'property');
    await page.waitForTimeout(800);
    const legacy = await page.evaluate(async () => { const game = (await import(document.querySelector('script[src*="main.ts"]').src)).game; const s = game.scene.getScene('Vale'); return { crop: s.farming.cropAt(22, 21), day: s.state.day }; });
    console.log(JSON.stringify(legacy));
    assert.equal(legacy.crop.crop, 'turnip'); assert.equal(legacy.crop.days, 2); assert.equal(legacy.crop.day, legacy.day); assert.equal(legacy.crop.watered, true);
    console.log('save antigo convertido');
    assert.deepEqual(errors, []);
    console.log('QA OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
