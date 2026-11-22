import Phaser from 'phaser';
import {setupCityForestArt} from './city-forest-world';
import {COAST_ART,COAST_KINDS} from './data/coast-art';
import {
  COAST_SIZE,COAST_SHORE_POINTS,coastBaseWater,coastRiverEdge,coastSeed,
  coastShoreDistance,coastTrailDistance,createCoastLayout,
} from './data/coast';
import {COAST_ENTRY,COAST_EXIT,coastEntryProtected} from './data/ruins-road';
import {TILE} from './data/world-size';
import {waterFinishChannel} from './data/water-style';
import {drawEditorProp} from './editor-prop-art';
import {drawExitSign} from './exit-signs';
import {drawMapTerrainEdits} from './map-editor-terrain';
import type {MapEditData} from './systems/map-editor';
import {readTerrainSprites} from './terrain-sprites';
import {addWaterMotion} from './water-motion';
import {sampleWaterDepth} from './swimming/config';
import type {WorldEditorObject} from './world';
import {drawEdgeBlend} from './edge-blend';

const GROUND='coast-ground-v2';
const PIER_FRONT='coast-pier-front';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const drySand=[205,184,132],wetSand=[145,136,101];
export function preloadCoast(scene:Phaser.Scene):void {
  for(const kind of COAST_KINDS)if(!scene.textures.exists(kind))scene.load.image(kind,`assets/visual/coast/${kind.slice(6)}.png`);
  if(!scene.textures.exists(PIER_FRONT))scene.load.image(PIER_FRONT,'assets/visual/coast/pier-front.png');
}

function drawGround(scene:Phaser.Scene):void {
  if(!scene.textures.exists(GROUND)){
    const {width,height}=COAST_SIZE,canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d')!,ground=c.createImageData(width,height),rgba=ground.data;
    const terrain=readTerrainSprites(scene)!;
    const size=terrain.water.size;
    for(let by=0;by<height;by+=4)for(let bx=0;bx<width;bx+=4){
      const x=bx+2,y=by+2,tx=x/TILE,ty=y/TILE;
      const shore=coastShoreDistance(x,y),river=coastRiverEdge(x,y);
      const noise=.15*Math.sin(tx*1.67+ty*2.13)+.09*Math.sin(ty*3.56-tx*4.17);
      const sand=clamp((shore+370+noise*136)/180);
      const worn=clamp((shore+40+noise*14)/40);
      const path=clamp((1.45+noise-coastTrailDistance(tx,ty))/.82)*.88;
      const bank=river>=0?clamp(1-(river+noise*8)/26)*.7:0;
      const grass=.4+.15*Math.sin(tx*.47+ty*.31)+.09*Math.sin(tx*.24-ty*.48);
      for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
        const px=bx+dx,py=by+dy,i=(py*width+px)*4,p=((py%size)*size+px%size)*4;
        const distance=Math.abs(shore)<=7?coastShoreDistance(px+.5,py+.5):shore;
        const inRiver=Math.abs(river)<=7?coastRiverEdge(px+.5,py+.5):river;
        for(let k=0;k<3;k++){
          const tint=mix(drySand[k],wetSand[k],worn);
          const beach=tint+(terrain.sand.pixels[p+k]-drySand[k])*.49;
          let color=mix(terrain.forest.pixels[p+k],terrain.grass.pixels[p+k],grass);
          color=mix(color,terrain['path-dry'].pixels[p+k],path);
          color=mix(color,terrain['path-wet'].pixels[p+k],bank);
          color=mix(color,beach,sand);
          if(distance>0){
            const shallow=.23*clamp(1-distance/85);
            const sea=waterFinishChannel(terrain.water.pixels[p+k],k,-distance);
            color=mix(sea,[166,186,152][k],shallow);
          }else if(inRiver<0)color=waterFinishChannel(terrain.water.pixels[p+k],k,inRiver);
          rgba[i+k]=color;
        }
        rgba[i+3]=255;
      }
    }
    c.putImageData(ground,0,0);
    // Grãos e conchinhas espalhados na areia, ao longo da praia.
    for(let i=0;i<720;i++){
      const point=COAST_SHORE_POINTS[i%COAST_SHORE_POINTS.length],back=9+coastSeed(i,17)*290,along=(coastSeed(i,41)-.5)*38;
      const x=point.x-point.nx*back+point.ny*along,y=point.y-point.ny*back-point.nx*along;
      c.fillStyle=i%3?'#79624837':'#fbdfac62';c.fillRect(x,y,1+i%3,1+i%2);
    }
    scene.textures.addCanvas(GROUND,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,GROUND).setOrigin(0).setDepth(-100);
  drawEdgeBlend(scene,'coast');
}

