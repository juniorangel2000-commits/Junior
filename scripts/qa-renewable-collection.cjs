const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const dir='docs/cenarios/recursos-renovaveis';fs.mkdirSync(dir,{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const attach=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.scene=game.scene.getScene('Vale');game.loop.sleep();window.qt=scene.time.now;window.step=ms=>{qt+=ms;game.step(qt,ms);};
  window.approach=node=>{Object.values(scene.player.keys).forEach(k=>k.isDown=false);for(const [dx,dy] of [[-1,0],[1,0],[0,1],[0,-1],[-1,-1],[1,1],[-1,1],[1,-1]]){
   const x=(node.x+dx+.5)*32,y=(node.y+dy+.5)*32;if([[-7,-5],[7,-5],[-7,3],[7,3]].some(([ox,oy])=>scene.world.isBlockedPoint(x+ox,y+oy)))continue;
   scene.player.x=x;scene.player.y=y;scene.player.update(0,scene.movementBlocked,scene.movementBlockedPoint,true,scene.swimmingPoint);
   if(!scene.clearReach(node))continue;scene.lastAim={x:node.x,y:node.y};scene.aimUntil=scene.time.now+100000;scene.nextInteractionAt=0;return;
  }throw Error('No dry accessible point near '+node.id);};
 });
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Coleta');await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
 const initial=await page.evaluate(async()=>{const {nearRiverBank}=await import('/src/data/fiber-plants.ts');return {count:scene.world.resources.filter(n=>n.kind!=='standingTree').length,kinds:[...new Set(scene.world.resources.map(n=>n.kind))],plants:[...new Set(scene.world.resources.filter(n=>n.kind==='fiber').map(n=>n.plant))],badReeds:scene.world.resources.filter(n=>n.plant==='reeds'&&!nearRiverBank(n.x,n.y))};});
 assert.ok(initial.count<=64);for(const k of ['fiber','seeds','stone','tree','fallenLog','stump','vein'])assert.ok(initial.kinds.includes(k),k);for(const p of ['fern','whiteFlowers','bush','reeds'])assert.ok(initial.plants.includes(p),p);assert.deepEqual(initial.badReeds,[]);
 const collected=[];
 for(const plant of ['fern','whiteFlowers','bush','reeds']){
  const info=await page.evaluate(p=>{const n=scene.world.resources.find(n=>n.kind==='fiber'&&n.plant===p&&n.id.startsWith('spawn-'));approach(n);scene.selectTool('hand');return {id:n.id,before:scene.inventory.data.fiber};},plant);
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>scene.inventory.data.fiber),info.before+6);
  assert.equal(await page.evaluate(id=>scene.world.resources.some(n=>n.id===id),info.id),false);collected.push(info.id);
 }
 const beforeBerry=await page.evaluate(()=>{const n=scene.world.resources.find(n=>n.kind==='seeds');approach(n);scene.selectTool('hand');return {seeds:scene.inventory.data.seeds,fiber:scene.inventory.data.fiber,id:n.id};});
 await page.keyboard.press('e');assert.deepEqual(await page.evaluate(()=>({seeds:scene.inventory.data.seeds,fiber:scene.inventory.data.fiber})),{seeds:beforeBerry.seeds+3,fiber:beforeBerry.fiber+2});collected.push(beforeBerry.id);
 for(const kind of ['stone','tree']){
  const before=await page.evaluate(kind=>{const n=scene.world.resources.find(n=>n.kind===kind);approach(n);scene.selectTool('hand');return {id:n.id,stock:{...scene.inventory.data}};},kind);
  await page.keyboard.press('e');assert.equal(await page.evaluate(id=>scene.world.resources.some(n=>n.id===id),before.id),false);collected.push(before.id);
 }
 await page.evaluate(()=>scene.persist());await page.reload();await page.locator('#continue-game').click();await attach();
 for(const id of collected)assert.equal(await page.evaluate(id=>scene.world.resources.some(n=>n.id===id),id),false);
 assert.ok(await page.evaluate(()=>scene.state.resourceFields.property.waiting.filter(w=>w.kind!=='vein').every(w=>w.at>=4320+480)));
 console.log('four fiber plants, berries, small stones and branches collected; reload does not repeat rewards');
 const wood=[];
 await page.evaluate(()=>{scene.inventory.data.hatchet=1;scene.inventory.data.pickaxe=1;scene.updateHUD();});
 for(const kind of ['fallenLog','stump']){
  const node=await page.evaluate(kind=>{const n=scene.world.resources.find(n=>n.kind===kind&&n.id.startsWith('spawn-'));approach(n);scene.selectTool('hand');return {...n};},kind);
  const stock=await page.evaluate(()=>({...scene.inventory.data}));await page.keyboard.press('e');assert.deepEqual(await page.evaluate(()=>({...scene.inventory.data})),stock);
  await page.evaluate(n=>{approach(n);scene.selectTool('hatchet');scene.interact(n);step(250);step(250);},node);
  assert.equal(await page.evaluate(id=>scene.resources.progress.find(p=>p.id===id)?.hits,node.id),1);
  await page.evaluate(()=>scene.persist());await page.reload();await page.locator('#continue-game').click();await attach();
  assert.equal(await page.evaluate(id=>scene.resources.progress.find(p=>p.id===id)?.hits,node.id),1);
  await page.evaluate(n=>{approach(n);scene.selectTool('hatchet');for(let i=0;i<2;i++){scene.nextInteractionAt=0;scene.interact(n);step(250);step(250);}},node);
  const after=await page.evaluate(()=>({...scene.inventory.data}));assert.ok(after.wood>stock.wood&&after.log>stock.log);
  assert.equal(await page.evaluate(id=>scene.world.resources.some(n=>n.id===id),node.id),false);wood.push({kind,id:node.id,gain:{wood:after.wood-stock.wood,log:after.log-stock.log,branch:after.branch-stock.branch}});
 }
 // All four named rock sprites keep pickaxe-only drops, using actual impact frames.
 const rocks=[];
 for(const kind of ['lakeRockA','lakeRockB','lakeRockC','lakeRockF']){
  const node=await page.evaluate(kind=>{
   const data=scene.snapshotState();let point;
   for(let y=25;y<39&&!point;y++)for(let x=14;x<38;x++)if(scene.world.isBuildable(x,y)&&!scene.farming.isPrepared(x,y)&&!scene.world.isBlocked(x-1,y)&&!scene.world.resourceAt(x-1,y)){point={x,y};break;}
   if(!point)throw Error('No rock test spot');const id=`editor-${kind}-collection-qa`;data.mapEdits.objects[id]={...point,kind};scene.loadState(data);scene.running=true;scene.paused=false;scene.ui.showHUD();scene.updateHUD();const n=scene.world.resources.find(n=>n.id===id);approach(n);scene.selectTool('hand');return {...n};
  },kind);
  const before=await page.evaluate(()=>scene.inventory.data.stone);await page.keyboard.press('e');assert.equal(await page.evaluate(()=>scene.inventory.data.stone),before);
  await page.evaluate(n=>{approach(n);scene.selectTool('pickaxe');for(let i=0;i<5;i++){scene.nextInteractionAt=0;scene.interact(n);step(250);step(250);}},node);
  assert.equal(await page.evaluate(()=>scene.inventory.data.stone),before+4);rocks.push(kind);
 }
 // No hand resource can return before three whole days. Due times survive disk reload.
 const waits=await page.evaluate(()=>{scene.persist();return scene.state.resourceFields.property.waiting.filter(w=>['tree','stone','fiber','seeds','scrap'].includes(w.kind)).map(w=>({...w}));});assert.ok(waits.length>=7);
 const firstDue=Math.min(...waits.map(w=>w.at));
 const advance=async now=>page.evaluate(now=>{scene.state.day=Math.floor(now/1440)+1;scene.state.time=now%1440;scene.resourceLifecycle.tick(true);scene.resources.progress.splice(0);scene.afterAction();return {count:scene.world.resources.filter(n=>n.kind!=='standingTree').length,waiting:scene.state.resourceFields.property.waiting.filter(w=>['tree','stone','fiber','seeds','scrap'].includes(w.kind)).length,reedNodes:scene.world.resources.filter(n=>n.plant==='reeds').map(n=>({...n}))};},now);
 const early=await advance(firstDue-.01);assert.equal(early.waiting,waits.length);assert.ok(early.count<=64);
 await page.reload();await page.locator('#continue-game').click();await attach();
 const savedWaits=await page.evaluate(()=>scene.state.resourceFields.property.waiting.filter(w=>['tree','stone','fiber','seeds','scrap'].includes(w.kind)).map(w=>w.at).sort((a,b)=>a-b));assert.deepEqual(savedWaits,waits.map(w=>w.at).sort((a,b)=>a-b));
 const late=await advance(Math.max(...waits.map(w=>w.at))+1);assert.equal(late.waiting,0);assert.ok(late.count<=64);
 assert.ok(await page.evaluate(async()=>{const {nearRiverBank}=await import('/src/data/fiber-plants.ts');return scene.world.resources.filter(n=>n.plant==='reeds').every(n=>nearRiverBank(n.x,n.y));}));
 console.log('logs/stumps require axe and persist partial hits; four rocks require pickaxe; hand pickups return only after 3 game days');
 const art=await page.evaluate(()=>{
  const entries=[['Samambaia','forest-detail-fern'],['Flores brancas','forest-detail-flowers'],['Arbusto','forest-detail-bush'],['Juncos','forest-detail-reeds'],['Berries','asset-berry-bush'],['Pedras pequenas','asset-small-stones'],['Galhos','asset-new-branches'],['Tronco','forest-detail-log'],['Toco','forest-detail-stump'],['Rocha musgosa','lake-rock-0'],['Rocha alta','lake-rock-1'],['Seixos agrupados','lake-rock-2'],['Pedras baixas','lake-rock-5']];
  return entries.map(([label,key])=>({label,key,url:scene.textures.getBase64(key)}));
 });
 fs.writeFileSync(`${dir}/sprites.json`,JSON.stringify(art.map(({url,...item})=>item),null,2));
 await page.evaluate(()=>{game.loop.wake();scene.selectTool('hand');const gate=scene.forestGate();scene.player.x=gate.x*32+16;scene.player.y=gate.y*32+16;scene.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 const forest=await page.evaluate(()=>{const f=game.scene.getScene('Floresta');game.loop.sleep();return {count:f.world.resources.filter(n=>n.kind!=='standingTree').length,kinds:[...new Set(f.world.resources.map(n=>n.kind))],badReeds:f.world.resources.filter(n=>n.plant==='reeds').length};});
 assert.ok(forest.count<=48);assert.ok(forest.kinds.includes('fallenLog')&&forest.kinds.includes('stump')&&forest.kinds.includes('fiber'));assert.equal(forest.badReeds,0);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({passed:true,initial,collected,wood,rocks,respawn:{days:3,waits,early,late},forest,pageErrors:errors,at:new Date().toISOString()},null,2));
 // Contact sheet uses the actual runtime sprites, enlarged without smoothing.
 const sheet=await browser.newPage({viewport:{width:1120,height:750},deviceScaleFactor:1});await sheet.setContent(`<style>body{margin:0;padding:22px;background:#f5e6c5;color:#513c26;font:16px Georgia}h1{font-size:25px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.item{height:188px;text-align:center;background:#92a468;border:1px solid #6d784d;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center}.item img{width:140px;height:140px;object-fit:contain;image-rendering:pixelated}.item strong{font-weight:normal;margin-top:6px}</style><h1>After Rain · Recursos coletáveis</h1><div class="grid">${art.map(a=>`<div class="item"><img src="${a.url}"><strong>${a.label}</strong></div>`).join('')}</div>`);await sheet.screenshot({path:`${dir}/recursos-novas-artes.png`});
 console.log('PASS renewable pickups, art, tools, saved timers, both maps and caps');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
