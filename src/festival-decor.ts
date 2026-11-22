import Phaser from 'phaser';
import {VILLAGE_PLAZA} from './data/village';
import {festivalOn,type Festival} from './systems/festivals';

const T=32;
/** Arte dos festivais (do Junior, em public/assets/visual/festivals; fontes em
 * referencias/cenarios/festivais). Carregada só quando há festa. */
export const FESTIVAL_ART=['stall-seeds','stall-flowers','stall-pots','stall-pumpkins','stall-fruit','stall-grain','stall-lanterns','stall-gifts','stall-tea',
 'post','banner-spring','banner-autumn','banner-winter','paper-lantern-yellow','paper-lantern-red','lantern-brass','lantern-copper',
 'flower-crate','hay-bale','shell-crate','beach-basket'] as const;
type Art=typeof FESTIVAL_ART[number];
export const festivalTexture=(art:Art)=>`festival-${art}`;
/** Carrega a arte dos festivais (uma vez) e chama `done` quando estiver pronta. */
export function loadFestivalArt(scene:Phaser.Scene,done:()=>void):void{
 const missing=FESTIVAL_ART.filter(a=>!scene.textures.exists(festivalTexture(a)));
 const fire=!scene.textures.exists('festival-beach-fire');
 if(!missing.length&&!fire){done();return;}
 for(const a of missing)scene.load.image(festivalTexture(a),`assets/visual/festivals/${a}.png`);
 if(fire)scene.load.spritesheet('festival-beach-fire','assets/visual/festivals/beach-fire.png',{frameWidth:448,frameHeight:477});
 // Outros pedidos podem estar no mesmo lote: espera até a fogueira existir de fato.
 const check=()=>{if(scene.textures.exists('festival-beach-fire'))done();else scene.load.once('complete',check);};
 scene.load.once('complete',check);
 if(!scene.load.isLoading())scene.load.start();
}
interface Look{stalls:readonly Art[];banner?:Art;hanging?:readonly Art[];ground:readonly Art[];light?:true}
const LOOKS:Record<string,Look>={
 'seed-fair':{stalls:['stall-seeds','stall-flowers','stall-pots'],banner:'banner-spring',ground:['flower-crate','flower-crate']},
 'harvest-festival':{stalls:['stall-pumpkins','stall-fruit','stall-grain'],banner:'banner-autumn',ground:['hay-bale','hay-bale']},
 'lantern-night':{stalls:['stall-lanterns','stall-gifts','stall-tea'],banner:'banner-winter',hanging:['paper-lantern-yellow','paper-lantern-red'],ground:['lantern-brass','lantern-copper'],light:true},
};
/** Largura (px do mapa) de cada peça no jogo. */
const WIDTH:Partial<Record<Art,number>>={post:16,'banner-spring':28,'banner-autumn':28,'banner-winter':28,'paper-lantern-yellow':22,'paper-lantern-red':22,
 'lantern-brass':22,'lantern-copper':22,'flower-crate':52,'hay-bale':58,'shell-crate':42,'beach-basket':52};
const STALL_WIDTH=118;

/** Decoração da praça no dia do festival: postes com flâmulas (ou lanternas de papel), três
 * barracas no lado norte e enfeites no chão. Fica na borda da praça, longe das passagens. */
export class FestivalDecor{
 private items:Phaser.GameObjects.GameObject[]=[];
 private shown='';
 constructor(private scene:Phaser.Scene){}
 update(day:number,inside:boolean):void{
  const f=festivalOn(day),key=f&&f.place==='village'&&!inside?`${f.id}:${day}`:'';
  if(key===this.shown)return;
  this.clear();this.shown=key;
  if(f&&key)loadFestivalArt(this.scene,()=>{if(this.shown===key&&this.scene.sys.isActive())this.build(f);});
 }
 private image(art:Art,x:number,y:number,width:number,depth=y){
  const tex=this.scene.textures.get(festivalTexture(art)).getSourceImage() as HTMLImageElement;
  const img=this.scene.add.image(x,y,festivalTexture(art)).setOrigin(.5,1).setScale(width/tex.width).setDepth(depth);
  this.items.push(img);return img;
 }
 private build(f:Festival):void{
  const look=LOOKS[f.id];if(!look)return;
  const cx=VILLAGE_PLAZA.x*T,cy=VILLAGE_PLAZA.y*T,rx=VILLAGE_PLAZA.rx*T*.92,ry=VILLAGE_PLAZA.ry*T*.92;
  const posts=Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2+Math.PI/8;return{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry};});
  // Cordão entre os postes (fino, por cima de tudo, como as bandeirinhas de verdade).
  const rope=this.scene.add.graphics().setDepth(cy+ry+400);rope.lineStyle(1.5,0x6a4a2a,1);
  for(let i=0;i<posts.length;i++){
   const a=posts[i],b=posts[(i+1)%posts.length];
   rope.strokePoints(Array.from({length:13},(_,k)=>{const t=k/12;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-62+Math.sin(t*Math.PI)*14};}) as Phaser.Types.Math.Vector2Like[]);
  }
  this.items.push(rope);
  posts.forEach((p,i)=>{
   this.image('post',p.x,p.y,WIDTH.post!);
   // No alto de cada poste: flâmula da estação ou, à noite das lanternas, alternando com lanterna de papel.
   const hang=look.hanging&&i%2===0?look.hanging[(i/2)%look.hanging.length]:look.banner;
   if(hang){
    const img=this.image(hang,p.x,p.y-30,WIDTH[hang]!,p.y+1);
    if(look.light&&hang.startsWith('paper'))img.setData('fixture-light',{offsetX:0,offsetY:-12,radius:30,strength:.9,always:true});
   }
  });
  // Três barracas no lado norte da praça.
  look.stalls.forEach((art,i)=>this.image(art,cx+(i-1)*150,cy-ry+46,STALL_WIDTH).setData('shadow-foot',1));
  // Enfeites no chão, dos dois lados da praça.
  look.ground.forEach((art,i)=>{
   const img=this.image(art,cx+(i?1:-1)*(rx-40),cy+18,WIDTH[art]!);
   if(look.light&&art.startsWith('lantern'))img.setData('fixture-light',{offsetX:0,offsetY:-12,radius:34,strength:1,always:true});
  });
 }
 private clear():void{for(const o of this.items)o.destroy();this.items=[];}
 destroy():void{this.clear();}
}
