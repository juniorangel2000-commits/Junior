import type Phaser from 'phaser';
import {paintRadialLight} from './dungeons/lighting';
import {getVisualSettings} from './visual-settings';
import {mineDarkness,mineLightPolygon} from './systems/underground-light';
import type {UndergroundState} from './systems/underground';
import type {TilePoint} from './types';
/** Extends existing fixture/radial lighting; only a half-resolution camera overlay is uploaded. */
export class UndergroundLighting{
 private texture:Phaser.Textures.CanvasTexture;private image:Phaser.GameObjects.Image;private elapsed=1;private revision=-1;
 constructor(private scene:Phaser.Scene,private mine:()=>UndergroundState){
  if(scene.textures.exists('mine-visibility'))scene.textures.remove('mine-visibility');
  this.texture=scene.textures.createCanvas('mine-visibility',640,360)!;this.image=scene.add.image(0,0,'mine-visibility').setOrigin(0).setDepth(10000);
 }
 update(player:TilePoint,seconds:number,lantern:boolean):void{
  const camera=this.scene.cameras.main,view=camera.worldView,mine=this.mine();
  this.image.setPosition(view.x,view.y).setDisplaySize(view.width,view.height);this.elapsed+=seconds;
  const darkness=mineDarkness(player.y,lantern);this.image.setVisible(darkness.alpha>0);if(!this.image.visible)return;
  if(this.elapsed<.1&&this.revision===mine.revision)return;this.elapsed=0;this.revision=mine.revision;
  const width=Math.ceil(camera.width/2),height=Math.ceil(camera.height/2);if(this.texture.width!==width||this.texture.height!==height)this.texture.setSize(width,height);
  const c=this.texture.context,sx=width/view.width,sy=height/view.height,settings=getVisualSettings();c.clearRect(0,0,width,height);
  c.fillStyle=`rgba(7,8,15,${darkness.alpha*Math.max(.75,settings.dynamicLighting?settings.intensity:1)})`;c.fillRect(0,0,width,height);
  const light=(p:TilePoint,radius:number,strength:number)=>{
   if(p.x+radius<view.x||p.x-radius>view.right||p.y+radius<view.y||p.y-radius>view.bottom)return;
   const polygon=mineLightPolygon(mine,p,radius);c.save();c.beginPath();polygon.forEach((q,i)=>i?c.lineTo((q.x-view.x)*sx,(q.y-view.y)*sy):c.moveTo((q.x-view.x)*sx,(q.y-view.y)*sy));c.closePath();c.clip();
   c.globalCompositeOperation='destination-out';paintRadialLight(c,(p.x-view.x)*sx,(p.y-view.y)*sy,radius*sx,radius*sy,`rgba(0,0,0,${strength})`);c.restore();
  };
  light(player,darkness.radius,.93);
  for(const object of this.scene.children.list){const fixture=object.getData('fixture-light');if(!fixture)continue;const o=object as Phaser.GameObjects.Image;light({x:o.x+(fixture.offsetX??0),y:o.y+(fixture.offsetY??0)},fixture.radius??90,.9);}
  this.texture.refresh();
 }
 destroy(){this.image.destroy();this.scene.textures.remove('mine-visibility');}
}
