const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5173');await page.waitForTimeout(1800);
 const attach=async()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0]});await attach();
 const frame=()=>page.locator('.title-weather').evaluate(canvas=>canvas.toDataURL());
 assert.equal(await page.getByRole('button',{name:'Pausar fundo'}).getAttribute('aria-pressed'),'true');
 const first=await frame();await page.waitForTimeout(200);assert.notEqual(await frame(),first,'rain actually animates');
 await page.getByRole('button',{name:'Pausar fundo'}).click();await page.getByRole('button',{name:'Silenciar',exact:true}).waitFor();const paused=await frame();await page.waitForTimeout(150);assert.equal(await frame(),paused);
 await page.locator('#new-game').click();assert.equal(await page.locator('.title-weather').count(),0);
 await page.evaluate(()=>scene.ui.showTitle(false));assert.equal(await page.getByRole('button',{name:'Pausar fundo'}).getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{scene.startNew({name:'Chuva',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});scene.mainMenu()});
 assert.equal(await page.locator('.title-weather').count(),1);assert.equal(await page.evaluate(()=>scene.titleBackgroundMode),'animated');
 await page.getByRole('button',{name:'Pausar fundo'}).click();await page.reload();await page.waitForTimeout(1500);await attach();assert.equal(await page.evaluate(()=>scene.titleBackgroundMode),'animated');
 const brightPixels=()=>page.locator('.title-weather').evaluate(canvas=>{const {width:w,height:h}=canvas;const pixels=canvas.getContext('2d').getImageData(Math.floor(w/2),0,Math.floor(w/2),Math.floor(h*.48)).data;let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>160&&pixels[i+1]>180&&pixels[i+2]>180)count++;return count});
 await page.waitForTimeout(4500);assert.equal(await brightPixels(),0,'reduced-motion suppresses bright lightning while rain continues');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>scene.ui.showTitle(false));
 let lightning=false;for(let attempt=0;attempt<100;attempt++){await page.waitForTimeout(100);if(await brightPixels()>20){lightning=true;await page.screenshot({path:'/tmp/after-rain-title-lightning-0.7.1.png'});break}}
 assert.ok(lightning,'visible lightning reaches the real title canvas');
 await page.getByRole('button',{name:'Pausar fundo'}).click();const still=await frame();await page.waitForTimeout(300);assert.equal(await frame(),still,'pause also freezes lightning');
 await page.evaluate(()=>scene.ui.showTitle(true));
 assert.ok(await page.locator('.title-copy').evaluate(panel=>getComputedStyle(panel).borderImageSource.includes('cozy-frame.svg')),'title shares the HUD frame');
 for(const [width,height] of [[1280,800],[960,640],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  for(const selector of ['.title-copy','#new-game','#continue-game','[data-title-sound]','[data-title-motion]']){
   const box=await page.locator(selector).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,`${selector} fits width ${width}`);
   if(width>650)assert.ok(box.y>=0&&box.y+box.height<=height,`${selector} fits height ${height}`);
  }
  await page.screenshot({path:`/tmp/after-rain-title-cozy-${width}-0.7.1.png`});
 }
 await page.locator('#continue-game').click();await page.locator('.toolbelt').waitFor();
 assert.equal(await page.locator('.title-weather').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS rain on every entry/reload, actual animation, reduced-motion excludes flashes, visible lightning, pause/cleanup, HUD art and three sizes, new game/continue controls');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
