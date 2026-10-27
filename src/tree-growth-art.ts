import type Phaser from 'phaser';
import type {ResourceNode} from './types';
/** Stage-specific young art, with the mature artwork shared with the existing forest. */
export function growingTreeArt(n:ResourceNode):{texture:string;width:number;height:number;pivot:number}|undefined{
 if(n.kind==='stump'&&n.id.startsWith('growth-')){const size=n.treeSpecies==='pine'?48:56;return{texture:`ecology-${n.treeSpecies??'oak'}-stump`,width:size,height:size,pivot:252/256};}
 if(n.kind!=='standingTree'||n.treeStage===undefined)return;
 const species=n.treeSpecies??'oak',stage=n.treeStage;
 if(stage===3)return{texture:`asset-${species==='pine'?'pine':'tree'}-0`,width:166,height:211,pivot:256/264};
 const dimensions=stage===0?[32,42]:stage===1?[48,65]:[98,135];
 return{texture:`ecology-${species}-${stage===0?'sprout':stage===1?'seedling':'young'}`,width:dimensions[0],height:dimensions[1],pivot:252/256};
}
export function styleGrowingTree(image:Phaser.GameObjects.Image,n:ResourceNode):void{
 const art=growingTreeArt(n);if(art)image.setTexture(art.texture).setOrigin(.5,art.pivot).setDisplaySize(art.width,art.height);
 image.setData('tree-stage',n.treeStage??3);
}
