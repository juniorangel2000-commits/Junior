const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='/workspace/after-rain-amelia';
(async()=>{
 const checks=[],errors=[],browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name+' '+JSON.stringify(details));};
 try{
  const p=await browser.newPage({viewport:{width:1440,height:940}});p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:5177');await p.locator('#new-game').click();await p.locator('#character-name').fill('Amélia');await p.getByRole('button',{name:'Começar minha história'}).click();await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.vale=game.scene.getScene('Vale');vale.enterVillage(vale.snapshotState());});
  await p.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  const atlas=await p.evaluate(()=>{
   window.v=game.scene.getScene('Vila');game.loop.sleep();v.cameras.main.resetFX();v.state.time=540;window.amelia=v.villagers.find(n=>n.data.id==='amelia');
   const s=amelia.sprite,t=s.texture,canvas=t.getSourceImage(),a=canvas.getContext('2d').getImageData(0,0,canvas.width,256).data,tops=[],feet=[];
   for(let f=0;f<9;f++){let top=256,foot=-1;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(a[(y*canvas.width+f*256+x)*4+3]>=160){top=Math.min(top,y);foot=Math.max(foot,y);}tops.push(top);feet.push(foot);}
   return{frames:amelia.frames,width:canvas.width,height:canvas.height,frameTotal:t.frameTotal,displayHeight:s.displayHeight,originY:s.originY,tops,feet,distinct:new Set(Array.from({length:8},(_,f)=>v.textures.getBase64(t.key,f+1))).size,sourcesLeft:v.textures.getTextureKeys().filter(k=>k.startsWith('amelia-original:')||k==='amelia-south-refinado')};
  });
  check('Amélia usa oito direções e oito quadros de caminhada, mais a pose parada',atlas.frames===8&&atlas.width===2304&&atlas.height===2048&&atlas.frameTotal===73&&atlas.distinct===8,atlas);
  check('Frente mantém escala e linha de apoio consistentes, com a oscilação dos passos',atlas.displayHeight===64&&atlas.originY===244/256&&Math.max(...atlas.tops)-Math.min(...atlas.tops)<=4&&Math.max(...atlas.feet)-Math.min(...atlas.feet)<=6,atlas);
  check('Texturas intermediárias são descartadas após montar o atlas',atlas.sourcesLeft.length===0,atlas.sourcesLeft);
  const preserved=await p.evaluate(async()=>{
   const names=['west','east','north','south-west','south-east','north-west','north-east'],source=amelia.sprite.texture.getSourceImage(),actual=source.getContext('2d').getImageData(0,256,2304,1792).data,expected=document.createElement('canvas');expected.width=2304;expected.height=1792;const c=expected.getContext('2d');c.imageSmoothingEnabled=false;
   for(let row=0;row<names.length;row++)for(let f=0;f<9;f++){const im=new Image();im.src='assets/visual/village/amelia/Idle/'+(f?'animations/Walking/'+names[row]+'/frame_'+String(f-1).padStart(3,'0')+'.png':'rotations/'+names[row]+'.png');await im.decode();c.drawImage(im,f*256+(256-im.width)/2,row*256);}
   const e=c.getImageData(0,0,2304,1792).data;let different=0;for(let i=0;i<e.length;i++)if(e[i]!==actual[i])different++;return{different,poses:63};
  });check('As outras 63 poses permanecem pixel a pixel iguais às enviadas',preserved.different===0,preserved);
  const guide=await p.evaluate(async()=>{
   const {MerchantGuide,merchantOutside}=await import('/src/systems/merchant-visit.ts'),door=merchantOutside('amelia');
   const candidates=[];for(let y=door.y-192;y<=door.y+192;y+=32)for(let x=door.x-192;x<=door.x+192;x+=32)if(Math.hypot(x-door.x,y-door.y)>150&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!v.world.isBlockedPoint(x+dx,y+dy))&&MerchantGuide.canStart('amelia',{x,y},(tx,ty)=>v.world.isBlocked(tx,ty)))candidates.push({x,y});
   if(candidates[0])amelia.sprite.setPosition(candidates[0].x,candidates[0].y);v.residents.get('amelia').shop=false;amelia.sprite.setVisible(true);v.routines.get('amelia')?.guided(v.state,amelia.sprite,false);
   v.player.x=amelia.sprite.x;v.player.y=amelia.sprite.y+50;v.player.update(0,v.blocked,v.blockedPoint,false);v.beginGuide('amelia');const active=v.guide?.owner==='amelia',seen=new Set();let stoppedForPlayer=false;
   for(let i=0;i<1100&&v.guide&&!v.guide.waiting;i++){v.player.x=amelia.sprite.x;v.player.y=amelia.sprite.y+50;v.update(50000+i*100,100);const phase=Number(amelia.sprite.frame.name)%9;if(phase)seen.add(phase);}
   const arrived=!!v.guide?.waiting;
   if(v.guide){v.guide.waiting=false;const step=v.guide.step(.1,amelia.sprite,{x:amelia.sprite.x+300,y:amelia.sprite.y});stoppedForPlayer=step.waitingForPlayer&&!step.moving;}
   v.guide=undefined;return{active,arrived,seen:[...seen].sort(),stoppedForPlayer};
  });check('Condução até a loja utiliza os oito quadros e espera o jogador',guide.active&&guide.arrived&&guide.stoppedForPlayer&&guide.seen.length===8,guide);
  const frames=await p.evaluate(()=>Array.from({length:9},(_,f)=>v.textures.getBase64('village-npc-amelia',f)));
  for(let i=0;i<frames.length;i++)fs.writeFileSync(out+'/south-'+i+'.png',Buffer.from(frames[i].split(',')[1],'base64'));
  const portrait=await p.evaluate(()=>{v.setMerchantRoom('amelia');v.completeGuide('amelia');v.residents.get('amelia').shop=true;Object.assign(v.residents.get('amelia'),{x:288,y:151,direction:'down'});amelia.sprite.setPosition(288,151).setFrame(0).setVisible(true);v.routines.get('amelia')?.guided(v.state,{x:288,y:151},true);v.player.x=288;v.player.y=220;v.player.update(0,v.blocked,v.blockedPoint,false);v.interact();return{trade:v.canTrade('amelia'),portrait:v.shop.callbacks.getPortrait('amelia').startsWith('data:image/png;base64,')};});
  check('Retrato e comércio continuam funcionando com o novo atlas',portrait.trade&&portrait.portrait&&await p.locator('[data-village-tab=buy]').isVisible(),portrait);await p.locator('[data-village-close]').click();
  const interior=await p.evaluate(()=>{const layout=v.merchantLayouts.get('amelia');v.applyCamera();v.updateHUD();game.step(150000,0);return{pieces:layout.pieces.length,wood:layout.pieces.find(p=>p.id==='floor').asset,shade:layout.pieces.find(p=>p.id==='structure').wallShade,objects:v.merchantView.objects.filter(o=>o.getData('smithLayoutId')).length,effects:v.children.list.filter(o=>o.getData('interior-effect')).map(o=>o.getData('interior-effect'))};});
  check('Herbalista possui vinte peças editáveis, parede escura, madeira e efeitos de luz, água e vapor',interior.pieces===20&&interior.objects===20&&interior.wood==='floor-wood'&&interior.shade===1&&new Set(interior.effects).size===3,interior);await p.screenshot({path:out+'/herbalista-interior.png'});
  await p.keyboard.press('h');await p.evaluate(()=>game.step(150001,0));check('H abre o editor de desenvolvimento da herbalista',await p.locator('.smith-editor h2').innerText()==='Editar herbalista da Amélia');
  await p.locator('[data-pieces]').selectOption('amelia-rug');await p.locator('[data-x]').fill('292');await p.locator('[data-apply]').click();check('Editor move objetos e conserva a circulação',await p.evaluate(()=>v.merchantLayouts.get('amelia').pieces.find(p=>p.id==='amelia-rug').x===292));
  const download=p.waitForEvent('download');await p.locator('[data-export]').click();const file=await download;check('Editor exporta JSON próprio da herbalista',file.suggestedFilename()==='After-Rain-Herbalista-Editada.json');await file.saveAs(out+'/After-Rain-Herbalista-Editada.json');await p.locator('[data-close]').click();
  const save=await p.evaluate(async()=>{v.persist();const s=(await import('/src/systems/save.ts')).loadSave();return{owner:s.merchantInterior.owner,resident:s.shopResidents.find(p=>p.id==='amelia')};});check('Save mantém Amélia no interior correto',save.owner==='amelia'&&save.resident.shop,save);
  const facade=await p.evaluate(()=>{v.setMerchantRoom(undefined);v.world.trees.forEach(t=>t.setVisible(false));v.paused=true;v.cameras.main.removeBounds().stopFollow().setZoom(3).centerOn(770,627);game.step(160000,0);game.step(160001,0);const house=v.children.list.find(o=>o.getData('village-building')==='ervas');return{texture:house.texture.key,width:house.displayWidth,duplicate:v.children.list.some(o=>o.texture?.key==='village-shop-herbalist')};});
  check('Fachada própria substitui a casa genérica e tem escala compatível',facade.texture==='village-amelia-shop'&&!facade.duplicate&&facade.width<400,facade);await p.screenshot({path:out+'/herbalista-fachada.png'});
  const night=await p.evaluate(()=>{v.state.time=1320;v.world.updateLighting(1320);v.daylight.update(1320);game.step(160002,0);return v.children.list.filter(o=>o.texture?.key==='village-amelia-shop-windows').map(o=>({visible:o.visible,alpha:o.alpha}));});check('Janelas e estufa recebem iluminação à noite',night.some(o=>o.visible&&o.alpha>0),night);
  const passage=await p.evaluate(async()=>{
   const {merchantDoor,merchantOutside}=await import('/src/systems/merchant-visit.ts');v.state.time=540;v.paused=false;v.changingRoom=false;v.cameras.main.resetFX();const d=merchantDoor('amelia'),outside=merchantOutside('amelia');v.player.x=outside.x;v.player.y=outside.y+5;v.player.update(0,v.blocked,v.blockedPoint,false);v.applyCamera();
   for(let i=0;i<100&&!v.merchantRoom;i++){v.player.keys.W.isDown=true;game.step(170000+i*16,16);}v.player.keys.W.isDown=false;const entered=v.merchantRoom==='amelia';
   if(entered){v.player.x=288;v.player.y=340;v.player.update(0,v.blocked,v.blockedPoint,false);for(let i=0;i<100&&v.merchantRoom;i++){v.player.keys.S.isDown=true;game.step(180000+i*16,16);}v.player.keys.S.isDown=false;}
   return{entered,exited:!v.merchantRoom,x:v.player.x,y:v.player.y,door:d};
  });check('Entrada e saída pela porta funcionam caminhando sem apertar E',passage.entered&&passage.exited,passage);
  const routine=await p.evaluate(()=>{v.player.x=1000;v.player.y=1700;v.state.time=540;for(let i=0;i<600;i++)v.updateDailyRoutines(.1);const r=v.routines.get('amelia'),morning=r.isServing(v.state)&&r.state.area==='shop';v.state.time=735;for(let i=0;i<3500;i++)v.updateDailyRoutines(.1);const lunch=r.state.area==='village'&&Math.hypot(r.state.x-1392,r.state.y-1328)<40;v.state.time=900;for(let i=0;i<3500;i++)v.updateDailyRoutines(.1);const returned=r.state.area==='shop'&&r.isServing(v.state);v.state.time=1080;return{morning,lunch,returned,closed:!r.isServing(v.state),routines:v.routines.size};});
  check('Rotina da Amélia abre, sai para a praça, retorna e encerra às 18h',routine.morning&&routine.lunch&&routine.returned&&routine.closed&&routine.routines===5,routine);
  await p.evaluate(()=>{if(v.merchantRoom)v.setMerchantRoom(undefined);v.state.time=540;v.residents.get('amelia').shop=false;amelia.sprite.setVisible(true).setPosition(1296,1392).setFrame(0);v.player.x=1360;v.player.y=1440;v.player.update(0,v.blocked,v.blockedPoint,false);v.world.trees.forEach(t=>t.setVisible(false));v.paused=true;v.cameras.main.removeBounds().stopFollow().setZoom(3).centerOn(1296,1370);game.step(200000,0);game.step(200001,0);});await p.screenshot({path:out+'/amelia-no-jogo.png'});
  const glError=await p.evaluate(()=>game.renderer.gl?.getError()??0);check('Sem erros WebGL, JavaScript ou arquivos ausentes',glError===0&&errors.length===0,{glError,errors});
 }finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
 console.log(JSON.stringify({checks:checks.length,passed:checks.every(c=>c.passed),errors}));
})().catch(e=>{console.error(e);process.exit(1);});
