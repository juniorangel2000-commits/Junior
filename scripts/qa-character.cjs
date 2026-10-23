const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
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
    const releaseTogether = async keys => {
      // Releasing diagonal keys across separate protocol tasks can render a cardinal
      // movement frame in between. Release them together, then clear Playwright's state.
      await page.evaluate(keys => {
        const arrows = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };
        for (const key of keys) {
          const keyCode = arrows[key] || key.toUpperCase().charCodeAt(0);
          window.dispatchEvent(new KeyboardEvent('keyup', {
            key, code: key.startsWith('Arrow') ? key : `Key${key.toUpperCase()}`,
            keyCode, which: keyCode, bubbles: true,
          }));
        }
      }, keys);
      for (const key of keys) await page.keyboard.up(key);
    };
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173'); await attach();
    const animation = await page.evaluate(async () => {
      const { CHARACTER_DIRECTIONS, CHARACTER_FRAMES_PER_DIRECTION, CHARACTER_WALK_FRAMES, CHARACTER_WALK_FPS } = await import('/src/character-directions.ts');
      const { drawCharacter } = await import('/src/art.ts');
      const canvas = document.createElement('canvas');
      const profile = { name: 'Quadros', skin: '#d9a276', hairColor: '#754323', outfit: '#638a9d', shirtColor: '#f0e4c9', accessory: 'nenhum' };
      const styles = ['curto', 'preso'].map(hairStyle => ({
        hairStyle,
        directions: CHARACTER_DIRECTIONS.map(direction => {
          const frames = Array.from({ length: CHARACTER_FRAMES_PER_DIRECTION }, (_, phase) => {
            drawCharacter(canvas, { ...profile, hairStyle }, direction, phase);
            return canvas.toDataURL();
          });
          return { direction, idle: frames[0], distinctWalkFrames: new Set(frames.slice(1)).size };
        }),
      }));
      return { directions: CHARACTER_DIRECTIONS, columns: CHARACTER_FRAMES_PER_DIRECTION, walkFrames: CHARACTER_WALK_FRAMES, fps: CHARACTER_WALK_FPS, styles };
    });
    assert.equal(animation.columns, 9);
    assert.equal(animation.walkFrames, 8);
    assert.equal(animation.fps, 10);
    for (const style of animation.styles) {
      assert.equal(new Set(style.directions.map(view => view.idle)).size, 8, `${style.hairStyle}: eight distinct idle directions`);
      for (const view of style.directions) assert.equal(view.distinctWalkFrames, 8, `${style.hairStyle}/${view.direction}: eight distinct rendered walking frames`);
    }
    for (let row = 0; row < animation.directions.length; row++) {
      assert.notEqual(animation.styles[0].directions[row].idle, animation.styles[1].directions[row].idle, `${animation.directions[row]}: both hairstyles render independently`);
    }
    await page.locator('#new-game').click();
    assert.equal(await page.locator('[data-hair]').count(), 2);
    assert.equal(await page.locator('[data-option="skin"] button').count(), 4);
    assert.equal(await page.locator('[data-option="outfit"] button').count(), 4);
    assert.equal(await page.locator('[data-accessory], [data-preset], [data-option="shirtColor"]').count(), 0);
    const directions = animation.directions;
    const idleFrame = direction => directions.indexOf(direction) * animation.columns;
    const views = [];
    for (const direction of directions) {
      await page.locator(`[data-direction="${direction}"]`).click();
      views.push(await page.locator('.preview-character canvas').evaluate(canvas => canvas.toDataURL()));
    }
    assert.equal(new Set(views).size, 8, 'eight distinct poses, including diagonals');
    await page.getByRole('button', { name: 'Ver caminhada', exact: true }).click();
    const still = await page.locator('.preview-character canvas').evaluate(canvas => canvas.toDataURL());
    await page.waitForFunction(still => document.querySelector('.preview-character canvas').toDataURL() !== still, still);
    await page.getByRole('button', { name: 'Parar caminhada', exact: true }).click();
    await page.locator('[data-direction="down-right"]').click();
    await page.locator('#character-name').fill('Luz');
    await page.getByRole('button', { name: 'Tom de pele: Castanha', exact: true }).click();
    await page.getByRole('button', { name: 'Cor da roupa: Verde musgo', exact: true }).click();
    await page.locator('[data-hair="curto"]').click();
    await page.screenshot({ path: '/tmp/after-rain-character-editor-0.8.0.png' });
    for (const [width, height] of [[960, 640], [390, 844]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(150);
      const card = await page.locator('.simple-character-studio').boundingBox();
      assert.ok(card.x >= 0 && card.x + card.width <= width && card.height <= height);
      await page.getByRole('button', { name: 'Começar minha história' }).scrollIntoViewIfNeeded();
      const start = await page.getByRole('button', { name: 'Começar minha história' }).boundingBox();
      assert.ok(start.x >= 0 && start.x + start.width <= width && start.y >= 0 && start.y + start.height <= height);
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Começar minha história' }).click(); await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => scene.state.profile), { name: 'Luz', skin: '#9d6646', hairStyle: 'curto', hairColor: '#754323', outfit: '#6d8655', shirtColor: '#f0e4c9', accessory: 'nenhum' });
    // Exercise actual keyboard events on a clear 5×5 part of the real map.
    const origin = await page.evaluate(() => {
      for (let y = 20; y < 65; y++) for (let x = 12; x < 85; x++) {
        let clear = true;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (scene.blocked(x + dx, y + dy)) clear = false;
        if (clear) return { x: x * 32 + 16, y: y * 32 + 16 };
      }
      throw Error('No clear movement fixture');
    });
    const held = [['s'], ['a'], ['ArrowRight'], ['ArrowUp'], ['s', 'a'], ['ArrowDown', 'ArrowRight'], ['w', 'a'], ['ArrowUp', 'ArrowRight']];
    for (let row = 0; row < held.length; row++) {
      await page.evaluate(origin => { scene.player.x = origin.x; scene.player.y = origin.y; scene.input.keyboard.resetKeys(); }, origin);
      for (const key of held[row]) await page.keyboard.down(key);
      await page.waitForFunction(({ row, columns }) => Math.floor(Number(scene.player.sprite.frame.name) / columns) === row && Number(scene.player.sprite.frame.name) % columns !== 0, { row, columns: animation.columns });
      await releaseTogether(held[row]);
      await page.waitForFunction(frame => Number(scene.player.sprite.frame.name) === frame, idleFrame(directions[row]));
      const position = await page.evaluate(() => ({ x: scene.player.x, y: scene.player.y }));
      assert.ok(Math.hypot(position.x - origin.x, position.y - origin.y) > 0, directions[row]);
    }
    assert.equal(await page.evaluate(() => scene.persist()), true, 'outdoor save succeeds');
    await page.reload(); await attach(); await page.locator('#continue-game').click();
    await page.waitForFunction(frame => scene.running && !scene.inHome && Number(scene.player.sprite.frame.name) === frame, idleFrame('up-right'));
    assert.equal(await page.evaluate(() => Number(scene.player.sprite.frame.name)), idleFrame('up-right'), 'diagonal pose restored outdoors');
    assert.equal(await page.evaluate(() => scene.state.profile.outfit), '#6d8655');
    await page.evaluate(() => scene.enterHome());
    await page.keyboard.down('s'); await page.keyboard.down('a'); await page.waitForTimeout(180);
    await releaseTogether(['s', 'a']);
    await page.waitForFunction(frame => Number(scene.player.sprite.frame.name) === frame, idleFrame('down-left'));
    assert.equal(await page.evaluate(() => scene.persist()), true, 'indoor save succeeds');
    await page.reload(); await attach(); await page.locator('#continue-game').click();
    await page.waitForFunction(frame => scene.running && scene.inHome && Number(scene.player.sprite.frame.name) === frame, idleFrame('down-left'));
    assert.equal(await page.evaluate(() => scene.inHome), true);
    assert.equal(await page.evaluate(() => Number(scene.player.sprite.frame.name)), idleFrame('down-left'), 'diagonal pose restored inside house');
    await page.evaluate(() => scene.leaveHome());
    const trees = await page.evaluate(() => {
      const images = scene.children.list.filter(object => object.texture?.key.startsWith('asset-tree-') || object.texture?.key.startsWith('asset-pine-'));
      const tree = images.find(object => object.y > 400 && object.y < 1800 && object.x > 200 && object.x < 2800);
      if (!tree) throw Error('No tree fixture');
      const before = { width: tree.displayWidth, height: tree.displayHeight, player: scene.player.sprite.displayHeight };
      scene.world.updateOcclusion(tree.x, tree.y - 180);
      const behind = tree.alpha;
      scene.world.updateOcclusion(tree.x, tree.y + 45);
      return { ...before, behind, front: tree.alpha, allGrown: images.every(image => image.scaleX === 1.6 && image.scaleY === 1.6) };
    });
    assert.ok(trees.height > trees.player * 2.5 && trees.width > 150 && trees.allGrown);
    assert.equal(trees.behind, .38, 'tall canopy fades even beyond the old five-tile search');
    assert.equal(trees.front, 1, 'canopy becomes opaque again after leaving');
    await page.screenshot({ path: '/tmp/after-rain-character-trees-0.8.0.png' });
    // E uses the diagonal the player faces, without extending the reach.
    await page.evaluate(() => {
      scene.player.x = 25 * 32 + 16; scene.player.y = 21 * 32 + 16;
      scene.player.facing = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
      scene.lastAim = undefined; scene.inventory.data.seeds = 1; scene.selectTool('plant'); scene.nextInteractionAt = 0;
    });
    assert.deepEqual(await page.evaluate(() => scene.targetTile()), { x: 26, y: 22 });
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => scene.inventory.data.seeds), 0);
    assert.ok(await page.evaluate(() => scene.farming.cropAt(26, 22)), 'E plants on the diagonal tile');
    assert.deepEqual(errors, []);
    console.log('PASS simple editor, 8 distinct walking frames and idle in all 8 directions for both hairstyles, three viewport sizes, real keyboard in 8 directions, exterior/interior save/reload, diagonal E, taller trees with extended canopy occlusion, no JS/assets errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
