import {AUGUSTO_SHOP,setupAugustoShop} from './augusto-shop';
import {ROSA_SHOP} from './data/rosa-shop';
import {setupRosaShop} from './rosa-shop';
import {TOBIAS_SHOP} from './data/tobias-shop';
import {setupTobiasShop} from './tobias-shop';
import {AMELIA_SHOP} from './data/amelia-shop';
import {setupAmeliaShop} from './amelia-shop';
import {NILO_SHOP} from './data/nilo-shop';
import {setupNiloShop} from './nilo-shop';
import {BLACKSMITH_HOUSE,setupBlacksmithHouse,blacksmithPoint} from './blacksmith-house';
import {villageWater,villageLakeDistance,villagePointBlocked,villageDoorApproach,villagePathEdge,VILLAGE_LAWNS,VILLAGE_GARDENS,VILLAGE_FENCES,VILLAGE_SHORE_DETAILS} from './data/village';
import {villageGroundWeights,villageSmooth as smooth} from './data/village-ground';
import {readVillagePaving,VILLAGE_LAMP} from './village-scenery-art';
import {drawConnectedFence} from './fence-art';
import {addWaterMotion} from './water-motion';
import Phaser from 'phaser';
import {readTerrainSprites} from './terrain-sprites';
import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './data/world-size';
import {VILLAGE_BUILDINGS,VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_PROPS,VILLAGE_TREES,villageBlockedAt,villagePlazaDistance} from './data/village';
import {natureArt} from './data/nature-catalog';
import {drawExitSign} from './exit-signs';
import {drawHouseSmoke} from './house-smoke';
import {drawHouseWindowGlow,HOUSE_FOOT,HOUSE_SPRITE_SIZE} from './house-sprites';
import {windowLight} from './solar-light';
import {getVisualSettings} from './visual-settings';
import {setupVillageArt} from './village-art';
import type {ResourceNode} from './types';
import type {WorldEditorObject} from './world';
import type {MapEditData} from './systems/map-editor';
import {villageTreeId} from './data/village';
import {terrainPaintAlpha,paintedWaterPoint} from './data/terrain-paint';

const MAP_WIDTH=WORLD_WIDTH*TILE,MAP_HEIGHT=WORLD_HEIGHT*TILE;

/** Bake crisp source materials, feathering their weights rather than blurring
 * pixels. Geometry is sampled on an 8px grid and interpolated below: movement
 * never reruns the expensive terrain generation. */
