const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const output=process.env.QA_OUT||'docs/cenarios/vila-preview';
const url=process.env.QA_URL||'http://127.0.0.1:5178';

(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(45000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(url);await page.locator('#new-game').click();
  await page.locator('#character-name').fill('QA da Vila');
  await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
  const attach=()=>page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);
   window.game=game;window.s=game.scene.getScene('Vale');window.vi=game.scene.getScene('Vila');
   game.loop.sleep();
  });
  await attach();
  const baseline=await page.evaluate(()=>{
   s.inventory.add('turnip',20);s.inventory.add('wood',100);s.inventory.add('stone',100);s.persist();s.updateHUD();
   return {inventory:{...s.inventory.data},property:s.state.mapEdits,forest:s.state.forestMapEdits,revision:s.state.mapBaseRevision};
  });
  assert.equal(baseline.inventory.hoe,0);assert.ok(baseline.revision>=4);

  const walk=async(area)=>{
   await page.evaluate(area=>{
    const scene=area==='property'?s:vi;
    scene.input.keyboard.resetKeys();scene.player.x=area==='property'?94*32-16:80;scene.player.y=52.5*32;
    (area==='property'?scene.villagePassage:scene.exitPassage).reset();game.loop.wake();
   },area);
   await page.keyboard.down(area==='property'?'d':'a');
   try{await page.locator(`#ui[data-area="${area==='property'?'village':'property'}"]`).waitFor();}
   finally{await page.keyboard.up(area==='property'?'d':'a');}
   await attach();
  };
  await walk('property');
  const entry=await page.evaluate(()=>({x:vi.player.x,y:vi.player.y,active:vi.state.activeArea,coins:vi.state.villageEconomy.coins,
   npcIds:vi.villagers.map(n=>n.data.id),blockedEntry:vi.blocked(2,52),blockedExit:vi.blocked(1,52),signs:vi.children.list.filter(o=>o.texture?.key?.startsWith('exit-sign')).map(o=>({x:o.x,y:o.y,key:o.texture.key}))}));
  assert.equal(entry.active,'village');assert.equal(entry.coins,0);assert.equal(entry.blockedEntry,false);assert.equal(entry.blockedExit,false);
  assert.ok(Math.abs(entry.x-80)<5&&Math.abs(entry.y-1680)<2);assert.deepEqual(entry.npcIds,['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro']);
  assert.equal(entry.signs.length,1);
  const accessible=await page.evaluate(()=>{
   const queue=[[2,52]],visited=new Set(['2,52']);
   for(let index=0;index<queue.length;index++){
    const [x,y]=queue[index];
    for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
     if(!visited.has(key)&&!vi.blocked(nx,ny)){visited.add(key);queue.push([nx,ny]);}
    }
   }
   return vi.villagers.map(n=>({id:n.data.id,reachable:visited.has(`${n.data.x},${n.data.y+1}`)}));
  });
  assert.ok(accessible.every(npc=>npc.reachable),`NPC access blocked: ${JSON.stringify(accessible)}`);
  console.log('PASS real walk through east property sign to village, clean entry and normal HUD');

  const snapshot=()=>page.evaluate(()=>({inventory:{...vi.inventory.data},coins:vi.state.villageEconomy.coins,met:[...vi.state.villageEconomy.met]}));
  const visit=async(id)=>{
   await page.evaluate(id=>{
    const npc=vi.villagers.find(n=>n.data.id===id);
    vi.input.keyboard.resetKeys();vi.player.x=npc.sprite.x;vi.player.y=npc.sprite.y+45;
    vi.player.update(0,vi.blocked,undefined,false);vi.updateHUD();vi.cameras.main.centerOn(vi.player.x,vi.player.y);game.loop.wake();
   },id);
   await page.keyboard.press('e');await page.locator(`.village-layer[data-npc="${id}"]:not([hidden])`).waitFor();
   await page.evaluate(()=>game.loop.sleep());
  };
  const close=async()=>{await page.keyboard.press('Escape');await page.locator('.village-layer').waitFor({state:'hidden'});};
  const exchange=async(side,item,quantity)=>{
   await page.locator(`[data-village-tab="${side}"]`).click();await page.locator(`[data-trade-item="${item}"]`).click();
   await page.locator('[data-trade-quantity]').fill(String(quantity));
   await page.locator(`[data-trade-action="${side}"]`).click();
   await page.locator('.village-feedback').filter({hasText:side==='buy'?'Compra concluída':'Venda concluída'}).waitFor();
   return snapshot();
  };

  await visit('rosa');
  assert.ok((await page.locator('.village-dialogue-text').innerText()).includes('Rosa'));
  await page.locator('[data-village-tab="buy"]').click();await page.locator('[data-trade-item="seeds"]').click();
  assert.equal(await page.locator('[data-trade-action="buy"]').isDisabled(),true);
  const beforeRefusal=await snapshot();
  await page.locator('[data-trade-action="buy"]').evaluate(button=>button.click());assert.deepEqual(await snapshot(),beforeRefusal);
  const rosaSale=await exchange('sell','turnip',10);assert.equal(rosaSale.coins,180);assert.equal(rosaSale.inventory.turnip,10);
  const rosaBuy=await exchange('buy','seeds',3);assert.equal(rosaBuy.coins,156);assert.equal(rosaBuy.inventory.seeds,baseline.inventory.seeds+3);
  await page.screenshot({path:path.join(output,'comercio-rosa.png')});
  const positionBeforeModalKeys=await page.evaluate(()=>({x:vi.player.x,y:vi.player.y,time:vi.state.time}));
  await page.evaluate(()=>game.loop.wake());await page.keyboard.down('d');
  await page.waitForTimeout(180);await page.keyboard.up('d');
  const positionAfterModalKeys=await page.evaluate(()=>{game.loop.sleep();return {x:vi.player.x,y:vi.player.y,time:vi.state.time};});
  assert.deepEqual(positionAfterModalKeys,positionBeforeModalKeys,'Modal pauses movement and clock');await close();

  await visit('bento');const bentoSale=await exchange('sell','stone',70);assert.equal(bentoSale.coins,296);assert.equal(bentoSale.inventory.stone,30);
  const bentoBuy=await exchange('buy','hoe',1);assert.equal(bentoBuy.coins,196);assert.equal(bentoBuy.inventory.hoe,1);
  assert.equal(await page.locator('[data-trade-action="buy"]').isDisabled(),true);
  assert.ok((await page.locator('.village-trade-hint').innerText()).includes('já possui'));
  const beforeDuplicate=await snapshot();await page.locator('[data-trade-action="buy"]').evaluate(button=>button.click());assert.deepEqual(await snapshot(),beforeDuplicate);
  await close();

  await visit('tobias');const tobiasSale=await exchange('sell','wood',20);assert.equal(tobiasSale.coins,236);assert.equal(tobiasSale.inventory.wood,80);
  const tobiasBuy=await exchange('buy','plank',2);assert.equal(tobiasBuy.coins,212);assert.equal(tobiasBuy.inventory.plank,baseline.inventory.plank+2);
  await close();
  const dialogue={};
  for(const id of ['augusto','amelia','celina','damiao','helena','icaro']){
   await visit(id);dialogue[id]=await page.locator('.village-dialogue-text').innerText();
   assert.ok(dialogue[id].length>20);assert.equal(await page.locator('[data-village-tab="buy"]').count(),1);
   await page.locator('[data-village-dialogue-next]').click();
   assert.notEqual(await page.locator('.village-dialogue-text').innerText(),dialogue[id]);
   await close();
  }
  const nileDay1=await page.evaluate(()=>({day:vi.state.day,visible:vi.villagers.find(n=>n.data.id==='nilo').sprite.visible}));
  assert.equal(nileDay1.day,1);
  if(nileDay1.visible){
   await visit('nilo');assert.equal(await page.locator('[data-village-tab="buy"]').count(),0);
   assert.ok((await page.locator('.village-feedback').innerText()).includes('3'));await close();
  }
  await page.evaluate(()=>{vi.state.day=3;vi.update(0,0);});
  await visit('nilo');dialogue.nilo=await page.locator('.village-dialogue-text').innerText();
  assert.equal(await page.locator('[data-village-tab="buy"]').count(),1);
  await page.locator('[data-village-tab="buy"]').click();
  const travelerOffers=await page.locator('[data-trade-item]').evaluateAll(items=>items.map(item=>item.dataset.tradeItem));
  assert.equal(travelerOffers.length,3);await close();
  await visit('augusto');await page.locator('[data-village-tab="buy"]').click();
  const generalOffers=await page.locator('[data-trade-item]').evaluateAll(items=>items.map(item=>item.dataset.tradeItem));
  assert.equal(generalOffers.length,4);await close();
  const traded=await snapshot();assert.equal(traded.coins,212);assert.equal(traded.met.length,10);
  const servicesBefore=await page.evaluate(()=>({state:structuredClone(vi.state),inventory:{...vi.inventory.data}}));
  await page.evaluate(()=>{vi.state.villageEconomy.coins=5000;Object.assign(vi.inventory.data,{metalPart:30,stone:30,rareHerb:5,cloth:30,fiber:30,cord:30,herb:30,fishingRod:1,bait:5});});
  for(const [npc,service]of[['bento','upgrade-hoe'],['amelia','learn-medicine'],['celina','learn-tailoring'],['damiao','fishing-lesson'],['tobias','plan-survivor']]){
   await visit(npc);await page.locator('[data-village-tab="services"]').click();await page.locator(`[data-village-service="${service}"]`).click();
   assert.ok((await page.locator('.village-feedback').innerText()).includes('concluído'));if(npc==='bento')await page.screenshot({path:path.join(output,'servicos-bento.png')});await close();
  }
  assert.equal(await page.evaluate(()=>vi.state.villageProgress.toolLevels.hoe),1);
  await page.evaluate(()=>game.loop.wake());await page.keyboard.press('c');await page.locator('[data-recipe="bandage"]').click();
  await page.waitForFunction(()=>vi.inventory.data.bandage===2);
  await page.locator('.crafting-card .icon-button').click();

  await page.evaluate(()=>{vi.player.x=80*32;vi.player.y=44*32;vi.player.update(0,vi.blocked,undefined,false);vi.updateHUD();game.loop.wake();});
  await page.keyboard.press('i');await page.locator('[data-bag-item="item:fishingRod"]').click();await page.locator('[data-use-item="fishingRod"]').click();
  await page.locator('[data-fishing-reel]:not([disabled])').waitFor();await page.locator('[data-fishing-reel]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-fishing-prompt]'));
  const fishing=await page.evaluate(()=>({fish:vi.inventory.data.fish+vi.inventory.data.rareFish,bait:vi.inventory.data.bait}));
  assert.equal(fishing.fish,1);assert.equal(fishing.bait,4);
  await page.evaluate(()=>game.loop.wake());await page.keyboard.press('i');await page.locator('[data-bag-item="item:bandage"]').click();await page.locator('[data-use-item="bandage"]').click();
  await page.waitForFunction(()=>vi.state.villageProgress.vigor===100&&vi.inventory.data.bandage===1);

  await page.evaluate(before=>{vi.state=structuredClone(before.state);Object.assign(vi.inventory.data,before.inventory);vi.updateHUD();game.loop.sleep();},servicesBefore);
  console.log('PASS services UI for five specialties and actual timed fishing consuming bait and awarding fish');

  console.log('PASS E dialogue with all ten NPCs, actual shops, sale/purchases, wallet/refusal guards and travelling merchant calendar');

  await page.evaluate(()=>{
   vi.player.x=46.5*32;vi.player.y=45.5*32;vi.player.update(0,vi.blocked,undefined,false);
   vi.changeCameraZoom(0);vi.updateHUD();vi.cameras.main.centerOn(vi.player.x,vi.player.y);vi.cameras.main.preRender();
  });
  await page.evaluate(()=>game.loop.wake());await page.waitForTimeout(80);await page.evaluate(()=>game.loop.sleep());
  await page.screenshot({path:path.join(output,'vila-praca-no-jogo.png')});
  await page.keyboard.press('m');await page.locator('.map-card .map-snapshot').waitFor();
  await page.waitForFunction(()=>document.querySelector('.map-snapshot')?.src.startsWith('data:image'));
  assert.equal(await page.locator('.map-card h2').innerText(),'Vila do Recomeço');
  const marker=await page.locator('.map-player').evaluate(el=>({left:parseFloat(el.style.left),top:parseFloat(el.style.top)}));
  assert.ok(Math.abs(marker.left-46.5/96*100)<.1);assert.ok(Math.abs(marker.top-45.5/72*100)<.1);
  await page.screenshot({path:path.join(output,'mapa-da-vila.png')});
  await page.evaluate(()=>game.loop.wake());await page.keyboard.press('m');await page.locator('.map-card').waitFor({state:'detached'});await page.evaluate(()=>game.loop.sleep());
  await page.locator('[data-zoom="-1"]').click();assert.equal(await page.locator('.camera-zoom-value').innerText(),'75%');
  await page.locator('[data-zoom="0"]').click();assert.equal(await page.locator('.camera-zoom-value').innerText(),'100%');
  assert.equal(await page.locator('#hud-coins').innerText(),'212');

  const native=await page.evaluate(async()=>{
   game.loop.sleep();vi.state.time=720;vi.daylight.update(720);vi.daylight.setVisible(false);vi.world.updateLighting(720);
   for(const tree of vi.world.trees)tree.setAlpha(1);
   for(const n of vi.villagers)n.label.setVisible(true);
   const rt=vi.make.renderTexture({width:3072,height:2304},false);rt.camera.setZoom(1).setScroll(0,0).setOrigin(0,0);
   vi.children.depthSort();rt.draw(vi.children.list.filter(o=>o!==vi.player.sprite&&!vi.daylight.contains(o)&&'visible'in o&&o.visible));
   return new Promise(resolve=>rt.snapshot(image=>{const result=image.src;rt.destroy();resolve(result);}));
  });
  fs.writeFileSync(path.join(output,'After-Rain-Vila-do-Recomeco.png'),Buffer.from(native.split(',')[1],'base64'));

  const beforeReload=await page.evaluate(()=>{
   vi.daylight.setVisible(true);vi.input.keyboard.resetKeys();if(!vi.persist())throw Error('Village save failed');
   return {position:{...vi.state.villagePosition},economy:structuredClone(vi.state.villageEconomy),inventory:{...vi.inventory.data}};
  });
  await page.reload();await page.locator('#continue-game').click();await page.locator('#ui[data-area="village"] .toolbelt').waitFor();await attach();
  const afterReload=await page.evaluate(()=>({position:{...vi.state.villagePosition},economy:structuredClone(vi.state.villageEconomy),inventory:{...vi.inventory.data},active:vi.state.activeArea}));
  assert.equal(afterReload.active,'village');assert.deepEqual(afterReload.economy,beforeReload.economy);assert.deepEqual(afterReload.inventory,beforeReload.inventory);
  assert.ok(Math.abs(afterReload.position.x-beforeReload.position.x)<1&&Math.abs(afterReload.position.y-beforeReload.position.y)<1);
  await visit('nilo');await page.locator('[data-village-tab="buy"]').click();
  assert.deepEqual(await page.locator('[data-trade-item]').evaluateAll(items=>items.map(item=>item.dataset.tradeItem)),travelerOffers);
  await close();await visit('augusto');await page.locator('[data-village-tab="buy"]').click();
  assert.deepEqual(await page.locator('[data-trade-item]').evaluateAll(items=>items.map(item=>item.dataset.tradeItem)),generalOffers);await close();
  await walk('village');
  const returned=await page.evaluate(()=>{
   s.input.keyboard.resetKeys();for(let n=0;n<45;n++)s.update(0,1000/60);
   return {active:s.state.activeArea,x:s.player.x,y:s.player.y,coins:s.state.villageEconomy.coins,inventory:{...s.inventory.data},villageActive:s.villageActive,property:s.state.mapEdits,forest:s.state.forestMapEdits};
  });
  assert.equal(returned.active,'property');assert.equal(returned.villageActive,false);assert.equal(returned.coins,212);assert.deepEqual(returned.inventory,traded.inventory);
  assert.ok(Math.abs(returned.x-93.5*32)<1&&Math.abs(returned.y-52.5*32)<1);
  assert.deepEqual(returned.property,baseline.property);assert.deepEqual(returned.forest,baseline.forest);
  assert.equal(await page.locator('#hud-coins').innerText(),'212');
  await page.reload();await page.locator('#continue-game').click();await page.locator('#ui[data-area="property"] .toolbelt').waitFor();await attach();
  const farmReload=await page.evaluate(()=>({coins:s.state.villageEconomy.coins,inventory:{...s.inventory.data},active:s.state.activeArea}));
  assert.equal(farmReload.coins,212);assert.deepEqual(farmReload.inventory,traded.inventory);assert.equal(farmReload.active,'property');
  assert.deepEqual(errors,[]);
  console.log('PASS map M and position, camera zoom, native village capture, Continue in village, return and farm reload');
  await page.close();

  const preview=await browser.newPage({viewport:{width:1536,height:1152},deviceScaleFactor:1});
  await preview.setContent('<html><head><style>html,body{margin:0;overflow:hidden;background:#345738}img{display:block;width:1536px;height:1152px;image-rendering:pixelated}</style></head><body><img id="village"></body></html>');
  await preview.evaluate(async native=>{const image=document.getElementById('village');image.src=native;await image.decode();},native);
  await preview.screenshot({path:path.join(output,'After-Rain-Vila-do-Recomeco-previa.png')});
  fs.writeFileSync(path.join(output,'validacao.json'),JSON.stringify({passed:true,at:new Date().toISOString(),entry,accessible,traded,dialogue,nileDay1,travelerOffers,generalOffers,marker,
   beforeReload,afterReload,returned:{active:returned.active,x:returned.x,y:returned.y,coins:returned.coins,villageActive:returned.villageActive},farmReload,
   tests:['east gate real walking','village return real walking','all ten NPC E interactions','merchant buy/sell UI','insufficient funds refusal','owned-tool duplicate refusal','modal movement/clock pause','traveller day1/day3 availability','daily offers stable across reload','map correct player marker','zoom','Continue in village','return and farm reload','no arrival bounce','property and forest layouts preserved'],errors},null,2)+'\n');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
