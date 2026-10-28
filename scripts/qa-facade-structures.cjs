const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out='/workspace/after-rain-facades';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[];
 try{
  const p=await browser.newPage({viewport:{width:1440,height:940}});p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:5177');await p.locator('#new-game').click();await p.locator('#character-name').fill('Fachadas');await p.getByRole('button',{name:'Começar minha história'}).click();await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const s=game.scene.getScene('Vale');s.enterVillage(s.snapshotState());});await p.waitForFunction(()=>game.scene.isActive('Vila'));
  await p.evaluate(()=>{window.v=game.scene.getScene('Vila');game.loop.sleep();v.qaTime=200000;v.state.time=540;for(let i=0;i<600;i++)v.updateDailyRoutines(.1);v.world.trees.forEach(t=>t.setVisible(false));});
  for(const id of ['augusto','rosa','amelia','nilo','celina','damiao','helena','icaro']){
   const result=await p.evaluate(async id=>{
    const {SHOP_FACADES}=await import('/src/data/shop-facades.ts'),{merchantDoor,merchantOutside}=await import('/src/systems/merchant-visit.ts'),{VILLAGE_NPCS,VILLAGE_BUILDINGS}=await import('/src/data/village.ts');
    const b=SHOP_FACADES[id],d=merchantDoor(id),outside=merchantOutside(id),npc=VILLAGE_NPCS.find(n=>n.id===id),building=VILLAGE_BUILDINGS.find(b=>b.shop===npc.merchantId);
    if(v.merchantRoom)v.setMerchantRoom(undefined);v.state.time=540;v.paused=false;v.changingRoom=false;v.cameras.main.resetFX();v.player.x=outside.x;v.player.y=outside.y+5;v.player.update(0,v.blocked,v.blockedPoint,false);v.applyCamera();
    for(let i=0;i<100&&!v.merchantRoom;i++){v.player.keys.W.isDown=true;game.step(v.qaTime+=16,16);}v.player.keys.W.isDown=false;const entered=v.merchantRoom===id;
    if(entered){v.player.x=288;v.player.y=340;v.player.update(0,v.blocked,v.blockedPoint,false);for(let i=0;i<100&&v.merchantRoom;i++){v.player.keys.S.isDown=true;game.step(v.qaTime+=16,16);}v.player.keys.S.isDown=false;}
    const exited=!v.merchantRoom;const house=v.children.list.find(o=>o.getData('village-building')===building.id);
    v.paused=true;v.state.time=1320;v.world.updateLighting(1320);v.daylight.update(1320);game.step(v.qaTime+=16,16);
    const light=v.children.list.find(o=>o.texture?.key===b.texture+'-windows'),pixels=v.textures.get(b.texture+'-windows').getSourceImage().getContext('2d').getImageData(0,0,b.width,b.height).data;
    let maskPixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])maskPixels++;
    const nightVisible=!!light?.visible&&light.alpha>0;v.state.time=720;v.world.updateLighting(720);v.daylight.update(720);v.cameras.main.resetFX();v.cameras.main.removeBounds().stopFollow().setZoom(3).centerOn(d.x+(768-b.door.x)*b.scale,d.y+(512-b.door.y)*b.scale);game.step(v.qaTime+=16,16);game.step(v.qaTime+=16,16);
    return {entered,exited,player:{x:v.player.x,y:v.player.y},texture:house.texture.key,maskPixels,nightVisible};
   },id);
   assert.ok(result.entered&&result.exited,id+' door '+JSON.stringify(result));checks.push(id+': entrada e saída caminhando');
   assert.equal(result.texture,'village-'+id+'-shop');checks.push(id+': fachada própria');assert.ok(result.maskPixels>0&&result.nightVisible,id+' window mask');checks.push(id+': máscara de iluminação não vazia');
   await p.screenshot({path:out+'/'+id+'.png'});console.log(id,JSON.stringify(result));
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/validacao.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
