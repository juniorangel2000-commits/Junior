// Requer Playwright e Chromium no ambiente de QA.
const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs');
const output=process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(),'after-rain-inventory-qa');fs.mkdirSync(output,{recursive:true});const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);void 0});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const attach=async()=>{await page.waitForTimeout(2500);await page.waitForFunction(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=game.scene.scenes[0];return !!scene?.player})};
 await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');await attach();
 await page.evaluate(()=>{scene.startNew({name:'Jardim',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});Object.assign(scene.inventory.data,{wood:35,stone:12,seeds:7,branch:8,log:3,plank:5,fiber:16,cord:2,hatchet:1,pickaxe:1,hammer:1,scrap:4});scene.state.homeSupplies={wateringCan:true,seedPacket:true};scene.updateHUD();scene.persist()});
 await page.waitForTimeout(700);
 const inventory=await page.evaluate(()=>({...scene.inventory.data}));
 await page.keyboard.press('i');await page.locator('.backpack-grid').waitFor();assert.equal(await page.locator('.backpack-grid .bag-slot').count(),30);assert.equal(await page.locator('.backpack-grid .occupied').count(),13);
 assert.equal(await page.locator('.inventory-quickbar [data-slot]').count(),9);
 await page.locator('[data-bag-item="item:seeds"]').dragTo(page.locator('.inventory-quickbar [data-slot="0"]'));
 await page.locator('[data-bag-item="item:wateringCan"]').dragTo(page.locator('.inventory-quickbar [data-slot="1"]'));
 await page.locator('[data-bag-item="item:wood"]').dragTo(page.locator('.inventory-quickbar [data-slot="2"]'));
 await page.locator('[data-bag-item="item:hatchet"]').click();await page.locator('.inventory-quickbar [data-slot="3"]').click();
 assert.deepEqual(await page.evaluate(()=>({...scene.inventory.data})),inventory);
 assert.deepEqual((await page.evaluate(()=>scene.ui.getQuickbar())).slice(0,4),['item:seeds','item:wateringCan','item:wood','item:hatchet']);
 await page.locator('[data-bag-item="item:seeds"]').focus();await page.keyboard.press('Enter');
 await page.keyboard.press('Tab');await page.locator('.inventory-quickbar [data-slot="8"]').focus();await page.keyboard.press('Enter');
 assert.equal((await page.evaluate(()=>scene.ui.getQuickbar()))[8],'item:seeds');
 await page.screenshot({path:path.join(output,'inventory-1280.png')});
 await page.keyboard.press('i');await page.keyboard.press('1');assert.equal(await page.evaluate(()=>scene.tool),'plant');
 await page.keyboard.press('2');assert.equal(await page.evaluate(()=>scene.tool),'water');await page.keyboard.press('4');assert.equal(await page.evaluate(()=>scene.tool),'hatchet');
 await page.reload();await attach();await page.evaluate(()=>scene.continueGame());
 assert.deepEqual((await page.evaluate(()=>scene.ui.getQuickbar())).slice(0,4),['item:seeds','item:wateringCan','item:wood','item:hatchet']);assert.deepEqual(await page.evaluate(()=>({...scene.inventory.data})),inventory);
 await page.keyboard.press('i');await page.locator('[data-bag-item="item:pickaxe"]').dragTo(page.locator('.inventory-quickbar [data-slot="0"]'));
 await page.locator('.inventory-quickbar [data-slot="1"]').focus();await page.keyboard.press('Delete');assert.equal((await page.evaluate(()=>scene.ui.getQuickbar()))[1],null);
 await page.keyboard.press('i');await page.evaluate(()=>{scene.inventory.spend({wood:35});scene.updateHUD()});assert.equal(await page.locator('.toolbelt [data-slot="2"] .slot-quantity').textContent(),'0');await page.keyboard.press('3');assert.notEqual(await page.evaluate(()=>scene.tool),'plant');
 await page.keyboard.press('i');assert.equal(await page.locator('[data-bag-item="item:wood"]').count(),0);
 for(const [width,height] of [[960,640],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(300);const grid=await page.locator('.backpack-grid').boundingBox();assert.ok(grid.x>=0&&grid.x+grid.width<=width);await page.screenshot({path:path.join(output,`inventory-${width}.png`)})}
 assert.deepEqual(errors,[]);console.log('PASS: 30 espaços, pilhas, regador, arrastar 3 itens, atribuição por clique, teclas, save/reload, substituir/remover, quantidade zero, 3 resoluções, sem erros JS/assets');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
