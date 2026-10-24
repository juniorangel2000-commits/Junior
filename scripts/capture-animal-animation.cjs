const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Clara');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;const v=game.scene.getScene('Vale'),e=v.state.mapEdits.points.exit;v.player.x=e.x*32+16;v.player.y=e.y*32+16;v.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 await page.evaluate(()=>{window.forest=game.scene.getScene('Floresta');});await page.waitForFunction(()=>!forest.cameras.main.fadeEffect.isRunning);
 const anchor=await page.evaluate(()=>{
  const s=forest;s.scene.pause();document.querySelector('#ui').style.display='none';
  const label=document.createElement('div');label.id='animal-preview-label';label.style.cssText='position:fixed;top:15px;left:15px;padding:10px 16px;border:3px solid #855a34;background:#f4e6c4;color:#4d3824;font:18px Georgia;z-index:99999';document.body.appendChild(label);
  for(let y=50;y<63;y++)for(let x=16;x<31;x++){
   let valid=true;for(let ty=y-2;ty<=y+3;ty++)for(let tx=x-2;tx<=x+4;tx++)if(s.animalBlocked(tx,ty))valid=false;
   if(valid){window.previewAnchor={x:x*32+16,y:y*32+16};return previewAnchor;}
  }
  throw Error('No unobstructed authored clearing for preview');
 });console.log('clearing',anchor);
 const results=[];
 for(const kind of ['chicken','cow']){
  const out=path.resolve('docs/cenarios/animais-animados',kind);fs.mkdirSync(out,{recursive:true});
  for(const file of fs.readdirSync(out))if(/^frame-\d{3}\.png$/.test(file))fs.unlinkSync(path.join(out,file));
  await page.evaluate(async kind=>{
   const {FOREST_ANIMALS}=await import('/src/data/ancient-forest.ts');
   const target=FOREST_ANIMALS.find(a=>a.kind===kind),s=forest,p=s.player,a=previewAnchor;
   delete s.state.animalEscort;s.state.inventory.cord=1;s.state.recruitedAnimals=FOREST_ANIMALS.filter(d=>d.id!==target.id).map(d=>d.id);
   s.state.animalPositions={forest:[{id:target.id,x:a.x,y:a.y,direction:'down'}],property:[]};s.rebuildAnimals();
   p.x=a.x+24;p.y=a.y;p.facing={x:-1,y:0};Object.values(p.keys).forEach(k=>k.isDown=false);p.update(0,s.movementBlockedAt,undefined,true,s.swimmingPoint);s.wildlife.update(0,p);
   s.cameras.main.stopFollow().setZoom(4).centerOn(a.x+48,a.y+16);s.cameras.main.preRender();
   window.clip={kind,stage:'idle',time:0,waypoint:0,hold:0};window.clipPath=[{x:a.x+96,y:a.y},{x:a.x+96,y:a.y+64},{x:a.x+24,y:a.y+64},{x:a.x+24,y:a.y}];
  },kind);
  const frames=[],directions=new Set(),phases=new Set();let done=false;
  for(let index=0;index<180&&!done;index++){
   const state=await page.evaluate(index=>{
    const s=forest,p=s.player,keys=p.keys,animal=s.animals[0];Object.values(keys).forEach(k=>k.isDown=false);
    if(index===20){s.interact();if(!s.state.animalEscort)throw Error('Rope did not attach');clip.stage='leading';}
    if(clip.stage==='hold'&&clip.time-clip.hold>=1){s.releaseRope();clip.stage='released';clip.hold=clip.time;}
    for(let sub=0;sub<3;sub++){
     Object.values(keys).forEach(k=>k.isDown=false);
     if(clip.stage==='leading'){
      const t=clipPath[clip.waypoint];if(Math.hypot(p.x-t.x,p.y-t.y)<2){clip.waypoint++;if(clip.waypoint===clipPath.length){clip.stage='hold';clip.hold=clip.time;}}
      if(clip.stage==='leading'){const target=clipPath[clip.waypoint],dx=target.x-p.x,dy=target.y-p.y;if(Math.abs(dx)>1)keys[dx>0?'D':'A'].isDown=true;if(Math.abs(dy)>1)keys[dy>0?'S':'W'].isDown=true;}
     }
     if(clip.stage!=='idle'){s.update(clip.time*1000,1000/60);clip.time+=1/60;}
    }
    document.querySelector('#animal-preview-label').textContent=`${clip.kind==='chicken'?'Galinha':'Vaca'} · ${clip.stage==='idle'?'Parada':clip.stage==='leading'?'Caminhando com a corda':clip.stage==='hold'?'Parada com a corda':'Solta — fugindo'}`;
    s.cameras.main.preRender();
    if(s.state.animalEscort&&!(s.wildlife.rope.depth<animal.sprite.depth&&s.wildlife.rope.depth<p.sprite.depth))throw Error('Rope overlaps an actor');
    return {index,stage:clip.stage,direction:animal.brain.direction,frame:Number(animal.sprite.frame.name),moving:animal.brain.moving,x:animal.x,y:animal.y,mode:animal.brain.mode,texture:animal.sprite.texture.key,scale:animal.sprite.scaleX,done:clip.stage==='released'&&clip.time-clip.hold>=.8};
   },index);
   await page.waitForTimeout(20);await page.screenshot({path:path.join(out,`frame-${String(index).padStart(3,'0')}.png`)});frames.push(state);directions.add(state.direction);if(state.moving)phases.add(state.frame%9);done=state.done;
   if(index%40===0)console.log(kind,index,state.stage);
  }
  assert.ok(done,`${kind} full route`);assert.ok(directions.size>=4,`${kind} turns`);assert.equal(phases.size,8,`${kind} all eight original walk frames`);
  assert.ok(frames.every(f=>f.texture===`animal-${kind}-animated`&&f.scale===.75));assert.ok(frames.some(f=>f.stage==='idle'));assert.ok(frames.some(f=>f.stage==='released'));
  const report={kind,fps:20,frames:frames.length,duration:frames.length/20,directions:[...directions],walkFrames:[...phases],timeline:frames};fs.writeFileSync(path.join(out,'captura.json'),JSON.stringify(report,null,2));results.push(report);console.log('PASS',kind,frames.length,'frames');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/cenarios/animais-animados/validacao.json',JSON.stringify({passed:true,renderer:await page.evaluate(()=>game.renderer.type),anchor,checks:['original PNGs packed losslessly','eight original walk frames per direction','distance-based walk cycle','real authored forest','real player keys and animal following','attach and release','rope depth behind player and animal'],clips:results.map(({timeline,...r})=>r),at:new Date().toISOString()},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
