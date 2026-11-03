const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/mina-natural-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>{errors.push(e.message);console.log('JSERROR',e.message);});
await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Mina natural QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
await page.evaluate(async()=>{
 window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
 const v=game.scene.getScene('Vale'),save=structuredClone(v.snapshotState());
 const core=await import('/src/systems/underground.ts');core.ensureUndergroundWorld(save);save.miningInterior=true;save.activeArea='highland';delete save.homePosition;
 save.mineInterior={x:79*32+16,y:165*32+16};save.inventory.pickaxe=1;save.inventory.lantern=1;save.equippedTool='pickaxe';save.profile.characterId='farmer-male';
 for(const metal of ['iron','gold','blackMetal'])for(const kind of ['Shard','Ore','Ingot'])save.inventory[metal+kind]=2;
 game.scene.sleep('Vale');game.scene.start('Mineracao',{save,ui:v.ui,onReturn:()=>{}});
});
await page.waitForFunction(()=>game.scene.isActive('Mineracao')&&game.scene.getScene('Mineracao').player);
await page.evaluate(async()=>{
 game.loop.sleep();window.m=game.scene.getScene('Mineracao');window.rock=await import('/src/systems/underground.ts');window.layout=await import('/src/data/underground-layout.ts');window.saves=await import('/src/systems/save.ts');
 m.paused=false;m.cameras.main.resetFX();m.state.underground.hazards.zombies=[];m.state.underground.hazards.bats=[];m.state.underground.hazards.cave.cooldown=35;m.selectTool('pickaxe');
 m.ui.setQuickbar(['item:pickaxe',null,null,null,null,null,null,null,null]);m.player.update(0,m.blockedTile,m.blockedPoint,false);m.cameras.main.stopFollow().setZoom(2).centerOn(m.player.x,m.player.y);game.step(performance.now(),16);
});
assert.ok(await page.evaluate(()=>saves.validateSave(m.snapshotState())));
await page.screenshot({path:out+'/01-Mina-com-paredes-continuas.png'});console.log('native mining scene loaded');
const collision=await page.evaluate(()=>{
 const d=layout.MINE_DECOR.find(d=>d.id==='cart-west'),g=layout.mineDecorGeometry(d);m.player.x=g.x;m.player.y=d.y*32+12;
 const startFree=rock.undergroundFits(m.state.underground,m.player.x,m.player.y);for(const k of Object.values(m.player.keys))k.isDown=false;
 m.player.keys.S.isDown=true;for(let i=0;i<30;i++)m.player.update(.05,m.blockedTile,m.blockedPoint,true);m.player.keys.S.isDown=false;
 const result={startFree,clear:rock.undergroundFits(m.state.underground,m.player.x,m.player.y),stopped:m.player.y<g.y-16,propTexture:m.view.decorations.find(o=>o.getData('mine-decoration')==='cart-west').texture.key};
 m.player.x=g.x+64;m.player.y=g.y+16;m.player.update(0,m.blockedTile,m.blockedPoint,false);m.cameras.main.centerOn(g.x+16,g.y-16);game.step(performance.now(),16);return result;
});assert.ok(collision.startFree&&collision.clear&&collision.stopped);assert.equal(collision.propTexture,'mine-gallery-props');await page.screenshot({path:out+'/02-Carrinho-e-colisao.png'});console.log('native player collision',JSON.stringify(collision));
await page.evaluate(()=>m.ui.toggleInventory(m.state.inventory));await page.getByRole('dialog',{name:'Inventário',exact:true}).waitFor();await page.screenshot({path:out+'/03-Familia-de-minerios.png'});await page.evaluate(()=>{m.ui.toggleInventory(m.state.inventory);m.paused=false;});
const shots={};
for(const id of ['farmer-male','farmer-female']){
 if(id==='farmer-female'){
  await page.evaluate(()=>{const save=structuredClone(m.snapshotState()),ui=m.ui,onReturn=m.onReturn;save.profile.characterId='farmer-female';game.scene.stop('Mineracao');game.scene.start('Mineracao',{save,ui,onReturn});});
  await page.waitForFunction(()=>game.scene.isActive('Mineracao')&&game.scene.getScene('Mineracao').player);await page.evaluate(()=>{window.m=game.scene.getScene('Mineracao');m.paused=false;m.cameras.main.resetFX();});
 }
 const setup=await page.evaluate(()=>{
  const mine=m.state.underground;let face;
  for(let y=156;y<172&&!face;y++)for(let x=68;x<95&&!face;x++){
   const node=rock.mineBlockNode(mine,x,y);if(!node||node.metal||mine.changes[layout.mineCellIndex(x,y)])continue;
   const p={x:(x-1)*32+16,y:y*32+16};if(rock.undergroundFits(mine,p.x,p.y)&&rock.mineTargetVisible(mine,p,node))face={node,p};
  }
  if(!face)throw Error('No east-facing work face');window.face=face;m.player.x=face.p.x;m.player.y=face.p.y;for(const k of Object.values(m.player.keys))k.isDown=false;
  m.player.update(0,m.blockedTile,m.blockedPoint,false);m.state.underground.hazards.cave.cooldown=35;m.state.underground.hazards.zombies=[];m.state.underground.hazards.bats=[];
  m.cameras.main.stopFollow().setZoom(3).centerOn(face.p.x+8,face.p.y-10);m.selectTool('pickaxe');game.step(performance.now(),1);
  window.stoneBefore=m.state.inventory.stone;window.localBefore=m.view.localUpdates;
  return{face,stone:stoneBefore};
 });
 const folder=out+'/'+id;fs.mkdirSync(folder,{recursive:true});let frame=0;
 for(let strike=0;strike<5;strike++){
  await page.evaluate(()=>m.startMining(face.node));
  for(let t=0;t<10;t++){
   const state=await page.evaluate(t=>{game.step(performance.now(),t===0?.01:1000/18);const pose=m.toolVisual.miningSprite;return{active:m.toolUse.active,frame:m.toolUse.frame,bodyVisible:m.player.sprite.visible,poseVisible:pose?.visible,poseFrame:pose?.frame.name};},t);
   if(state.active)assert.ok(!state.bodyVisible&&state.poseVisible);else assert.ok(state.bodyVisible&&!state.poseVisible);
   if(strike===0&&t===4){assert.equal(Number(state.poseFrame)%6,3);await page.screenshot({path:out+'/'+id+'-contato.png'});}
   if(strike<3){await page.screenshot({path:folder+'/'+String(frame++).padStart(3,'0')+'.png',clip:{x:448,y:240,width:640,height:480}});}
  }
  for(let t=0;t<4;t++){await page.evaluate(()=>game.step(performance.now(),1000/18));if(strike<3)await page.screenshot({path:folder+'/'+String(frame++).padStart(3,'0')+'.png',clip:{x:448,y:240,width:640,height:480}});}
 }
 const result=await page.evaluate(()=>({dug:!!m.state.underground.changes[layout.mineCellIndex(face.node.x,face.node.y)]?.dug,reward:m.state.inventory.stone-stoneBefore,walkable:rock.undergroundFits(m.state.underground,face.node.x*32+16,face.node.y*32+16),localUpdates:m.view.localUpdates-localBefore,valid:saves.validateSave(m.snapshotState()),bodyRestored:m.player.sprite.visible&&!m.toolVisual.miningSprite.visible}));
 assert.ok(result.dug&&result.walkable&&result.valid&&result.bodyRestored);assert.equal(result.reward,4);assert.equal(result.localUpdates,17);shots[id]=result;console.log(id,JSON.stringify(result));
 // Cancel restores the real body immediately and must not create another hit.
 await page.evaluate(()=>{m.toolVisual.show('pickaxe','up',m.player.x,m.player.y,{active:true,frame:2},2,m.player.sprite);m.setPaused(true);});
 assert.ok(await page.evaluate(()=>m.player.sprite.visible&&!m.toolVisual.miningSprite.visible));await page.evaluate(()=>m.setPaused(false));
}
await page.evaluate(()=>{if(!m.persist())throw Error('Save failed');const data=saves.loadSave(),ui=m.ui,onReturn=m.onReturn;game.scene.stop('Mineracao');game.scene.start('Mineracao',{save:data,ui,onReturn});});
await page.waitForFunction(()=>game.scene.isActive('Mineracao')&&game.scene.getScene('Mineracao').player);assert.ok(await page.evaluate(()=>{window.m=game.scene.getScene('Mineracao');return saves.validateSave(m.snapshotState())&&Object.values(m.state.underground.changes).filter(c=>c.dug).length>=2;}));
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/validacao.json',JSON.stringify({collision,shots,sceneReload:true,errors},null,2));console.log('PASS native mining, both characters, cancellation, reload, no JS errors');
}catch(e){console.error(e);throw e;}finally{await browser.close();}})().catch(()=>process.exitCode=1);
