const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.QA_URL||'http://127.0.0.1:5173');await page.waitForTimeout(2000);
await page.keyboard.down('Control');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
await page.keyboard.down('Alt');await page.waitForFunction(()=>!!document.fullscreenElement);
await page.keyboard.down('Alt');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
await page.keyboard.up('Alt');await page.keyboard.up('Control');
await page.keyboard.down('Alt');await page.keyboard.down('Control');await page.waitForFunction(()=>!document.fullscreenElement);await page.keyboard.up('Control');await page.keyboard.up('Alt');
await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0];scene.startNew({name:'Tela',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'})});await page.waitForTimeout(300);await page.evaluate(()=>scene.ui.toggleTopToolbar());await page.getByRole('button',{name:'Música',exact:true}).click();
await page.getByRole('slider',{name:'Volume da música'}).focus();await page.keyboard.press('Control+Alt');await page.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await page.locator('.audio-panel').count(),1);
await page.keyboard.press('Control+Alt');await page.waitForFunction(()=>!document.fullscreenElement);
await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.audio-panel'));
assert.deepEqual(errors,[]);console.log('PASS Ctrl+Alt enter/exit, both key orders, no repeat toggle, title and audio/slider, Escape closes audio');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
