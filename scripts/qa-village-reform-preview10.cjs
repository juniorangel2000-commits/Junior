const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.REFORM_QA_OUTPUT||'/workspace/after-rain-village-reform-preview10';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 ]});
 const checks=[],errors=[];
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name+' '+JSON.stringify(details));};
 const p=await browser.newPage({viewport:{width:1600,height:1200}});p.setDefaultTimeout(120000);
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 try{
  await p.goto(process.env.QA_URL||'http://127.0.0.1:5182');
  await p.locator('#new-game').click();await p.locator('#character-name').fill('Vila harmonizada');
  await p.getByRole('button',{name:'Começar minha história'}).click();
  await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
   const s=game.scene.getScene('Vale');s.enterVillage(s.snapshotState());
  });
  await p.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  const layout=await p.evaluate(async()=>{
   window.v=game.scene.getScene('Vila');game.loop.sleep();v.cameras.main.resetFX();
   const d=await import('/src/data/village.ts');
   const {VILLAGE_LANDMARKS}=await import('/src/data/village-landmarks.ts');
   const {villageTallGrassPositions}=await import('/src/village-greenery.ts');
   const {villageRoute}=await import('/src/systems/village-walk.ts');
   const grass=villageTallGrassPositions();
   const flooded=[];
   for(const b of d.VILLAGE_BUILDINGS)for(let y=b.y-5;y<=b.y+1;y+=.25)for(let x=b.x-7;x<=b.x+7;x+=.25){
    const solid=d.villageBuildingAt(Math.floor(x),Math.floor(y));
    if(solid?.id===b.id&&d.villageLakeDistance(x,y)<0)flooded.push({id:b.id,x,y});
   }
   const props=d.VILLAGE_PROPS;
   return {
    grass:grass.length,grassClear:grass.every(g=>d.villagePathEdge(g.x,g.y)>=.85&&d.villageLakeDistance(g.x,g.y)>=1),
    drawnGrass:v.children.list.filter(o=>o.getData?.('village-tall-grass')).length,
    bins:props.filter(p=>p.kind==='bin').length,
    pots:props.filter(p=>p.kind==='flowerpot'||p.kind==='planter').length,
    benches:props.filter(p=>p.kind==='bench').map(p=>({...p,roadDistance:d.villagePathEdge(p.x,p.y),lakeDistance:d.villageLakeDistance(p.x,p.y)})),
    flooded:flooded.slice(0,10),
    routes:d.VILLAGE_BUILDINGS.map(b=>({id:b.id,length:villageRoute(d.VILLAGE_ENTRY,{x:b.x,y:b.y+2},v.world.isBlocked).length})),
    cottages:VILLAGE_LANDMARKS.filter(p=>p.kind==='cottage').map(p=>({id:p.id,road:d.villagePathEdge(p.x,p.y),lake:d.villageLakeDistance(p.x,p.y)})),
   };
  });
  check('Grama alta em grupos, sem invadir caminhos ou água',layout.grass>=30&&layout.grassClear&&layout.drawnGrass===layout.grass,layout);
  check('Lixeiras presentes e vasos externos retirados',layout.bins===6&&layout.pots===0,layout);
  check('Bancos orientados, fora das vias e do lago',layout.benches.every(b=>b.facing&&b.roadDistance>.25&&b.lakeDistance>0),layout.benches);
  check('Casas e comércios com bases fora do lago',layout.flooded.length===0&&layout.cottages.every(c=>c.lake>0&&c.road>.1),layout);
  check('Todos os dez comércios continuam acessíveis',layout.routes.length===10&&layout.routes.every(r=>r.length>0),layout.routes);
  const views=[
   ['vila-completa',1536,1152,.48],['praca-e-caminhos',1488,1200,1],
   ['margem-e-pescador',2380,1420,1.65],['grama-e-descanso',1680,1580,1.8],
   ['bairro-sul',2180,1880,1.5],['bairro-norte',2020,900,1.4],
  ];
  for(const [name,x,y,zoom] of views){
   await p.evaluate(({x,y,zoom})=>{
    v.paused=true;v.state.time=720;v.daylight.update(720);v.world.updateLighting(720);
    v.player.setVisible(false);document.querySelector('#ui').style.display='none';
    v.cameras.main.removeBounds().stopFollow().setZoom(zoom).centerOn(x,y);game.step(500000,0);game.step(500001,0);
   },{x,y,zoom});
   await p.screenshot({path:out+'/'+name+'.png'});
  }
  const gl=await p.evaluate(()=>game.renderer.gl?.getError()??0);
  check('Sem erros de JavaScript, arquivos ou WebGL',errors.length===0&&gl===0,{errors,gl});
  console.log('PASS',checks.length,'checks');
 }catch(e){await p.screenshot({path:out+'/falha.png'});throw e;}
 finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
