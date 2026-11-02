import type Phaser from 'phaser';
import {readTerrainSprites} from './terrain-sprites';
import {waterFinishChannel} from './data/water-style';
import {waterSchools,waterFish} from './data/water-life';
let serial=0;
/** Identical material and current to the approved lake; one masked layer per map. */
export function setupWaterSurface(scene:Phaser.Scene):string {
 const key='lake-flow-original-water';if(scene.textures.exists(key))return key;
 const material=readTerrainSprites(scene)!.water,canvas=document.createElement('canvas');canvas.width=canvas.height=material.size;const c=canvas.getContext('2d')!,pixels=c.createImageData(material.size,material.size);
 for(let i=0;i<pixels.data.length;i+=4){for(let k=0;k<3;k++)pixels.data[i+k]=waterFinishChannel(material.pixels[i+k],k,-72);pixels.data[i+3]=255;}c.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas)!.setFilter(0);return key;
}
export function addWaterMotion(scene:Phaser.Scene,water:(x:number,y:number)=>boolean,contains?:(x:number,y:number)=>boolean,bounds:{width:number;height:number;alpha:number;depth?:number;opacity?:(x:number,y:number)=>number}={width:3072,height:2304,alpha:.3}):void {
 const point=contains??((x:number,y:number)=>water(Math.floor(x/32),Math.floor(y/32))),key=`world-water-mask-${++serial}`,canvas=document.createElement('canvas');canvas.width=bounds.width;canvas.height=bounds.height;const c=canvas.getContext('2d')!,pixels=c.createImageData(canvas.width,canvas.height);
 for(let ty=0;ty<Math.ceil(bounds.height/32);ty++)for(let tx=0;tx<Math.ceil(bounds.width/32);tx++){
  if(!water(tx,ty)&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>water(tx+dx,ty+dy)))continue;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(tx*32+x<bounds.width&&ty*32+y<bounds.height&&point(tx*32+x+.5,ty*32+y+.5)){const i=((ty*32+y)*bounds.width+tx*32+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(255*Math.max(0,Math.min(1,bounds.opacity?.(tx*32+x+.5,ty*32+y+.5)??1)));}
 }
 c.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas)!.setFilter(0);const image=scene.make.image({key,x:0,y:0,add:false}).setOrigin(0),mask='gl' in scene.game.renderer?image.createBitmapMask():undefined;
 const flow=scene.add.tileSprite(0,0,bounds.width,bounds.height,setupWaterSurface(scene)).setOrigin(0).setAlpha(bounds.alpha).setDepth(bounds.depth??-80).setVisible(!!mask).setData('water-surface',true),fish=scene.add.graphics().setDepth((bounds.depth??-80)-1).setData('water-fish',true),waves=scene.add.graphics().setDepth((bounds.depth??-80)+1).setData('water-reflections',true);
 if(mask){flow.setMask(mask);fish.setMask(mask);waves.setMask(mask);}const schools=waterSchools(point);let destroyed=false;
 const update=(time:number)=>{if(destroyed)return;flow.tilePositionX=-time*.007;flow.tilePositionY=time*.0035;fish.clear();waves.clear();for(const p of waterFish(time,schools,point)){fish.save();fish.translateCanvas(p.x,p.y);fish.rotateCanvas(p.angle);fish.fillStyle(0x0a3034,p.alpha);fish.fillEllipse(0,0,15*p.size,5.5*p.size);fish.fillTriangle(-5*p.size,0,-12*p.size,-4*p.size,-12*p.size,4*p.size);fish.restore();}
  for(let i=0;i<112;i++){const phase=(time*.00013+i*.618)%1,x=32+(i*537.31)%3008+Math.sin(time*.0003+i)*9,y=32+(i*283.17)%2240+phase*12;if(!point(x,y))continue;const radius=8+phase*18;waves.lineStyle(1,0xb1ddd2,Math.sin(phase*Math.PI)*(.1+(i%4)*.025));waves.beginPath();for(let j=0;j<=6;j++){const px=x+(j/6-.5)*radius*2,py=y+Math.sin(j/6*Math.PI)*2;j?waves.lineTo(px,py):waves.moveTo(px,py);}waves.strokePath();}
 };
 const cleanup=()=>{if(destroyed)return;destroyed=true;scene.events.off('update',update);scene.events.off('shutdown',cleanup);flow.clearMask();fish.clearMask();waves.clearMask();mask?.destroy();image.destroy();fish.destroy();waves.destroy();scene.textures.remove(key);};
 flow.once('destroy',cleanup);scene.events.once('shutdown',cleanup);scene.events.on('update',update);update(0);
}
