const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.CITY_FOREST_QA_OUTPUT||'/workspace/after-rain-city-forest';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1200}}),checks=[],errors=[];page.setDefaultTimeout(120000);
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name+' '+JSON.stringify(details));};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5182');await page.locator('#new-game').click();await page.locator('#character-name').fill('Floresta norte');await page.getByRole('button',{name:'Começar minha história'}).click();
  await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const s=game.scene.getScene('Vale');s.enterVillage(s.snapshotState());});
  await page.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  await page.evaluate(()=>{const v=game.scene.getScene('Vila');v.player.x=50.5*32;v.player.y=110;v.player.update(0,v.blocked,v.blockedPoint,false);v.paused=false;});
  await page.keyboard.down('w');await page.waitForFunction(()=>game.scene.isActive('AcessoCidade')&&document.querySelector('#ui')?.dataset.area==='cityForest');await page.keyboard.up('w');
  check('Entrada norte da vila abre o cenário independente caminhando',true);
  const art=await page.evaluate(()=>{
   window.f=game.scene.getScene('AcessoCidade');game.loop.sleep();f.paused=false;f.cameras.main.resetFX();
   return{trees:f.world.trees.length,fences:f.children.list.filter(o=>o.getData?.('city-road-fence')!==undefined).length,sign:f.children.list.find(o=>o.getData?.('city-access-sign'))?.getData('city-access-sign'),fog:f.children.list.filter(o=>o.getData?.('city-forest-mist')).length,onlyForest:!game.scene.isActive('Vila')&&!game.scene.isActive('Floresta')};
  });
  check('Floresta densa, duas cercas, placa exata e neblina carregadas',art.trees>350&&art.fences>70&&art.sign==='↑ City'&&art.fog===1&&art.onlyForest,art);
  const walk=async(target)=>page.evaluate(async target=>{
   const {cityForestBlockedPoint}=await import('/src/data/city-forest.ts');
   const fits=(x,y)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!cityForestBlockedPoint(x+dx,y+dy));
   const start={x:f.player.x,y:f.player.y};
   // Recover a consistent 16px search lattice after walking across the scene seam.
   const sx=Math.round(start.x/16)*16,sy=Math.round(start.y/16)*16;
   if(Math.hypot(sx-start.x,sy-start.y)>12||!fits(sx,sy))throw Error('invalid navigation start');
   // The initial snap is within the dry arrival corridor; all route movement below uses Player.
   f.player.x=sx;f.player.y=sy;const queue=[{x:sx,y:sy}],previous=new Map([[sx+','+sy,null]]);let end;
   for(let i=0;i<queue.length;i++){
    const p=queue[i];if(Math.hypot(p.x-target.x,p.y-target.y)<17){end=p;break;}
    for(const [dx,dy]of[[16,0],[-16,0],[0,16],[0,-16]]){const q={x:p.x+dx,y:p.y+dy},key=q.x+','+q.y;if(!previous.has(key)&&fits(q.x,q.y)){previous.set(key,p);queue.push(q);}}
   }
   if(!end)throw Error('unreachable '+JSON.stringify(target));
   const path=[];for(let p=end;p;p=previous.get(p.x+','+p.y))path.push(p);path.reverse();let steps=0;
   for(const p of path.slice(1)){
    for(let safety=0;safety<12&&Math.hypot(p.x-f.player.x,p.y-f.player.y)>.05;safety++){
     const dx=p.x-f.player.x,dy=p.y-f.player.y,dist=Math.hypot(dx,dy);
     for(const key of ['W','A','S','D'])f.player.keys[key].isDown=false;
     f.player.keys[Math.abs(dx)>Math.abs(dy)?dx>0?'D':'A':dy>0?'S':'W'].isDown=true;
     const dt=Math.min(.05,dist/84);f.player.update(dt,()=>false,cityForestBlockedPoint);steps++;
    }
    if(Math.hypot(p.x-f.player.x,p.y-f.player.y)>.1)throw Error('player blocked '+JSON.stringify({p,x:f.player.x,y:f.player.y}));
   }
   for(const key of ['W','A','S','D'])f.player.keys[key].isDown=false;
   return{x:f.player.x,y:f.player.y,steps};
  },target);
  const primary=await walk({x:48*32,y:14*32});check('Percurso principal completo e primeira passagem atravessável',Math.hypot(primary.x-1536,primary.y-448)<20,primary);
  const city=await walk({x:22.5*32,y:2.5*32});check('Asfalto em L permite chegar ao acesso futuro',Math.hypot(city.x-720,city.y-80)<20,city);
  const future=await page.evaluate(()=>{f.player.update(0,()=>false,()=>false,false);return f.nearCity();});check('Acesso à cidade alcançável na estrada',future);
  const fence=await page.evaluate(async()=>{const {cityForestBlockedPoint}=await import('/src/data/city-forest.ts');f.player.x=36*32;f.player.y=14*32+25;f.player.keys.W.isDown=true;for(let i=0;i<30;i++)f.player.update(.05,()=>false,cityForestBlockedPoint);f.player.keys.W.isDown=false;const stopped=f.player.y>14*32;f.player.x=720;f.player.y=80;f.player.update(0,()=>false,cityForestBlockedPoint,false);return stopped;});check('Trecho intacto da cerca impede atravessar os fios',fence);
  const map=await page.evaluate(async()=>{const url=await f.captureMap();return url.startsWith('data:image/png')&&url.length>10000;});check('Mapa da região gera captura real',map);
  const saved=await page.evaluate(async()=>{const {loadSave,validateSave}=await import('/src/systems/save.ts');f.persist();const s=loadSave();return{valid:validateSave(s),area:s?.activeArea,x:s?.cityForestPosition?.x};});check('Save registra a nova área e posição',saved.valid&&saved.area==='cityForest'&&saved.x===720,saved);
  const views=[['mapa-completo',1536,1152,.49],['entrada-sul',1552,2040,1.6],['trilha-neblina',1400,1450,1.6],['estrada-em-L',1160,300,1.1],['cerca-e-passagem',1536,450,2],['placa-city',810,160,2]];
  for(const [name,x,y,zoom]of views){await page.evaluate(({x,y,zoom})=>{f.paused=true;f.player.setVisible(false);document.querySelector('#ui').style.display='none';f.cameras.main.removeBounds().stopFollow().setZoom(zoom).centerOn(x,y);f.world.update(30000);f.daylight.update(720);game.step(600000,0);game.step(600001,0);},{x,y,zoom});await page.screenshot({path:out+'/'+name+'.png'});}
  await page.reload();await page.locator('#continue-game').click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='cityForest');
  const resumed=await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.f=game.scene.getScene('AcessoCidade');game.loop.sleep();return{x:f.player.x,y:f.player.y,area:f.state.activeArea};});check('Continuar reabre a floresta no ponto salvo',resumed.area==='cityForest'&&Math.abs(resumed.x-720)<1&&Math.abs(resumed.y-80)<1,resumed);
  const secondary=await walk({x:76*32,y:16*32});check('Segunda passagem liga a estrada à floresta',secondary.steps>0,secondary);
  for(const target of [{x:71*32,y:27*32},{x:62*32,y:46*32},{x:28*32,y:56*32},{x:32*32,y:27*32}]){const p=await walk(target);check('Clareira explorável '+JSON.stringify(target),p.steps>0,p);}
  await walk({x:48.5*32,y:69.5*32});
  await page.evaluate(()=>{f.paused=false;game.loop.wake();});await page.keyboard.down('s');await page.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');await page.keyboard.up('s');
  const returned=await page.evaluate(()=>{const v=game.scene.getScene('Vila');return{x:v.player.x,y:v.player.y,merchants:v.villagers.length,fog:v.children.list.some(o=>o.getData?.('city-forest-mist'))};});check('Retorno à vila mantém os dez NPCs e não leva a neblina',Math.abs(returned.x-1616)<2&&returned.merchants===10&&!returned.fog,returned);
  check('Sem erros JavaScript ou assets ausentes',errors.length===0,errors);console.log('PASS',checks.length,'checks');
 }catch(e){await page.screenshot({path:out+'/falha.png'});throw e;}
 finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
