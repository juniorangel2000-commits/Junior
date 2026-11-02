import type Phaser from 'phaser';
import {forestCampFootprints} from './data/forest-camp-access';
export function drawForestCampFootprints(scene:Phaser.Scene,water:(x:number,y:number)=>boolean):void {
 const g=scene.add.graphics().setDepth(-.5).setData('camp-footprints',true);g.fillStyle(0x493e2b,.48);
 for(const p of forestCampFootprints())if(!water(p.x,p.y)){g.fillEllipse(p.x-4,p.y+4,3,6);g.fillRect(p.x-5,p.y+8,2,2);g.fillEllipse(p.x+4,p.y-6,3,6);g.fillRect(p.x+3,p.y-2,2,2);}
}
