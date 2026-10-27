import type Phaser from 'phaser';
import type {ResourceNode} from './types';
/** First planting day only; the original terrain is never modified. */
export function drawTreePlantingSoil(scene:Phaser.Scene,node:ResourceNode):Phaser.GameObjects.Image|undefined{
 if(!node.treePlantingSoil||node.kind!=='standingTree'||!scene.textures.exists('ecology-tree-soil'))return;
 return scene.add.image(node.x*32+16,node.y*32+25,'ecology-tree-soil').setOrigin(.5).setDisplaySize(44,28).setDepth(-46).setData('tree-soil-for',node.id);
}
