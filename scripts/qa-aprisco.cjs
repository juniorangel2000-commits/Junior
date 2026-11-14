// Vite em 5190, Chromium/Playwright externos. Constrói uma obra real em terreno
// previamente limpo, aloja ovelhas/cabras e confere produção e recarregamento.
const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.argv[2]||'/tmp/qa-aprisco';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log('JSERROR',e.message);});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Aprisco QA');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});
 const construction=await page.evaluate(async()=>{
  window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');window.farm=await import('/src/systems/farm-construction.ts');window.doors=await import('/src/systems/farm-interior.ts');
  const{FARM_BUILDINGS}=await import('/src/data/farm-buildings.ts'),s=v.snapshotState();
  // O terreno da fixture foi limpo, como o jogador precisa fazer antes de construir.
  s.depletedResources=[...new Set([...s.depletedResources,...v.world.resources.filter(r=>r.x>=27&&r.x<=61&&r.y>=27&&r.y<=57).map(r=>r.id)])];
  s.recruitedAnimals=['forest-sheep-1','forest-sheep-2','forest-goat-1','forest-goat-2'];s.inventory.hammer=1;s.inventory.milkPail=1;s.inventory.shears=1;s.inventory.hay=30;
  for(const[key,n]of Object.entries(FARM_BUILDINGS.aprisco.cost))s.inventory[key]=n+4;v.loadState(s);
  let candidate;for(let y=30;y<49&&!candidate;y++)for(let x=30;x<51&&!candidate;x++)if(!farm.farmPlacementReason(v.state,'aprisco',x,y,(x,y)=>v.farmPlacementTileReason(x,y)))candidate={x,y};
  if(!candidate)throw Error('Sem terreno livre para a fixture');
  const point=farm.farmAnchor({...candidate,kind:'aprisco'});v.player.x=point.x+96;v.player.y=point.y+32;
  v.animals.animals.forEach((a,i)=>{a.brain.x=point.x-48+i*32;a.brain.y=point.y+32;});
  const rt=v.farmRuntime,base=farm.placeFarmBase(rt,'aprisco',candidate.x,candidate.y);if(!base.ok)throw Error(base.message);
  const site=v.state.farmConstruction.sites[0];for(const result of [farm.deliverFarmMaterials(rt,site.id),farm.finishFarmConstruction(rt,site.id)])if(!result.ok)throw Error(result.message);
  for(const id of v.state.recruitedAnimals){const result=farm.assignFarmAnimal(rt,site.id,id);if(!result.ok)throw Error(result.message);}
  const result=farm.setFarmAnimalsInside(rt,site.id,true);if(!result.ok)throw Error(result.message);
  window.siteId=site.id;return{siteId:site.id,kind:site.kind,animals:v.state.farmConstruction.sites[0].animals.length};
 });assert.equal(construction.animals,4);console.log('· base, materiais, conclusão e quatro alojamentos: OK');
 await page.waitForTimeout(1000);await page.screenshot({path:out+'/aprisco-externo.png'});
 await page.evaluate(()=>{const site=v.state.farmConstruction.sites[0],p=farm.farmAnchor(site);v.player.x=p.x;v.player.y=p.y+32;});await page.keyboard.down('w');await page.waitForFunction(()=>!!doors.nearFarmDoor(v.state,v.player));await page.keyboard.up('w');await page.keyboard.press('e');await page.waitForFunction(()=>game.scene.isActive('Interior'));await page.waitForTimeout(1000);
 await page.evaluate(()=>{window.i=game.scene.getScene('Interior');});
 assert.deepEqual(await page.evaluate(()=>i.animals.map(a=>a.sprite.texture.key).sort()),['animal-goat-animated','animal-goat-animated','animal-sheep-animated','animal-sheep-animated']);
 const trough=async()=>{await page.evaluate(()=>{const f=i.layout.fixtures.find(f=>f.kind==='trough');i.player.x=f.x+f.w/2;i.player.y=f.y+f.h+12;});await page.waitForTimeout(200);await page.keyboard.press('e');await page.waitForTimeout(200);};
 const morning=async()=>{await page.evaluate(()=>{i.state.day++;i.state.time=361;i.site.animalsOverride={inside:true,until:999999};});await page.waitForTimeout(400);};
 const near=async(id)=>{await page.evaluate(id=>{for(const[aIndex,a]of i.animals.entries()){a.brain.resting=true;a.brain.hold();a.brain.x=64+aIndex*68;a.brain.y=110;}const a=i.animals.find(a=>a.id===id);a.brain.x=180;a.brain.y=206;i.player.x=150;i.player.y=210;},id);await page.waitForTimeout(200);};
 await trough();assert.equal(await page.evaluate(()=>i.site.trough),8);await morning();
 assert.equal(await page.evaluate(()=>i.state.animalCare.animals['forest-sheep-1'].woolDays),1);
 await near('forest-goat-1');assert.ok(await page.evaluate(()=>document.body.innerText.includes('ordenha com o balde')));await page.keyboard.press('e');await page.waitForTimeout(300);await page.screenshot({path:out+'/ordenha-cabra.png'});await page.waitForFunction(()=>i.state.inventory.goatMilk===1);assert.equal(await page.evaluate(()=>i.state.inventory.milk),0);console.log('· primeira manhã: leite de cabra ordenhado e lã ainda crescendo');
 // Devolve os animais para longe do cocho, que recebe alimento para outras duas manhãs.
 await page.evaluate(()=>{i.animals.forEach((a,n)=>{a.brain.x=64+n*68;a.brain.y=110;});});await trough();await morning();await morning();
 assert.ok(await page.evaluate(()=>i.state.animalCare.animals['forest-sheep-1'].wool));await near('forest-sheep-1');assert.ok(await page.evaluate(()=>document.body.innerText.includes('tosquia com a tesoura')));
 await page.keyboard.press('e');await page.waitForTimeout(300);await page.screenshot({path:out+'/tosquia-ovelha.png'});await page.waitForFunction(()=>i.state.inventory.wool===1);
 const result=await page.evaluate(()=>({goatMilk:i.state.inventory.goatMilk,wool:i.state.inventory.wool,shears:i.state.inventory.shears,durability:i.state.inventory.toolInstances.items.find(t=>t.kind==='shears').condition.durability}));assert.deepEqual(result,{goatMilk:1,wool:1,shears:1,durability:99});console.log('· terceira manhã alimentada: lã recolhida e tesoura em 99/100');
 await page.keyboard.press('e');await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>i.state.inventory.wool),1);
 await page.evaluate(()=>{i.player.x=(i.layout.doorX+1)*32;i.player.y=(i.layout.height-1.6)*32;});await page.keyboard.down('s');await page.waitForFunction(()=>!game.scene.isActive('Interior')&&game.scene.isActive('Vale'));await page.keyboard.up('s');
 await page.evaluate(()=>v.mainMenu());await page.locator('#continue-game').waitFor();await page.locator('#continue-game').click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
 const saved=await page.evaluate(()=>({wool:v.state.inventory.wool,goatMilk:v.state.inventory.goatMilk,woolReady:!!v.state.animalCare.animals['forest-sheep-1'].wool}));assert.deepEqual(saved,{wool:1,goatMilk:1,woolReady:false});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/validacao.json',JSON.stringify({construction,products:result,reload:true,errors},null,2));console.log('QA do aprisco: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
