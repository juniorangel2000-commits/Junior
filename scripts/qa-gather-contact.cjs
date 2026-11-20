/* Uso: node scripts/qa-gather-contact.cjs <property|forest|openFields> <pasta>
 * Vite em 5190. Usa as interações reais no Chromium e controla o tempo de jogo. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const area = process.argv[2] || 'property';
const out = process.argv[3] || '/tmp/qa-gather-contact';
if (!['property', 'forest', 'openFields'].includes(area)) throw Error('Cenário de teste inválido');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const report = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 720 } });
    page.setDefaultTimeout(150000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5190');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Contato da ferramenta');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => {
      document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();
      return document.querySelector('#ui')?.dataset.area === 'property';
    });

    await page.evaluate(async area => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const property = game.scene.getScene('Vale');
      Object.assign(property.inventory.data, { hoe: 1, shovel: 2, sickle: 2 });
      property.state.time = 11 * 60;
      property.persist();
      property.updateHUD();
      if (area === 'forest') property.enterForest();
      if (area === 'openFields') property.enterFields();
    }, area);
    await page.waitForFunction(area => document.querySelector('#ui')?.dataset.area === area, area);

    await page.evaluate(area => {
      window.scene = game.scene.getScene({ property: 'Vale', forest: 'Floresta', openFields: 'Campos' }[area]);
      game.loop.sleep();
      let time = scene.time.now;
      window.step = ms => { time += ms; game.step(time, ms); };
      window.action = () => scene.gather || scene.swing;
      window.stock = () => scene.inventory?.data || scene.state.inventory;
      window.testArea = area;
      scene.cameras.main.stopFollow().setZoom(2.5).setRoundPixels(true);
    }, area);

    async function start(tool, copyId) {
      if (area === 'openFields') await page.keyboard.press('e');
      else {
        await page.keyboard.press('i');
        await page.locator('[data-bag-item="tool:' + tool + ':' + copyId + '"]').click();
        await page.locator('[data-use-item="' + tool + '"]').click();
      }
      assert.equal(await page.evaluate(() => action().frame), 0);
      assert.equal(await page.evaluate(() => action().active), true);
    }

    for (const tool of (area === 'property' ? ['shovel', 'sickle'] : ['sickle'])) {
      const fixture = await page.evaluate(async tool => {
        const { syncToolInstances } = await import('/src/systems/tool-instances.ts');
        const fields = await import('/src/data/open-fields.ts');
        const copies = syncToolInstances(stock(), scene.state.economy6?.tools).items.filter(copy => copy.kind === tool);
        scene.state.time = 11 * 60;

        const position = (x, y) => {
          scene.player.x = x;
          scene.player.y = y;
          scene.player.facing = { x: 1, y: 0 };
          scene.player.update(0, scene.movementBlocked || scene.movementBlockedAt || scene.blockedTile,
            scene.movementBlockedPoint || (testArea === 'openFields' ? fields.fieldsBlocked : undefined),
            false, scene.swimmingPoint);
          scene.cameras.main.centerOn(x + 12, y - 15);
        };
        let target;
        if (tool === 'shovel') {
          for (let y = 25; y < 40 && !target; y++) for (let x = 20; x < 36 && !target; x++) {
            if (scene.farming.prepareReason(x, y, scene.inventory, scene.soilGround())) continue;
            if (scene.movementBlockedPoint((x - .5) * 32, (y + .5) * 32)) continue;
            position((x - .5) * 32, (y + .5) * 32);
            if (!scene.player.isSwimming && scene.clearReach({ x, y })) target = { x, y };
          }
        } else if (testArea === 'openFields') {
          for (const patch of fields.MEADOW_PATCHES) {
            if (patch.kind !== 'grass' || !fields.fieldsSafe({ x: patch.x - 36, y: patch.y })) continue;
            position(patch.x - 36, patch.y);
            if (scene.target()?.id === patch.id && !scene.horseNear() && !scene.ipeTarget()) { target = patch; break; }
          }
        } else {
          for (const node of scene.world.resources) {
            if (node.kind !== 'fiber' || scene.world.waterAt?.(node.x, node.y)) continue;
            const x = node.x * 32 - 16, y = node.y * 32 + 16;
            if (scene.movementBlockedPoint?.(x, y) || scene.movementBlockedAt?.(Math.floor(x / 32), Math.floor(y / 32))) continue;
            position(x, y);
            if (!scene.player.isSwimming && (!scene.clearReach || scene.clearReach(node))) { target = node; break; }
          }
        }
        if (!target) throw Error('Sem alvo apropriado para ' + tool);
        scene.updateHUD();
        step(0);
        return { target, copies: copies.map(copy => ({ id: copy.id, durability: copy.condition.durability })) };
      }, tool);

      const state = () => page.evaluate(({ tool, fixture }) => {
        const t = fixture.target;
        const applied = tool === 'shovel' ? scene.farming.isPrepared(t.x, t.y)
          : testArea === 'openFields' ? scene.state.openFields.cut[t.id] !== undefined
          : !scene.world.resources.some(node => node.id === t.id);
        return {
          applied, frame: action().frame, active: action().active, bodyVisible: scene.player.sprite.visible,
          x: scene.player.x, y: scene.player.y,
          durability: fixture.copies.map(copy => stock().toolInstances.items.find(item => item.id === copy.id).condition.durability),
        };
      }, { tool, fixture });
      const before = await state();
      const durability = fixture.copies.map(copy => copy.durability);

      // Pause at frame 3, then complete the same action and cross the impact frame.
      await start(tool, fixture.copies[0].id);
      await page.evaluate(() => { step(100); step(100); scene.setPaused(true); scene.setPaused(false); step(50); });
      const cancelled = await state();
      assert.equal(cancelled.applied, false);
      assert.deepEqual(cancelled.durability, durability);
      assert.equal(cancelled.active, false);
      assert.equal(cancelled.bodyVisible, true);

      await start(tool, fixture.copies[0].id);
      await page.keyboard.down('d');
      await page.evaluate(() => { step(100); step(100); });
      await page.keyboard.up('d');
      const windup = await state();
      assert.equal(windup.frame, 3);
      assert.equal(windup.applied, false);
      assert.deepEqual(windup.durability, durability);
      assert.deepEqual([windup.x, windup.y], [before.x, before.y]);
      await page.screenshot({ path: out + '/' + area + '-' + tool + '-preparo.png' });

      await page.evaluate(() => step(24));
      const contact = await state();
      assert.equal(contact.frame, 4);
      assert.equal(contact.applied, true);
      assert.deepEqual(contact.durability, [durability[0] - 1, durability[1]]);
      await page.screenshot({ path: out + '/' + area + '-' + tool + '-contato.png' });

      await page.evaluate(() => { step(100); step(100); step(100); });
      const finished = await state();
      assert.deepEqual(finished.durability, contact.durability);
      assert.equal(finished.bodyVisible, true);
      assert.equal(finished.active, false);
      report.push({ tool, area, target: fixture.target.id || fixture.target, before, cancelled, windup, contact, finished });
      console.log('OK:', area, tool, 'preparo, cancelamento, contato único e durabilidade');
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(out + '/' + area + '.json', JSON.stringify({ report, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
