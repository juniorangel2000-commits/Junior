const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {walkMapExit}=require('./qa-walk-exit.cjs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const dir='docs/cenarios/cercado-funcional';fs.mkdirSync(dir,{recursive:true});const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5178');await page.locator('#new-game').click();await page.locator('#character-name').fill('Cercado');await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
 const attach=async()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.s=game.scene.getScene('Vale');window.f=game.scene.getScene('Floresta');game.loop.sleep();window.qt=s.time.now;window.step=ms=>{qt+=ms;game.step(qt,ms)}});await attach();
 const pen=await page.evaluate(()=>{
  s.state.day=61;s.state.time=720;s.inventory.data.wood=200;s.inventory.data.fiber=3;s.updateHUD();
  const candidates=[];for(let y=20;y<64;y++)for(let x=4;x<86;x++){
   let free=true;for(let dy=0;dy<7&&free;dy++)for(let dx=0;dx<7;dx++){const edge=dx===0||dy===0||dx===6||dy===6;if((edge?!s.world.isBuildable(x+dx,y+dy):s.animalBlocked(x+dx,y+dy))||s.farming.isPrepared(x+dx,y+dy)){free=false;break}}
   if(!s.world.isBuildable(x+3,y+7)||s.animalBlocked(x+1,y-1))free=false;
   if(free){let cover=0;for(let dy=0;dy<7;dy++)for(let dx=0;dx<7;dx++)cover+=s.animals.treeCover.cost(x+dx,y+dy);candidates.push({x,y,score:cover*30+Math.hypot(x-25,y-30)*.05})}
  }
  candidates.sort((a,b)=>a.score-b.score);const root=candidates[0];if(!root)throw Error('No natural empty patch for pen');
  window.penRoot=root;window.penGate={x:root.x+3,y:root.y+6};
  s.player.x=(penGate.x+.5)*32;s.player.y=(penGate.y+1.5)*32;s.player.facing={x:0,y:-1};s.lastAim=null;
  return {root,gate:penGate};
 });console.log('pen site',pen);
 await page.keyboard.press('c');await page.locator('[data-recipe="cord"]').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>s.inventory.data.cord),1);
 await page.keyboard.press('b');await page.locator('[data-build="gate"]').click();await page.keyboard.press('r');assert.equal(await page.evaluate(()=>s.rotation),1);for(const expected of [2,3,0]){await page.keyboard.press('r');assert.equal(await page.evaluate(()=>s.rotation),expected)}
 const build=await page.evaluate(()=>{const before=s.inventory.data.wood;s.nextInteractionAt=0;s.interact(penGate);const gate=s.building.at(penGate.x,penGate.y);if(gate?.kind!=='gate')throw Error('Gate failed: '+document.querySelector('.toast-stack').innerText);
  const placed=[];for(let x=penRoot.x;x<=penRoot.x+6;x++)for(let y=penRoot.y;y<=penRoot.y+6;y++)if((x===penRoot.x||x===penRoot.x+6||y===penRoot.y||y===penRoot.y+6)&&!(x===penGate.x&&y===penGate.y)){
   const result=s.building.place('fence',x,y,s.inventory,s.freeForBuilding(x,y,'fence'),{nearWorkbench:false,day:s.state.day});if(!result.ok)throw Error(result.message);placed.push({x,y});
  }s.afterAction();return {gate:{...gate},cost:before-s.inventory.data.wood,fences:placed.length};});assert.equal(build.gate.rotation,0);assert.equal(build.fences,23);assert.equal(build.cost,50);
 // Open with E and refuse closing on the player standing in the opening.
 await page.evaluate(()=>{s.selectTool('hand');s.nextInteractionAt=0;s.lastAim=null});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>s.building.at(penGate.x,penGate.y).open),true);
 await page.evaluate(()=>{s.player.x=(penGate.x+.5)*32;s.player.y=(penGate.y+.5)*32;s.nextInteractionAt=0;s.interact(penGate)});assert.equal(await page.evaluate(()=>s.building.at(penGate.x,penGate.y).open),true);
 // Repair through construction UI: restore an aged piece once, no charge on a new one.
 await page.evaluate(()=>{window.repairTile={x:penRoot.x+1,y:penRoot.y};const b=s.building.at(repairTile.x,repairTile.y);b.fenceBuiltDay=1;s.player.x=(repairTile.x+.5)*32;s.player.y=(repairTile.y-.5)*32;s.syncSprites();s.updateHUD()});
 await page.keyboard.press('b');await page.locator('[data-build="repair"]').click();
 const repair=await page.evaluate(()=>{const before=s.inventory.data.wood;s.nextInteractionAt=0;s.interact(repairTile);const after=s.inventory.data.wood;s.nextInteractionAt=0;s.interact(repairTile);return {before,after,afterRepeat:s.inventory.data.wood,builtDay:s.building.at(repairTile.x,repairTile.y).fenceBuiltDay}});assert.equal(repair.after,repair.before-1);assert.equal(repair.afterRepeat,repair.after);assert.equal(repair.builtDay,61);
 // Real marked map crossing, capture near the approach, and carry the allocated cord back.
 await page.evaluate(()=>s.selectTool('hand'));await walkMapExit(page,'Vale');await attach();
 const animalId=await page.evaluate(()=>{const entry=f.state.forestMapEdits.points.entry;const a=f.wildlife.animals.find(a=>a.brain.kind==='chicken');f.player.x=(entry.x+.5)*32;f.player.y=(entry.y+.5)*32;a.brain.x=f.player.x-18;a.brain.y=f.player.y;window.animalId=a.id;f.state.inventory.cord=1;f.interact();if(!f.state.animalEscort)throw Error('Could not catch');return a.id});
 await walkMapExit(page,'Floresta');await attach();assert.equal(await page.evaluate(()=>s.state.animalEscort?.id),animalId);assert.equal(await page.evaluate(()=>s.inventory.data.cord),0);assert.equal(await page.evaluate(id=>(s.state.recruitedAnimals??[]).includes(id),animalId),false);
 await page.evaluate(()=>s.persist());await page.reload();await page.locator('#continue-game').click();await page.locator('.toolbelt').waitFor();await attach();
 assert.equal(await page.evaluate(()=>s.state.animalEscort?.id),animalId);assert.equal(await page.evaluate(()=>s.inventory.data.cord),0);
 await page.evaluate(pen=>{window.penRoot=pen.root;window.penGate=pen.gate},pen);
 // Route by real ground and gate collision. Every step uses player/rope/animal movement.
 const walk=async target=>page.evaluate(target=>{
  const player=s.player,keys=player.keys,clear=()=>Object.values(keys).forEach(k=>k.isDown=false);
  const sx=Math.floor(player.x/32),sy=Math.floor(player.y/32),nodes=[{x:sx,y:sy,parent:-1}],seen=new Set([`${sx},${sy}`]);let found=-1;
  for(let n=0;n<nodes.length;n++){const node=nodes[n];if(node.x===target.x&&node.y===target.y){found=n;break}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=node.x+dx,y=node.y+dy,k=`${x},${y}`;if(seen.has(k)||x<1||y<1||x>94||y>70||s.animalBlocked(x,y))continue;seen.add(k);nodes.push({x,y,parent:n})}}
  if(found<0)throw Error('No path from property entry to gate');const path=[];for(let n=found;n>=0;n=nodes[n].parent)path.push({x:nodes[n].x*32+16,y:nodes[n].y*32+16});path.reverse();let frames=0,maxRope=0;
  for(const point of path){let tries=0;while(Math.hypot(player.x-point.x,player.y-point.y)>1.5&&tries++<1800){clear();const dx=point.x-player.x,dy=point.y-player.y;if(Math.abs(dx)>1)keys[dx>0?'D':'A'].isDown=true;if(Math.abs(dy)>1)keys[dy>0?'S':'W'].isDown=true;s.update(0,1000/60);frames++;const a=s.animals.led;if(!a)throw Error('Rope vanished');maxRope=Math.max(maxRope,Math.hypot(a.x-player.x,a.y-player.y));if(player.isSwimming||!a.brain.canStand(a.x,a.y))throw Error('Animal/player left ground')}
   if(tries>=1800)throw Error(JSON.stringify({stuck:point,player:{x:player.x,y:player.y},animal:s.animals.led.brain.snapshot()}));}
  clear();for(let i=0;i<150;i++)s.update(0,1000/60);return {tiles:path.length,frames,maxRope,animal:s.animals.led.brain.snapshot()};
 },target);
 const route=await walk({x:pen.root.x+3,y:pen.root.y+2});assert.ok(route.maxRope<=88.1);assert.ok(route.animal.x>(pen.root.x+1)*32&&route.animal.x<(pen.root.x+6)*32&&route.animal.y<(pen.root.y+6)*32);
 await walk({x:pen.gate.x,y:pen.gate.y-1});await page.evaluate(()=>{s.player.facing={x:0,y:1};s.lastAim=null;s.selectTool('hand');s.nextInteractionAt=0});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>s.building.at(penGate.x,penGate.y).open),false);
 await page.keyboard.press('g');assert.equal(await page.evaluate(()=>s.state.animalEscort??null),null);assert.equal(await page.evaluate(()=>s.inventory.data.cord),1);assert.equal(await page.evaluate(id=>s.state.recruitedAnimals.filter(x=>x===id).length,animalId),1);
 const confined=await page.evaluate(id=>{const a=s.animals.animals.find(a=>a.id===id);let escaped=false;const before=a.brain.distanceMoved;for(let i=0;i<2500;i++){s.animals.update(.1,s.player);if(a.x<=(penRoot.x+1)*32||a.x>=(penRoot.x+6)*32||a.y<=(penRoot.y+1)*32||a.y>=(penRoot.y+6)*32)escaped=true}return {escaped,moved:a.brain.distanceMoved-before,position:a.brain.snapshot()}},animalId);assert.equal(confined.escaped,false);assert.ok(confined.moved>20);
 await page.evaluate(()=>{s.persist();s.cameras.main.stopFollow().setZoom(2).centerOn((penRoot.x+3.5)*32,(penRoot.y+3.5)*32);s.state.time=720;s.updateNight();s.updateHUD();for(const o of s.children.list)if(/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(o.texture?.key??''))o.setVisible(false);document.querySelector('#ui').style.visibility='hidden';step(0)});await page.screenshot({path:`${dir}/cercado-fechado.png`});
 await page.evaluate(()=>document.querySelector('#ui').style.visibility='');await page.reload();await page.locator('#continue-game').click();await page.locator('.toolbelt').waitFor();await attach();await page.evaluate(pen=>{window.penRoot=pen.root;window.penGate=pen.gate},pen);
 assert.equal(await page.evaluate(()=>s.building.at(penGate.x,penGate.y).open),false);assert.equal(await page.evaluate(()=>s.inventory.data.cord),1);assert.equal(await page.evaluate(id=>s.state.recruitedAnimals.filter(x=>x===id).length,animalId),1);
 // Reattach a settled animal, reload the allocated rope, and release without duplicating it.
 await page.evaluate(id=>{const a=s.animals.animals.find(a=>a.id===id);const point=[[18,0],[-18,0],[0,18],[0,-18]].map(([dx,dy])=>({x:a.x+dx,y:a.y+dy})).find(p=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!s.movementBlockedPoint(p.x+dx,p.y+dy))&&a.brain.lineClear(p,a.brain));if(!point)throw Error('No clear approach to animal');s.player.x=point.x;s.player.y=point.y;s.selectTool('hand');s.nextInteractionAt=0;s.interact({x:Math.floor(a.x/32),y:Math.floor(a.y/32)})},animalId);assert.equal(await page.evaluate(()=>s.state.animalEscort?.id),animalId);await page.evaluate(()=>s.persist());await page.reload();await page.locator('#continue-game').click();await page.locator('.toolbelt').waitFor();await attach();await page.evaluate(pen=>{window.penRoot=pen.root;window.penGate=pen.gate},pen);assert.equal(await page.evaluate(()=>s.inventory.data.cord),0);assert.equal(await page.evaluate(()=>s.state.animalEscort?.id),animalId);await page.keyboard.press('g');assert.equal(await page.evaluate(()=>s.inventory.data.cord),1);
 // Open gate and let existing movement choose the exit naturally.
 await page.evaluate(()=>{s.player.x=(penGate.x+.5)*32;s.player.y=(penGate.y-.5)*32;s.player.facing={x:0,y:1};s.lastAim=null;s.nextInteractionAt=0;s.interact(penGate)});assert.equal(await page.evaluate(()=>s.building.at(penGate.x,penGate.y).open),true);
 const animalCloseGuard=await page.evaluate(id=>{
  const a=s.animals.animals.find(a=>a.id===id),old=a.brain.snapshot();
  a.brain.x=(penGate.x+.5)*32;a.brain.y=(penGate.y+.5)*32-16-a.brain.radius*.6;
  const valid=a.brain.canStand(a.x,a.y);s.nextInteractionAt=0;s.interact(penGate);
  const refused=s.building.at(penGate.x,penGate.y).open===true;a.brain.restore(old);
  return {valid,refused};
 },animalId);assert.equal(animalCloseGuard.valid,true);assert.equal(animalCloseGuard.refused,true);
 // Natural wandering may prefer the sheltered ground inside. Verify the open
 // passage explicitly by leading the settled animal through it with the real rope.
 await page.evaluate(id=>{const a=s.animals.animals.find(a=>a.id===id);const point=[[18,0],[-18,0],[0,18],[0,-18]].map(([dx,dy])=>({x:a.x+dx,y:a.y+dy})).find(p=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!s.movementBlockedPoint(p.x+dx,p.y+dy))&&a.brain.lineClear(p,a.brain));if(!point)throw Error('No approach');s.player.x=point.x;s.player.y=point.y;s.selectTool('hand');s.nextInteractionAt=0;s.interact({x:Math.floor(a.x/32),y:Math.floor(a.y/32)})},animalId);assert.equal(await page.evaluate(()=>s.state.animalEscort?.id),animalId);
 const outside=await page.evaluate(()=>{
  const q=[{x:penGate.x,y:penGate.y+1}],seen=new Set([`${penGate.x},${penGate.y+1}`]);
  for(let n=0;n<q.length;n++){const p=q[n];if(Math.hypot(p.x-penGate.x,p.y-penGate.y)>=4)return p;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(seen.has(k)||x<1||y<1||x>94||y>70||s.animalBlocked(x,y)||x>penRoot.x&&x<penRoot.x+6&&y>penRoot.y&&y<penRoot.y+6)continue;seen.add(k);q.push({x,y})}}throw Error('No exterior approach');
 });
 const exitRoute=await walk(outside);
 const escaped={escaped:exitRoute.animal.x<(pen.root.x+1)*32||exitRoute.animal.x>(pen.root.x+6)*32||exitRoute.animal.y<(pen.root.y+1)*32||exitRoute.animal.y>(pen.root.y+6)*32,route:exitRoute};assert.equal(escaped.escaped,true);await page.keyboard.press('g');assert.equal(await page.evaluate(()=>s.inventory.data.cord),1);
 await page.evaluate(()=>{s.cameras.main.stopFollow().setZoom(2).centerOn((penRoot.x+3.5)*32,(penRoot.y+3.5)*32);for(const o of s.children.list)if(/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(o.texture?.key??''))o.setVisible(false);document.querySelector('#ui').style.visibility='hidden';step(0)});await page.screenshot({path:`${dir}/cercado-aberto.png`});
 const valid=await page.evaluate(async()=>{s.persist();return (await import('/src/systems/save.ts')).validateSave(s.state)});assert.equal(valid,true);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({pen,build,repair,animalId,route,confined,animalCloseGuard,escaped,valid,errors},null,2));console.log('PASS: UI construction, occupancy guard, repair, real map crossing, property escort reload, full ground route into pen, G release, closed confinement, owned-animal recapture, saved gate and open passage');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
