const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5173');await page.waitForTimeout(1800);
 const attach=async()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0]});await attach();
 const frame=()=>page.locator('.title-weather').evaluate(canvas=>canvas.toDataURL());
 assert.equal(await page.getByRole('button',{name:'Pausar fundo'}).getAttribute('aria-pressed'),'true');
 const first=await frame();await page.waitForTimeout(200);assert.notEqual(await frame(),first,'rain actually animates');
 await page.getByRole('button',{name:'Pausar fundo'}).click();const paused=await frame();await page.waitForTimeout(150);assert.equal(await frame(),paused);
 await page.locator('#new-game').click();assert.equal(await page.locator('.title-weather').count(),0);
 await page.evaluate(()=>scene.ui.showTitle(false));assert.equal(await page.getByRole('button',{name:'Pausar fundo'}).getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{scene.startNew({name:'Chuva',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});scene.mainMenu()});
 assert.equal(await page.locator('.title-weather').count(),1);assert.equal(await page.evaluate(()=>scene.titleBackgroundMode),'animated');
 await page.getByRole('button',{name:'Pausar fundo'}).click();await page.reload();await page.waitForTimeout(1500);await attach();assert.equal(await page.evaluate(()=>scene.titleBackgroundMode),'animated');
 await page.screenshot({path:'/tmp/after-rain-title-rain.png'});assert.deepEqual(errors,[]);console.log('PASS rain on first load, returning from creation/game, reload after pause, actual animated frames, one canvas, including reduced-motion initial setting');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
