const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(30000);
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Nado');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');valley.player.x=75.5*32;valley.player.y=18.5*32;valley.selectTool('hand');valley.nextInteractionAt=0;});
 await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');await page.evaluate(()=>{window.forest=game.scene.getScene('Floresta');forest.player.x=66.5*32;forest.player.y=16.5*32;});
 await page.waitForFunction(()=>forest.player.isSwimming);assert.match(await page.evaluate(()=>forest.player.sprite.texture.key),/^swim-/);
 const initial=await page.evaluate(()=>forest.player.sprite.frame.name);await page.keyboard.down('a');await page.waitForFunction(frame=>forest.player.sprite.frame.name!==frame,initial);await page.waitForTimeout(500);await page.keyboard.up('a');
 assert.ok(await page.evaluate(()=>forest.player.x)<66.5*32,'swims through water');
 await page.evaluate(()=>{forest.player.x=54.5*32;forest.player.y=16.5*32;forest.zoom=1;forest.applyCamera();});await page.screenshot({path:'docs/cenarios/nado-feminino.png'});
 await page.keyboard.press('i');await page.locator('.inventory-card').waitFor();const frozen=await page.evaluate(()=>forest.player.x);await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.equal(await page.evaluate(()=>forest.player.x),frozen);await page.keyboard.press('Escape');
 await page.evaluate(()=>{forest.persist();});const position=await page.evaluate(()=>({x:forest.player.x,y:forest.player.y}));
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="forest"]');await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.forest=game.scene.getScene('Floresta');});
 await page.waitForFunction(()=>forest.player.isSwimming);assert.ok(Math.abs(await page.evaluate(()=>forest.player.x)-position.x)<1);
 // Exit at the clear eastern shoreline.
 await page.evaluate(()=>{forest.player.x=66.5*32;forest.player.y=16.5*32;});await page.keyboard.down('d');await page.waitForFunction(()=>!forest.player.isSwimming,{},{timeout:10000});await page.keyboard.up('d');assert.equal(await page.evaluate(()=>forest.player.sprite.texture.key),'forest-player');
 // Reuse the real male character on the same water, and check all eight headings.
 await page.evaluate(async()=>{
   const {Player}=await import('/src/player.ts');forest.player.setVisible(false);forest.player=new Player(forest,{...forest.state.profile,characterId:'farmer-male'},54.5*32,16.5*32,'swim-male-qa');forest.applyCamera();
 });await page.waitForFunction(()=>forest.player.isSwimming);assert.equal(await page.evaluate(()=>forest.player.sprite.texture.key),'swim-farmer-male');
 for(const keys of [['w'],['w','d'],['d'],['s','d'],['s'],['s','a'],['a'],['w','a']]){
   for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(160);for(const k of keys)await page.keyboard.up(k);
   assert.equal(await page.evaluate(()=>forest.player.isSwimming),true);
 }
 await page.screenshot({path:'docs/cenarios/nado-masculino.png'});
 assert.equal(await page.evaluate(()=>forest.children.list.filter(o=>o.texture?.key==='forest-ground-sandy-shore').length),1,'one continuous ground surface prevents zoom seams');
 await page.evaluate(()=>{forest.zoom=.5;forest.applyCamera();});await page.screenshot({path:'docs/cenarios/lago-zoom-afastado.png'});
 await page.evaluate(()=>{const p=forest.exit();forest.player.x=(p.x+.5)*32;forest.player.y=(p.y+.5)*32;});await page.waitForFunction(()=>!forest.player.isSwimming);await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="property"]');
 const propertyWater=await page.evaluate(()=>{
   window.valley=game.scene.getScene('Vale');
   for(let y=4;y<68;y++)for(let x=4;x<92;x++)if(valley.world.isSwimmingPoint(x*32+16,y*32+16)&&!valley.world.isSolid(x,y)&&!valley.world.isSolid(x+1,y))return {x:x*32+16,y:y*32+16};
   throw Error('No water found in property');
 });
 await page.evaluate(p=>{valley.player.x=p.x;valley.player.y=p.y;},propertyWater);await page.waitForFunction(()=>valley.player.isSwimming);await page.evaluate(()=>{valley.persist();});
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="property"]');await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.valley=game.scene.getScene('Vale');});await page.waitForFunction(()=>valley.player.isSwimming);
 assert.ok(Math.abs(await page.evaluate(()=>valley.player.x)-propertyWater.x)<1,'property save retains swimming position');
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/cenarios/validacao-nado.json',JSON.stringify({passed:true,checks:['water entry','swim poses animate','movement in water','shared inventory pauses swimming','save reload in water','return to walking on shore','both supplied characters','eight directions','continuous terrain at zoom out','swimming and reload in property'],at:new Date().toISOString()},null,2));console.log('PASS swimming, both characters, eight directions, shoreline, pause and reload');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
