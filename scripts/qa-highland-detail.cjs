const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{PNG}=require('pngjs');
const out='/workspace/alto-da-serra-qa';fs.mkdirSync(out,{recursive:true});
const original=PNG.sync.read(fs.readFileSync('public/assets/visual/highland/terrain.png')),shore=JSON.parse(fs.readFileSync('src/data/highland-river-contour.json'));
for(let y=0;y<shore.rows.length;y++)for(const[a,b]of shore.rows[y])for(let x=a;x<b;x++)original.data[(y*original.width+x)*4+3]=0;
const reference=process.env.HIGHLAND_GROUND_BEFORE?PNG.sync.read(fs.readFileSync(process.env.HIGHLAND_GROUND_BEFORE)):original,native=PNG.sync.write(reference);
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 for(const mode of['Antes','Depois']){
  const context=await browser.newContext({viewport:{width:1536,height:1024}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
  if(mode==='Antes')await page.route('**/assets/visual/highland/ground-detailed.png',route=>route.fulfill({body:native,contentType:'image/png'}));
  await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Serra QA');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const valley=game.scene.getScene('Vale');valley.scene.sleep();game.scene.start('Serra',{save:structuredClone(valley.state),ui:valley.ui,onReturn:()=>{}});});
  await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='highland');
  await page.evaluate(()=>{window.s=game.scene.getScene('Serra');s.setPaused(true);s.state.time=480;s.daylight.setVisible(false);document.querySelector('#ui').style.display='none';s.player.x=1180;s.player.y=340;s.player.update(0,s.blockedTile,s.movementBlockedPoint,false,s.swimmingPoint,s.allowStep);s.cameras.main.stopFollow().setZoom(2).centerOn(1152,256);s.cameras.main.resetFX();});
  await page.waitForTimeout(200);await page.screenshot({path:out+`/Plato-Nitidez-${mode}.png`});
  await page.evaluate(()=>{s.cameras.main.centerOn(460,620);});await page.screenshot({path:out+`/Terreno-Plato-${mode}.png`});
  const extent=await page.evaluate(()=>{const ground=s.children.list.find(o=>o.getData?.('highland-ground-detail')),image=ground.texture.getSourceImage();const c=document.createElement('canvas');c.width=c.height=2;const g=c.getContext('2d');const scale=image.width/1536;g.drawImage(image,800*scale,500*scale,scale,scale,0,0,2,2);return{width:image.width,height:image.height,worldWidth:ground.displayWidth,worldHeight:ground.displayHeight,waterAlpha:[...g.getImageData(0,0,2,2).data].filter((_,i)=>i%4===3)};});
  assert.deepEqual(extent,{width:mode==='Antes'?reference.width:3072,height:mode==='Antes'?reference.height:2048,worldWidth:1536,worldHeight:1024,waterAlpha:[0,0,0,0]});
  if(mode==='Depois'){await page.evaluate(()=>{s.daylight.setVisible(true);s.player.x=272;s.player.y=944;s.player.update(0,s.blockedTile,s.movementBlockedPoint,false,s.swimmingPoint,s.allowStep);s.cameras.main.stopFollow().setZoom(1).centerOn(768,512);});await page.waitForTimeout(120);await page.screenshot({path:out+'/Plato-Texturas-Refinadas-no-Jogo.png'});}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({mode,extent,approvedLayoutPreserved:true,errors}));await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
