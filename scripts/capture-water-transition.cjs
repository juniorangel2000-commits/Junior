const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const out=path.resolve('docs/personagens/entrada-na-agua');fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1024,height:640}}),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Clara');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.getByRole('button',{name:'Fechar missões',exact:true}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;const v=game.scene.getScene('Vale'),e=v.state.mapEdits.points.exit;v.player.x=(e.x+.5)*32;v.player.y=(e.y+.5)*32;v.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 const route=await page.evaluate(()=>{
  window.forest=game.scene.getScene('Floresta');const s=forest;
  const clear=(x,y)=>[[-8,-6],[8,-6],[-8,4],[8,4]].every(([ox,oy])=>!s.movementBlockedAt(Math.floor((x+ox)/32),Math.floor((y+oy)/32)));
  const routes=[];
  for(const tileX of [54.5,53.5,55.5,52.5,56.5,51.5,57.5]){
   const x=tileX*32;for(let deepY=10.5*32;deepY<15*32;deepY+=8){
    if(s.swimmingPoint(x,deepY)!==1)continue;
    let edge=deepY;while(s.waterContains(x,edge)&&edge>5*32)edge-=4;
    const startY=edge-48,endY=edge+164;
    let valid=true;for(let y=startY;y<=endY;y+=4)if(!clear(x,y)||y>=deepY&&!s.waterContains(x,y)){valid=false;break;}
    for(let dx=0;dx<=38;dx+=4)if(!clear(x+dx,endY)||s.swimmingPoint(x+dx,endY)<.9)valid=false;
    if(valid)routes.push({x,startY,edgeY:edge,endY,score:Math.abs(x-54.5*32)});break;
   }
  }
  routes.sort((a,b)=>a.score-b.score);if(!routes.length)throw Error('No clear shoreline route');window.waterRoute=routes[0];return waterRoute;
 });console.log('route',route);
 await page.waitForFunction(()=>!forest.cameras.main.fadeEffect.isRunning);
 await page.evaluate(route=>{forest.scene.pause();const p=forest.player;p.x=route.x;p.y=route.startY;p.facing={x:0,y:1};p.update(0,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);forest.zoom=1.5;forest.applyCamera();forest.updateHUD();forest.cameras.main.preRender();window.captureTime=0;window.captureStage='approach';},route);
 const frames=[];let finished=false;
 for(let index=0;index<240&&!finished;index++){
  const state=await page.evaluate(index=>{
   const p=forest.player,keys=p.keys;Object.values(keys).forEach(k=>k.isDown=false);
   // Real movement and depth queries throughout; no teleporting after the initial setup.
   if(index<8)window.captureStage='land_idle';
   else if(captureStage==='land_idle'||captureStage==='approach'){
    captureStage='approach';if(p.y<waterRoute.endY)keys.S.isDown=true;else{captureStage='floating';window.pauseUntil=captureTime+2.7;}
   }else if(captureStage==='floating'){
    if(captureTime>=pauseUntil)captureStage='swim_right';
   }else if(captureStage==='swim_right'){
    if(p.x<waterRoute.x+36)keys.D.isDown=true;else captureStage='swim_left';
   }else if(captureStage==='swim_left'){
    if(p.x>waterRoute.x)keys.A.isDown=true;else captureStage='return';
   }else if(captureStage==='return'){
    if(p.y>waterRoute.startY)keys.W.isDown=true;else{captureStage='land_end';window.pauseUntil=captureTime+.7;}
   }else if(captureStage==='land_end'){p.facing={x:0,y:1};}
   for(let sub=0;sub<5;sub++){
    forest.update(captureTime*1000,1000/60);captureTime+=1/60;
    for(const child of forest.children.list)if(child.texture?.key==='water-ripple-frames')child.anims.update(captureTime*1000,1000/60);
   }
   forest.updateHUD();forest.cameras.main.preRender();
   return{index,time:captureTime,stage:captureStage,state:p.swimState,depth:p.waterDepth,x:p.x,y:p.y,spriteY:p.sprite.y,cameraY:forest.cameras.main.scrollY,done:captureStage==='land_end'&&captureTime>=pauseUntil};
  },index);
  await page.waitForTimeout(20);await page.screenshot({path:path.join(out,`frame-${String(index).padStart(3,'0')}.png`)});frames.push(state);finished=state.done;
  if(index%30===0)console.log('capture',index,state.stage,state.state);
 }
 assert.ok(finished,'route must include a complete return to land');assert.ok(frames.some(f=>f.state==='land'),'walking on land');assert.ok(frames.some(f=>f.state==='wading'),'walking in shallow water');assert.ok(frames.some(f=>f.state==='swim_down'),'forward swimming');assert.ok(frames.some(f=>f.state==='swim_idle'),'floating');assert.ok(frames.some(f=>f.state==='swim_right'),'side swimming');const floats=frames.filter(f=>f.stage==='floating');assert.ok(Math.max(...floats.map(f=>f.spriteY))-Math.min(...floats.map(f=>f.spriteY))>1,'visible vertical floating');assert.ok(Math.max(...floats.map(f=>f.cameraY))-Math.min(...floats.map(f=>f.cameraY))<.001,'camera stays steady while floating');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'captura.json'),JSON.stringify({fps:12,frames:frames.length,duration:frames.length/12,route,renderer:await page.evaluate(()=>game.renderer.type),checks:['real forest scene and authored shore','walking on land','wading to neck','deep swimming','floating and side swimming','visible vertical floating without camera shake','return to land','no browser errors'],timeline:frames,at:new Date().toISOString()},null,2));console.log('PASS full sequence',frames.length,'frames',frames.length/12,'seconds');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
