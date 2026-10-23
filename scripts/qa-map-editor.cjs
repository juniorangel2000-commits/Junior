const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    const attach = async () => {
      await page.locator('#edit-map').waitFor();
      await page.evaluate(async () => { const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.scene = game.scene.scenes[0]; });
    };
    const wait = () => page.waitForTimeout(120);
    const editor = () => page.locator('.map-editor-ui');
    const action = async name => { console.log('action', name); await editor().locator(`[data-action="${name}"]`).click(); await wait(); if(name==='apply') console.log('apply-result', await page.evaluate(()=>({editing:scene.editingMap,status:document.querySelector('.map-editor-ui [data-status]')?.textContent}))); };
    const tool = async (mode, kind) => {
      const selector = `[data-mode="${mode}"]${kind ? `[data-${mode === 'terrain' ? 'terrain' : 'object'}="${kind}"]` : ''}`;
      await editor().locator(selector).click();
    };
    const focus = async tile => {
      await page.evaluate(({ x, y }) => { const c = scene.cameras.main; c.setZoom(1).centerOn(x * 32 + 16 - (760 - c.width / 2), y * 32 + 16 - (430 - c.height / 2)); c.preRender(); }, tile); await wait();
    };
    const screen = tile => page.evaluate(({ x, y }) => { const c = scene.cameras.main; c.preRender(); const p = c.getWorldPoint(0, 0); return { x: ((x + .5) * 32 - p.x) * c.zoom, y: ((y + .5) * 32 - p.y) * c.zoom }; }, tile);
    const clickTile = async tile => { const p = await screen(tile); await page.mouse.click(p.x, p.y); await wait(); };
    const edits = () => page.evaluate(() => scene.mapEditor.history.current);
    const save = () => page.evaluate(() => localStorage.getItem('depois-da-chuva-v1'));
    await page.goto('http://127.0.0.1:5173'); await attach();
    await page.locator('#edit-map').click(); await editor().waitFor();
    assert.equal(await save(), null, 'opening editor from title does not create a save');
    await action('cancel'); assert.equal(await save(), null);
    const profile = { name: 'Teste do editor', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' };
    await page.evaluate(profile => scene.startNew(profile), profile); await wait();
    await page.evaluate(() => { scene.inventory.data.wood = 13; scene.state.homeSupplies = { wateringCan: true, seedPacket: true }; scene.persist(); });
    const before = await save();
    await page.keyboard.press('F2'); await editor().waitFor();
    const tile = await page.evaluate(() => {
      for (let y = 46; y < 57; y++) for (let x = 20; x < 30; x++) {
        if ([0,1,2].every(dx => !scene.world.isBlocked(x+dx,y) && !scene.world.resourceAt(x+dx,y) && !scene.mapEditor.adapter.protectedTile(x+dx,y))) return {x,y};
      }
      throw Error('No paint test area');
    });
    await focus(tile); await tool('terrain', 'path');
    const a = await screen(tile), b = await screen({x:tile.x+2,y:tile.y});
    await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();await wait();
    let doc = await edits(); for(let dx=0;dx<3;dx++) assert.equal(doc.terrain[`${tile.x+dx},${tile.y}`],'path');
    assert.equal(await save(), before, 'painting only writes draft');
    await page.keyboard.press('Control+z'); assert.deepEqual((await edits()).terrain, {}, 'one drag is one undo step');
    await page.keyboard.press('Control+y'); assert.equal((await edits()).terrain[`${tile.x},${tile.y}`], 'path');
    await tool('terrain','water');await clickTile(tile);
    assert.equal(await page.evaluate(p=>scene.world.isBlocked(p.x,p.y),tile),true);
    await tool('terrain','grass');await clickTile(tile);
    assert.equal(await page.evaluate(p=>scene.world.isBlocked(p.x,p.y),tile),false);
    await tool('object','stone');await clickTile(tile);
    doc=await edits(); const id=Object.keys(doc.objects).find(id=>id.startsWith('editor-stone-'));assert.ok(id);
    await tool('select');
    const c=await screen(tile),d=await screen({x:tile.x+1,y:tile.y});
    await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(d.x,d.y,{steps:6});await page.mouse.up();await wait();
    assert.equal((await edits()).objects[id].x,tile.x+1);
    await tool('remove');await clickTile({x:tile.x+1,y:tile.y});assert.equal((await edits()).objects[id].removed,true);
    await action('undo');assert.equal((await edits()).objects[id].removed,undefined);
    await tool('terrain','water'); await focus({x:25,y:18}); await clickTile({x:25,y:18});
    assert.equal((await edits()).terrain['25,18'],undefined,'arrival is protected');
    const docBeforeInvalid=await edits();
    await editor().locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')});await wait();
    assert.deepEqual(await edits(),docBeforeInvalid);
    assert.match(await editor().locator('[data-status]').textContent(),/inválido/);
    // UI focus must not swallow Space-pan or cause a second undo.
    await tool('terrain','grass'); const scrollBefore=await page.evaluate(()=>scene.cameras.main.scrollX);
    await page.keyboard.down('Space');await page.mouse.move(800,450);await page.mouse.down();await page.mouse.move(900,450,{steps:4});await page.mouse.up();await page.keyboard.up('Space');
    assert.ok(Math.abs(await page.evaluate(()=>scene.cameras.main.scrollX)-scrollBefore)>50);
    const zoomBefore=await page.evaluate(()=>scene.cameras.main.zoom);await page.mouse.wheel(0,-100);await wait();assert.ok(await page.evaluate(()=>scene.cameras.main.zoom)>zoomBefore);
    const downloadPromise=page.waitForEvent('download');await action('export');const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'After-Rain-meu-mapa.json');
    const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.deepEqual(exported,await edits());assert.equal(exported.inventory,undefined);
    await action('zoom-fit');await page.screenshot({path:'/tmp/after-rain-editor-overview.png'});
    await action('cancel');assert.equal(await save(),before,'cancel preserves serialized save');
    assert.equal(await page.evaluate(()=>scene.inventory.data.wood),13);
    await page.keyboard.press('F2');await action('load-draft');assert.deepEqual(await edits(),exported);
    await action('apply');await editor().waitFor({state:'detached'});
    const applied=JSON.parse(await save());assert.equal(applied.inventory.wood,13);assert.equal(applied.homeSupplies.seedPacket,true);assert.deepEqual(applied.mapEdits,exported);
    assert.ok(await page.evaluate(id=>scene.world.resources.some(o=>o.id===id),id));
    // Harvest a custom resource, reload, edit its location, and reload again.
    await page.evaluate(id=>{scene.world.removeResource(id);scene.state.depletedResources.push(id);scene.persist()},id);
    console.log('reload harvested');await page.reload();await attach();await page.locator('#continue-game').click();await wait();
    assert.equal(await page.evaluate(id=>scene.world.resources.some(o=>o.id===id),id),false);
    await page.keyboard.press('F2');assert.equal(await page.evaluate(()=>scene.mapEditor.layoutError(scene.mapEditor.history.current)),null);
    const moved=await edits();moved.objects[id].x+=1;
    await editor().locator('input[type=file]').setInputFiles({name:'moved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(moved))});await wait();await action('apply');
    await editor().waitFor({state:'detached'}); assert.equal(await page.evaluate(id=>scene.world.resources.some(o=>o.id===id),id),false,'moving depleted ID never respawns reward');
    // Interior cancel restores indoor position and both pickup flags.
    await page.evaluate(()=>{scene.enterHome(undefined,false);scene.persist()});const homeSave=await save();
    await page.keyboard.press('F2');await action('cancel');assert.equal(await page.evaluate(()=>scene.inHome),true);assert.equal(await save(),homeSave);
    await page.keyboard.press('F2');await page.setViewportSize({width:960,height:640});await wait();
    const overflow=await editor().evaluate(el=>el.scrollWidth>window.innerWidth);assert.equal(overflow,false);
    await page.screenshot({path:'/tmp/after-rain-editor-960.png'});
    await action('cancel');
    assert.deepEqual(errors,[]);
    console.log('PASS editor: real pointer painting/moving/removal, undo/redo, terrain collision, protection, invalid import, export, draft recovery, cancel/save/reload, collected rewards, indoor return, keyboard pan/zoom and 960px layout.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
