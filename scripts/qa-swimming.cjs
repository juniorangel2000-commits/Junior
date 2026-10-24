const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const dirs=[['down',0,1],['down-left',-.70710678,.70710678],['left',-1,0],['up-left',-.70710678,-.70710678],['up',0,-1],['up-right',.70710678,-.70710678],['right',1,0],['down-right',.70710678,.70710678]];
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(30000);
 if(process.env.QA_CANVAS)await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'||type==='experimental-webgl'?null:original.call(this,type,...args);};});
 const attach=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');window.forest=game.scene.getScene('Floresta');});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();await page.locator('#character-name').fill('Natação');await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
 await page.evaluate(()=>{const exit=valley.state.mapEdits.points.exit;valley.player.x=(exit.x+.5)*32;valley.player.y=(exit.y+.5)*32;valley.nextInteractionAt=0;});await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');await attach();
 const renderer=await page.evaluate(()=>game.renderer.type);assert.equal(renderer,process.env.QA_CANVAS?1:2);
 // Test all shoreline headings on the real authored terrain, preserving real obstacle collision.
 const shoreline=await page.evaluate(dirs=>{
  const p=forest.player,keys=p.keys,results=[];forest.scene.pause();
  const clear=(x,y)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([ox,oy])=>!forest.movementBlockedAt(Math.floor((x+ox)/32),Math.floor((y+oy)/32)));
  const release=()=>Object.values(keys).forEach(k=>k.isDown=false);
  const press=(dx,dy)=>{release();keys[dx<0?'A':'D'].isDown=dx!==0;keys[dy<0?'W':'S'].isDown=dy!==0;};
  for(const [name,dx,dy] of dirs){
   let route;
   search:for(let y=7*32;y<26*32;y+=8)for(let x=41*32;x<70*32;x+=8){if(forest.swimmingPoint(x,y)!==1||!clear(x,y))continue;
    for(let distance=8;distance<=200;distance+=4){const px=x-dx*distance,py=y-dy*distance;if(!clear(px,py))break;if(!forest.waterContains(px,py)){
      route={x,y,sx:px,sy:py};break search;
    }}
   }
   if(!route)throw Error(`no unobstructed shoreline route ${name}`);
   p.x=route.sx;p.y=route.sy;release();p.update(0,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);if(p.isSwimming)throw Error('starts on land');press(dx,dy);
   let shallow=false;for(let i=0;i<600&&!p.isSwimming;i++){p.update(1/60,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);if(p.waterDepth>0&&!p.isSwimming)shallow=true;}
   if(!p.isSwimming)throw Error(`failed water entry ${name}`);press(-dx,-dy);
   for(let i=0;i<600&&forest.waterContains(p.x,p.y);i++)p.update(1/60,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);
   release();for(let i=0;i<80;i++)p.update(1/60,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);
   if(p.isSwimming||p.sprite.isCropped||p.swimmingVisual.body.visible||(p.swimmingVisual.effects.graphics.visible||p.swimmingVisual.effects.frontGraphics.visible))throw Error(`unclean water exit ${name}`);
   if(!shallow)throw Error(`no shallow transition ${name}`);results.push(name);
  }
  release();forest.scene.resume();return results;
 },dirs);assert.equal(shoreline.length,8);console.log('shorelines OK');
 const actors=[];
 for(const id of ['farmer-female','farmer-male']){
  const result=await page.evaluate(async({id,dirs})=>{
   const {Player}=await import('/src/player.ts'),{HEAD_BOTTOM}=await import('/src/swimming/config.ts');
   forest.player.sprite.destroy();forest.state.profile.characterId=id;forest.player=new Player(forest,forest.state.profile,60.5*32,14.5*32,`swim-qa-${id}`);forest.zoom=2;forest.applyCamera();forest.scene.pause();
   const p=forest.player,keys=p.keys,release=()=>Object.values(keys).forEach(k=>k.isDown=false),update=dt=>p.update(dt,forest.movementBlockedAt,undefined,true,forest.swimmingPoint);update(0);
   const original=p.sprite.texture.key,visual=p.swimmingVisual,states=[];
   if(!p.isSwimming)throw Error('test point must be deep water');const count=forest.children.list.length,textureCount=Object.keys(game.textures.list).length;
   const check=(direction)=>{
    const s=p.sprite,b=visual.body,w=visual.surface;
    if(s.texture.key!==original||!s.isCropped||s._crop.height!==HEAD_BOTTOM[id][direction])throw Error(`head crop ${id}/${direction}: ${s._crop.height}`);
    if(b.x!==s.x||b.y!==s.y||b.scaleX!==s.scaleX||b.displayOriginY!==s.displayOriginY)throw Error('body alignment');
    if(!(b.depth<w.depth&&w.depth<s.depth))throw Error('layer order');
    if(Math.abs(b.alpha-.45)>.001)throw Error('body opacity');
    const source=s.texture.getSourceImage(),tint=b.texture.getSourceImage(),mask=w.texture.getSourceImage();
    const g=source.getContext('2d'),ink=tint.getContext('2d'),water=mask.getContext('2d');
    const f=b.frame,h=s.frame,bodyPixels=ink.getImageData(f.cutX,f.cutY+HEAD_BOTTOM[id][direction],192,256-HEAD_BOTTOM[id][direction]).data;
    const waterPixels=water.getImageData(f.cutX,f.cutY+HEAD_BOTTOM[id][direction],192,256-HEAD_BOTTOM[id][direction]).data;
    let opaque=0;for(let i=0;i<bodyPixels.length;i+=4)if(bodyPixels[i+3]){opaque++;if(bodyPixels[i+3]>=64&&(Math.abs(bodyPixels[i]-0x16)>2||Math.abs(bodyPixels[i+1]-0x4f)>2||Math.abs(bodyPixels[i+2]-0x5a)>2))throw Error('incorrect silhouette color');if(!waterPixels[i+3])throw Error('water does not cover body');}
    if(opaque<1000)throw Error('missing body silhouette');
    // Head must be the exact original pose, not a tinted or generated replacement.
    if(!g.getImageData(h.cutX,h.cutY,192,HEAD_BOTTOM[id][direction]).data.some((v,i)=>i%4===3&&v))throw Error('missing original head');
   };
   for(const [direction,dx,dy]of dirs){release();p.x=60.5*32;p.y=14.5*32;p.facing={x:dx,y:dy};update(0);check(direction);
    keys[dx<0?'A':'D'].isDown=dx!==0;keys[dy<0?'W':'S'].isDown=dy!==0;const frames=new Set();for(let i=0;i<100;i++){update(1/60);frames.add(visual.body.frame.name);}
    if(p.swimState!==`swim_${direction}`)throw Error(`wrong state ${p.swimState}`);if(frames.size<3)throw Error('body does not animate');check(direction);states.push(p.swimState);
   }
   release();p.x=60.5*32;p.y=14.5*32;p.facing={x:0,y:1};update(0);update(.1);if(p.swimState!=='swim_idle')throw Error('no idle');
   const y=p.sprite.y;update(.1);if(y===p.sprite.y)throw Error('no buoyancy');
   if(count!==forest.children.list.length||textureCount!==Object.keys(game.textures.list).length)throw Error('objects allocated per frame');
   // Original collision box and bounds remain active while swimming.
   p.x=150;p.y=150;keys.D.isDown=true;for(let i=0;i<180;i++)p.update(1/60,tx=>tx>=6,undefined,true,()=>1);if(p.x>6*32-7+.01)throw Error('swam through obstacle');
   release();p.x=60.5*32;p.y=14.5*32;p.facing={x:0,y:1};update(0);forest.updateHUD();forest.cameras.main.preRender();
   return {id,states,bodyAlpha:visual.body.alpha,headCut:p.sprite._crop.height,renderer:game.renderer.type};
  },{id,dirs});actors.push(result);console.log(id,'poses OK');
  await page.screenshot({path:`docs/cenarios/nado-${id==='farmer-female'?'feminino':'masculino'}${process.env.QA_CANVAS?'-canvas':''}.png`});
  await page.evaluate(()=>{window.resumeTime=forest.elapsed;forest.scene.resume();});await page.waitForFunction(()=>forest.elapsed>resumeTime);
 }
 await page.keyboard.press('i');await page.locator('.inventory-card').waitFor();const frozen=await page.evaluate(()=>forest.player.x);await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.equal(await page.evaluate(()=>forest.player.x),frozen);await page.keyboard.press('Escape');
 await page.evaluate(()=>forest.persist());const position=await page.evaluate(()=>({x:forest.player.x,y:forest.player.y}));
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="forest"]');await attach();await page.waitForFunction(()=>forest.player.isSwimming);
 assert.ok(Math.abs(await page.evaluate(()=>forest.player.x)-position.x)<1);assert.equal(await page.evaluate(()=>forest.player.sprite._crop.height),110);
 await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');assert.equal(await page.evaluate(()=>forest.player.swimmingVisual.body.visible),false);await page.locator('[data-action="cancel"]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});await page.waitForFunction(()=>forest.player.swimmingVisual.body.visible);
 await page.evaluate(()=>{const e=forest.exit();forest.player.x=(e.x+.5)*32;forest.player.y=(e.y+.5)*32;});await page.waitForFunction(()=>!forest.player.isSwimming);await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="property"]');await attach();
 const propertyWater=await page.evaluate(()=>{for(let y=4;y<68;y++)for(let x=4;x<92;x++)if(valley.swimmingPoint(x*32+16,y*32+16)===1&&!valley.world.isSolid(x,y))return{x:x*32+16,y:y*32+16};throw Error('No deep water in property');});
 await page.evaluate(p=>{valley.player.x=p.x;valley.player.y=p.y;},propertyWater);await page.waitForFunction(()=>valley.player.isSwimming);await page.evaluate(()=>valley.persist());
 await page.reload();await page.locator('#continue-game').click();await page.waitForSelector('#ui[data-area="property"]');await attach();await page.waitForFunction(()=>valley.player.isSwimming);assert.ok(Math.abs(await page.evaluate(()=>valley.player.x)-propertyWater.x)<1);
 assert.deepEqual(errors,[]);const report={passed:true,renderer:process.env.QA_CANVAS?'Canvas':'WebGL',actors,shoreline,checks:['original head textures and per-view crops','body silhouette color, coverage and alignment','layer order','eight shore entry and exit directions','shallow walking','obstacle collision','idle and eight animated states','no frame allocations','inventory pause','save reload in forest and property','editor hides and restores swim layers','scene transition','land restoration'],at:new Date().toISOString()};fs.writeFileSync(`docs/cenarios/validacao-nado${process.env.QA_CANVAS?'-canvas':''}.json`,JSON.stringify(report,null,2));console.log('PASS',report.renderer,'head-only swimming, both characters and real shoreline in eight directions');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
