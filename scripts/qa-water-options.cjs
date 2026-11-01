const {chromium}=require('playwright'),fs=require('node:fs');
const out='/workspace/water-options';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(180000);
 try{
  await page.goto('http://127.0.0.1:5190');await page.locator('#edit-map').click();await page.locator('.map-editor-ui').waitFor();
  const data=await page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src),{paintTerrain}=await import('/src/terrain-art.ts'),{readTerrainSprites}=await import('/src/terrain-sprites.ts'),{forestGroundPixels}=await import('/src/forest-ground.ts'),{forestWaterDistanceAt}=await import('/src/data/ancient-forest.ts');
   const sprites=readTerrainSprites(game.scene.getScene('Editor')),urls=[];
   for(const style of ['legacy','textured','property','forest']){
    const tile=document.createElement('canvas');tile.width=tile.height=96;const t=tile.getContext('2d');
    if(style==='textured')t.putImageData(new ImageData(sprites.water.pixels,96,96),0,0);
    else if(style==='forest'){
     let point;for(let y=4;y<68&&!point;y++)for(let x=4;x<92;x++)if(forestWaterDistanceAt(x*32,y*32)<-80){point={x:x*32-48,y:y*32-48};break;}
     t.putImageData(new ImageData(forestGroundPixels(sprites,point.x,point.y,96),96,96),0,0);
    }else{
     const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const c=canvas.getContext('2d');paintTerrain(c,style==='legacy'?undefined:sprites);t.drawImage(canvas,2528,288,96,96,0,0,96,96);
    }
    urls.push(tile.toDataURL());
   }return urls;
  });
  for(let i=0;i<data.length;i++)fs.writeFileSync(out+`/agua-${i+1}.png`,Buffer.from(data[i].split(',')[1],'base64'));
  const names=['1 · Antiga, desenhada pelo código','2 · Textura azul-esverdeada','3 · Acabamento da propriedade','4 · Acabamento da floresta'];
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#172d27;color:#efead5;font-family:Arial,sans-serif}h1{font-size:28px;margin:0 0 10px}p{margin:0 0 25px;color:#c5d0bd}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{padding:14px;background:#263e34;border:1px solid #8c9670;border-radius:10px}h2{font-size:20px;margin:0 0 14px}.swatch{height:260px;border-radius:5px;image-rendering:pixelated;background-size:192px 192px}</style></head><body><h1>Águas que já usamos no After Rain</h1><p>Amostras reais do código e dos materiais do projeto, ampliadas para comparação.</p><div class="grid">${data.map((url,i)=>`<section class="card"><h2>${names[i]}</h2><div class="swatch" style="background-image:url(${url})"></div></section>`).join('')}</div></body></html>`);
  await page.screenshot({path:out+'/opcoes-de-agua.png',fullPage:true});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
