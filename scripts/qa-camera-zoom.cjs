const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const attach = async () => {
      await page.locator('#new-game').waitFor();
      await page.evaluate(async () => {
        const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
        window.scene = game.scene.scenes[0];
      });
    };
    const camera = () => page.evaluate(() => ({
      factor: scene.cameraZoomFactor,
      zoom: scene.cameras.main.zoom,
      width: scene.cameras.main.worldView.width,
      height: scene.cameras.main.worldView.height,
      follows: scene.cameras.main._follow === scene.player,
      x: scene.player.x, y: scene.player.y,
    }));
    const settle = async (factor, zoom) => {
      await page.waitForFunction(({ factor, zoom }) => scene.cameraZoomFactor === factor
        && Math.abs(scene.cameras.main.zoom - zoom) < .0001, { factor, zoom });
      // Wait beyond the 180 ms transition and camera follow before a comparison or capture.
      await page.waitForTimeout(300);
      assert.equal(await page.locator('.camera-zoom-value').textContent(), `${factor * 100}%`);
      assert.equal(await page.evaluate(() => scene.ui.isModalOpen()), false);
    };
    const capture = async percent => {
      await page.mouse.move(1000, 550);
      await page.screenshot({ path: `/tmp/after-rain-zoom-${percent}.png` });
    };
    const checkPointerTile = async () => {
      const target = await page.evaluate(() => {
        const c = scene.cameras.main;
        const tile = { x: Math.floor(scene.player.x / 32) + 1, y: Math.floor(scene.player.y / 32) };
        return { tile, x: ((tile.x + .5) * 32 - c.worldView.x) * c.zoom,
          y: ((tile.y + .5) * 32 - c.worldView.y) * c.zoom };
      });
      await page.mouse.click(target.x, target.y);
      assert.deepEqual(await page.evaluate(() => scene.lastAim), target.tile, 'mouse interaction uses the current camera transform');
      // Keep the perspective captures free of the harmless interaction notification.
      await page.evaluate(() => document.querySelector('.toast-stack').replaceChildren());
    };

    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');
    await attach();
    assert.equal(await page.locator('.camera-zoom').count(), 0, 'no gameplay zoom controls on the title');
    const titlePreference = await page.evaluate(() => scene.cameraZoomFactor);
    await page.mouse.move(1000, 400); await page.mouse.wheel(0, 200); await page.keyboard.press('+');
    assert.equal(await page.evaluate(() => scene.cameraZoomFactor), titlePreference, 'title camera ignores gameplay zoom inputs');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Clara');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => scene.running && !scene.paused && !scene.inHome);
    if (await page.getByRole('button', { name: 'Fechar missões', exact: true }).isVisible()) {
      await page.getByRole('button', { name: 'Fechar missões', exact: true }).click();
    }
    await page.evaluate(() => document.querySelector('.toast-stack').replaceChildren());
    await settle(1, 2);
    const normal = await camera();

    // Real mouse wheel reaches the wide view and clamps at 50%.
    await page.mouse.move(900, 440);
    await page.mouse.wheel(0, 120); await settle(.75, 1.5);
    await page.mouse.wheel(0, 120); await settle(.5, 1);
    await page.mouse.wheel(0, 600); await settle(.5, 1);
    assert.equal(await page.getByRole('button', { name: 'Diminuir zoom', exact: true }).isDisabled(), true);
    const wide = await camera();
    assert.equal(wide.width, normal.width * 2, '50% shows twice the world width');
    assert.equal(wide.height, normal.height * 2, '50% shows twice the world height');
    await checkPointerTile(); await capture(50);

    await page.keyboard.press('Home'); await settle(1, 2); await capture(100);
    // Real HUD buttons reach the close view. All three captures use the same world position.
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).click();
    await settle(2, 4);
    assert.equal(await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).isDisabled(), true);
    await page.keyboard.press('+'); await settle(2, 4);
    const close = await camera();
    assert.equal(close.width, normal.width / 2);
    assert.deepEqual({ x: wide.x, y: wide.y }, { x: normal.x, y: normal.y });
    assert.deepEqual({ x: close.x, y: close.y }, { x: normal.x, y: normal.y });
    await checkPointerTile(); await capture(200);

    assert.equal(await page.evaluate(() => localStorage.getItem('after-rain-camera-zoom')), '2');
    assert.equal(await page.evaluate(() => scene.persist()), true);
    await page.reload(); await attach();
    await page.locator('#continue-game').click();
    await page.waitForFunction(() => scene.running && !scene.paused);
    await settle(2, 4);
    assert.equal((await camera()).follows, true, 'outdoor camera follows after reload');
    await page.getByRole('button', { name: 'Restaurar zoom padrão', exact: true }).click(); await settle(1, 2);
    await page.keyboard.press('-'); await settle(.75, 1.5);
    await page.keyboard.press('='); await settle(1, 2);

    for (const [key, selector] of [['i', '.backpack-panel'], ['m', '.map-card']]) {
      await page.keyboard.press(key); await page.locator(selector).waitFor();
      if (key === 'm') {
        await page.waitForFunction(() => document.querySelector('.map-snapshot').naturalWidth > 0);
        assert.equal(await page.locator('.map-snapshot').evaluate(image => image.naturalWidth), 960, 'map still captures the complete world');
      }
      const before = await camera();
      await page.mouse.move(640, 400); await page.mouse.wheel(0, -200);
      await page.keyboard.press('+'); await page.waitForTimeout(300);
      assert.equal((await camera()).factor, before.factor, `${selector}: scrolling and + do not zoom the game`);
      assert.equal((await camera()).zoom, before.zoom);
      assert.equal(await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).isDisabled(), true);
      await page.keyboard.press('Escape'); await settle(1, 2);
    }

    await page.keyboard.press('-'); await page.keyboard.press('-'); await settle(.5, 1);
    await page.evaluate(() => scene.enterHome()); await settle(.5, 1);
    assert.equal((await camera()).follows, false, 'wide indoor view centers the whole room');
    assert.deepEqual(await page.evaluate(() => ({ x: scene.cameras.main.midPoint.x, y: scene.cameras.main.midPoint.y })), { x: 192, y: 160 });
    await page.evaluate(() => document.querySelector('.toast-stack').replaceChildren());
    await page.screenshot({ path: '/tmp/after-rain-zoom-home-50.png' });
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).click();
    await settle(2, 4);
    assert.equal((await camera()).follows, true, 'close indoor view follows the player');
    const beforeWalk = await page.evaluate(() => ({ y: scene.player.y, scrollY: scene.cameras.main.scrollY }));
    await page.keyboard.down('w'); await page.waitForTimeout(400); await page.keyboard.up('w'); await page.waitForTimeout(300);
    const afterWalk = await page.evaluate(() => ({ y: scene.player.y, scrollY: scene.cameras.main.scrollY,
      visible: scene.cameras.main.worldView.contains(scene.player.x, scene.player.y) }));
    assert.ok(afterWalk.y < beforeWalk.y && afterWalk.scrollY < beforeWalk.scrollY, 'indoor follow scrolls with actual movement');
    assert.equal(afterWalk.visible, true);
    await page.screenshot({ path: '/tmp/after-rain-zoom-home-200.png' });
    await page.evaluate(() => scene.leaveHome()); await settle(2, 4);
    assert.equal((await camera()).follows, true);
    await page.setViewportSize({ width: 960, height: 640 }); await settle(2, 2);
    await page.setViewportSize({ width: 1280, height: 800 }); await settle(2, 4);
    await page.keyboard.press('Home'); await settle(1, 2);

    assert.deepEqual(errors, []);
    console.log('PASS zoom 50–200%, doubled view, same-position captures, wheel/buttons/keyboard, pointer coordinates, limits, saved preference/reload, menu scrolling, map, home follow and resize; no JS/assets errors');
    console.log('Captures: /tmp/after-rain-zoom-{50,100,200}.png and /tmp/after-rain-zoom-home-{50,200}.png');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
