import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/landmarks/manifest.json';
import type {VillageLandmark} from './data/village-landmarks';

/** Floor, pillars and roof need separate depths for a player standing inside.
 * Layering happens only in cached textures; original art remains untouched. */
export function drawVillageGazebo(scene:Phaser.Scene,p:VillageLandmark):Phaser.GameObjects.Image{
 const r=manifest.frames.gazebo;
 const keys=['village-gazebo-back','village-gazebo-front','village-gazebo-roof'];
 if(!scene.textures.exists(keys[0])){
  const source=scene.textures.get('village-landmark-source').getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=r.width;canvas.height=r.height;
  const c=canvas.getContext('2d')!;c.drawImage(source,r.x,r.y,r.width,r.height,0,0,r.width,r.height);
  const input=c.getImageData(0,0,r.width,r.height);
  const layers=keys.map(()=>c.createImageData(r.width,r.height));
  for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
   const at=(y*r.width+x)*4;if(input.data[at+3]<manifest.alphaCutoff)continue;
   const roof=y<201,front=!roof&&(x<62||x>281||y>=369);
   const output=layers[roof?2:front?1:0];
   output.data.set(input.data.subarray(at,at+4),at);output.data[at+3]=255;
  }
  for(const [i,key] of keys.entries()){
   const layer=document.createElement('canvas');layer.width=r.width;layer.height=r.height;
   layer.getContext('2d')!.putImageData(layers[i],0,0);scene.textures.addCanvas(key,layer)!.setFilter(0);
  }
 }
 const x=(p.x+.5)*32,y=p.y*32+25,scale=Math.min(p.width/r.width,p.height/r.height);
 const back=scene.add.image(x,y,keys[0]).setOrigin(.5,1).setScale(scale).setDepth(-45);
 back.setData({'village-landmark':p.id,'village-landmark-kind':p.kind});
 scene.add.image(x,y,keys[1]).setOrigin(.5,1).setScale(scale).setDepth(y).setData('village-gazebo-front',true);
 return scene.add.image(x,y,keys[2]).setOrigin(.5,1).setScale(scale).setDepth(y+1).setData('village-gazebo-roof',true);
}
