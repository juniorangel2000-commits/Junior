// Conferência dos patos da Floresta Antiga (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional):
// nadam no lago, notam o jogador que vem pela terra e, da margem, entram na água ao fugir.
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
    page.setDefaultTimeout(180000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Patos QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => { const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game; window.valley = game.scene.getScene('Vale'); valley.state.time = 600; });
    await page.evaluate(() => { const e = valley.forestGate(); valley.player.x = e.x * 32 + 16; valley.player.y = e.y * 32 + 16; valley.nextInteractionAt = 0; });
    // A porteira da floresta é atravessada a pé: tenta cada direção até a cena abrir.
    for (const key of ['w', 'a', 'd', 's']) {
      await page.keyboard.down(key);
      const ok = await page.waitForFunction(() => game.scene.isActive('Floresta'), null, { timeout: 4000 }).then(() => true, () => false);
      await page.keyboard.up(key); if (ok) break;
      await page.evaluate(() => { const e = valley.forestGate(); valley.player.x = e.x * 32 + 16; valley.player.y = e.y * 32 + 16; });
    }
    await page.waitForFunction(() => game.scene.isActive('Floresta'));
    await page.evaluate(() => { window.forest = game.scene.getScene('Floresta'); });
    await page.waitForTimeout(1000);
    const ducks = await page.evaluate(() => forest.waterfowl.ducks.map((d) => ({ id: d.brain.id, x: Math.round(d.brain.x), y: Math.round(d.brain.y), swimming: d.swimming })));
    console.log('· patos:', JSON.stringify(ducks));
    assert.equal(ducks.length, 2); assert.ok(ducks.every((d) => d.swimming), 'os patos começam na água');
    // Um pato na margem e o jogador em terra, a ~100 px: ele precisa notar e entrar na água.
    const r = await page.evaluate(async () => {
      const w = forest.world, d = forest.waterfowl.ducks[0], b = d.brain;
      let shore, land;
      for (let r = 40; r < 400 && !shore; r += 4) for (let a = 0; a < 32 && !shore; a++) {
        const x = b.x + Math.cos(a / 32 * Math.PI * 2) * r, y = b.y + Math.sin(a / 32 * Math.PI * 2) * r;
        if (w.waterPointAt(x, y) || !b.canStand(x, y)) continue;
        const dx = Math.cos(a / 32 * Math.PI * 2), dy = Math.sin(a / 32 * Math.PI * 2);
        const l = { x: x + dx * 100, y: y + dy * 100 };
        if (w.waterPointAt(l.x, l.y) || !b.canSee({ x, y }, l)) continue;
        shore = { x, y }; land = l;
      }
      if (!shore) return { found: false };
      b.x = shore.x; b.y = shore.y; b.mode = 'idle'; forest.player.x = land.x; forest.player.y = land.y;
      // Passo medido a cada quadro do jogo (o dt de um quadro vai até 0,1 s).
      let entered = false, maxStep = 0, last = { x: b.x, y: b.y };
      const frame = () => { maxStep = Math.max(maxStep, Math.hypot(b.x - last.x, b.y - last.y)); last = { x: b.x, y: b.y }; entered ||= w.waterPointAt(b.x, b.y); };
      forest.events.on('postupdate', frame); await new Promise((r) => setTimeout(r, 4000)); forest.events.off('postupdate', frame);
      return { found: true, shore: { x: Math.round(shore.x), y: Math.round(shore.y) }, mode: b.mode, entered, maxStep: Math.round(maxStep), now: { x: Math.round(b.x), y: Math.round(b.y) } };
    });
    console.log('· da margem:', JSON.stringify(r));
    assert.ok(r.found, 'não achei um ponto de margem para o teste'); assert.equal(r.entered, true, 'o pato não entrou na água');
    assert.ok(r.maxStep <= 16, 'o pato não deve teletransportar');
    await page.evaluate(() => { const b = forest.waterfowl.ducks[0].brain; forest.player.x = b.x - 120; forest.player.y = b.y + 40; });
    await page.waitForTimeout(600); await page.screenshot({ path: `${out}/patos-lago.png` });
    fs.writeFileSync(`${out}/validacao.json`, JSON.stringify({ ducks, margem: r }, null, 1));
    assert.deepEqual(errors, []); console.log('QA dos patos: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
