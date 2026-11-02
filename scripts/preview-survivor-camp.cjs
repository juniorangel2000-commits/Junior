const{chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='/workspace/acampamento-sobreviventes';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{const page=await browser.newPage({viewport:{width:1440,height:1080}});page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Prévia do acampamento');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');await page.evaluate(async()=>{
const{game}=await import(document.querySelector('script[src*="main.ts"]').src),{readTerrainSprites}=await import('/src/terrain-sprites.ts'),{Player}=await import('/src/player.ts'),{createCharacterProfile}=await import('/src/data/characters.ts');
window.previewGame=game;const base=game.scene.getScene('Vale'),sprites=readTerrainSprites(base);if(!sprites)throw Error('missing terrain art');game.scene.stop('Vale');
game.scene.add('CampPreview',{
 preload(){this.load.image('camp-preview-props','/docs/cenarios/acampamento-sobreviventes/sprites-acampamento.png');this.load.image('camp-preview-fences','/docs/cenarios/acampamento-sobreviventes/cercas-e-barreiras.png');},
 create(){const W=1600,H=1200,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(W,H),clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},hash=(x,y)=>{let n=(Math.imul(x+39,73856093)^Math.imul(y+17,19349663))>>>0;n=Math.imul(n^(n>>>16),2246822507);n=Math.imul(n^(n>>>13),3266489909);return((n^(n>>>16))>>>0)/4294967296;};
 const lines=[[800,1250,790,860],[790,860,815,620],[815,620,565,470],[815,620,1110,500],[790,860,395,805],[790,860,1170,855]],distance=(x,y)=>Math.min(...lines.map(([a,b,c,d])=>{const dx=c-a,dy=d-b,t=clamp(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy));return Math.hypot(x-a-t*dx,y-b-t*dy);}));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=(Math.hypot((x-805)/620,(y-675)/480)-1)*400+Math.sin(x*.019+y*.011)*16+Math.sin(y*.039)*10,clearing=smooth((36-edge)/70),trail=distance(x,y)+Math.sin(x*.039+y*.027)*6+Math.sin(y*.077)*3,dirt=Math.max(smooth((41-trail)/27),Math.max(0,1-Math.hypot((x-810)/230,(y-685)/170))*.46),moss=sprites.forest,grass=sprites.grass,path=sprites['path-dry'],i=(y*W+x)*4,j=((y%96)*96+x%96)*4;for(let k=0;k<3;k++){const green=moss.pixels[j+k]*(1-clearing)+grass.pixels[j+k]*clearing;pixels.data[i+k]=green*(1-dirt*.86)+path.pixels[j+k]*dirt*.86;}pixels.data[i+3]=255;}
 ctx.putImageData(pixels,0,0);this.textures.addCanvas('camp-preview-ground',canvas);this.add.image(0,0,'camp-preview-ground').setOrigin(0).setDepth(-100);
 const tex=this.textures.get('camp-preview-props');for(const[name,x,y,w,h]of[['beige',80,5,760,575],['olive',855,95,630,505],['fire',275,582,445,425],['supplies',875,630,555,365]])tex.add(name,0,x,y,w,h);
 const add=(key,x,y,w,h,pivot=1)=>this.textures.exists(key)?this.add.image(x,y,key).setOrigin(.5,pivot).setDisplaySize(w,h).setDepth(y):null;
 // Uneven forest rim; leave the southern approach open.
 for(let row=0;row<3;row++)for(let col=0;col<14;col++){const x=40+col*120+hash(col,row)*50,y=55+row*95+hash(row,col)*50;add(`asset-${hash(col,row)>.7?'pine':'tree'}-${col%3}`,x,y,180+hash(col,row)*70,220+hash(row,col)*75,128/132);}
 for(let row=2;row<12;row++)for(let side=0;side<2;side++)for(let col=0;col<2;col++){const x=side?1510-col*120+hash(row,col)*35:col*115+hash(col,row)*35,y=170+row*91+hash(row,side)*38;add(`asset-${row%4===0?'pine':'tree'}-${(row+col)%3}`,x,y,185+hash(row,col)*50,240+hash(col,row)*55,128/132);}
 for(let i=0;i<10;i++){if(i>=4&&i<=6)continue;const x=75+i*165,y=1200+hash(i,21)*50;add(`asset-tree-${i%3}`,x,y,215,275,128/132);}
 // Low vegetation and stones are kept clear of the main approach.
 for(let i=0;i<155;i++){const x=160+hash(i,34)*1280,y=290+hash(i,42)*800;if(distance(x,y)<53)continue;if(((x-805)/540)**2+((y-675)/410)**2<.55&&i%5!==0)continue;const keys=['forest-detail-fern','forest-detail-flowers','forest-detail-bush','forest-detail-mushrooms'],key=keys[i%4],size=18+hash(i,8)*20;add(key,x,y,size,size);}
 for(const[x,y,v]of[[310,400,0],[1260,350,1],[1380,700,2],[260,1000,0],[1290,1030,1],[1030,310,2]])add('lake-rock-'+v,x,y,58,58);
 const prop=(frame,x,y,width)=>{const f=tex.get(frame);const image=this.add.image(x,y,'camp-preview-props',frame).setOrigin(.5,.94).setDisplaySize(width,width*f.height/f.width).setDepth(y);return image;};
 prop('beige',565,470,230);prop('olive',1110,500,215);prop('olive',395,805,205).setFlipX(true);prop('beige',1170,855,225).setFlipX(true);prop('fire',810,690,95);prop('supplies',1005,665,105);prop('supplies',520,865,90);prop('supplies',1160,530,78);
 add('forest-detail-log',710,755,80,80).setRotation(.4);add('forest-detail-log',900,750,80,80).setRotation(-.4);
 const fences=this.textures.get('camp-preview-fences');fences.add('rustic',0,1100,135,850,480);
 const fence=(x,y,flip=false)=>this.add.image(x,y,'camp-preview-fences','rustic').setOrigin(.5,.95).setDisplaySize(151,58).setFlipX(flip).setDepth(y);
 for(const [i,x]of[425,575,725,875,1025,1175].entries())fence(x,322+(i%3)*3,i%2===1);
 for(const [i,x]of[410,560,1040,1190].entries())fence(x,1015+(i%2)*5,i%2===0);
 // The wide southern entrance stays open for arriving groups and retreat.
 // Illustrative occupants reuse the original player art, not new named NPCs.
 for(const[name,gender,x,y,face]of[['a','farmer-male',690,640,'right'],['b','farmer-female',925,705,'left'],['c','farmer-female',520,500,'down'],['d','farmer-male',820,1000,'up']]){const p=new Player(this,createCharacterProfile(name,gender),x,y,'camp-preview-human-'+name);p.facing=face==='up'?{x:0,y:-1}:face==='right'?{x:1,y:0}:face==='left'?{x:-1,y:0}:{x:0,y:1};p.update(0,()=>false,()=>false,false,()=>0);p.sprite.setDepth(y);}
 this.cameras.main.setBounds(0,0,W,H).setZoom(.9).centerOn(W/2,H/2);document.querySelector('#ui').style.display='none';window.campPreviewReady=true;
 }
},true);
});await page.waitForFunction(()=>window.campPreviewReady);await page.waitForTimeout(400);await page.screenshot({path:out+'/Acampamento-de-Sobreviventes-Previa.png'});assert.deepEqual(errors,[]);console.log(JSON.stringify({newSeparateScene:true,existingTerrainAndTrees:true,newProps:true,illustrativeOccupants:true,errors}));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
