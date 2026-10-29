import type Phaser from 'phaser';
import art from '../public/assets/visual/city-forest/manifest.json';
import {setupVillagePropAtlas} from './village-prop-atlas';
import {readTerrainSprites} from './terrain-sprites';
import {natureArt} from './data/nature-catalog';
import {CITY_FOREST_TREES,CITY_FOREST_OBSTACLES,CITY_PUDDLES,CITY_ROAD_FENCES,CITY_SIGN_TEXT,CITY_ACCESS,cityRoadDistance,cityRoadAt,cityForestTrailDistance,cityForestWater,cityForestBlockedPoint} from './data/city-forest';
import {drawExitSign} from './exit-signs';

export function preloadCityForest(scene:Phaser.Scene):void{scene.load.image('city-forest-source',art.file);}
export class CityForestWorld{
 readonly objects:Phaser.GameObjects.GameObject[];
 readonly trees:Phaser.GameObjects.Image[]=[];
 private readonly mist:Phaser.GameObjects.TileSprite;
 constructor(private readonly scene:Phaser.Scene){
  const before=new Set(scene.children.list);setupVillagePropAtlas(scene,'city-forest-art','city-forest-source',art);
  this.drawGround();this.drawFences();
  for(const p of CITY_FOREST_TREES){
   this.trees.push(scene.add.image((p.x+.5)*32,p.y*32+25,`asset-${p.pine?'pine':'tree'}-${p.variant}`).setOrigin(.5,256/264).setDisplaySize(166*p.scale,211*p.scale).setDepth(p.y*32+25).setData('city-forest-tree',true));
  }
  for(const p of CITY_FOREST_OBSTACLES){const a=natureArt(p.kind)!;scene.add.image((p.x+.5)*32,p.y*32+25,a.texture).setOrigin(.5,a.pivot).setDisplaySize(a.width,a.height).setDepth(p.y*32+25);}
  // Small planted clusters and forest-floor details never occupy the trail.
  for(let i=0;i<1400;i++){
   const x=3+(i*73%90),y=17+(i*41%52),d=cityForestTrailDistance(x+.5,y+.5);
   if(d<1.8||cityRoadDistance(x,y)<5.5||cityForestWater(x,y)||cityForestBlockedPoint((x+.5)*32,(y+.5)*32))continue;
   const a=natureArt(['fern','bush','whiteFlowers','mushrooms'][i%4])!;
   const px=(x+.5)*32+(i%5-2)*3,py=y*32+25;
   scene.add.image(px,py,a.texture).setOrigin(.5,a.pivot).setDisplaySize(a.width*.8,a.height*.8).setDepth(py);
  }
  scene.add.image(27.4*32,5*32,'city-forest-art','city').setOrigin(.5,1).setDisplaySize(80,95).setDepth(160).setData('city-access-sign',CITY_SIGN_TEXT);
  scene.add.zone((CITY_ACCESS.x+.5)*32,(CITY_ACCESS.y+.5)*32,80,90).setData('future-city-access',CITY_ACCESS);
  drawExitSign(scene,{x:48,y:70},{x:48,y:68});
  if(!scene.textures.exists('city-forest-mist')){
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d')!;
   for(const [x,y,r]of [[48,80,75],[161,154,92],[220,46,61]]){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#d7e5e0bb');g.addColorStop(1,'#d7e5e000');c.fillStyle=g;c.fillRect(0,0,256,256);}
   scene.textures.addCanvas('city-forest-mist',canvas);
  }
  scene.add.rectangle(0,0,3072,2304,0x78958c,.07).setOrigin(0).setDepth(4099).setData('city-forest-haze',true);
  this.mist=scene.add.tileSprite(0,0,3072,2304,'city-forest-mist').setOrigin(0).setTileScale(3).setAlpha(.18).setDepth(4100).setData('city-forest-mist',true);
  this.objects=scene.children.list.filter(o=>!before.has(o));
 }
 private drawGround():void{
  const key='city-forest-ground';
  if(!this.scene.textures.exists(key)){
   const sprites=readTerrainSprites(this.scene);if(!sprites)throw new Error('Materiais de terreno não carregados');
   const asphaltFrame=this.scene.textures.get('city-forest-art').get('asphalt');
   const tile=document.createElement('canvas');tile.width=96;tile.height=96;
   const tc=tile.getContext('2d')!;tc.drawImage(asphaltFrame.source.image as HTMLImageElement,asphaltFrame.cutX,asphaltFrame.cutY,asphaltFrame.cutWidth,asphaltFrame.cutHeight,0,0,96,96);
   const asphalt=tc.getImageData(0,0,96,96).data;
   const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const c=canvas.getContext('2d')!,pixels=c.createImageData(3072,2304);
   // Expensive geometry sampled once per 4px block. Source pixels stay crisp.
   for(let by=0;by<2304;by+=4)for(let bx=0;bx<3072;bx+=4){
    const x=(bx+2)/32,y=(by+2)/32,road=cityRoadDistance(x,y),trail=cityForestTrailDistance(x,y);
    const irregular=.09*Math.sin(x*3.1+y*2.3)+.05*Math.cos(y*5-x);
    const trailWeight=Math.max(0,Math.min(1,(1.35+irregular-trail)/.5));
    const ground=sprites.forest,grass=sprites.grass,path=sprites['path-dry'];
    const cover=.22+.18*(Math.sin(x*.47+y*.31)+1)/2;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
     const px=bx+dx,py=by+dy,at=(py*3072+px)*4,src=((py%96)*96+px%96)*4;
     for(let k=0;k<3;k++){
      let v=ground.pixels[src+k]*(1-cover)+grass.pixels[src+k]*cover;
      v=v*(1-trailWeight)+path.pixels[src+k]*trailWeight;
      if(road<3.16){const a=Math.max(0,Math.min(1,(3.16-road)/.2));v=v*(1-a)+asphalt[src+k]*a;}
      pixels.data[at+k]=v;
     }
     pixels.data[at+3]=255;
    }
   }
   c.putImageData(pixels,0,0);c.imageSmoothingEnabled=false;
   // Road markings follow the same L; both remain entirely in the north.
   c.strokeStyle='#c2b994';c.lineWidth=3;c.setLineDash([23,19]);c.beginPath();c.moveTo(22*32,0);c.lineTo(22*32,10*32);c.lineTo(3072,10*32);c.stroke();c.setLineDash([]);
   c.globalAlpha=.17;c.fillStyle='#17252b';for(const [x,y,w,h]of[[35,10,2,.45],[58,9,2.8,.65],[22,5,1,1.4],[83,11,2,.7]]){c.beginPath();c.ellipse(x*32,y*32,w*32,h*32,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;
   for(const p of CITY_PUDDLES){c.fillStyle='#385f58';c.beginPath();c.ellipse(p.x*32,p.y*32,p.rx*32,p.ry*32,0,0,Math.PI*2);c.fill();c.strokeStyle='#6f9582';c.lineWidth=2;c.stroke();}
   // Fine leaf litter and exposed roots reuse the ground palette, baked once.
   for(let i=0;i<1600;i++){const x=(i*197)%3030+20,y=(i*283)%2200+50;if(cityRoadAt(x/32,y/32)||cityForestWater(x/32,y/32))continue;c.fillStyle=i%3?'#93845488':'#493e2f88';c.fillRect(x,y,2+i%3,1+i%2);}
   this.scene.textures.addCanvas(key,canvas)!.setFilter(0);
  }
  this.scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
 }
 private drawFences():void{
  for(const [index,s]of CITY_ROAD_FENCES.entries()){
   const vertical=s.a[0]===s.b[0],length=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1])*32,count=Math.ceil(length/64),step=length/count;
   const frame=vertical?'fence-ns':'fence-ew',span=vertical?art.fenceSpan.ns:art.fenceSpan.ew,scale=step/span;
   for(let i=0;i<count;i++){
    const x=s.a[0]*32+(vertical?0:(i+.5)*step),y=s.a[1]*32+(vertical?(i+.5)*step:0);
    this.scene.add.image(x,y,'city-forest-art',frame).setOrigin(art.fenceOrigin[vertical?'ns':'ew'].x,art.fenceOrigin[vertical?'ns':'ew'].y)
     .setScale(scale).setDepth(y+2).setData({'city-road-fence':index,'city-fence-view':vertical?'one-wire':'four-wires'});
   }
  }
 }
 update(time:number):void{this.mist.tilePositionX=time*.0014;this.mist.tilePositionY=time*.0004;}
 destroy():void{this.objects.forEach(o=>o.destroy());}
}
