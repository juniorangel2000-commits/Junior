const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Serial browser scenario. Uses original loaded sprites and the real Phaser
// renderer; source PNGs are never transformed or overwritten on disk.
const output = process.env.QA_OUT || 'docs/ferramentas/balanco-0.9.8';
const phases = [-1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -1, -1];
const tools = ['hatchet', 'pickaxe'];
const directions = ['left', 'right'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = [];
  try {
    for (const character of ['farmer-female', 'farmer-male']) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:5178');
      await page.locator('#new-game').click();
      await page.locator(`[data-character="${character}"]`).click();
      await page.locator('#character-name').fill('Ferramentas');
      await page.getByRole('button', { name: 'Começar minha história' }).click();
      await page.locator('.toolbelt').waitFor();
      await page.evaluate(async () => {
        const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
        window.game = game; window.s = game.scene.getScene('Vale');
        game.loop.sleep(); window.qt = s.time.now;
        window.step = ms => { qt += ms; game.step(qt, ms); };
        s.inventory.data.hatchet = 1; s.inventory.data.pickaxe = 1;
        s.state.time = 720; s.updateNight(); s.updateHUD();
      });

      const strikes = [];
      for (const tool of tools) {
        const target = await page.evaluate(tool => {
          const kinds = tool === 'hatchet' ? ['standingTree', 'fallenLog', 'stump'] : ['vein'];
          for (const resource of s.world.resources.filter(node => kinds.includes(node.kind))) {
            for (const sign of [-1, 1]) {
              const x = (resource.x + .5) * 32 + sign * 32, y = (resource.y + .5) * 32;
              if ([[-7, -5], [7, -5], [-7, 3], [7, 3]].some(([dx, dy]) => s.movementBlockedPoint(x + dx, y + dy))) continue;
              s.player.x = x; s.player.y = y; s.player.facing = { x: -sign, y: 0 };
              s.player.update(0, s.movementBlocked, s.movementBlockedPoint, false, s.swimmingPoint);
              if (s.player.isSwimming || !s.clearReach(resource)) continue;
              s.selectTool(tool); s.lastAim = { x: resource.x, y: resource.y }; s.aimUntil = s.time.now + 100000; s.nextInteractionAt = 0;
              s.updateToolVisual();
              return { ...resource, before: s.resources.progress.find(entry => entry.id === resource.id)?.hits ?? 0 };
            }
          }
          throw Error(`No reachable natural resource for ${tool}`);
        }, tool);
        assert.equal(await page.evaluate(() => s.toolVisual.sprite.visible), false, 'Equipped tool stays hidden at rest');
        await page.keyboard.press('e');
        assert.equal(await page.evaluate(() => s.toolUse.active), true, 'Real E action starts a strike');
        assert.equal(await page.evaluate(() => s.toolVisual.sprite.visible), true);
        await page.keyboard.press('e'); // Repeat input must not add another impact.
        await page.keyboard.down('d');
        const feet = await page.evaluate(() => ({ x: s.player.x, y: s.player.y }));
        await page.evaluate(() => step(100));
        assert.deepEqual(await page.evaluate(() => ({ x: s.player.x, y: s.player.y })), feet, 'Swing locks foot movement');
        await page.keyboard.up('d');
        const hits = () => page.evaluate(id => s.resources.progress.find(entry => entry.id === id)?.hits ?? 0, target.id);
        assert.equal(await hits(), target.before, 'No contact before frame four');
        await page.evaluate(() => step(130));
        assert.equal(await hits(), target.before + 1, 'Exactly one real hit at contact');
        await page.evaluate(() => { step(130); step(130); step(20); });
        assert.equal(await hits(), target.before + 1, 'Recovery never repeats the hit');
        assert.equal(await page.evaluate(() => s.toolUse.active), false);
        assert.equal(await page.evaluate(() => s.toolVisual.sprite.visible), false);
        await page.evaluate(() => { s.nextInteractionAt = 0; });
        await page.keyboard.press('e');
        assert.equal(await page.evaluate(() => s.toolUse.active), true);
        await page.evaluate(() => { step(100); s.setPaused(true); step(200); s.setPaused(false); step(0); });
        assert.equal(await hits(), target.before + 1, 'Pause before contact cancels the hit');
        assert.equal(await page.evaluate(() => s.toolVisual.sprite.visible), false);
        strikes.push({ tool, target: target.id, hitsBefore: target.before, hitsAfter: await hits(), canceledHit: true });
      }

      await page.evaluate(() => {
        // A neutral capture session hides every tree and other scene object;
        // map data and collisions remain untouched.
        let chosen;
        for (let y = 24; y < 62 && !chosen; y++) for (let x = 8; x < 84 && !chosen; x++) if (s.world.isBuildable(x, y)) chosen = { x: (x + .5) * 32, y: (y + .5) * 32 };
        if (!chosen) throw Error('No preview ground');
        window.previewPoint = chosen; s.player.x = chosen.x; s.player.y = chosen.y;
        s.player.update(0, s.movementBlocked, s.movementBlockedPoint, false, s.swimmingPoint);
        s.toolUse.cancel(); s.updateToolVisual();
        for (const object of s.children.list) if (object !== s.player.sprite && object !== s.toolVisual.sprite && object.setVisible) object.setVisible(false);
        s.player.sprite.setVisible(true);
        s.cameras.main.stopFollow(); s.cameras.main.zoomEffect.reset();
        s.cameras.main.setZoom(4).centerOn(chosen.x, chosen.y - 24).setBackgroundColor('#dce3ba');
        document.querySelector('#ui').style.visibility = 'hidden';
        const label = document.createElement('div'); label.id = 'qa-tool-label';
        Object.assign(label.style, { position: 'fixed', left: '210px', top: '88px', color: '#30472b', font: 'bold 15px Georgia', zIndex: '999999' });
        document.body.append(label);
      });
      const clips = [];
      for (const tool of tools) for (const direction of directions) {
        const folder = path.join(output, character, `${tool}-${direction}`);
        fs.mkdirSync(folder, { recursive: true });
        const states = [];
        for (const [index, phase] of phases.entries()) {
          const state = await page.evaluate(async ({ tool, direction, phase, character }) => {
            const { toolUseArt, toolSwingAngle } = await import('/src/data/tool-art.ts');
            s.toolUse.cancel(); s.selectTool(tool); s.player.x = previewPoint.x; s.player.y = previewPoint.y;
            s.player.facing = { x: direction === 'left' ? -1 : 1, y: 0 };
            s.player.update(0, s.movementBlocked, s.movementBlockedPoint, false, s.swimmingPoint);
            if (phase >= 0) {
              s.toolUse.start({ tool, direction, target: { id: 'qa-preview', kind: tool === 'hatchet' ? 'standingTree' : 'vein', x: 0, y: 0 } });
              if (phase > 0) s.toolUse.advance(phase / 18);
            }
            s.updateToolVisual();
            const sprite = s.toolVisual.sprite, image = sprite.texture.getSourceImage();
            const expected = toolUseArt(tool, direction, Math.max(0, phase));
            if (phase >= 0) {
              window.qaToolSourceProof ??= {};
              if (!qaToolSourceProof[tool]) {
                const original = new Image(); original.src = expected.path;
                await original.decode();
                const pixels = source => {
                  const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
                  const context = canvas.getContext('2d'); context.drawImage(source, 0, 0);
                  return context.getImageData(0, 0, canvas.width, canvas.height).data;
                };
                const loaded = pixels(image), supplied = pixels(original);
                qaToolSourceProof[tool] = loaded.length === supplied.length && loaded.every((value, index) => value === supplied[index]);
              }
            }
            document.querySelector('#qa-tool-label').textContent = `${character === 'farmer-female' ? 'Fazendeira' : 'Fazendeiro'} · ${tool === 'hatchet' ? 'Machado' : 'Picareta'} · ${direction === 'left' ? 'Esquerda' : 'Direita'}`;
            // Render without advancing gameplay or the manually selected pose.
            const update = s.update; s.update = () => {}; step(0); s.update = update;
            return { phase, key: sprite.texture.key, sourcePath: expected.path, originalPixels: window.qaToolSourceProof?.[tool], width: image.width, height: image.height,
              visible: sprite.visible, angle: sprite.angle, flipX: sprite.flipX, originX: sprite.originX, originY: sprite.originY,
              x: sprite.x, y: sprite.y, expectedKey: expected.key, expectedAngle: toolSwingAngle(tool, Math.max(0, phase), direction === 'left') };
          }, { tool, direction, phase, character });
          assert.equal(state.visible, phase >= 0, 'Tool visible only while the strike is active');
          if (phase >= 0) {
            assert.equal(state.width, 97); assert.equal(state.height, 97, 'Native supplied art keeps original resolution');
            assert.equal(state.key, state.expectedKey);
            assert.ok(state.sourcePath.includes('/rotations/'), 'Swing uses an original fixed pose rather than morphing animation frames');
            assert.equal(state.originalPixels, true, 'Loaded pixels match the supplied PNG without resampling');
            assert.equal(state.flipX, tool === 'pickaxe' ? direction === 'right' : direction === 'left');
            assert.ok(Math.abs(state.angle - state.expectedAngle) < 1e-6, 'Real sprite uses the mirrored procedural angle');
          }
          states.push(state);
          await page.screenshot({ path: path.join(folder, `frame_${String(index).padStart(2, '0')}.png`), clip: { x: 200, y: 80, width: 400, height: 420 } });
        }
        const active = states.filter(state => state.visible);
        assert.equal(new Set(active.map(state => state.key)).size, 1, 'One stable sprite throughout the swing');
        for (const property of ['originX', 'originY', 'x', 'y']) assert.equal(new Set(active.map(state => state[property])).size, 1, `Grip ${property} remains fixed throughout the swing`);
        clips.push({ tool, direction, folder, states });
      }
      for (const tool of tools) {
        const left = clips.find(clip => clip.tool === tool && clip.direction === 'left').states.filter(state => state.visible);
        const right = clips.find(clip => clip.tool === tool && clip.direction === 'right').states.filter(state => state.visible);
        assert.equal(left.length, right.length);
        left.forEach((state, index) => {
          assert.ok(Math.abs(state.angle + right[index].angle) < 1e-6, 'Left/right swings mirror around the hand');
          assert.ok(Math.abs(state.originX + right[index].originX - 1) < 1e-6, 'Left/right grip mirrors in the source PNG');
          assert.equal(state.originY, right[index].originY);
        });
      }
      assert.deepEqual(errors, []);
      await page.close();
      // GIF contains four actual game captures: axe above, pickaxe below,
      // left and right beside each other. No sprite painting or resampling.
      const gif = path.join(output, `${character}-machado-picareta.gif`);
      const args = ['-hide_banner', '-loglevel', 'error', '-y', '-threads', '1', '-filter_complex_threads', '1'];
      for (const clip of clips) args.push('-framerate', '18', '-i', path.join(clip.folder, 'frame_%02d.png'));
      args.push('-filter_complex', '[0:v][1:v][2:v][3:v]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0,split[a][b];[a]palettegen[p];[b][p]paletteuse', '-loop', '0', gif);
      const encoded = spawnSync('ffmpeg', args, { encoding: 'utf8' });
      if (encoded.error || encoded.status !== 0) throw Error(`GIF export failed: ${encoded.error?.message || encoded.stderr}`);
      const contact = path.join(output, `${character}-preparacao-impacto-retorno.png`);
      const posterArgs = ['-hide_banner', '-loglevel', 'error', '-y', '-threads', '1', '-filter_complex_threads', '1'];
      for (const clip of clips) for (const index of [3, 6, 9]) posterArgs.push('-i', path.join(clip.folder, `frame_${String(index).padStart(2, '0')}.png`));
      const inputs = Array.from({ length: 12 }, (_, index) => `[${index}:v]`).join('');
      const layout = Array.from({ length: 12 }, (_, index) => `${index % 3 * 400}_${Math.floor(index / 3) * 420}`).join('|');
      const headers = ['Preparação', 'Contato', 'Recuperação'].map((text, index) => `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${text}':x=${index * 400 + 140}:y=8:fontsize=22:fontcolor=0x30472b`).join(',');
      posterArgs.push('-filter_complex', `${inputs}xstack=inputs=12:layout=${layout},pad=iw:ih+34:0:34:color=0xdce3ba,${headers}`, '-frames:v', '1', '-threads', '1', contact);
      const poster = spawnSync('ffmpeg', posterArgs, { encoding: 'utf8' });
      if (poster.error || poster.status !== 0) throw Error(`Contact sheet export failed: ${poster.error?.message || poster.stderr}`);
      report.push({ character, strikes, clips, gif, contact, errors });
      console.log(`PASS ${character}: both tools, mirrored stable grip, original PNGs, contact once, cancel, nine swing poses and GIF`);
    }
    fs.writeFileSync(path.join(output, 'validacao.json'), JSON.stringify({ passed: true, completedAt: new Date().toISOString(), characters: report }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
