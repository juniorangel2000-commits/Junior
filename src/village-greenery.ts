import {villageNorthConnectionDistance} from './data/city-forest';
import {VILLAGE_DRESSING,villageDressingBounds} from './data/village-dressing';
import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/greenery/manifest.json';
import {VILLAGE_BUILDINGS,VILLAGE_PROPS,villageBlockedAt,villageDoorApproach,villageLakeDistance,villagePathEdge,villagePlazaDistance,villageWaterPoint} from './data/village';
import {villageLandmarkClearing} from './data/village-landmarks';
import type {MapEditData} from './systems/map-editor';
import {villageBuildingArtBands,villageArtRectsOverlap} from './data/village-building-art';
import {villagePierNear} from './data/village-pier';

export const VILLAGE_GREENERY='village-greenery';
export function preloadVillageGreenery(scene:Phaser.Scene):void{
 scene.load.image('village-greenery-source',manifest.file);
}
export function setupVillageGreenery(scene:Phaser.Scene):void{
 if(scene.textures.exists(VILLAGE_GREENERY))return;
 const source=scene.textures.get('village-greenery-source').getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d')!;c.drawImage(source,0,0);
 const pixels=c.getImageData(0,0,canvas.width,canvas.height);
 for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=manifest.alphaCutoff?255:0;
 c.putImageData(pixels,0,0);
 const texture=scene.textures.addCanvas(VILLAGE_GREENERY,canvas)!;texture.setFilter(0);
 for(const [id,r] of Object.entries(manifest.frames))texture.add(id,0,r.x,r.y,r.width,r.height);
}

const MEADOW_PATCHES=[
 [33,39],[30,43],[37,47],[38,51],[41,57],[50,52],[57,48],[63,40],
 [70,37],[67,50],[57,59],[26,54],[24,32],[36,29],[51,24],[67,29],
 [78,56],[53,20],[35,18],[66,59],[27,20],[29,40],[51,48],[71,54],
 [25,28],[25,30],[29,38],[32,42],[35,44],[40,47],[42,49],[42,52],
 [43,55],[44,57],[48,51],[50,49],[52,54],[53,56],[55,57],[61,61],
 [68,55],[72,56],[69,51],[72,35],[61,37],[65,38],[60,41],[24,45],
 [24,49],[22,54],[22,57],[34,62],[40,63],[52,63],[57,63],
] as const;

const BUILDING_ART_BANDS=VILLAGE_BUILDINGS.flatMap(villageBuildingArtBands);

export function villageBuildingGrassClearing(x:number,y:number):boolean{
 const px=(x+.5)*32,py=y*32+25;
 const grass={left:px-28,top:py-46,right:px+28,bottom:py+4};
 return BUILDING_ART_BANDS.some(b=>villageArtRectsOverlap(grass,b))||VILLAGE_DRESSING.some(p=>villageArtRectsOverlap(grass,villageDressingBounds(p)));
}

const grassBoundsPoints=(x:number,y:number)=>[-24,0,24].flatMap(dx=>[-42,-21,0].map(dy=>({x:(x+.5)*32+dx,y:y*32+25+dy})));
export const villageGrassClearOfPaths=(x:number,y:number,edits?:MapEditData):boolean=>
 grassBoundsPoints(x,y).every(p=>{
  const kind=edits?.terrain[`${Math.floor(p.x/32)},${Math.floor(p.y/32)}`];
  return villageNorthConnectionDistance(p.x/32,p.y/32)>1.2&&(!kind||['grass','meadow','forest','moss'].includes(kind))&&villagePathEdge(p.x/32-.5,p.y/32-.5)>.2;
 });
export const villageGrassClearOfWater=(x:number,y:number,edits?:MapEditData):boolean=>
 grassBoundsPoints(x,y).every(p=>villageLakeDistance(p.x/32,p.y/32)>.35&&!villageWaterPoint(p.x,p.y,edits)&&!villagePierNear(p.x,p.y));

/** Crossable foliage belongs to small planted groups, not a uniform scatter.
 * Reserve entire building silhouettes so blades never poke through a roof. */
export function villageTallGrassPositions():{x:number;y:number;variant:number}[]{
 const result:{x:number;y:number;variant:number}[]=[];
 const pockets=MEADOW_PATCHES.filter((_,index)=>index%3!==1);
 for(const [index,center] of pockets.entries())for(let i=0;i<24+index%5;i++){
  const angle=i*2.4+index*.7,radius=i===0?0:Math.sqrt(i/28)*2.3;
  const x=center[0]+Math.cos(angle)*radius,y=center[1]+Math.sin(angle)*radius*.72;
  if(villagePlazaDistance(x,y)<1.12||!villageGrassClearOfPaths(x,y)||!villageGrassClearOfWater(x,y))continue;
  if(villageDoorApproach(x,y)||villageLandmarkClearing(x,y,18)||villageBlockedAt(Math.floor(x+.5),Math.floor(y+.5)))continue;
  if(VILLAGE_PROPS.some(p=>Math.hypot(p.x-x,p.y-y)<1.25))continue;
  if(villageBuildingGrassClearing(x,y))continue;
  if(result.some(p=>Math.hypot(p.x-x,p.y-y)<.65))continue;
  result.push({x,y,variant:(index+i)%3});
 }
 return result;
}

export function drawVillageTallGrass(scene:Phaser.Scene,edits?:MapEditData):void{
 for(const p of villageTallGrassPositions()){
  if(!villageGrassClearOfPaths(p.x,p.y,edits)||!villageGrassClearOfWater(p.x,p.y,edits))continue;
  const frame=['grass-a','grass-b','grass-c'][p.variant],r=manifest.frames[frame as keyof typeof manifest.frames];
  const scale=Math.min(48/r.width,42/r.height),y=p.y*32+25;
  scene.add.image((p.x+.5)*32,y,VILLAGE_GREENERY,frame).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData('village-tall-grass',true);
 }
}
