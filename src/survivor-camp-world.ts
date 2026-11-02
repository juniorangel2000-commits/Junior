import Phaser from 'phaser';
import type {WorldEditorObject} from './world';
import type {MapEditData} from './systems/map-editor';
import {CAMP_OFFSET,CAMP_FRAMES,campPathDistance,campObjects,campBlockedPoint} from './data/survivor-camp';
import {readTerrainSprites} from './terrain-sprites';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {drawExitSign} from './exit-signs';
import {CAMP_ENTRY,CAMP_EXIT} from './data/survivor-camp';
export function preloadSurvivorCamp(scene:Phaser.Scene):void {
 for(const sex of ['female','male'])if(!scene.textures.exists('camp-look-'+sex))scene.load.image('camp-look-'+sex,'assets/visual/survivor-camp/'+sex+'-idle.png');
 if(!scene.textures.exists('camp-props'))scene.load.image('camp-props','assets/visual/survivor-camp/props.png');
 if(!scene.textures.exists('camp-fences'))scene.load.image('camp-fences','assets/visual/survivor-camp/fences.png');
}
function setupCampArt(scene:Phaser.Scene):void {for(const[name,rect]of Object.entries(CAMP_FRAMES)){const texture=scene.textures.get(name==='fence'?'camp-fences':'camp-props');if(!texture.has(name))texture.add(name,0,rect[0],rect[1],rect[2],rect[3]);}}
export class SurvivorCampWorld {
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly editorObjects:WorldEditorObject[]=[];
 private objects:Phaser.GameObjects.GameObject[]=[];
 constructor(private scene:Phaser.Scene,readonly edits?:MapEditData){
  setupCampArt(scene);const before=new Set(scene.children.list);this.ground();
  if(edits)drawMapTerrainEdits(scene,edits.terrain,'survivor-camp-edits',()=>false,'forest',false);
  for(const o of campObjects(edits)){
   if(!scene.textures.exists(o.texture))continue;
   const image=scene.add.image(o.x,o.y,o.texture,o.frame).setOrigin(.5,o.pivot).setDisplaySize(o.width,o.height).setFlipX(o.flip).setDepth(o.y);
   this.editorObjects.push({id:o.id,kind:o.kind,x:Math.floor(o.x/32),y:Math.floor(o.y/32),texture:o.texture});
   if(o.kind==='standingTree'||o.kind==='pine')this.trees.push(image);
  }
  drawExitSign(scene,edits?.points?.exit??CAMP_EXIT,edits?.points?.entry??CAMP_ENTRY);
  this.objects=scene.children.list.filter(o=>!before.has(o));
 }
 blockedPoint=(x:number,y:number)=>campBlockedPoint(x,y,this.edits);
 waterAt=(x:number,y:number)=>this.edits?.terrain[`${x},${y}`]==='water';
 private ground():void {
  const key='survivor-camp-ground-v1';
  if(!this.scene.textures.exists(key)){
   const sprites=readTerrainSprites(this.scene)!,canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   const tile=this.scene.textures.get('asset-ground-forest').getSourceImage() as HTMLCanvasElement;
   for(let y=0;y<2304;y+=96)for(let x=0;x<3072;x+=96)ctx.drawImage(tile,x,y);
   const W=1600,H=1792,pixels=ctx.createImageData(W,H),smooth=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const wx=x+CAMP_OFFSET.x,wy=y+CAMP_OFFSET.y,edge=(Math.hypot((x-805)/620,(y-675)/480)-1)*400+Math.sin(x*.019+y*.011)*16+Math.sin(y*.039)*10,clearing=smooth((36-edge)/70),trail=campPathDistance(wx,wy)+Math.sin(x*.039+y*.027)*6+Math.sin(y*.077)*3,dirt=Math.max(smooth((41-trail)/27),Math.max(0,1-Math.hypot((x-810)/230,(y-685)/170))*.46),i=(y*W+x)*4,j=((wy%96)*96+wx%96)*4;
    for(let k=0;k<3;k++){const green=sprites.forest.pixels[j+k]*(1-clearing)+sprites.grass.pixels[j+k]*clearing;pixels.data[i+k]=green*(1-dirt*.86)+sprites['path-dry'].pixels[j+k]*dirt*.86;}pixels.data[i+3]=255;
   }
   ctx.putImageData(pixels,CAMP_OFFSET.x,CAMP_OFFSET.y);this.scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  this.scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
 }
 update(time:number):void {
  // A small glow below the flame, keeping all sprite detail at its original scale.
  const fire=this.objects.find(o=>(o as Phaser.GameObjects.Image).frame?.name==='fire') as Phaser.GameObjects.Image|undefined;if(fire)fire.setAlpha(.97+Math.sin(time*.006)*.03);
 }
 destroy():void{this.objects.forEach(o=>o.destroy());this.objects=[];this.trees.length=0;}
}
