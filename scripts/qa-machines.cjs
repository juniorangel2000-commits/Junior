const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.argv[2]||'/tmp/qa-machines';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log('JSERROR',e.message);});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Máquinas QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});
 const setup=await page.evaluate(async()=>{
  window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');window.md=await import('/src/data/machines.ts');window.ms=await import('/src/systems/machines.ts');window.fd=await import('/src/systems/farm-interior.ts');
  const{FARM_BUILDINGS}=await import('/src/data/farm-buildings.ts'),{performVillageService}=await import('/src/systems/village-services.ts'),{craft}=await import('/src/systems/crafting.ts'),{Inventory}=await import('/src/systems/inventory.ts'),s=v.snapshotState();
  s.time=600;s.villageEconomy.coins=1000;s.inventory.hammer=1;
  for(const k of md.MACHINE_IDS)for(const[id,n]of Object.entries(md.MACHINES[k].cost))s.inventory[id]+=n;
  for(const k of ['cheesePress','butterChurn','spinningWheel','loom','stoneMill']){const learned=performVillageService(s,'learn-'+k);if(!learned.ok)throw Error(learned.message);const inv=new Inventory(s.inventory),built=craft(k,inv,true,s.villageProgress);if(!built.ok)throw Error(built.message);s.inventory=inv.data;}
  s.inventory.milk=3;s.inventory.goatMilk=1;s.inventory.wool=2;s.inventory.wheat=1;s.inventory.yarn=0;
  s.depletedResources=[...new Set([...s.depletedResources,...v.world.resources.filter(r=>r.x>=27&&r.x<=65&&r.y>=27&&r.y<=58).map(r=>r.id)])];
  s.farmConstruction={version:1,nextId:2,sites:[{id:1,kind:'barn',x:40,y:30,delivered:{...FARM_BUILDINGS.barn.cost},finished:true,animals:[],hay:0,gateOpen:true}]};v.loadState(s);
  const five=['cheesePress','butterChurn','spinningWheel','loom','stoneMill'];return {learned:s.villageProgress.recipes.filter(r=>five.includes(r)),machines:five.map(k=>s.inventory[k])};
 });assert.equal(setup.learned.length,5);assert.deepEqual(setup.machines,[1,1,1,1,1]);console.log('· cinco projetos aprendidos com os moradores e máquinas montadas');
 const outside=await page.evaluate(async()=>{
  let candidate;for(let y=39;y<53&&!candidate;y++)for(let x=30;x<60&&!candidate;x++){
   v.player.x=(x+.5)*32;v.player.y=(y+1.5)*32;v.player.facing={x:0,y:-1};const m={id:1,kind:'cheesePress',space:'property',x,y};if(!ms.machinePlacementReason(v.machineRuntime,v.state,m))candidate=m;
  }
  if(!candidate)throw Error('Sem terreno livre');await v.useVillageItem('cheesePress');const m=v.state.machines?.items[0];if(!m)throw Error('Máquina não instalada');await v.useVillageItem('milk');return m.id;
 });assert.equal(await page.evaluate(()=>v.state.inventory.milk),2);assert.ok(await page.evaluate(()=>!!v.state.machines.items[0].job));
 await page.keyboard.press('e');assert.equal(await page.evaluate(()=>v.state.machines.items.length),1);console.log('· queijeira na Propriedade carregada; E não recolhe durante o trabalho');
 await page.evaluate(()=>{const p=fd.farmDoorPoint(v.state.farmConstruction.sites[0]);v.player.x=p.x;v.player.y=p.y+6;});await page.keyboard.press('e');await page.waitForFunction(()=>game.scene.isActive('Interior'));await page.waitForTimeout(800);await page.evaluate(()=>{window.i=game.scene.getScene('Interior');});
 const place=async(kind,x,y)=>{const result=await page.evaluate(async({kind,x,y})=>{i.player.x=(x+.5)*32;i.player.y=(y+1.5)*32;i.player.facing={x:0,y:-1};await i.useVillageItem(kind);return i.state.machines.items.find(m=>m.space==='farm:1'&&m.kind===kind)?.id;},{kind,x,y});assert.ok(result,'Instalar '+kind);return result;};
 const near=async(id)=>page.evaluate(id=>{const scene=game.scene.isActive('Interior')?i:v,rt=scene.machineRuntime,m=scene.state.machines.items.find(m=>m.id===id),w=md.MACHINES[m.kind].width*32;
  const choices=[{x:m.x*32+w/2,y:(m.y+1)*32+16},{x:m.x*32+w/2,y:m.y*32-16},{x:m.x*32-16,y:m.y*32+16},{x:(m.x*32+w)+16,y:m.y*32+16}];
  const p=choices.find(p=>[[-8,-5],[8,-5],[-8,4],[8,4]].every(([dx,dy])=>!rt.blocked(p.x+dx,p.y+dy)&&!ms.machinePointBlocked(scene.state,rt.space(),p.x+dx,p.y+dy)));if(!p)throw Error('Sem acesso à máquina');scene.player.x=p.x;scene.player.y=p.y;
 },id);
 const stock=async id=>page.evaluate(id=>(game.scene.isActive('Interior')?i:v).state.inventory[id],id);
 const advance=async minutes=>{await page.evaluate(minutes=>{const s=i.state,n=(s.day-1)*1440+s.time+minutes;s.day=Math.floor(n/1440)+1;s.time=n%1440;},minutes);await page.waitForTimeout(400);};
 const pressE=async()=>{await page.waitForTimeout(200);await page.keyboard.press('e');await page.waitForTimeout(200);};
 const wheel=await place('spinningWheel',5,5),loom=await place('loom',9,5);
 await near(wheel);await page.evaluate(()=>i.ui.setQuickbar(['item:wool',null,null,null,null,null,null,null,null]));await page.keyboard.press('1');await page.waitForTimeout(300);assert.equal(await stock('wool'),1);console.log('· roca instalada e carregada pela barra rápida');
 await advance(1440);await near(wheel);await page.waitForFunction(id=>i.machineView.objects.get(id)?.badge.visible,wheel);assert.equal(await page.evaluate(id=>i.machineView.objects.get(id).badge.texture.key,wheel),'machine-product-yarn');await page.screenshot({path:out+'/novelo-pronto.png'});await pressE();assert.equal(await stock('yarn'),1);
 await page.keyboard.press('1');await page.waitForTimeout(200);assert.equal(await stock('wool'),0);await advance(1440);await pressE();assert.equal(await stock('yarn'),2);
 await near(loom);await page.evaluate(()=>i.ui.setQuickbar(['item:yarn',null,null,null,null,null,null,null,null]));await page.keyboard.press('1');await page.waitForTimeout(200);assert.equal(await stock('yarn'),0);
 const churn=await place('butterChurn',7,6),mill=await place('stoneMill',9,6);
 await near(churn);await page.evaluate(()=>i.useVillageItem('milk'));await near(mill);await page.evaluate(()=>i.useVillageItem('wheat'));assert.equal(await stock('milk'),0);assert.equal(await stock('wheat'),0);
 await advance(720);await page.evaluate(()=>{i.cameras.main.stopFollow().setZoom(2).centerOn(224,160);});await page.waitForTimeout(300);
 for(const[id,product]of [[churn,'butter'],[mill,'flour']]){await page.waitForFunction(id=>i.machineView.objects.get(id)?.badge.visible,id);assert.equal(await page.evaluate(id=>i.machineView.objects.get(id).badge.texture.key,id),'machine-product-'+product);}
 await page.screenshot({path:out+'/baloes-produtos-prontos.png'});
 await near(churn);await pressE();await near(mill);await pressE();assert.equal(await stock('butter'),1);assert.equal(await stock('flour'),1);
 await advance(720);await near(loom);await pressE();assert.equal(await stock('woolCloth'),1);console.log('· lã → novelos → tecido de lã; leite → manteiga; trigo → farinha, com balões corretos');
 await near(wheel);await page.evaluate(()=>i.ui.setQuickbar(['hand',null,null,null,null,null,null,null,null]));await page.keyboard.press('1');await pressE();assert.equal(await stock('spinningWheel'),1);
 await page.evaluate(()=>{i.player.x=(i.layout.doorX+1)*32;i.player.y=(i.layout.height-1.6)*32;});await page.keyboard.down('s');await page.waitForFunction(()=>!game.scene.isActive('Interior')&&game.scene.isActive('Vale'));await page.keyboard.up('s');
 await near(outside);await page.waitForFunction(id=>v.machineView.objects.get(id)?.badge.visible,outside);assert.equal(await page.evaluate(id=>v.machineView.objects.get(id).badge.texture.key,outside),'machine-product-cheese');await pressE();assert.equal(await stock('cheese'),1);console.log('· queijeira terminou enquanto o jogador estava em outro cenário');
 await page.evaluate(()=>v.mainMenu());await page.locator('#continue-game').waitFor();await page.locator('#continue-game').click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
 const result=await page.evaluate(()=>({cheese:v.state.inventory.cheese,butter:v.state.inventory.butter,flour:v.state.inventory.flour,woolCloth:v.state.inventory.woolCloth,yarn:v.state.inventory.yarn,spinningWheel:v.state.inventory.spinningWheel,machines:v.state.machines.items.length,jobs:v.state.machines.items.filter(m=>m.job).length}));assert.deepEqual(result,{cheese:1,butter:1,flour:1,woolCloth:1,yarn:0,spinningWheel:1,machines:4,jobs:0});assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/validacao.json',JSON.stringify({setup,result,errors},null,2));console.log('QA das máquinas: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
