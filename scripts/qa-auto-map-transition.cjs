const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {walkMapExit}=require('./qa-walk-exit.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.QA_URL||'http://127.0.0.1:5178');await p.locator('#new-game').click();await p.locator('#character-name').fill('Passagens');await p.getByRole('button',{name:'Começar minha história'}).click();await p.locator('.toolbelt').waitFor();
 await p.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.s=game.scene.getScene('Vale');game.loop.sleep();const p=s.state.mapEdits.points.entry;s.player.x=(p.x+.5)*32;s.player.y=(p.y+.5)*32;s.exitPassage.reset();});
 assert.equal(await p.locator('#ui').getAttribute('data-area'),'property');await p.keyboard.press('e');assert.equal(await p.locator('#ui').getAttribute('data-area'),'property');
 const elsewhere=await p.evaluate(()=>{s.player.x=150;s.player.y=500;s.player.keys.A.isDown=true;for(let i=0;i<30;i++)s.update(0,1000/60);s.player.keys.A.isDown=false;return !s.forestActive});assert.equal(elsewhere,true);
 await p.evaluate(()=>{s.tool='pickaxe';s.state.equippedTool='pickaxe';});await walkMapExit(p,'Vale');
 await p.evaluate(()=>{window.f=game.scene.getScene('Floresta');game.loop.sleep();Object.values(f.player.keys).forEach(k=>k.isDown=false);for(let i=0;i<60;i++)f.update(0,1000/60)});assert.equal(await p.locator('#ui').getAttribute('data-area'),'forest');
 await p.keyboard.press('e');assert.equal(await p.locator('#ui').getAttribute('data-area'),'forest');
 await walkMapExit(p,'Floresta');await p.evaluate(()=>{game.loop.sleep();Object.values(s.player.keys).forEach(k=>k.isDown=false);for(let i=0;i<60;i++)s.update(0,1000/60)});assert.equal(await p.locator('#ui').getAttribute('data-area'),'property');
 // Repeat with a tethered animal. Reuse the existing real leash/transfer/delivery path.
 await walkMapExit(p,'Vale');
 const led=await p.evaluate(async()=>{game.loop.sleep();window.f=game.scene.getScene('Floresta');const {startAnimalEscort}=await import('/src/systems/animals.ts');const a=f.wildlife.animals[0],entry=f.state.forestMapEdits.points.entry;
  Object.values(f.player.keys).forEach(k=>k.isDown=false);f.player.x=(entry.x+.5)*32;f.player.y=(entry.y+.5)*32;
  a.brain.x=f.player.x-18;a.brain.y=f.player.y;f.state.inventory.cord=1;
  if(!startAnimalEscort(f.state,a.brain.snapshot()))throw Error('Cannot attach test animal');
  return a.id;
 });await walkMapExit(p,'Floresta');
 const delivery=await p.evaluate(id=>({owned:s.state.recruitedAnimals.includes(id),escort:s.state.animalEscort??null,cord:s.inventory.data.cord}),led);
 assert.deepEqual(delivery,{owned:true,escort:null,cord:1});assert.deepEqual(errors,[]);console.log('PASS walking only, both directions, no E transition, no arrival bounce, off-gate movement, selected tool, animal leash and delivery');await p.close();
 // Normal production build must not offer the development editor anywhere.
 const prod=await b.newPage({viewport:{width:1280,height:800}});prod.on('pageerror',e=>errors.push(e.message));await prod.goto(process.env.QA_PRODUCTION_URL||'http://127.0.0.1:5179');await prod.locator('#new-game').waitFor();assert.equal(await prod.locator('#edit-map').count(),0);
 await prod.locator('#new-game').click();await prod.locator('#character-name').fill('Jogador');await prod.getByRole('button',{name:'Começar minha história'}).click();await prod.locator('.toolbelt').waitFor();await prod.keyboard.press('F2');assert.equal(await prod.locator('.map-editor-ui').count(),0);
 await prod.keyboard.press('Escape');assert.equal(await prod.locator('[data-action="map-editor"]').count(),0);await prod.keyboard.press('Escape');await prod.mouse.click(950,400,{button:'right'});await prod.getByRole('button',{name:'Controles',exact:true}).click();assert.equal(await prod.locator('.controls-panel').getByText('F2',{exact:true}).count(),0);assert.ok((await prod.locator('.controls-panel').textContent()).includes('automaticamente'));
 assert.deepEqual(errors,[]);const dir='docs/cenarios/mapas-finalizados-2026-10-25';fs.writeFileSync(`${dir}/transicoes-automaticas.json`,JSON.stringify({passed:true,walkingOnly:true,noArrivalBounce:true,otherEdgesDoNotTransition:true,animalDelivery:delivery,productionEditorHidden:true,pageErrors:errors,at:new Date().toISOString()},null,2));console.log('PASS production build hides title editor, pause editor, F2 shortcut and editor controls');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
