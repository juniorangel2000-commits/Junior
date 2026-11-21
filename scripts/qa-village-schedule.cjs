// Vite em QA_URL (padrão 5190). Fixtures mudam só o relógio e o estado inicial;
// todo deslocamento medido usa updateDailyRoutines e os atores reais da cena.
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.QA_OUT||'docs/planejamento/qa-rotinas-preview44';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:940}});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');
  await page.locator('#new-game').click();await page.locator('#character-name').fill('Rotinas da vila');await page.getByRole('button',{name:'Começar minha história'}).click();
  await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property'});
  if(process.argv.includes('--survivors')){
   await page.evaluate(async()=>{
    window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.vale=game.scene.getScene('Vale');if(vale.inHome)vale.leaveHome();game.loop.sleep();
    window.survivors=vale.survivors;window.survivorRules=await import('/src/systems/property-survivors.ts');
    window.survivorArt=await import('/src/data/survivor-walk.ts');vale.state.villageSurvivors=['marina','rui'];vale.state.day=1;vale.state.time=7*60;survivors.update(0,0);
    window.starts=Object.fromEntries([...survivors.actors].map(([id,a])=>[id,{...a.pos}]));window.realBlocked=survivors.host.blocked;survivors.host.blocked=()=>true;vale.state.time=18*60+10;
   });
   const held=await page.evaluate(()=>{
    for(let i=0;i<120;i++)survivors.update(0,100);
    return{starts,ends:Object.fromEntries([...survivors.actors].map(([id,a])=>[id,{...a.pos}]))};
   });assert.deepEqual(held.ends,held.starts);
   const moved=await page.evaluate(()=>{
    survivors.host.blocked=realBlocked;const stats=Object.fromEntries([...survivors.actors].map(([id,a])=>[id,{maxStep:0,frames:[],directions:[],walked:0,old:{...a.pos},arrived:false}]));
    for(let tick=0;tick<1800;tick++){
     survivors.update(0,100);
     for(const[id,a]of survivors.actors){
      const st=stats[id],d=Math.hypot(a.pos.x-st.old.x,a.pos.y-st.old.y);
      st.maxStep=Math.max(st.maxStep,d);st.walked+=d;st.old={...a.pos};
      if(a.moving){
       if(a.sprite.texture.key!==`survivor-walk-${id}`)throw Error('Pose parada durante caminhada');
       const frame=Number(a.sprite.frame.name);
       if(frame!==survivorArt.survivorWalkFrame(id,a.direction,a.distance))throw Error('Quadro incorreto para a passada atual');
       if(!st.frames.includes(frame))st.frames.push(frame);
       if(!st.directions.includes(a.direction))st.directions.push(a.direction);
       st.lastStep=a.direction;
      }
      const goal=survivors.freeTile(survivorRules.survivorActivity(id,vale.state).point);
      st.arrived=Math.hypot(a.pos.x-goal.x,a.pos.y-goal.y)<6;
      if(st.arrived&&!a.moving&&st.lastStep&&!st.firstStop)st.firstStop={direction:a.direction,texture:a.sprite.texture.key};
     }
     if(Object.values(stats).every(s=>s.arrived&&s.firstStop))break;
    }
    return stats;
   });
   for(const [id,st]of Object.entries(moved)){
    assert.ok(st.arrived&&st.walked>20);assert.ok(st.maxStep<=8.401);assert.ok(st.frames.length>=2);
    assert.ok(st.directions.some(direction=>direction.includes('-')), 'O trajeto precisa exercitar uma passada diagonal');
    assert.equal(st.firstStop.direction,st.lastStep);
    const view={right:'east',left:'west',up:'north',down:'south'}[st.lastStep];
    assert.equal(st.firstStop.texture,view?(view==='south'?`survivor-${id}`:`survivor-${id}-${view}`):`survivor-idle-diagonal-${id}`);
   }
   const turns=await page.evaluate(async()=>{
    const {directionVector}=await import('/src/character-directions.ts');
    const {PropertyVisitWalk}=await import('/src/systems/property-visit-walk.ts');
    const results={};
    const player=survivors.host.player();
    for(const[id,a]of survivors.actors){
     const goal=survivors.freeTile(survivorRules.survivorActivity(id,vale.state).point);
     const col=Math.floor(goal.x/32),row=Math.floor(goal.y/32);
     const corner=[[1,1],[1,-1],[-1,1],[-1,-1]].find(([x,y])=>
      !realBlocked(col+x,row+y)&&!realBlocked(col+x,row)&&!realBlocked(col,row+y));
     if(!corner)throw Error('O ponto de descanso precisa de um acesso diagonal livre');
     a.pos={x:goal.x+32*corner[0],y:goal.y+32*corner[1]};
     a.walker=new PropertyVisitWalk(a.pos,goal,6);
     player.x=goal.x+80*corner[0];player.y=goal.y;
     let lastStep,firstStop;
     for(let t=0;t<90;t++){
      survivors.update(0,16);
      if(a.moving)lastStep=a.direction;
      else if(lastStep){firstStop={direction:a.direction,texture:a.sprite.texture.key};break;}
     }
     const poses=[];
     for(const direction of ['up-left','down-right','up-right','down-left']){
      const vector=directionVector(direction);
      player.x=a.pos.x+vector.x*60;player.y=a.pos.y+vector.y*60;
      const start={...a.pos};
      const steps=[a.direction];
      for(let t=0;t<32;t++){
       survivors.update(0,16);
       if(a.direction!==steps.at(-1))steps.push(a.direction);
      }
      if(a.pos.x!==start.x||a.pos.y!==start.y)throw Error('O NPC saiu da posição ao virar');
      const smallTurns=steps.slice(1).every((step,i)=>{
       const previous=directionVector(steps[i]),next=directionVector(step);
       return previous.x*next.x+previous.y*next.y>.7;
      });
      poses.push({direction,facing:a.direction,smallTurns,steps,frame:Number(a.sprite.frame.name),expectedFrame:survivorArt.survivorIdleDiagonalFrame(direction),texture:a.sprite.texture.key});
     }
     results[id]={lastStep,firstStop,poses};
    }
    return results;
   });
   for(const [id,turn]of Object.entries(turns)){
    const texture=`survivor-idle-diagonal-${id}`;
    assert.match(turn.lastStep,/-/);
    assert.deepEqual(turn.firstStop,{direction:turn.lastStep,texture});
    for(const pose of turn.poses){
     assert.equal(pose.facing,pose.direction);assert.ok(pose.smallTurns);assert.equal(pose.frame,pose.expectedFrame);
     assert.equal(pose.texture,texture);
    }
   }
   const work=await page.evaluate(()=>{
    const player=survivors.host.player();player.x=3000;player.y=3000;
    const results={};
    for(const[id,time]of [['marina',12*60+30],['rui',14*60+10]]){
     vale.state.time=time;const a=survivors.actors.get(id);let started=false;
     for(let t=0;t<2500;t++){
      survivors.update(0,50);
      if(a.moving)started ||= a.sprite.texture.key===`survivor-walk-${id}`;
      const activity=survivorRules.survivorActivity(id,vale.state),goal=survivors.freeTile(activity.point);
      if(!a.moving&&a.direction==='up'&&Math.hypot(a.pos.x-goal.x,a.pos.y-goal.y)<6){
       results[id]={started,task:activity.task,texture:a.sprite.texture.key};break;
      }
     }
    }
    return results;
   });
   for(const id of ['marina','rui'])assert.deepEqual(work[id],{started:true,task:'well',texture:`survivor-${id}-north`});
   assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/sobreviventes-validacao.json`,JSON.stringify({held,moved,turns,work,errors},null,2)+'\n');console.log('QA dos sobreviventes: passadas, parada diagonal, conversa e retomada até o poço OK');return;
  }
  if(process.argv.includes('--property-visit')){
   await page.evaluate(async()=>{
    window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.vale=game.scene.getScene('Vale');if(vale.inHome)vale.leaveHome();game.loop.sleep();
    window.visitRules=await import('/src/systems/property-visits.ts');
    vale.state.npcSocial={version:1,players:{icaro:{affinity:8}},pairs:{},memories:{}};
    for(let day=2;day<400;day++){vale.state.day=day;if(visitRules.propertyVisitor(vale.state)==='icaro')break;}
    vale.state.time=visitRules.PROPERTY_VISIT.start;window.visit=vale.visit;window.realBlocked=visit.host.blocked;visit.host.blocked=()=>true;
   });
   await page.waitForFunction(()=>{game.step(performance.now(),0);visit.update(0,0);return visit.visitor==='icaro'});
   const blocked=await page.evaluate(()=>{
    const start={...visit.pos};let maxStep=0,previous=start;
    for(let i=0;i<120;i++){visit.update(0,100);maxStep=Math.max(maxStep,Math.hypot(visit.pos.x-previous.x,visit.pos.y-previous.y));previous={...visit.pos};}
    return{start,end:{...visit.pos},maxStep,seconds:12,key:visit.sprite.texture.key};
   });
   checks.push({name:'visita-com-caminho-fechado',...blocked});assert.deepEqual(blocked.end,blocked.start);assert.equal(blocked.maxStep,0);assert.equal(blocked.key,'village-npc-icaro');
   const arrival=await page.evaluate(()=>{
    visit.host.blocked=realBlocked;let maxStep=0,walked=0,previous={...visit.pos},steps=0;
    for(;steps<1800&&Math.hypot(visit.pos.x-visit.goal.x,visit.pos.y-visit.goal.y)>=6;steps++){visit.update(0,100);const d=Math.hypot(visit.pos.x-previous.x,visit.pos.y-previous.y);maxStep=Math.max(maxStep,d);walked+=d;previous={...visit.pos};}
    return{arrived:Math.hypot(visit.pos.x-visit.goal.x,visit.pos.y-visit.goal.y)<6,maxStep,walked,steps,end:{...visit.pos}};
   });
   checks.push({name:'visita-retoma-ate-a-casa',...arrival});assert.ok(arrival.arrived&&arrival.walked>1000);assert.ok(arrival.maxStep<=8.401);
   await page.evaluate(()=>{vale.cameras.main.stopFollow().setZoom(2).centerOn(visit.pos.x,visit.pos.y);game.step(performance.now(),0);});
   await page.screenshot({path:`${out}/visita-na-casa.png`});
   const departure=await page.evaluate(()=>{
    vale.state.time=visitRules.PROPERTY_VISIT.leave;let maxStep=0,walked=0,previous={...visit.pos},steps=0;
    for(;steps<1800&&!visit.gone;steps++){visit.update(0,100);const d=Math.hypot(visit.pos.x-previous.x,visit.pos.y-previous.y);maxStep=Math.max(maxStep,d);walked+=d;previous={...visit.pos};}
    return{gone:visit.gone,maxStep,walked,steps,end:{...visit.pos},visible:visit.sprite.visible};
   });
   checks.push({name:'visita-volta-a-estrada',...departure});assert.ok(departure.gone&&departure.walked>1000&&!departure.visible);assert.ok(departure.maxStep<=8.401);assert.deepEqual(errors,[]);
   fs.writeFileSync(`${out}/visita-validacao.json`,JSON.stringify({checks,errors},null,2)+'\n');console.log('QA da visita sem teleporte: OK');return;
  }
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.vale=game.scene.getScene('Vale');vale.state.damiaoIntroduction=true;vale.enterVillage(vale.snapshotState());});
  await page.waitForFunction(()=>window.game?.scene.isActive('Vila')&&document.querySelector('#ui')?.dataset.area==='village');
  const cases=await page.evaluate(async()=>{
   window.v=game.scene.getScene('Vila');game.loop.sleep();window.schedule=await import('/src/data/village-schedule.ts');window.lunches=(await import('/src/data/merchant-lunches.ts')).MERCHANT_LUNCHES;
   window.saves=await import('/src/systems/save.ts');window.baseline=structuredClone(v.snapshotState());
   const days=Array.from({length:200},(_,i)=>i+1),sun=days.find(d=>schedule.restDay('augusto',d)&&!schedule.rainyDay(d)),rain=days.find(d=>schedule.restDay('nilo',d)&&schedule.rainyDay(d)),workRain=days.find(d=>!schedule.restDay('augusto',d)&&schedule.rainyDay(d)),night=days.find(d=>schedule.innGuests(d).includes('rosa')&&!schedule.restDay('rosa',d));
   return [{name:'folga-com-sol',day:sun,time:600,id:'augusto',area:'village',activity:'stroll'}, {name:'folga-com-chuva',day:rain,time:600,id:'nilo',area:'shop',room:'helena',activity:'inn-seat'}, {name:'almoco-com-chuva',day:workRain,time:lunches.augusto.start+1,id:'augusto',area:'shop',room:'helena',activity:'inn-seat'}, {name:'jantar-na-pousada',day:night,time:1081,id:'rosa',area:'shop',room:'helena',activity:'inn-seat'}];
  });
  for(const spec of cases){
   await page.evaluate(spec=>{
    if(v.merchantRoom)v.setMerchantRoom(undefined);v.state.day=spec.day;v.state.time=spec.time;v.player.x=80;v.player.y=1680;
    v.conversations.reset(v.routines);v.state.npcSocial=undefined;v.state.bentoTravel=undefined;v.state.fisherTravel=undefined;
    for(const [id,r]of v.routines){r.setExternal(false);r.setRoom(r.homeNavigation);for(const key of Object.keys(r.state))delete r.state[key];Object.assign(r.state,{...r.homeNavigation.entry,area:'shop',direction:'up',stop:0,wait:0,serviceUntil:0,socialUntil:0,socialDay:0});v.syncRoutine(id,0);}
    window.measure={steps:0,maxStep:0,walked:0,transitions:[],collisions:[]};
   },spec);
   let status;
   for(let batch=0;batch<140;batch++){
    status=await page.evaluate(spec=>{
     const r=v.routines.get(spec.id);
     for(let n=0;n<100;n++){
      const before={...r.state},room=r.roomOwner;v.updateDailyRoutines(.1);const now=r.state;
      if(before.area===now.area&&room===r.roomOwner){const d=Math.hypot(now.x-before.x,now.y-before.y);measure.maxStep=Math.max(measure.maxStep,d);measure.walked+=d;}
      else measure.transitions.push({from:{area:before.area,room,x:before.x,y:before.y},to:{area:now.area,room:r.roomOwner,x:now.x,y:now.y}});
      const bad=now.area==='shop'?!r.navigation.validPosition(now.x,now.y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>v.world.isBlockedPoint(now.x+dx,now.y+dy));
      if(bad&&measure.collisions.length<5)measure.collisions.push({x:now.x,y:now.y,area:now.area});
      measure.steps++;
      if(now.area===spec.area&&(!spec.room||r.roomOwner===spec.room)&&r.activity.startsWith(spec.activity)&&!r.isMoving&&r.state.wait>0)break;
     }
     return{...measure,reached:r.state.area===spec.area&&(!spec.room||r.roomOwner===spec.room)&&r.activity.startsWith(spec.activity)&&!r.isMoving&&r.state.wait>0,state:{...r.state},activity:r.activity,availability:r.availability(v.state),serving:r.isServing(v.state)};
    },spec);
    if(status.reached)break;
   }
   console.log(spec.name,JSON.stringify(status));checks.push({spec,...status});
   assert.ok(status.reached,`${spec.name}: não chegou ao destino`);assert.ok(status.walked>100);assert.ok(status.maxStep<=8.401,`${spec.name}: salto ${status.maxStep}`);assert.deepEqual(status.collisions,[]);assert.equal(status.serving,false);
   await page.evaluate(spec=>{
    if(spec.area==='shop')v.setMerchantRoom(spec.room);
    const r=v.routines.get(spec.id);v.paused=false;for(const npc of v.villagers)npc.sprite.setVisible(v.sameRoom(npc));
    v.cameras.main.stopFollow();v.cameras.main.resetFX();v.cameras.main.setZoom(spec.area==='shop'?2:1.5);v.cameras.main.centerOn(r.state.x,r.state.y);v.updateHUD();game.step(performance.now(),0);
   },spec);
   await page.screenshot({path:`${out}/${spec.name}.png`});
   // Mesma pessoa retoma sua casa a pé quando a pausa termina, sem reiniciar a cena.
   if(spec.name==='almoco-com-chuva'||spec.name==='jantar-na-pousada'){
    const returned=await page.evaluate(spec=>{
     if(v.merchantRoom)v.setMerchantRoom(undefined);
     v.player.x=80;v.player.y=1680;
     v.state.time=spec.name==='almoco-com-chuva'?lunches[spec.id].end+1:21*60+1;
     const r=v.routines.get(spec.id);let max=0,walked=0,steps=0;
     for(;steps<14000;steps++){const before={...r.state},room=r.roomOwner;v.updateDailyRoutines(.1);if(before.area===r.state.area&&room===r.roomOwner){const d=Math.hypot(r.state.x-before.x,r.state.y-before.y);max=Math.max(max,d);walked+=d;}if(r.state.area==='shop'&&r.roomOwner===spec.id)break;}
     return{arrived:r.state.area==='shop'&&r.roomOwner===spec.id,maxStep:max,walked,steps};
    },spec);
    checks.push({name:spec.name+'-retorno',...returned});assert.ok(returned.arrived&&returned.walked>100);assert.ok(returned.maxStep<=8.401);
   }
  }
  const save=await page.evaluate(()=>({valid:saves.validateSave(v.snapshotState()),actors:v.routines.size}));assert.ok(save.valid);assert.equal(save.actors,10);assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/validacao.json`,JSON.stringify({checks,save,errors},null,2)+'\n');console.log('QA das rotinas novas: OK');
 }catch(e){fs.writeFileSync(`${out}/${process.argv.includes('--property-visit')?'visita-falha':'falha'}.json`,JSON.stringify({checks,errors,error:String(e)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
