const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5174');await page.locator('#new-game').click();await page.locator('#character-name').fill('Água');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.scene=game.scene.scenes[0];game.loop.sleep();window.qt=scene.time.now;window.step=ms=>{qt+=ms;game.step(qt,ms)};
scene.state.homeSupplies={wateringCan:true,seedPacket:true};scene.state.wateringCanWater=0;scene.ui.setQuickbar(['water',null,null,null,null,null,null,null,null]);scene.ui.renderQuickbar();scene.selectTool('water');scene.updateHUD();
scene.farming.crops.length=0;scene.farming.crops.push({x:25,y:22,growth:0,watered:false});scene.player.x=24.5*32;scene.player.y=22.5*32;scene.nextInteractionAt=0;scene.interact({x:25,y:22});});
assert.equal(await page.evaluate(()=>scene.toolUse.active),false,'empty cannot water');
assert.equal(await page.evaluate(()=>scene.farming.cropAt(25,22).watered),false);
assert.ok(await page.locator('img[src*="empty-matched"]').count());
await page.evaluate(()=>{for(let y=2;y<70;y++)for(let x=2;x<94;x++){
 if(!scene.world.isWater(x,y)||scene.world.isBlocked(x-1,y))continue;
 scene.player.x=(x-.5)*32;scene.player.y=(y+.5)*32;scene.nextInteractionAt=0;scene.interact({x,y});if(scene.state.wateringCanWater===8)return;
}throw Error('no water bank');});
assert.equal(await page.evaluate(()=>scene.state.wateringCanWater),8);
assert.ok(await page.locator('img[src*="rotations/regador_cheio"]').count());
await page.evaluate(()=>{scene.player.x=24.5*32;scene.player.y=22.5*32;scene.nextInteractionAt=0;scene.interact({x:25,y:22});step(100)});
assert.equal(await page.evaluate(()=>scene.toolVisual.sprite.visible),true);assert.equal(await page.evaluate(()=>scene.state.wateringCanWater),8);
await page.evaluate(()=>{scene.setPaused(true);scene.setPaused(false);scene.nextInteractionAt=0;step(500)});
assert.equal(await page.evaluate(()=>scene.state.wateringCanWater),8,'canceled pour consumes nothing');
for(let i=0;i<8;i++){
await page.evaluate((i)=>{scene.farming.cropAt(25,22).watered=false;scene.player.x=(i%2?26.5:24.5)*32;scene.player.y=22.5*32;scene.nextInteractionAt=0;scene.interact({x:25,y:22});step(100)},i);
assert.equal(await page.evaluate(()=>scene.toolVisual.sprite.flipX),i%2===0);

await page.evaluate(()=>step(150));
if(i<2) await page.screenshot({path:`docs/ferramentas/regador-${i?'esquerda':'direita'}.png`});
await page.evaluate(()=>step(250));
assert.equal(await page.evaluate(()=>scene.state.wateringCanWater),7-i);
assert.equal(await page.evaluate(()=>scene.farming.cropAt(25,22).watered),true);
assert.equal(await page.evaluate(()=>scene.toolVisual.sprite.visible),false);
await page.evaluate(()=>scene.persist());
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('depois-da-chuva-v1')).wateringCanWater),7-i);
await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('depois-da-chuva-v1'));scene.loadState(saved);scene.running=true;scene.paused=false;scene.ui.showHUD();step(0)});
assert.equal(await page.evaluate(()=>scene.state.wateringCanWater),7-i);
}
assert.ok(await page.locator('img[src*="empty-matched"]').count());
assert.deepEqual(errors,[]);fs.writeFileSync('docs/ferramentas/validacao-regador.json',JSON.stringify({passed:true,checked:['empty blocked','refill','both sides','cancel','8 pours','saved quantity','dynamic icons'],at:new Date().toISOString()},null,2));console.log('PASS watering: refill, empty/full icons, cancel, both sides, consumption, persistence');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
