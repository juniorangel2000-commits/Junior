import type Phaser from 'phaser';
import {FARM_INTERIORS,INTERIOR_TILE as T,type FarmInteriorLayout,type InteriorFixture} from './data/farm-interiors';
import type {FarmKind} from './data/farm-buildings';
/** Arte dos interiores do galinheiro e do curral, gerada no SpriteCook no estilo das
 * construções da fazenda (manifesto em `public/assets/visual/farm/interior/spritecook-assets.json`).
 * As chaves de textura dos objetos são fixas:
 * `interior-trough-<largura>`, `interior-water`, `interior-nest`, `interior-stall-<l>x<a>`
 * e `interior-divider-<a>`. O piso com as paredes é montado em `interior-<tipo>-floor`. */
const DIR='assets/visual/farm/interior/';
const SOURCES:Record<string,string>={
 'interior-tile-straw':'floor-straw.png','interior-tile-planks':'floor-planks.png',
 'interior-wall':'wall.png','interior-wall-top':'wall-top.png',
 'interior-nest':'nest.png','interior-water':'water.png',
 'interior-trough-64':'trough-64.png','interior-trough-96':'trough-96.png',
 'interior-stall-96x96':'stall.png','interior-divider-88':'divider.png',
 'interior-nest-egg':'nest-egg.png','interior-nest-duck-egg':'nest-duck-egg.png','interior-manure':'../../kitchen/manure.png','interior-trough-64-empty':'trough-64-empty.png','interior-trough-96-empty':'trough-96-empty.png',
 'interior-wool-ready':'../products/wool.png','interior-shears':'../products/shears.png',
 'interior-milk-ready':'../products/milk.png','interior-milk-pail':'../products/milk-pail.png',
};
export const FARM_INTERIOR_ART_FILES=Object.values(SOURCES).map(f=>DIR+f);
export function preloadFarmInteriorArt(scene:Phaser.Scene):void{
 for(const [key,file] of Object.entries(SOURCES))if(!scene.textures.exists(key))scene.load.image(key,DIR+file);
}
/** Chave da textura de cada objeto fixo (a mesma da arte provisória). */
export function fixtureKey(f:InteriorFixture):string{
 if(f.kind==='mud')return 'interior-mud';
 if(f.kind==='manure')return 'interior-manure';
 if(f.kind==='trough')return `interior-trough-${f.w}`;
 if(f.kind==='water')return 'interior-water';
 if(f.kind==='nest')return 'interior-nest';
 return f.solid?`interior-divider-${f.h}`:`interior-stall-${f.w}x${f.h}`;
}
const source=(scene:Phaser.Scene,key:string)=>scene.textures.exists(key)?scene.textures.get(key).getSourceImage() as HTMLImageElement:undefined;
/** O piso é montado com o dobro da resolução do mundo: as texturas do SpriteCook ficam
 * na grade de pixels original (sem redução) e a câmera não precisa ampliar um piso pequeno. */
const FLOOR_SCALE=2;
/** Piso inteiro com as paredes: textura repetida, parede de tábuas no fundo, topo de
 * parede nas laterais e embaixo, e a abertura da porta no meio da parede de baixo. */
