import type Phaser from 'phaser';
import type {ResourceNode} from './types';
import {mineralTexture} from './data/economy-art';
import {depositMetal} from './systems/mining';
/** Stable resource identities keep harvesting, saves and editor placements intact. */
export function markMinerals(scene:Phaser.Scene,nodes:readonly ResourceNode[]):void{
 for(const node of nodes){const metal=depositMetal(node);if(!metal)continue;const sprite=scene.children.list.find(o=>{const s=o as Phaser.GameObjects.Image;return s.texture&&Math.abs(s.x-(node.x*32+16))<1&&Math.abs(s.y-(node.y*32+25))<6;}) as Phaser.GameObjects.Image|undefined;
 if(sprite&&scene.textures.exists(mineralTexture(metal)))sprite.setTexture(mineralTexture(metal)).clearTint().setDisplaySize(58,58).setOrigin(.5,124/128).setData('ore-metal',metal);
 }
}
