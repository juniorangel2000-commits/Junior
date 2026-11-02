const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/mina-antiga-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
 await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('HUD QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
 await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.valley=game.scene.getScene('Vale');window.ui=valley.ui;window.baseSave=structuredClone(valley.state);window.currentScene=valley;});
 async function checkHud(label,building){
  for(const[key,modal]of[['i','inventory'],['m','map'],['c','crafting'],['j','fishingJournal'],['k','pets']]){
   await page.keyboard.press(key);await page.waitForFunction(modal=>ui.modal===modal,modal);await page.keyboard.press(key);await page.waitForFunction(()=>ui.modal===null);
  }
  await page.keyboard.press('b');assert.equal(await page.evaluate(()=>ui.modal),building?'building':null);if(building)await page.keyboard.press('b');
  await page.locator('.toolbar-handle').click();assert.equal(await page.locator('[data-toolbar-action="building"]').isVisible(),building);await page.locator('[data-toolbar-action="save"]').click();assert.ok(await page.evaluate(()=>currentScene.persist()));await page.locator('.toolbar-handle').click();
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Jogo pausado'}).waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>ui.modal===null);console.log(JSON.stringify({scene:label,inventory:true,map:true,crafting:true,journal:true,pets:true,save:true,pause:true,building}));
 }
 await checkHud('Propriedade',true);await page.evaluate(()=>{valley.scene.sleep();});
 const scenes=[['Floresta','forest'],['Vila','village'],['AcessoCidade','cityForest'],['Lago','fishingLake'],['Acampamento','survivorCamp'],['Serra','highland'],['Mina','highland']];let prior;
 for(const[key,area]of scenes){
  await page.evaluate(({key,area,prior})=>{if(prior)game.scene.stop(prior);const save=structuredClone(baseSave);save.activeArea=area;game.scene.start(key,{save,ui,onReturn:()=>{}});},{key,area,prior});await page.waitForFunction(key=>game.scene.isActive(key)&&!!game.scene.getScene(key).player,key);await page.evaluate(key=>{window.currentScene=game.scene.getScene(key);},key);await checkHud(key,false);
  const animation=await page.evaluate(()=>{
   const s=currentScene;s.cameras.main.stopFollow().setZoom(.5).centerOn(s.sys.settings.key==='Mina'?384:1536,s.sys.settings.key==='Mina'?256:1152);
   const trees=s.children.list.filter(o=>o.texture&&/^asset-(tree|pine)(-[0-2])?$/.test(o.texture.key)&&o.visible);const water=s.children.list.find(o=>o.getData?.('water-surface')||o.getData?.('lake-water-flow'));
   window.animationSample={trees:trees.map(o=>[o,o.rotation]),water,waterX:water?.tilePositionX};return{trees:trees.length,water:!!water,lanterns:s.children.list.filter(o=>o.getData?.('fixture-glow')).length};
  });
  if(animation.trees)await page.waitForFunction(()=>animationSample.trees.some(([o,rotation])=>o.rotation!==rotation),undefined,{timeout:10000});
  if(animation.water)await page.waitForFunction(()=>animationSample.water.tilePositionX!==animationSample.waterX,undefined,{timeout:10000});
  if(key==='Mina'){assert.ok(animation.lanterns>=4);await page.evaluate(()=>{currentScene.cameras.main.setZoom(2).centerOn(384,256);});await page.screenshot({path:out+'/HUD-na-Mina-Antiga.png'});}
  console.log(JSON.stringify({scene:key,animations:animation}));prior=key;
 }
 await page.evaluate(prior=>{game.scene.stop(prior);game.scene.start('Dungeons',{save:{...structuredClone(baseSave),activeArea:'cityForest'},ui,onReturn:()=>{},skipTravel:true});},prior);await page.waitForFunction(()=>game.scene.isActive('Dungeons')&&ui.mode==='expedition');await page.waitForSelector('[data-start]');
 for(const key of['i','m','c','b','j','k'])await page.keyboard.press(key);assert.ok(await page.evaluate(()=>ui.mode==='expedition'&&ui.modal===null&&document.querySelector('#ui').style.display==='none'));
 await page.evaluate(()=>game.scene.getScene('Dungeons').startRun('abandoned-central-square'));await page.waitForFunction(()=>game.scene.getScene('Dungeons').run?.state.phase==='fighting');for(const key of['i','m','c','b','j','k'])await page.keyboard.press(key);assert.ok(await page.evaluate(()=>ui.mode==='expedition'&&ui.modal===null&&game.scene.getScene('Dungeons').run.state.phase!=='paused'));await page.screenshot({path:out+'/Dungeon-sem-Inventario.png'});
 await page.evaluate(()=>{game.scene.stop('Dungeons');game.scene.start('AcessoCidade',{save:{...structuredClone(baseSave),activeArea:'cityForest'},ui,onReturn:()=>{}});});await page.waitForFunction(()=>ui.mode==='hud'&&document.querySelector('#ui').dataset.area==='cityForest');await page.keyboard.press('i');await page.waitForFunction(()=>ui.modal==='inventory');await page.keyboard.press('i');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({allExplorationHuds:true,ambientAnimations:true,dungeonInventoryBlocked:true,hudRestoredAfterDungeon:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
