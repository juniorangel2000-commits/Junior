const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Run on its own: the cottage, its lighting and its saved garden share the real
// property scene. Captures hide trees only; no map objects are deleted.
const output = process.env.QA_OUT || 'docs/cenarios/casa-0.9.8';
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const attach = () => page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
      window.game = game; window.s = game.scene.getScene('Vale'); game.loop.sleep();
      window.qt = s.time.now;
      window.step = ms => { qt += ms; game.step(qt, ms); };
    });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5178');
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Casa e jardim');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.locator('.toolbelt').waitFor(); await attach();

    const layout = await page.evaluate(async () => {
      const { HOMESTEAD_HOUSE, HOMESTEAD_GARDEN, HOMESTEAD_GATE, homesteadGardenBeds, homesteadResourceReserved } = await import('/src/data/property-homestead.ts');
      const { WELL_BASE, PROPERTY_WELL, WELL_SOURCE_FOOT, WELL_SHADOW_FOOT } = await import('/src/data/property-well.ts');
      const { HOUSE_FOOT, HOUSE_SPRITE_SIZE, HOUSE_WINDOW_LIGHTS, HOUSE_SHADOW_FOOT } = await import('/src/house-sprites.ts');
      const house = s.children.list.find(object => object.texture?.key === 'asset-house');
      if (!house) throw Error('Missing cottage sprite');
      const source = s.textures.get('house-cottage-source').getSourceImage();
      const original = new Image(); original.src = 'assets/visual/architecture/authored-cottage.png'; await original.decode();
      const pixels = image => { const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0); return ctx.getImageData(0, 0, c.width, c.height).data; };
      const loaded = pixels(source), native = pixels(original);
      const well = s.world.well.sprite, wellImage = well.texture.getSourceImage(), wellPixels = pixels(wellImage);
      let wellFoot = 0;
      for (let y = 0; y < wellImage.height; y++) for (let x = 0; x < wellImage.width; x++) if (wellPixels[(y * wellImage.width + x) * 4 + 3] >= 80) wellFoot = Math.max(wellFoot, y + 1);
      const rendered = s.textures.get('asset-house').getSourceImage(), glass = s.textures.get('asset-house-window-glow').getSourceImage();
      const art = pixels(rendered), mask = pixels(glass);
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity, partialAlpha = 0, glowOutside = 0, glowPixels = 0;
      for (let y = 0; y < rendered.height; y++) for (let x = 0; x < rendered.width; x++) {
        const alpha = art[(y * rendered.width + x) * 4 + 3];
        if (alpha) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
        if (alpha > 0 && alpha < 255) partialAlpha++;
        if (mask[(y * glass.width + x) * 4 + 3]) {
          glowPixels++;
          if (!HOUSE_WINDOW_LIGHTS.some(pane => x >= Math.floor(pane.x) - 1 && x <= Math.ceil(pane.x + pane.width) + 1 && y >= Math.floor(pane.y) - 1 && y <= Math.ceil(pane.y + pane.height) + 1)) glowOutside++;
        }
      }
      const expectedWindows = HOUSE_WINDOW_LIGHTS.map(pane => ({ x: house.x + (pane.x + pane.width / 2 - house.width * house.originX) * house.scaleX, y: house.y + (pane.y + pane.height / 2 - house.height * house.originY) * house.scaleY }));
      const garden = s.building.buildings.filter(piece => piece.x >= HOMESTEAD_GARDEN.left && piece.x <= HOMESTEAD_GARDEN.right && piece.y >= HOMESTEAD_GARDEN.top && piece.y <= HOMESTEAD_GARDEN.bottom);
      const beds = homesteadGardenBeds();
      return { house: { x: house.x, y: house.y, scaleX: house.scaleX, scaleY: house.scaleY, originX: house.originX, originY: house.originY, width: house.width, height: house.height,
        footY: house.y + (HOUSE_FOOT.y - house.height * house.originY) * house.scaleY, shadowFoot: HOUSE_SHADOW_FOOT },
        native: { width: source.width, height: source.height, identical: loaded.length === native.length && loaded.every((value, index) => value === native[index]) },
        rendered: { width: rendered.width, height: rendered.height, alphaBounds: { left, top, width: right - left + 1, height: bottom - top + 1 }, partialAlpha },
        well: { sourceFoot: wellFoot, authoredFoot: WELL_SOURCE_FOOT, shadowFoot: WELL_SHADOW_FOOT, visibleFootY: well.y + (wellFoot - wellImage.height * well.originY) * well.scaleY },
        constants: { HOMESTEAD_HOUSE, HOMESTEAD_GARDEN, HOMESTEAD_GATE, WELL_BASE, PROPERTY_WELL, HOUSE_SPRITE_SIZE },
        garden, preparedBeds: beds.filter(point => s.farming.isPrepared(point.x, point.y)),
        reservedResources: s.world.resources.filter(node => homesteadResourceReserved(node.x, node.y)),
        houseWindows: s.daylight.windows, expectedWindows, glow: { pixels: glowPixels, outside: glowOutside }, revision: s.state.homesteadRevision };
    });
    assert.deepEqual(layout.native, { width: 256, height: 256, identical: true }, 'Uploaded source PNG remains intact');
    assert.equal(layout.house.scaleX, layout.house.scaleY, 'Cottage scales proportionally');
    assert.equal(layout.house.footY, layout.constants.HOMESTEAD_HOUSE.groundY);
    assert.equal(layout.well.sourceFoot, 247); assert.equal(layout.well.sourceFoot, layout.well.authoredFoot);
    assert.ok(Math.abs(layout.well.visibleFootY - layout.house.footY) < 1e-8, 'Visible house and well feet sit on the same ground');
    assert.equal(layout.well.shadowFoot, 247 / 256);
    assert.equal(layout.house.shadowFoot, 216 / 224);
    assert.deepEqual(layout.rendered.alphaBounds, { left: 26, top: 4, width: 205, height: 212 });
    assert.equal(layout.rendered.partialAlpha, 0, 'No translucent fringe around the cottage');
    assert.equal(layout.garden.filter(piece => piece.kind === 'fence').length, 25);
    assert.equal(layout.garden.filter(piece => piece.kind === 'gate').length, 1);
    assert.equal(layout.preparedBeds.length, 30);
    assert.deepEqual(layout.reservedResources, [], 'Garden and door path remain free of random resources');
    assert.equal(layout.revision, 1);
    assert.equal(layout.glow.outside, 0, 'Window glow never paints roof or facade outside glass openings');
    assert.ok(layout.glow.pixels > 0);
    assert.equal(layout.houseWindows.length, 2);
    layout.houseWindows.forEach((point, index) => { assert.ok(Math.abs(point.x - layout.expectedWindows[index].x) < 1e-8); assert.ok(Math.abs(point.y - layout.expectedWindows[index].y) < 1e-8); });

    const smoke = await page.evaluate(() => {
      const plumes = s.children.list.filter(object => object.getData?.('houseSmoke'));
      if (plumes.length !== 1) throw Error(`Expected one smoke object, got ${plumes.length}`);
      const plume = plumes[0]; step(0); const start = Array.from(plume.commandBuffer);
      for (let frame = 0; frame < 18; frame++) step(100);
      const middle = Array.from(plume.commandBuffer);
      for (let frame = 0; frame < 18; frame++) step(100);
      const loop = Array.from(plume.commandBuffer);
      return { count: plumes.length, visible: plume.visible, commands: start.length, middleCommands: middle.length, loopCommands: loop.length,
        moves: start.some((value, index) => Math.abs(value - middle[index]) > .01), loopError: Math.max(...start.map((value, index) => Math.abs(value - loop[index]))) };
    });
    assert.equal(smoke.visible, true); assert.ok(smoke.moves); assert.ok(smoke.commands > 0 && smoke.commands < 3000);
    assert.equal(smoke.middleCommands, smoke.commands); assert.equal(smoke.loopCommands, smoke.commands);
    assert.ok(smoke.loopError < 1e-6, 'Six bounded puffs loop without accumulating objects');

    const captures = [];
    for (const [name, minute] of [['dia', 720], ['noite', 1290]]) {
      const light = await page.evaluate(async minute => {
        const { setVisualSettings } = await import('/src/visual-settings.ts'); setVisualSettings({ daylight: true, intensity: 1, dynamicLighting: true });
        s.state.time = minute; s.updateNight(); s.updateHUD();
        for (const object of s.children.list) if (/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(object.texture?.key ?? '')) object.setVisible(false);
        s.cameras.main.stopFollow(); s.cameras.main.zoomEffect.reset(); s.cameras.main.setZoom(1.65).centerOn(730, 415);
        s.selection.clear(); document.querySelector('#ui').style.visibility = 'hidden'; step(0);
        const house = s.children.list.find(object => object.texture?.key === 'asset-house');
        const houseShadow = s.children.list.find(object => /^solar-silhouette:.*:asset-house:/.test(object.texture?.key ?? ''));
        const wellShadow = s.children.list.find(object => /^solar-silhouette:.*:property-well-(idle|use):/.test(object.texture?.key ?? ''));
        return { paneAlpha: s.daylight.panes.alpha, paneVisible: s.daylight.panes.visible, shaderVisible: s.daylight.shader?.visible,
          paneAligned: s.daylight.panes.x === house.x && s.daylight.panes.y === house.y && s.daylight.panes.originX === house.originX && s.daylight.panes.originY === house.originY,
          houseShadow: houseShadow ? { x: houseShadow.x, y: houseShadow.y, visible: houseShadow.visible } : undefined,
          wellShadow: wellShadow ? { x: wellShadow.x, y: wellShadow.y, visible: wellShadow.visible } : undefined,
          shaderWindows: s.daylight.shader ? [s.daylight.shader.uniforms.windowA.value, s.daylight.shader.uniforms.windowB.value] : undefined };
      }, minute);
      assert.equal(light.paneAligned, true);
      if (name === 'noite') { assert.equal(light.paneVisible, true); assert.ok(light.paneAlpha > .5); }
      else {
        assert.equal(light.paneVisible, false); assert.ok(light.houseShadow);
        assert.ok(Math.abs(light.houseShadow.y - layout.house.footY - .25) < 1e-8, 'Solar shadow starts at the actual house foot');
        assert.ok(light.wellShadow); assert.ok(Math.abs(light.wellShadow.y - layout.well.visibleFootY - .25) < 1e-8, 'Well shadow starts at its visible grass/stone foot');
      }
      if (light.shaderWindows) light.shaderWindows.forEach((point, index) => {
        assert.ok(Math.abs(point.x - layout.expectedWindows[index].x) < 1e-8);
        assert.ok(Math.abs(point.y - layout.expectedWindows[index].y) < 1e-8);
      });
      await page.screenshot({ path: path.join(output, `casa-horta-poco-${name}.png`) });
      captures.push({ name, minute, ...light });
    }
    await page.evaluate(() => { document.querySelector('#ui').style.visibility = ''; });
    console.log('PASS cottage art, garden/fences/beds, well alignment, window lighting, looping smoke and day/night captures');

    // Exercise the real continue/save path with a pre-upgrade game. Its crop,
    // furniture, construction, prepared soil and inventory must win over defaults.
    const legacy = await page.evaluate(async () => {
      const { createNewSave, SAVE_KEY, validateSave } = await import('/src/systems/save.ts');
      const { createDefaultHome } = await import('/src/systems/home.ts');
      const data = createNewSave(s.state.profile);
      data.home = { ...createDefaultHome(), floor: 'dark', wall: 'clay' };
      data.crops = [{ x: 24, y: 22, watered: true, growth: .4 }]; data.preparedSoil = [{ x: 12, y: 20 }];
      data.buildings = [{ x: 12, y: 10, kind: 'bench' }]; data.inventory.wood = 17;
      delete data.homesteadRevision;
      if (!validateSave(data)) throw Error('Legacy QA fixture is invalid before upgrade');
      // The real unload handler must not replace this test fixture with the
      // current demonstration game while the browser navigates to Continue.
      s.running = false;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return { crop: data.crops[0], building: data.buildings[0], home: data.home, wood: data.inventory.wood };
    });
    await page.reload(); await page.locator('#continue-game').click(); await page.locator('.toolbelt').waitFor(); await attach();
    const migrated = await page.evaluate(() => ({ revision: s.state.homesteadRevision, crop: s.farming.cropAt(24, 22), home: s.home.data,
      building: s.building.at(12, 10), wood: s.inventory.data.wood, prepared: s.farming.isPrepared(12, 20) }));
    assert.equal(migrated.revision, 1); assert.deepEqual(migrated.home, legacy.home); assert.deepEqual(migrated.building, legacy.building);
    assert.equal(migrated.wood, legacy.wood); assert.equal(migrated.prepared, true); assert.equal(migrated.crop.watered, true);
    assert.ok(migrated.crop.growth >= legacy.crop.growth && migrated.crop.growth < legacy.crop.growth + .01);
    const removed = await page.evaluate(async () => {
      const { homesteadGardenBeds } = await import('/src/data/property-homestead.ts');
      const index = s.building.buildings.findIndex(piece => piece.kind === 'fence'); const fence = { ...s.building.buildings[index] }; s.building.buildings.splice(index, 1);
      const bed = homesteadGardenBeds()[0], soilIndex = s.farming.preparedSoil.findIndex(point => point.x === bed.x && point.y === bed.y); s.farming.preparedSoil.splice(soilIndex, 1);
      s.afterAction(); if (!s.persist()) throw Error('Save after removing starter fence/soil failed');
      return { fence, bed };
    });
    await page.reload(); await page.locator('#continue-game').click(); await page.locator('.toolbelt').waitFor(); await attach();
    const onceOnly = await page.evaluate(removed => ({ fenceMissing: !s.building.at(removed.fence.x, removed.fence.y), bedMissing: !s.farming.isPrepared(removed.bed.x, removed.bed.y), revision: s.state.homesteadRevision }), removed);
    assert.deepEqual(onceOnly, { fenceMissing: true, bedMissing: true, revision: 1 });
    console.log('PASS actual legacy continue/reload, preserved crop/building/furniture/stock and one-time garden upgrade');

    const walkThroughDoor = async (key, enter) => {
      await page.evaluate(async enter => {
        const { HOME_OUTDOOR_DOORWAY, HOME_SPAWN } = await import('/src/systems/home.ts');
        if (enter) { s.player.x = HOME_OUTDOOR_DOORWAY.x; s.player.y = HOME_OUTDOOR_DOORWAY.y + 24; }
        else { s.player.x = HOME_SPAWN.x; s.player.y = HOME_SPAWN.y; }
        s.player.facing = { x: 0, y: enter ? -1 : 1 }; s.homePassage.reset(); s.selectTool('hand');
        s.player.update(0, s.movementBlocked, s.movementBlockedPoint, false, s.swimmingPoint); step(0);
      }, enter);
      await page.keyboard.down(key);
      const result = await page.evaluate(enter => {
        let frames = 0, triggeredAt, swappedAt, fadeDuration;
        for (; frames < 180; frames++) { step(1000 / 60); if (s.homeTransitionActive && triggeredAt === undefined) { triggeredAt = qt; fadeDuration = s.cameras.main.fadeEffect.duration; }
          if (s.inHome === enter && !s.homeTransitionActive) { swappedAt = qt; break; } }
        return { frames, triggered: triggeredAt !== undefined, duration: swappedAt - triggeredAt, fadeDuration, inHome: s.inHome, x: s.player.x, y: s.player.y };
      }, enter);
      await page.keyboard.up(key);
      assert.equal(result.triggered, true, 'Walking through the marked door starts a transition without E');
      assert.equal(result.inHome, enter); assert.equal(result.fadeDuration, 120); assert.ok(result.duration >= 100 && result.duration <= 150);
      return result;
    };
    const entry = await walkThroughDoor('w', true);
    const interior = await page.evaluate(() => { for (let i = 0; i < 60; i++) step(1000 / 60); return { inHome: s.inHome, home: s.home.data,
      smokeHidden: s.children.list.filter(object => object.getData?.('houseSmoke')).every(object => !object.visible), saved: s.persist() }; });
    assert.equal(interior.inHome, true); assert.equal(interior.smokeHidden, true); assert.deepEqual(interior.home, legacy.home); assert.equal(interior.saved, true);
    await page.reload(); await page.locator('#continue-game').click(); await page.locator('.hud.in-home').waitFor(); await attach();
    const insideReload = await page.evaluate(() => { for (let i = 0; i < 60; i++) step(1000 / 60); return { inHome: s.inHome, home: s.home.data, x: s.player.x, y: s.player.y }; });
    assert.equal(insideReload.inHome, true, 'Reloading inside never bounces through the door'); assert.deepEqual(insideReload.home, legacy.home);
    await page.keyboard.press('h'); await page.getByRole('dialog', { name: 'Personalizar minha casa' }).waitFor(); await page.keyboard.press('Escape');
    await page.evaluate(() => { s.nextInteractionAt = 0; }); await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => !!s.state.homeSupplies?.wateringCan), true, 'E still collects the original indoor watering can');
    assert.equal(await page.getByRole('dialog', { name: 'Personalizar minha casa' }).count(), 0, 'E does not open furniture customization');
    const exit = await walkThroughDoor('s', false);
    const outside = await page.evaluate(() => { for (let i = 0; i < 60; i++) step(1000 / 60); return { inHome: s.inHome,
      smokeVisible: s.children.list.filter(object => object.getData?.('houseSmoke')).every(object => object.visible), position: { x: s.player.x, y: s.player.y } }; });
    assert.equal(outside.inHome, false, 'Exterior arrival never re-enters the house'); assert.equal(outside.smokeVisible, true);
    await page.evaluate(() => { s.nextInteractionAt = 0; }); await page.keyboard.press('e'); assert.equal(await page.evaluate(() => s.inHome), false, 'E beside the exterior door does not enter');
    assert.deepEqual(errors, []);
    const report = { passed: true, at: new Date().toISOString(), sourceSha256: crypto.createHash('sha256').update(fs.readFileSync('public/assets/visual/architecture/authored-cottage.png')).digest('hex'), layout, smoke, captures,
      legacy: { expected: legacy, migrated, removed, onceOnly }, door: { entry, interior, insideReload, exit, outside, hCustomization: true, eIndoorInteraction: true }, errors };
    fs.writeFileSync(path.join(output, 'validacao.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('PASS automatic W/S doors, 120ms fades, unchanged indoor furniture, inside reload, E/H and smoke visibility');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
