const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);
 try{
  await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Abrigo');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);const v=game.scene.getScene('Vale');game.loop.sleep();
   const {deliverShelterMaterial}=await import('/src/systems/pet-shelter.ts');Object.assign(v.inventory.data,{hammer:0,plank:6,stone:8,cord:2});
   const draft=v.snapshotState();deliverShelterMaterial(draft,'plank',2);Object.assign(v.state.petShelter,draft.petShelter);Object.assign(v.inventory.data,draft.inventory);
   v.player.x=v.state.petShelter.x;v.player.y=v.state.petShelter.y+55;v.tool='hand';v.nextInteractionAt=0;v.interact();document.querySelector('.notifications')?.replaceChildren();
  });
  await page.screenshot({path:'/workspace/pet-shelter-qa/entrega-parcial-base.png'});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('[data-shelter-deliver]').count(),3);
  const fit=await page.locator('.pet-shelter-menu').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth}));
  assert.ok(fit.width<=390&&fit.scroll<=fit.client+1,JSON.stringify(fit));
  await page.locator('[data-shelter-upgrade]').scrollIntoViewIfNeeded();await page.screenshot({path:'/workspace/pet-shelter-qa/entregas-tela-pequena.png'});
  console.log('Layout desktop e tela pequena sem transbordamento',fit);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
