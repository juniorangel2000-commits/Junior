const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.CROWD_QA_OUTPUT || '/workspace/crowd480-browser';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
 const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5187');await page.locator('#new-game').waitFor();
  await page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;
   const v=game.scene.getScene('Vale');v.ui.showHUD('cityForest');
   v.scene.start('Dungeons',{save:v.snapshotState(),ui:v.ui,onReturn:()=>{}});
  });
  await page.locator('[data-start]').first().waitFor();
  for(const map of ['abandoned-central-square','mall-parking']){
   await page.locator(`[data-start="${map}"]`).click();
   await page.waitForFunction(()=>game.scene.getScene('Dungeons').run?.state.phase==='fighting');
   const setup=await page.evaluate(()=>{
    const d=game.scene.getScene('Dungeons'),r=d.run,s=r.state;
    // Synthetic rendering stress: durable targets and contact immunity, not a survival result.
    s.player.invulnerable=120;s.spawnClock=9999;
    for(let attempt=0;attempt<1000&&s.enemies.length<480;attempt++)r.spawn();
    s.enemies.forEach((e,i)=>{const angle=i*2.399963,radius=100+(i%12)*12;e.x=s.player.x+Math.cos(angle)*radius;e.y=s.player.y+Math.sin(angle)*radius;e.hp=e.maxHp=1000000;});
    d.renderRun();return {enemies:s.enemies.length,images:d.enemyImages.size,overflow:r.spawn()};
   });
   assert.equal(setup.enemies,480);assert.equal(setup.images,480);assert.equal(setup.overflow,false);
   const frames=await page.evaluate(async()=>{
    const samples=[];let previous=performance.now();
    for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const now=performance.now();samples.push(now-previous);previous=now;}
    samples.sort((a,b)=>a-b);return {median:samples[15],p95:samples[28]};
   });
   const still=await page.evaluate(()=>{const d=game.scene.getScene('Dungeons');return {enemies:d.run.state.enemies.length,images:d.enemyImages.size,phase:d.run.state.phase};});
   assert.equal(still.enemies,480);assert.equal(still.images,480);assert.equal(still.phase,'fighting');
   await page.screenshot({path:`${out}/${map}.png`});
   results.push({map,...still,frameIntervalMs:frames,renderer:'Chromium SwiftShader; synthetic protected player'});
   await page.evaluate(()=>{const d=game.scene.getScene('Dungeons');d.run.state.enemies=d.run.state.enemies.slice(0,240);d.renderRun();});
   const baseline=await page.evaluate(async()=>{
    for(let i=0;i<10;i++)await new Promise(requestAnimationFrame);
    const samples=[];let previous=performance.now();
    for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const now=performance.now();samples.push(now-previous);previous=now;}
    samples.sort((a,b)=>a-b);return {median:samples[15],p95:samples[28]};
   });
   results.at(-1).baseline240FrameIntervalMs=baseline;
   console.log('PASS real scene with 480 enemies',results.at(-1));
   await page.evaluate(()=>{const d=game.scene.getScene('Dungeons');d.run.abandon();d.finish();});
   await page.locator('[data-results-menu]').click();await page.locator('[data-start]').first().waitFor();
  }
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
