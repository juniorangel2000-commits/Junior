const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER',e.message)});page.setDefaultTimeout(30000);
 const attach=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');window.forest=game.scene.getScene('Floresta');window.edit=game.scene.getScene('Editor');});
 const area=a=>page.waitForSelector(`#ui[data-area="${a}"]`);
 const teleport=async(scene,p)=>{await page.evaluate(({scene,p})=>{const s=game.scene.getScene(scene);s.player.x=(p.x+.5)*32;s.player.y=(p.y+.5)*32;if(scene==='Vale')s.nextInteractionAt=0;},{scene,p});await page.waitForTimeout(150);};
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Mapas novos');await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
 assert.deepEqual(await page.evaluate(()=>valley.state.mapEdits.points),{entry:{x:2,y:52},exit:{x:1,y:52}});
 assert.ok(await page.evaluate(()=>valley.world.resources.filter(n=>n.kind!=='standingTree').length)<=64);
 assert.equal(await page.evaluate(()=>{const seen=new Set(),queue=[{x:25,y:18}];for(let i=0;i<queue.length;i++){const p=queue[i],key=`${p.x},${p.y}`;if(seen.has(key)||valley.movementBlocked(p.x,p.y))continue;seen.add(key);if(p.x===1&&p.y===52)return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});}return false;}),true,'marked property exit is reachable from the house');
 await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');
 for(const floor of ['meadow','forest','moss','forestPath','wetPath','wood','paving'])assert.equal(await page.locator(`[data-terrain="${floor}"]`).count(),1);
 const free=await page.evaluate(()=>{for(let y=45;y<60;y++)for(let x=25;x<40;x++)if(edit.editor.adapter.canPlace(x,y)&&!edit.editor.adapter.protectedTile(x,y)&&!edit.editor.adapter.objects().some(o=>o.x===x&&o.y===y))return {x,y};throw Error('no free test tile');});
 await page.locator('[data-terrain="moss"]').click();await page.evaluate(p=>{edit.cameras.main.setZoom(1).centerOn((p.x+.5)*32,(p.y+.5)*32);edit.cameras.main.preRender();},free);await page.mouse.click(720,450);
 await page.waitForFunction(p=>edit.histories.property.current.terrain[`${p.x},${p.y}`]==='moss',free);
 await page.locator('[data-map-area="forest"]').click();await page.waitForFunction(()=>edit.area==='forest');assert.deepEqual(await page.evaluate(()=>edit.histories.forest.current.points),{entry:{x:93,y:46},exit:{x:94,y:46}});
 await page.screenshot({path:'docs/cenarios/editor-troca-mapas.png'});
 await page.locator('[data-map-area="property"]').click();await page.waitForFunction(()=>edit.area==='property');assert.equal(await page.evaluate(p=>edit.histories.property.current.terrain[`${p.x},${p.y}`],free),'moss');
 await page.keyboard.press('Control+z');await page.waitForFunction(p=>edit.histories.property.current.terrain[`${p.x},${p.y}`]!=='moss',free);await page.keyboard.press('Control+y');
 await page.locator('[data-action="apply"]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});await area('property');
 assert.equal(await page.evaluate(p=>valley.state.mapEdits.terrain[`${p.x},${p.y}`],free),'moss');
 // Only the marked tile changes area; the former exit and the arrival do not.
 await teleport('Vale',{x:75,y:18});await page.keyboard.press('e');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>game.scene.isActive('Floresta')),false);
 await teleport('Vale',{x:2,y:52});await page.keyboard.press('e');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>game.scene.isActive('Floresta')),false);
 await teleport('Vale',{x:1,y:52});await page.keyboard.press('e');await area('forest');await attach();
 assert.deepEqual(await page.evaluate(()=>({x:Math.floor(forest.player.x/32),y:Math.floor(forest.player.y/32)})),{x:93,y:46});
 assert.equal(await page.evaluate(()=>{const seen=new Set(),queue=[{x:93,y:46}];for(let i=0;i<queue.length;i++){const p=queue[i],key=`${p.x},${p.y}`;if(seen.has(key)||forest.movementBlockedAt(p.x,p.y))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});}return seen.has('94,46')&&forest.animals.every(a=>seen.has(`${Math.floor(a.x/32)},${Math.floor(a.y/32)}`));}),true,'forest exit and all animal clearings are reachable');
 assert.equal(await page.evaluate(()=>forest.world.solid.has('48,69')),true,'former southern exit is filled by trees');
 await page.keyboard.press('e');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>game.scene.isActive('Floresta')),true,'arrival is not an exit');
 await teleport('Floresta',{x:48,y:69});await page.keyboard.press('e');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>game.scene.isActive('Floresta')),true,'old southern exit is disabled');
 assert.ok(await page.evaluate(()=>forest.world.resources.filter(n=>n.kind!=='standingTree').length)<=48);
 // A new authored rock can be mined using the supplied pickaxe animation.
 const mine=await page.evaluate(()=>{for(const n of forest.world.resources.filter(n=>n.kind==='vein'&&n.id.startsWith('f-lakeRock'))){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,y=n.y+dy;if(!forest.world.isBlocked(x,y)&&!forest.world.resourceAt(x,y))return {node:n,stand:{x,y}};}}throw Error('no shore rock');});
 await teleport('Floresta',mine.stand);await page.evaluate(()=>{forest.state.inventory.pickaxe=1;forest.selectTool('pickaxe');window.stoneBefore=forest.state.inventory.stone;});
 for(let i=0;i<3;i++){await page.keyboard.press('e');await page.waitForFunction(hits=>forest.state.resourceProgress.some(p=>p.hits===hits),i+1);await page.waitForFunction(()=>!forest.toolUse.active);}
 assert.equal(await page.evaluate(id=>forest.state.resourceProgress.find(p=>p.id===id)?.hits,mine.node.id),3);
 await page.reload();await page.locator('#continue-game').click();await area('forest');await attach();assert.equal(await page.evaluate(id=>forest.state.resourceProgress.find(p=>p.id===id)?.hits,mine.node.id),3);
 for(let i=0;i<2;i++){await page.keyboard.press('e');await page.waitForFunction(({id,hits})=>!forest.world.resources.some(n=>n.id===id)||forest.state.resourceProgress.some(p=>p.id===id&&p.hits===hits),{id:mine.node.id,hits:4+i});await page.waitForFunction(()=>!forest.toolUse.active);}
 assert.equal(await page.evaluate(id=>forest.world.resources.some(n=>n.id===id),mine.node.id),false);assert.equal(await page.evaluate(()=>forest.state.inventory.stone),4);
 // No tool selection in water, through either hotkeys or the public callback.
 await teleport('Floresta',{x:54,y:16});await page.waitForFunction(()=>forest.player.isSwimming);await page.evaluate(()=>{forest.selectTool('pickaxe');forest.ui.activateSlot(0);});await page.keyboard.press('1');assert.equal(await page.evaluate(()=>forest.state.equippedTool),'hand');assert.equal(await page.locator('#ui [data-slot]:disabled').count(),9);
 await teleport('Floresta',{x:94,y:46});await page.waitForFunction(()=>!forest.player.isSwimming);await page.keyboard.press('e');await area('property');await attach();assert.deepEqual(await page.evaluate(()=>({x:Math.floor(valley.player.x/32),y:Math.floor(valley.player.y/32)})),{x:2,y:52});
 // Collection is unique and cooldown state survives reload; refills remain bounded.
 const oldIDs=await page.evaluate(()=>{
   const ids=valley.state.resourceFields.property.nodes.map(n=>n.id);for(const n of [...valley.state.resourceFields.property.nodes]){valley.world.removeResource(n.id);valley.resourceLifecycle.collected(n);}valley.persist();return ids;
 });
 await page.reload();await page.locator('#continue-game').click();await area('property');await attach();assert.equal(await page.evaluate(()=>valley.state.resourceFields.property.nodes.length),0);
 await page.evaluate(()=>{valley.state.time=valley.state.resourceFields.property.waiting[0].at-(valley.state.day-1)*1440-1;valley.resourceLifecycle.tick(true);});assert.equal(await page.evaluate(()=>valley.state.resourceFields.property.nodes.length),0);
 await page.evaluate(()=>{valley.state.time+=1;valley.resourceLifecycle.tick(true);valley.persist();});
 const renewed=await page.evaluate(()=>valley.state.resourceFields.property.nodes);assert.ok(renewed.length>0&&renewed.length<=64);assert.equal(renewed.some(n=>oldIDs.includes(n.id)),false);assert.equal(new Set(renewed.map(n=>`${n.x},${n.y}`)).size,renewed.length);
 await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');await page.locator('[data-map-area="forest"]').click();await page.waitForFunction(()=>edit.area==='forest');await page.screenshot({path:'docs/cenarios/mapa-floresta-atualizado.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/cenarios/validacao-mapas-atualizados.json',JSON.stringify({passed:true,checks:['author maps applied','new terrain palette','switch map without losing changes','separate undo and redo','only marked exit tiles','correct arrivals','reachable routes and animal clearings','former south exit closed','new rocks mineable with saved partial hits','tools locked while swimming','random resources capped','respawn cooldown persists','unique renewed IDs'],at:new Date().toISOString()},null,2));console.log('PASS updated maps, switch editor, mining, portals, swim lock and bounded respawns');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
