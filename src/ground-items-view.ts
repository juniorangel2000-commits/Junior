import Phaser from 'phaser';
import {groundItems,groundExpired,collectGroundItems,type GroundRuntime} from './systems/ground-items';
import {itemIconUrl} from './visual-assets';
import {gameAudio} from './audio';
const loading=new Set<string>();
export class GroundItemsView{
 private objects=new Map<number,{image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;count:Phaser.GameObjects.Text;born:number}>();private nextCheck=0;
 constructor(private scene:Phaser.Scene){}
 tick(rt:GroundRuntime,time:number):void{
  if(!this.scene.sys.isActive())return;
  if(time>=this.nextCheck){this.nextCheck=time+250;const result=collectGroundItems(rt);if(result.ok&&result.message)gameAudio.play('pickup');}
  const save=rt.read?.()??rt.snapshot(),drops=groundItems(save).filter(d=>d.space===rt.space()&&!groundExpired(save,d)),ids=new Set(drops.map(d=>d.id));for(const[id,o]of this.objects)if(!ids.has(id)||!o.image.scene){o.image.destroy();o.shadow.destroy();o.count.destroy();this.objects.delete(id);}
  for(const d of drops){const key='ground-item-'+d.item;let o=this.objects.get(d.id);if(!this.scene.textures.exists(key)){
    if(!loading.has(key)){const url=itemIconUrl(d.item)??itemIconUrl('scrap')!;loading.add(key);const image=new Image();image.onload=()=>{if(!this.scene.textures.exists(key))this.scene.textures.addImage(key,image);};image.onerror=()=>loading.delete(key);image.src=url;}continue;
   }
   if(!o){const image=this.scene.add.image(d.x,d.y,key).setDepth(d.y+.1),scale=18/Math.max(image.width,image.height);image.setScale(scale);const shadow=this.scene.add.ellipse(d.x,d.y+3,14,5,0x201c13,.25).setDepth(d.y-.2),count=this.scene.add.text(d.x+8,d.y+4,d.amount>1?String(d.amount):'',{fontFamily:'Georgia',fontSize:'9px',color:'#fff0cd',stroke:'#382b19',strokeThickness:2}).setDepth(d.y+.2);o={image,shadow,count,born:time};this.objects.set(d.id,o);}
   const t=(time-o.born)/1000,bounce=t<.65?Math.sin(t/.65*Math.PI)*9:Math.sin(t*2+d.id)*1;o.image.setY(d.y-4-bounce);o.count.setText(d.amount>1?String(d.amount):'');
  }
 }
 destroy():void{for(const o of this.objects.values()){o.image.destroy();o.shadow.destroy();o.count.destroy();}this.objects.clear();}
}
