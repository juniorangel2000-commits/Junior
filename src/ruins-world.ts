import Phaser from 'phaser';
import {readTerrainSprites} from './terrain-sprites';
import {preloadCityRoadArt, readCityAsphalt, setupCityForestArt} from './city-forest-world';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {drawEditorProp} from './editor-prop-art';
import {drawExitSign} from './exit-signs';
import {addWaterMotion} from './water-motion';
import {RUIN_KINDS} from './data/ruins-art';
import {RUINS_ENTRY, RUINS_EXIT, RUINS_ROAD_Y, tileMidpoint} from './data/ruins-road';
import {
  createRuinsLayout, RUINS_ROAD_HALF_WIDTH, RUINS_SIZE, ruinsCourtDistance,
  ruinsRoadDistance, ruinsSeed, ruinsTrailDistance,
} from './data/ruins';
import {TILE} from './data/world-size';
import {ruinsHasWetTraces} from './data/ruins-story';
import type {MapEditData} from './systems/map-editor';
import type {WorldEditorObject} from './world';

const GROUND = 'ruins-ground-v3';
const blend = (n:number):number=>Math.max(0,Math.min(1,n));

export function preloadRuins(scene:Phaser.Scene):void {
  preloadCityRoadArt(scene);
  for(const kind of RUIN_KINDS)if(!scene.textures.exists(kind))
    scene.load.image(kind,`assets/visual/ruins/${kind.slice(5)}.png`);
}