function drawGround(scene:Phaser.Scene,edits?:MapEditData,namespace='village'):void {
 const key=namespace+'-ground-v3';if(scene.textures.exists(key))scene.textures.remove(key);
 if(!scene.textures.exists(key)){
  const canvas=document.createElement('canvas');canvas.width=MAP_WIDTH;canvas.height=MAP_HEIGHT;
  const c=canvas.getContext('2d')!,sprites=readTerrainSprites(scene);c.imageSmoothingEnabled=false;
  if(sprites){
   const step=8,columns=MAP_WIDTH/step+1,rows=MAP_HEIGHT/step+1;
   const fields=new Float32Array(columns*rows*6);
   for(let gy=0;gy<rows;gy++)for(let gx=0;gx<columns;gx++){
    const weights=villageGroundWeights(gx*step/TILE-.5,gy*step/TILE-.5),at=(gy*columns+gx)*6;
    weights.forEach((weight,index)=>{fields[at+index]=weight;});
   }
   const pixels=c.createImageData(MAP_WIDTH,MAP_HEIGHT),materials=[sprites.grass,sprites.forest,sprites.meadow,sprites['path-dry'],readVillagePaving(scene)??sprites.paving,sprites.soil];
   const sources=materials.map(m=>({pixels:m.pixels,rows:Int32Array.from({length:MAP_HEIGHT},(_,y)=>(y%m.size)*m.size*4),cols:Int32Array.from({length:MAP_WIDTH},(_,x)=>(x%m.size)*4)}));
   const mixed=new Float32Array(6);
   for(let y=0;y<MAP_HEIGHT;y++){
    const gy=Math.floor(y/step),fy=(y%step)/step;
    for(let x=0;x<MAP_WIDTH;x++){
     const gx=Math.floor(x/step),fx=(x%step)/step,a=(gy*columns+gx)*6,b=a+6,d=a+columns*6,e=d+6;
     let red=0,green=0,blue=0;
     for(let m=0;m<6;m++){
      mixed[m]=(fields[a+m]*(1-fx)+fields[b+m]*fx)*(1-fy)+(fields[d+m]*(1-fx)+fields[e+m]*fx)*fy;
      if(mixed[m]<.0001)continue;
      const source=sources[m],at=source.rows[y]+source.cols[x];
      red+=source.pixels[at]*mixed[m];green+=source.pixels[at+1]*mixed[m];blue+=source.pixels[at+2]*mixed[m];
     }
     const kind=edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`];
     if(kind){const names={grass:'grass',meadow:'meadow',forest:'forest',moss:'moss',forestPath:'forest',path:'path-dry',wetPath:'path-wet',water:'water',sand:'sand',soil:'soil',wood:'wood',paving:'paving'} as const;const source=sprites[names[kind]],at=((y%source.size)*source.size+x%source.size)*4,alpha=terrainPaintAlpha(edits!.terrain,x,y);red=red*(1-alpha)+source.pixels[at]*alpha;green=green*(1-alpha)+source.pixels[at+1]*alpha;blue=blue*(1-alpha)+source.pixels[at+2]*alpha;}
     const at=(y*MAP_WIDTH+x)*4;pixels.data[at]=red;pixels.data[at+1]=green;pixels.data[at+2]=blue;pixels.data[at+3]=255;
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
 private readonly fires:Phaser.GameObjects.Image[]=[];
 private shown=true;
 private readonly visibility=new Map<Phaser.GameObjects.GameObject,boolean>();
 constructor(private readonly scene:Phaser.Scene,private readonly edits?:MapEditData,private readonly namespace='village'){
  const before=new Set(scene.children.list);setupVillageArt(scene);drawGround(scene,edits,namespace);
  this.drawLake();this.drawTrees();this.drawBuildings();this.drawGardens();this.drawProps();
  drawExitSign(scene,this.exit(),this.entry());
  this.environment=scene.children.list.filter(object=>!before.has(object));
  for(let y=0;y<WORLD_HEIGHT;y++)for(let x=0;x<WORLD_WIDTH;x++)if(villageBlockedAt(x,y,edits))this.solid.add(`${x},${y}`);
 }
 entry(){return this.edits?.points?.entry??VILLAGE_ENTRY;}
 exit(){return this.edits?.points?.exit??VILLAGE_EXIT;}
 isBlocked=(x:number,y:number):boolean=>x<1||y<1||x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1||this.solid.has(`${x},${y}`);
 isBlockedPoint=(x:number,y:number)=>villagePointBlocked(x,y,this.edits);
 waterAt=(x:number,y:number):boolean=>villageWater(x,y,this.edits);
 waterPointAt=(x:number,y:number):boolean=>paintedWaterPoint(this.edits?.terrain,x,y,(x,y)=>villageLakeDistance(x/32,y/32)<0);
 resourceAt=(_x:number,_y:number):ResourceNode|undefined=>undefined;
 update(timeMs:number):void {if(Number.isFinite(timeMs))this.elapsed=timeMs;}
 setVisible(shown:boolean):void {
  if(shown===this.shown)return;this.shown=shown;
  for(const object of this.environment)if('setVisible'in object){
   const image=object as Phaser.GameObjects.Image;
   if(!shown){this.visibility.set(object,image.visible);image.setVisible(false);}
   else image.setVisible(this.visibility.get(object)??true);
  }
  if(shown)this.visibility.clear();
 }
 updateLighting(time:number):void {
  if(!this.shown)return;
  const settings=getVisualSettings(),alpha=settings.daylight&&settings.dynamicLighting?windowLight(time)*settings.intensity:0;
  for(const fire of this.fires)fire.setVisible(true).setAlpha(.48+Math.sin(this.elapsed*.012)*.12+Math.sin(this.elapsed*.021)*.06);
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
  const key=this.namespace+'-lake-v3';if(this.scene.textures.exists(key))this.scene.textures.remove(key);
  if(!this.scene.textures.exists(key)){
   const sprites=readTerrainSprites(this.scene);if(!sprites)return;
   const canvas=document.createElement('canvas');canvas.width=608;canvas.height=768;
   const c=canvas.getContext('2d')!,pixels=c.createImageData(608,768);
   for(let y=0;y<768;y++)for(let x=0;x<608;x++){
    const wx=77*32+x,wy=32*32+y,d=villageLakeDistance(wx/32,wy/32),at=(y*608+x)*4;if(d>1.7)continue;
    const water=1-smooth((d+.16)/.32),wet=(1-smooth((d-.05)/.5))*(1-water);
    const a=sprites.water,b=sprites.sand,ai=((wy%a.size)*a.size+wx%a.size)*4,bi=((wy%b.size)*b.size+wx%b.size)*4;
    for(let channel=0;channel<3;channel++)pixels.data[at+channel]=a.pixels[ai+channel]*water+b.pixels[bi+channel]*(1-water-wet)+b.pixels[bi+channel]*.78*wet;
    const kind=this.edits?.terrain[`${Math.floor(wx/32)},${Math.floor(wy/32)}`];const cover=kind&&kind!=='water'?terrainPaintAlpha(this.edits!.terrain,wx,wy):0;
    pixels.data[at+3]=Math.round(255*(1-smooth((d-.65)/.85))*(1-cover));
   }
   c.putImageData(pixels,0,0);this.scene.textures.addCanvas(key,canvas)?.setFilter(0);
  }
  this.scene.add.image(77*32,32*32,key).setOrigin(0).setDepth(-94);
  addWaterMotion(this.scene,this.waterAt,this.waterPointAt);
 }
 private drawTrees():void {
  const originalIds=new Set(VILLAGE_TREES.map(villageTreeId));
  const rows=[...VILLAGE_TREES.map(t=>({id:villageTreeId(t),...t})),...Object.entries(this.edits?.objects??{}).filter(([id,e])=>!originalIds.has(id)&&!e.removed&&natureArt(e.kind)).map(([id,e])=>({id,x:e.x,y:e.y,kind:e.kind!}))];
  for(const original of rows){const edit=this.edits?.objects[original.id];if(edit?.removed)continue;const tree={...original,x:edit?.x??original.x,y:edit?.y??original.y};
   const art=natureArt(tree.kind)!;
   const sprite=this.scene.add.image(tree.x*TILE+16,tree.y*TILE+25,art.texture).setOrigin(.5,art.pivot)
    .setDisplaySize(art.width,art.height).setDepth(tree.y*TILE+25);
   if(tree.kind.startsWith('oak')||tree.kind.startsWith('pine'))this.trees.push(sprite);this.editorObjects.push({id:original.id,kind:tree.kind,x:tree.x,y:tree.y,texture:art.texture});
  }
 }
 private drawBuildings():void {
  let firstCottage=true;
  for(const building of VILLAGE_BUILDINGS){
   const x=(building.x+.5)*TILE,y=building.y*TILE+25;
   if(building.shop==='blacksmith'){
    setupBlacksmithHouse(this.scene);const b=BLACKSMITH_HOUSE;
    const house=this.scene.add.image(x,y,b.frontTexture).setOrigin(b.door.x/b.size,b.door.y/b.size).setScale(b.scale).setDepth(y).setData({'village-building':building.id,'shadow-foot':b.foot,'shadow-source':b.texture});
    const layer=(key:string)=>this.scene.add.image(x,y,key).setOrigin(house.originX,house.originY).setScale(house.scaleX).setDepth(y+.1).setVisible(false);
    layer('village-blacksmith-floor').setDepth(-15).setVisible(true).setData('blacksmith-floor',true);
    layer('village-blacksmith-anvil').setDepth(blacksmithPoint(house,{x:930,y:1045}).y).setVisible(true).setData('blacksmith-anvil',true);
    this.windows.push(layer('village-blacksmith-windows'));const flame=layer('village-blacksmith-fire').setVisible(true).setData('fixture-light',{offsetX:(b.furnace.x-b.door.x)*b.scale,offsetY:(b.furnace.y-b.door.y)*b.scale,radius:90,always:true});this.fires.push(flame);
    for(const point of b.chimneys)this.smoke.push(drawHouseSmoke(this.scene,house,point,1/b.scale));
    for(const point of b.lamps){const p=blacksmithPoint(house,point);this.scene.add.zone(p.x,p.y,1,1).setData('fixture-light',{radius:65});}
    continue;
   }
   if(building.shop==='carpenter'){
    const b=TOBIAS_SHOP;setupTobiasShop(this.scene);
    const house=this.scene.add.image(x,y,b.texture+'-front').setOrigin(b.door.x/b.width,b.door.y/b.height).setScale(b.scale).setDepth(y).setData({'village-building':building.id,'shadow-foot':b.foot,'shadow-source':b.texture});
    const layer=(suffix:string)=>this.scene.add.image(x,y,b.texture+'-'+suffix).setOrigin(house.originX,house.originY).setScale(b.scale);
    layer('back').setDepth(-15).setData('carpentry-porch',true);layer('bench').setDepth(y+(801-b.door.y)*b.scale);
    this.windows.push(layer('windows').setDepth(y+.1).setVisible(false));
    for(const p of b.lamps)this.scene.add.zone(x+(p.x-b.door.x)*b.scale,y+(p.y-b.door.y)*b.scale,1,1).setData('fixture-light',{radius:65});
    this.smoke.push(drawHouseSmoke(this.scene,house,b.chimney,1/b.scale));continue;
   }
   if(building.shop==='general'||building.shop==='seeds'||building.shop==='herbalist'||building.shop==='traveler'){
    const b=building.shop==='traveler'?NILO_SHOP:building.shop==='herbalist'?AMELIA_SHOP:building.shop==='seeds'?ROSA_SHOP:AUGUSTO_SHOP;if(building.shop==='traveler')setupNiloShop(this.scene);else if(building.shop==='herbalist')setupAmeliaShop(this.scene);else if(building.shop==='seeds')setupRosaShop(this.scene);else setupAugustoShop(this.scene);
    const house=this.scene.add.image(x,y,b.texture).setOrigin(b.door.x/b.width,b.door.y/b.height).setScale(b.scale).setDepth(y).setData({'village-building':building.id,'shadow-foot':b.foot});
    this.windows.push(this.scene.add.image(x,y,b.texture+'-windows').setOrigin(house.originX,house.originY).setScale(b.scale).setDepth(y+.1).setVisible(false));
    for(const p of b.lamps)this.scene.add.zone(x+(p.x-b.door.x)*b.scale,y+(p.y-b.door.y)*b.scale,1,1).setData('fixture-light',{radius:65});
    this.smoke.push(drawHouseSmoke(this.scene,house,b.chimney,1/b.scale));continue;
   }
   const house=this.scene.add.image(x,y,'asset-house').setOrigin(.5,HOUSE_FOOT.y/HOUSE_SPRITE_SIZE.height)
    .setDepth(y).setFlipX(!!building.flip).setData('village-building',building.id);
   if(building.shop)this.scene.add.image(x,y+3,`village-shop-${building.shop}`).setOrigin(.5,1).setDepth(y+.5);
   // Daylight handles the first native cottage; all other panes use its exact
   // source mask and the same dusk curve, with no rectangles over the frames.
   if(!firstCottage){const glow=drawHouseWindowGlow(this.scene,house);if(glow)this.windows.push(glow);}
   firstCottage=false;
   if(building.shop==='inn')this.smoke.push(drawHouseSmoke(this.scene,house));
  }
 }
 private drawProps():void {
  for(const prop of VILLAGE_PROPS){
   const x=(prop.x+.5)*TILE,y=prop.y*TILE+25;
   if(prop.kind==='well'){
    if(this.scene.textures.exists('property-well-idle'))this.scene.add.image(x,y,'property-well-idle').setOrigin(.5,1).setScale(.49).setDepth(y);
   }else if(prop.kind==='lantern'){
    this.scene.add.image(x,y,VILLAGE_LAMP.key).setOrigin(.5,1).setDepth(y).setData({'village-street-lamp':true,'fixture-light':{offsetY:VILLAGE_LAMP.lightY,radius:95}});
   }else{
    const sizes={bench:[62,44],barrel:[28,38],flowerpot:[29,36],woodpile:[54,38],crates:[38,54],sacks:[41,42],basket:[34,30],planter:[64,40],anvil:[46,46]} as const;
    const [w,h]=sizes[prop.kind];
    this.scene.add.image(x,y,prop.kind==='anvil'?'economy-workshop-anvil':`village-prop-${prop.kind}`).setOrigin(.5,1).setDisplaySize(w,h).setDepth(y).setData('village-prop',prop.kind);
   }
  }
 }
 private drawGardens():void {
  const place=(kind:string,x:number,y:number,scale=1)=>{
   if(this.edits?.terrain[`${Math.floor(x+.5)},${Math.floor(y+.5)}`]!==undefined)return;
   const art=natureArt(kind);if(!art||villageDoorApproach(x,y)||VILLAGE_PROPS.some(p=>Math.hypot(x-p.x,y-p.y)<1.1)||villageBlockedAt(x,y)&&!art.water)return;
   this.scene.add.image(x*TILE+16,y*TILE+25,art.texture).setOrigin(.5,art.pivot).setDisplaySize(art.width*scale,art.height*scale).setDepth(y*TILE+25).setData('village-plant',true);
  };
  for(const fence of VILLAGE_FENCES)drawConnectedFence(this.scene,fence,VILLAGE_FENCES,1);
  for(const garden of VILLAGE_GARDENS)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const x=garden.x+dx*1.3,y=garden.y+dy*1.25;
   if(this.edits?.terrain[`${Math.floor(x+.5)},${Math.floor(y+.5)}`]!==undefined)continue;
   if(villageDoorApproach(x,y)||villageBlockedAt(x,y))continue;
   if(garden.kind==='crops'&&this.scene.textures.exists('crop-2'))this.scene.add.image(x*TILE+16,y*TILE+25,'crop-2').setOrigin(.5,1).setDisplaySize(26,32).setDepth(y*TILE+25);
   else place(garden.kind==='herbs'?(dx%2?'whiteFlowers':'fern'):'whiteFlowers',x,y,.85);
  }
  for(const lawn of VILLAGE_LAWNS){place('bush',lawn.x,lawn.y-1.2,.9);for(const [dx,dy]of [[-1,0],[0,.7],[1,.3]])place('whiteFlowers',lawn.x+dx,lawn.y+dy,.9);}
  for(const detail of VILLAGE_SHORE_DETAILS)place(detail.kind,detail.x,detail.y,detail.kind==='reeds'?.85:1);
  for(const [i,tree]of VILLAGE_TREES.entries()){
   place(i%3===0?'mushrooms':'fern',tree.x+.8,tree.y+.2,.8);
   if(i%3===0)place('whiteFlowers',tree.x-.8,tree.y+.4,.8);
  }
  for(let y=12;y<68;y+=3)for(let x=9;x<90;x+=3){
   const seed=(Math.imul(x+13,73856093)^Math.imul(y+19,19349663))>>>0;
   if(seed%7||villagePathEdge(x,y)<.9||villagePlazaDistance(x,y)<1.12||villageLakeDistance(x,y)<1.4)continue;
   if(VILLAGE_GARDENS.some(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)<1.5))continue;
   place(seed%3===0?'berryBush':seed%3===1?'bush':'whiteFlowers',x,y,seed%3===0?.8:1);
  }
 }
}
