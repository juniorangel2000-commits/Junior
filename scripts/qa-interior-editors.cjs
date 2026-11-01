const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const results=[],errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Interiores');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.valley=game.scene.getScene('Vale');valley.enterVillage();});
  await page.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui').dataset.area==='village');await page.evaluate(()=>{window.v=game.scene.getScene('Vila');game.loop.sleep();});
  for(const id of ['augusto','rosa','tobias','amelia','nilo','celina','damiao','helena','icaro','bento']){
   await page.evaluate(id=>{if(v.inBlacksmith)v.setBlacksmithRoom(false);if(id==='bento'){if(v.merchantRoom)v.setMerchantRoom();v.setBlacksmithRoom(true);}else v.setMerchantRoom(id);v.updateHUD();},id);
   await page.evaluate(()=>v.openMapEditor());await page.locator('[data-pieces]').waitFor({timeout:10000});
   const before=await page.evaluate(id=>{const layout=id==='bento'?v.smithLayout:v.merchantLayouts.get(id);const p=layout.pieces[0];return{id:p.id,effects:p.effects!==false};},id);
   await page.locator('[data-effects]').setChecked(!before.effects);await page.locator('[data-apply]').click();
   const result=await page.evaluate(async({id,piece})=>{const {loadSave,validateSave}=await import('/src/systems/save.ts');const layout=id==='bento'?v.smithLayout:v.merchantLayouts.get(id);const saved=loadSave();return{room:id,editing:v.editingRoom,message:document.querySelector('[data-message]').textContent,changed:layout.pieces.find(p=>p.id===piece.id).effects!==piece.effects,saved:validateSave(saved)&&(id==='bento'?saved.blacksmithScene:saved.merchantScenes[id]).pieces.find(p=>p.id===piece.id).effects!==piece.effects};},{id,piece:before});
   results.push(result);console.log(result);assert.ok(result.editing&&result.changed&&result.saved,id);
   if(id==='bento')await page.screenshot({path:'/workspace/all-map-editors-qa/ferraria-editavel.png'});
   await page.locator('[data-close]').click();await page.waitForSelector('[data-pieces]',{state:'detached'});
  }
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync('/workspace/all-map-editors-qa/interiores.json',JSON.stringify({results,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
