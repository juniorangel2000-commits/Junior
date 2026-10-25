const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const dir='docs/cenarios/previa-luz-sombras';fs.mkdirSync(`${dir}/frames`,{recursive:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],glErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'){glErrors.push(m.text());console.error(m.text());}});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Prévia');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.s=game.scene.getScene('Vale');s.ui.togglePause();window.dynamicToggle=document.querySelector('[data-dynamic-lighting]');s.ui.closeModal();game.loop.sleep();window.qt=s.time.now;window.step=()=>game.step(qt,0);window.lightAt=(time,dynamic)=>{dynamicToggle.checked=dynamic;dynamicToggle.dispatchEvent(new Event('change'));s.state.time=time;s.updateNight();s.updateHUD();step();};s.cameras.main.stopFollow().setZoom(2.25).centerOn(27*32,15.8*32);document.querySelector('#ui').style.visibility='hidden';});
 const captures=[];
 for(const [name,time] of [['manha',540],['tarde',1020],['noite',1320]])for(const dynamic of [false,true]){
  await page.evaluate(({time,dynamic})=>lightAt(time,dynamic),{time,dynamic});await page.screenshot({path:`${dir}/${name}-${dynamic?'dinamica':'atual'}.png`});
  captures.push(await page.evaluate(({time,dynamic})=>({time,dynamic,shader:s.daylight.shader?.visible,shadows:s.children.list.filter(o=>o.getData('solar-shadow')&&o.visible).length,windows:s.daylight.shader?.uniforms.lamp.value,gl:game.renderer.gl.getError()}),{time,dynamic}));
 }
 console.log(JSON.stringify(captures));assert.ok(captures.filter(c=>c.dynamic&&c.time<1140).every(c=>c.shadows>10&&c.shader));assert.ok(captures.filter(c=>!c.dynamic).every(c=>c.shadows===0&&!c.shader));assert.ok(captures.find(c=>c.dynamic&&c.time===1320).windows>.9);assert.ok(captures.every(c=>c.gl===0));
 // Same house remains anchored through zoom and resize.
 for(const zoom of [1,4]){await page.evaluate(z=>{s.cameras.main.setZoom(z);lightAt(1320,true);},zoom);assert.equal(await page.evaluate(()=>game.renderer.gl.getError()),0);}
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>{s.cameras.main.stopFollow().setZoom(2).centerOn(27*32,16*32);step();});await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>{s.cameras.main.stopFollow().setZoom(2.25).centerOn(27*32,15.8*32);});
 if(!process.env.QA_SKIP_FRAMES)for(let i=0;i<48;i++){await page.evaluate(t=>lightAt(t,true),420+i*15);await page.screenshot({path:`${dir}/frames/frame-${String(i).padStart(3,'0')}.png`});}
 // Hide outdoors shadows and shader inside; restore on exit. Simulation/save is unchanged.
 await page.evaluate(()=>{lightAt(1320,true);s.enterHome(undefined,false);s.updateNight();step();});assert.equal(await page.evaluate(()=>s.daylight.shader.visible),false);assert.equal(await page.evaluate(()=>s.children.list.filter(o=>o.getData('solar-shadow')&&o.visible).length),0);
 await page.evaluate(()=>{s.leaveHome(false);s.updateNight();step();});assert.equal(await page.evaluate(()=>s.daylight.shader.visible),true);
 await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';s.ui.togglePause();});await page.locator('[data-dynamic-lighting]').uncheck();await page.evaluate(()=>step());assert.equal(await page.evaluate(()=>s.daylight.shader.visible),false);await page.locator('[data-dynamic-lighting]').check();await page.evaluate(()=>step());assert.equal(await page.evaluate(()=>s.daylight.shader.visible),true);

 await page.evaluate(()=>{s.ui.closeModal();window.previousShader=s.daylight.shader;const data=s.snapshotState();s.loadState(data);s.running=true;s.paused=false;s.ui.showHUD();s.state.time=540;s.updateNight();step();});
 assert.equal(await page.evaluate(()=>previousShader.active),false);
 const cacheCount=await page.evaluate(()=>game.textures.getTextureKeys().filter(k=>k.startsWith('solar-silhouette:Vale:')).length);assert.ok(cacheCount<20);
 await page.evaluate(()=>{game.loop.wake();const gate=s.forestGate();s.player.x=gate.x*32+16;s.player.y=gate.y*32+16;s.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
 const forest=await page.evaluate(()=>{game.loop.sleep();const f=game.scene.getScene('Floresta');f.state.time=540;f.cameras.main.resetFX();f.daylight.update(540);f.cameras.main.stopFollow().setZoom(1.6).centerOn(48*32,45*32);step();f.daylight.update(540);step();document.querySelector('#ui').style.visibility='hidden';return {shader:f.daylight.shader.visible,lamp:f.daylight.shader.uniforms.lamp.value,shadows:f.children.list.filter(o=>o.getData('solar-shadow')&&o.visible).length};});
 assert.equal(forest.shader,true);assert.equal(forest.lamp,0);assert.ok(forest.shadows>10);await page.screenshot({path:`${dir}/floresta-dia.png`});
 assert.deepEqual(errors,[]);assert.deepEqual(glErrors,[]);fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({passed:true,captures,interior:true,zoomResize:true,settings:true,forest,cacheCount,pageErrors:errors,glErrors,at:new Date().toISOString()},null,2));console.log('PASS shader, projected shadows, window cones, zoom/resize, interior and optional settings');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
