const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(180000);const checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Vento');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.valley=game.scene.getScene('Vale');window.fixture=valley.snapshotState();});
  for(const key of ['Vale','Vila','Floresta','AcessoCidade']){
   if(key!=='Vale'){
    await page.evaluate(key=>{for(const s of game.scene.getScenes(true))s.scene.sleep();valley.villageActive=true;game.scene.start(key,{save:structuredClone(fixture),ui:valley.ui,onReturn(){}});},key);
    await page.waitForFunction(key=>game.scene.isActive(key)&&game.scene.getScene(key).player,key);
   }
   const result=await page.evaluate(key=>{
    const s=game.scene.getScene(key);game.loop.sleep();const trees=s.children.list.filter(o=>/^asset-(tree|pine)(-[0-2])?$/.test(o.texture?.key));
    const tree=trees.find(t=>t.visible&&t.active);if(!tree)return {key,count:trees.length,ok:false};
    const camera=s.cameras.main;camera.stopFollow().centerOn(tree.x,tree.y);game.step(performance.now(),0);
    const before={x:tree.x,y:tree.y,scaleX:tree.scaleX,scaleY:tree.scaleY,originX:tree.originX,originY:tree.originY};
    for(let i=0;i<30;i++)s.events.emit('update',i*50,50);const a=tree.rotation;
    for(let i=0;i<30;i++)s.events.emit('update',1500+i*50,50);const b=tree.rotation;
    const same=Object.entries(before).every(([k,v])=>tree[k]===v);
    game.loop.wake();return {key,count:trees.length,a,b,same,ok:Math.abs(a-b)>1e-6&&same};
   },key);
   checks.push(result);console.log(result);assert.ok(result.ok,key);
  }
  await page.evaluate(()=>{window.f=game.scene.getScene('AcessoCidade');f.player.x=1800;f.player.y=320;f.paused=false;f.updateHUD();game.input.keyboard.queue=[];game.loop.wake();});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.keyboard.press('m');console.log('Após M',await page.evaluate(()=>({modal:f.ui.modal,paused:f.paused,mode:f.ui.mode})));await page.waitForFunction(()=>document.querySelector('.map-snapshot')?.src.startsWith('data:image/png'),null,{timeout:30000});
  const marker=await page.locator('.map-player').evaluate(el=>({left:parseFloat(el.style.left),top:parseFloat(el.style.top)}));
  assert.ok(Math.abs(marker.left-1800/3072*100)<.01&&Math.abs(marker.top-320/2304*100)<.01);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.keyboard.press('m');await page.waitForFunction(()=>!document.querySelector('.map-card'),null,{timeout:30000});console.log('M abre e fecha o mapa com marcador alinhado',marker);
  assert.deepEqual(errors,[]);
 }finally{fs.mkdirSync('/workspace/asphalt-map-qa',{recursive:true});fs.writeFileSync('/workspace/asphalt-map-qa/arvores-validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
