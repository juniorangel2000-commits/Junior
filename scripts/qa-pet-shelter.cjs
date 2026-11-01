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
  await page.evaluate(()=>{Object.assign(v.inventory.data,{hammer:0,plank:6,stone:8,cord:2});v.interact();});
  check('Base mostra um botão por material e avisa sobre o martelo',await page.locator('[data-shelter-deliver]').count()===3 && await page.getByText('Falta o martelo',{exact:true}).count()===1);
  await page.locator('#shelter-quantity-plank').fill('2');await page.locator('[data-shelter-deliver="plank"]').click();
  check('Entrega parcial salva sem martelo',await page.evaluate(()=>v.inventory.data.plank===4&&site.delivered.plank===2&&storage.loadSave().petShelter.delivered.plank===2));
  await page.locator('[data-shelter-close]').click();await page.evaluate(()=>{v.nextInteractionAt=0;v.interact();});
  check('Reabrir preserva a entrega e informa o saldo',await page.locator('#shelter-quantity-plank').inputValue()==='4');
  await page.screenshot({path:out+'/entrega-parcial-base.png'});
  // Simulate storage quota failure at the real scene transaction boundary.
  await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
  await page.locator('[data-shelter-deliver="cord"]').click();
  check('Falha ao salvar preserva materiais e entrega anterior',await page.evaluate(()=>v.inventory.data.cord===2&&!site.delivered.cord&&site.delivered.plank===2));
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
  await page.locator('[data-shelter-deliver="cord"]').click();
  check('Nova tentativa registra a entrega uma única vez',await page.evaluate(()=>v.inventory.data.cord===0&&site.delivered.cord===2));
  await page.locator('[data-shelter-close]').click();
  for(let stage=0;stage<3;stage++){
   await page.evaluate(stage=>{v.inventory.data.hammer=1;Object.assign(v.inventory.data,model.shelterRemainingCost(site));v.nextInteractionAt=0;v.interact();},stage);
   check('Menu mostra custos e fontes da etapa '+(stage+1),await page.locator('.shelter-costs li').count()>0);
   await page.screenshot({path:out+`/etapa-${stage+1}-menu.png`});
   if(stage>0){
    const items=await page.evaluate(stage=>Object.keys(model.SHELTER_STEPS[stage].cost),stage);
    for(const item of items){
     await page.locator(`#shelter-quantity-${item}`).fill('1');await page.locator(`[data-shelter-deliver="${item}"]`).click();
     check(`Entrega individual da etapa ${stage+1}: ${item}`,await page.evaluate(item=>storage.loadSave().petShelter.delivered[item]===1,item));
    }
    await page.screenshot({path:out+`/etapa-${stage+1}-entregas.png`});
   }
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
  await page.evaluate(()=>{game.step(performance.now(),0);document.querySelector('#ui').style.visibility='hidden';});await page.screenshot({path:out+'/03-pronta-com-moradores.png'});await page.evaluate(()=>{v.cameras.main.setZoom(1.35);v.cameras.main.centerOn(830,340);game.step(performance.now(),0)});await page.screenshot({path:out+'/04-montanha-caminho-casinha.png'});await page.evaluate(()=>{v.cameras.main.setZoom(.85);v.cameras.main.centerOn(1180,470);game.step(performance.now(),0);});await page.screenshot({path:out+'/06-rio-entre-montanhas.png'});await page.evaluate(async()=>{const geometry=await import('/src/data/homestead-landscape.ts');const x=900;let edge=-Infinity;for(let dx=-10;dx<=10;dx++)edge=Math.max(edge,geometry.mountainFrontAt(site,x+dx));window.edgeCheck={x,y:edge+22};v.player.x=x;v.player.y=edgeCheck.y;v.player.update(0,v.movementBlocked,v.movementBlockedPoint,true,v.swimmingPoint);v.cameras.main.setZoom(2.2);v.cameras.main.centerOn(x,edgeCheck.y-25);game.step(performance.now(),0);});await page.screenshot({path:out+'/05-colisao-montanha.png'});
  check('Personagem em chão livre e montanha desenhada atrás dele',await page.evaluate(()=>!v.world.isSolidPoint(v.player.x,v.player.y)&&v.children.list.find(o=>o.getData?.('homestead-mountain')).depth<v.player.sprite.depth));await page.evaluate(()=>document.querySelector('#ui').style.visibility='');
  const collisionAudit=await page.evaluate(async()=>{
   const geometry=await import('/src/data/homestead-landscape.ts');let checked=0;
   for(let x=32;x<3000;x+=8){const y=geometry.mountainFrontAt(site,x);if(!Number.isFinite(y)||y<=25)continue;
    if(!v.world.isSolidPoint(x,y-1))return {ok:false,x,y};checked++;
   }
   const animalSafe=v.animals.animals.every(a=>!geometry.mountainSolid(site,a.x,a.y));
   const rockDepths=v.children.list.filter(o=>o.getData?.('homestead-mountain')).map(o=>o.depth);
   return {ok:checked>100&&animalSafe&&rockDepths.every(d=>d<v.player.sprite.depth),checked,animalSafe,rockDepths};
  });check('Contorno completo bloqueado e animais fora das rochas',collisionAudit.ok,collisionAudit);
  const frozen=await page.evaluate(()=>{v.ui.togglePause();const before=JSON.stringify(v.state.dungeons.pets.map(p=>p.world));for(let i=0;i<20;i++)controller.update(.1);const same=before===JSON.stringify(v.state.dungeons.pets.map(p=>p.world));v.ui.closeModal();return same;});check('Pausa congela os moradores',frozen);
  await page.evaluate(()=>{controller.command({kind:'select',id:v.state.dungeons.pets[0].id});controller.command({kind:'follow'});controller.update(.1);});
  check('Escolher um pet para seguir deixa dois moradores',await page.evaluate(()=>v.children.list.filter(o=>o.getData?.('shelter-resident')).length===2&&!!controller.companion?.image.visible));
  await page.evaluate(()=>{controller.command({kind:'shelter'});controller.update(0);v.persist();});
  check('Volta para a casinha e persistência dos três moradores',await page.evaluate(()=>v.children.list.filter(o=>o.getData?.('shelter-resident')).length===3&&storage.loadSave().dungeons.pets.every(p=>p.world.mode==='shelter')));
  check('Sem erros JavaScript ou arquivos ausentes',errors.length===0,errors);
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
