const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Editor');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');valley.player.x=75.5*32;valley.player.y=18.5*32;valley.selectTool('hand');valley.nextInteractionAt=0;});
 await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');await page.evaluate(()=>{window.forest=game.scene.getScene('Floresta');});
 const ripple=await page.evaluate(()=>{const r=forest.children.list.find(o=>o.texture?.key==='water-ripple-frames');window.ripple=r;return r.frame.name;});await page.waitForFunction(frame=>window.ripple.frame.name!==frame,ripple,{timeout:10000});
 await page.evaluate(()=>{forest.player.x=64*32;forest.player.y=25*32;forest.cameras.main.stopFollow().setZoom(1).centerOn(54*32,16*32);});await page.screenshot({path:'docs/cenarios/floresta-lago.png'});
 await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');
 assert.equal(await page.locator('[data-object="lakeRockD"]').count(),1);assert.equal(await page.locator('[data-object="oakC"]').count(),1);
 const chosen=await page.evaluate(()=>{
   const editor=forest.mapEditor;window.base=structuredClone(editor.history.current);const free=[];
   for(let y=40;y<64;y++)for(let x=35;x<58;x++)if(!forest.blockedAt(x,y)&&!editor.adapter.protectedTile(x,y)&&!editor.adapter.objects().some(o=>o.x===x&&o.y===y))free.push({x,y});
   return {entry:free[0],exit:free[3],decoration:free[6],water:{x:54,y:16}};
 });
 await page.locator('[data-mode="entry"]').click();
 await page.evaluate(p=>{forest.cameras.main.setZoom(1).centerOn((p.x+.5)*32,(p.y+.5)*32);forest.cameras.main.preRender();},chosen.entry);
 await page.mouse.click(720,450);await page.waitForFunction(p=>forest.mapEditor.history.current.points?.entry?.x===p.x,chosen.entry);
 const draft=await page.evaluate(p=>{const d=structuredClone(base);d.points={entry:p.entry,exit:p.exit};d.objects['editor-lakeRockD-qa']={...p.water,kind:'lakeRockD'};d.objects['editor-whiteFlowers-qa']={...p.decoration,kind:'whiteFlowers'};return d;},chosen);
 await page.locator('.map-editor-ui input[type=file]').setInputFiles({name:'floresta.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});await page.waitForTimeout(500);
 assert.deepEqual(await page.evaluate(()=>forest.mapEditor.history.current),draft);
 await page.screenshot({path:'docs/cenarios/editor-floresta.png'});
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/floresta|forest/i);assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(),'utf8')),draft);
 await page.locator('.map-editor-ui [data-action="apply"]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});
 assert.equal(await page.evaluate(()=>forest.state.forestMapEdits.objects['editor-lakeRockD-qa'].kind),'lakeRockD');
 await page.evaluate(p=>{forest.player.x=(p.x+.5)*32;forest.player.y=(p.y+.5)*32;},chosen.exit);await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]',{state:'detached'});
 assert.ok(await page.evaluate(()=>valley.state.forestMapEdits));assert.equal(await page.evaluate(()=>valley.state.mapEdits),undefined);
 await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');
 assert.equal(await page.locator('[data-object="lakeRockD"] img').count(),1,'new sprite thumbnail in property editor');
 // Reject importing the forest over the property.
 await page.locator('.map-editor-ui input[type=file]').setInputFiles({name:'wrong-area.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});
 await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('outro cenário'));
 const property=await page.evaluate(()=>{
   const editor=valley.mapEditor,free=[];for(let y=44;y<58;y++)for(let x=20;x<45;x++)if(!valley.world.isBlocked(x,y)&&!editor.adapter.protectedTile(x,y)&&!editor.adapter.objects().some(o=>o.x===x&&o.y===y))free.push({x,y});
   const d=structuredClone(editor.history.current);d.points={entry:free[0],exit:free[2]};return d;
 });
 await page.locator('.map-editor-ui input[type=file]').setInputFiles({name:'property.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(property))});await page.waitForFunction(p=>valley.mapEditor.history.current.points?.exit?.x===p.x,property.points.exit);await page.locator('.map-editor-ui [data-action="apply"]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});
 await page.evaluate(p=>{valley.player.x=(p.x+.5)*32;valley.player.y=(p.y+.5)*32;valley.nextInteractionAt=0;},property.points.exit);await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 assert.deepEqual(await page.evaluate(()=>({x:Math.floor(forest.player.x/32),y:Math.floor(forest.player.y/32)})),chosen.entry);
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="forest"]');
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.forest=game.scene.getScene('Floresta');window.valley=game.scene.getScene('Vale');});
 assert.deepEqual(await page.evaluate(()=>forest.state.forestMapEdits.points),draft.points);
 assert.deepEqual(await page.evaluate(()=>forest.state.mapEdits.points),property.points);
 await page.evaluate(p=>{forest.player.x=(p.x+.5)*32;forest.player.y=(p.y+.5)*32;},chosen.exit);await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]',{state:'detached'});
 assert.deepEqual(await page.evaluate(()=>({x:Math.floor(valley.player.x/32),y:Math.floor(valley.player.y/32)})),property.points.entry);
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/cenarios/validacao-editor-floresta.json',JSON.stringify({passed:true,checks:['animated water','lake rocks','forest editor','new palette','water object placement','separate maps','exported JSON round-trip','cross-area import rejected','custom exits and arrivals both ways','reload'],at:new Date().toISOString()},null,2));console.log('PASS forest editor, water animation, custom portals, saves');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
