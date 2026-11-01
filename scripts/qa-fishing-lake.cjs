const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='/workspace/fishing-lake-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1536,height:1024}});page.setDefaultTimeout(180000);const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});const check=(name,value)=>{checks.push({name,value});console.log(name,value);assert.ok(value,name);};
 try{
  await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Explorador');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');v.enterLake();});
  await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='fishingLake');await page.waitForTimeout(600);
  await page.evaluate(()=>{window.lake=game.scene.getScene('Lago');lake.state.time=660;lake.daylight.update(660);lake.paused=true;document.querySelector('#ui').style.display='none';lake.cameras.main.stopFollow().setZoom(.44).centerOn(1536,1152);});
  const url=await page.evaluate(()=>lake.captureMap());fs.writeFileSync(out+'/lago-mapa-completo.png',Buffer.from(url.split(',')[1],'base64'));
  await page.screenshot({path:out+'/lago-vista-geral.png'});
  check('Save no lago válido',await page.evaluate(async()=>{const s=await import('/src/systems/save.ts');lake.persist();return s.validateSave(s.loadSave());}));
  for(const[name,x,y]of[['mirante',28,5],['pier',65,46],['entrada-cidade',92,33],['acesso-escada',34,22],['ponte-alinhada',31,60]]){await page.evaluate(({x,y})=>{lake.player.x=(x+.5)*32;lake.player.y=(y+.5)*32;lake.player.update(0,lake.blockedTile,lake.blockedPoint,false);lake.cameras.main.setZoom(1.25).centerOn(lake.player.x,lake.player.y);},{x,y});await page.screenshot({path:out+'/'+name+'.png'});}
  await page.evaluate(()=>{document.querySelector('#ui').style.display='';lake.openMapEditor();});await page.locator('.map-editor-ui[data-map-area="fishingLake"]').waitFor();
  check('Sétimo cenário no editor',await page.locator('button[data-map-area]').count()===7);
  check('Layout original válido',await page.evaluate(()=>{const e=game.scene.getScene('Editor').editor;return e.layoutError(e.history.current)===null;}));
  await page.evaluate(()=>{const e=game.scene.getScene('Editor').editor;window.editTile={x:88,y:64};const map=e.history.current;map.terrain['88,64']='wood';e.history.commit(map);e.rebuild(e.history.current);});
  await page.locator('[data-action=apply]').click();await page.waitForFunction(()=>!document.querySelector('.map-editor-ui'));
  check('Edição do lago persiste ao aplicar',await page.evaluate(async()=>{const {loadSave}=await import('/src/systems/save.ts');return loadSave()?.fishingLakeMapEdits?.terrain['88,64']==='wood';}));
  check('Sem erros JavaScript ou assets ausentes',errors.length===0);
 }catch(e){await page.screenshot({path:out+'/falha.png'});throw e;}finally{fs.writeFileSync(out+'/resultado.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
