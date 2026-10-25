import {isFiberPlant,fiberPlantFor,fiberPlantArt} from './data/fiber-plants';
import {naturalPlantGround} from './systems/tree-avoidance';
import {FOREST_GLADE_DETAILS,FOREST_GLADE_RESOURCE_IDS,gladeObjectId} from './data/forest-glade';
import {drawExitSign} from './exit-signs';
import {paintedWaterPoint} from './data/terrain-paint';
import {treeGroundClear,isTreeKind} from './systems/tree-ground';
import Phaser from 'phaser';
import type {WorldEditorObject} from './world';
import type {MapEditData,EditorObjectKind} from './systems/map-editor';
import {naturalResourceTexture} from './systems/resource-spawns';
import type {ResourceNode} from './types';
import {natureArt,collectibleKind} from './data/nature-catalog';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {addWaterMotion} from './water-motion';
import {readTerrainSprites} from './terrain-sprites';
import {forestGroundPixels} from './forest-ground';
import {FOREST_ENTRY,FOREST_TREES,FOREST_ROCKS,forestWater,forestWaterDistanceAt,forestPathDistance,forestTreeAppearance} from './data/ancient-forest';
export class ForestWorld {
  private environment:Phaser.GameObjects.GameObject[]=[];
  editorObjects:WorldEditorObject[]=[];
  trees:Phaser.GameObjects.Image[]=[];
  solid=new Set<string>();
  edits?:MapEditData;
  resources:ResourceNode[]=[];
  depleted=new Set<string>();
  private images=new Map<string,Phaser.GameObjects.Image>();
  resourceAt=(x:number,y:number):ResourceNode|undefined=>this.resources.find(n=>n.x===x&&n.y===y);
  removeResource(id:string):void {const n=this.resources.find(n=>n.id===id);if(!n)return;this.resources=this.resources.filter(r=>r.id!==id);this.images.get(id)?.destroy();this.images.delete(id);this.solid.delete(`${n.x},${n.y}`);this.trees=this.trees.filter(t=>t.active);}
  setNaturalResources(nodes:readonly ResourceNode[]):void {
    const next=new Set(nodes.map(n=>n.id));for(const n of [...this.resources])if(n.id.startsWith('spawn-')?!next.has(n.id):(n.kind==='fiber'||n.kind==='fallenLog'||n.kind==='stump')&&!FOREST_GLADE_RESOURCE_IDS.has(n.id)&&!Object.hasOwn(this.edits?.objects??{},n.id.replace(/^f-/,'')))this.removeResource(n.id);
    for(const n of nodes)if(!this.resources.some(r=>r.id===n.id)&&!this.isBlocked(n.x,n.y)&&!((n.kind==='fiber'||n.kind==='seeds')&&!naturalPlantGround(this.edits?.terrain[`${n.x},${n.y}`]))){
      const plant=n.kind==='fiber'?fiberPlantArt(fiberPlantFor(n)):undefined;
      const image=this.scene.add.image(n.x*32+16,n.y*32+29,plant?.texture??naturalResourceTexture(n.kind)).setOrigin(.5,plant?.pivot??1).setDepth(n.y*32+29);
      if(n.kind==='tree')image.setDisplaySize(36,27);if(n.kind==='stone')image.setDisplaySize(32,24);
      if(plant)image.setDisplaySize(plant.size,plant.size);if(n.kind==='seeds')image.setDisplaySize(44,44);if(n.kind==='vein')image.setDisplaySize(52,52).setOrigin(.5,124/128);if(n.kind==='fallenLog'||n.kind==='stump')image.setDisplaySize(n.kind==='fallenLog'?68:38,n.kind==='fallenLog'?68:38).setOrigin(.5,124/128);this.images.set(n.id,image);this.resources.push({...n});this.environment.push(image);if(n.kind==='vein'||n.kind==='fallenLog'||n.kind==='stump')this.solid.add(`${n.x},${n.y}`);
    }
  }
  constructor(private readonly scene:Phaser.Scene,edits?:MapEditData,private readonly textureNamespace='forest'){this.rebuildEnvironment(edits);}
  waterAt=(x:number,y:number):boolean=>{const t=this.edits?.terrain[`${x},${y}`];return t?t==='water':forestWater(x,y);};
  waterPointAt=(x:number,y:number):boolean=>paintedWaterPoint(this.edits?.terrain,x,y,(px,py)=>forestWaterDistanceAt(px,py)<0);
  isBlocked=(x:number,y:number):boolean=>x<1||y<1||x>=95||y>=71||this.waterAt(x,y)||this.solid.has(`${x},${y}`);
  entry(){return this.edits?.points?.entry??FOREST_ENTRY;}
  exit(){return this.edits?.points?.exit??{x:48,y:69};}
  private addEnvironmentObject(id:string,kind:EditorObjectKind,x:number,y:number,texture:string,width:number,height:number,pivot:number,solid:boolean,flip=false):void {
    const edit=this.edits?.objects[id];if(edit?.removed||kind==='reeds')return;
    const collectible=collectibleKind(kind),resourceID=`f-${id}`;if(collectible&&this.depleted.has(resourceID))return;
    x=edit?.x??x;y=edit?.y??y;
    if(isTreeKind(kind)&&!treeGroundClear(x,y,this.waterPointAt)){
      let dry:{x:number;y:number}|undefined;
      for(let radius=1;radius<=8&&!dry;radius++)for(let dy=-radius;dy<=radius&&!dry;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
        const nx=x+dx,ny=y+dy;
        if(treeGroundClear(nx,ny,this.waterPointAt)&&!this.solid.has(`${nx},${ny}`)&&!this.editorObjects.some(o=>o.x===nx&&o.y===ny)&&!FOREST_TREES.some(t=>t.x===nx&&t.y===ny)&&forestPathDistance(nx,ny)>2.2){dry={x:nx,y:ny};break;}
      }
      if(!dry)return;x=dry.x;y=dry.y;
    }
    if(this.editorObjects.some(o=>o.x===x&&o.y===y)||this.waterAt(x,y)&&!natureArt(kind)?.water)return;
    const sprite=this.scene.add.image(x*32+16,y*32+25,texture).setOrigin(.5,pivot).setDisplaySize(width,height).setFlipX(flip).setDepth(y*32+25);
    this.editorObjects.push({id,kind,x,y,texture});if(collectible){this.resources.push({id:resourceID,kind:collectible,x,y,...(isFiberPlant(kind)?{plant:kind}:{})});this.images.set(resourceID,sprite);}
    if(solid||collectible==='vein'||collectible==='fallenLog'||collectible==='stump')this.solid.add(`${x},${y}`);
    if(kind==='standingTree'||kind==='pine'||kind.startsWith('oak')||kind.startsWith('pine'))this.trees.push(sprite);
  }
  rebuildEnvironment(edits?:MapEditData):void {
    this.environment.forEach(o=>o.destroy());this.environment=[];this.editorObjects=[];this.trees=[];this.solid.clear();this.resources=[];this.images.clear();this.edits=edits;
    const before=new Set(this.scene.children.list);
    this.drawGround();
    if(edits)drawMapTerrainEdits(this.scene,edits.terrain,`${this.textureNamespace}-map-edits`,forestWater,'forest');
    addWaterMotion(this.scene,this.waterAt,this.waterPointAt);
    for(const t of FOREST_TREES){
      const art=forestTreeAppearance(t),scale=art.scale/(this.scene.textures.exists('reference-trees-source')?2:1),texture=`asset-${t.pine?'pine':'tree'}-${art.variant}`;
      const source=this.scene.textures.get(texture).getSourceImage() as HTMLCanvasElement;
      this.addEnvironmentObject(`standingTree-${t.x}-${t.y}`,t.pine?'pine':'standingTree',t.x,t.y,texture,source.width*scale,source.height*scale,128/132,true,art.flip);
    }
    for(const r of FOREST_ROCKS){
      const kind=(`lakeRock${String.fromCharCode(65+r.variant)}`) as EditorObjectKind,art=natureArt(kind)!;
      this.addEnvironmentObject(`${kind}-${r.x}-${r.y}`,kind,r.x,r.y,art.texture,art.width,art.height,art.pivot,true);
    }
    for(const [id,edit] of Object.entries(edits?.objects??{})){
      if(!id.startsWith('editor-')||!edit.kind||edit.removed)continue;
      const art=natureArt(edit.kind);
      const fallback:Record<string,string>={standingTree:'asset-tree-0',pine:'asset-pine-0',stone:'asset-small-stones',vein:'lake-rock-0',tree:'asset-new-branches',fiber:'forest-detail-fern',seeds:'asset-berry-bush',scrap:'asset-scrap'};
      const tree=edit.kind==='standingTree'||edit.kind==='pine';
      this.addEnvironmentObject(id,edit.kind,edit.x,edit.y,art?.texture??fallback[edit.kind],art?.width??(tree?166:edit.kind==='tree'?36:edit.kind==='seeds'?44:32),art?.height??(tree?211:edit.kind==='tree'?27:edit.kind==='stone'?24:edit.kind==='seeds'?44:32),art?.pivot??(tree?128/132:1),art?.solid??tree);
    }
    for(const detail of FOREST_GLADE_DETAILS){
      const id=gladeObjectId(detail),edit=edits?.objects[id],x=edit?.x??detail.x,y=edit?.y??detail.y;
      if(!naturalPlantGround(edits?.terrain[`${x},${y}`])||this.solid.has(`${x},${y}`))continue;
      const art=natureArt(detail.kind)!;
      this.addEnvironmentObject(id,detail.kind,detail.x,detail.y,art.texture,art.width,art.height,art.pivot,art.solid);
    }
    this.drawWoodlandDetails();
    drawExitSign(this.scene,this.exit(),this.edits?.points?.entry??FOREST_ENTRY);
    this.environment=this.scene.children.list.filter(o=>!before.has(o));
  }
  private drawGround():void {
    const key='forest-ground-organic-shore-v3-grass';
    if(!this.scene.textures.exists(key)){
      const sprites=readTerrainSprites(this.scene);
      const terrain=document.createElement('canvas');terrain.width=3072;terrain.height=2304;
      const context=terrain.getContext('2d',{willReadFrequently:true})!;context.imageSmoothingEnabled=false;
    for(let cy=0;cy<9;cy++)for(let cx=0;cx<12;cx++){

        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
        const g=canvas.getContext('2d',{willReadFrequently:true})!;g.imageSmoothingEnabled=false;
        const pixels=g.createImageData(256,256);pixels.data.set(forestGroundPixels(sprites,cx*256,cy*256));g.putImageData(pixels,0,0);
        for(let ty=0;ty<8;ty++)for(let tx=0;tx<8;tx++){
          const x=cx*8+tx,y=cy*8+ty,water=forestWater(x,y);
          let seed=(Math.imul(x+19,73856093)^Math.imul(y+7,19349663))>>>0;
          const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          if(!water&&forestPathDistance(x,y)<2.3&&!(y>=60&&x>=44&&x<=52)){
            const colors=['#666746','#7c784c','#8b8151','#5e6040','#747b49','#8b7447'];
            for(let j=0;j<30;j++){
              const px=tx*32+4+Math.floor(rnd()*24),py=ty*32+4+Math.floor(rnd()*24);
              const distance=forestPathDistance(cx*8+px/32-.5,cy*8+py/32-.5);
              if(distance>2.1||rnd()>(distance<.65?.28:distance<1.7?.88:.45))continue;
              const color=colors[Math.floor(rnd()*colors.length)],vertical=rnd()>.5;
              // Compact leaf silhouettes with subtle veins, without heavy outlines.
              g.fillStyle=color;
              if(vertical){
                g.fillRect(px+2,py-2,2,1);g.fillRect(px+1,py-1,4,4);g.fillRect(px+2,py+3,2,2);
                g.fillStyle='#78734c';g.fillRect(px+2,py+1,1,2);
              }else{
                g.fillRect(px,py,2,2);g.fillRect(px+2,py-1,3,4);g.fillRect(px+5,py,2,2);
                g.fillStyle='#78734c';g.fillRect(px+2,py+1,2,1);
              }
            }
          }

        }
        context.drawImage(canvas,cx*256,cy*256);
    }
      this.scene.textures.addCanvas(key,terrain)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    // One continuous quad prevents rounding gaps between chunks at fractional zoom.
    this.scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
  }
  private drawWoodlandDetails():void {
    const detail=(kind:string,x:number,y:number,size:number)=>{
      const kinds:Record<string,EditorObjectKind>={boulder:'mossBoulder',log:'fallenLog',stump:'stump',fern:'fern',flowers:'whiteFlowers',bush:'bush',shore:'shoreStones',reeds:'reeds',mushrooms:'mushrooms'};
      const k=kinds[kind];x=Math.floor(x);y=Math.floor(y);
      if(FOREST_TREES.some(t=>t.x===x&&t.y===y)||FOREST_ROCKS.some(r=>r.x===x&&r.y===y))return;
      this.addEnvironmentObject(`${k}-${x}-${y}`,k,x,y,natureArt(k)?.texture??`forest-detail-${kind}`,size,size,124/128,false);
    };
    // Soft vegetation is walk-through; large wood rests against existing blocked trunks.
    for(let y=3;y<69;y+=2)for(let x=3;x<94;x+=2){
      const seed=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>0;
      if(forestWater(x,y)||forestPathDistance(x,y)<1.8)continue;
      const shore=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>forestWater(x+dx,y+dy));
      if(shore){detail(seed%3?'shore':'reeds',x,y,seed%3?38:46);continue;}
      if(seed%7===0)detail('fern',x,y,36);
      else if(seed%11===0)detail('flowers',x,y,30);
      else if(seed%23===0)detail('mushrooms',x,y,26);
    }
    FOREST_TREES.forEach((t,i)=>{
      if(t.ancient)return;
      if(i%17===0)detail('log',t.x,t.y,58);
      else if(i%13===0)detail('stump',t.x,t.y,36);
      else if(i%7===0)detail('bush',t.x+.5,t.y,45);
    });
    for(const [x,y] of [[16,13],[27,12],[19,19],[62,18],[62,12],[38,15],[80,49]])detail('boulder',x,y,46);
  }
}
