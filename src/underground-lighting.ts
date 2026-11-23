import type Phaser from 'phaser';
import {paintRadialLight} from './dungeons/lighting';
import {getVisualSettings} from './visual-settings';
import {mineDarkness,mineLightPolygon} from './systems/underground-light';
import type {UndergroundState} from './systems/underground';
import type {TilePoint} from './types';
/** Margem (px do mapa) desenhada além da tela: a sombra nunca deixa uma faixa clara na borda. */
const MARGIN=48;
/** Extends existing fixture/radial lighting; only a half-resolution camera overlay is uploaded.
 * Redesenha a cada quadro em que a câmera ou o jogador se movem (antes, 10 vezes por segundo:
 * a luz ficava atrasada e a borda da tela aparecia clara ao andar). */
export class UndergroundLighting{
 private texture:Phaser.Textures.CanvasTexture;private image:Phaser.GameObjects.Image;private elapsed=1;private revision=-1;private key='';
 private fixed=new Map<string,TilePoint[]>();
 constructor(private scene:Phaser.Scene,private mine:()=>UndergroundState){
  if(scene.textures.exists('mine-visibility'))scene.textures.remove('mine-visibility');
  this.texture=scene.textures.createCanvas('mine-visibility',640,360)!;this.image=scene.add.image(0,0,'mine-visibility').setOrigin(0).setDepth(10000);
 }
 update(player:TilePoint,seconds:number,lantern:boolean):void{
  const camera=this.scene.cameras.main,view=camera.worldView,mine=this.mine();
  const darkness=mineDarkness(player.y,lantern);this.image.setVisible(darkness.alpha>0);if(!this.image.visible)return;
  const left=Math.floor(view.x-MARGIN),top=Math.floor(view.y-MARGIN),areaW=view.width+MARGIN*2,areaH=view.height+MARGIN*2;
  this.elapsed+=seconds;
  const key=`${left},${top},${Math.round(player.x)},${Math.round(player.y)},${lantern},${areaW},${areaH}`;
  if(key===this.key&&this.revision===mine.revision&&this.elapsed<.25)return;
  this.key=key;this.elapsed=0;if(this.revision!==mine.revision){this.revision=mine.revision;this.fixed.clear();}
  const scale=Math.max(.25,camera.zoom/2),width=Math.ceil(areaW*scale),height=Math.ceil(areaH*scale);
  if(this.texture.width!==width||this.texture.height!==height)this.texture.setSize(width,height);
  this.image.setPosition(left,top).setDisplaySize(areaW,areaH);
  const c=this.texture.context,sx=width/areaW,sy=height/areaH,settings=getVisualSettings();c.clearRect(0,0,width,height);
  c.fillStyle=`rgba(5,6,12,${Math.min(.99,darkness.alpha*Math.max(.85,settings.dynamicLighting?settings.intensity:1))})`;c.fillRect(0,0,width,height);
  const right=left+areaW,bottom=top+areaH;
  const light=(p:TilePoint,radius:number,strength:number,polygon:TilePoint[])=>{
   c.save();c.beginPath();polygon.forEach((q,i)=>i?c.lineTo((q.x-left)*sx,(q.y-top)*sy):c.moveTo((q.x-left)*sx,(q.y-top)*sy));c.closePath();c.clip();
   c.globalCompositeOperation='destination-out';paintRadialLight(c,(p.x-left)*sx,(p.y-top)*sy,radius*sx,radius*sy,`rgba(0,0,0,${strength})`);c.restore();
  };
  // O centro da luz fica no meio do corpo, não nos pés.
  const eye={x:player.x,y:player.y-12};
  // Os raios partem dos pés: encostado numa parede ao norte, o meio do corpo já está "dentro" da rocha.
  light(eye,darkness.radius,lantern?.95:.9,mineLightPolygon(mine,player,darkness.radius+12));
  for(const object of this.scene.children.list){
   const fixture=object.getData('fixture-light');if(!fixture)continue;const o=object as Phaser.GameObjects.Image;
   const p={x:o.x+(fixture.offsetX??0),y:o.y+(fixture.offsetY??0)},radius=fixture.radius??90;
   if(p.x+radius<left||p.x-radius>right||p.y+radius<top||p.y-radius>bottom)continue;
   const id=`${Math.round(p.x)},${Math.round(p.y)},${radius}`;let polygon=this.fixed.get(id);if(!polygon){polygon=mineLightPolygon(mine,p,radius);this.fixed.set(id,polygon);}
   light(p,radius,.9,polygon);
  }
  this.texture.refresh();
 }
 destroy(){this.image.destroy();this.scene.textures.remove('mine-visibility');}
}
