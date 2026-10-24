const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 if(process.env.QA_CANVAS)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^(webgl|webgl2|experimental-webgl)$/.test(type)?null:get.call(this,type,...args);};});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Corpo submerso');await page.getByRole('button',{name:'Começar minha história'}).click();
 await page.evaluate(async()=>{
  const {game}=await import(document.querySelector('script[src*="main.ts"]').src),{Player}=await import('/src/player.ts'),{createCharacterProfile}=await import('/src/data/characters.ts'),{CHARACTER_DIRECTIONS,directionVector}=await import('/src/character-directions.ts');
  const {prepareSubmergedRig}=await import('/src/swimming/body-animation.ts'),{bodyVisibility}=await import('/src/swimming/underwater-appearance.ts');window.qaRig=prepareSubmergedRig;window.qaBodyVisibility=bodyVisibility;
  window.game=game;document.querySelector('#ui').style.display='none';game.scene.stop('Vale');
  const labels=['Frente','Esquerda','Direita','Costas','Frente/esq.','Frente/dir.','Costas/esq.','Costas/dir.'];window.reviewPlayers=[];
  game.scene.add('BodyReview',{create(){
    window.review=this;this.cameras.main.setZoom(2).centerOn(320,200);
    this.add.tileSprite(0,0,640,400,'asset-ground-water').setOrigin(0).setDepth(-100);
    this.add.text(320,12,'AFTER RAIN · corpo submerso · 8 direções',{fontSize:'12px',color:'#f6e5be',fontFamily:'Georgia'}).setOrigin(.5,0);
    this.add.text(12,49,'Fazendeira',{fontSize:'10px',color:'#f6e5be',fontFamily:'Georgia'});
    this.add.text(12,209,'Fazendeiro',{fontSize:'10px',color:'#f6e5be',fontFamily:'Georgia'});
    this.add.text(12,375,'Sprites oficiais preservadas · braços e pernas animados sob a água · ondulações contornando o corpo',{fontSize:'9px',color:'#f6e5be',fontFamily:'Georgia'});
    for(const [row,id]of ['farmer-female','farmer-male'].entries())for(const [col,direction]of CHARACTER_DIRECTIONS.entries()){
      const p=new Player(this,createCharacterProfile('Prévia',id),40+col*80,126+row*160,`review-${id}-${direction}`);p.facing=directionVector(direction);p.update(0,()=>false,undefined,true,()=>1);reviewPlayers.push({p,id,direction});
      this.add.text(p.x,74+row*160,labels[col],{fontSize:'8px',color:'#fff5db',fontFamily:'Arial'}).setOrigin(.5,0);
    }
  }},true);
 });await page.waitForFunction(()=>reviewPlayers.length===16);
 await page.evaluate(debug=>{window.allowDiagnostic=debug;},!!process.env.QA_DEBUG);
 const report=await page.evaluate(()=>{
  const result=[];const textureCount=Object.keys(game.textures.list).length,objects=review.children.list.length;
  for(const {p,id,direction}of reviewPlayers){
   const v=p.swimmingVisual,body=v.body.texture.getSourceImage(),ctx=body.getContext('2d'),frames=new Set(),head=p.sprite.frame.name,headTexture=p.sprite.texture.key;
   let minArea=Infinity,maxArea=0,maxParts=0,minConnected=1;const cut=v.appearance.headBottom[direction];
   const headFrame=p.sprite.frame,original=p.sprite.texture.getSourceImage().getContext('2d').getImageData(headFrame.cutX,headFrame.cutY,192,256).data;
   const baseline=analyze(original,cut);
   const source=document.createElement('canvas');source.width=192;source.height=256;source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(original),192,256),0,0);
   const bounds=qaRig(source,direction,cut);
   let hairPixels=0;
   if(id==='farmer-female'){
    assert(v.hairShadow,'hair object not initialized');
    const hair=v.hairShadow.texture.getSourceImage().getContext('2d').getImageData(0,Math.floor(head/(v.appearance.walkFrames+1))*256,192,256).data;
    for(let i=0;i<hair.length;i+=4)if(hair[i+3]){assert(i/4>=cut*192,'hair shadow above water');hairPixels++;}
    assert(hairPixels>30,`missing submerged hair ${direction}`);
   }else assert(!v.hairShadow,'unexpected added male hair shadow');
   for(let phase=0;phase<12;phase++){
    const frontPoints=[],graphics=v.effects.frontGraphics,move=graphics.moveTo,line=graphics.lineTo;
    graphics.moveTo=function(x,y){frontPoints.push({x,y});return move.call(this,x,y);};graphics.lineTo=function(x,y){frontPoints.push({x,y});return line.call(this,x,y);};
    v.clock.cycle=phase/12;v.update(p.sprite,p.x,p.y,direction,true,0,1,undefined,.55);graphics.moveTo=move;graphics.lineTo=line;
    assert(p.sprite.frame.name===head&&p.sprite.texture.key===headTexture,'head changed');
    assert(v.effects.graphics.depth<v.body.depth&&v.body.depth<v.surface.depth&&v.surface.depth<v.effects.frontGraphics.depth&&v.effects.frontGraphics.depth<p.sprite.depth,'incorrect wrapping ripple/body/head order');
    const f=v.body.frame,rgba=ctx.getImageData(f.cutX,f.cutY,192,256).data;
    assert(frontPoints.length>=40,'missing continuous front arc');
    assert(frontPoints.some(p=>Math.abs(p.x-Math.round(p.x))>.01),'ripple is snapped to square cells');
    let overlaps=0;
    for(const point of frontPoints){
     assert(point.y>=p.sprite.y+.5,'front ripple crosses above the waterline');
     const x=Math.floor((point.x-p.sprite.x)/p.sprite.scaleX+p.sprite.displayOriginX),y=Math.floor((point.y-p.sprite.y)/p.sprite.scaleY+p.sprite.displayOriginY);
     if(x>=0&&x<192&&y>=cut&&y<256&&rgba[(y*192+x)*4+3]>16)overlaps++;
    }
    assert(overlaps>0,'front arc never passes in front of submerged body');
    for(let i=0;i<cut*192;i++)assert(!rgba[i*4+3],'swim limbs above the waterline');
    for(let y=0;y<256;y++){
     const expected=Math.round(255*qaBodyVisibility(y,bounds.waist,bounds.feet));
     for(let x=0;x<192;x++){const alpha=rgba[(y*192+x)*4+3];if(alpha)assert(Math.abs(alpha-expected)<=1,'uneven opacity or softened silhouette edge');if(y>=bounds.feet)assert(alpha<=7,'feet remain too visible');}
    }
    if(v.hairShadow){assert(v.effects.graphics.depth<v.hairShadow.depth&&v.hairShadow.depth<v.body.depth,'hair not behind submerged body');assert(v.hairShadow.x===p.sprite.x&&v.hairShadow.y===p.sprite.y,'hair not aligned');}
    const {area,largest,parts}=analyze(rgba,cut);
    minArea=Math.min(minArea,area);maxArea=Math.max(maxArea,area);
    minConnected=Math.min(minConnected,largest/area);maxParts=Math.max(maxParts,parts);frames.add(v.body.frame.name);
   }
   assert(frames.size===12,'not twelve dedicated body frames');assert(minArea/maxArea>.76,'body loses too much volume');assert(window.allowDiagnostic||maxParts<=baseline.parts,`detached limb ${id}/${direction}: ${maxParts} vs ${baseline.parts}`);
   result.push({id,direction,minArea,maxArea,maxParts,minConnected,originalParts:baseline.parts,hairPixels,waist:bounds.waist,feetFadeRow:bounds.feet});
   // Idle must keep the underwater body alive, with no allocations or head changes.
   const idle=new Set();for(let n=0;n<180;n++){v.update(p.sprite,p.x,p.y,direction,false,1/60,1,undefined,.55);idle.add(v.body.frame.name);}
   assert(idle.size>=7,'idle body frozen');assert(p.sprite.frame.name===head,'idle head altered');
   // Full original walking poses remain synchronized until neck-deep water.
   for(const depth of [.25,.5,.875])for(let phase=1;phase<=v.appearance.walkFrames;phase++){
    const row=Math.floor(head/(v.appearance.walkFrames+1)),walking=row*(v.appearance.walkFrames+1)+phase;
    v.update(p.sprite,p.x,p.y,direction,true,0,depth,walking,.55);
    assert(p.sprite.frame.name===walking,'walking stops before neck depth');
    assert(v.body.frame.name%(v.appearance.walkFrames+13)===phase,'body and walking pose mismatch');
   }
  }
  assert(textureCount===Object.keys(game.textures.list).length&&objects===review.children.list.length,'per-frame allocation');
  return{actors:result,renderer:game.renderer.type};
  function assert(ok,message){if(!ok)throw Error(message)}
  function analyze(rgba,cut){const alpha=new Uint8Array(192*256);let area=0;for(let i=cut*192;i<alpha.length;i++){alpha[i]=rgba[i*4+3]>0?1:0;area+=alpha[i];}let largest=0,parts=0;
   for(let start=0;start<alpha.length;start++)if(alpha[start]){let size=0,queue=[start];alpha[start]=0;for(let n=0;n<queue.length;n++){const i=queue[n];size++;for(const j of [i-192,i+192,...(i%192?[i-1]:[]),...(i%192<191?[i+1]:[])])if(j>=0&&j<alpha.length&&alpha[j]){alpha[j]=0;queue.push(j);}}largest=Math.max(largest,size);if(size>30)parts++;}return {area,largest,parts};}
 });


 if(process.env.QA_DEBUG){const debug=await page.evaluate(async()=>{const {drawStyledCharacter}=await import('/src/character-sprites.ts'),{prepareSubmergedRig,drawSubmergedBody}=await import('/src/swimming/body-animation.ts');const a=reviewPlayers.find(a=>a.id==='farmer-female'&&a.direction==='down-left'),p=a.p,source=document.createElement('canvas');source.width=192;source.height=256;drawStyledCharacter(source.getContext('2d'),p.profile,a.direction,0);const cut=p.swimmingVisual.appearance.headBottom[a.direction],rig=prepareSubmergedRig(source,a.direction,cut),out=document.createElement('canvas');out.width=768;out.height=3*150;const g=out.getContext('2d');for(let i=0;i<12;i++){g.save();g.translate(i%4*192,Math.floor(i/4)*150-cut);drawSubmergedBody(g,rig,i/12,a.direction);g.restore();}return out.toDataURL('image/png').split(',')[1];});fs.writeFileSync('/tmp/swim-kick-debug.png',Buffer.from(debug,'base64'));}
 if(process.env.QA_DEBUG){const data=await page.evaluate(async()=>{
  const {drawStyledCharacter}=await import('/src/character-sprites.ts'),{prepareSubmergedRig,drawSubmergedBody}=await import('/src/swimming/body-animation.ts');
  const selected=reviewPlayers.filter(a=>a.id==='farmer-female'),canvas=document.createElement('canvas');canvas.width=192*8;canvas.height=256*3;const g=canvas.getContext('2d');
  for(const [col,{p,direction}]of selected.entries()){
   const source=document.createElement('canvas');source.width=192;source.height=256;drawStyledCharacter(source.getContext('2d'),p.profile,direction,0);const rig=prepareSubmergedRig(source,direction,p.swimmingVisual.appearance.headBottom[direction]);
   for(let row=0;row<3;row++){g.save();g.translate(col*192,row*256);drawSubmergedBody(g,rig,row/3,direction);g.restore();}
  }return canvas.toDataURL('image/png').split(',')[1];});fs.writeFileSync('/tmp/swim-body-debug.png',Buffer.from(data,'base64'));}
 const out='docs/personagens/nado-corpo';fs.mkdirSync(out,{recursive:true});
 for(let phase=0;phase<12;phase++){
  await page.evaluate(phase=>{for(const {p,direction}of reviewPlayers){const v=p.swimmingVisual;v.clock.cycle=phase/12;v.update(p.sprite,p.x,p.y,direction,true,0,1,undefined,.55);}},phase);
  await page.waitForTimeout(60);await page.screenshot({path:`${out}/frame-${String(phase).padStart(2,'0')}${process.env.QA_CANVAS?'-canvas':''}.png`});
 }

 if(!process.env.QA_CANVAS){
  await page.evaluate(()=>{
   for(const obj of review.children.list)if(obj.type==='Text')obj.setVisible(false);
   for(const {p}of reviewPlayers)p.setVisible(false);
   window.closePlayers=reviewPlayers.filter(a=>['down','left'].includes(a.direction));review.cameras.main.setZoom(4).centerOn(160,100);
   review.add.text(160,3,'Nado · corpo submerso',{fontSize:'8px',color:'#f6e5be',fontFamily:'Georgia'}).setOrigin(.5,0);
   for(const [i,a]of closePlayers.entries()){a.p.x=i%2?240:80;a.p.y=i<2?65:150;a.p.setVisible(true);review.add.text(a.p.x,i<2?28:113,`${i<2?'Fazendeira':'Fazendeiro'} · ${a.direction==='down'?'frente':'esquerda'}`,{fontSize:'6px',color:'#fff5db',fontFamily:'Arial'}).setOrigin(.5,0);}
  });
  for(let phase=0;phase<12;phase++){
   await page.evaluate(phase=>{for(const {p,direction}of closePlayers){const v=p.swimmingVisual;v.clock.cycle=phase/12;v.update(p.sprite,p.x,p.y,direction,true,0,1,undefined,.55);}},phase);
   await page.waitForTimeout(60);await page.screenshot({path:`${out}/close-${String(phase).padStart(2,'0')}.png`});
  }
 }
 assert.ok(report.actors.every(a=>a.maxParts<=a.originalParts),'detached parts remain; see debug capture');assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/validacao${process.env.QA_CANVAS?'-canvas':''}.json`,JSON.stringify({passed:true,...report,checks:['unchanged original head in all frames','dedicated underwater cycle in all eight directions','animated idle without new objects/textures','rear arc behind body and front arc above water but below head','front arc crosses submerged silhouette','continuous curved ripples without square mask clipping','no arm or leg above the waterline','body volume retained','no added detached parts compared with original sprites','crisp silhouette edges with a smooth waist-to-feet gradient','female submerged hair shadow','near-invisible feet','walking preserved until neck-deep water'],at:new Date().toISOString()},null,2));console.log(JSON.stringify(report));console.log('PASS underwater body animation and ripple ordering');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
