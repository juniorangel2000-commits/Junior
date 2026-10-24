const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '../docs/ferramentas');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = [];
  try {
    for (const [id, folder] of [['farmer-female', 'fazendeira'], ['farmer-male', 'fazendeiro']]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:5174');
      await page.locator('#new-game').click();
      await page.locator(`[data-character="${id}"]`).click();
      await page.locator('#character-name').fill('Ferramentas');
      await page.getByRole('button', { name: 'Começar minha história' }).click();
      await page.evaluate(async () => {
        const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
        window.game = game; window.scene = game.scene.scenes[0];
        game.loop.sleep();
        window.qaTime = scene.time.now;
        window.step = ms => { window.qaTime += ms; game.step(window.qaTime, ms); };
        scene.inventory.add('hatchet'); scene.inventory.add('pickaxe');
        scene.ui.setQuickbar(['hatchet', 'pickaxe', null, null, null, null, null, null, null]);
        scene.ui.renderQuickbar();
        scene.updateHUD();
      });
      const textures = await page.evaluate(() => scene.textures.getTextureKeys().filter(k => k.startsWith('tool:')).map(k => {
        const img = scene.textures.get(k).getSourceImage(); return { key: k, width: img.width, height: img.height };
      }));
      assert.equal(textures.length, 36);
      assert.ok(textures.every(t => t.width === 97 && t.height === 97), 'all original tool textures retain native size');
      for (const tool of ['hatchet', 'pickaxe']) {
        assert.ok(await page.locator(`img[src*="/tools/${tool}/"]`).count() > 0, 'quickbar uses supplied art');
      }
      if (!process.env.QA_PREVIEW_ONLY) {
      const nodes = [];
      for (const [tool, kind, total, drop, gain] of [['hatchet', 'standingTree', 4, 'log', 2], ['pickaxe', 'vein', 5, 'stone', 4]]) {
        const target = await page.evaluate(({ tool, kind }) => {
          const objects = scene.world.editorObjects.filter(o => o.kind === kind && !o.depleted);
          for (const node of objects) {
            const x = (node.x - .5) * 32, y = (node.y + .5) * 32;
            if ([[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy]) => scene.blockedPoint(x+dx,y+dy))) continue;
            scene.player.x=x;scene.player.y=y;scene.player.facing={x:1,y:0};scene.player.update(0, scene.blocked, scene.blockedPoint);
            if (!scene.clearReach(node)) continue;
            scene.lastAim=null;scene.nextInteractionAt=0;scene.selectTool(tool);step(0);
            return { id:node.id,x:node.x,y:node.y };
          }
          throw Error(`No accessible ${kind}`);
        }, { tool, kind });
        const baseline = await page.evaluate(drop => scene.inventory.data[drop], drop);
        // A real keyboard action starts a strike; no resource change before contact.
        await page.keyboard.press('e');
        assert.equal(await page.evaluate(() => scene.toolUse.active), true);
        assert.equal(await page.evaluate(() => scene.resources.progress.length), 0);
        await page.keyboard.down('d');
        const feet = await page.evaluate(() => ({x:scene.player.x,y:scene.player.y}));
        await page.evaluate(() => step(100));
        assert.deepEqual(await page.evaluate(() => ({x:scene.player.x,y:scene.player.y})),feet);
        assert.equal(await page.evaluate(() => scene.resources.progress.length),0);
        // Pausing before impact cancels the pending hit without a delayed reward.
        await page.evaluate(() => { scene.setPaused(true); step(200); scene.setPaused(false); scene.nextInteractionAt=0; });
        await page.keyboard.up('d');
        assert.equal(await page.evaluate(() => scene.toolUse.active),false);
        assert.equal(await page.evaluate(() => scene.resources.progress.length),0);
        for (let hit=1;hit<=total;hit++) {
          await page.keyboard.press('e');
          assert.equal(await page.evaluate(() => scene.toolUse.active),true);
          // Repeat input cannot schedule a second simultaneous impact.
          await page.keyboard.press('e');
          await page.evaluate(() => step(100));
          assert.equal(await page.evaluate(drop => scene.inventory.data[drop],drop),baseline);
          await page.evaluate(() => step(130));
          const result=await page.evaluate(({target,drop})=>({hits:scene.resources.progress.find(p=>p.id===target.id)?.hits??0,
            depleted:scene.state.depletedResources.filter(id=>id===target.id).length,amount:scene.inventory.data[drop]}),{target,drop});
          assert.equal(result.hits,hit===total?0:hit);
          assert.equal(result.depleted,hit===total?1:0);
          assert.equal(result.amount,baseline+(hit===total?gain:0));
          await page.evaluate(()=>{step(200);step(100);});
        }
        nodes.push(target.id);
        assert.equal(await page.evaluate(()=>scene.toolUse.active),false);
        assert.equal(await page.evaluate(()=>scene.persist()),true);
      }
      // Empty slots immediately clear the visible tool, including a canceled swing.
      await page.keyboard.press('3');
      await page.evaluate(()=>step(0));
      assert.equal(await page.evaluate(()=>scene.tool), 'hand');
      assert.equal(await page.evaluate(()=>scene.toolVisual.sprite.visible), false);
      // Saved resources remain depleted and collected rewards are not replayed on load.
      const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('depois-da-chuva-v1')));
      assert.ok(nodes.every(id => saved.depletedResources.includes(id)));
      await page.evaluate(saved=>{scene.loadState(saved);scene.running=true;scene.paused=false;scene.ui.showHUD();step(0);},saved);
      assert.equal(await page.evaluate(()=>scene.state.profile.characterId),id);
      for (const targetId of nodes) assert.equal(await page.evaluate(id=>scene.state.depletedResources.filter(x=>x===id).length,targetId),1);
      console.log(`PASS ${id}: native tool assets, icons, impact timing, canceled hit, movement lock, rewards once, save reload, empty hands`);

      }

      // Record actual Phaser renders of character + equipped tool on a neutral review background.
      // Frame advance is explicit so captures cannot miss any of the nine authored frames.
      await page.evaluate(()=>{
        scene.player.x=832;scene.player.y=592;scene.player.update(0,scene.blocked,scene.blockedPoint);
        scene.hudTimer=0;scene.saveTimer=0;
        for(const object of scene.children.list) if(object!==scene.player.sprite&&object!==scene.toolVisual.sprite&&object.setVisible)object.setVisible(false);
        scene.cameras.main.stopFollow();scene.cameras.main.zoomEffect.reset();scene.cameras.main.setZoom(4).centerOn(832,564).setBackgroundColor('#dce3ba');
      });
      const clips=[];
      for(const tool of ['pickaxe','hatchet']) for(const direction of ['right','left']) {
        const frames=[];
        for(let phase=-1;phase<9;phase++) {
          const captured=await page.evaluate(async ({tool,direction,phase})=>{
            scene.toolUse.cancel();scene.selectTool(tool);
            scene.player.facing={x:direction==='left'?-1:1,y:0};scene.player.update(0,scene.blocked,scene.blockedPoint,false);
            if(phase>=0){scene.toolUse.start({tool,direction,target:{id:'preview',kind:tool==='hatchet'?'standingTree':'vein',x:27,y:18}});scene.toolUse.advance(phase/18);}
            scene.updateToolVisual();
            const sprite=scene.toolVisual.sprite;
            const png=await new Promise(resolve=>{game.renderer.snapshotArea(480,232,320,320,img=>resolve(img.src));step(0);});
            return {png,key:sprite.texture.key,flipX:sprite.flipX,angle:sprite.angle};
          },{tool,direction,phase});
          assert.equal(captured.flipX,tool==='pickaxe'&&direction==='right');
          assert.equal(captured.angle,0,'authored tool orientation is preserved without extra rotation');
          frames.push(captured.png);
        }
        clips.push({tool,direction,frames});
      }
      fs.writeFileSync(path.join(out,`${folder}-quadros.json`),JSON.stringify(clips));
      assert.deepEqual(errors,[]);
      report.push({character:id,status:'passed',frames:clips.reduce((n,c)=>n+c.frames.length,0)});
      await page.close();
    }
    fs.writeFileSync(path.join(out,process.env.QA_PREVIEW_ONLY ? 'validacao-visual.json' : 'validacao-browser.json'),JSON.stringify({completedAt:new Date().toISOString(),characters:report},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
