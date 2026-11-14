import type Phaser from 'phaser';
import type {SaveData} from './types';
import {MACHINE_IDS,MACHINE_PRODUCTS,MACHINES,MACHINE_RECIPES} from './data/machines';
import art from '../public/assets/visual/machines/art.json';
import {groundClock} from './systems/ground-items';
import {machineReady,type MachineSpace} from './systems/machines';
export function preloadMachineArt(scene:Phaser.Scene):void{
 for(const kind of MACHINE_IDS){const f=art.frames[kind],key='machine-'+kind;if(!scene.textures.exists(key))scene.load.spritesheet(key,`assets/visual/machines/${kind}.png`,{frameWidth:f.width,frameHeight:f.height});}
 for(const item of MACHINE_PRODUCTS)if(!scene.textures.exists('machine-product-'+item))scene.load.image('machine-product-'+item,`assets/visual/machines/${item}.png`);
 // Pães e bolos do forno usam o ícone do prato no balão.
 if(!scene.textures.exists('machine-product-fertilizer'))scene.load.image('machine-product-fertilizer','assets/visual/kitchen/fertilizer.png');
 if(!scene.textures.exists('machine-product-honey'))scene.load.image('machine-product-honey','assets/visual/kitchen/honey.png');
 for(const r of MACHINE_RECIPES)if(r.machine==='clayOven'&&!scene.textures.exists('machine-product-'+r.output))scene.load.image('machine-product-'+r.output,`assets/visual/kitchen/dishes/${r.output}.png`);
}
export class MachineView{
 private objects=new Map<number,{body:Phaser.GameObjects.Sprite;badge:Phaser.GameObjects.Image}>();
 private progress:Phaser.GameObjects.Graphics;private next=0;
 constructor(private scene:Phaser.Scene,private read:()=>SaveData,private space:()=>MachineSpace|undefined){this.progress=scene.add.graphics().setDepth(4500);}
 update(time:number):void{
  if(time<this.next)return;this.next=time+100;const s=this.read(),space=this.space(),items=s.machines?.items.filter(m=>m.space===space)??[],live=new Set(items.map(m=>m.id));
  for(const[id,o]of this.objects)if(!live.has(id)){o.body.destroy();o.badge.destroy();this.objects.delete(id);}
  this.progress.clear();const view=this.scene.cameras.main.worldView;
  for(const m of items){const d=MACHINES[m.kind],x=(m.x+d.width/2)*32,y=(m.y+1)*32-2,ready=machineReady(s,m),job=m.job;
   let o=this.objects.get(m.id);if(!o){const body=this.scene.add.sprite(x,y,'machine-'+m.kind,0).setOrigin(.5,1).setDepth(y),badge=this.scene.add.image(x,y-40,'machine-product-cheese').setOrigin(.5,1).setVisible(false);body.setScale(Math.min(d.width*30/body.width,48/body.height));o={body,badge};this.objects.set(m.id,o);}
   const frame=job&&!ready?1+Math.floor(time/450)%2:0;if(String(o.body.frame.name)!==String(frame))o.body.setFrame(frame);
   const visible=space!==undefined&&x>view.x-100&&x<view.right+100&&y>view.y-20&&y<view.bottom+100;o.body.setVisible(visible);
   o.badge.setVisible(visible&&ready);
   if(ready&&job&&visible){const r=MACHINE_RECIPES.find(r=>r.id===job.recipe)!;const key='machine-product-'+r.output;if(o.badge.texture.key!==key)o.badge.setTexture(key);const by=y-o.body.displayHeight-9+Math.round(Math.sin(time/600+m.id));
    this.progress.fillStyle(0x6b4425,1).fillRoundedRect(x-13,by-21,26,25,4).fillTriangle(x-5,by+2,x+5,by+2,x,by+10)
      .fillStyle(0xf5e5bf,1).fillRoundedRect(x-12,by-20,24,23,3).fillTriangle(x-3,by+2,x+3,by+2,x,by+7);
    o.badge.setScale(16/Math.max(o.badge.width,o.badge.height)).setPosition(x,by).setDepth(4501);}
   if(job&&!ready&&visible){const p=Math.max(0,Math.min(1,(groundClock(s)-job.startedAt)/(job.readyAt-job.startedAt)));this.progress.fillStyle(0x302617,.8).fillRect(x-17,y+3,34,4).fillStyle(0xdab65b,1).fillRect(x-16,y+4,32*p,2);}
  }
 }
 destroy():void{for(const o of this.objects.values()){o.body.destroy();o.badge.destroy();}this.objects.clear();this.progress.destroy();}
}
