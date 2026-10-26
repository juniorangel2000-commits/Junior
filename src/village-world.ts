import {villageWater,villageLakeDistance} from './data/village';
import {addWaterMotion} from './water-motion';
import type Phaser from 'phaser';
import {readTerrainSprites} from './terrain-sprites';
import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './data/world-size';
import {VILLAGE_BUILDINGS,VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_NPCS,VILLAGE_PROPS,VILLAGE_TREES,villageBlockedAt,villagePlazaDistance,villageRoadDistance} from './data/village';
import {natureArt} from './data/nature-catalog';
import {drawExitSign} from './exit-signs';
import {drawHouseSmoke} from './house-smoke';
import {drawHouseWindowGlow,HOUSE_FOOT,HOUSE_SPRITE_SIZE} from './house-sprites';
import {windowLight} from './solar-light';
import {getVisualSettings} from './visual-settings';
import {setupVillageArt} from './village-art';
import type {ResourceNode} from './types';
import type {WorldEditorObject} from './world';

const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const MAP_WIDTH=WORLD_WIDTH*TILE,MAP_HEIGHT=WORLD_HEIGHT*TILE;

/** Bake crisp source materials, feathering their weights rather than blurring
 * pixels. Geometry is sampled on an 8px grid and interpolated below: movement
 * never reruns the expensive terrain generation. */
function drawGround(scene:Phaser.Scene):void {
 const key='village-ground-v1';
 if(!scene.textures.exists(key)){
  const canvas=document.createElement('canvas');canvas.width=MAP_WIDTH;canvas.height=MAP_HEIGHT;
  const c=canvas.getContext('2d')!,sprites=readTerrainSprites(scene);c.imageSmoothingEnabled=false;
  if(sprites){
   const step=8,columns=MAP_WIDTH/step+1,rows=MAP_HEIGHT/step+1;
   const fields=new Float32Array(columns*rows*4);
   for(let gy=0;gy<rows;gy++)for(let gx=0;gx<columns;gx++){
    const tx=gx*step/TILE,ty=gy*step/TILE;
    const edge=Math.min(tx,WORLD_WIDTH-tx,ty,WORLD_HEIGHT-ty);
    const woodland=(1-smooth((edge-3-Math.sin(tx*.27+ty*.13)*1.4)/10))*.76;
    const road=villageRoadDistance(tx-.5,ty-.5),rough=Math.sin(tx*1.8+ty*.7)*.12+Math.sin(ty*2.3)*.08;
    const path=1-smooth((road-1.10+rough)/1.05);
    const plaza=1-smooth((villagePlazaDistance(tx-.5,ty-.5)-.93+rough*.07)/.15);
    const at=(gy*columns+gx)*4;
    fields[at]=(1-plaza)*(1-path)*(1-woodland);
    fields[at+1]=(1-plaza)*(1-path)*woodland;
    fields[at+2]=(1-plaza)*path;fields[at+3]=plaza;
   }
   const pixels=c.createImageData(MAP_WIDTH,MAP_HEIGHT),materials=[sprites.grass,sprites.forest,sprites['path-dry'],sprites.paving];
   const size=materials[0].size;
   const mixed=[0,0,0,0];
   for(let y=0;y<MAP_HEIGHT;y++){
    const gy=Math.floor(y/step),fy=(y%step)/step,sourceRow=(y%size)*size;
    for(let x=0;x<MAP_WIDTH;x++){
     const gx=Math.floor(x/step),fx=(x%step)/step,a=(gy*columns+gx)*4,b=a+4,d=a+columns*4,e=d+4;
     for(let m=0;m<4;m++)mixed[m]=(fields[a+m]*(1-fx)+fields[b+m]*fx)*(1-fy)+(fields[d+m]*(1-fx)+fields[e+m]*fx)*fy;
     const at=(y*MAP_WIDTH+x)*4,source=(sourceRow+x%size)*4;
     for(let channel=0;channel<3;channel++){
      let value=0;
      for(let m=0;m<4;m++){
       if(mixed[m]<.0001)continue;
       value+=materials[m].pixels[source+channel]*mixed[m];
      }
      pixels.data[at+channel]=value;
     }
     pixels.data[at+3]=255;
    }
   }
   c.putImageData(pixels,0,0);
  }else {c.fillStyle='#5c8533';c.fillRect(0,0,MAP_WIDTH,MAP_HEIGHT);}
  scene.textures.addCanvas(key,canvas)?.setFilter(0);
 }
 scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
}

