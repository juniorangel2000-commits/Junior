const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const dir='docs/cenarios/cercas';fs.mkdirSync(dir,{recursive:true});const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5178');await page.locator('#new-game').click();await page.locator('#character-name').fill('Cercas');await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.s=game.scene.getScene('Vale');game.loop.sleep();window.qt=s.time.now;window.step=ms=>{qt+=ms;game.step(qt,ms)};s.state.time=720;s.updateNight();window.fences=await import('/src/data/fences.ts');window.saving=await import('/src/systems/save.ts');});
 // Real construction route, including saved day and live removal of a neighbor.
 const placement=await page.evaluate(()=>{const p={x:19,y:18};s.player.x=(p.x+.5)*32;s.player.y=(p.y+1.5)*32;s.inventory.data.wood=30;s.state.day=11;s.nextInteractionAt=0;s.selectTool('fence');s.interact(p);s.nextInteractionAt=0;s.interact({x:20,y:18});const result=s.building.buildings.map(b=>({...b}));s.persist();return result});
 assert.equal(placement.length,2);assert.equal(placement[0].fenceBuiltDay,11);
 assert.equal(await page.evaluate(()=>s.buildingSprites[0].getData('fenceConnections')),2);
 await page.evaluate(()=>{s.selectTool('remove');s.nextInteractionAt=0;s.interact({x:20,y:18})});
 assert.equal(await page.evaluate(()=>s.buildingSprites[0].getData('fenceConnections')),0);
 const aging=await page.evaluate(()=>{const out=[];for(const day of [40,41,70,71,100,101]){s.state.day=day;s.syncSprites();out.push({day,stage:s.buildingSprites[0].getData('fenceStage')})}s.persist();const restored=saving.migrateSave(JSON.parse(localStorage.getItem(saving.SAVE_KEY)));return {out,day:restored.day,builtDay:restored.buildings[0].fenceBuiltDay,stage:fences.fenceStage(restored.buildings[0],restored.day)}});
 assert.deepEqual(aging.out.map(i=>i.stage),['new','worn','worn','damaged','damaged','ruined']);assert.equal(aging.stage,'ruined');assert.equal(aging.builtDay,11);
 // Check the actual composited pixels, including the requested vertical alignment.
 const art=await page.evaluate(()=>{
  const image=(stage,mask)=>s.textures.get(fences.fenceTexture(stage,mask)).getSourceImage();
  const ruined=image('ruined',0).toDataURL();
  const ruinedOnlyPosts=Array.from({length:16},(_,mask)=>image('ruined',mask).toDataURL()===ruined).every(Boolean);
  const connected=stage=>{const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.drawImage(image(stage,4),0,0);ctx.drawImage(image(stage,1),0,128);return ctx};
  const ctx=connected('new'),xs=[];
  for(let x=0;x<256;x++)for(let y=66*4;y<69*4;y++)if(ctx.getImageData(x,y,1,1).data[3]>80)xs.push(x/4);
  const damagedPost=image('damaged',0).getContext('2d').getImageData(0,0,256,62*4).data;
  const damagedLinks=image('damaged',15).getContext('2d').getImageData(0,0,256,62*4).data;
  const fallenOnlyAtGround=damagedPost.every((value,index)=>value===damagedLinks[index]);
  const metalHeads=(stage,mask)=>{
   const pixels=image(stage,mask).getContext('2d').getImageData(29*4,45*4,6*4,14*4).data;
   let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>80&&pixels[i+2]>pixels[i]+8&&pixels[i+1]>pixels[i]+3)count++;
   return count;
  };
  const coveredNails=['new','worn'].map(stage=>({stage,isolated:metalHeads(stage,0),horizontal:metalHeads(stage,10),vertical:[4,5,7,15].map(mask=>({mask,metalPixels:metalHeads(stage,mask)}))}));
  const terminalFaces=['new','worn'].map(stage=>({stage,pairs:[[1,0],[3,2],[9,8],[11,10]].map(([terminal,plain])=>{
   const a=image(stage,terminal).getContext('2d').getImageData(29*4,48*4,6*4,17*4).data;
   const b=image(stage,plain).getContext('2d').getImageData(29*4,48*4,6*4,17*4).data;
   return {terminal,plain,noForegroundStub:a.every((value,index)=>value===b[index])};
  })}));
  const singleRail=['new','worn'].map(stage=>{
   const ctx=connected(stage);let runs=0,previous=false;
   for(let x=0;x<256;x++){const solid=ctx.getImageData(x,67*4,1,1).data[3]>80;if(solid&&!previous)runs++;previous=solid}
   return {stage,runs};
  });
  const damagedPixels=image('damaged',0).getContext('2d').getImageData(0,0,256,384).data;
  let mossPixels=0;for(let i=0;i<damagedPixels.length;i+=4)if(damagedPixels[i+3]>80&&damagedPixels[i+1]>damagedPixels[i]*1.1)mossPixels++;
  return {ruinedOnlyPosts,fallenOnlyAtGround,coveredNails,terminalFaces,singleRail,mossPixels,verticalMinX:Math.min(...xs),verticalMaxX:Math.max(...xs)};
 });
 assert.equal(art.ruinedOnlyPosts,true);assert.equal(art.fallenOnlyAtGround,true);assert.ok(art.coveredNails.every(item=>item.isolated>0&&item.horizontal>0&&item.vertical.every(v=>v.metalPixels===0)),JSON.stringify(art.coveredNails));assert.ok(art.terminalFaces.every(item=>item.pairs.every(p=>p.noForegroundStub)),JSON.stringify(art.terminalFaces));assert.ok(art.singleRail.every(item=>item.runs===1),JSON.stringify(art.singleRail));assert.ok(art.mossPixels>30);assert.ok(art.verticalMinX>=29&&art.verticalMaxX<35,JSON.stringify(art));
 // Complete art review, drawn by the same renderer as the live game.
 await page.evaluate(async()=>{const {drawConnectedFence}=await import('/src/fence-art.ts');const preview=document.createElement('canvas');preview.width=1280;preview.height=1140;const ctx=preview.getContext('2d');ctx.fillStyle='#30472b';ctx.fillRect(0,0,1280,1140);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#f4dfb7';ctx.font='bold 25px Georgia';ctx.fillText('AFTER RAIN · TRECHOS CONECTADOS',35,42);
 for(let stage=0;stage<4;stage++){
  const ox=30+(stage%2)*630,oy=105+Math.floor(stage/2)*520;
  ctx.strokeStyle='#557047';ctx.strokeRect(ox,oy-32,600,485);ctx.fillStyle='#f4dfb7';ctx.font='22px Georgia';ctx.fillText(`${fences.FENCE_NAMES[stage]} · ${stage*30} dias`,ox+20,oy);
  const pieces=[];for(let x=1;x<=7;x++)pieces.push({x,y:2,kind:'fence'});for(let y=1;y<=5;y++){if(y!==2)pieces.push({x:4,y,kind:'fence'});if(y>=3)pieces.push({x:1,y,kind:'fence'})}
  for(const piece of pieces.sort((a,b)=>a.y-b.y)){
   const key=fences.fenceTexture(fences.FENCE_STAGES[stage],fences.fenceConnections(pieces,piece.x,piece.y));const tex=s.textures.get(key).getSourceImage();ctx.drawImage(tex,ox+25+piece.x*64-64,oy+60+piece.y*64-128,128,192);
  }
 }
 const detail=document.createElement('canvas');detail.width=1200;detail.height=800;
 const dc=detail.getContext('2d');dc.fillStyle='#30472b';dc.fillRect(0,0,1200,800);dc.imageSmoothingEnabled=false;
 dc.fillStyle='#f4dfb7';dc.font='bold 25px Georgia';dc.fillText('AFTER RAIN · CERCAS VERTICAIS',35,43);
 for(let stage=0;stage<2;stage++){
  const ox=stage*600+35,oy=160;dc.strokeStyle='#557047';dc.strokeRect(ox,74,565,660);
  dc.fillStyle='#f4dfb7';dc.font='23px Georgia';dc.fillText(`${fences.FENCE_NAMES[stage]} · ${stage*30} dias`,ox+24,112);
  const pieces=[{x:0,y:0,kind:'fence'},{x:0,y:1,kind:'fence'},{x:0,y:2,kind:'fence'},{x:0,y:3,kind:'fence'},{x:1,y:1,kind:'fence'},{x:2,y:1,kind:'fence'}];
  for(const piece of pieces.sort((a,b)=>a.y-b.y)){
   const tex=s.textures.get(fences.fenceTexture(fences.FENCE_STAGES[stage],fences.fenceConnections(pieces,piece.x,piece.y))).getSourceImage();
   dc.drawImage(tex,ox+30+piece.x*128,oy-160+piece.y*128,256,384);
  }
 }
 dc.fillStyle='#f4dfb7';dc.font='18px Georgia';dc.fillText('Uma travessa central · ligação só entre vizinhos · ponta final sem sobra',35,775);
 window.verticalDetail=detail.toDataURL('image/png');
 window.contactSheet=preview.toDataURL('image/png');
 s.building.buildings.splice(0);s.state.day=100;
 for(let x=21;x<=30;x++)s.building.buildings.push({kind:'fence',x,y:25,fenceBuiltDay:100});
 for(let y=26;y<=27;y++)s.building.buildings.push({kind:'fence',x:23,y,fenceBuiltDay:100});
 s.buildingSignature='';s.syncSprites();s.selection.clear();s.selectTool('hand');s.player.x=28.5*32;s.player.y=26*32;s.player.update(0,s.movementBlocked,s.movementBlockedPoint,true,s.swimmingPoint);
 const {animalSprite}=await import('/src/forest-art.ts');animalSprite(s,'cow',24.5*32,26.3*32);animalSprite(s,'chicken',26.5*32,26.3*32);
 s.cameras.main.stopFollow().setZoom(2.5).centerOn(26*32,24*32);for(const o of s.children.list)if(/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(o.texture?.key??''))o.setVisible(false);step(0);document.querySelector('#ui').style.visibility='hidden';});
 fs.writeFileSync(`${dir}/detalhes-conexoes.png`,Buffer.from((await page.evaluate(()=>window.contactSheet)).split(',')[1],'base64'));
 fs.writeFileSync(`${dir}/vertical-estagios-1-e-2.png`,Buffer.from((await page.evaluate(()=>window.verticalDetail)).split(',')[1],'base64'));
 await page.screenshot({path:`${dir}/cercas-no-jogo.png`});
 const alignment=await page.evaluate(()=>s.buildingSprites.filter(sprite=>sprite.getData('fence')).map((sprite,index)=>{
  const tile=s.building.buildings[index];return {tile:{x:tile.x,y:tile.y},footX:sprite.x+(128-sprite.displayOriginX)*sprite.scaleX,footY:sprite.y+(260-sprite.displayOriginY)*sprite.scaleY,depth:sprite.depth};
 }));
 assert.ok(alignment.length>0);for(const item of alignment){assert.equal(item.footX,item.tile.x*32+16);assert.equal(item.footY,item.tile.y*32+16);assert.equal(item.depth,item.tile.y*32+18)}
 await page.evaluate(()=>{s.updateHUD();document.querySelector('#ui').style.visibility=''});
 await page.locator('.toast').last().waitFor({state:'hidden'});
 await page.screenshot({path:`${dir}/cercas-centralizadas-no-jogo.png`});
 await page.evaluate(()=>{document.querySelector('#ui').style.visibility='hidden';window.tileGrid=s.add.graphics().setDepth(999999);tileGrid.lineStyle(.5,0xf7deb2,.75);for(const b of s.building.buildings){tileGrid.strokeRect(b.x*32,b.y*32,32,32);tileGrid.fillStyle(0xffe6a0,.9).fillCircle(b.x*32+16,b.y*32+16,1)}});
 await page.evaluate(()=>step(0));await page.screenshot({path:`${dir}/cercas-centralizadas-grade.png`});
 await page.evaluate(()=>{tileGrid.destroy();step(0)});

 await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';s.ui.toggleBuilding(s.inventory.data,false)});await page.locator('.fence-stages').waitFor();assert.equal(await page.locator('.fence-stages img').count(),4);await page.screenshot({path:`${dir}/construcao.png`});
 assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({placement,aging,art,alignment,errors},null,2));console.log('PASS: construction, cardinal connections, remove, 30-day aging, persistence, four previews, no browser errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
