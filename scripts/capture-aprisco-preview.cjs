// Compara os sprites reais na mesma câmera e escala; não modifica as artes.
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
module.exports=async function captureAnimalComparison(page,out){
 fs.mkdirSync(out+'/frames',{recursive:true});
 await page.evaluate(async()=>{
  const{createAnimalSprite}=await import('/src/animal-sprites.ts'),{Player}=await import('/src/player.ts');
  game.loop.sleep();v.paused=true;v.daylight?.setVisible(false);v.cameras.main.stopFollow();
  for(const o of v.children.list)o.setVisible?.(false);
  document.querySelector('#ui').style.display='none';
  v.cameras.main.setBounds(0,0,640,400).setZoom(2).centerOn(320,200);
  v.add.rectangle(320,200,640,400,0x6b8053).setDepth(-10000);
  v.add.text(320,70,'Animais do aprisco · comparação de escala',{fontFamily:'Georgia',fontSize:'18px',color:'#fff1d3'}).setOrigin(.5);
  window.previewAnimals=['cow','sheep','goat','chicken'].map((kind,index)=>{
   const x=100+index*110;v.add.ellipse(x,235,kind==='cow'?42:kind==='chicken'?15:28,kind==='cow'?12:kind==='chicken'?5:8,0x233124,.22);
   const sprite=createAnimalSprite(v,kind,x,230);v.add.text(x,258,{cow:'Vaca',sheep:'Ovelha',goat:'Cabra',chicken:'Galinha'}[kind],{fontFamily:'Georgia',fontSize:'14px',color:'#fff1d3'}).setOrigin(.5);return{kind,sprite};
  });
  const player=new Player(v,v.state.profile,550,230,'aprisco-preview-player');player.sprite.setDepth(230);v.add.text(550,258,'Jogador',{fontFamily:'Georgia',fontSize:'14px',color:'#fff1d3'}).setOrigin(.5);
  window.previewTime=v.time.now;
 });
 for(let phase=0;phase<9;phase++){
  await page.evaluate(async phase=>{const{animalFrame,ANIMAL_ART}=await import('/src/data/animal-art.ts');for(const a of previewAnimals)a.sprite.setFrame(animalFrame(a.kind,'right',phase>0,(phase-1)*ANIMAL_ART[a.kind].stride/8));game.step(previewTime,0);},phase);
  await page.screenshot({path:phase===0?out+'/comparacao-animais.png':out+`/frames/${String(phase-1).padStart(2,'0')}.png`});
 }
 execFileSync('ffmpeg',['-y','-v','error','-framerate','6','-i',out+'/frames/%02d.png','-vf','split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',out+'/caminhada-animais.gif']);
};