/** Static village scenery. NPC movement/dialogue and shop transactions belong
 * to VillageScene; town decorations are not collectible resource nodes. */
export class VillageWorld {
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly editorObjects:WorldEditorObject[]=[];
 readonly resources:ResourceNode[]=[];
 readonly solid=new Set<string>();
 private readonly environment:Phaser.GameObjects.GameObject[];
 private readonly lamps:Phaser.GameObjects.Graphics[]=[];
 private readonly windows:Phaser.GameObjects.Image[]=[];
 private readonly smoke:Array<{destroy():void}>=[];
 private elapsed=0;
 constructor(private readonly scene:Phaser.Scene){
  const before=new Set(scene.children.list);setupVillageArt(scene);drawGround(scene);
  this.drawLake();this.drawTrees();this.drawBuildings();this.drawGardens();this.drawProps();
  drawExitSign(scene,VILLAGE_EXIT,VILLAGE_ENTRY);
  this.environment=scene.children.list.filter(object=>!before.has(object));
  for(let y=0;y<WORLD_HEIGHT;y++)for(let x=0;x<WORLD_WIDTH;x++)if(villageBlockedAt(x,y))this.solid.add(`${x},${y}`);
 }
 entry(){return VILLAGE_ENTRY;}
 exit(){return VILLAGE_EXIT;}
 isBlocked=(x:number,y:number):boolean=>x<1||y<1||x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1||this.solid.has(`${x},${y}`);
 waterAt=(x:number,y:number):boolean=>villageWater(x,y);
 waterPointAt=(x:number,y:number):boolean=>villageLakeDistance(x/32,y/32)<0;
 resourceAt=(_x:number,_y:number):ResourceNode|undefined=>undefined;
 update(timeMs:number):void {if(Number.isFinite(timeMs))this.elapsed=timeMs;}
 updateLighting(time:number):void {
  const settings=getVisualSettings(),alpha=settings.daylight&&settings.dynamicLighting?windowLight(time)*settings.intensity:0;
  for(const pane of this.windows)pane.setVisible(alpha>0).setAlpha(alpha*.88);
  for(let index=0;index<this.lamps.length;index++){
   const lamp=this.lamps[index],flicker=.96+Math.sin(this.elapsed*.002+index)*.025;
   lamp.setVisible(alpha>0).setAlpha(alpha*flicker);
  }
 }
 destroy():void {
  this.smoke.forEach(plume=>plume.destroy());this.environment.forEach(object=>{if(object.active)object.destroy();});
 }
 private drawLake():void {
  const key='village-lake-v1';
  if(!this.scene.textures.exists(key)){
   const sprites=readTerrainSprites(this.scene);if(!sprites)return;
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
   const c=canvas.getContext('2d')!,pixels=c.createImageData(512,640);
   for(let y=0;y<640;y++)for(let x=0;x<512;x++){
    const wx=79*32+x,wy=34*32+y,d=villageLakeDistance(wx/32,wy/32),at=(y*512+x)*4;if(d>1.4)continue;
    const water=1-Math.max(0,Math.min(1,(d+.12)/.24));
    const a=sprites.water,b=sprites.sand,ai=((wy%a.size)*a.size+wx%a.size)*4,bi=((wy%b.size)*b.size+wx%b.size)*4;
    for(let channel=0;channel<3;channel++)pixels.data[at+channel]=a.pixels[ai+channel]*water+b.pixels[bi+channel]*(1-water);
    pixels.data[at+3]=Math.round(255*(1-Math.max(0,Math.min(1,(d-.8)/.6))));
   }
   c.putImageData(pixels,0,0);this.scene.textures.addCanvas(key,canvas)?.setFilter(0);
  }
  this.scene.add.image(79*32,34*32,key).setOrigin(0).setDepth(-94);
  addWaterMotion(this.scene,this.waterAt,this.waterPointAt);
 }
 private drawTrees():void {
  for(const tree of VILLAGE_TREES){
   const art=natureArt(tree.kind)!;
   const sprite=this.scene.add.image(tree.x*TILE+16,tree.y*TILE+25,art.texture).setOrigin(.5,art.pivot)
    .setDisplaySize(art.width,art.height).setDepth(tree.y*TILE+25);
   this.trees.push(sprite);this.editorObjects.push({id:`editor-${tree.kind}-village-${tree.x}-${tree.y}`,kind:tree.kind,x:tree.x,y:tree.y,texture:art.texture});
  }
 }
 private drawBuildings():void {
  for(const [index,building] of VILLAGE_BUILDINGS.entries()){
   const x=(building.x+.5)*TILE,y=building.y*TILE+25;
   const house=this.scene.add.image(x,y,'asset-house').setOrigin(.5,HOUSE_FOOT.y/HOUSE_SPRITE_SIZE.height)
    .setDepth(y).setFlipX(!!building.flip).setData('village-building',building.id);
   if(building.shop)this.scene.add.image(x,y+3,`village-shop-${building.shop}`).setOrigin(.5,1).setDepth(y+.5);
   // Daylight handles the first native cottage; all other panes use its exact
   // source mask and the same dusk curve, with no rectangles over the frames.
   if(index>0){const glow=drawHouseWindowGlow(this.scene,house);if(glow)this.windows.push(glow);}
   if(building.shop==='blacksmith'){
    this.scene.add.image(x+75,y+32,'economy-workshop-anvil').setOrigin(.5,1).setDisplaySize(46,46).setDepth(y+32);
    this.scene.add.image(x+100,y+20,'economy-workshop-tongs').setOrigin(.5,1).setDisplaySize(26,26).setDepth(y+20);
   }
   if(building.shop==='blacksmith'||building.shop==='inn')this.smoke.push(drawHouseSmoke(this.scene,house));
  }
 }
 private drawProps():void {
  for(const prop of VILLAGE_PROPS){
   const x=(prop.x+.5)*TILE,y=prop.y*TILE+25;
   if(prop.kind==='well'&&this.scene.textures.exists('property-well-idle')){
    this.scene.add.image(x,y,'property-well-idle').setOrigin(.5,1).setScale(.49).setDepth(y);
   }else if(prop.kind==='bench'){
    this.scene.add.image(x,y,'bench').setOrigin(.5,1).setDisplaySize(58,58).setDepth(y);
   }else if(prop.kind==='lantern'){
    this.scene.add.image(x,y,'village-lantern').setOrigin(.5,1).setDepth(y);
    const glow=this.scene.add.graphics().setPosition(x,y-55).setDepth(4999).setVisible(false);
    for(let ring=6;ring>0;ring--)glow.fillStyle(0xf9d47b,.011).fillCircle(0,0,ring*12);
    glow.fillStyle(0xffe3a0,.25).fillCircle(0,0,7);this.lamps.push(glow);
   }
  }
 }
 private drawGardens():void {
  const occupied=(x:number,y:number)=>villageBlockedAt(x,y)||villageRoadDistance(x,y)<2||VILLAGE_NPCS.some(n=>Math.abs(x-n.x)<2&&Math.abs(y-n.y)<2);
  const patches=[{x:24,y:25,kind:'whiteFlowers'},{x:28,y:35,kind:'berryBush'},
   {x:61,y:34,kind:'whiteFlowers'},{x:62,y:26,kind:'bush'},
   {x:29,y:53,kind:'whiteFlowers'},{x:66,y:54,kind:'whiteFlowers'},
   {x:51,y:25,kind:'whiteFlowers'},{x:41,y:21,kind:'bush'},
   {x:56,y:47,kind:'whiteFlowers'},{x:69,y:23,kind:'berryBush'}] as const;
  for(const patch of patches)for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){
   const x=patch.x+dx,y=patch.y+dy;if(occupied(x,y))continue;
   const art=natureArt(patch.kind)!;
   this.scene.add.image(x*TILE+16,y*TILE+25,art.texture).setOrigin(.5,art.pivot).setDisplaySize(art.width,art.height).setDepth(y*TILE+25);
  }
  // Forest floor details belong to the margins, preserving all pedestrian lanes.
  for(let y=5;y<68;y+=5)for(let x=6;x<91;x+=6){
   if(x>19&&x<78&&y>10&&y<60||occupied(x,y))continue;
   const seed=(Math.imul(x+13,73856093)^Math.imul(y+19,19349663))>>>0;if(seed%4)continue;
   const kind=seed%3===0?'whiteFlowers':seed%3===1?'fern':'mushrooms',art=natureArt(kind)!;
   this.scene.add.image(x*TILE+16,y*TILE+25,art.texture).setOrigin(.5,art.pivot).setDisplaySize(art.width,art.height).setDepth(y*TILE+25);
  }
 }
}
