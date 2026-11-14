// Conferência antes da preview.35 (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional): composteira,
// barril de conservas, prensa de cera e mel de flor na Propriedade, pelo E e pela mochila.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-conservas';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Conservas QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.v = game.scene.getScene('Vale');
      const s = v.snapshotState(); s.time = 9 * 60;
      Object.assign(s.inventory, { composter: 1, preserveKeg: 1, waxPress: 1, beehive: 1, manure: 2, fiber: 3, strawberry: 3, honey: 1, beeswax: 2 });
      v.loadState(s);
    });
    await page.waitForTimeout(800);
    // Instala cada máquina num ponto livre, olhando para cima, e carrega com o item na mochila.
    const place = (kind, x, y) => page.evaluate(async ({ kind, x, y }) => { v.player.x = x * 32 + 16; v.player.y = y * 32 + 16; v.player.facing = { x: 0, y: -1 }; v.nextInteractionAt = 0; await v.useVillageItem(kind); return v.snapshotState().machines?.items.find((m) => m.kind === kind); }, { kind, x, y });
    const load = (item) => page.evaluate(async (item) => { v.nextInteractionAt = 0; await v.useVillageItem(item); }, item);
    const job = (kind) => page.evaluate((kind) => v.snapshotState().machines.items.find((m) => m.kind === kind)?.job?.recipe, kind);
    const spots = [[28, 24], [32, 24], [36, 24]];
    assert.ok(await place('composter', ...spots[0])); await load('manure'); assert.equal(await job('composter'), 'compost-fiber'); console.log('· composteira: 2 estercos + 3 fibras');
    assert.ok(await place('preserveKeg', ...spots[1])); await load('strawberry'); assert.equal(await job('preserveKeg'), 'strawberryJam'); console.log('· barril: 3 morangos + 1 mel');
    assert.ok(await place('waxPress', ...spots[2])); await load('beeswax'); assert.equal(await job('waxPress'), 'candle'); console.log('· prensa: 2 ceras');
    await page.evaluate(() => { v.player.x = 32 * 32; v.player.y = 25.6 * 32; }); await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/maquinas-trabalhando.png` });
    // Três dias depois, tudo pronto: recolhe com E perto de cada máquina.
    await page.evaluate(() => { v.state.day += 3; }); await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/maquinas-prontas.png` });
    for (const [x, y] of spots) { await page.evaluate(({ x, y }) => { v.player.x = x * 32 + 16; v.player.y = y * 32 + 16; v.player.facing = { x: 0, y: -1 }; v.nextInteractionAt = 0; }, { x, y }); await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(400); }
    const got = await page.evaluate(() => ({ fertilizer: v.inventory.data.fertilizer, strawberryJam: v.inventory.data.strawberryJam, candle: v.inventory.data.candle }));
    console.log('· recolhido:', JSON.stringify(got)); assert.deepEqual(got, { fertilizer: 2, strawberryJam: 1, candle: 1 });
    // Mel de flor: colmeia com margaridas maduras ao lado.
    let hive, hx, hy; for (const [x, y] of [[40, 24], [30, 27], [34, 27], [26, 27], [44, 24]]) { hive = await place('beehive', x, y); if (hive) { hx = x; hy = y; break; } }
    assert.ok(hive, 'sem lugar para a colmeia');
    await page.evaluate(async ({ hx, hy }) => { const { CROPS } = await import('/src/data/crops.ts'); const s = v.snapshotState(); const spots = [[hx - 2, hy - 1], [hx + 2, hy - 1]]; s.preparedSoil = [...(s.preparedSoil ?? []), ...spots.map(([x, y]) => ({ x, y }))]; s.crops.push(...spots.map(([x, y]) => ({ x, y, growth: 1, watered: false, crop: 'daisy', days: CROPS.daisy.days, day: s.day }))); v.loadState(s); }, { hx, hy });
    await page.waitForTimeout(500);
    await page.evaluate(({ hx, hy }) => { v.state.day += 5; v.player.x = hx * 32 + 16; v.player.y = hy * 32 + 16; v.player.facing = { x: 0, y: -1 }; v.nextInteractionAt = 0; }, { hx, hy }); await page.waitForTimeout(500);
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => v.inventory.data.daisyHoney), 1); console.log('· mel de margarida recolhido');
    assert.deepEqual(errors, []); console.log('QA de conservas, composteira e mel de flor: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
