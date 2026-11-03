import Phaser from 'phaser';
import {organicMineWallContains,organicMineFloorCornerRock,MINE_FLOOR_CORNER_MASKS} from './data/mine-wall-shape';
import type {Metal} from './data/economy-balance';
export const MINE_TERRAIN_ATLAS='mine-front-wall-tiles';
export const MINE_HIDDEN_ROCK_TILE=1664;
export const MINE_METALS:readonly Metal[]=['iron','gold','blackMetal'];
export const MINE_ORE_ATLASES=MINE_METALS.map((metal,i)=>({metal,key:'mine-encrusted-'+metal,gid:3000+i*2000}));
export const MINE_ROCK_SHADOW=[23,19,24] as const;
export function preloadMineMinerals(scene:Phaser.Scene):void{
 if(!scene.textures.exists('mine-wall-materials'))scene.load.image('mine-wall-materials','assets/visual/mine/front-wall-materials.png');
}
export const mineMineralTile=(metal:Metal,mask:number,pattern:number)=>MINE_ORE_ATLASES[MINE_METALS.indexOf(metal)].gid+mask*64+pattern;
/** Same stone geometry and alpha for bare rock and its three raw encrusted mineral variants. */
export function createMineMineralAtlas(scene:Phaser.Scene):void{
 if(scene.textures.exists(MINE_TERRAIN_ATLAS))return;
 const floor=scene.textures.get('mine-terrain-materials').getSourceImage() as HTMLImageElement,walls=scene.textures.get('mine-wall-materials').getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1696;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const tile=document.createElement('canvas');tile.width=tile.height=32;const paint=tile.getContext('2d')!;paint.imageSmoothingEnabled=false;
 const sampleFloor=(pattern:number,x:number,y:number,destination=c)=>{const w=floor.width/2,h=floor.height/2;destination.drawImage(floor,pattern%8*w/8,Math.floor(pattern/8)*h/8,w/8,h/8,x,y,32,32);};
 const rawPatch=(pattern:number,material:number)=>{
  const qw=walls.width/2,qh=walls.height/2;paint.clearRect(0,0,32,32);
  paint.drawImage(walls,(material%2)*qw+(pattern%8)*qw/8,Math.floor(material/2)*qh+Math.floor(pattern/8)*qh/8,qw/8,qh/8,0,0,32,32);
 };
 // Choose vein-bearing native patches when a subsection is mostly bare stone.
 const orePatterns:number[][]=[Array.from({length:64},(_,i)=>i)];
 for(let material=1;material<=3;material++){
  const scores=Array.from({length:64},(_,pattern)=>{
   rawPatch(pattern,material);const p=paint.getImageData(0,0,32,32).data;let score=0;
   for(let y=7;y<25;y++)for(let x=7;x<25;x++){const i=(y*32+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(material===2?r>90&&g>65&&g/r>.6&&b/g<.72:Math.max(r,g,b)-Math.min(r,g,b)<35&&b>40&&r+g+b>180)score++;}
   return score;
  });
  const best=Array.from({length:64},(_,i)=>i).sort((a,b)=>scores[b]-scores[a]).slice(0,4);
  orePatterns.push(scores.map((score,i)=>score>=10?i:best[i%best.length]));
 }
 const wallTile=(pattern:number,mask:number,material:number,floorCorner=false)=>{
  rawPatch(orePatterns[material][pattern],material);
  const pixels=paint.getImageData(0,0,32,32),tx=pattern%8,ty=Math.floor(pattern/8);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const i=(y*32+x)*4,contains=floorCorner?organicMineFloorCornerRock(x+.5,y+.5,mask,tx,ty):organicMineWallContains(x+.5,y+.5,mask,tx,ty);
   if(!contains){pixels.data[i+3]=0;continue;}
   // The rear of an exposed face disappears into the hidden rock mass.
   let fade=1;
   if(!floorCorner){
    if(!(mask&4)&&mask&1)fade=Math.min(fade,(y+.5)/9);
    if(!(mask&1)&&mask&4)fade=Math.min(fade,(31.5-y)/9);
    if(!(mask&2)&&mask&8)fade=Math.min(fade,(x+.5)/9);
    if(!(mask&8)&&mask&2)fade=Math.min(fade,(31.5-x)/9);
   }
   if(fade<1)for(let channel=0;channel<3;channel++)pixels.data[i+channel]=MINE_ROCK_SHADOW[channel]*(1-fade)+pixels.data[i+channel]*fade;
  }
  paint.putImageData(pixels,0,0);return tile;
 };
 for(let pattern=0;pattern<64;pattern++)sampleFloor(pattern,pattern%32*32,Math.floor(pattern/32)*32);
 for(let mask=0;mask<16;mask++)for(let pattern=0;pattern<64;pattern++){
  const index=64+mask*64+pattern,x=index%32*32,y=Math.floor(index/32)*32;sampleFloor(pattern,x,y);c.drawImage(wallTile(pattern,mask,0),x,y);
 }
 MINE_FLOOR_CORNER_MASKS.forEach((mask,kind)=>{for(let pattern=0;pattern<64;pattern++){const i=1088+kind*64+pattern,x=i%32*32,y=Math.floor(i/32)*32;sampleFloor(pattern,x,y);c.drawImage(wallTile(pattern,mask,0,true),x,y);}});
 c.fillStyle=`rgb(${MINE_ROCK_SHADOW.join(',')})`;c.fillRect(0,1664,32,32);
 scene.textures.addCanvas(MINE_TERRAIN_ATLAS,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
 MINE_ORE_ATLASES.forEach(({key},index)=>{
  const atlas=document.createElement('canvas');atlas.width=atlas.height=1024;const g=atlas.getContext('2d')!;g.imageSmoothingEnabled=false;
  for(let mask=0;mask<16;mask++)for(let pattern=0;pattern<64;pattern++){const i=mask*64+pattern;g.drawImage(wallTile(pattern,mask,index+1),i%32*32,Math.floor(i/32)*32);}
  scene.textures.addCanvas(key,atlas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
 });
}
