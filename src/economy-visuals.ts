import type Phaser from 'phaser';
import type {ResourceNode} from './types';
import {mineralTexture} from './data/economy-art';
import {depositMetal} from './systems/mining';
import {detailedOreFrame} from './economy-art';
/** Stable resource identities keep harvesting, saves and editor placements intact. */
export function markMinerals(scene:Phaser.Scene,nodes:readonly ResourceNode[]):void{
 const images=new Map<string,Phaser.GameObjects.Image>();for(const o of scene.children.list){const s=o as Phaser.GameObjects.Image,id=s.getData?.('resource-id');if(id&&s.texture)images.set(id,s);}
 for(const node of nodes){const metal=depositMetal(node);if(!metal)continue;const sprite=images.get(node.id);if(!sprite||sprite.getData('ore-metal')===metal)continue;
 const frame=detailedOreFrame(scene,metal);if(frame){const b=frame.bounds,scale=58/(b[2]-b[0]);sprite.setTexture('detailed-ore-atlas',metal).clearTint().setOrigin((b[0]+b[2])/2/frame.width,b[3]/frame.height).setScale(scale).setData('ore-metal',metal);}
 else if(scene.textures.exists(mineralTexture(metal)))sprite.setTexture(mineralTexture(metal)).clearTint().setDisplaySize(58,58).setOrigin(.5,124/128).setData('ore-metal',metal);
 }
}
