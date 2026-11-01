const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='/workspace/fishing-lake-qa';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(name,value)=>{console.log(name,value);checks.push({name,value});assert.ok(value,name);};
 const area=async name=>{await page.waitForFunction(name=>document.querySelector('#ui').dataset.area===name,name);await page.waitForTimeout(300);};
 const walk=async(scene,x,y,key)=>{await page.evaluate(({scene,x,y})=>{window.s=game.scene.getScene(scene);s.setPaused(false);s.player.x=x;s.player.y=y;s.player.update(0,s.blockedTile??s.movementBlocked,s.blockedPoint??s.movementBlockedPoint,false);},{scene,x,y});await page.keyboard.down(key);await page.waitForTimeout(240);await page.keyboard.up(key);};
 try{
  await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Pescador');await page.getByRole('button',{name:'Começar minha história'}).click();await area('property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');v.enterLake();});await area('fishingLake');
  await page.evaluate(()=>{window.lake=game.scene.getScene('Lago');lake.player.x=73*32;lake.player.y=46.5*32;lake.player.update(0,lake.blockedTile,lake.blockedPoint,false);lake.state.inventory.fishingRod=1;lake.state.inventory.bait=3;lake.state.villageProgress.fishingSkill=1;window.fishBefore=lake.state.inventory.fish+lake.state.inventory.rareFish;window.fishingPromise=lake.useVillageItem('fishingRod');});
  await page.locator('[data-fishing-reel]:not([disabled])').waitFor();await page.locator('[data-fishing-reel]').click();
  check('Pesca no píer entrega peixe e consome uma isca',await page.evaluate(async()=>{await fishingPromise;return lake.state.inventory.bait===2&&lake.state.inventory.fish+lake.state.inventory.rareFish===fishBefore+1;}));
  await walk('Lago',94*32-2,33.5*32,'d');await area('cityForest');check('Lago → acesso à cidade a pé',true);
  await walk('AcessoCidade',2*32+2,33.5*32,'a');await area('fishingLake');check('Acesso à cidade → lago a pé',true);
  await walk('Lago',75.5*32,70*32-2,'s');await area('property');check('Lago → propriedade a pé',await page.evaluate(()=>Math.abs(v.player.x-75.5*32)<1&&v.player.y<6*32));
  check('Entrada e aproximação da propriedade sem colisões',await page.evaluate(()=>Array.from({length:16},(_,i)=>i+1).every(y=>!v.world.isSolidPoint(75.5*32,(y+.5)*32))));
  await walk('Vale',75.5*32,2*32+2,'w');await area('fishingLake');check('Propriedade → lago a pé',true);
  const saved=await page.evaluate(async()=>{const s=game.scene.getScene('Lago');s.persist();const {loadSave,validateSave}=await import('/src/systems/save.ts');const data=loadSave();return validateSave(data)&&data.activeArea==='fishingLake'&&data.inventory.bait===2;});check('Save preserva localização e recompensas de pesca',saved);
  await page.reload();await page.locator('#continue-game').click();await area('fishingLake');check('Continuar reabre diretamente no lago',true);
  check('Sem erros JavaScript',errors.length===0);
 }catch(e){await page.screenshot({path:out+'/transicoes-falha.png'});throw e;}finally{fs.writeFileSync(out+'/transicoes.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