function drawGround(scene:Phaser.Scene):void {
  if(!scene.textures.exists(GROUND)){
    const asphalt=readCityAsphalt(scene), materials=readTerrainSprites(scene)!;
    const {width,height}=RUINS_SIZE;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d')!, pixels=c.createImageData(width,height);
    const block=4;
    for(let by=0;by<height;by+=block)for(let bx=0;bx<width;bx+=block){
      const tx=(bx+2)/TILE,ty=(by+2)/TILE;
      const noise=.15*Math.sin(tx*2.3+ty*1.7)+.09*Math.sin(ty*3.5-tx*5.2);
      const trail=blend((1.32+noise-ruinsTrailDistance(tx,ty))/.72);
      const paving=blend((1.08+noise-ruinsCourtDistance(tx,ty))/.37);
      const stone=paving*(.59+noise*.46);
      const erosion=blend((tx-15)/36);
      const road=blend((RUINS_ROAD_HALF_WIDTH+noise*erosion-ruinsRoadDistance(ty))/(.2+.4*erosion));
      const bright=.22+.18*(Math.sin((tx+96)*.47+ty*.31)+1)/2;
      const grass=blend(bright+blend((tx-2)/10)*(.12+.09*Math.sin(tx*.24-ty*.48)));
      for(let dy=0;dy<block;dy++)for(let dx=0;dx<block;dx++){
        const x=bx+dx,y=by+dy, i=(y*width+x)*4, p=((y%96)*96+x%96)*4;
        for(let k=0;k<3;k++){
          let color=materials.forest.pixels[p+k]*(1-grass)+materials.grass.pixels[p+k]*grass;
          color=color*(1-trail)+materials['path-dry'].pixels[p+k]*trail;
          color=color*(1-stone)+materials.paving.pixels[p+k]*stone;
          const street=asphalt[p+k]*(1-erosion*.10)+materials.moss.pixels[p+k]*erosion*.10;
          pixels.data[i+k]=color*(1-road)+street*road;
        }
        pixels.data[i+3]=255;
      }
    }
    c.putImageData(pixels,0,0);
    c.strokeStyle='#c2b994';c.lineWidth=3;c.setLineDash([23,19]);
    c.beginPath();c.moveTo(0,RUINS_ROAD_Y*TILE);c.lineTo(width,RUINS_ROAD_Y*TILE);
    c.stroke();c.setLineDash([]);

    for(let i=0;i<660;i++){
      const x=380+ruinsSeed(i,72)*(width-380),side=i%2?1:-1;
      const scatter=ruinsSeed(i,21),y=(RUINS_ROAD_Y+side*(2.4+scatter*1.36))*TILE;
      c.fillStyle=side>0&&scatter>.53?'#77904f58':i%3?'#a49a7b60':'#413c37aa';
      c.fillRect(x,y,1+i%4,1+i%3);
    }

    // Fine fissures spread from the worn shoulder toward the patches of moss.
    for(let i=0;i<43;i++){
      const x=15+i*1.8,y=RUINS_ROAD_Y-2.65+ruinsSeed(i,57)*5.4;
      if(ruinsRoadDistance(y)>2.45)continue;
      const size=9+ruinsSeed(i,12)*47;
      c.strokeStyle=i%3?'#263029aa':'#484439b8';c.lineWidth=1+i%2;
      c.beginPath();c.moveTo(x*TILE,y*TILE);
      c.lineTo(x*TILE+size*.31,y*TILE+6);c.lineTo(x*TILE+size*.52,y*TILE+2);
      c.lineTo(x*TILE+size,y*TILE+13);c.stroke();
    }
    for(let i=0;i<950;i++){
      const x=(i*211)%width,y=(i*349)%height;
      if(ruinsRoadDistance(y/TILE)<3.2||ruinsTrailDistance(x/TILE,y/TILE)<.95)continue;
      c.fillStyle=i%4?'#ad98574a':'#393d236b';
      c.fillRect(x,y,2+i%4,1+i%3);
    }
    scene.textures.addCanvas(GROUND,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,GROUND).setOrigin(0).setDepth(-100);
}

export class RuinsWorld {
  readonly layout:ReturnType<typeof createRuinsLayout>;
  readonly editorObjects:WorldEditorObject[]=[];
  private readonly treetops:Phaser.GameObjects.Image[]=[];
  private readonly terrainTexture:string;
  private readonly tracks?:Phaser.GameObjects.Graphics;
  constructor(private readonly scene:Phaser.Scene,edits?:MapEditData,palette=false){
    setupCityForestArt(scene);
    this.layout=createRuinsLayout(edits);
    this.terrainTexture=palette?'ruins-editor-terrain':'ruins-play-terrain';
    drawGround(scene);
    drawMapTerrainEdits(scene,edits?.terrain??{},this.terrainTexture,()=>false,'forest')?.setDepth(-99);
    if(!palette&&Object.values(edits?.terrain??{}).includes('water')){
      const water=this.layout.water;
      addWaterMotion(scene,(x,y)=>water((x+.5)*TILE,(y+.5)*TILE),water,{...RUINS_SIZE,alpha:.4});
    }
    for(const o of this.layout.objects){
      const {x,y}=tileMidpoint(o), tree=o.kind==='standingTree'||o.kind==='pine';
      const sprite=tree
        ? scene.add.image(x,y,`asset-${o.kind==='pine'?'pine':'tree'}-${o.variant??0}`)
          .setOrigin(.5,256/264).setDisplaySize(166*(o.scale??1),211*(o.scale??1)).setDepth(y)
        : drawEditorProp(scene,o.kind,x,y);
      if(!sprite)continue;
      if(o.kind==='ruin-steps'||o.kind==='ruin-flagstones')sprite.setDepth(-93);
      if(o.kind==='ruin-flagstones'){
        const wear=ruinsSeed(o.x,o.y),scale=.75+wear*.29;
        sprite.setScale(sprite.scaleX*scale,sprite.scaleY*scale).setRotation((wear-.5)*.44);
      }
      if(/^tallGrass[ABC]$/.test(o.kind)){
        sprite.setScale(sprite.scaleX*(o.scale??1)*.75,sprite.scaleY*(o.scale??1)*.53);
      }
      this.editorObjects.push({id:o.id,kind:o.kind,x:o.x,y:o.y,texture:sprite.texture.key,frame:sprite.frame.name});
      if(tree)this.treetops.push(sprite.setData('wind-tree',true));
    }
    drawExitSign(scene,edits?.points?.exit??RUINS_EXIT,edits?.points?.entry??RUINS_ENTRY);
    if(this.layout.wetTrack&&!palette){
      const {x,y}=this.layout.wetTrack;
      const marks=this.tracks=scene.add.graphics().setDepth(-92).setVisible(false);
      for(const side of [-12,12]){
        for(let i=0;i<9;i++){
          const px=x+side+i*8,py=y-20+i*9;
          marks.fillStyle(0x433a27,.49).fillEllipse(px,py,9+i*.34,3.5);
          marks.fillStyle(0xa9b4a0,.52).fillEllipse(px+1,py+1,6,1.2);
        }
      }
    }
  }
  weather(day:number):void { this.tracks?.setVisible(ruinsHasWetTraces(day)); }
  update(_dt:number,player:{x:number;y:number}):void {
    for(const tree of this.treetops)
      tree.setAlpha(player.y<tree.y&&player.y>tree.y-tree.displayHeight*.8&&Math.abs(player.x-tree.x)<tree.displayWidth*.38?.48:1);
  }
  destroy():void {
    if(this.scene.textures.exists(this.terrainTexture))this.scene.textures.remove(this.terrainTexture);
  }
}
