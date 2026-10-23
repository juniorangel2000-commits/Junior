const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const attach = async () => {
      await page.waitForTimeout(2500);
      await page.evaluate(async () => {
        const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
        window.scene = game.scene.scenes[0];
      });
    };
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');
    await attach();
    await page.evaluate(() => {
      scene.startNew({ name: 'Mãos livres', skin: '#e9bc98', hairColor: '#563b2c', outfit: '#457398', hairStyle: 'preso' });
      Object.assign(scene.inventory.data, { seeds: 7, hatchet: 1 });
      scene.state.homeSupplies = { wateringCan: true, seedPacket: true };
      scene.updateHUD();
    });
    await page.waitForTimeout(400);
    await page.keyboard.press('9');
    assert.equal(await page.evaluate(() => scene.ui.modal), null);
    assert.equal(await page.locator('.toolbelt .selected').getAttribute('data-slot'), '8');
    assert.deepEqual(await page.evaluate(() => scene.ui.getQuickbar()), Array(9).fill(null));
    await page.keyboard.press('i');
    for (const [item, slot] of [['seeds', 0], ['wateringCan', 1], ['hatchet', 2]]) {
      await page.locator(`[data-bag-item="item:${item}"]`).dragTo(page.locator(`.inventory-quickbar [data-slot="${slot}"]`));
    }
    await page.keyboard.press('i');
    const before = await page.evaluate(() => ({ ...scene.inventory.data }));
    for (const [key, tool] of [['1', 'plant'], ['2', 'water'], ['3', 'hatchet']]) {
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => scene.tool), tool);
      await page.locator('.toolbelt [data-slot="3"]').click();
      assert.equal(await page.evaluate(() => scene.tool), 'hand');
      assert.equal(await page.evaluate(() => scene.ui.modal), null);
      assert.equal(await page.locator('.toolbelt .selected').getAttribute('data-slot'), '3');
      await page.keyboard.press('9');
      assert.equal(await page.locator('.toolbelt .selected').getAttribute('data-slot'), '8');
    }
    assert.deepEqual(await page.evaluate(() => ({ ...scene.inventory.data })), before);
    // Place the player beside a real, reachable loose resource; collect through E.
    const resource = await page.evaluate(() => {
      for (const node of scene.world.resources.filter(node => node.kind === 'tree')) {
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
          const x = (node.x + dx) * 32 + 16, y = (node.y + dy) * 32 + 16;
          if (scene.world.isBlockedPoint(x, y)) continue;
          scene.player.x = x; scene.player.y = y;
          if (!scene.clearReach(node)) continue;
          scene.player.facing = { x: -dx, y: -dy };
          scene.lastAim = { x: node.x, y: node.y }; scene.aimUntil = scene.time.now + 5000;
          scene.nextInteractionAt = 0;
          return { id: node.id, wood: scene.inventory.data.wood };
        }
      }
      throw new Error('No reachable loose wood fixture');
    });
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => scene.inventory.data.wood), resource.wood + 4);
    assert.ok(await page.evaluate(id => scene.state.depletedResources.includes(id), resource.id));
    await page.evaluate(() => scene.persist());
    const savedInventory = await page.evaluate(() => ({ ...scene.inventory.data }));
    await page.reload(); await attach();
    await page.evaluate(() => scene.continueGame()); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => scene.tool), 'hand');
    assert.equal((await page.evaluate(() => scene.ui.getQuickbar()))[8], null);
    assert.deepEqual(await page.evaluate(() => ({ ...scene.inventory.data })), savedInventory);
    assert.equal(await page.evaluate(id => scene.world.resources.some(node => node.id === id), resource.id), false);
    await page.keyboard.press('9');
    await page.keyboard.press('i');
    await page.locator('.backpack-grid').waitFor();
    assert.equal(await page.locator('.backpack-grid .bag-slot').count(), 30);
    assert.deepEqual(errors, []);
    console.log('PASS: empty slots by click/1–9 equip hands, single selection, no inventory popup or stock changes, E collects real resource, save/reload keeps hands/empty slots/reward, I still opens 30-slot backpack');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
