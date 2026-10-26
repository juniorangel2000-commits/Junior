const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { walkMapExit } = require('./qa-walk-exit.cjs');

// One Chromium at a time. All captures come from the real Phaser worlds.
const output = process.env.QA_OUT || 'docs/cenarios/transicao-mapas-revisao3';
const url = process.env.QA_URL || 'http://127.0.0.1:5178';

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(45000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url);
    await page.locator('#new-game').click();
    await page.locator('#character-name').fill('Continuação dos mapas');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.locator('.toolbelt').waitFor();
    const attach = () => page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
      window.game = game; window.s = game.scene.getScene('Vale'); window.f = game.scene.getScene('Floresta');
      game.loop.sleep();
    });
    await attach();

    const mapsBeforeEditor = await page.evaluate(() => ({ property: s.state.mapEdits, forest: s.state.forestMapEdits }));
    await page.evaluate(() => game.loop.wake()); await page.keyboard.press('F2');
    await page.locator('.map-editor-ui[data-map-area="property"]').waitFor();
    const propertyEditor = await page.evaluate(() => {
      const scene = game.scene.getScene('Editor'), editor = scene.editor;
      return { points: editor.history.current.points, seamTrees: editor.adapter.objects().filter(object => object.id.includes('-seam-p-')).length,
        sharedGround: scene.children.list.some(object => object.texture?.key === 'map-seam-ground-v1:property') };
    });
    assert.deepEqual(propertyEditor.points, {entry:{x:2,y:52},exit:{x:1,y:52}}); assert.ok(propertyEditor.seamTrees > 0); assert.equal(propertyEditor.sharedGround, true);
    await page.locator('.map-editor-ui [data-map-area="forest"]').click();
    await page.locator('.map-editor-ui[data-map-area="forest"]').waitFor();
    const editorBaseline = await page.evaluate(() => {
      window.es = game.scene.getScene('Editor'); window.ed = es.editor;
      return { map: ed.history.current, seamTrees: ed.adapter.objects().filter(object => object.id.includes('-seam-f-')).length,
        sharedGround: es.children.list.some(object => object.texture?.key === 'map-seam-ground-v1:forest') };
    });
    assert.ok(editorBaseline.seamTrees > 0); assert.equal(editorBaseline.sharedGround, true);
    assert.equal(editorBaseline.map.continuation, 1);
    assert.deepEqual(editorBaseline.map.points, {entry:{x:93,y:52},exit:{x:94,y:52}});
    if (process.env.QA_LAYOUT_DIAGNOSTIC) {
      console.log(JSON.stringify(await page.evaluate(() => {
        const originals = new Set(ed.adapter.originalObjects.map(object => object.id));
        return { error: ed.layoutError(ed.history.current), orphanEdits: Object.entries(ed.history.current.objects).filter(([id]) => !id.startsWith('editor-') && !originals.has(id)) };
      }), null, 2));
      return;
    }
    const targets = await page.evaluate(() => {
      const objects = ed.adapter.objects();
      const tree = objects.find(object => object.id.includes('-seam-f-') && !ed.adapter.protectedTile(object.x, object.y));
      if (!tree) throw Error('No editable seam tree');
      let destination;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = tree.x + dx, y = tree.y + dy;
        if (!ed.adapter.protectedTile(x, y) && !objects.some(object => object.x === x && object.y === y) && ed.adapter.canPlace(x, y, tree.id, tree.kind)) { destination = { x, y }; break; }
      }
      if (!destination) throw Error('No free neighboring tree destination');
      let floor;
      for (let y = 30; y < 40 && !floor; y++) for (let x = 89; x < 94 && !floor; x++) {
        if (!ed.adapter.protectedTerrainTile(x, y) && !objects.some(object => object.x === x && object.y === y)) floor = { x, y };
      }
      if (!floor) throw Error('No editable seam floor');
      return { tree: { id: tree.id, x: tree.x, y: tree.y }, destination, floor };
    });
    const center = point => page.evaluate(point => {
      const camera = es.cameras.main; camera.zoomEffect.reset(); camera.setZoom(1).centerOn((point.x + .5) * 32, (point.y + .5) * 32); camera.preRender();
    }, point);
    await page.locator('.map-editor-ui [data-mode="select"]').click(); await center(targets.tree);
    await page.mouse.move(640, 450); await page.mouse.down();
    await page.mouse.move(640 + (targets.destination.x - targets.tree.x) * 32, 450 + (targets.destination.y - targets.tree.y) * 32, { steps: 3 }); await page.mouse.up();
    assert.deepEqual(await page.evaluate(id => ({ x: ed.history.current.objects[id].x, y: ed.history.current.objects[id].y }), targets.tree.id), targets.destination);
    await page.locator('.map-editor-ui [data-action="undo"]').click();
    assert.deepEqual(await page.evaluate(() => ed.history.current), editorBaseline.map);
    await page.locator('.map-editor-ui [data-terrain="wood"]').click(); await center(targets.floor); await page.mouse.click(640, 450);
    assert.equal(await page.evaluate(point => ed.history.current.terrain[`${point.x},${point.y}`], targets.floor), 'wood', 'Seam ground remains editable');
    await page.locator('.map-editor-ui [data-action="undo"]').click();
    assert.deepEqual(await page.evaluate(() => ed.history.current), editorBaseline.map);
    const downloadPromise = page.waitForEvent('download'); await page.locator('.map-editor-ui [data-action="export"]').click();
    const download = await downloadPromise; const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.deepEqual(exported, editorBaseline.map);
    await page.evaluate(() => {
      const importMap = ed.importMap.bind(ed);
      window.mapImportFinished = false;
      ed.importMap = text => { importMap(text); window.mapImportFinished = true; };
    });
    await page.locator('.map-editor-ui input[type="file"]').setInputFiles({ name: 'After-Rain-forest-mapa.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.waitForFunction(() => window.mapImportFinished);
    assert.equal(await page.evaluate(() => ed.layoutError(ed.history.current)), null);
    assert.deepEqual(await page.evaluate(() => ed.history.current), exported);
    await page.locator('.map-editor-ui [data-action="cancel"]').click(); await page.locator('.map-editor-ui').waitFor({ state: 'detached' }); await attach();
    assert.deepEqual(await page.evaluate(() => ({ property: s.state.mapEdits, forest: s.state.forestMapEdits })), mapsBeforeEditor);
    await page.evaluate(() => game.loop.wake()); await page.keyboard.press('F2');
    await page.locator('.map-editor-ui[data-map-area="property"]').waitFor();
    await page.locator('.map-editor-ui [data-map-area="forest"]').click();
    await page.locator('.map-editor-ui[data-map-area="forest"]').waitFor();
    await page.locator('.map-editor-ui [data-action="apply"]').click();
    await page.locator('.map-editor-ui').waitFor({ state: 'detached' }); await attach();
    assert.deepEqual(await page.evaluate(() => ({ property: s.state.mapEdits, forest: s.state.forestMapEdits })), mapsBeforeEditor);
    console.log('PASS editor in both areas, visible shared ground/trees, tree drag, floor paint, undo, JSON export/import, cancel and Apply');

    if (process.env.QA_EDITOR_ONLY) {
      assert.deepEqual(errors, []);
      const reportPath = path.join(output, 'validacao.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        report.editor.importedRoundTrip = true; report.editor.applyPreservedMaps = true; report.editor.appliedArea = 'forest';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
      }
      return;
    }
    await walkMapExit(page, 'Floresta'); await attach();

    const inspect = async sceneName => page.evaluate(async sceneName => {
      const scene = game.scene.getScene(sceneName), area = sceneName === 'Vale' ? 'property' : 'forest';
      const { seamTreePlan, seamPassage, MAP_SEAM_ROW } = await import('/src/data/map-seam.ts');
      const world = scene.world, map = area === 'property' ? scene.state.mapEdits : scene.state.forestMapEdits;
      const planned = seamTreePlan(area), objects = world.editorObjects;
      const signs = scene.children.list.filter(object => object.getData?.('exitSign') || object.texture?.key?.startsWith('exit-sign'));
      const source = scene.textures.get(`map-seam-ground-v1:${area}`).getSourceImage();
      const ctx = source.getContext('2d'), edge = ctx.getImageData(area === 'forest' ? source.width - 1 : 0, 0, 1, source.height).data;
      const passage = [];
      const range = area === 'forest' ? [84, 94] : [1, 7];
      for (let x = range[0]; x <= range[1]; x++) {
        const blocked = area === 'forest' ? scene.movementBlockedAt(x, MAP_SEAM_ROW) : scene.world.isSolid(x, MAP_SEAM_ROW) || scene.building.isBlocked(x, MAP_SEAM_ROW);
        passage.push({ x, y: MAP_SEAM_ROW, blocked });
      }
      return { area, points: map.points, continuation: map.continuation, revision: scene.state.mapBaseRevision,
        plannedTrees: planned.length, actualTrees: planned.filter(tree => objects.some(object => object.id === tree.id && object.x === tree.x && object.y === tree.y)).length,
        species: [...new Set(planned.map(tree => tree.kind))], passage,
        blockingPassageObjects: objects.filter(object => seamPassage(object.x, object.y, area)),
        resourcesInPassage: world.resources.filter(node => seamPassage(node.x, node.y, area)),
        edge: Array.from(edge), signs: signs.map(object => ({ x: object.x, y: object.y, key: object.texture?.key })) };
    }, sceneName);

    const capture = async sceneName => page.evaluate(async sceneName => {
      const scene = game.scene.getScene(sceneName); game.loop.sleep(); scene.state.time = 720;
      if (scene.updateNight) scene.updateNight(); scene.daylight?.setVisible(false);
      for (const object of scene.children.list) if (/^asset-(tree|pine)(-[012])?$/.test(object.texture?.key ?? '')) object.setAlpha(1);
      // DynamicTexture.snapshot reads the framebuffer immediately. Advancing the
      // game here would mutate the scene between the two area captures.
      const rt = scene.make.renderTexture({ width: 3072, height: 2304 }, false);
      rt.camera.setZoom(1).setScroll(0, 0).setOrigin(0, 0); scene.children.depthSort();
      const objects = scene.children.list.filter(object => object !== scene.player.sprite && object !== scene.selection
        && object !== scene.toolVisual?.sprite && !scene.daylight?.contains(object) && 'visible' in object && object.visible);
      rt.draw(objects);
      return new Promise(resolve => rt.snapshot(image => { const data = image.src; rt.destroy(); resolve(data); }));
    }, sceneName);

    const property = await inspect('Vale');
    assert.equal(property.revision, 3);
    assert.equal(property.continuation, 1);
    assert.deepEqual(property.points, { entry: { x: 2, y: 52 }, exit: { x: 1, y: 52 } });
    assert.equal(property.actualTrees, property.plannedTrees);
    assert.equal(property.signs.length, 1);
    assert.ok(property.passage.every(point => !point.blocked));
    assert.deepEqual(property.resourcesInPassage, []);
    const captures = { property: await capture('Vale') };
    fs.writeFileSync(path.join(output, 'propriedade.png'), Buffer.from(captures.property.split(',')[1], 'base64'));

    await walkMapExit(page, 'Vale'); await attach();
    assert.equal(await page.locator('#ui').getAttribute('data-area'), 'forest');
    const forest = await inspect('Floresta');
    assert.equal(forest.continuation, 1);
    assert.deepEqual(forest.points, { entry: { x: 93, y: 52 }, exit: { x: 94, y: 52 } });
    assert.equal(forest.actualTrees, forest.plannedTrees);
    assert.equal(forest.signs.length, 1);
    assert.equal(forest.signs[0].y, property.signs[0].y, 'Rendered arrow signs share the same world row');
    assert.ok(forest.passage.every(point => !point.blocked));
    assert.deepEqual(forest.resourcesInPassage, []);
    let maxEdgeDifference = 0;
    for (let n = 0; n < property.edge.length; n++) {
      maxEdgeDifference = Math.max(maxEdgeDifference, Math.abs(property.edge[n] - forest.edge[n]));
      if (n % 4 === 3) { assert.equal(property.edge[n], 255); assert.equal(forest.edge[n], 255); }
    }
    assert.ok(maxEdgeDifference <= 1, `Shared ground edge differs by ${maxEdgeDifference}`);
    captures.forest = await capture('Floresta');
    fs.writeFileSync(path.join(output, 'floresta.png'), Buffer.from(captures.forest.split(',')[1], 'base64'));
    const oldExit = await page.evaluate(() => {
      Object.values(f.player.keys).forEach(key => key.isDown = false);
      f.player.x = 94.25 * 32; f.player.y = 46.5 * 32; f.exitPassage.reset(); f.player.keys.D.isDown = true;
      for (let frame = 0; frame < 45; frame++) f.update(0, 1000 / 60);
      f.player.keys.D.isDown = false;
      return { leaving: f.leaving, active: game.scene.isActive('Floresta'), y: f.player.y };
    });
    assert.equal(oldExit.leaving, false); assert.equal(oldExit.active, true, 'Old row46 no longer changes scenes');
    await walkMapExit(page, 'Floresta'); await attach();
    assert.equal(await page.locator('#ui').getAttribute('data-area'), 'property');
    const noBounce = await page.evaluate(() => {
      Object.values(s.player.keys).forEach(key => key.isDown = false);
      for (let frame = 0; frame < 45; frame++) s.update(0, 1000 / 60);
      return { area: s.state.activeArea ?? 'property', forestActive: s.forestActive };
    });
    assert.equal(noBounce.forestActive, false);
    console.log('PASS real walking both ways on row52, old exit disabled, clear lane and matching edge pixels');

    const legacy = await page.evaluate(async () => {
      const { createNewSave, validateSave, SAVE_KEY } = await import('/src/systems/save.ts');
      const { previousDefaultMap } = await import('/src/data/default-maps.ts');
      const { initializeHomestead } = await import('/src/data/property-homestead.ts');
      const data = createNewSave(s.state.profile); data.mapBaseRevision = 2;
      data.mapEdits = previousDefaultMap('property', 2); data.forestMapEdits = previousDefaultMap('forest', 2);
      data.crops = [{ x: 24, y: 22, growth: .4, watered: true }]; initializeHomestead(data);
      data.inventory.wood = 23; data.mapEdits.terrain['12,60'] = 'wood';
      data.forestMapEdits.objects['editor-bush-kept-seam-qa'] = { x: 80, y: 60, kind: 'bush' };
      if (!validateSave(data)) throw Error('Invalid legacy QA fixture');
      // Prevent the old live scene's beforeunload handler overwriting this fixture.
      s.running = false; localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return { wood: data.inventory.wood, crop: data.crops[0], customFloor: data.mapEdits.terrain['12,60'], customObject: data.forestMapEdits.objects['editor-bush-kept-seam-qa'] };
    });
    await page.reload(); await page.locator('#continue-game').click(); await page.locator('.toolbelt').waitFor(); await attach();
    const upgraded = await page.evaluate(async () => {
      const { validateSave } = await import('/src/systems/save.ts');
      return { revision: s.state.mapBaseRevision, property: s.state.mapEdits.points, forest: s.state.forestMapEdits.points,
        wood: s.inventory.data.wood, crop: s.farming.cropAt(24, 22), customFloor: s.state.mapEdits.terrain['12,60'],
        customObject: s.state.forestMapEdits.objects['editor-bush-kept-seam-qa'], valid: validateSave(s.snapshotState()) };
    });
    assert.equal(upgraded.revision, 3); assert.equal(upgraded.wood, legacy.wood); assert.equal(upgraded.customFloor, legacy.customFloor);
    assert.deepEqual(upgraded.customObject, legacy.customObject); assert.equal(upgraded.crop.watered, true);
    assert.ok(upgraded.crop.growth >= legacy.crop.growth && upgraded.crop.growth < legacy.crop.growth + .01);
    assert.deepEqual(upgraded.property, property.points); assert.deepEqual(upgraded.forest, forest.points); assert.equal(upgraded.valid, true);
    assert.deepEqual(errors, []); await page.close();

    const assembled = await browser.newPage({ viewport: { width: 6144, height: 2304 }, deviceScaleFactor: 1 });
    await assembled.setContent('<html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:#000}main{display:flex;width:6144px;height:2304px;gap:0}img{display:block;width:3072px;height:2304px;flex:none}</style></head><body><main><img id="forest"><img id="property"></main></body></html>');
    await assembled.evaluate(async captures => { for (const area of ['forest', 'property']) { const image = document.getElementById(area); image.src = captures[area]; await image.decode(); } }, captures);
    await assembled.screenshot({ path: path.join(output, 'After-Rain-cenarios-unidos-revisao3.png') });
    await assembled.screenshot({ path: path.join(output, 'encaixe-passagem.png'), clip: { x: 2560, y: 1230, width: 1024, height: 900 } });
    await assembled.setViewportSize({ width: 3072, height: 1152 });
    await assembled.addStyleTag({ content: 'main{width:3072px;height:1152px}img{width:1536px;height:1152px;image-rendering:pixelated}' });
    await assembled.screenshot({ path: path.join(output, 'After-Rain-cenarios-unidos-revisao3-previa.png') });
    const compact = info => { const { edge, ...rest } = info; return rest; };
    fs.writeFileSync(path.join(output, 'validacao.json'), JSON.stringify({ passed: true, at: new Date().toISOString(), property: compact(property), forest: compact(forest), maxEdgeDifference,
      oldExit, noBounce, editor: { property: propertyEditor, forest: { seamTrees: editorBaseline.seamTrees, sharedGround: editorBaseline.sharedGround }, targets, treeMoveUndo: true, floorPaintUndo: true, exportedRoundTrip: true, importedRoundTrip: true, cancelPreservedMaps: true, applyPreservedMaps: true, appliedArea: 'forest' },
      legacy: { expected: legacy, upgraded }, joined: { width: 6144, height: 2304, left: 'Floresta Antiga', right: 'Propriedade Abandonada', gap: 0 }, errors }, null, 2) + '\n');
    console.log('PASS revision2 Continue migration and joined real-map previews without HUD or gap');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
