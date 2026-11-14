// Conferência da doma do cavalo nos Campos Abertos (Vite em 127.0.0.1:5190; CHROMIUM_PATH opcional).
// A cadeia até a primeira cesta (plantio, estações e Helena) é coberta por scripts/qa-harvest-chain.cjs;
// aqui o jogo começa com cestas na mochila, no Verão do Ano 1.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-doma-cavalo';
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
    await page.locator('#character-name').fill('Doma QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const v = game.scene.getScene('Vale'); v.state.day = 37; v.state.time = 600; v.inventory.data.harvestBasket = 9; v.inventory.data.cord = 2; v.state.inventory = v.inventory.data;
      v.player.x = 816; v.player.y = 2190; v.snapshotState();
    });
    await page.keyboard.down('s');
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields');
    await page.keyboard.up('s');
    await page.evaluate(() => { window.s = game.scene.getScene('Campos'); });
    const horse = () => page.evaluate(() => { const h = s.world.horse.brain; return { x: h.x, y: h.y }; });
    const taming = () => page.evaluate(() => ({ ...(s.state.horseTaming ?? { trust: 0, tamed: false }) }));
    // Como um jogador: procura em volta do cavalo um lugar aberto a ~190 px, usa a cesta
    // virado para o cavalo e se afasta no sentido oposto, conforme a fase.
    async function feedOnce(away, shot) {
      const h = await horse();
      const placedAt = await page.evaluate(async ([hx, hy, away]) => {
        const d = await import('/src/data/open-fields.ts');
        for (let k = 0; k < 16; k++) {
          const a = Math.PI + k * Math.PI / 8, dx = Math.cos(a), dy = Math.sin(a), px = hx + dx * 220, py = hy + dy * 220, fx = hx + dx * (190 + away), fy = hy + dy * (190 + away);
          if (!d.fieldsSafe({ x: px, y: py }) || !d.fieldsSafe({ x: fx, y: fy })) continue;
          s.state.time = 600; s.player.x = px; s.player.y = py; s.player.facing = { x: -dx, y: -dy }; s.useVillageItem('harvestBasket');
          if (s.state.horseTaming?.basket) { s.player.x = fx; s.player.y = fy; return { dx, dy }; }
        }
        return null;
      }, [h.x, h.y, away]);
      assert.ok(placedAt, 'cesta deveria estar no chão');
      const day = await page.evaluate(() => s.state.day);
      if (shot) { await page.waitForTimeout(1300); await page.screenshot({ path: `${out}/${shot}` }); }
      try { await page.waitForFunction((d) => s.state.horseTaming?.lastFedDay === d, day, { timeout: 40000 }); }
      catch (e) {
        const dump = await page.evaluate(async () => { const d = await import('/src/data/open-fields.ts'); const h = s.world.horse, b = s.state.horseTaming?.basket, line = []; if (b) for (let i = 0; i <= 10; i++) { const x = h.brain.x + (b.x - h.brain.x) * i / 10, y = h.brain.y + (b.y - h.brain.y) * i / 10; line.push(d.fieldsBlocked(x, y) ? 'X' : '.'); } return { horse: { x: Math.round(h.brain.x), y: Math.round(h.brain.y), mode: h.brain.mode, moving: h.brain.moving, idle: h.idle?.phase, flee: h.brain.fleeRadius }, basket: b, player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, line: line.join(''), basketSafe: b ? d.fieldsSafe(b) : null }; });
        console.log('DIAGNÓSTICO', JSON.stringify(dump)); await page.screenshot({ path: `${out}/falha.png` }); throw e;
      }
      return { day, ...(await taming()) };
    }
    const nextDay = (n = 1) => page.evaluate((n) => { s.state.day += n; s.state.time = 600; }, n);

    // Dia sem cesta: a confiança volta a zero.
    let r = await feedOnce(420, '1-dia1-cavalo-vem.png');
    log(`dia ${r.day}: comeu com você a 420 px · confiança ${r.trust}/7`);
    await nextDay(2); await page.waitForTimeout(400);
    r = await taming();
    assert.equal(r.trust, 0); log('pulou um dia sem cesta: confiança voltou a 0');

    // Sete dias seguidos, com a distância de cada fase.
    for (let i = 1; i <= 7; i++) {
      const away = i <= 2 ? 420 : i <= 4 ? 230 : 95;
      r = await feedOnce(away, i === 5 ? '2-dia5-come-perto.png' : undefined);
      await page.waitForTimeout(300);
      log(`dia ${r.day}: comeu com você a ${away} px da cesta · confiança ${r.trust}/7${r.tamed ? ' · DOMADO' : ''}`);
      assert.equal(r.trust, i);
      if (i < 7) await nextDay();
    }
    assert.equal(r.tamed, true);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/3-dia7-domado.png` });

    // Domado: vem até você por conta própria.
    const h = await horse();
    await page.evaluate(([x, y]) => { s.player.x = x; s.player.y = y; }, [h.x - 260, h.y]);
    await page.waitForTimeout(5000);
    const near = await page.evaluate(() => Math.hypot(s.world.horse.brain.x - s.player.x, s.world.horse.brain.y - s.player.y));
    assert.ok(near < 110, `o cavalo domado deveria se aproximar (${near.toFixed(0)} px)`);
    log(`domado: veio até você (${near.toFixed(0)} px)`);

    // Nome pela janela e corda (sem estábulo, recusada).
    await page.keyboard.press('e');
    await page.locator('[data-text-prompt]').waitFor();
    await page.locator('[data-text-prompt]').fill('Trovão');
    await page.screenshot({ path: `${out}/4-nome.png` });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => s.state.horseTaming?.name === 'Trovão');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/5-trovao.png` });
    log('nome dado: Trovão');
    await page.keyboard.press('g');
    await page.waitForTimeout(400);
    const rope = await page.evaluate(() => ({ escort: s.state.animalEscort ?? null, cord: s.state.inventory.cord, text: document.body.innerText.includes('estábulo') }));
    assert.equal(rope.escort, null); assert.equal(rope.cord, 2); assert.equal(rope.text, true);
    log('corda recusada sem estábulo');

    // Salvar e continuar mantém a doma.
    await page.evaluate(() => s.mainMenu());
    await page.locator('#continue-game').click();
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'openFields');
    await page.evaluate(() => { window.s = game.scene.getScene('Campos'); });
    const kept = await page.evaluate(() => s.state.horseTaming);
    assert.equal(kept.tamed, true); assert.equal(kept.name, 'Trovão');
    log('recarregado: doma e nome preservados');

    // Estábulo pronto na Propriedade (perto da chegada dos Campos): a corda passa a valer.
    await page.evaluate(async () => {
      const { FARM_BUILDINGS } = await import('/src/data/farm-buildings.ts');
      s.state.farmConstruction = { version: 1, nextId: 2, sites: [{ id: 1, kind: 'stable', x: 22, y: 58, delivered: { ...FARM_BUILDINGS.stable.cost }, finished: true, animals: [], hay: 0, gateOpen: true }] };
      const h = s.world.horse.brain; s.player.x = h.x - 40; s.player.y = h.y; s.updateHUD();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('g');
    await page.waitForFunction(() => s.state.animalEscort?.id === 'field-horse-1');
    assert.equal(await page.evaluate(() => s.state.inventory.cord), 1);
    log('corda colocada no Trovão (gastou 1 corda)');
    // Caminha até a passagem norte com o cavalo ao lado e atravessa.
    await page.evaluate(() => { s.player.x = 1536; s.player.y = 150; const h = s.world.horse.brain; h.x = 1536 + 30; h.y = 180; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/6-corda-campos.png` });
    await page.keyboard.down('w');
    await page.waitForFunction(() => document.querySelector('#ui')?.dataset.area === 'property');
    await page.keyboard.up('w');
    await page.waitForTimeout(1200);
    const arrived = await page.evaluate(() => { window.v = game.scene.getScene('Vale'); const a = v.animals?.animals.find((x) => x.id === 'field-horse-1'); return { escort: v.state.animalEscort, horse: a ? { x: Math.round(a.x), y: Math.round(a.y) } : null }; });
    assert.deepEqual(arrived.escort, { id: 'field-horse-1', area: 'property' }); assert.ok(arrived.horse, 'o Trovão deveria aparecer na Propriedade');
    await page.screenshot({ path: `${out}/7-chegada-propriedade.png` });
    log(`travessia: Trovão chegou na Propriedade em ${JSON.stringify(arrived.horse)}`);
    // Solta a corda: o cavalo passa a ser do jogador e a corda volta.
    await page.keyboard.press('g');
    await page.waitForFunction(() => v.state.recruitedAnimals?.includes('field-horse-1'));
    assert.equal(await page.evaluate(() => v.state.animalEscort ?? null), null);
    log('corda solta na Propriedade: Trovão agora é seu');
    // Alojar no estábulo pelo painel da construção.
    await page.evaluate(async () => {
      const { farmAnchor } = await import('/src/systems/farm-construction.ts');
      const site = v.state.farmConstruction.sites[0], p = farmAnchor(site), a = v.animals.animals.find((x) => x.id === 'field-horse-1');
      v.player.x = p.x; v.player.y = p.y + 20; a.brain.x = p.x + 30; a.brain.y = p.y + 10;
      const { showFarmConstruction } = await import('/src/farm-construction-panel.ts'); showFarmConstruction(v.ui, v.farmRuntime, site.id);
    });
    await page.getByRole('button', { name: 'Alojar Trovão' }).click();
    await page.waitForFunction(() => v.state.farmConstruction.sites[0].animals.includes('field-horse-1'));
    await page.evaluate(() => v.ui.closeModal());
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/8-trovao-no-estabulo.png` });
    log('Alojar Trovão: morando no estábulo');
    assert.deepEqual(errors, []);
    console.log('QA da doma: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
