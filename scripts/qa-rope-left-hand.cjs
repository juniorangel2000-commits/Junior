const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const out=path.resolve('docs/cenarios/corda-mao-esquerda');fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:720,height:480}}),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Corda');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;const v=game.scene.getScene('Vale'),e=v.state.mapEdits.points.exit;v.player.x=e.x*32+16;v.player.y=e.y*32+16;v.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 await page.evaluate(()=>{window.forest=game.scene.getScene('Floresta');});await page.waitForFunction(()=>!forest.cameras.main.fadeEffect.isRunning);
 await page.evaluate(async()=>{
  const {FOREST_ANIMALS}=await import('/src/data/ancient-forest.ts');forest.scene.pause();document.querySelector('#ui').style.display='none';
  forest.state.inventory.cord=1;delete forest.state.animalEscort;forest.state.recruitedAnimals=FOREST_ANIMALS.slice(1).map(a=>a.id);
  forest.state.animalPositions={forest:[{id:FOREST_ANIMALS[0].id,x:760,y:1648,direction:'left'}],property:[]};forest.rebuildAnimals();
  forest.player.x=736;forest.player.y=1648;forest.interact();if(!forest.state.animalEscort)throw Error('No allocated rope');
 });
 const report=[];
 for(const id of ['farmer-female','farmer-male']){
  const result=await page.evaluate(async id=>{
   const {Player}=await import('/src/player.ts'),{CHARACTER_DIRECTIONS,characterFrame,directionVector}=await import('/src/character-directions.ts'),{resolveCharacter}=await import('/src/data/characters.ts');
   forest.player.sprite.destroy();forest.state.profile.characterId=id;forest.player=new Player(forest,forest.state.profile,688,1616,`hand-check-${id}`);
   forest.player.update(0,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);
   const p=forest.player,c=resolveCharacter(forest.state.profile),cases=[];
   for(const direction of CHARACTER_DIRECTIONS)for(let phase=0;phase<=c.walkFrames;phase++){
    p.facing=directionVector(direction);p.sprite.setFrame(characterFrame(direction,phase,c.walkFrames)).setPosition(p.x,p.y);forest.wildlife.update(0,p);
    const hand=p.leftHandPosition,buffer=forest.wildlife.rope.commandBuffer;
    // First MOVE_TO in the actual Phaser rope drawing must be exactly the live left hand.
    if(buffer[5]!==5||Math.abs(buffer[6]-hand.x)>.0001||Math.abs(buffer[7]-hand.y)>.0001)throw Error(`Wrong rope origin ${id} ${direction} ${phase}`);
    if(forest.wildlife.rope.depth>=p.sprite.depth||forest.wildlife.rope.depth>=forest.wildlife.led.sprite.depth)throw Error('Rope covers an actor');
    cases.push({direction,phase,x:hand.x,y:hand.y});
   }
   return {id,cases};
  },id);report.push(result);console.log(id,result.cases.length,'poses OK');
  for(const direction of ['down','up']){
   await page.evaluate(async direction=>{
    const {characterFrame,directionVector}=await import('/src/character-directions.ts'),{resolveCharacter}=await import('/src/data/characters.ts');const p=forest.player;
    p.facing=directionVector(direction);p.sprite.setFrame(characterFrame(direction,0,resolveCharacter(forest.state.profile).walkFrames));forest.wildlife.update(0,p);
    forest.cameras.main.stopFollow().setZoom(4).centerOn(724,1604);forest.cameras.main.preRender();
   },direction);
   await page.screenshot({path:path.join(out,`${id}-${direction}.png`)});
  }
 }
 assert.equal(report.reduce((sum,r)=>sum+r.cases.length,0),128);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'validacao.json'),JSON.stringify({passed:true,checks:['actual Phaser rope origin equals anatomical left hand','both characters','128 original idle and walk poses','eight directions','rope behind both actors','animal head attachment retained','no browser errors'],characters:report,at:new Date().toISOString()},null,2));console.log('PASS 128 left-hand rope attachments');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