type Fading={sprite:Phaser.GameObjects.Image;x:number;y:number};
export class CoastWorld {
  readonly layout:ReturnType<typeof createCoastLayout>;
  readonly editorObjects:WorldEditorObject[]=[];
  private readonly terrainKey:string;
  private readonly fading:Fading[]=[];
  private readonly foam?:Phaser.GameObjects.Graphics;
  private waveTime=0;
  constructor(private readonly scene:Phaser.Scene,edits?:MapEditData,editor=false){
    setupCityForestArt(scene);
    this.terrainKey=editor?'coast-editor-ground':'coast-play-ground';
    this.layout=createCoastLayout(edits);
    drawGround(scene);
    const terrain=Object.fromEntries(Object.entries(edits?.terrain??{}).filter(([id])=>{
      const [x,y]=id.split(',').map(Number);
      return !coastEntryProtected(x,y);
    }));
    drawMapTerrainEdits(scene,terrain,this.terrainKey,(x,y)=>coastBaseWater((x+.5)*TILE,(y+.5)*TILE),'forest')?.setDepth(-99);
    if(!editor){
      addWaterMotion(scene,(x,y)=>this.layout.water((x+.5)*TILE,(y+.5)*TILE),this.layout.water,
        {...COAST_SIZE,alpha:.34,opacity:(x,y)=>.25+.75*clamp(Math.max(coastShoreDistance(x,y),-coastRiverEdge(x,y))/60)});
      this.foam=scene.add.graphics().setDepth(-72);
    }
    for(const o of this.layout.objects){
      const {x,y}=this.layout.pivot(o),tree=o.kind==='standingTree'||o.kind==='pine';
      const sprite=tree
        ?scene.add.image(x,y,`asset-${o.kind==='pine'?'pine':'tree'}-${o.variant??0}`).setOrigin(.5,256/264).setDisplaySize(166,211).setDepth(y).setTint(0xe4ddba)
        :drawEditorProp(scene,o.kind,x,y);
      if(!sprite)continue;
      if(o.scale)sprite.setScale(sprite.scaleX*o.scale,sprite.scaleY*o.scale);
      if(o.flip)sprite.setFlipX(true);
      if(tree&&!editor)sprite.setData('wind-tree',true);
      if(o.generated&&!tree)sprite.setData('no-shadow',true);
      if(o.kind==='coast-pier'){
        const art=COAST_ART[o.kind];
        sprite.setDepth(-60).setData('no-shadow',true);
        if(!editor)scene.add.image(x,y,PIER_FRONT).setOrigin(.5,art.pivot)
          .setDisplaySize(art.width,art.height).setDepth(y-19).setData('no-shadow',true);
      }
      if(o.kind==='coast-lantern')sprite.setData('fixture-light',{offsetY:-42,radius:78});
      if(!editor&&o.kind!=='coast-pier'&&sprite.displayHeight>=68)this.fading.push({sprite,x,y});
      this.editorObjects.push({id:o.id,kind:o.kind,x:o.x,y:o.y,texture:sprite.texture.key,frame:sprite.frame.name});
    }
    drawExitSign(scene,edits?.points?.exit??COAST_EXIT,edits?.points?.entry??COAST_ENTRY);
  }
  update(dt:number,player:{x:number;y:number}):void {
    for(const {sprite,x,y} of this.fading){
      const faded=player.y<y&&player.y>y-sprite.displayHeight*.88&&Math.abs(player.x-x)<sprite.displayWidth*.36;
      sprite.setAlpha(faded?.54:1);
    }
    if(!this.foam)return;
    this.waveTime+=dt;
    const foam=this.foam,camera=this.scene.cameras.main;
    foam.clear();
    const view=camera.worldView;
    // Espuma ao longo da praia: traços curtos que avançam e recuam pela normal do mar.
    for(const [i,p] of COAST_SHORE_POINTS.entries()){
      if(p.x<view.x-60||p.x>view.right+60||p.y<view.y-60||p.y>view.bottom+60)continue;
      const phase=(this.waveTime*.31+i*.087)%1,alpha=Math.sin(phase*Math.PI)*.36,offset=3+(1-phase)*29,length=14+coastSeed(i,71)*21;
      foam.lineStyle(1,0xe0f0d6,alpha);foam.beginPath();
      let started=false;
      for(let j=0;j<=5;j++){
        const t=(j/5-.5)*length,wave=Math.sin(j*.78+i*.12)*3;
        const px=p.x+p.nx*(offset+wave)+p.ny*t,py=p.y+p.ny*(offset+wave)-p.nx*t;
        if(!this.layout.inWater(px,py)){started=false;continue;}
        if(started)foam.lineTo(px,py);else foam.moveTo(px,py);
        started=true;
      }
      foam.strokePath();
    }
  }
  swimmingDepth(x:number,y:number):number {
    return this.layout.onDeck(x,y)?0:sampleWaterDepth(this.layout.water,x,y);
  }
  destroy():void {
    this.foam?.destroy();
    if(this.scene.textures.exists(this.terrainKey))this.scene.textures.remove(this.terrainKey);
  }
}
