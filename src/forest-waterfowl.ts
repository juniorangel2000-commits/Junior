import type Phaser from 'phaser';
import {createAnimalSprite,updateAnimalSprite} from './animal-sprites';
import {FOREST_DUCK_SPAWNS,createForestDuck} from './systems/forest-ducks';
import type {AnimalBrain,AnimalPoint} from './systems/animals';
export class ForestWaterfowl{
 readonly ducks:{brain:AnimalBrain;sprite:Phaser.GameObjects.Sprite;shadow:Phaser.GameObjects.Ellipse;swimming:boolean}[]=[];
 private ripples:Phaser.GameObjects.Graphics;private elapsed=0;private nextRipple=0;
 constructor(private scene:Phaser.Scene,private water:(x:number,y:number)=>boolean,solid:(x:number,y:number)=>boolean){
  this.ripples=scene.add.graphics();for(const p of FOREST_DUCK_SPAWNS){const brain=createForestDuck(p.id,p.x,p.y,water,solid);if(!brain)continue;
   const sprite=createAnimalSprite(scene,'duck',brain.x,brain.y)!;const shadow=scene.add.ellipse(brain.x,brain.y,17,5,0x26342c,.18).setDepth(brain.y-.2);
   this.ducks.push({brain,sprite,shadow,swimming:false});
  }
 }
 update(dt:number,player:AnimalPoint):void{
  this.elapsed+=dt;const brains=this.ducks.map(d=>d.brain),draw=this.elapsed>=this.nextRipple;if(draw){this.nextRipple=this.elapsed+.1;this.ripples.clear();}
  const view=this.scene.cameras.main.worldView;
  for(const d of this.ducks){d.brain.update(dt,player,brains);updateAnimalSprite(d.sprite,d.brain,dt);const water=this.water(d.brain.x,d.brain.y);d.swimming=water;d.shadow.setVisible(!water).setPosition(d.brain.x,d.brain.y).setDepth(d.brain.y-.2);
   if(water)d.sprite.setCrop(0,0,224,182);else d.sprite.setCrop();
   if(draw&&water&&d.brain.x>view.x-30&&d.brain.x<view.right+30&&d.brain.y>view.y-30&&d.brain.y<view.bottom+30){const wave=1+Math.sin(this.elapsed*3+d.brain.x)*.12;
    this.ripples.lineStyle(.7,0xc6e3cd,.4).strokeEllipse(d.brain.x,d.brain.y-3,24*wave,6*wave).lineStyle(.7,0x264e53,.35).strokeEllipse(d.brain.x,d.brain.y-2,19,4);
   }
  }
  this.ripples.setDepth(this.ducks.length?Math.min(...this.ducks.map(d=>d.brain.y))-.1:0);
 }
 destroy():void{for(const d of this.ducks){d.sprite.destroy();d.shadow.destroy();}this.ducks.length=0;this.ripples.destroy();}
}
