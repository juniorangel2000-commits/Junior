const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const out=process.env.SOCIAL_QA_OUTPUT||'/workspace/after-rain-social-preview10';
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 ]});
 const checks=[],errors=[];
 const check=(name,passed,details)=>{
  checks.push({name,passed:!!passed,details});
  assert.ok(passed,name+' '+JSON.stringify(details));
 };
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.setDefaultTimeout(120000);
 p.on('pageerror',e=>errors.push(e.message));
 p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try{
  await p.goto(process.env.QA_URL||'http://127.0.0.1:5182');
  await p.locator('#new-game').click();
  await p.locator('#character-name').fill('Encontros da vila');
  await p.getByRole('button',{name:'Começar minha história'}).click();
  await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await p.evaluate(async()=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
   const vale=game.scene.getScene('Vale');vale.enterVillage(vale.snapshotState());
  });
  await p.waitForFunction(()=>game.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  await p.evaluate(()=>{
   window.v=game.scene.getScene('Vila');game.loop.sleep();v.cameras.main.resetFX();
   v.player.x=80;v.player.y=1680;v.player.update(0,v.blocked,v.blockedPoint,false);
   v.state.day=3;v.state.time=700;
   for(let i=0;i<1000;i++)v.updateDailyRoutines(.1);
   v.state.time=710;
   window.socialSeen={};window.socialMotion=[];window.socialCollisions=[];window.plazaPeak=0;
  });
  let captured=false;
  for(let chunk=0;chunk<25;chunk++){
   const snap=await p.evaluate(async()=>{
    const {villagePlazaDistance}=await import('/src/data/village.ts');
    const {GAME_MINUTES_PER_SECOND}=await import('/src/systems/clock.ts');
    for(let i=0;i<100;i++){
     const before=new Map([...v.routines].map(([id,r])=>[id,{x:r.state.x,y:r.state.y}]));
     v.updateDailyRoutines(.1);
     const pair=v.conversations.participants;
     if(v.speech){
      const key=[...pair].sort().join('+');socialSeen[key]??=[];
      if(!socialSeen[key].includes(v.speech.id))socialSeen[key].push(v.speech.id);
      for(const id of pair){
       const r=v.routines.get(id),s=r.state,b=before.get(id);
       if(r.isMoving||s.x!==b.x||s.y!==b.y)socialMotion.push({id,time:v.state.time});
      }
     }
     const count=[...v.routines.values()].filter(r=>r.state.area==='village'&&villagePlazaDistance(r.state.x/32-.5,r.state.y/32-.5)<1.12).length;
     plazaPeak=Math.max(plazaPeak,count);
     if(i%10===0)for(const [id,r] of v.routines){
      const s=r.state;
      if(s.area==='village'&&[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>v.world.isBlockedPoint(s.x+dx,s.y+dy)))socialCollisions.push({id,time:v.state.time,x:s.x,y:s.y});
     }
     v.state.time+=.1*GAME_MINUTES_PER_SECOND;
    }
    return {time:v.state.time,speech:v.speech,seen:socialSeen,peak:plazaPeak};
   });
   if(chunk%5===0)console.log(JSON.stringify(snap));
   if(!captured&&snap.speech){
    await p.evaluate(()=>{
     for(const n of v.villagers)n.sprite.setVisible(v.sameRoom(n));
     v.paused=false;v.updateHUD();v.daylight.update(750);v.world.updateLighting(750);
     const s=v.routines.get(v.speech.id).state;
     v.cameras.main.removeBounds().stopFollow().setZoom(2).centerOn(s.x,s.y-40);
     game.step(500000,0);game.step(500001,0);
    });
    check('Balão da praça visível e legível',await p.locator('.village-npc-speech').isVisible());
    await p.screenshot({path:out+'/conversa-praca.png'});
    for(const zoom of [.75,1,2.5]){
     await p.evaluate(zoom=>{v.cameras.main.setZoom(zoom);game.step(500002,0);game.step(500003,0);},zoom);
     const box=await p.locator('.village-npc-speech').boundingBox();
     check('Balão permanece dentro da tela com zoom '+zoom,box&&box.x>=0&&box.y>=0&&box.x+box.width<=1440&&box.y+box.height<=1000,box);
    }
    captured=true;
   }
  }
  const lunch=await p.evaluate(()=>({seen:socialSeen,motion:socialMotion,collisions:socialCollisions,peak:plazaPeak}));
  check('As cinco duplas conversam e respondem na praça',Object.keys(lunch.seen).length===5&&Object.values(lunch.seen).every(s=>s.length===2),lunch);
  check('Nenhum participante anda enquanto fala ou escuta',lunch.motion.length===0,lunch.motion);
  check('A praça não recebe todos os comerciantes juntos',lunch.peak<=4,lunch.peak);
  check('Rotinas não atravessam a fonte, canteiros ou fachadas',lunch.collisions.length===0,lunch.collisions.slice(0,10));

  const shop=await p.evaluate(async()=>{
   const {MerchantDailyRoutine}=await import('/src/systems/merchant-routine.ts');
   v.conversations.reset(v.routines);
   const navs=new Map([...v.routines].map(([id,r])=>[id,r.homeNavigation]));
   v.routines=new Map([...navs].map(([id,nav])=>[id,new MerchantDailyRoutine(id,{x:288,y:151,direction:'down',shop:true},nav,undefined,6,owner=>navs.get(owner))]));
   v.setMerchantRoom('rosa');v.player.x=100;v.player.y=330;v.state.time=540;
   const speakers=new Set(),moving=[];let cue,finished=false;
   for(let i=0;i<1300;i++){
    const before=new Map([...v.routines].map(([id,r])=>[id,{x:r.state.x,y:r.state.y}]));
    v.updateDailyRoutines(.1);
    if(v.speech){
     speakers.add(v.speech.id);cue={...v.speech};
     for(const id of v.conversations.participants){const s=v.routines.get(id).state,b=before.get(id);if(s.x!==b.x||s.y!==b.y)moving.push(id);}
    }else if(speakers.size===2&&!v.conversations.participants.length){finished=true;break;}
    v.state.time+=.1;
   }
   let resumed=false;
   for(let i=0;i<150;i++){v.updateDailyRoutines(.1);resumed||=v.routines.get('rosa').isMoving;v.state.time+=.1;}
   return {speakers:[...speakers],moving,finished,resumed,cue};
  });
  check('Conversa na loja tem pergunta, resposta e participantes parados',shop.speakers.includes('augusto')&&shop.speakers.includes('rosa')&&shop.moving.length===0&&shop.finished,shop);
  check('O dono retoma sua rotina após conversar',shop.resumed,shop);
  const save=await p.evaluate(async()=>{
   const {loadSave,validateSave}=await import('/src/systems/save.ts');
   v.persist();return validateSave(loadSave());
  });
  check('Save continua válido após conversas e novos intervalos',save);
  const gl=await p.evaluate(()=>game.renderer.gl?.getError()??0);
  check('Sem erros JavaScript, HTTP ou WebGL',errors.length===0&&gl===0,{errors,gl});
  console.log('PASS',checks.length,'checks');
 }catch(e){await p.screenshot({path:out+'/falha.png'});throw e;}
 finally{
  fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
