const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.goto(process.env.QA_URL||'http://127.0.0.1:5173');await page.waitForTimeout(2500);
await page.evaluate(async()=>{const {game,gameAudio}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0];window.sound=gameAudio;scene.startNew({name:'Menu',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'})});await page.waitForTimeout(400);
await page.keyboard.press('Escape');assert.equal(await page.getByRole('slider').count(),0,'sound options only live in the music panel');await page.keyboard.press('Escape');
await page.evaluate(()=>scene.ui.toggleTopToolbar());assert.equal(await page.locator('.toolbar-action').count(),8);assert.equal(await page.locator('.top-toolbar .toolbar-art-icon').count(),9);assert.equal(await page.locator('.toolbar-action svg').count(),0);
const positions=await page.locator('.top-toolbar .toolbar-art-icon').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundPosition));assert.equal(new Set(positions).size,9);
await page.screenshot({path:'/tmp/after-rain-toolbar-0.7.1.png'});
for(const [id,panel] of [['inventory','.backpack-panel'],['map','.map-card'],['crafting','.crafting-card'],['building','.building-card'],['controls','[role="dialog"][aria-label="Controles"]'],['options','.pause-card']]){
 await page.locator(`[data-toolbar-action="${id}"]`).click();await page.locator(panel).waitFor();await page.keyboard.press('Escape');await page.evaluate(()=>scene.ui.toggleTopToolbar());
}
await page.getByRole('button',{name:'Música',exact:true}).click();await page.getByRole('dialog',{name:'Som do vale'}).waitFor();assert.equal(await page.evaluate(()=>scene.paused),true);assert.equal(await page.getByRole('slider').count(),2);
await page.getByRole('slider',{name:'Volume da música'}).fill('0');await page.getByRole('slider',{name:'Volume dos efeitos'}).fill('88');await page.getByRole('checkbox').check();
await page.getByRole('button',{name:'Restaurar volumes'}).click();assert.deepEqual(await page.evaluate(()=>sound.settings),{music:.45,effects:.65,muted:false});assert.equal(await page.getByRole('slider',{name:'Volume da música'}).inputValue(),'45');assert.equal(await page.getByRole('checkbox').isChecked(),false);
await page.getByRole('button',{name:'Ouvir efeito'}).click();await page.screenshot({path:'/tmp/after-rain-sound-panel-0.7.1.png'});await page.getByRole('button',{name:'Fechar configurações de som'}).click();assert.equal(await page.evaluate(()=>scene.paused),false);
await page.evaluate(()=>scene.ui.toggleTopToolbar());await page.locator('[data-toolbar-action="save"]').click();assert.ok(await page.evaluate(()=>localStorage.getItem('depois-da-chuva-v1')));
for(const [width,height] of [[960,640],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(250);const box=await page.locator('.toolbar-panel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y+box.height<=height);await page.screenshot({path:`/tmp/after-rain-toolbar-${width}-0.7.1.png`})}
assert.deepEqual(errors,[]);console.log('PASS toolbar 8 actions/9 pixel-art icons, all menus, centralized audio, restore/preview, pause/unpause, save, three viewport sizes, no JS/network errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
