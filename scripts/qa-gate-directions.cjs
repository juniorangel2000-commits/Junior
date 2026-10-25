const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Run serially with the other browser scenarios to keep the Phaser art cache
// within the available memory. Fixtures use existing buildable ground only.
const output = process.env.QA_OUT || 'docs/cenarios/cercado-funcional/direcoes-porteiras';
const combinations = [0, 1, 2, 3].flatMap(rotation => [false, true].map(gateFlip => ({ rotation, gateFlip })));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    fs.mkdirSync(output, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5178');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Quatro direções');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.locator('.toolbelt').waitFor();

    const attach = () => page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
      window.game = game;
      window.s = game.scene.getScene('Vale');
      game.loop.sleep();
    });
    await attach();
    const sites = await page.evaluate(() => {
      s.inventory.data.wood = 200;
      s.state.time = 720;
      s.updateHUD();
      const free = (x, y) => x > 3 && x < 89 && y > 21 && y < 65
        && s.world.isBuildable(x, y) && !s.farming.isPrepared(x, y)
        && !s.farming.cropAt(x, y) && !s.building.at(x, y) && !s.animalOccupies(x, y);
      const patch = (x, y) => [-1, 0, 1].every(dy => [-1, 0, 1].every(dx => free(x + dx, y + dy)));
      const candidates = [];
      for (let y = 24; y < 63; y++) for (let x = 7; x < 83; x++) {
        if (!patch(x, y)) continue;
        const cover = [-1, 0, 1].reduce((sum, dy) => sum + [-1, 0, 1].reduce((n, dx) => n + s.animals.treeCover.cost(x + dx, y + dy), 0), 0);
        candidates.push({ x, y, score: cover * 30 + Math.hypot(x - 25, y - 30) * .05 });
      }
      candidates.sort((a, b) => a.score - b.score);
      const first = candidates.find(point => patch(point.x + 5, point.y));
      if (!first) throw Error('No natural clear pair of horizontal gate sites');
      const chosen = [{ x: first.x, y: first.y }, { x: first.x + 5, y: first.y }];
      for (const point of candidates) {
        if (chosen.length === 8) break;
        if (chosen.every(other => Math.max(Math.abs(point.x - other.x), Math.abs(point.y - other.y)) >= 4)) chosen.push({ x: point.x, y: point.y });
      }
      if (chosen.length !== 8) throw Error('No eight separate natural buildable gate sites');
      return chosen;
    });

    await page.keyboard.press('b');
    await page.locator('[data-build="gate"]').click();
    const initial = await page.evaluate(() => ({ rotation: s.rotation, gateFlip: s.gateFlip, wood: s.inventory.data.wood, count: s.building.buildings.length }));
    assert.equal(initial.rotation, 0);
    assert.equal(initial.gateFlip, false);
    const rotationCycle = [0];
    for (const expected of [1, 2, 3, 0]) {
      await page.keyboard.press('r');
      const value = await page.evaluate(() => s.rotation);
      assert.equal(value, expected, 'R advances through all four orientations');
      rotationCycle.push(value);
    }
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(() => s.gateFlip), true, 'F reverses the swing before placement');
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(() => s.gateFlip), false, 'F restores the original swing');
    assert.deepEqual(await page.evaluate(() => ({ wood: s.inventory.data.wood, count: s.building.buildings.length })), { wood: initial.wood, count: initial.count }, 'Preview rotation and flip consume no material');

    const aimAt = point => page.evaluate(point => {
      s.player.x = (point.x + .5) * 32;
      s.player.y = (point.y + 1.5) * 32;
      s.player.facing = { x: 0, y: -1 };
      s.lastAim = { x: point.x, y: point.y };
      s.aimUntil = s.time.now + 100000;
      s.nextInteractionAt = 0;
    }, point);
    const orient = async expected => {
      for (let attempts = 0; await page.evaluate(() => s.rotation) !== expected.rotation; attempts++) {
        assert.ok(attempts < 4, 'R reaches the requested orientation');
        await page.keyboard.press('r');
      }
      if (await page.evaluate(() => s.gateFlip) !== expected.gateFlip) await page.keyboard.press('f');
    };
    const placed = [];
    for (const [index, expected] of combinations.entries()) {
      await orient(expected);
      await aimAt(sites[index]);
      const before = await page.evaluate(() => s.inventory.data.wood);
      await page.keyboard.press('e');
      const result = await page.evaluate(point => ({
        gate: { ...s.building.at(point.x, point.y) },
        blocked: s.building.isBlocked(point.x, point.y),
        wood: s.inventory.data.wood,
        message: document.querySelector('.toast-stack')?.innerText,
      }), sites[index]);
      assert.equal(result.gate.kind, 'gate', result.message || 'E constructs the selected gate');
      assert.equal(result.gate.rotation, expected.rotation);
      assert.equal(result.gate.gateFlip ?? false, expected.gateFlip);
      assert.equal(result.gate.open, false);
      assert.equal(result.blocked, true);
      assert.equal(before - result.wood, 4, 'Each placed gate consumes its construction cost once');
      placed.push({ ...sites[index], ...expected });
    }

    // The first two real gates provide a close view of the two horizontal swings.
    await page.evaluate(points => {
      for (const point of points.slice(0, 2)) for (const dx of [-1, 1]) {
        const x = point.x + dx, y = point.y;
        const result = s.building.place('fence', x, y, s.inventory, s.freeForBuilding(x, y, 'fence'), { nearWorkbench: false, day: s.state.day });
        if (!result.ok) throw Error(result.message);
      }
      s.afterAction();
    }, sites);
    const captureHorizontal = async filename => {
      await page.evaluate(first => {
        s.selectTool('hand');
        s.selection.clear();
        s.player.x = (first.x - .5) * 32;
        s.player.y = (first.y + 1.5) * 32;
        s.player.update(0, s.movementBlocked, s.movementBlockedPoint, true, s.swimmingPoint);
        s.cameras.main.stopFollow().setZoom(4.5).centerOn((first.x + 3) * 32, (first.y + .5) * 32 - 10);
        s.state.time = 720;
        s.updateNight();
        for (const object of s.children.list) if (/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(object.texture?.key ?? '')) object.setVisible(false);
        document.querySelector('#ui').style.visibility = 'hidden';
        game.step(s.time.now + 1, 0);
      }, sites[0]);
      await page.screenshot({ path: path.join(output, filename) });
      await page.evaluate(() => { document.querySelector('#ui').style.visibility = ''; });
    };
    await captureHorizontal('porteiras-horizontais-fechadas.png');

    const toggle = async (point, open) => {
      await aimAt(point);
      await page.keyboard.press('e');
      const result = await page.evaluate(point => ({
        open: s.building.at(point.x, point.y).open,
        blocked: s.building.isBlocked(point.x, point.y),
        rotation: s.building.at(point.x, point.y).rotation,
        gateFlip: s.building.at(point.x, point.y).gateFlip ?? false,
      }), point);
      assert.equal(result.open, open, `E ${open ? 'opens' : 'closes'} orientation ${point.rotation}, flip ${point.gateFlip}`);
      assert.equal(result.blocked, !open);
      assert.equal(result.rotation, point.rotation, 'E preserves orientation');
      assert.equal(result.gateFlip, point.gateFlip, 'E preserves swing direction');
    };
    await page.evaluate(() => s.selectTool('hand'));
    const woodBeforeToggle = await page.evaluate(() => s.inventory.data.wood);
    for (const point of placed) {
      await toggle(point, true);
      await toggle(point, false);
      await toggle(point, true);
    }
    await captureHorizontal('porteiras-horizontais-abertas.png');
    // Same scale, closed on the left and open on the right, for a direct size
    // comparison. Restore the open state before the persistence checks below.
    await toggle(placed[0],false);
    await captureHorizontal('porteira-horizontal-encaixe-medido.png');
    await toggle(placed[0],true);
    // Persist a mix of open and closed gates, including both values of gateFlip.
    for (const [index, point] of placed.entries()) if (index % 3 === 1) await toggle(point, false);
    assert.equal(await page.evaluate(() => s.inventory.data.wood), woodBeforeToggle, 'Opening and closing consume no material');
    const saved = await page.evaluate(async points => {
      s.persist();
      return {
        gates: points.map(point => ({ ...s.building.at(point.x, point.y) })),
        wood: s.inventory.data.wood,
        valid: (await import('/src/systems/save.ts')).validateSave(s.state),
      };
    }, placed);
    assert.equal(saved.valid, true, 'Four gate directions and gateFlip form a valid save');
    await page.reload();
    await page.locator('#continue-game').click();
    await page.locator('.toolbelt').waitFor();
    await attach();
    const reloaded = await page.evaluate(async points => ({
      gates: points.map(point => ({ ...s.building.at(point.x, point.y) })),
      blocked: points.map(point => s.building.isBlocked(point.x, point.y)),
      wood: s.inventory.data.wood,
      valid: (await import('/src/systems/save.ts')).validateSave(s.state),
    }), placed);
    assert.deepEqual(reloaded.gates, saved.gates, 'Reload preserves every gate direction, flip and open state');
    assert.equal(reloaded.wood, saved.wood);
    assert.equal(reloaded.valid, true);
    reloaded.gates.forEach((gate, index) => assert.equal(reloaded.blocked[index], !gate.open));

    const artwork = await page.evaluate(points => {
      const describe = key => {
        if (!s.textures.exists(key)) throw Error('Missing gate texture: ' + key);
        const source = s.textures.get(key).getSourceImage();
        const scratch = document.createElement('canvas');
        scratch.width = source.width; scratch.height = source.height;
        const ctx = scratch.getContext('2d');
        ctx.drawImage(source, 0, 0);
        const pixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
        let alpha = 0, x = 0, y = 0, hash = 2166136261;
        for (let n = 0; n < pixels.length; n++) hash = Math.imul(hash ^ pixels[n], 16777619) >>> 0;
        for (let n = 3; n < pixels.length; n += 4) if (pixels[n] > 80) {
          alpha++; x += ((n - 3) / 4) % scratch.width; y += Math.floor(((n - 3) / 4) / scratch.width);
        }
        return { key, width: scratch.width, height: scratch.height, alpha, centroid: { x: alpha ? x / alpha : 0, y: alpha ? y / alpha : 0 }, hash };
      };
      const textures = [];
      for (const rotation of [0, 1, 2, 3]) for (const flip of [false, true]) for (const open of [false, true]) {
        const key = `gate-${rotation}-${flip ? 'flipped' : 'normal'}-${open ? 'open' : 'closed'}`;
        textures.push(describe(key));
        for (const layer of [0, 1, 2]) textures.push(describe(`${key}-${layer}`));
      }
      const layers = points.map(point => {
        const gate = s.building.at(point.x, point.y);
        const expected = `gate-${gate.rotation}-${gate.gateFlip ? 'flipped' : 'normal'}-${gate.open ? 'open' : 'closed'}`;
        return { expected, sprites: s.buildingSprites.filter(sprite => sprite.getData('gate') && sprite.x === point.x * 32 + 16 && sprite.y === point.y * 32 + 16).map(sprite => ({ key: sprite.texture.key, layer: sprite.getData('gateLayer'), depth: sprite.depth })) };
      });
      // A labelled reference sheet uses the game's loaded sprite textures. The
      // two screenshots above remain the evidence for their in-game appearance.
      const canvas = document.createElement('canvas');
      canvas.width = 1280; canvas.height = 1410;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#30472b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f4dfb7'; ctx.font = 'bold 25px Georgia';
      ctx.fillText('AFTER RAIN · TEXTURAS REAIS DO JOGO', 24, 36);
      ctx.font = '17px Georgia';
      ctx.fillText('Referência de sprites · R gira a dobradiça · F inverte o lado da abertura', 24, 66);
      const names = ['Dobradiça esquerda', 'Dobradiça norte', 'Dobradiça direita', 'Dobradiça sul'];
      const opening = ['norte', 'leste', 'sul', 'oeste'];
      for (const rotation of [0, 1, 2, 3]) for (const flip of [false, true]) for (const open of [false, true]) {
        const column = rotation, row = (flip ? 2 : 0) + (open ? 1 : 0), x = column * 320, y = 95 + row * 325;
        ctx.fillStyle = '#f4dfb7'; ctx.font = 'bold 18px Georgia';
        ctx.fillText(`R${rotation} · ${names[rotation]}`, x + 14, y + 18);
        ctx.font = '17px Georgia';
        ctx.fillText(`${flip ? 'F invertido' : 'Normal'} · ${open ? 'Aberta' : 'Fechada'}`, x + 14, y + 42);
        ctx.fillText(`Abre para ${opening[(rotation + (flip ? 2 : 0)) % 4]}`, x + 14, y + 65);
        const source = s.textures.get(`gate-${rotation}-${flip ? 'flipped' : 'normal'}-${open ? 'open' : 'closed'}`).getSourceImage();
        const ratio = Math.min(240 / source.width, 245 / source.height);
        ctx.drawImage(source, x + (320 - source.width * ratio) / 2, y + 72, source.width * ratio, source.height * ratio);
      }
      return { textures, layers, image: canvas.toDataURL('image/png') };
    }, placed);
    assert.equal(artwork.textures.length, 64, 'Every direction, flip, open state and render layer is loaded');
    for (const texture of artwork.textures.filter(texture => !/-[012]$/.test(texture.key))) assert.ok(texture.alpha > 0, `${texture.key} contains art`);
    for (const result of artwork.layers) {
      assert.equal(result.sprites.length, 3, 'Each real gate uses all three sorted render layers');
      assert.deepEqual(result.sprites.map(sprite => sprite.layer).sort(), [0, 1, 2]);
      for (const sprite of result.sprites) assert.equal(sprite.key, `${result.expected}-${sprite.layer}`);
    }
    // Measure the actual loaded pixels: a 90-degree profile must match the
    // closed leaf's span and stay joined to both iron straps at the hinge.
    const horizontalProfiles = await page.evaluate(() => {
      const profiles=[];
      for(const rotation of [0,2])for(const flip of [false,true]){
        const prefix=`gate-${rotation}-${flip?'flipped':'normal'}`;
        const pixelsOf=key=>{
          const image=s.textures.get(key).getSourceImage();
          return {pixels:image.getContext('2d').getImageData(0,0,image.width,image.height).data,width:image.width,height:image.height};
        };
        const bounds=(data,yStart=0,yEnd=data.height,xStart=0,xEnd=data.width)=>{
          let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
          for(let y=yStart;y<yEnd;y++)for(let x=xStart;x<xEnd;x++)if(data.pixels[(y*data.width+x)*4+3]>80){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
          return {minX,maxX,minY,maxY,width:(maxX-minX+1)/4,height:(maxY-minY+1)/4};
        };
        const panel=pixelsOf(`${prefix}-open-1`),profile=bounds(panel),closed=bounds(pixelsOf(`${prefix}-closed-1`));
        const post=pixelsOf(`${prefix}-open-0`),endHinge=rotation===2;
        const joints=[48,57].map(y=>{
          const edge=bounds(panel,y*4,(y+1)*4);
          const hinge=bounds(post,y*4,(y+1)*4,(endHinge?42:14)*4,(endHinge?50:22)*4);
          return {y,gap:Math.max(0,endHinge?hinge.minX-edge.maxX-1:edge.minX-hinge.maxX-1)/4};
        });
        profiles.push({rotation,gateFlip:flip,width:profile.width,height:profile.height,closedWidth:closed.width,
          left:profile.minX/4,right:(profile.maxX+1)/4,top:profile.minY/4,bottom:(profile.maxY+1)/4,joints});
      }
      return profiles;
    });
    for(const profile of horizontalProfiles){
      assert.equal(profile.width,3);
      assert.equal(profile.height,profile.closedWidth,'Opened profile matches the closed leaf span');
      assert.equal(profile.height,28);
      assert.equal(profile.left,profile.rotation===2?40:21);
      assert.equal(profile.right,profile.rotation===2?43:24);
      for(const joint of profile.joints)assert.equal(joint.gap,0,`No gap at hinge strap y${joint.y}`);
    }
    const swings = [];
    for (const rotation of [0, 1, 2, 3]) for (const flip of [false, true]) {
      const key = `gate-${rotation}-${flip ? 'flipped' : 'normal'}`;
      const closed = artwork.textures.find(texture => texture.key === `${key}-closed-1`);
      const open = artwork.textures.find(texture => texture.key === `${key}-open-1`);
      assert.ok(closed.alpha > 0 && open.alpha > 0, 'The gate panel exists in both states');
      const direction = (rotation + (flip ? 2 : 0)) % 4;
      const delta = direction % 2 ? open.centroid.x - closed.centroid.x : open.centroid.y - closed.centroid.y;
      assert.ok((direction === 0 || direction === 3 ? -delta : delta) > 2, `${key} visibly opens towards ${['north', 'east', 'south', 'west'][direction]}`);
      swings.push({ rotation, gateFlip: flip, direction: ['north', 'east', 'south', 'west'][direction], closedCentroid: closed.centroid, openCentroid: open.centroid });
    }
    for (const rotation of [0, 1, 2, 3]) assert.notEqual(
      artwork.textures.find(texture => texture.key === `gate-${rotation}-normal-open-1`).hash,
      artwork.textures.find(texture => texture.key === `gate-${rotation}-flipped-open-1`).hash,
      'F visibly changes the open panel texture',
    );
    fs.writeFileSync(path.join(output, 'porteiras-quatro-direcoes-texturas.png'), Buffer.from(artwork.image.split(',')[1], 'base64'));
    delete artwork.image;
    assert.deepEqual(errors, [], 'The full scenario loads without runtime errors or failed asset responses');
    fs.writeFileSync(path.join(output, 'direcoes-validacao.json'), JSON.stringify({ rotationCycle, placed, saved, reloaded, swings,horizontalProfiles, ...artwork, errors }, null, 2));
    console.log('PASS: UI R cycles four orientations, F reverses opening, eight real E placements, E toggles, collision, persisted state, 64 loaded textures and visible swing directions');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
