// Requer Playwright instalado no ambiente de QA; não faz parte do runtime do jogo.
const {chromium}=require('playwright');
const fs=require('node:fs'); const path=require('node:path');
const output=process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(),'after-rain-qa'); fs.mkdirSync(output,{recursive:true});const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const attach=async()=>{await page.waitForTimeout(2500);await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0]});await page.waitForFunction(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0];return !!window.scene?.player});};
const reload=async()=>{await page.reload();await attach();await page.evaluate(()=>scene.continueGame());await page.waitForTimeout(400)};
await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');await attach();
for(const order of [['wateringCan','seedPacket'],['seedPacket','wateringCan']]){
 await page.evaluate(()=>{scene.startNew({name:'QA',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});scene.enterHome()});
 let collected=[];
 for(const id of order){
  await page.evaluate(id=>{scene.player.x=(id==='wateringCan'?4.5:7.5)*32;scene.player.y=7.5*32;scene.player.update(0,scene.blocked,scene.blockedPoint);scene.nextInteractionAt=0;scene.updateHUD()},id);
  await page.keyboard.press('e');collected.push(id);
  assert.equal(await page.evaluate(()=>scene.persist()),true);
  await reload();
  const result=await page.evaluate(()=>({flags:scene.state.homeSupplies,seeds:scene.inventory.data.seeds,count:scene.supplySprites.length,inHome:scene.inHome}));
  for(const name of collected)assert.equal(result.flags[name],true);
  assert.equal(result.seeds,collected.includes('seedPacket')?7:0);assert.equal(result.count,2-collected.length);assert.equal(result.inHome,true);
  await page.evaluate(()=>scene.nextInteractionAt=0);await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>scene.inventory.data.seeds),result.seeds);
 }
 console.log('PASS coleta + save/reload a cada objeto + sem duplicação:',order.join(' → '));
}
// E on ordinary floor never opens editor; H does.
await page.evaluate(()=>{scene.player.x=5.5*32;scene.player.y=6.5*32;scene.nextInteractionAt=0});await page.keyboard.press('e');assert.equal(await page.locator('.home-customization-card').count(),0);
await page.keyboard.press('h');assert.equal(await page.locator('.home-customization-card').count(),1);await page.keyboard.press('Escape');
await page.keyboard.press('m');await page.waitForFunction(()=>document.querySelector('.map-snapshot')?.naturalWidth>0);assert.equal(await page.locator('.map-card h2').textContent(),'Interior da casa');
assert.equal(await page.locator('.map-snapshot').evaluate(e=>e.naturalWidth),384);await page.keyboard.press('Escape');
await page.evaluate(()=>scene.leaveHome());await page.keyboard.press('m');await page.waitForFunction(()=>document.querySelector('.map-snapshot')?.naturalWidth===960);
assert.equal(await page.locator('.map-card h2').textContent(),'Mapa completo do vale');
let pos=await page.evaluate(()=>({left:parseFloat(document.querySelector('.map-player').style.left),expected:scene.player.x/(96*32)*100}));assert.ok(Math.abs(pos.left-pos.expected)<.001);
await page.screenshot({path:path.join(output,'map-final.png')});await page.keyboard.press('Escape');console.log('PASS M: interior identificado → mapa completo, marcador correto');
assert.equal(await page.locator('[data-slot]').count(),9);assert.equal(await page.locator('[data-slot][data-tool]').count(),0);
await page.keyboard.press('i');await page.locator('[data-bag-item="item:wateringCan"]').dragTo(page.locator('.inventory-quickbar [data-slot="0"]'));await page.keyboard.press('i');await page.keyboard.press('1');assert.equal(await page.evaluate(()=>scene.tool),'water');await reload();assert.equal(await page.locator('[data-slot="0"]').getAttribute('data-tool'),'water');
await page.locator('[data-slot="0"]').click({button:'right'});await page.locator('[data-assign=""]').click();assert.equal(await page.locator('[data-slot][data-tool]').count(),0);console.log('PASS nove slots vazios, atribuição, teclado, persistência e remoção');
const handle=await page.locator('.journal-heading').boundingBox();await page.mouse.move(handle.x+40,handle.y+12);await page.mouse.down();await page.mouse.move(400,160);await page.mouse.up();const before=await page.locator('.journal').boundingBox();assert.ok(before.x>250,'missões devem realmente acompanhar o arraste');await reload();const after=await page.locator('.journal').boundingBox();assert.ok(Math.abs(before.x-after.x)<2);assert.ok(Math.abs(before.y-after.y)<2);
await page.locator('.journal-close').click();await reload();assert.equal(await page.locator('.journal').isVisible(),false);await page.locator('.journal-reopen').click();console.log('PASS missões arrastáveis, posição e X persistentes');
await page.evaluate(()=>{scene.ui.locationName='';scene.updateHUD()});assert.equal(await page.locator('.location-pill').isVisible(),true);await page.waitForTimeout(10200);assert.equal(await page.locator('.location-pill').isVisible(),false);console.log('PASS nome do local por 10 segundos');
await page.evaluate(()=>scene.ui.toggleTopToolbar());await page.locator('.toolbar-controls-button').click();assert.equal(await page.getByRole('dialog',{name:'Controles',exact:true}).count(),1);await page.keyboard.press('Escape');
for(const [width,height] of [[1920,1080],[1280,800],[960,640],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(250);const box=await page.locator('.toolbelt').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);await page.screenshot({path:path.join(output,`hud-${width}.png`)})}
console.log('PASS controles na barra, HUD em quatro tamanhos');assert.deepEqual(errors,[]);console.log('PASS sem erros JS/assets');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
