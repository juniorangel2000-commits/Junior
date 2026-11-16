// Conferência da liberação de imagens (Vite em 127.0.0.1:5190): vai e volta entre a Propriedade
// e os cenários; procura imagens faltando (__MISSING), animações ausentes e erros, e mede a memória.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], warnings = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('ERRO', e.stack?.slice(0, 600)); });
    page.on('console', (m) => { const t = m.text(); if (/missing|Missing|não encontrad|Frame missing|not found|\[agua\]/i.test(t)) { warnings.push(t); console.log('AVISO', t.slice(0, 200)); } });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Memória QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => { const m = await import(document.querySelector('script[src*="main.ts"]').src); window.game = m.game; window.perf = await import('/src/performance-overlay.ts'); });
    const check = async (label) => {
      await page.waitForTimeout(5000);
      const r = await page.evaluate(() => {
        const missing = []; const visit = (o, scene) => { if (!o) return; if (o.texture?.key === '__MISSING') missing.push(scene + ':' + (o.type ?? '?')); if (o.anims?.currentAnim === null && o.anims?.isPlaying) missing.push(scene + ':anim'); for (const c of o.list ?? []) visit(c, scene); };
        for (const s of game.scene.getScenes(true)) for (const o of s.children.list) visit(o, s.scene.key);
        const p = perf.samplePerformance(game, [16]); return { missing, mb: p.textureMB, scenes: p.scenes.join(',') };
      });
      console.log(`· ${label}: ${r.scenes} · ${r.mb} MB · faltando ${r.missing.length}`); assert.deepEqual(r.missing, [], label); return r.mb;
    };
    const vale = async () => { await page.evaluate(() => { for (const s of game.scene.getScenes(true)) if (s.scene.key !== 'Vale') { const st = s.snapshotState?.() ?? s.getFishingState?.(); s.scene.stop(); s.onReturn?.(st, false); } }); await page.waitForFunction(() => game.scene.isActive('Vale')); };
    const first = await check('Propriedade');
    for (let round = 1; round <= 2; round++) {
      await page.evaluate(() => { const v = game.scene.getScene('Vale'); v.state.damiaoIntroduction = true; v.state.day = 3; v.state.time = 600; v.enterVillage(); });
      await page.waitForFunction(() => game.scene.isActive('Vila') && game.scene.getScene('Vila').player); await check(`Vila (${round}ª vez)`);
      await vale(); await check(`Propriedade de novo (${round})`);
      await page.evaluate(() => game.scene.getScene('Vale').enterForest?.()); await page.waitForTimeout(500);
      if (await page.evaluate(() => game.scene.isActive('Floresta'))) { await check(`Floresta (${round}ª vez)`); await vale(); await check(`Propriedade de novo (${round}b)`); }
    }
    const last = await check('Propriedade no fim');
    assert.ok(last <= first + 150, `memória cresceu de ${first} para ${last} MB`);
    assert.deepEqual(errors, []); console.log('QA da liberação de imagens: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
