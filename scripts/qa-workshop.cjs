const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/workshop-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const checks=[],errors=[];
 const check=(name,ok)=>{checks.push({name,passed:!!ok});console.log(name,!!ok);assert.ok(ok,name);};page.on('pageerror',e=>errors.push(e.stack||e.message));
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Oficina');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  await page.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');game.loop.sleep();
   Object.assign(v.inventory.data,{wood:30,board:8,plank:8,peg:8,hammer:1,furniture:0,fenceKit:0});
   for(let y=20;y<45&&!window.site;y++)for(let x=30;x<60;x++)if([0,1,2,3,4].every(dx=>v.freeForBuilding(x+dx,y,'workbench')&&v.freeForBuilding(x+dx,y+1,'workbench')&&!v.building.at(x+dx,y)&&!v.building.at(x+dx,y+1))&&!v.world.isSolidPoint(x*32-16,y*32+16)){window.site={x,y};break;}
   if(!site)throw Error('No workshop site');v.player.x=site.x*32-16;v.player.y=site.y*32+16;v.player.facing={x:1,y:0};v.ui.toggleCrafting(v.inventory.data,false);
  });
  check('Receitas indisponíveis sem bancada',await page.locator('[data-recipe=furniture]').isDisabled()&&await page.locator('[data-recipe=fenceKit]').isDisabled());
  await page.evaluate(()=>v.ui.closeModal());
  await page.evaluate(()=>{v.selectTool('workbench');v.nextInteractionAt=0;v.interact(site);});
  check('Bancada colocada com materiais e mãos selecionadas',await page.evaluate(()=>v.building.at(site.x,site.y)?.kind==='workbench'&&v.inventory.data.plank===4&&v.inventory.data.peg===4&&v.tool==='hand'));
  const open=async()=>{await page.evaluate(()=>{v.nextInteractionAt=0;v.interact(site);});await page.getByRole('heading',{name:'Bancada de trabalho',exact:true}).waitFor();};
  await open();await page.locator('[data-recipe=furniture]').click();await page.evaluate(()=>v.ui.closeModal());
  check('Cancelar fabricação não consome materiais',await page.evaluate(()=>v.inventory.data.wood===30&&v.inventory.data.board===8&&v.inventory.data.furniture===0));
  await open();
  const craft=async id=>{await page.locator(`[data-recipe=${id}]`).click();await page.evaluate(()=>{for(let i=0;i<150&&v.craftJob;i++)v.update(i*100,100);});};
  await craft('furniture');check('Banco fabricado na bancada',await page.evaluate(()=>v.inventory.data.furniture===1&&v.inventory.data.wood===20&&v.inventory.data.board===4));
  await craft('fenceKit');await craft('fenceKit');check('Dois módulos fabricados na bancada',await page.evaluate(()=>v.inventory.data.fenceKit===2&&v.inventory.data.wood===14));
  await page.screenshot({path:out+'/bancada-funcional.png'});await page.evaluate(()=>v.ui.closeModal());
  await page.evaluate(async()=>{window.bank={x:site.x+2,y:site.y};v.player.x=bank.x*32-16;v.player.y=bank.y*32+16;await v.useVillageItem('furniture');});
  check('Usar a peça seleciona posicionamento sem consumi-la',await page.evaluate(()=>v.tool==='bench'&&v.inventory.data.furniture===1));
  await page.keyboard.press('r');await page.evaluate(()=>{v.nextInteractionAt=0;v.interact(bank);});
  check('Banco usa sprite nova e mantém a orientação',await page.evaluate(()=>v.inventory.data.furniture===0&&v.building.at(bank.x,bank.y).rotation===1&&v.buildingSprites.some(o=>o.texture.key==='woodwork-bench-1')));
  await page.evaluate(()=>{v.selectTool('fence');for(let dx=3;dx<=4;dx++){v.player.x=(site.x+dx+.5)*32;v.player.y=site.y*32+48;v.nextInteractionAt=0;v.interact({x:site.x+dx,y:site.y});}});
  console.log('Estado das cercas',await page.evaluate(()=>({kits:v.inventory.data.fenceKit,wood:v.inventory.data.wood,newPieces:v.building.buildings.filter(b=>b.y===site.y&&b.x>=site.x&&b.x<=site.x+4),masks:v.buildingSprites.filter(o=>o.getData('fence')).map(o=>o.getData('fenceConnections'))})));
  check('Cercas usam módulos e se conectam com a arte nova',await page.evaluate(()=>v.inventory.data.fenceKit===0&&v.inventory.data.wood===14&&[3,4].every(dx=>v.building.at(site.x+dx,site.y)?.kind==='fence')&&v.buildingSprites.some(o=>o.getData('fenceConnections')===2)&&v.buildingSprites.some(o=>o.getData('fenceConnections')===8)));
  await page.evaluate(()=>{v.player.x=bank.x*32-16;v.player.y=bank.y*32+16;v.selectTool('remove');v.nextInteractionAt=0;v.interact(bank);});
  check('Recolher retorna a peça pronta para reposicionar',await page.evaluate(()=>v.inventory.data.furniture===1&&v.inventory.data.wood===14&&!v.building.at(bank.x,bank.y)));
  await page.evaluate(()=>{v.selectTool('bench');v.rotation=2;v.nextInteractionAt=0;v.interact(bank);v.selectTool('hand');v.persist();v.cameras.main.stopFollow().setZoom(3).centerOn((site.x+2)*32,site.y*32);game.step(performance.now(),0);});
  const saved=await page.evaluate(async()=>{const {loadSave,validateSave}=await import('/src/systems/save.ts');const s=loadSave();return validateSave(s)&&s.version===4&&s.buildings.find(b=>b.kind==='bench').rotation===2;});check('Salvar preserva a bancada, peças e orientação no formato novo',saved);
  await page.screenshot({path:out+'/banco-cercas-bancada.png'});check('Sem erros JavaScript',errors.length===0);
 }catch(e){await page.screenshot({path:out+'/falha.png'});throw e;}
 finally{fs.writeFileSync(out+'/resultado.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
