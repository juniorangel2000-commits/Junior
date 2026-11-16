/* Conferência da montaria no navegador (docs/construcoes/MONTARIA.md).
 * Uso: node scripts/qa-horse-riding.cjs <pasta das imagens> [farmer-female|farmer-male] [etapa]
 * Precisa do jogo em http://127.0.0.1:5190 (npx vite --host 127.0.0.1 --port 5190 --strictPort).
 * Confere: montar com V, as 8 direções andando (quadro do cavaleiro e patas animadas), galope
 * mais rápido, descer com V, não entrar em casa nem na água montado, continuar montado ao carregar
 * a partida e na Floresta. Sai com código 1 se algo falhar.
 * Cada etapa abre um navegador novo: o Chromium daqui (SwiftShader) trava depois de alguns
 * minutos de movimento na mesma página. Sem etapa, roda todas em sequência. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const [out='.',character='farmer-female',only]=process.argv.slice(2);
const DIRS={down:['s'],up:['w'],left:['a'],right:['d'],'down-left':['s','a'],'down-right':['s','d'],'up-left':['w','a'],'up-right':['w','d']};
const ORDER=['down','up','left','right','down-left','down-right','up-left','up-right'];
const STEPS=['montar',...ORDER.map(d=>`andar-${d}`),'galope','descer','casa','agua','carregar','floresta'];
const check=(name,ok,detail='')=>{console.log(`${ok?'OK  ':'FALHA'} ${name}${detail?' — '+detail:''}`);if(!ok)process.exitCode=1;};

if(!only){
 // Todas as etapas, cada uma em um processo e um navegador próprios.
 let failed=0;
 for(const step of STEPS){
  try{process.stdout.write(execFileSync(process.execPath,[__filename,out,character,step],{encoding:'utf8',timeout:300000}));}
  catch(e){failed++;process.stdout.write(e.stdout??'');console.log(`FALHA etapa ${step}: ${(e.stderr||e.message).split('\n')[0]}`);}
 }
 console.log(failed?`${failed} etapa(s) com falha`:`todas as ${STEPS.length} etapas OK`);process.exit(failed?1:0);
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await b.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();
 await page.locator(`[data-character="${character}"]`).click();
 await page.locator('#character-name').fill('Montaria');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});
 await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');});
 // Lugar aberto, longe de árvores e casas, com o cavalo domado ao lado.
 const spot=await page.evaluate(()=>{const big=v.children.list.filter(o=>o.visible&&o.depth>0&&o.depth<4000&&o.displayHeight>40&&o!==v.player.sprite);
  for(let ty=12;ty<60;ty++)for(let tx=8;tx<60;tx++){const x=tx*32,y=ty*32;if(!big.every(o=>Math.hypot(o.x-x,o.y-y)>200))continue;
   // Livre para andar 150 px em todas as direções, sem água.
   const free=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].every(([dx,dy])=>{for(let r=0;r<=150;r+=8){const px=x+dx*r,py=y+dy*r;if(v.movementBlockedPoint?.(px,py)||v.blockedPoint?.(px,py)||(v.swimmingPoint?.(px,py)??0)>0)return false;}return true;});
   if(free)return{x,y};}return{x:35*32,y:27*32};});
 await page.evaluate(spot=>{const s=v.snapshotState();s.time=11*60;s.recruitedAnimals=['field-horse-1'];s.horseTaming={version:1,trust:7,tamed:true,name:'Trovão',lastFedDay:s.day};
  s.animalPositions={forest:[],property:[{id:'field-horse-1',x:spot.x+24,y:spot.y,direction:'down'}]};s.player={x:spot.x,y:spot.y,direction:'right'};v.loadState(s);},spot);
 await page.waitForTimeout(1500);
 const state=()=>page.evaluate(()=>{const p=v.player,m=p.mount;return{mounted:p.mounted,visible:p.sprite.visible,riding:v.snapshotState().riding===true,x:p.x,y:p.y,
  rider:m?.rider?.texture.key,riderFrame:m?.rider?Number(m.rider.frame.name):null,horseFrame:m?Number(m.horse.frame.name):null,horseVisible:v.animals.animals.find(a=>a.id==='field-horse-1')?.sprite.visible};});
 const mount=async()=>{await page.evaluate(()=>{const h=v.animals.animals.find(a=>a.id==='field-horse-1');v.player.x=h.x-16;v.player.y=h.y;});await page.keyboard.press('v');await page.waitForTimeout(1200);};
 const shot=async name=>{await page.evaluate(()=>{v.cameras.main.stopFollow();v.cameras.main.centerOn(v.player.x,v.player.y-25);});await page.waitForTimeout(60);
  await page.screenshot({path:`${out}/${character}-${name}.png`,clip:{x:580,y:320,width:120,height:130}});};
 await page.evaluate(()=>{document.querySelector('#ui').style.visibility='hidden';});
 await mount();let st=await state();

 if(only==='montar'){
  check('monta com V perto do cavalo',st.mounted&&st.riding,JSON.stringify({mounted:st.mounted,riding:st.riding}));
  check('usa a arte montada do personagem',st.rider===`horse-rider-${character}`,String(st.rider));
  check('esconde o personagem a pé e o cavalo do pasto',!st.visible&&st.horseVisible===false);
 }
 if(only.startsWith('andar-')){
  const dir=only.slice(6),keys=DIRS[dir];
  await page.evaluate(spot=>{v.player.x=spot.x;v.player.y=spot.y;},spot);await page.waitForTimeout(100);
  const before=await state(),frames=new Set();
  for(const k of keys)await page.keyboard.down(k);
  for(let i=0;i<6;i++){await page.waitForTimeout(80);frames.add((await state()).horseFrame);}
  const after=await state();await shot(dir);for(const k of keys)await page.keyboard.up(k);
  const moved=Math.hypot(after.x-before.x,after.y-before.y);
  check(`anda para ${dir}`,moved>20&&after.riderFrame===ORDER.indexOf(dir)&&frames.size>=3,`andou ${moved.toFixed(0)} px, quadro ${after.riderFrame}, ${frames.size} quadros do cavalo`);
 }
 if(only==='galope'){
  // Velocidade pelo tempo do jogo (quadros com dt limitado a 0,1 s), não pelo relógio: aqui os
  // quadros demoram de forma irregular.
  await page.evaluate(()=>{window.__dt=0;v.events.on('postupdate',(_t,d)=>{window.__dt+=Math.min(d,100);});});
  const run=async shift=>{await page.evaluate(spot=>{v.player.x=spot.x-150;v.player.y=spot.y;},spot);await page.waitForTimeout(100);
   if(shift)await page.keyboard.down('Shift');await page.keyboard.down('d');await page.waitForTimeout(60);
   const a=await page.evaluate(()=>({x:v.player.x,t:window.__dt}));await page.waitForTimeout(600);const z=await page.evaluate(()=>({x:v.player.x,t:window.__dt}));
   if(shift)await shot('galope');await page.keyboard.up('d');if(shift)await page.keyboard.up('Shift');return (z.x-a.x)/Math.max(1,z.t-a.t)*1000;};
  const walk=await run(false),gallop=await run(true);
  check('Shift galopa mais rápido',gallop>walk*1.15,`passo ${walk.toFixed(0)} px/s, galope ${gallop.toFixed(0)} px/s`);
 }
 if(only==='descer'){
  await page.keyboard.press('v');await page.waitForTimeout(600);st=await state();
  check('desce com V e o cavalo volta ao pasto',!st.mounted&&!st.riding&&st.visible&&st.horseVisible===true);
 }
 if(only==='casa'){
  // Montado, a porta não abre: avisa para descer.
  await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';v.changeHomeScene(true);});await page.waitForTimeout(900);
  st=await state();const inHome=await page.evaluate(()=>v.inHome);const msg=await page.evaluate(()=>document.body.innerText.includes('Desça do cavalo (V) para entrar.'));
  check('montado, não entra em casa e recebe o aviso',!inHome&&st.mounted&&st.riding&&msg,JSON.stringify({inHome,mounted:st.mounted,msg}));
  await page.keyboard.press('v');await page.waitForTimeout(600);
  await page.evaluate(()=>v.changeHomeScene(true));await page.waitForTimeout(900);
  check('a pé, entra em casa',await page.evaluate(()=>v.inHome));
 }
 if(only==='agua'){
  // Água logo à direita de um ponto seco: montado, o cavalo para na margem.
  const shore=await page.evaluate(()=>{for(let y=200;y<60*32;y+=16)for(let x=200;x<60*32;x+=16){if(v.swimmingPoint(x,y)>0||v.movementBlockedPoint?.(x,y))continue;
   let ok=true;for(let r=0;r<=40;r+=8)if(v.swimmingPoint(x+r,y)>0||v.movementBlockedPoint?.(x+r,y))ok=false;if(ok&&v.swimmingPoint(x+70,y)>0.3)return{x,y};}return null;});
  if(!shore)check('achou uma margem para o teste',false);else{
   await page.evaluate(p=>{v.player.x=p.x;v.player.y=p.y;},shore);await page.waitForTimeout(150);
   await page.keyboard.down('d');await page.waitForTimeout(1500);await page.keyboard.up('d');
   const r=await page.evaluate(()=>({depth:v.swimmingPoint(v.player.x,v.player.y),x:v.player.x,mounted:v.player.mounted}));
   check('montado, o cavalo não entra na água',r.depth<=0.005&&r.mounted&&r.x>shore.x+20,JSON.stringify({...r,start:shore.x}));
   await shot('margem');
  }
 }
 if(only==='carregar'){
  await page.evaluate(()=>{v.persist();v.loadState(v.snapshotState());});await page.waitForTimeout(1500);st=await state();
  check('continua montado ao carregar a partida',st.mounted&&st.riding&&st.rider===`horse-rider-${character}`&&!st.visible);
 }
 if(only==='floresta'){
  await page.evaluate(()=>v.enterForest());
  await page.waitForFunction(()=>game.scene.getScene('Floresta')?.sys.isActive()&&game.scene.getScene('Floresta').player,{timeout:60000}).catch(()=>{});
  await page.waitForTimeout(2500);
  const f=await page.evaluate(()=>{const f=game.scene.getScene('Floresta');const p=f?.player;return{active:!!f?.sys.isActive(),mounted:!!p?.mounted,rider:p?.mount?.rider?.texture.key,visible:p?.sprite.visible};});
  check('na Floresta continua montado',f.active&&f.mounted&&f.rider===`horse-rider-${character}`&&!f.visible,JSON.stringify(f));
  await page.evaluate(()=>{const f=game.scene.getScene('Floresta');f.cameras.main.stopFollow();f.cameras.main.centerOn(f.player.x,f.player.y-25);});await page.waitForTimeout(200);
  await page.screenshot({path:`${out}/${character}-floresta.png`,clip:{x:580,y:320,width:120,height:130}});
 }
 check(`sem erros na página (${only})`,errors.length===0,errors.slice(0,3).join(' | '));
 await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
