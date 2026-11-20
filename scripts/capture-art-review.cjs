// Mostra os adaptadores reais numa cena de conferência, sem mudar saves nem
// alterar as sprites de origem. Vite em 5190; ffmpeg converte os quadros em GIF.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const out=process.argv[2]||'docs/planejamento/qa-arte-preview44',mode=process.argv[3]||'survivors';
fs.mkdirSync(out,{recursive:true});const frames=fs.mkdtempSync(path.join(os.tmpdir(),'art-review-'));
(async()=>{
 const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1200,height:mode.startsWith('tools')?1100:800}});p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5190');
  await p.evaluate(async mode=>{
   window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
   window.survivors=await import('/src/data/survivor-walk.ts');window.survivorView=await import('/src/property-survivors-view.ts');window.walkArt=await(await fetch('/assets/visual/characters/survivors/walk.json')).json();
   window.HorseMount=(await import('/src/horse-mount.ts')).HorseMount;window.ToolVisual=(await import('/src/tool-visual.ts')).ToolVisual;
   window.miningArt=await import('/src/player-mining-art.ts');window.toolArt=await import('/src/tool-visual.ts');window.economy=await import('/src/data/economy-art.ts');window.characters=await import('/src/data/characters.ts');window.dirs=['down','up','right','left'];window.items=[];window.reviewMode=mode;if(mode==='horse-diagonals')window.dirs=['down-left','down-right','up-left','up-right'];window.farmArt=await import('/src/farm-construction-view.ts');window.farmDefs=await import('/src/data/farm-buildings.ts');
   for(const s of game.scene.getScenes(true))game.scene.stop(s.scene.key);
   game.scene.add('ArtReview',{
    preload(){
     survivorView.preloadSurvivorViews(this);toolArt.preloadToolArt(this);if(reviewMode==='pigsty')farmArt.preloadFarmConstructionArt(this);
     for(const id of ['farmer-female','farmer-male']){
      const c=characters.resolveCharacter({characterId:id});
      for(const d of ['down','up','right','left','down-left','down-right','up-left','up-right']){
       const paths=characters.characterSourcePaths(id,d);
       paths.forEach((url,i)=>this.load.image(`${id}-${d}-${i}`,url));
      }
      this.load.spritesheet(`horse-rider-${id}`,`assets/animals/horse-rider/${id}.png`,{frameWidth:192,frameHeight:192});
     }
     this.load.atlas('animal-horse-animated','assets/animals/horse/atlas-packed.png','assets/animals/horse/atlas-packed.json');
     for(const [tier,material]of economy.TOOL_MATERIALS.entries())for(const tool of ['hatchet','pickaxe','hoe','sickle','shovel'])if(tier>0||!['sickle','shovel'].includes(tool))this.load.image(`economy-tool-${material}-${tool}`,economy.tierToolIcon(tool,tier));
    },
    create(){
     window.review=this;this.cameras.main.setBackgroundColor('#718361').setZoom(2).centerOn(300,reviewMode.startsWith('tools')?275:200);
     const text=(x,y,t)=>this.add.text(x,y,t,{fontFamily:'serif',fontSize:'11px',color:'#fff8dd'}).setOrigin(.5,0);
     if(reviewMode==='survivors'){
      const columns=['farmer-female','marina','farmer-male','rui'];columns.forEach((id,col)=>text(75+col*150,8,{'farmer-female':'Fazendeira',marina:'Marina','farmer-male':'Fazendeiro',rui:'Rui'}[id]));
      dirs.forEach((d,row)=>columns.forEach((id,col)=>{const x=75+col*150,y=100+row*90,original=id.startsWith('farmer-'),meta=original?characters.resolveCharacter({characterId:id}):undefined;
       const image=this.add.image(x,y,original?`${id}-${d}-0`:`survivor-walk-${id}`,original?undefined:survivors.survivorWalkFrame(id,d,0)).setOrigin(.5,original?meta.originY/256:232/256).setScale(original?.25:walkArt.characters[id].scale);items.push({id,d,image,original});}));
     }else if(reviewMode==='pigsty'){
      const cost=farmDefs.FARM_BUILDINGS.pigsty.cost;const sites=[false,true].map((gateOpen,i)=>({id:i+1,kind:'pigsty',x:2+i*9,y:5,finished:true,delivered:{...cost},animals:[],hay:0,gateOpen}));
      window.farmView=new farmArt.FarmConstructionView(this,()=>({farmConstruction:{sites}}));text(144,90,'Porteira fechada');text(432,90,'Porteira aberta — 90°');
     }else if(reviewMode.startsWith('horse')){
      ['farmer-female','farmer-male'].forEach((id,row)=>dirs.forEach((d,col)=>{const x=75+150*col,y=150+190*row;const mount=new HorseMount(this,x,y,id);items.push({mount,d,x,y});text(x,y+22,`${id} · ${d}`);}));
     }else{
      const id=reviewMode==='tools-male'?'farmer-male':'farmer-female',c=characters.resolveCharacter({characterId:id});
      text(225,8,'Direita');text(375,8,'Esquerda');
      ['hatchet','pickaxe','hoe','shovel','sickle','water'].forEach((tool,row)=>{text(80,70+row*83,{hatchet:'Machadinha',pickaxe:'Picareta',hoe:'Enxada',shovel:'Pá',sickle:'Foice',water:'Regador'}[tool]);['right','left'].forEach((d,col)=>{const x=225+150*col,y=100+row*83,body=this.add.sprite(x,y,`${id}-${d}-0`).setOrigin(c.originX/256,c.originY/256).setScale(.25).setDepth(y);const visual=new ToolVisual(this,{characterId:id});items.push({tool,d,x,y,body,visual});});});
     }
     game.loop.sleep();window.reviewReady=true;
    }
   },true);
  },mode);
  await p.waitForFunction(()=>window.reviewReady);
  await p.addStyleTag({content:'#ui,#title-screen,.title-screen{visibility:hidden!important}'});
  for(let frame=0;frame<(mode==='pigsty'?1:48);frame++){
   await p.evaluate(({frame,mode})=>{
    if(mode==='survivors')for(const a of items){if(a.original){const n=characters.resolveCharacter({characterId:a.id}).walkFrames;const phase=Math.floor(((frame*2+1e-7)%48)/48*n)+1;a.image.setTexture(`${a.id}-${a.d}-${phase}`);}else a.image.setFrame(survivors.survivorWalkFrame(a.id,a.d,frame*2));}
    else if(mode.startsWith('horse'))for(const a of items)a.mount.update(a.x,a.y,a.d,frame===0?0:4,frame>=24);
    else if(mode!=='pigsty')for(const a of items){a.visual.hide();a.body.setVisible(true);a.visual.show(a.tool,a.d,a.x,a.y,{active:true,frame:frame%9},1,a.body);
     if(a.body.visible)throw Error('Corpo original duplicado durante a ação');
     if(['hoe','shovel','sickle'].includes(a.tool)){
      const signature=[a.visual.sprite.texture.key,a.visual.sprite.scaleX,a.visual.sprite.scaleY,a.visual.sprite.flipX].join('|');
      if(a.rigidSignature&&a.rigidSignature!==signature)throw Error('Ferramenta mudou de tamanho ou desenho durante o ciclo');a.rigidSignature=signature;
     }
    }
    game.step(performance.now(),0);
   },{frame,mode});
   await p.screenshot({path:path.join(frames,`${String(frame).padStart(3,'0')}.png`)});
  }
  if(errors.length)throw Error(errors.join('\n'));
  fs.copyFileSync(path.join(frames,'000.png'),path.join(out,mode+'.png'));
  if(mode==='pigsty'){
   const textures=await p.evaluate(()=>['farm-building-pigsty-2','farm-building-pigsty-2-open'].map(k=>game.textures.getBase64(k)));
   const {PNG}=require('pngjs'),images=textures.map(t=>PNG.sync.read(Buffer.from(t.split(',')[1],'base64')));let changedOutside=0;
   for(let y=0;y<images[0].height;y++)for(let x=0;x<images[0].width;x++){if(x>=316&&x<486&&y>=773)continue;const i=(y*images[0].width+x)*4;if(!images[0].data.subarray(i,i+4).equals(images[1].data.subarray(i,i+4)))changedOutside++;}
   if(changedOutside)throw Error(`${changedOutside} pixels mudaram fora da porteira`);
   textures.forEach((t,i)=>fs.writeFileSync(path.join(out,i?'chiqueiro-aberto.png':'chiqueiro-fechado.png'),Buffer.from(t.split(',')[1],'base64')));
   fs.writeFileSync(path.join(out,'pigsty.json'),JSON.stringify({sameBuilding:true,changedOutside,errors},null,2));console.log('Chiqueiro: estados alinhados, somente a porteira muda');return;
  }
  execFileSync('ffmpeg',['-loglevel','error','-y','-framerate',mode==='survivors'?'42':'24','-i',path.join(frames,'%03d.png'),'-filter_complex','split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer',path.join(out,mode+'.gif')]);
  let tools;
  if(mode.startsWith('tools'))tools=await p.evaluate(()=>items.map(a=>{
   const tiers=[];for(let tier=0;tier<4;tier++){a.visual.show(a.tool,a.d,a.x,a.y,{active:true,frame:4},tier,a.body);tiers.push(a.visual.sprite.texture.key);}
   a.visual.hide();if(!a.body.visible)throw Error('Corpo não restaurado após a ação');
   a.body.setVisible(false);a.visual.show(a.tool,a.d,a.x,a.y,{active:true,frame:2},1,a.body);a.visual.hide();if(a.body.visible)throw Error('Ação tornou visível um personagem oculto');
   return{tool:a.tool,direction:a.d,rigidSignature:a.rigidSignature,tiers,bodyRestored:true};
  }));
  fs.writeFileSync(path.join(out,mode+'.json'),JSON.stringify({mode,errors,frames:48,tools,temporaryFrames:frames},null,2));console.log(`Arte conferida: ${mode}`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
