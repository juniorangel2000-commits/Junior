const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.SHELTER_QA_OUTPUT||'/workspace/pet-shelter-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const errors=[],checks=[];
 const check=(name,value,details)=>{checks.push({name,passed:!!value,details});console.log(name,!!value,details??'');assert.ok(value,name);};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Abrigo');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');game.loop.sleep();
   window.model=await import('/src/systems/pet-shelter.ts');window.progress=await import('/src/dungeons/progression.ts');window.petAPI=await import('/src/dungeons/world-pet-controller.ts');window.storage=await import('/src/systems/save.ts');
   window.controller=petAPI.getWorldPetController(v);v.state.dungeons=progress.createDungeonProgress();
   window.site=v.state.petShelter;v.player.x=site.x;v.player.y=site.y+55;v.tool='hand';v.nextInteractionAt=0;
   v.cameras.main.stopFollow();v.cameras.main.setZoom(2);v.cameras.main.centerOn(site.x-60,site.y+30);
   window.result=(id,species='dog')=>({id,dungeon:'mall-parking',outcome:'victory',elapsed:900,kills:100,foundPet:species});
  });
  check('Casinha inicia abandonada',await page.evaluate(()=>site.stage===0&&!model.canAdoptPet(v.state)));
  await page.evaluate(()=>{progress.applyDungeonResult(v.state,result('locked'));Object.assign(v.inventory.data,v.state.inventory);});
  check('Resgate bloqueado antes de reparar',await page.evaluate(()=>v.state.dungeons.pets.length===0));
  await page.evaluate(()=>{game.step(performance.now(),0);document.querySelector('#ui').style.visibility='hidden';});await page.screenshot({path:out+'/00-abandonada.png'});await page.evaluate(()=>document.querySelector('#ui').style.visibility='');
  for(let stage=0;stage<3;stage++){
   await page.evaluate(stage=>{v.inventory.data.hammer=1;Object.assign(v.inventory.data,model.SHELTER_STEPS[stage].cost);v.nextInteractionAt=0;v.interact();},stage);
   check('Menu mostra custos e fontes da etapa '+(stage+1),await page.locator('.shelter-costs li').count()>0);
   await page.screenshot({path:out+`/etapa-${stage+1}-menu.png`});
   await page.locator('[data-shelter-upgrade]').click();
   check('Melhoria '+(stage+1)+' salva sem consumir martelo',await page.evaluate(stage=>site.stage===stage+1&&v.inventory.data.hammer===1&&storage.loadSave().petShelter.stage===stage+1,stage));
   await page.locator('[data-shelter-close]').click();
  }
  check('Resgates liberados somente na etapa final',await page.evaluate(()=>model.canAdoptPet(v.state)));
  await page.evaluate(()=>{
   Object.assign(v.state.inventory,v.inventory.data);
   for(const [index,species] of ['cat','dog','golden-retriever'].entries())progress.applyDungeonResult(v.state,result('adopt-'+index,species));
   progress.applyDungeonResult(v.state,result('fourth','border-collie'));Object.assign(v.inventory.data,v.state.inventory);controller.update(0);
   window.activities=new Set();
   for(let i=0;i<2400;i++){controller.update(.1);for(const image of v.children.list.filter(o=>o.getData?.('shelter-resident')))activities.add(image.getData('shelter-activity'));}
  });
  const residents=await page.evaluate(()=>({count:v.state.dungeons.pets.length,images:v.children.list.filter(o=>o.getData?.('shelter-resident')).length,activities:[...activities],valid:storage.validateSave(v.snapshotState()),safe:v.state.dungeons.pets.every(p=>!v.world.isSolidPoint(p.world.x,p.world.y)),stage:site.stage,texture:v.children.list.find(o=>o.getData?.('pet-shelter'))?.texture.key}));
  check('Três moradores visíveis e quarta adoção bloqueada',residents.count===3&&residents.images===3,residents);
  check('Circulação segura e interações variadas',residents.safe&&['water','food','play','rest','roam'].every(a=>residents.activities.includes(a)),residents);
  check('Arte restaurada e save válido',residents.valid&&residents.texture==='pet-shelter-2');
  await page.evaluate(()=>{game.step(performance.now(),0);document.querySelector('#ui').style.visibility='hidden';});await page.screenshot({path:out+'/03-pronta-com-moradores.png'});await page.evaluate(()=>{v.cameras.main.setZoom(1.35);v.cameras.main.centerOn(830,340);game.step(performance.now(),0)});await page.screenshot({path:out+'/04-montanha-caminho-casinha.png'});await page.evaluate(()=>document.querySelector('#ui').style.visibility='');
  const frozen=await page.evaluate(()=>{v.ui.togglePause();const before=JSON.stringify(v.state.dungeons.pets.map(p=>p.world));for(let i=0;i<20;i++)controller.update(.1);const same=before===JSON.stringify(v.state.dungeons.pets.map(p=>p.world));v.ui.closeModal();return same;});check('Pausa congela os moradores',frozen);
  await page.evaluate(()=>{controller.command({kind:'select',id:v.state.dungeons.pets[0].id});controller.command({kind:'follow'});controller.update(.1);});
  check('Escolher um pet para seguir deixa dois moradores',await page.evaluate(()=>v.children.list.filter(o=>o.getData?.('shelter-resident')).length===2&&!!controller.companion?.image.visible));
  await page.evaluate(()=>{controller.command({kind:'shelter'});controller.update(0);v.persist();});
  check('Volta para a casinha e persistência dos três moradores',await page.evaluate(()=>v.children.list.filter(o=>o.getData?.('shelter-resident')).length===3&&storage.loadSave().dungeons.pets.every(p=>p.world.mode==='shelter')));
  check('Sem erros JavaScript ou arquivos ausentes',errors.length===0,errors);
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
