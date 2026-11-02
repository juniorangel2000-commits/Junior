const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/alto-da-serra-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Serra QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
 await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const valley=game.scene.getScene('Vale');valley.scene.sleep();game.scene.start('Serra',{save:structuredClone(valley.state),ui:valley.ui,onReturn:()=>{}});});await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='highland');
 const assets=await page.evaluate(async()=>{
  window.s=game.scene.getScene('Serra');window.geometry=await import('/src/data/highland.ts');s.state.time=480;s.cameras.main.stopFollow().setZoom(1).centerOn(768,512);s.cameras.main.resetFX();
  const props=geometry.HIGHLAND_OBJECTS.filter(o=>['highland-minecart','highland-toolstand','highland-orepile'].includes(o.kind));
  return{props:props.map(o=>({kind:o.kind,loaded:s.textures.exists(o.texture),editable:s.world.editorObjects.some(e=>e.id===o.id),solid:geometry.highlandBlockedPoint(o.x,o.y)})),trees:s.world.trees.length,water:s.children.list.filter(o=>o.getData?.('water-surface')||o.getData?.('highland-water-base')).map(o=>({texture:o.displayTexture.key,alpha:o.alpha}))};
 });
 assert.equal(assets.trees,11);for(const o of assets.props)assert.deepEqual(o,{kind:o.kind,loaded:true,editable:true,solid:true});assert.equal(assets.props.length,3);assert.deepEqual(assets.water,[{texture:'lake-flow-original-water',alpha:1},{texture:'lake-flow-original-water',alpha:.3}]);console.log(JSON.stringify(assets));
 const motion=await page.evaluate(()=>({water:s.children.list.find(o=>o.getData?.('water-surface')).tilePositionX,tree:s.world.trees[0].rotation}));
 await page.waitForFunction(before=>s.children.list.find(o=>o.getData?.('water-surface')).tilePositionX!==before.water&&s.world.trees[0].rotation!==before.tree,motion);
 await page.evaluate(()=>{document.querySelector('#ui').style.display='none';s.setPaused(true);s.cameras.main.stopFollow().setZoom(1).centerOn(768,512);});await page.waitForTimeout(200);await page.screenshot({path:out+'/Plato-Decorado-no-Jogo.png'});
 await page.evaluate(()=>{s.player.x=1278;s.player.y=250;s.player.update(0,s.blockedTile,s.movementBlockedPoint,false,s.swimmingPoint,s.allowStep);s.cameras.main.setZoom(2).centerOn(1152,256);});await page.screenshot({path:out+'/Mina-com-Equipamentos.png'});
 await page.evaluate(()=>{s.cameras.main.setZoom(2).centerOn(460,620);});await page.screenshot({path:out+'/Arvores-Fora-dos-Caminhos.png'});
 await page.evaluate(()=>{s.cameras.main.setZoom(2).centerOn(850,620);});await page.screenshot({path:out+'/Agua-do-Plato.png'});
 await page.evaluate(()=>{window.bridge=geometry.highlandBridgePose();s.player.x=bridge.left-20;s.player.y=bridge.y;s.player.update(0,s.blockedTile,s.movementBlockedPoint,false,s.swimmingPoint,s.allowStep);s.setPaused(false);});
 await page.keyboard.down('d');await page.waitForFunction(()=>s.player.x>bridge.right+20,{},{timeout:15000});await page.keyboard.up('d');assert.ok(await page.evaluate(()=>!s.player.isSwimming));await page.keyboard.down('a');await page.waitForFunction(()=>s.player.x<bridge.left-20,{},{timeout:15000});await page.keyboard.up('a');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({decorationsEditable:true,treesSway:true,sharedWaterMaterial:true,waterAnimated:true,bridgeWalking:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
