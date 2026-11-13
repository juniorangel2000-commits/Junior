import layouts from './data/crop-sprite-layout.json';
import {cropTexture,type CropId} from './data/crops';

// Rasteiras ocupam o centro do canteiro; plantas altas se apoiam pela raiz.
const LOW_CROPS:readonly CropId[]=['turnip','lettuce','watermelon','sweetPotato','pumpkin','cabbage','strawberry'];
export function cropSpriteLayout(crop:{crop?:CropId;growth:number}){
 const texture=cropTexture(crop),bounds=layouts[texture as keyof typeof layouts];
 const seed=crop.growth<=0,low=seed||LOW_CROPS.includes(crop.crop??'turnip');
 const size=seed?{width:11,height:5}:crop.growth>=1?{width:26,height:low?26:34}:{width:24,height:low?24:32};
 const pivotX=low?(bounds.left+bounds.right+1)/2:bounds.rootX+.5;
 const scale=Math.min(size.width/(bounds.right-bounds.left+1),size.height/(bounds.bottom-bounds.top+1),14/Math.max(pivotX-bounds.left,bounds.right+1-pivotX),38/192);
 const pivotY=low?(bounds.top+bounds.bottom+1)/2:bounds.bottom-1;
 return {texture,x:16,y:low?16:21,originX:pivotX/bounds.width,originY:pivotY/bounds.height,width:bounds.width*scale,height:bounds.height*scale,depth:22};
}
