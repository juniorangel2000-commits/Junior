import Phaser from 'phaser';
import courier from '../public/assets/visual/dungeons/zombie-courier.json';
import resident from '../public/assets/visual/dungeons/zombie-resident.json';
import {setupVillagePropAtlas} from './village-prop-atlas';
import {enemySpritePose} from './dungeons/enemy-sprites';
import {drawGroundWarning} from './dungeons/ground-warning';
import {preloadCampCombat,CampCombatArt} from './camp-combat-art';
import {MINE_HAZARDS as B} from './data/underground-hazards';
import {undergroundBlocked,type UndergroundState} from './systems/underground';
import {mineGasRegions} from './systems/underground-hazards';
import type {TilePoint} from './types';
import type {AttackEffect} from './dungeons/run';
export function preloadMineHazards(scene:Phaser.Scene):void{
 preloadCampCombat(scene);
 for(const [id,m]of [['zombie-courier',courier],['zombie-resident',resident]] as const)if(!scene.textures.exists('dungeon-'+id)&&!scene.textures.exists('dungeon-'+id+'-source'))scene.load.image('dungeon-'+id+'-source',m.file);
 if(!scene.textures.exists('mine-bats'))scene.load.image('mine-bats','assets/visual/mine/cave-bats.png');
}
export class UndergroundHazardArt{
 private zombies=new Map<number,Phaser.GameObjects.Image>();private bats=new Map<number,Phaser.GameObjects.Image>();
 private gas:Phaser.GameObjects.Graphics;private warning:Phaser.GameObjects.Graphics;private falling:Phaser.GameObjects.Graphics;private sword:CampCombatArt;
 constructor(private scene:Phaser.Scene,private mine:()=>UndergroundState){
  for(const [id,m]of [['zombie-courier',courier],['zombie-resident',resident]] as const)if(!scene.textures.exists('dungeon-'+id))setupVillagePropAtlas(scene,'dungeon-'+id,'dungeon-'+id+'-source',m,true);
  const texture=scene.textures.get('mine-bats');if(!texture.has('bat-0')){const source=texture.getSourceImage(),w=source.width/4,h=source.height/2;for(let i=0;i<8;i++)texture.add('bat-'+i,0,Math.floor(i%4*w),Math.floor(i/4*h),Math.floor((i%4+1)*w)-Math.floor(i%4*w),Math.floor((Math.floor(i/4)+1)*h)-Math.floor(i/4*h));texture.setFilter(Phaser.Textures.FilterMode.NEAREST);}
  this.gas=scene.add.graphics().setDepth(-100).setData('mine-gas',true);this.warning=scene.add.graphics().setDepth(-90).setData('mine-danger',true);this.falling=scene.add.graphics().setDepth(9000);this.sword=new CampCombatArt(scene);
 }
 swing(effect:AttackEffect){this.sword.swing(effect);}
 update(player:TilePoint,dt:number):void{
  const mine=this.mine(),h=mine.hazards;if(!h)return;const elapsed=h.elapsed;this.zombies.forEach(image=>image.setVisible(false));this.bats.forEach(image=>image.setVisible(false));
  for(const z of h.zombies){let image=this.zombies.get(z.id);if(!image){image=this.scene.add.image(z.x,z.y,'dungeon-zombie-resident','south-0').setData('mine-enemy',z.id);this.zombies.set(z.id,image);}
   image.setVisible(z.hp>0&&Math.hypot(z.x-player.x,z.y-player.y)<800);if(!image.visible)continue;
   const dx=(z.goal?.x??player.x)-z.x,dy=(z.goal?.y??player.y)-z.y,direction=Math.abs(dx)>Math.abs(dy)?dx<0?'west':'east':dy<0?'north':'south',pose=enemySpritePose(z.id,direction,z.mode==='dormant'?0:elapsed,false);
   image.setTexture(pose.texture,pose.frame).setOrigin(pose.originX,pose.originY).setScale(45/pose.referenceHeight).setPosition(z.x,z.y).setDepth(z.y);
  }
  for(const b of h.bats){let image=this.bats.get(b.id);if(!image){image=this.scene.add.image(b.x,b.y,'mine-bats','bat-7').setData('mine-bat',b.id);this.bats.set(b.id,image);}
   image.setVisible(b.hp>0&&Math.hypot(b.x-player.x,b.y-player.y)<800);if(!image.visible)continue;
   const phase=[0,1,2,3][Math.floor(elapsed*9)%4],north=(b.goal?.y??b.y+1)<b.y,frame=b.state==='roost'?7:north?[4,5,6,5][phase]:phase;
   image.setFrame('bat-'+frame).setOrigin(.5,.56).setScale(.125).setPosition(b.x,b.y-(b.state==='roost'?23:13+Math.sin(elapsed*7+b.id)*2)).setDepth(b.y+1);
   image.setTint(b.state==='warning'?0xffc47e:0xffffff);
  }
  this.gas.clear();for(const r of mineGasRegions(mine)){
   if(Math.hypot(r.x-player.x,r.y-player.y)>700)continue;
   for(let y=-r.radius;y<r.radius;y+=10)for(let x=-r.radius;x<r.radius;x+=10){const px=r.x+x,py=r.y+y,d=Math.hypot(x,y)/r.radius;if(d>1||undergroundBlocked(mine,px,py))continue;
    this.gas.fillStyle(0x9ca564,(1-d)*(.13+.035*Math.sin(elapsed*1.4+x*.06+y*.09))).fillCircle(px,py,8);
   }
  }
  this.warning.clear();this.falling.clear();const cave=h.cave.active;
  if(cave){const warning=cave.stage==='warning',progress=warning?1-cave.remaining/B.caveIn.warningSeconds:1;drawGroundWarning(this.warning,cave.x,cave.y,B.caveIn.radius,warning,progress,0xd28845);
   for(let i=0;i<14;i++){const angle=i*2.4,r=Math.sqrt((i+.5)/14)*B.caveIn.radius,x=cave.x+Math.cos(angle)*r,y=cave.y+Math.sin(angle)*r;
    if(undergroundBlocked(mine,x,y))continue;
    if(warning){const drop=(elapsed*50+i*11)%36;this.falling.fillStyle(0xb08b65,.6).fillCircle(x,y-36+drop,1.2);}
    else{const fall=Math.min(1,(.7-cave.remaining)/.18),height=(1-fall)*95;this.falling.fillStyle(0x332b27,.25).fillEllipse(x,y,13,5);this.falling.fillStyle(i%2?0xa68a70:0x776653,Math.min(1,cave.remaining*4)).fillTriangle(x-5,y-height,x+6,y-height-5,x+3,y-height+5);}
   }
  }
  this.sword.update(dt);
 }
 destroy():void{this.zombies.forEach(i=>i.destroy());this.bats.forEach(i=>i.destroy());this.gas.destroy();this.warning.destroy();this.falling.destroy();this.sword.destroy();}
}
