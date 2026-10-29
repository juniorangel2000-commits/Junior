const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.PIER_QA_OUTPUT||'/workspace/after-rain-pier-preview10';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 ]});
 const checks=[],errors=[];
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name+' '+JSON.stringify(details));};
 const p=await browser.newPage({viewport:{width:1600,height:1200}});p.setDefaultTimeout(120000);
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const render=()=>p.evaluate(()=>{game.step(500000,0);game.step(500001,0);});
 const move=async(key,count)=>{
  await p.keyboard.down(key);
  const result=await p.evaluate(count=>{
   let wet=false;
   for(let i=0;i<count;i++){v.player.update(.05,v.blocked,v.blockedPoint);wet||=v.world.waterPointAt(v.player.x,v.player.y);}
   return{x:v.player.x,y:v.player.y,wet};
  },count);
  await p.keyboard.up(key);return result;
 };
 try{
  await p.goto(process.env.QA_URL||'http://127.0.0.1:5182');
  await p.locator('#new-game').click();await p.locator('#character-name').fill('Píer e coreto');
  await p.getByRole('button',{name:'Começar minha história'}).click();
  await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
   const s=game.scene.getScene('Vale');s.enterVillage(s.snapshotState());
  });
  await p.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  const art=await p.evaluate(async()=>{
   window.v=game.scene.getScene('Vila');game.loop.sleep();v.paused=true;v.cameras.main.resetFX();
   document.querySelector('#ui').style.display='none';v.state.time=720;v.daylight.update(720);v.world.updateLighting(720);
   const wheat=v.children.list.filter(o=>o.getData?.('village-landmark-kind')==='wheat');
   const barricades=v.children.list.filter(o=>o.getData?.('village-barricade'));
   const {VILLAGE_TREES,VILLAGE_ENTRY,VILLAGE_BUILDINGS}=await import('/src/data/village.ts');
   const {villageRoute}=await import('/src/systems/village-walk.ts');
   const {VILLAGE_PIER}=await import('/src/data/village-pier.ts');
   const {villagePathEdge}=await import('/src/data/village.ts');
   const grass=v.children.list.filter(o=>o.getData?.('village-tall-grass'));
   const grassSafe=grass.every(o=>{
    const b=o.getBounds();return [b.left,b.centerX,b.right].every(x=>[b.top,b.centerY,b.bottom].every(y=>!v.world.waterPointAt(x,y)&&villagePathEdge(x/32-.5,y/32-.5)>.2));
   });
   return {
    pier:v.children.list.filter(o=>o.getData?.('village-pier')).length,
    pierBounds:VILLAGE_PIER,
    fishing:v.children.list.filter(o=>o.getData?.('village-fishing-prop')).length,
    grass:grass.length,grassSafe,
    reeds:v.children.list.filter(o=>o.texture?.key==='forest-detail-reeds').length,
    barricades:barricades.length,bloody:barricades.filter(o=>o.getData('village-barricade-blood')).length,
    views:v.textures.get('village-barricades').getFrameNames().length,
    trees:VILLAGE_TREES.length,species:new Set(VILLAGE_TREES.map(t=>t.kind)).size,
    wheat:wheat.map(o=>({texture:o.texture.key,width:o.displayWidth,height:o.displayHeight})),
    routes:VILLAGE_BUILDINGS.map(b=>({id:b.id,length:villageRoute(VILLAGE_ENTRY,{x:b.x,y:b.y+2},v.world.isBlocked).length})),
   };
  });
  check('Píer e quatro enfeites de pesca carregados',art.pier===2&&art.fishing===4,art);
  check('Mais grama alta, sem nenhuma parte sobre caminhos ou água',art.grass>=150&&art.grassSafe,art);
  check('Barricadas em oito direções com variantes manchadas',art.barricades===18&&art.bloody===5&&art.views===16,art);
  check('Floresta densa de seis espécies e acesso às dez lojas',art.trees>=200&&art.species===6&&art.routes.every(r=>r.length>0),art);
  check('Trigos substituídos por canteiros verticais',art.wheat.length===2&&art.wheat.every(o=>o.texture==='village-wheat'&&o.height>o.width*1.8),art.wheat);

  await p.evaluate(()=>{v.player.x=2320;v.player.y=1456;v.player.update(0,v.blocked,v.blockedPoint,false);});
  const along=await move('d',100);
  check('Jogador percorre o píer com entrada seca e limite na ponta',along.x>art.pierBounds.x+art.pierBounds.width-30&&along.x<art.pierBounds.x+art.pierBounds.width&&!along.wet,along);
  const rope=await move('s',20);
  check('Corda frontal impede atravessar a lateral do píer',rope.y<1474&&!rope.wet,rope);
  await p.evaluate(()=>{v.player.y=1456;v.player.update(0,v.blocked,v.blockedPoint,false);});
  const back=await move('a',100);
  check('É possível voltar do píer à margem',back.x<2336&&!back.wet,back);

  await p.evaluate(()=>{v.player.x=1424;v.player.y=460;v.player.update(0,v.blocked,v.blockedPoint,false);});
  const gazebo=await move('w',30);
  await p.evaluate(()=>{v.world.update(12345,v.player);v.player.setVisible(true);v.cameras.main.removeBounds().stopFollow().setZoom(2.6).centerOn(1424,340);});
  await render();
  const roof=await p.evaluate(()=>v.children.list.find(o=>o.getData?.('village-gazebo-roof')).alpha);
  check('Jogador entra no coreto e o telhado permite vê-lo',gazebo.y<400&&gazebo.y>340&&roof===.3,gazebo);
  await p.screenshot({path:out+'/coreto-por-dentro.png'});
  await p.evaluate(()=>{v.player.x=1359;v.player.y=447;v.player.update(0,v.blocked,v.blockedPoint,false);});
  const pillar=await move('w',25);
  check('Pilares do coreto mantêm colisão',pillar.y>=414,pillar);

  const views=[
   ['vila-completa',1536,1152,.48],['pier-e-pesca',2450,1400,2],
   ['trigo-e-moinho',640,800,1.7],['marcenaria-e-armazem',1150,1350,1.3],
   ['transicao-casa-comunitaria',1810,510,2],['barricadas-norte',1490,250,1.4],
   ['barricadas-leste',2800,1280,1.35],
   ['entradas-quadradas',2480,1940,2],
   ['escala-armazem',1072,970,2],['moitas-entre-comercios',1750,1700,1.5],
  ];
  check('Lago sem juncos sobre a água',art.reeds===0,{reeds:art.reeds});
  views.push(['lago-sem-grama',2650,1530,1.5]);
  for(const [name,x,y,zoom] of views){
   await p.evaluate(({x,y,zoom})=>{v.player.setVisible(false);v.world.update(12346);v.cameras.main.removeBounds().stopFollow().setZoom(zoom).centerOn(x,y);},{x,y,zoom});
   await render();await p.screenshot({path:out+'/'+name+'.png'});
  }
  const save=await p.evaluate(async()=>{const {loadSave,validateSave}=await import('/src/systems/save.ts');v.persist();return validateSave(loadSave());});
  check('Save continua válido após caminhar nas novas estruturas',save);
  const gl=await p.evaluate(()=>game.renderer.gl?.getError()??0);
  check('Sem erros JavaScript, HTTP ou WebGL',errors.length===0&&gl===0,{errors,gl});
  console.log('PASS',checks.length,'checks');
 }catch(e){await p.screenshot({path:out+'/falha.png'});throw e;}
 finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
