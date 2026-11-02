const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');const out='/workspace/alto-da-serra-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{const page=await browser.newPage({viewport:{width:1536,height:1024}}),errors=[];page.on('console',m=>{if(m.text().startsWith('tour path'))console.log(m.text());});page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});page.setDefaultTimeout(120000);
await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Serra QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;game.scene.getScene('Vale').enterLake();});await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='fishingLake');
await page.evaluate(()=>{window.lake=game.scene.getScene('Lago');lake.player.x=1104;lake.player.y=176;lake.player.update(0,lake.movementBlockedTile,lake.movementBlockedPoint,false,lake.swimmingPoint,lake.allowCabinStep);});await page.keyboard.down('w');await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='highland');await page.keyboard.up('w');console.log('walked from lake terrace to separate highland');

await page.evaluate(()=>{
 window.s=game.scene.getScene('Serra');s.ui.closeModal();s.setPaused(false);document.querySelector('#ui').style.display='none';s.cameras.main.stopFollow().setZoom(1).centerOn(768,512);
 window.tourLabel=s.add.text(22,22,'Alto da Serra · passeio pelo cenário',{fontFamily:'Georgia',fontSize:'18px',color:'#f6efd8',backgroundColor:'#20372de6',padding:{x:12,y:8}}).setScrollFactor(0).setDepth(10000);
 window.tourChunks=[];window.tourRecorder=new MediaRecorder(game.canvas.captureStream(24),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:3000000});tourRecorder.ondataavailable=e=>{if(e.data.size)tourChunks.push(e.data);};tourRecorder.start(1000);
 window.tourPath=(target)=>{
  const {highlandBlockedPoint,highlandAllowsStep}=window.tourGeometry,step=8,w=192,h=128,blocked=(x,y)=>x<2||y<2||x>w-3||y>h-3||[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>highlandBlockedPoint(x*step+dx,y*step+dy));
  let goal={x:Math.round(target.x/step),y:Math.round(target.y/step)};
  if(blocked(goal.x,goal.y)){let best;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=goal.x+dx,y=goal.y+dy,d=dx*dx+dy*dy;if(!blocked(x,y)&&(!best||d<best.d))best={x,y,d};}if(!best)throw Error('Unreachable target '+JSON.stringify(target));goal=best;}
  const start={x:Math.round(s.player.x/step),y:Math.round(s.player.y/step)},id=(x,y)=>y*w+x,source=id(start.x,start.y),destination=id(goal.x,goal.y),parent=new Int32Array(w*h).fill(-1),seen=new Uint8Array(w*h),queue=[source];seen[source]=1;
  for(let at=0;at<queue.length;at++){const current=queue[at];if(current===destination){const path=[];let guard=0;for(let p=current;p!==source;p=parent[p]){if(p<0||++guard>w*h)throw Error('Invalid tour path');path.push({x:p%w*step,y:Math.floor(p/w)*step});}return path.reverse().map(p=>{if(!window.tourGeometry.highlandDeck(p.x,p.y))return p;const b=window.tourGeometry.highlandBridgePose();return{x:p.x,y:b.y+.07*(p.x-(b.left+b.right)/2)};});}
   const x=current%w,y=Math.floor(current/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,next=id(nx,ny);if(seen[next]||blocked(nx,ny)||!highlandAllowsStep({x:x*step,y:y*step},{x:nx*step,y:ny*step}))continue;seen[next]=1;parent[next]=current;queue.push(next);}
 }throw Error('No walking route from '+JSON.stringify(start)+' to '+JSON.stringify(goal));
 };
});
await page.evaluate(async()=>{window.tourGeometry=await import('/src/data/highland.ts');});await page.waitForTimeout(2200);await page.evaluate(()=>{s.cameras.main.setZoom(1.5).startFollow(s.player,true,.15,.15);});
const route=[['Escadaria do lago',{x:220,y:696}],['Trilha da serra',{x:316,y:528}],['Clareira oeste',{x:160,y:420}],['Bosque do alto',{x:220,y:192}],['Caminhos entre as rochas',{x:400,y:212}],['Rio acima da cachoeira',{x:608,y:328}],['Cabeceira da ponte',{x:536,y:408}],['Travessia da ponte elevada',{x:1104,y:448}],['Mirante leste',{x:1272,y:512}],['Arredores da mina',{x:1400,y:344}],['Área livre para mineração',{x:1312,y:296}],['Entrada acessível da mina',{x:1312,y:240}],['Retorno pela ponte',{x:536,y:408}],['Volta à escadaria',{x:240,y:880}]];
for(const[label,target]of route){await page.evaluate(({label,target})=>{tourLabel.setText('Alto da Serra · '+label);window.currentTourPath=tourPath(target);window.tourIndex=0;window.lastTour={x:s.player.x,y:s.player.y,still:0};console.log('tour path',label,currentTourPath.length);},{label,target});let done=false;const deadline=Date.now()+60000;
 while(Date.now()<deadline&&!done){const result=await page.evaluate(()=>{
  while(tourIndex<currentTourPath.length&&Math.hypot(currentTourPath[tourIndex].x-s.player.x,currentTourPath[tourIndex].y-s.player.y)<6)tourIndex++;
  for(const key of Object.values(s.player.keys))key.isDown=false;
  if(tourIndex>=currentTourPath.length)return{done:true,x:s.player.x,y:s.player.y};const p=currentTourPath[tourIndex],dx=p.x-s.player.x,dy=p.y-s.player.y;
  if(Math.abs(dx)>.35)s.player.keys[dx>0?'D':'A'].isDown=true;if(Math.abs(dy)>.35)s.player.keys[dy>0?'S':'W'].isDown=true;
  const moved=Math.hypot(s.player.x-lastTour.x,s.player.y-lastTour.y);lastTour={x:s.player.x,y:s.player.y,still:moved<.1?lastTour.still+1:0};if(lastTour.still>80)throw Error('Walking stuck '+JSON.stringify({player:{x:s.player.x,y:s.player.y},next:p}));return{done:false,index:tourIndex,x:s.player.x,y:s.player.y};
 });done=result.done;if(!done)await page.waitForTimeout(45);}
 assert.ok(done,'Tour leg timed out: '+label);console.log('walked',label);await page.waitForTimeout(250);
}
await page.evaluate(()=>{for(const key of Object.values(s.player.keys))key.isDown=false;tourLabel.setText('Alto da Serra · exterior da mina abandonada');s.cameras.main.stopFollow().setZoom(1).centerOn(768,512);});await page.waitForTimeout(1800);
const video=await page.evaluate(async()=>{await new Promise(resolve=>{tourRecorder.onstop=resolve;tourRecorder.stop();});const bytes=new Uint8Array(await new Blob(tourChunks,{type:'video/webm'}).arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(text);});fs.writeFileSync(out+'/Passeio-Alto-da-Serra.webm',Buffer.from(video,'base64'));assert.deepEqual(errors,[]);console.log(JSON.stringify({continuousWalking:true,areas:route.map(r=>r[0]),errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
