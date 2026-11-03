import {joinMineTextureEdges} from './data/mine-surface';
import Phaser from 'phaser';
import {organicMineWallContains,organicMineFloorCornerRock,MINE_FLOOR_CORNER_MASKS} from './data/mine-wall-shape';
import family from '../public/assets/visual/mine/mineral-family.json';
import type {Metal} from './data/economy-balance';
export const MINE_TERRAIN_ATLAS='mine-front-wall-tiles';
export const MINE_HIDDEN_ROCK_TILE=1664;
export const MINE_METALS:readonly Metal[]=['iron','gold','blackMetal'];
export const MINE_ORE_ATLASES=MINE_METALS.map((metal,i)=>({metal,key:'mine-encrusted-'+metal,gid:3000+i*2000}));
export const MINE_ROCK_SHADOW=[23,19,24] as const;
export function preloadMineMinerals(scene:Phaser.Scene):void{
 if(!scene.textures.exists('mine-wall-materials'))scene.load.image('mine-wall-materials','assets/visual/mine/wall-stone-continuous.png');
 if(!scene.textures.exists('detailed-ore-atlas'))scene.load.image('detailed-ore-atlas','assets/visual/mine/mineral-family.png');
}
export const mineMineralTile=(metal:Metal,mask:number,pattern:number)=>MINE_ORE_ATLASES[MINE_METALS.indexOf(metal)].gid+mask*64+pattern;
/** World-aligned bedrock remains continuous across cells. Ore is an alpha inlay:
 * it never replaces the stone underneath with a different, randomly cut wall. */
export function createMineMineralAtlas(scene:Phaser.Scene):void{
 if(scene.textures.exists(MINE_TERRAIN_ATLAS))return;
 const floor=scene.textures.get('mine-terrain-materials').getSourceImage() as HTMLImageElement;
 const stone=scene.textures.get('mine-wall-materials').getSourceImage() as HTMLImageElement;
 const surface=document.createElement('canvas');surface.width=surface.height=256;const material=surface.getContext('2d')!;material.imageSmoothingEnabled=false;material.drawImage(stone,0,0,256,256);const materialPixels=material.getImageData(0,0,256,256);joinMineTextureEdges(materialPixels.data,256,256);material.putImageData(materialPixels,0,0);
 const minerals=scene.textures.get('detailed-ore-atlas').getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1696;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const tile=document.createElement('canvas');tile.width=tile.height=32;const paint=tile.getContext('2d')!;paint.imageSmoothingEnabled=false;
 const masks=new Map<string,Uint8Array>();
 const shape=(pattern:number,mask:number,corner=false)=>{
  const key=pattern+':'+mask+':'+corner;let alpha=masks.get(key);if(alpha)return alpha;alpha=new Uint8Array(1024);
  const tx=pattern%8,ty=Math.floor(pattern/8);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)alpha[y*32+x]=Number(corner?organicMineFloorCornerRock(x+.5,y+.5,mask,tx,ty):organicMineWallContains(x+.5,y+.5,mask,tx,ty));
  masks.set(key,alpha);return alpha;
 };
 const sampleFloor=(pattern:number,x:number,y:number)=>{const w=floor.width/2,h=floor.height/2;c.drawImage(floor,pattern%8*w/8,Math.floor(pattern/8)*h/8,w/8,h/8,x,y,32,32);};
 const wall=(pattern:number,mask:number,corner=false)=>{
  paint.clearRect(0,0,32,32);paint.drawImage(surface,pattern%8*32,Math.floor(pattern/8)*32,32,32,0,0,32,32);
  const pixels=paint.getImageData(0,0,32,32),alpha=shape(pattern,mask,corner);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const i=(y*32+x)*4;if(!alpha[y*32+x]){pixels.data[i+3]=0;continue;}
   let fade=1;
   if(!corner){
    if(!(mask&4)&&mask&1)fade=Math.min(fade,(y+.5)/10);
    if(!(mask&1)&&mask&4)fade=Math.min(fade,(31.5-y)/10);
    if(!(mask&2)&&mask&8)fade=Math.min(fade,(x+.5)/10);
    if(!(mask&8)&&mask&2)fade=Math.min(fade,(31.5-x)/10);
   }
   for(let k=0;k<3;k++)pixels.data[i+k]=MINE_ROCK_SHADOW[k]*(1-fade)+pixels.data[i+k]*fade;
  }
  paint.putImageData(pixels,0,0);return tile;
 };
 for(let p=0;p<64;p++)sampleFloor(p,p%32*32,Math.floor(p/32)*32);
 for(let mask=0;mask<16;mask++)for(let p=0;p<64;p++){const i=64+mask*64+p,x=i%32*32,y=Math.floor(i/32)*32;sampleFloor(p,x,y);c.drawImage(wall(p,mask),x,y);}
 MINE_FLOOR_CORNER_MASKS.forEach((mask,kind)=>{for(let p=0;p<64;p++){const i=1088+kind*64+p,x=i%32*32,y=Math.floor(i/32)*32;sampleFloor(p,x,y);c.drawImage(wall(p,mask,true),x,y);}});
 c.fillStyle=`rgb(${MINE_ROCK_SHADOW.join(',')})`;c.fillRect(0,1664,32,32);
 scene.textures.addCanvas(MINE_TERRAIN_ATLAS,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
 for(const {key,metal}of MINE_ORE_ATLASES){
  const atlas=document.createElement('canvas');atlas.width=atlas.height=1024;const g=atlas.getContext('2d')!;g.imageSmoothingEnabled=false;
  const f=family.frames[('inlay-'+metal)as keyof typeof family.frames],b=f.bounds,scale=27/Math.max(b[2]-b[0],b[3]-b[1]),w=(b[2]-b[0])*scale,h=(b[3]-b[1])*scale;
  for(let mask=0;mask<15;mask++)for(let p=0;p<64;p++){
   paint.clearRect(0,0,32,32);paint.save();paint.translate(16+(p%3-1),16+(Math.floor(p/3)%3-1));paint.rotate([0,.38,-.28,.85][p%4]);paint.drawImage(minerals,f.x+b[0],f.y+b[1],b[2]-b[0],b[3]-b[1],-w/2,-h/2,w,h);paint.restore();
   const pixels=paint.getImageData(0,0,32,32),alpha=shape(p,mask);for(let i=0;i<1024;i++)if(!alpha[i])pixels.data[i*4+3]=0;paint.putImageData(pixels,0,0);
   const i=mask*64+p;g.drawImage(tile,i%32*32,Math.floor(i/32)*32);
  }
  scene.textures.addCanvas(key,atlas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
}
