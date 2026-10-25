import Phaser from 'phaser';
import {WATER_ANIMATION,animatedWaterRGB} from './data/water-animation';
import {readTerrainSprites} from './terrain-sprites';

/** Prebaked smooth waves. Per-cell shore masks keep every pixel off land and bridges. */
export function addWaterMotion(scene:Phaser.Scene,water:(x:number,y:number)=>boolean,contains?:(x:number,y:number)=>boolean):void {
  const {frames,fps,tile,period}=WATER_ANIMATION;
  const point=contains??((x:number,y:number)=>water(Math.floor(x/tile),Math.floor(y/tile)));
  // Nine shared phase tiles preserve the original 96px water drawing across seams.
  const sourceKey='water-surface-v3-base',columns=period/tile;
  const art=readTerrainSprites(scene)?.water;
  const sources:Uint8ClampedArray[]=[];
  for(let quadrant=0;quadrant<columns*columns;quadrant++) {
    const key=`${sourceKey}:${quadrant}`;
    if(!scene.textures.exists(key)) {
      const canvas=document.createElement('canvas');canvas.width=frames*tile;canvas.height=tile;
      const g=canvas.getContext('2d')!,image=g.createImageData(canvas.width,tile);
      for(let f=0;f<frames;f++)for(let y=0;y<tile;y++)for(let x=0;x<tile;x++) {
        const i=(y*canvas.width+f*tile+x)*4;
        image.data.set([...animatedWaterRGB(f,x+(quadrant%columns)*tile,y+Math.floor(quadrant/columns)*tile,art),190],i);
      }
      g.putImageData(image,0,0);scene.textures.addCanvas(key,canvas)?.setFilter(0);
    }
    const canvas=scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
    sources.push(canvas.getContext('2d')!.getImageData(0,0,canvas.width,tile).data);
  }
  for(let ty=1;ty<71;ty++)for(let tx=1;tx<95;tx++) {
    if(!water(tx,ty)&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>water(tx+dx,ty+dy)))continue;
    const mask=new Uint8Array(tile*tile);let count=0,hash=2166136261;
    for(let y=0;y<tile;y++)for(let x=0;x<tile;x++) {
      const wet=point(tx*tile+x+.5,ty*tile+y+.5);mask[y*tile+x]=Number(wet);count+=Number(wet);
      hash=Math.imul(hash^Number(wet),16777619)>>>0;
    }
    if(!count)continue;
    const quadrant=tx%columns+(ty%columns)*columns;
    const key=count===tile*tile?`${sourceKey}:${quadrant}`:`water-surface-v3:${quadrant}:${hash.toString(16)}:${count}`;
    if(!scene.textures.exists(key)) {
      const canvas=document.createElement('canvas');canvas.width=frames*tile;canvas.height=tile;
      const g=canvas.getContext('2d')!,image=g.createImageData(canvas.width,tile);image.data.set(sources[quadrant]);
      for(let f=0;f<frames;f++)for(let y=0;y<tile;y++)for(let x=0;x<tile;x++)if(!mask[y*tile+x])image.data[(y*canvas.width+f*tile+x)*4+3]=0;
      g.putImageData(image,0,0);scene.textures.addCanvas(key,canvas)?.setFilter(0);
    }
    const texture=scene.textures.get(key);
    if(!texture.has('0'))for(let f=0;f<frames;f++)texture.add(f,0,f*tile,0,tile,tile);
    if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:frames},(_,frame)=>({key,frame})),frameRate:fps,repeat:-1});
    scene.add.sprite(tx*tile,ty*tile,key,0).setOrigin(0).setDepth(-80).play(key).setData('water-surface',true);
  }
}
