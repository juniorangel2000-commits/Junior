const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const report = [];
    const fixtures = [
      { id: 'farmer-female', folder: 'fazendeira', walkFrames: 6, walkAnimation: 'Walk', originY: 232 },
      { id: 'farmer-male', folder: 'fazendeiro', walkFrames: 8, walkAnimation: 'Walking', originY: 240 },
    ];
    for (const fixture of fixtures) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.setDefaultTimeout(30_000);
      const evidence = path.join(__dirname, `../docs/personagens/${fixture.folder}`);
      fs.mkdirSync(evidence, { recursive: true });
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
      const animation = await page.evaluate(async fixture => {
        const { CHARACTER_DIRECTIONS } = await import('/src/character-directions.ts');
        const { drawCharacter } = await import('/src/art.ts');
        const canvas = document.createElement('canvas');
        const { createCharacterProfile, characterWalkFps, resolveCharacter } = await import('/src/data/characters.ts');
        const profile = createCharacterProfile('Quadros', fixture.id);
        const walkFrames = resolveCharacter(profile).walkFrames;
        const columns = walkFrames + 1;
        // Old appearance choices must never recolor or replace the supplied character.
        const profiles = [profile, { characterId: fixture.id, name: 'Antiga', skin: '#56392e', hairColor: '#ff0000', outfit: '#6d8655', shirtColor: '#ffff00', hairStyle: 'longo', accessory: 'bolsa' }];
        const styles = profiles.map(profile => ({
          directions: CHARACTER_DIRECTIONS.map(direction => {
            const frames = Array.from({ length: columns }, (_, phase) => {
              drawCharacter(canvas, profile, direction, phase);
              return canvas.toDataURL();
            });
            return { direction, frames, idle: frames[0], distinctWalkFrames: new Set(frames.slice(1)).size };
          }),
        }));
        // Compare every rendered frame against the actual uploaded source, independently
        // of the runtime texture lookup, to catch swapped directions/order and distortion.
        const exportDirections = ['south', 'west', 'east', 'north', 'south-west', 'south-east', 'north-west', 'north-east'];
        const expected = document.createElement('canvas'); expected.width = 192; expected.height = 256;
        const ctx = expected.getContext('2d'); ctx.imageSmoothingEnabled = false;
        const original = document.createElement('canvas'); original.width = 256; original.height = 256;
        const originalCtx = original.getContext('2d', { willReadFrequently: true });
        const countVisible = data => {
          let count = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i]) count++;
          return count;
        };
        let sourceMatches = 0;
        let preservedPixels = true;
        for (let row = 0; row < exportDirections.length; row++) for (let phase = 0; phase <= fixture.walkFrames; phase++) {
          const source = new Image();
          const view = exportDirections[row];
          source.src = `assets/visual/characters/${fixture.id}/Idle/${phase ? `animations/${fixture.walkAnimation}/${view}/frame_${String(phase - 1).padStart(3, '0')}.png` : `rotations/${view}.png`}`;
          await source.decode();
          ctx.clearRect(0, 0, 192, 256);
          ctx.drawImage(source, -32, 244 - fixture.originY);
          originalCtx.clearRect(0, 0, 256, 256); originalCtx.drawImage(source, 0, 0);
          preservedPixels &&= countVisible(originalCtx.getImageData(0, 0, 256, 256).data)
            === countVisible(ctx.getImageData(0, 0, 192, 256).data);
          if (expected.toDataURL() === styles[0].directions[row].frames[phase]) sourceMatches++;
        }
        return { directions: CHARACTER_DIRECTIONS, columns, walkFrames, fps: characterWalkFps(profile), styles, sourceMatches, preservedPixels };
      }, fixture);
      assert.equal(animation.columns, fixture.walkFrames + 1);
      assert.equal(animation.walkFrames, fixture.walkFrames);
      assert.equal(animation.fps, fixture.walkFrames * 1.75);
      assert.equal(animation.sourceMatches, 8 * (fixture.walkFrames + 1), 'all idle and walk frames match native PNG pixels without downsampling');
      assert.equal(animation.preservedPixels, true, 'no visible source pixels cropped from any frame');
      for (const style of animation.styles) {
        assert.equal(new Set(style.directions.map(view => view.idle)).size, 8, 'eight distinct idle directions');
        for (const view of style.directions) assert.equal(view.distinctWalkFrames, fixture.walkFrames, `${view.direction}: all supplied frames render distinctly`);
      }
      for (let row = 0; row < animation.directions.length; row++) {
        assert.deepEqual(animation.styles[0].directions[row].frames, animation.styles[1].directions[row].frames, `${animation.directions[row]}: legacy colors, hair and accessories are ignored`);
      }
      fs.writeFileSync(path.join(evidence, 'quadros-renderizados.json'), JSON.stringify(animation.styles[0].directions));
      await page.locator('#new-game').click();
      assert.equal(await page.locator('[data-hair], [data-option], [data-accessory], [data-preset], input[type=color]').count(), 0);
      assert.equal(await page.locator('[data-character="farmer-female"][aria-pressed=true]').count(), 1);
      assert.equal(await page.locator('[data-character]').count(), 2);
      await page.locator(`[data-character="${fixture.id}"]`).click();
      assert.equal(await page.locator('[data-character][aria-pressed=true]').getAttribute('data-character'), fixture.id);
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
      const other = fixtures.find(character => character.id !== fixture.id);
      await page.locator(`[data-character="${other.id}"]`).click();
      const switched = await page.locator('.preview-character canvas').evaluate(canvas => canvas.toDataURL());
      await page.waitForFunction(still => document.querySelector('.preview-character canvas').toDataURL() !== still, switched);
      await page.locator(`[data-character="${fixture.id}"]`).click();
      await page.getByRole('button', { name: 'Parar caminhada', exact: true }).click();
      await page.locator('[data-direction="down-right"]').click();
      await page.locator('#character-name').fill('Luz');
      await page.screenshot({ path: path.join(evidence, 'selecao.png') });
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
      assert.equal(await page.evaluate(() => scene.state.profile.characterId), fixture.id);
      assert.equal(await page.evaluate(() => scene.state.profile.name), 'Luz');
      assert.deepEqual(await page.evaluate(({ directions, columns }) => {
        const atlas = scene.player.sprite.texture.getSourceImage();
        const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 256;
        const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
        return directions.map((_, row) => Array.from({ length: columns }, (_, phase) => {
          ctx.clearRect(0, 0, 192, 256);
          ctx.drawImage(atlas, phase * 192, row * 256, 192, 256, 0, 0, 192, 256);
          return canvas.toDataURL();
        }));
      }, { directions, columns: animation.columns }), animation.styles[0].directions.map(view => view.frames), 'world atlas contains the selected character in every frame');
      assert.deepEqual(await page.evaluate(() => ({
        width: scene.player.sprite.displayWidth, height: scene.player.sprite.displayHeight,
        frameWidth: scene.player.sprite.frame.width, frameHeight: scene.player.sprite.frame.height,
      })), { width: 48, height: 64, frameWidth: 192, frameHeight: 256 }, 'native texture keeps the existing world size');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(evidence, 'no-jogo.png') });
      for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).click();
      await page.waitForFunction(() => scene.cameraZoomFactor === 2 && Math.abs(scene.cameras.main.zoom - 4) < .001);
      await page.screenshot({ path: path.join(evidence, 'zoom-200.png') });
      await page.getByRole('button', { name: 'Restaurar zoom padrão', exact: true }).click();
      await page.waitForFunction(() => scene.cameraZoomFactor === 1 && Math.abs(scene.cameras.main.zoom - 2) < .001);
      assert.equal(await page.evaluate(() => {
        scene.ui.showDialogue('Lia', ['Olá!']);
        const portrait = document.querySelector('.dialogue-portrait canvas').toDataURL();
        const original = scene.textures.get('lia').getSourceImage().toDataURL();
        scene.ui.closeModal();
        return portrait === original;
      }), true, 'Lia keeps the same art in dialogue and in the world');
      console.log(`PASS ${fixture.id}: source images, selection, live switching, preview, layout and Lia portrait`);
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
      assert.equal(await page.evaluate(() => scene.state.profile.characterId), fixture.id);
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
      console.log(`PASS ${fixture.id}: ${fixture.walkFrames} walk frames per direction, real keyboard in all 8 directions, save/reload inside and outside, diagonal E, trees, no JS/assets errors`);
      report.push({ character: fixture.id, nativeFramesVerified: animation.sourceMatches,
        preservedVisiblePixels: animation.preservedPixels, status: 'passed' });
      await page.close();
    }
    fs.writeFileSync(path.join(__dirname, '../docs/personagens/validacao-browser.json'),
      JSON.stringify({ completedAt: new Date().toISOString(), characters: report }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
