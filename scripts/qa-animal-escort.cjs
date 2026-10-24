const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(30000);
 const attach=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');window.forest=game.scene.getScene('Floresta');});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Corda');await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
 await page.evaluate(()=>{valley.inventory.data.fiber=3;valley.updateHUD();});await page.keyboard.press('c');
 await page.locator('[data-recipe="cord"]').click();assert.equal(await page.evaluate(()=>valley.inventory.data.cord),1);assert.equal(await page.evaluate(()=>valley.inventory.data.fiber),0);await page.keyboard.press('Escape');
 await page.evaluate(()=>{const e=valley.forestGate();valley.player.x=e.x*32+16;valley.player.y=e.y*32+16;valley.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');await attach();
 const movement=await page.evaluate(()=>{
  forest.scene.pause();const initial=forest.animals.map(a=>({id:a.id,x:a.x,y:a.y}));
  for(let i=0;i<300;i++)forest.update(0,1000/60);
  forest.scene.resume();return forest.animals.map(a=>({id:a.id,distance:a.brain.distanceMoved,displacement:Math.hypot(a.x-initial.find(p=>p.id===a.id).x,a.y-initial.find(p=>p.id===a.id).y),valid:a.brain.canStand(a.x,a.y)}));
 });assert.equal(movement.length,10);assert.ok(movement.every(a=>a.distance>0&&a.valid));console.log('all species move on real terrain');
 // E/G use the real scene handlers. Pause Phaser's scheduling so the capture radius is stable.
 await page.evaluate(()=>{const a=forest.animals[0];window.animalId=a.id;forest.player.x=a.x;forest.player.y=a.y+20;forest.player.update(0,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);forest.state.inventory.cord=0;forest.interact();});
 assert.equal(await page.evaluate(()=>!!forest.state.animalEscort),false);assert.equal(await page.evaluate(()=>(forest.state.recruitedAnimals??[]).length),0);
 await page.evaluate(()=>{forest.state.inventory.fiber=3;forest.updateHUD();});await page.keyboard.press('c');await page.locator('[data-recipe="cord"]').click();assert.equal(await page.evaluate(()=>forest.state.inventory.cord),1);await page.keyboard.press('Escape');
 await page.evaluate(()=>{const a=forest.animals.find(a=>a.id===animalId);forest.player.x=a.x;forest.player.y=a.y+20;forest.player.update(0,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);forest.interact();forest.wildlife.update(1/60,forest.player);forest.updateHUD();});
 assert.equal(await page.evaluate(()=>forest.state.animalEscort.id),await page.evaluate(()=>animalId));assert.equal(await page.evaluate(()=>forest.state.inventory.cord),0);
 assert.ok((await page.locator('#ui').innerText()).includes('soltar corda'));
 await page.keyboard.press('g');assert.equal(await page.evaluate(()=>!!forest.state.animalEscort),false);assert.equal(await page.evaluate(()=>forest.state.inventory.cord),1);
 await page.keyboard.press('g');assert.equal(await page.evaluate(()=>forest.state.inventory.cord),1);
 await page.evaluate(()=>{const a=forest.animals.find(a=>a.id===animalId);forest.player.x=a.x;forest.player.y=a.y+20;forest.interact();forest.persist();});
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="forest"]');await attach();
 await page.evaluate(()=>{forest.scene.pause();window.animalId=forest.state.animalEscort.id;});
 assert.equal(await page.evaluate(()=>forest.wildlife.led.id),await page.evaluate(()=>animalId));assert.equal(await page.evaluate(()=>forest.state.inventory.cord),0);console.log('craft, attach, release, reload escort OK');
 // A taut rope stops the player, even if the animal has been left behind by external edits.
 const constraints=await page.evaluate(()=>{
  const a=forest.wildlife.led,p=forest.player;
  return {far:forest.wildlife.allowsPlayerCenter(a.x+100,a.y,{x:a.x+87,y:a.y}),near:forest.wildlife.allowsPlayerCenter(a.x+80,a.y,{x:a.x+87,y:a.y}),farExit:forest.wildlife.canLeave({x:forest.exit().x*32+16,y:forest.exit().y*32+16}),water:(()=>{for(let y=1;y<71;y++)for(let x=1;x<95;x++)if(forest.waterContains(x*32+16,y*32+16))return forest.wildlife.allowsPlayerCenter(x*32+16,y*32+16,p);return true;})()};
 });assert.equal(constraints.far,false);assert.equal(constraints.near,true);assert.equal(constraints.farExit,false);assert.equal(constraints.water,false);
 // Walk the full authored forest route, using real player keys, collisions, leash and updates.
 const route=await page.evaluate(()=>{
  const p=forest.player,keys=p.keys,exit=forest.exit(),sx=Math.floor(p.x/32),sy=Math.floor(p.y/32);
  const nodes=[{x:sx,y:sy,parent:-1}],seen=new Set([`${sx},${sy}`]);let found=-1;
  for(let n=0;n<nodes.length;n++){const a=nodes[n];if(a.x===exit.x&&a.y===exit.y){found=n;break;}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=a.x+dx,y=a.y+dy,k=`${x},${y}`;if(seen.has(k)||forest.animalBlocked(x,y))continue;seen.add(k);nodes.push({x,y,parent:n});}
  }
  if(found<0)throw Error('No connected ground route to marked exit');
  const path=[];for(let n=found;n>=0;n=nodes[n].parent)path.push({x:nodes[n].x*32+16,y:nodes[n].y*32+16});path.reverse();
  const clear=()=>Object.values(keys).forEach(k=>k.isDown=false);clear();let frames=0,maxRope=0;
  for(let n=0;n<path.length;n++){
   const target=path[n];let i=0;
   while(Math.hypot(p.x-target.x,p.y-target.y)>1.5&&i++<1800){
    clear();const dx=target.x-p.x,dy=target.y-p.y;if(Math.abs(dx)>1)keys[dx>0?'D':'A'].isDown=true;if(Math.abs(dy)>1)keys[dy>0?'S':'W'].isDown=true;
    forest.update(0,1000/60);frames++;const a=forest.wildlife.led;maxRope=Math.max(maxRope,Math.hypot(a.x-p.x,a.y-p.y));
    if(!a.brain.canStand(a.x,a.y)||p.isSwimming)throw Error('Animal left ground or player swam with rope');
   }
   if(i>=1800){const a=forest.wildlife.led;throw Error(JSON.stringify({stuckAt:n,target,player:{x:p.x,y:p.y},animal:{x:a.x,y:a.y},mode:a.brain.mode,path:a.brain.path}));}
  }
  clear();for(let i=0;i<300;i++)forest.update(0,1000/60);
  forest.updateHUD();forest.applyCamera();forest.cameras.main.preRender();
  return {tiles:path.length,frames,maxRope,nearExit:forest.nearExit(),canLeave:forest.wildlife.canLeave(p),animalId:forest.state.animalEscort.id};
 });assert.ok(route.tiles>50);assert.ok(route.maxRope<=88.1);assert.equal(route.nearExit,true);assert.equal(route.canLeave,true);console.log('walked forest',route);
 await page.screenshot({path:'docs/cenarios/animais-corda.png'});
 await page.evaluate(()=>{forest.interact();forest.scene.resume();});await page.waitForSelector('#ui[data-area="property"]');await attach();
 const delivered=await page.evaluate(id=>({owned:valley.state.recruitedAnimals,escort:valley.state.animalEscort??null,cord:valley.inventory.data.cord,actor:valley.animals.animals.some(a=>a.id===id),valid:valley.animals.animals.every(a=>a.brain.canStand(a.x,a.y)),inventory:Object.keys(valley.inventory.data)}),route.animalId);
 assert.deepEqual(delivered.owned,[route.animalId]);assert.equal(delivered.escort,null);assert.equal(delivered.cord,1);assert.equal(delivered.actor,true);assert.equal(delivered.valid,true);assert.ok(!delivered.inventory.includes(route.animalId));
 await page.evaluate(()=>{valley.persist();});await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="property"]');await attach();
 assert.equal(await page.evaluate(()=>valley.inventory.data.cord),1);assert.deepEqual(await page.evaluate(()=>valley.state.recruitedAnimals),[route.animalId]);
 await page.evaluate(()=>{const e=valley.forestGate();valley.player.x=e.x*32+16;valley.player.y=e.y*32+16;valley.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');await attach();
 assert.equal(await page.evaluate(id=>forest.animals.some(a=>a.id===id),route.animalId),false);assert.equal(await page.evaluate(()=>forest.animals.length),9);
 const valid=await page.evaluate(async()=>{const {validateSave}=await import('/src/systems/save.ts');forest.persist();return validateSave(forest.state);});assert.equal(valid,true);assert.deepEqual(errors,[]);
 const report={passed:true,movement,route,checks:['3 fibers -> reusable cord through crafting UI in property and forest','all ten animals move','no cord means no capture','E attach and G release once','save/reload with allocated rope','maximum leash distance and ground-only escort','full ground route to authored portal','delivery only after map crossing','property movement and save reload','no inventory animals or duplicate reward','return to forest removes only delivered animal','no browser errors'],at:new Date().toISOString()};
 fs.writeFileSync('docs/cenarios/validacao-animais-corda.json',JSON.stringify(report,null,2));console.log('PASS animal pursuit, reusable craft and full-map escort');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