function floor(scene:Phaser.Scene,kind:FarmKind,l:FarmInteriorLayout):string{
 const key=`interior-${kind}-floor`;if(scene.textures.exists(key))return key;
 const S=FLOOR_SCALE,W=l.width*T,H=l.height*T,canvas=document.createElement('canvas');canvas.width=W*S;canvas.height=H*S;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.scale(S,S);
 /** Padrão repetido com `height` px do mundo de altura; 1:1 na tela do piso quando a fonte já tem essa altura. */
 const pattern=(k:string,height:number,fallback:string)=>{
  const img=source(scene,k);if(!img)return fallback;
  const h=Math.round(height*S),w=Math.round(img.width*h/img.height),tile=document.createElement('canvas');tile.width=w;tile.height=h;
  const t=tile.getContext('2d')!;t.imageSmoothingEnabled=h<img.height;t.imageSmoothingQuality='high';t.drawImage(img,0,0,w,h);
  const p=c.createPattern(tile,'repeat');p?.setTransform(new DOMMatrix().scale(1/S,1/S));return p??fallback;
 };
 const straw=l.floor==='straw',WALL_H=T+8;
 c.fillStyle=pattern(straw?'interior-tile-straw':'interior-tile-planks',100,straw?'#a9844a':'#8d6a43');c.fillRect(0,0,W,H);
 // Paredes laterais (topo de parede girado) e de baixo, com a porta aberta.
 const top=pattern('interior-wall-top',T,'#5b3d22');
 const side=(x:number,w:number)=>{c.save();c.translate(x+w,0);c.rotate(Math.PI/2);c.fillStyle=top;c.fillRect(0,0,H,w);c.restore();};
 const bottom=(x:number,w:number)=>{if(w<=0)return;c.save();c.translate(x,(l.height-1)*T);c.fillStyle=top;c.fillRect(0,0,w,T);c.restore();};
 side(0,T);side(W-T,T);
 bottom(0,l.doorX*T);bottom((l.doorX+l.doorWidth)*T,W-(l.doorX+l.doorWidth)*T);
 // Parede do fundo, vista de frente, por cima das laterais.
 c.fillStyle=pattern('interior-wall',WALL_H,'#6a4a2c');c.fillRect(0,0,W,WALL_H);
 // Sombras de contato: dão profundidade ao pé das paredes.
 c.fillStyle='rgba(30,18,8,.35)';c.fillRect(T,WALL_H,W-2*T,4);c.fillRect(T,WALL_H,3,H-T-WALL_H);c.fillRect(W-T-3,WALL_H,3,H-T-WALL_H);
 c.fillStyle='rgba(20,12,5,.55)';c.fillRect(0,WALL_H,W,1);c.fillRect(T-1,WALL_H,1,H-T-WALL_H);c.fillRect(W-T,WALL_H,1,H-T-WALL_H);
 // Soleira escura da porta.
 const door=c.createLinearGradient(0,(l.height-1)*T,0,H);door.addColorStop(0,'rgba(47,33,22,0)');door.addColorStop(1,'rgba(47,33,22,.9)');
 c.fillStyle=door;c.fillRect(l.doorX*T,(l.height-1)*T,l.doorWidth*T,T);
 scene.textures.addCanvas(key,canvas)?.setFilter(0);return key;
}
/** Estado visível dos objetos: ovos nos ninhos (índices 0–5) e cocho com ou sem palha. */
export interface InteriorFixtureState{eggs:readonly number[];duckEggs?:readonly number[];manure?:readonly number[];trough:number}
export interface InteriorView{fixtures:Map<string,Phaser.GameObjects.Image>;refresh(state:InteriorFixtureState):void;destroy():void}
/** Lamaçal do chiqueiro, desenhado em pixel art (terra molhada com poças e reflexos). */
function mudTexture(scene:Phaser.Scene,w:number,h:number):void{
 if(scene.textures.exists('interior-mud'))return;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')!;
 let seed=7;const r=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const blob=(cx:number,cy:number,rx:number,ry:number,col:string)=>{x.fillStyle=col;for(let yy=-ry;yy<=ry;yy++){const half=Math.round(rx*Math.sqrt(1-(yy/ry)**2));x.fillRect(Math.round(cx-half),Math.round(cy+yy),half*2,1);}};
 blob(w/2,h/2,w/2-2,h/2-3,'#4a3420');blob(w/2,h/2,w/2-5,h/2-6,'#5e4229');
 for(let i=0;i<5;i++)blob(10+r()*(w-20),8+r()*(h-16),6+r()*10,3+r()*4,'#3e2a18');
 for(let i=0;i<4;i++){const px=12+r()*(w-24),py=10+r()*(h-20);blob(px,py,5+r()*6,2+r()*2,'#6f5a3e');x.fillStyle='#a08a66';x.fillRect(Math.round(px-2),Math.round(py-1),3,1);}
 for(let i=0;i<40;i++){x.fillStyle=r()<.5?'#735131':'#2f2013';x.fillRect(Math.round(8+r()*(w-16)),Math.round(6+r()*(h-12)),2,1);}
 scene.textures.addCanvas('interior-mud',c);
}
export function drawFarmInterior(scene:Phaser.Scene,kind:FarmKind):InteriorView{
 const l=FARM_INTERIORS[kind]!,objects:Phaser.GameObjects.GameObject[]=[],fixtures=new Map<string,Phaser.GameObjects.Image>();
 objects.push(scene.add.image(0,0,floor(scene,kind,l)).setOrigin(0).setScale(1/FLOOR_SCALE).setDepth(-100));
 for(const f of l.fixtures){
  if(f.kind==='mud')mudTexture(scene,f.w,f.h);
  const key=fixtureKey(f),divider=f.kind==='stall'&&f.solid,img=scene.add.image(f.x+f.w/2,f.y+f.h+(divider?4:0),key).setOrigin(.5,1).setDepth(f.solid?f.y+f.h:-50);
  // A arte fica na resolução original e é reduzida só na exibição. A baia ocupa o retângulo
  // inteiro; os outros objetos mantêm a proporção, apoiados na base. A divisória é fina
  // na colisão (6 px) e a arte segue a altura dela.
  if(f.kind==='stall'&&!divider)img.setDisplaySize(f.w,f.h);
  else img.setScale(divider?(f.h+6)/img.height:Math.min(f.w/img.width,f.h/img.height));
  fixtures.set(f.id,img);objects.push(img);
 }
 const refresh=(state:InteriorFixtureState)=>{for(const f of l.fixtures){const img=fixtures.get(f.id);if(!img)continue;
  let key=fixtureKey(f);
  if(f.kind==='nest'&&state.eggs.includes(Number(f.id.slice(5))-1))key='interior-nest-egg';
  if(f.kind==='nest'&&state.duckEggs?.includes(Number(f.id.slice(5))-1))key='interior-nest-duck-egg';
  if(f.kind==='manure'){img.setVisible(!!state.manure?.includes(Number(f.id.slice(7))-1));continue;}
  if(f.kind==='trough'&&state.trough<=0)key+='-empty';
  if(img.texture.key!==key&&scene.textures.exists(key)){const w=img.displayWidth,h=img.displayHeight;img.setTexture(key).setDisplaySize(w,h);}
 }};
 return{fixtures,refresh,destroy:()=>{for(const o of objects)o.destroy();fixtures.clear();}};
}
