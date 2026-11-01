const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/running-swimming-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[],errors=[];const check=(name,value)=>{console.log(name,value);results.push({name,value});assert.ok(value,name);};
 try{
 for(const id of ['farmer-female','farmer-male']){
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator(`[data-character="${id}"]`).click();await page.locator('#character-name').fill('Corrida');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');
   let site;for(let y=25;y<65&&!site;y++)for(let x=15;x<85;x++)if(Array.from({length:18},(_,i)=>i*8-16).every(dx=>[-8,8].every(dy=>!v.movementBlockedPoint((x+.5)*32+dx,(y+.5)*32+dy)&&v.swimmingPoint((x+.5)*32+dx,(y+.5)*32+dy)===0))){site={x:(x+.5)*32,y:(y+.5)*32};break;}
   if(!site)throw Error('No clear running strip');v.player.x=site.x;v.player.y=site.y;v.player.update(0,v.movementBlocked,v.movementBlockedPoint,false,v.swimmingPoint);v.cameras.main.stopFollow().setZoom(3).centerOn(site.x+35,site.y);
   window.motion=[];const update=v.player.update.bind(v.player);v.player.update=(dt,...args)=>{const x=v.player.x,y=v.player.y;update(dt,...args);const distance=Math.hypot(v.player.x-x,v.player.y-y);if(dt>0&&distance>0)motion.push({dt,distance,run:v.player.isRunning});};
  });
  await page.waitForFunction(()=>v.canPlay());await page.keyboard.down('d');await page.waitForFunction(()=>motion.length>=3);await page.keyboard.down('Shift');await page.waitForFunction(()=>v.player.isRunning&&motion.filter(p=>p.run).length>=3);
  check(id+' usa a animação Running com Shift',await page.evaluate(id=>v.player.isRunning&&v.player.sprite.texture.key===`character-run-${id}`,id));
  await page.screenshot({path:out+'/'+id+'-correndo.png'});await page.keyboard.up('Shift');await page.waitForFunction(()=>!v.player.isRunning);await page.keyboard.up('d');await page.waitForTimeout(100);
  const speeds=await page.evaluate(()=>{const rate=run=>{const rows=motion.filter(p=>p.run===run);return rows.reduce((s,p)=>s+p.distance,0)/rows.reduce((s,p)=>s+p.dt,0);};return{walk:rate(false),run:rate(true),stopped:!v.player.isRunning,texture:v.player.sprite.texture.key};});console.log(id,speeds);
  check(id+' corre 50% mais rápido e volta a andar ao soltar',Math.abs(speeds.run/speeds.walk-1.5)<.04&&speeds.stopped&&speeds.texture==='player');
  const wet=async(name,expected=true)=>{
   const state=await page.evaluate(name=>{
    const s=game.scene.getScene(name);s.setPaused(true);let point;
    const tile=s.movementBlockedTile??s.movementBlockedAt??s.movementBlocked,blocked=s.movementBlockedPoint;
    for(let y=4;y<68&&!point;y+=2)for(let x=4;x<92;x+=2){const px=(x+.5)*32,py=(y+.5)*32;if(s.swimmingPoint(px,py)>=.9&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>blocked?!blocked(px+dx,py+dy):!tile(Math.floor((px+dx)/32),Math.floor((py+dy)/32)))){point={x:px,y:py};break;}}
    if(!point)throw Error('No open deep water in '+name);s.player.x=point.x;s.player.y=point.y;s.player.update(0,tile,blocked,false,s.swimmingPoint);s.updateHUD?.();s.cameras.main.stopFollow().setZoom(2.5).centerOn(point.x,point.y);s.persist();return{swim:s.player.isSwimming,run:s.player.isRunning,x:point.x,y:point.y};
   },name);check(id+' nada em '+name,state.swim===expected&&!state.run);await page.screenshot({path:out+'/'+id+'-'+name+'-nadando.png'});return state;
  };
  await wet('Vale');
  if(id==='farmer-female'){
   await page.evaluate(()=>v.enterForest());await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='forest');await wet('Floresta');
   await page.evaluate(()=>game.scene.getScene('Floresta').leave());await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
   await page.evaluate(()=>v.enterVillage());await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='village');await wet('Vila');
   await page.evaluate(()=>game.scene.getScene('Vila').enterCityForest());await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='cityForest');
   check('Poça do acesso à cidade permite entrar sem bloquear a margem',await page.evaluate(async()=>{const s=game.scene.getScene('AcessoCidade'),{CITY_PUDDLES}=await import('/src/data/city-forest.ts'),p=CITY_PUDDLES[0];return !s.movementBlockedPoint(p.x*32,p.y*32)&&s.swimmingPoint(p.x*32,p.y*32)>0;}));
   await page.evaluate(()=>game.scene.getScene('AcessoCidade').enterLake());await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='fishingLake');const before=await wet('Lago');
   await page.reload();await page.evaluate(async()=>window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game);await page.locator('#continue-game').click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='fishingLake');
   check('Save dentro da água retorna ao mesmo ponto nadando',await page.evaluate(before=>{const p=window.game.scene.getScene('Lago').player;return p.isSwimming&&Math.hypot(p.x-before.x,p.y-before.y)<1;},before));
   await page.evaluate(async()=>{
    const s=game.scene.getScene('Lago'),{defaultMap}=await import('/src/data/default-maps.ts'),save=structuredClone(s.state),map=defaultMap('abandoned-central-square');
    for(let y=60;y<=65;y++)for(let x=45;x<=50;x++)map.terrain[`${x},${y}`]='water';save.dungeonMapEdits={...save.dungeonMapEdits,'abandoned-central-square':map};save.activeArea='cityForest';
    s.scene.start('Dungeons',{save,ui:s.ui,skipTravel:true,onReturn:()=>{}});
   });
   await page.waitForFunction(()=>game.scene.isActive('Dungeons')&&game.scene.getScene('Dungeons').mode==='menu');await page.evaluate(()=>game.scene.getScene('Dungeons').startRun('abandoned-central-square'));
   await page.waitForFunction(()=>!!game.scene.getScene('Dungeons').player);await page.evaluate(()=>{const d=game.scene.getScene('Dungeons');d.player.x=d.run.state.player.x=48.5*32;d.player.y=d.run.state.player.y=62.5*32;d.run.pause();d.syncPlayer();});
   check('Dungeon nada na água editada mesmo pausada',await page.evaluate(()=>game.scene.getScene('Dungeons').player.isSwimming));await page.screenshot({path:out+'/dungeon-nadando.png'});
  }
  await page.close();
 }
 check('Sem erros ou recursos ausentes',errors.length===0);
 }finally{fs.writeFileSync(out+'/resultado.json',JSON.stringify({results,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
