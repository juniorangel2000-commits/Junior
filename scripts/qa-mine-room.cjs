const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/mina-antiga-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
 await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Mina QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
 await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const valley=game.scene.getScene('Vale');valley.state.profile.characterId='farmer-male';valley.enterLake();});await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='fishingLake');
 await page.evaluate(()=>game.scene.getScene('Lago').enterHighland());await page.waitForFunction(()=>game.scene.isActive('Serra'));
 await page.evaluate(()=>{const s=game.scene.getScene('Serra');s.state.time=480;s.player.x=1278;s.player.y=150;s.player.update(0,s.blockedTile,s.movementBlockedPoint,false,s.swimmingPoint,s.allowStep);});await page.keyboard.press('e');await page.waitForFunction(()=>game.scene.isActive('Mina')&&document.querySelector('#ui')?.dataset.interior==='mine');
 await page.evaluate(async()=>{window.m=game.scene.getScene('Mina');window.geometry=await import('/src/data/mine-room.ts');m.cameras.main.resetFX();});
 assert.ok(await page.evaluate(()=>m.player.x===geometry.MINE_ARRIVAL.x&&m.player.y===geometry.MINE_ARRIVAL.y&&m.state.mineInterior&&m.state.activeArea==='highland'));await page.waitForTimeout(200);await page.screenshot({path:out+'/Mina-Antiga-HUD.png'});
 await page.evaluate(()=>{document.querySelector('#ui').style.display='none';m.setPaused(true);});await page.screenshot({path:out+'/Chegada-na-Mina-Antiga.png'});
 await page.evaluate(()=>{
  window.debug=m.add.graphics().setDepth(10000);debug.lineStyle(1,0x78e6bf,.85);debug.strokePoints(geometry.MINE_FLOOR.map(([x,y])=>({x:x*.5,y:y*.5})),true);
  debug.fillStyle(0xff514d,.3);for(const o of geometry.MINE_SOLIDS){const points=o.footprint.map(([x,y])=>({x:x*.5,y:y*.5}));debug.fillPoints(points,true);debug.lineStyle(1,0xffa090,.9);debug.strokePoints(points,true);}
 });await page.screenshot({path:out+'/Colisoes-da-Mina-Antiga.png'});await page.evaluate(()=>{debug.destroy();document.querySelector('#ui').style.display='';m.setPaused(false);});console.log('entered the mine through the mountain; arrival is above the entrance beam');
 await page.evaluate(()=>{
  window.findRoute=target=>{
   const step=4,w=192,h=128,actual={x:m.player.x,y:m.player.y},fits=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&(Math.hypot(x*step-actual.x,y*step-actual.y)<16?geometry.mineFits(x*step,y*step):[[-11,-9],[11,-9],[-11,7],[11,7]].every(([dx,dy])=>!geometry.mineBlockedPoint(x*step+dx,y*step+dy))),id=(x,y)=>y*w+x;
   const start={x:Math.round(m.player.x/step),y:Math.round(m.player.y/step)};let goal={x:Math.round(target.x/step),y:Math.round(target.y/step)};
   if(!fits(goal.x,goal.y)){let best;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(fits(goal.x+dx,goal.y+dy)&&(!best||dx*dx+dy*dy<best.d))best={x:goal.x+dx,y:goal.y+dy,d:dx*dx+dy*dy};if(!best)throw Error('Unreachable target '+JSON.stringify(target));goal=best;}
   const source=id(start.x,start.y),destination=id(goal.x,goal.y),parent=new Int32Array(w*h).fill(-1),seen=new Uint8Array(w*h),queue=[source];seen[source]=1;
   for(let at=0;at<queue.length;at++){const current=queue[at];if(current===destination){const path=[];for(let p=current;p!==source;p=parent[p]){if(p<0)throw Error('Broken route');path.push({x:p%w*step,y:Math.floor(p/w)*step});}return path.reverse();}
    const x=current%w,y=Math.floor(current/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,next=id(nx,ny);if(fits(nx,ny)&&!seen[next]){seen[next]=1;parent[next]=current;queue.push(next);}}
   }throw Error('No path to '+JSON.stringify(target));
  };
 });
 async function walkTo(target,label){
  await page.evaluate(target=>{window.route=findRoute(target);window.routeIndex=0;m.setPaused(false);},target);const deadline=Date.now()+45000;let done=false;
  while(Date.now()<deadline&&!done){done=await page.evaluate(()=>{
   if(!geometry.mineFits(m.player.x,m.player.y))throw Error('Feet entered solid scenery '+JSON.stringify({x:m.player.x,y:m.player.y}));
   while(routeIndex<route.length&&Math.hypot(route[routeIndex].x-m.player.x,route[routeIndex].y-m.player.y)<6)routeIndex++;
   for(const key of Object.values(m.player.keys))key.isDown=false;if(routeIndex===route.length)return true;
   const p=route[routeIndex],dx=p.x-m.player.x,dy=p.y-m.player.y;if(Math.abs(dx)>=Math.abs(dy))m.player.keys[dx>0?'D':'A'].isDown=true;else m.player.keys[dy>0?'S':'W'].isDown=true;return false;
  });if(!done)await page.waitForTimeout(40);}
  assert.ok(done,'Walking timed out: '+label);console.log('walked',label);
 }
 await walkTo({x:460,y:265},'clear east floor');await walkTo({x:575,y:330},'lower copper deposit');await walkTo({x:580,y:230},'upper copper deposit');await walkTo({x:639,y:191},'side tunnel');
 await walkTo({x:362,y:166},'central mining entrance');await page.keyboard.press('e');await page.getByRole('dialog',{name:'Mineração',exact:true}).waitFor();await page.screenshot({path:out+'/Entrada-do-Menu-de-Mineracao.png'});await page.getByRole('button',{name:'Voltar à sala',exact:true}).click();
 await walkTo({x:180,y:240},'stone pocket');await walkTo({x:180,y:315},'front of cart');await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');assert.ok(await page.evaluate(()=>m.player.y>290&&geometry.mineFits(m.player.x,m.player.y)));console.log('the cart blocks the player at its feet');
 await walkTo({x:180,y:325},'coal approach');await walkTo({x:650,y:265},'east rock wall');await page.keyboard.down('d');await page.waitForTimeout(900);await page.keyboard.up('d');assert.ok(await page.evaluate(()=>m.player.x<685&&geometry.mineFits(m.player.x,m.player.y)));console.log('outer rock wall blocks walking out of the image');
 await walkTo({x:460,y:265},'center for save');await page.keyboard.press('i');await page.getByRole('dialog',{name:'Inventário'}).waitFor();await page.getByRole('button',{name:'Fechar inventário'}).click();await page.keyboard.press('m');await page.getByRole('heading',{name:'Mina Antiga',exact:true}).waitFor();await page.screenshot({path:out+'/Mapa-da-Mina-Antiga.png'});await page.getByRole('button',{name:'Fechar mapa'}).click();
 await page.evaluate(()=>{document.querySelector('#ui').style.display='none';m.setPaused(true);});await page.screenshot({path:out+'/Mina-Antiga-no-Jogo.png'});await page.evaluate(()=>{document.querySelector('#ui').style.display='';m.setPaused(false);m.persist();window.lastMinePosition={x:m.player.x,y:m.player.y};m.mainMenu();});
 await page.locator('#continue-game').waitFor();await page.locator('#continue-game').click();await page.waitForFunction(()=>game.scene.isActive('Mina')&&document.querySelector('#ui')?.dataset.interior==='mine');await page.evaluate(()=>{window.m=game.scene.getScene('Mina');});assert.ok(await page.evaluate(()=>Math.hypot(m.player.x-lastMinePosition.x,m.player.y-lastMinePosition.y)<3));console.log('save/continue restores the same indoor position');
 await walkTo({x:346,y:470},'main exit');await page.keyboard.down('s');await page.waitForFunction(()=>game.scene.isActive('Serra')&&!game.scene.isActive('Mina'));await page.keyboard.up('s');assert.ok(await page.evaluate(()=>{const s=game.scene.getScene('Serra');return !s.state.mineInterior&&Math.abs(s.player.x-1278)<3&&s.player.y>170&&s.player.y<190;}));
 await page.keyboard.press('m');await page.getByRole('heading',{name:'Platô da Nascente',exact:true}).waitFor();await page.getByRole('button',{name:'Fechar mapa'}).click();await page.keyboard.press('e');await page.waitForFunction(()=>game.scene.isActive('Mina'));assert.ok(await page.evaluate(()=>{const p=game.scene.getScene('Mina').player;return p.x===geometry.MINE_ARRIVAL.x&&p.y===geometry.MINE_ARRIVAL.y;}));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({mountainEntry:true,allAreasReachable:true,collisions:true,miningMenuHook:true,inventory:true,map:true,saveResume:true,walkOutAndReenter:true,plateauRenamed:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
