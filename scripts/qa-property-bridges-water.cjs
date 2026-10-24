const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const dir='docs/cenarios/propriedade-pontes-agua';fs.mkdirSync(`${dir}/frames`,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  const attach=()=>page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.valley=game.scene.getScene('Vale');
   game.loop.sleep();window.qt=valley.time.now;window.step=ms=>{qt+=ms;game.step(qt,ms);};
   window.clearKeys=()=>Object.values(valley.player.keys).forEach(k=>k.isDown=false);
  });
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5175');await page.locator('#new-game').click();
  await page.locator('#character-name').fill('Propriedade');await page.getByRole('button',{name:'Começar minha história'}).click();await attach();
  const initial=await page.evaluate(()=>{
   window.mapsBefore=JSON.stringify([valley.state.mapEdits,valley.state.forestMapEdits]);
   const trees=valley.children.list.filter(o=>o.texture&&/^asset-(tree|pine)-[012]$/.test(o.texture.key));
   return {trees:trees.length,variants:new Set(trees.map(t=>t.texture.key)).size,scales:new Set(trees.map(t=>t.scaleX)).size,
    rocks:valley.children.list.filter(o=>o.texture?.key.startsWith('lake-rock-')).length,
    layers:valley.children.list.filter(o=>o.texture?.key.startsWith('bridge-v2:')).map(o=>({key:o.texture.key,depth:o.depth}))};
  });assert.ok(initial.variants>=5&&initial.scales>=5&&initial.rocks>0);assert.equal(initial.layers.length,6);
  const bridges=await page.evaluate(async()=>{const {PROPERTY_BRIDGES}=await import('/src/data/bridges.ts');window.bridges=PROPERTY_BRIDGES;return PROPERTY_BRIDGES;});
  const results=[];
  for(const bridge of bridges){
   const result=await page.evaluate(b=>{
    const scene=valley,p=scene.player;const left=b.x*32,right=(b.x+b.width)*32,top=b.y*32,bottom=(b.y+2)*32;
    const place=(x,y)=>{clearKeys();p.x=x;p.y=y;p.update(0,scene.movementBlocked,scene.movementBlockedPoint,true,scene.swimmingPoint);};
    const run=(key,frames=330)=>{clearKeys();p.keys[key].isDown=true;for(let i=0;i<frames;i++)scene.update(0,1000/60);clearKeys();};
    place(left-18,top+32);run('D');const east=p.x>right+8;
    place(right+18,top+32);run('A');const west=p.x<left-8;
    const cx=(left+right)/2;
    place(cx,top-18);run('S',240);const north={blocked:p.y<top,position:{x:p.x,y:p.y},depth:p.waterDepth};
    place(cx,bottom+18);run('W',240);const south={blocked:p.y>=bottom,position:{x:p.x,y:p.y},depth:p.waterDepth};
    place(cx,top+32);run('W',120);const railFromDeck=p.y>=top+11-.05;
    place(left-18,top+32);run('D',120);
    scene.cameras.main.stopFollow().setZoom(2).centerOn(cx,top+16);step(0);
    document.querySelector('#ui').style.visibility='hidden';
    return {id:b.id,east,west,north,south,railFromDeck};
   },bridge);
   results.push(result);assert.equal(result.east,true,`${bridge.id}: cross east`);assert.equal(result.west,true,`${bridge.id}: cross west`);
   assert.equal(result.north.blocked,true);assert.equal(result.south.blocked,true);assert.equal(result.railFromDeck,true);
   await page.screenshot({path:`${dir}/ponte-${bridge.id}.png`});
   await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';});
  }
  console.log('both bridges: crossings east/west, both water sides and deck rails OK');
  const coast=await page.evaluate(async()=>{
   const {riverBanksAt,shoreSandAt,isWaterPoint,PROPERTY_RIVER_WIDTH}=await import('/src/data/property-water.ts');
   const trees=valley.world.resources.filter(n=>n.kind==='standingTree');
   const wetTrees=trees.filter(t=>!valley.world.canPlantTree(t.x,t.y));
   const source=valley.textures.get('world-ground-sandy-river-v3').getSourceImage(),ctx=source.getContext('2d');
   const sample=(x,y)=>Array.from(ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data);
   const banks=riverBanksAt(30*32);
   const places=[{name:'river',x:banks.right+12,y:30*32},{name:'home-lake',x:36.5*32,y:(30.5+Math.sqrt(15))*32+12},{name:'east-lake',x:80.5*32,y:(10.5+Math.sqrt(10))*32+12}];
   let partial;
   for(let y=2;y<69&&!partial;y++)for(let x=2;x<94;x++)if(!valley.world.isWater(x,y)&&!valley.world.canPlantTree(x,y)&&!valley.world.isBlocked(x,y)&&!valley.world.resourceAt(x,y)&&!bridges.some(b=>x>=b.x&&x<b.x+b.width&&y>=b.y&&y<b.y+b.height)&&[[2,2],[30,30],[30,2],[2,30]].some(([dx,dy])=>isWaterPoint(x*32+dx,y*32+dy))){partial={x,y};break;}
   return {width:PROPERTY_RIVER_WIDTH,treeCount:trees.length,wetTrees:wetTrees.map(t=>t.id),partial,
    sand:places.map(p=>({...p,pixel:sample(p.x,p.y),weight:shoreSandAt(p.x,p.y).weight,wet:isWaterPoint(p.x,p.y)}))};
  });
  assert.equal(coast.width,160);assert.deepEqual(coast.wetTrees,[]);assert.ok(coast.partial);
  for(const p of coast.sand){assert.equal(p.wet,false);assert.ok(p.weight>.8);assert.ok(p.pixel[0]>p.pixel[1]&&p.pixel[1]>p.pixel[2]);}
  for(const shot of [{name:'casa-caminho-ponte',x:33.5,y:16.5,zoom:1.4},{name:'lago-areia-natural',x:36.5,y:30.5,zoom:2},{name:'lago-leste-areia',x:80.5,y:10.5,zoom:2}]){
   await page.evaluate(s=>{clearKeys();valley.cameras.main.stopFollow().setZoom(s.zoom).centerOn(s.x*32,s.y*32);document.querySelector('#ui').style.visibility='hidden';step(0);},shot);
   await page.screenshot({path:`${dir}/${shot.name}.png`});
   await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';});
  }

  const water=await page.evaluate(()=>{
   const sprites=valley.children.list.filter(o=>o.getData?.('water-surface'));
   let wetPixels=0,dryLeaks=0,bridgeLeaks=0;
   const checked=new Map();
   for(const s of sprites){
    let data=checked.get(s.texture.key);
    if(!data){const c=s.texture.getSourceImage();data={width:c.width,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};checked.set(s.texture.key,data);}
    for(let f=0;f<64;f+=8)for(let y=0;y<32;y+=2)for(let x=0;x<32;x+=2){
     if(!data.pixels[(y*data.width+f*32+x)*4+3])continue;
     wetPixels++;if(!valley.world.isSwimmingPoint(s.x+x+.5,s.y+y+.5))dryLeaks++;
     if(bridges.some(b=>s.x>=b.x*32&&s.x<(b.x+b.width)*32&&s.y>=b.y*32&&s.y<(b.y+b.height)*32))bridgeLeaks++;
    }
   }
   const first=sprites[0];const before=first.anims.currentFrame.index;step(250);step(250);
   return {sprites:sprites.length,textures:checked.size,wetPixels,dryLeaks,bridgeLeaks,animated:first.anims.currentFrame.index!==before};
  });assert.ok(water.sprites>100&&water.wetPixels>0&&water.animated);assert.equal(water.dryLeaks,0);assert.equal(water.bridgeLeaks,0);
  // Plant four original garden cells and water only the lower two through the real tool impact.
  const soil=await page.evaluate(()=>{
   clearKeys();valley.inventory.data.seeds=4;valley.state.homeSupplies={wateringCan:true,seedPacket:true};valley.state.wateringCanWater=8;
   const points=[{x:23,y:21},{x:24,y:21},{x:23,y:22},{x:24,y:22}];
   for(const p of points){
    valley.player.x=(p.x-.5)*32;valley.player.y=(p.y+.5)*32;valley.player.update(0,valley.movementBlocked,valley.movementBlockedPoint,true,valley.swimmingPoint);
    valley.selectTool('plant');valley.nextInteractionAt=0;valley.interact(p);
   }
   for(const p of points.slice(2)){
    valley.player.x=(p.x-.5)*32;valley.player.y=(p.y+.5)*32;valley.selectTool('water');valley.nextInteractionAt=0;valley.interact(p);step(250);step(250);
   }
   const imageAt=p=>valley.soilSprites.find(s=>s.x===p.x*32&&s.y===p.y*32);
   const dry=imageAt(points[0]),wet=imageAt(points[2]);
   const brightness=s=>{const canvas=s.texture.getSourceImage(),a=canvas.getContext('2d').getImageData(0,0,32,32).data;let sum=0,n=0;for(let i=0;i<a.length;i+=4)if(a[i+3]){sum+=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;n++;}return sum/n;};
   valley.cameras.main.stopFollow().setZoom(4).centerOn(24*32,22*32);step(0);document.querySelector('#ui').style.visibility='hidden';
   return {dryKey:dry.texture.key,wetKey:wet.texture.key,dry:valley.textures.getBase64(dry.texture.key),wet:valley.textures.getBase64(wet.texture.key),dryBrightness:brightness(dry),wetBrightness:brightness(wet),water:valley.state.wateringCanWater,count:valley.farming.crops.length};
  });
  assert.equal(soil.count,4);assert.equal(soil.water,6);assert.ok(soil.wetBrightness<soil.dryBrightness*.8);assert.match(soil.dryKey,/:dry:/);assert.match(soil.wetKey,/:wet:/);
  for(const kind of ['dry','wet'])fs.writeFileSync(`${dir}/solo-${kind==='dry'?'seco':'molhado'}.png`,Buffer.from(soil[kind].split(',')[1],'base64'));
  await page.screenshot({path:`${dir}/canteiro-seco-e-molhado.png`});
  await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';valley.persist();});
  await page.reload();await page.locator('#continue-game').click();await attach();
  assert.equal(await page.evaluate(()=>valley.farming.cropAt(23,22).watered),true);
  assert.match(await page.evaluate(()=>valley.soilSprites.find(s=>s.x===23*32&&s.y===22*32).texture.key),/:wet:/);
  assert.equal(await page.evaluate(()=>valley.state.wateringCanWater),6);
  // Capture the actual render loop. Sixty-four frames at 16 FPS form one complete wave cycle.
  await page.evaluate(()=>{clearKeys();valley.cameras.main.stopFollow().setZoom(2).centerOn(36.5*32,30.5*32);document.querySelector('#ui').style.visibility='hidden';step(0);});
  for(let f=0;f<64;f++){await page.evaluate(()=>step(62.5));await page.screenshot({path:`${dir}/frames/frame-${String(f).padStart(3,'0')}.png`,clip:{x:320,y:180,width:640,height:400}});}
  await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';});
  console.log('smooth water masks, native soil dry/wet art, real watering and save/reload OK');
  await page.evaluate(()=>{document.querySelector('#ui').style.visibility='';game.loop.wake();valley.openMapEditor();});
  await page.waitForSelector('.map-editor-ui');
  const treePlacement=await page.evaluate(p=>{const e=game.scene.getScene('Editor').editor;return ['standingTree','pine','oakA','pineC'].map(kind=>e.adapter.canPlace(p.x,p.y,undefined,kind));},coast.partial);
  assert.deepEqual(treePlacement,[false,false,false,false]);
  await page.locator('[data-action="cancel"]').click();await page.evaluate(()=>{game.loop.sleep();});
  // Author's terrain, objects, entry and exit positions have not been rewritten by this visual update.
  const maps=await page.evaluate(async()=>{const {defaultMap}=await import('/src/data/default-maps.ts');return JSON.stringify([valley.state.mapEdits,valley.state.forestMapEdits])===JSON.stringify([defaultMap('property'),defaultMap('forest')]);});
  assert.equal(maps,true);
  await page.evaluate(()=>{clearKeys();game.loop.wake();const gate=valley.forestGate();valley.player.x=gate.x*32+16;valley.player.y=gate.y*32+16;valley.nextInteractionAt=0;valley.selectTool('hand');});
  await page.keyboard.press('e');await page.waitForSelector('#ui[data-area="forest"]');
  const forestWater=await page.evaluate(()=>{
   const forest=game.scene.getScene('Floresta');game.loop.sleep();const water=forest.children.list.filter(o=>o.getData?.('water-surface'));
   const before=water[0].anims.currentFrame.index;step(250);step(250);return {sprites:water.length,animated:water[0].anims.currentFrame.index!==before,crops:forest.state.crops.filter(c=>c.watered).length};
  });assert.ok(forestWater.sprites>20&&forestWater.animated);assert.equal(forestWater.crops,2);
  assert.deepEqual(errors,[]);
  const {dry,wet,...soilMetrics}=soil;
  fs.writeFileSync(`${dir}/validacao.json`,JSON.stringify({passed:true,initial,coast,treePlacement,bridges:results,water,soil:soilMetrics,forestWater,authorMapsPreserved:maps,pageErrors:errors,at:new Date().toISOString()},null,2));
  console.log('PASS: property art, both bridges, water animation, dry/wet soil and forest transition');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
