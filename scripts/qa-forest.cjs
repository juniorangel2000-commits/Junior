const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER',e.message)});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
page.setDefaultTimeout(20000);console.log('opening');
await page.goto(process.env.QA_URL||'http://127.0.0.1:5174');await page.locator('#new-game').click();await page.locator('#character-name').fill('Floresta');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');valley.player.x=75.5*32;valley.player.y=18.5*32;valley.selectTool('hand');valley.nextInteractionAt=0;window.original=valley.snapshotState();});
console.log('entering');await page.keyboard.press('e');await page.waitForSelector('.forest-hud');console.log('entered');await page.waitForFunction(()=>game.scene.isActive('Floresta'));
await page.evaluate(()=>window.forest=game.scene.getScene('Floresta'));
assert.equal(await page.evaluate(()=>forest.state.activeArea),'forest');
await page.keyboard.press('m');await page.screenshot({path:'docs/cenarios/floresta-mapa.png'});await page.keyboard.press('m');
await page.evaluate(()=>{forest.player.x=24*32;forest.player.y=55.5*32;forest.applyCamera()});
await page.screenshot({path:'docs/cenarios/floresta-animais.png'});
const before=await page.evaluate(()=>forest.player.x);await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');assert.ok(await page.evaluate(()=>forest.player.x)>before,'keyboard movement');
await page.keyboard.press('Escape');const paused=await page.evaluate(()=>forest.player.x);await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');assert.equal(await page.evaluate(()=>forest.player.x),paused);await page.keyboard.press('Escape');
const ids=await page.evaluate(()=>forest.animals.map(a=>a.id));
for(const id of ids){await page.evaluate(id=>{const a=forest.animals.find(a=>a.id===id);forest.player.x=a.x;forest.player.y=a.y+24;},id);await page.keyboard.press('e');}
assert.equal(await page.evaluate(()=>forest.state.recruitedAnimals.length),10);assert.equal(await page.evaluate(()=>forest.animals.length),0);
await page.evaluate(()=>{forest.player.x=48.5*32;forest.player.y=68.5*32});await page.keyboard.press('e');console.log('exit-state',await page.evaluate(()=>({paused:forest.paused,leaving:forest.leaving,near:forest.nearExit(),errors:forest.state.activeArea})));await page.waitForSelector('.forest-hud',{state:'detached'});
assert.equal(await page.evaluate(()=>valley.state.recruitedAnimals.length),10);
assert.deepEqual(await page.evaluate(()=>valley.state.depletedResources),await page.evaluate(()=>original.depletedResources));
assert.equal(await page.evaluate(()=>valley.children.list.filter(o=>o.texture?.key==='forest-animals-source').length),10);
await page.evaluate(()=>{valley.player.x=29*32;valley.player.y=48*32;valley.cameras.main.centerOn(valley.player.x,valley.player.y)});await page.screenshot({path:'docs/cenarios/animais-propriedade.png'});
await page.evaluate(()=>{valley.player.x=75.5*32;valley.player.y=18.5*32;valley.nextInteractionAt=0});await page.keyboard.press('e');await page.waitForSelector('.forest-hud');
assert.equal(await page.evaluate(()=>game.scene.getScene('Floresta').animals.length),0,'animals do not respawn');
await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('.forest-hud');
assert.equal(await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);return game.scene.getScene('Floresta').state.recruitedAnimals.length}),10);
assert.deepEqual(errors,[]);fs.writeFileSync('docs/cenarios/validacao-floresta.json',JSON.stringify({passed:true,checks:['entry','map','keyboard','pause','10 unique recruits','return','property herd','no respawn','reload in forest'],at:new Date().toISOString()},null,2));console.log('PASS forest transitions, 10 animals, saves, property, map, movement');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
