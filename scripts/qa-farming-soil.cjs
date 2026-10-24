const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const dir='docs/cenarios/enxada-provisoria';fs.mkdirSync(dir,{recursive:true});
  const attach=()=>page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);
   window.game=game;window.valley=game.scene.getScene('Vale');
   game.loop.sleep();window.qt=valley.time.now;
   window.step=ms=>{qt+=ms;game.step(qt,ms);};
  });
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');
  await page.locator('#new-game').click();await page.locator('#character-name').fill('Cultivo');
  await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
  await page.evaluate(()=>{
   Object.assign(valley.inventory.data,{handle:1,flakedStone:1,cord:1,seeds:2});
   valley.state.homeSupplies={wateringCan:true,seedPacket:true};valley.state.wateringCanWater=8;
   valley.updateHUD();valley.persist();
  });
  await page.keyboard.press('c');await page.locator('[data-recipe="hoe"]').click();
  assert.equal(await page.evaluate(()=>valley.inventory.data.hoe),1);
  assert.equal(await page.locator('[data-recipe="hoe"]').isDisabled(),true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('i');
  for(const [item,slot] of [['hoe',0],['seeds',1],['wateringCan',2]]){
   await page.locator(`[data-bag-item="item:${item}"]`).dragTo(page.locator(`.inventory-quickbar [data-slot="${slot}"]`));
  }
  assert.deepEqual(await page.evaluate(()=>valley.ui.getQuickbar().slice(0,3)),['item:hoe','item:seeds','item:wateringCan']);
  await page.keyboard.press('Escape');await page.keyboard.press('1');
  assert.equal(await page.evaluate(()=>valley.tool),'hoe');
  const plot=await page.evaluate(()=>{
   const ground=valley.soilGround();
   for(let y=25;y<35;y++)for(let x=20;x<34;x++){
    const cells=[{x,y},{x:x+1,y},{x,y:y+1},{x:x+1,y:y+1},{x:x+2,y}];
    if(cells.some(p=>valley.farming.prepareReason(p.x,p.y,valley.inventory,ground)))continue;
    if(valley.world.isBlocked(x-1,y))continue;
    window.plot={x,y};valley.player.x=(x-.5)*32;valley.player.y=(y+.5)*32;
    valley.player.facing={x:1,y:0};valley.player.update(0,valley.movementBlocked,valley.movementBlockedPoint,true,valley.swimmingPoint);
    valley.lastAim=plot;valley.aimUntil=valley.time.now+100000;valley.nextInteractionAt=0;
    valley.cameras.main.centerOn(valley.player.x,valley.player.y);step(0);return plot;
   }throw Error('No free contiguous garden');
  });
  // A real E press, then cancellation before the contact frame.
  await page.keyboard.press('e');await page.evaluate(()=>step(100));
  assert.equal(await page.evaluate(()=>valley.toolVisual.sprite.visible),true);
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),false);
  await page.evaluate(()=>{valley.setPaused(true);valley.setPaused(false);step(600);valley.nextInteractionAt=0;});
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),false);
  // Click the actual canvas on the aimed ground, then reach the contact once.
  const screen=await page.evaluate(()=>{
   const camera=valley.cameras.main,p=camera.getWorldPoint(0,0);
   return {x:((plot.x+.5)*32-p.x)*camera.zoom,y:((plot.y+.5)*32-p.y)*camera.zoom};
  });
  const canvasBox=await page.locator('canvas').first().boundingBox();
  await page.mouse.click(canvasBox.x+screen.x,canvasBox.y+screen.y);
  assert.equal(await page.evaluate(()=>valley.toolUse.active),true);
  await page.evaluate(()=>step(100));await page.screenshot({path:`${dir}/enxada-direita.png`});
  await page.evaluate(()=>{step(150);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),1);
  assert.equal(await page.evaluate(()=>valley.toolVisual.sprite.visible),false);
  assert.equal(await page.evaluate(()=>valley.placementReason(plot,'floor')),'Espaço bloqueado ou camada ocupada.');
  const reload=async()=>{
   assert.equal(await page.evaluate(()=>valley.persist()),true);
   await page.reload();await page.locator('#continue-game').click();await attach();
   await page.evaluate(p=>{window.plot=p;valley.lastAim=p;valley.aimUntil=valley.time.now+100000;valley.nextInteractionAt=0;step(0);},plot);
  };
  await reload();assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),true);
  assert.equal(await page.evaluate(()=>valley.soilSprites.length),46);
  // Opposite lateral swing on the next plot and a joined 2x2 patch.
  await page.evaluate(()=>{
   const p={x:plot.x+1,y:plot.y};valley.player.x=(p.x+1.5)*32;valley.player.y=(p.y+.5)*32;
   valley.player.update(0,valley.movementBlocked,valley.movementBlockedPoint,true,valley.swimmingPoint);
   valley.nextInteractionAt=0;valley.selectTool('hoe');valley.interact(p);step(100);
  });
  assert.equal(await page.evaluate(()=>valley.toolVisual.sprite.flipX),true);
  await page.screenshot({path:`${dir}/enxada-esquerda.png`});
  await page.evaluate(()=>{step(150);step(250);
   for(const p of [{x:plot.x,y:plot.y+1},{x:plot.x+1,y:plot.y+1}]){
    valley.player.x=(p.x-.5)*32;valley.player.y=(p.y+.5)*32;valley.nextInteractionAt=0;
    valley.interact(p);step(250);step(250);
   }
   valley.player.x=(plot.x-.5)*32;valley.player.y=(plot.y+.5)*32;
   valley.player.update(0,valley.movementBlocked,valley.movementBlockedPoint,true,valley.swimmingPoint);
   valley.lastAim=plot;valley.aimUntil=valley.time.now+100000;valley.nextInteractionAt=0;valley.updateHUD();
  });
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),4);
  await page.keyboard.press('2');await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>valley.inventory.data.seeds),1);
  await reload();assert.equal(await page.evaluate(()=>valley.farming.crops.length),1);
  await page.keyboard.press('1');await page.keyboard.press('Shift+e');
  assert.equal(await page.evaluate(()=>valley.toolUse.active),false);
  assert.equal(await page.evaluate(()=>valley.farming.crops.length),1);
  await page.keyboard.press('3');await page.keyboard.press('e');await page.evaluate(()=>{step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.cropAt(plot.x,plot.y).watered),true);
  assert.equal(await page.evaluate(()=>valley.state.wateringCanWater),7);
  await reload();assert.equal(await page.evaluate(()=>valley.farming.cropAt(plot.x,plot.y).watered),true);
  await page.evaluate(()=>{
   // Accelerate only crop time; input, impact, water and rewards use production code.
   valley.farming.update(45);valley.syncSprites();valley.updateHUD();step(0);
   valley.ui.journalCollapsed=false;document.querySelector('#journal-panel').hidden=false;
  });
  await page.screenshot({path:`${dir}/canteiros-e-colheita.png`});
  await page.keyboard.press('4');await page.evaluate(()=>{valley.nextInteractionAt=0;});await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>valley.inventory.data.turnip),1);
  await reload();await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>valley.inventory.data.turnip),1);
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),4);
  assert.equal(await page.locator('[data-farming-step="harvested"]').getAttribute('class'),'quest complete');
  await page.evaluate(()=>{valley.inventory.spend({turnip:1});valley.updateHUD();});await reload();
  assert.equal(await page.locator('[data-farming-step="harvested"]').getAttribute('class'),'quest complete');
  // Restore by keyboard and canvas, retaining the exact imported floor underneath.
  const terrainBefore=await page.evaluate(()=>JSON.stringify(valley.state.mapEdits.terrain));
  await page.keyboard.press('1');
  await page.evaluate(()=>{valley.nextInteractionAt=0;});
  await page.keyboard.press('Shift+e');await page.evaluate(()=>step(100));
  assert.equal(await page.evaluate(()=>valley.toolUse.current.soilAction),'restore');
  await page.evaluate(()=>{valley.setPaused(true);valley.setPaused(false);step(600);valley.nextInteractionAt=0;});
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),true);
  // Release Shift during the swing: its captured action must still restore.
  await page.keyboard.press('Shift+e');await page.evaluate(()=>{step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(valley.state.mapEdits.terrain)),terrainBefore);
  assert.equal(await page.evaluate(()=>valley.freeForBuilding(plot.x,plot.y,'floor')),true);
  await reload();assert.equal(await page.evaluate(()=>valley.farming.isPrepared(plot.x,plot.y)),false);
  await page.keyboard.press('2');await page.evaluate(()=>{valley.interact(plot);});
  assert.equal(await page.evaluate(()=>valley.inventory.data.seeds),2,'restored ground rejects planting without spending');
  await page.keyboard.press('1');await page.evaluate(()=>{valley.nextInteractionAt=0;});
  await page.keyboard.press('e');await page.evaluate(()=>{step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),4);
  const restoreScreen=await page.evaluate(()=>{
   const c=valley.cameras.main,p=c.getWorldPoint(0,0);return {x:((plot.x+.5)*32-p.x)*c.zoom,y:((plot.y+.5)*32-p.y)*c.zoom};
  });
  await page.evaluate(()=>{valley.nextInteractionAt=0;});
  await page.keyboard.down('Shift');await page.mouse.click(restoreScreen.x,restoreScreen.y);await page.keyboard.up('Shift');
  assert.equal(await page.evaluate(()=>valley.toolUse.current.soilAction),'restore');
  await page.evaluate(()=>{step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),3);
  await page.screenshot({path:`${dir}/piso-restaurado.png`});
  await page.evaluate(()=>{valley.nextInteractionAt=0;valley.interact(plot);step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),4);
  console.log('new plots, complete cycle, restoration, save/reload OK');
  // The original kitchen garden is removable too and reveals actual grass.
  await page.evaluate(()=>{
   window.oldPlot={x:21,y:20};valley.player.x=22.5*32;valley.player.y=20.5*32;
   valley.player.update(0,valley.movementBlocked,valley.movementBlockedPoint,true,valley.swimmingPoint);
   valley.lastAim=oldPlot;valley.aimUntil=valley.time.now+100000;valley.nextInteractionAt=0;valley.selectTool('hoe');
  });
  await page.keyboard.press('Shift+e');await page.evaluate(()=>{step(250);step(250);});
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(21,20)),false);
  assert.deepEqual(await page.evaluate(()=>valley.farming.restoredFarmSoil),[{x:21,y:20}]);
  assert.equal(await page.evaluate(()=>valley.world.isBuildable(21,20)),true);
  const grass=await page.evaluate(()=>Array.from(valley.textures.get('world-ground-sandy-river-v3').getSourceImage().getContext('2d').getImageData(21*32+16,20*32+16,1,1).data));
  assert.ok(grass[1]>grass[0] && grass[1]>grass[2],'original garden has green grass underneath');
  await reload();assert.equal(await page.evaluate(()=>valley.farming.isPrepared(21,20)),false);
  await page.evaluate(()=>{valley.cameras.main.centerOn(24.5*32,17*32);step(0);});
  await page.screenshot({path:`${dir}/casa-acesso-novo.png`});
  const decoration=await page.evaluate(()=>{
   const source=valley.textures.get('world-ground-details').getSourceImage(),ctx=source.getContext('2d');
   const alpha=(x,y,w,h)=>{const a=ctx.getImageData(x,y,w,h).data;let n=0;for(let i=3;i<a.length;i+=4)if(a[i])n++;return n;};
   let sample;
   for(let y=30;y<68&&!sample;y++)for(let x=52;x<92;x++)if(!valley.world.resourceAt(x,y)&&alpha(x*32,y*32,32,32)>30){sample={x,y};break;}
   return {houseSide:alpha(18*32,9*32,14*32,9*32),east:alpha(56*32,0,40*32,72*32),south:alpha(0,46*32,96*32,26*32),sample};
  });
  assert.equal(decoration.houseSide,0);assert.ok(decoration.east>0&&decoration.south>0);assert.ok(decoration.sample);
  // Protected terrain is rechecked at contact, not just when the swing starts.
  const blockedImpact=await page.evaluate(()=>{
   const p={x:plot.x+2,y:plot.y};valley.player.x=(p.x-.5)*32;valley.player.y=(p.y+.5)*32;
   valley.nextInteractionAt=0;valley.selectTool('hoe');
   if(valley.farming.prepareReason(p.x,p.y,valley.inventory,valley.soilGround()))return 'unavailable';
   const old=valley.state.mapEdits.terrain[`${p.x},${p.y}`];valley.interact(p);valley.state.mapEdits.terrain[`${p.x},${p.y}`]='water';step(250);step(250);
   if(old)valley.state.mapEdits.terrain[`${p.x},${p.y}`]=old;else delete valley.state.mapEdits.terrain[`${p.x},${p.y}`];return valley.farming.isPrepared(p.x,p.y);
  });assert.equal(blockedImpact,false);
  // New canteirs also reserve their cells against editor changes.
  await page.evaluate(()=>{game.loop.wake();valley.openMapEditor();});
  await page.waitForSelector('.map-editor-ui');
  assert.equal(await page.evaluate(p=>game.scene.getScene('Editor').editor.adapter.protectedTile(p.x,p.y),plot),true);
  const editorResult=await page.evaluate(({plot,decorated})=>{
   const scene=game.scene.getScene('Editor'),editor=scene.editor;
   const paint=(point,terrain)=>{editor.tool={mode:'terrain',terrain};editor.stroke=editor.history.current;editor.paint(point);editor.finishStroke();};
   paint(plot,'paving');const preparedPreserved=editor.history.current.terrain[`${plot.x},${plot.y}`]!=='paving';
   paint({x:21,y:20},'paving');paint({x:24,y:18},'paving');paint(decorated,'paving');
   const src=scene.textures.get('editor-property-ground-details').getSourceImage();
   const bytes=src.getContext('2d').getImageData(decorated.x*32,decorated.y*32,32,32).data;
   return {preparedPreserved,oldFloor:editor.history.current.terrain['21,20'],entranceFloor:editor.history.current.terrain['24,18'],decorRemoved:Array.from(bytes).filter((_,i)=>i%4===3).every(a=>a===0)};
  },{plot,decorated:decoration.sample});
  assert.deepEqual(editorResult,{preparedPreserved:true,oldFloor:'paving',entranceFloor:'paving',decorRemoved:true});
  await page.locator('[data-action="apply"]').click();
  await page.waitForSelector('.hud');await page.evaluate(()=>{game.loop.sleep();});
  assert.equal(await page.evaluate(()=>valley.state.mapEdits.terrain['24,18']),'paving');
  assert.equal(await page.evaluate(()=>valley.farming.isPrepared(21,20)),false);
  console.log('old kitchen garden becomes grass; editable approach; scattered flowers removed by floor paint OK');
  // Original v2 stock migrates after a browser reload, with no gifted hoe or lost garden.
  await page.evaluate(()=>{
   valley.persist();const key='depois-da-chuva-v1',save=JSON.parse(localStorage.getItem(key));
   delete save.inventory.hoe;save.equippedTool='hand';save.quickbar=Array(9).fill(null);
   localStorage.setItem(key,JSON.stringify(save));valley.running=false;
  });
  await page.reload();await page.locator('#continue-game').click();await attach();
  assert.equal(await page.evaluate(()=>valley.inventory.data.hoe),0);
  assert.equal(await page.evaluate(()=>valley.farming.preparedSoil.length),4);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({passed:true,plot,checks:['craft UI','unique tool','inventory drag to slots','E and canvas input','cancel before contact','both lateral sides','contact revalidation','four joined plots','no building on garden','save/reload after prepare/plant/water/harvest','water charge once','no repeated harvest','persistent first-harvest mission','editor protection','legacy v2 migration','Shift+E and Shift+click restore the prior floor','cancel restoration','protect planted crops','reprepare restored soil','restored floor permits building','no seeds spent on restored ground','original garden restored to grass','old garden and entrance dry floors editable','flowers scattered east and south','no fixed house-side flowerbeds','floor painting removes all affected decorative sprites'],pageErrors:errors,at:new Date().toISOString()},null,2));
  console.log('PASS: hoe, garden lifecycle, save continuity, HUD, editor and original v2 stock');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
