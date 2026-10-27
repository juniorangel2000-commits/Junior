const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='/workspace/after-rain-merchant-effects';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),checks=[],errors=[];
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name+' '+JSON.stringify(details));};
 try{
  const p=await browser.newPage({viewport:{width:1440,height:940}});p.setDefaultTimeout(120000);
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:5177');await p.locator('#new-game').click();await p.locator('#character-name').fill('Animações');await p.getByRole('button',{name:'Começar minha história'}).click();
  await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.vale=game.scene.getScene('Vale');vale.enterVillage(vale.snapshotState());});
  await p.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  await p.evaluate(()=>{window.v=game.scene.getScene('Vila');game.loop.sleep();window.qt=50000;window.render=()=>{v.events.emit('update',qt,40);v.daylight.update(v.state.time,true);game.step(qt+=40,0);};v.cameras.main.resetFX();v.state.time=540;});
  for(const id of ['augusto','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro']){
   const result=await p.evaluate(id=>{
    v.setMerchantRoom(id);render();const layout=JSON.stringify(v.merchantLayouts.get(id)),effects=v.children.list.filter(o=>o.getData('interior-effect'));
    const before=effects.map(o=>JSON.stringify(o.commandBuffer));for(let i=0;i<8;i++)render();
    return{count:effects.length,changed:effects.every((o,i)=>JSON.stringify(o.commandBuffer)!==before[i]),clipped:effects.every(o=>!!o.mask),unchanged:JSON.stringify(v.merchantLayouts.get(id))===layout,kinds:effects.map(o=>o.getData('interior-effect')),lights:v.children.list.filter(o=>o.getData('fixture-light')&&o.getData('smithLayoutId')).length};
   },id);
   check(id+': chamas animadas e recortadas, iluminação ativa e layout intacto',result.count>0&&result.changed&&result.clipped&&result.unchanged&&result.lights===result.kinds.filter(x=>x==='lamp').length&&result.kinds.every(x=>x==='lamp'||id==='amelia'&&(x==='water'||x==='steam')),result);
  }
  const editor=await p.evaluate(async()=>{
   v.setMerchantRoom('tobias');const layout=v.merchantLayouts.get('tobias'),lamp=layout.pieces.find(p=>p.asset==='tobias-lantern'),sprite=v.merchantView.objects.find(o=>o.getData('smithLayoutId')===lamp.id);
   v.merchantView.editing(true,()=>{},()=>{});v.input.emit('drag',{},sprite,sprite.x+32,sprite.y+12);render();
   const source=sprite.getData('fixture-light'),effect=v.children.list.find(o=>o.getData('interior-effect-owner')===lamp.id),mask=effect.mask.geometryMask;
   const commands=mask.commandBuffer; // ellipse geometry updates from the actual dragged sprite
   const moved={x:sprite.x,y:sprite.y,lightX:sprite.x+source.offsetX,lightY:sprite.y+source.offsetY,commands:Array.from(commands)};
   v.merchantView.editing(false);v.setMerchantRoom('tobias');return{...moved,expectedX:lamp.x+32,expectedY:lamp.y+12};
  });check('A chama e sua máscara acompanham a lanterna durante o arraste no editor',editor.x===editor.expectedX&&editor.y===editor.expectedY&&editor.commands.includes(editor.lightX)&&editor.commands.includes(editor.lightY),editor);
  const options=await p.evaluate(()=>{
   v.setMerchantRoom('tobias');const layout=v.merchantLayouts.get('tobias'),lamps=layout.pieces.filter(p=>p.asset==='tobias-lantern'),before=structuredClone(layout);
   lamps[0].effects=false;lamps[1].parent='tobias-counter';layout.pieces.find(p=>p.id==='tobias-counter').visible=false;
   v.setMerchantRoom('tobias');render();const result={effects:v.children.list.filter(o=>o.getData('interior-effect')).length,lights:v.children.list.filter(o=>o.getData('fixture-light')&&o.getData('smithLayoutId')).length};
   v.merchantLayouts.set('tobias',before);v.setMerchantRoom('tobias');return result;
  });check('Opção de efeitos desligados e pai oculto desativam chama e luz',options.effects===0&&options.lights===0,options);
  const shaders=await p.evaluate(async()=>{
   const {setVisualSettings}=await import('/src/visual-settings.ts');setVisualSettings({dynamicLighting:false});render();
   const result={flames:v.children.list.filter(o=>o.getData('interior-effect')&&o.visible).length,glows:v.children.list.filter(o=>o.getData('fixture-glow')&&o.visible).length};
   setVisualSettings({dynamicLighting:true});render();return result;
  });check('Animação da chama funciona com iluminação dinâmica desligada',shaders.flames===2&&shaders.glows===0,shaders);
  const cleanup=await p.evaluate(async()=>{
   v.setMerchantRoom(undefined);v.daylight.update(540);const before={updates:v.events.listenerCount('update'),shutdowns:v.events.listenerCount('shutdown'),children:v.children.length};
   for(let i=0;i<30;i++){v.setMerchantRoom(i%2?'rosa':'tobias');render();v.setMerchantRoom(undefined);v.daylight.update(540);await new Promise(resolve=>requestAnimationFrame(resolve));}
   return{before,after:{updates:v.events.listenerCount('update'),shutdowns:v.events.listenerCount('shutdown'),children:v.children.length},remaining:v.children.list.filter(o=>o.getData('interior-effect')).length};
  });check('Trinta entradas e saídas não acumulam objetos, máscaras ou listeners',JSON.stringify(cleanup.before)===JSON.stringify(cleanup.after)&&cleanup.remaining===0,cleanup);
  const smith=await p.evaluate(()=>{
   v.setBlacksmithRoom(true);render();const effects=v.children.list.filter(o=>o.getData('interior-effect')),water=effects.find(o=>o.getData('interior-effect')==='water'),before=JSON.stringify(water?.commandBuffer);for(let i=0;i<8;i++)render();
   const result={kinds:[...new Set(effects.map(o=>o.getData('interior-effect')))],waterChanged:JSON.stringify(water?.commandBuffer)!==before};v.setBlacksmithRoom(false);return result;
  });check('Ferraria mantém animações da fornalha, das lanternas e da água',smith.kinds.length===3&&smith.waterChanged,smith);
  const save=await p.evaluate(async()=>{v.setMerchantRoom('tobias');v.persist();const s=(await import('/src/systems/save.ts')).loadSave();return{layout:JSON.stringify(s.merchantScenes.tobias)===JSON.stringify(v.merchantLayouts.get('tobias')),effectsSaved:s.merchantScenes.tobias.pieces.some(p=>'interior-effect'in p)};});
  check('Save preserva o layout sem gravar objetos temporários de animação',save.layout&&!save.effectsSaved,save);
  for(const id of ['augusto','rosa','tobias']){
   await p.evaluate(id=>{v.setMerchantRoom(id);v.player.x=288;v.player.y=270;v.player.update(0,v.blocked,v.blockedPoint,false);v.updateHUD();v.applyCamera();render();},id);
   await p.screenshot({path:out+'/'+id+'.png'});
  }
  await p.evaluate(()=>{v.setMerchantRoom('tobias');const lamp=v.merchantLayouts.get('tobias').pieces.find(p=>p.asset==='tobias-lantern');v.paused=true;v.cameras.main.stopFollow().setZoom(6).centerOn(lamp.x,lamp.y-12);render();});
  for(let i=0;i<16;i++){await p.evaluate(()=>{render();render();});await p.screenshot({path:out+'/frame-'+String(i).padStart(2,'0')+'.png',clip:{x:500,y:250,width:440,height:440}});}
  const gl=await p.evaluate(()=>game.renderer.gl?.getError()??0);check('Sem erros WebGL, JavaScript ou arquivos ausentes',gl===0&&errors.length===0,{gl,errors});
 }finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
 console.log(JSON.stringify({checks:checks.length,passed:checks.every(c=>c.passed),errors}));
})().catch(e=>{console.error(e);process.exit(1);});
