import type Phaser from 'phaser';
import {FARM_INTERIORS,INTERIOR_TILE as T,type FarmInteriorLayout,type InteriorFixture} from './data/farm-interiors';
import type {FarmKind} from './data/farm-buildings';
/** Arte PROVISÓRIA dos interiores, desenhada em código. As chaves de textura são fixas:
 * a arte definitiva (SpriteCook ou Codex) pode ser carregada com as mesmas chaves
 * em `preloadFarmInteriorArt` sem mudar o resto do jogo. */
const rng=(seed:number)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function canvasTexture(scene:Phaser.Scene,key:string,w:number,h:number,draw:(c:CanvasRenderingContext2D,r:()=>number)=>void):string{
 if(scene.textures.exists(key))return key;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 let seed=0;for(const ch of key)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;draw(c,rng(seed||1));
 scene.textures.addCanvas(key,canvas)?.setFilter(0);return key;
}
const px=(c:CanvasRenderingContext2D,color:string,x:number,y:number,w=1,h=1)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
/** Piso inteiro do interior (uma imagem só, com variação por pixel). */
function floor(scene:Phaser.Scene,kind:FarmKind,l:FarmInteriorLayout):string{
 return canvasTexture(scene,`interior-${kind}-floor`,l.width*T,l.height*T,(c,r)=>{
  const straw=l.floor==='straw';
  if(straw){px(c,'#8a6a3e',0,0,l.width*T,l.height*T);for(let i=0;i<l.width*l.height*26;i++){const x=Math.floor(r()*l.width*T),y=Math.floor(r()*l.height*T),v=r();px(c,v<.4?'#c9a35a':v<.7?'#a9844a':v<.9?'#dcbd72':'#6f5531',x,y,v<.6?3:2,1);}}
  else{for(let y=0;y<l.height*T;y+=8){const shade=['#8d6a43','#83613c','#946f46'][Math.floor(r()*3)];px(c,shade,0,y,l.width*T,8);px(c,'#5c4329',0,y+7,l.width*T,1);for(let x=Math.floor(r()*40);x<l.width*T;x+=40+Math.floor(r()*30))px(c,'#5c4329',x,y,1,7);}
   for(let i=0;i<l.width*l.height*6;i++){const x=Math.floor(r()*l.width*T),y=Math.floor(r()*l.height*T);px(c,r()<.5?'#d6b467':'#b8954f',x,y,3,1);}}
  // Paredes de tábua: faixa alta no topo, laterais e parede de baixo com a porta aberta.
  const wall=(x:number,y:number,w:number,h:number)=>{px(c,'#6a4a2c',x,y,w,h);for(let i=x;i<x+w;i+=8){px(c,'#7d5835',i+1,y,6,h);px(c,'#4a3220',i,y,1,h);}px(c,'#3f2a1a',x,y+h-2,w,2);};
  wall(0,0,l.width*T,T+8);px(c,'#4f3621',0,T-6,l.width*T,4);
  wall(0,T,T,l.height*T-T);wall(l.width*T-T,T,T,l.height*T-T);
  wall(0,(l.height-1)*T,l.doorX*T,T);wall((l.doorX+l.doorWidth)*T,(l.height-1)*T,(l.width-l.doorX-l.doorWidth)*T,T);
  px(c,'#2f2116',l.doorX*T,(l.height-1)*T+T-6,l.doorWidth*T,6);
 });
}
function fixtureTexture(scene:Phaser.Scene,f:InteriorFixture):string{
 if(f.kind==='trough')return canvasTexture(scene,`interior-trough-${f.w}`,f.w,f.h,c=>{px(c,'#5b3d22',0,6,f.w,f.h-8);px(c,'#7b5431',2,8,f.w-4,f.h-12);px(c,'#3d2817',3,10,f.w-6,f.h-17);for(let x=4;x<f.w-4;x+=3)px(c,x%2?'#d8b866':'#b8954a',x,12+(x%5),3,2);px(c,'#3f2a1a',0,f.h-3,f.w,3);});
 if(f.kind==='water')return canvasTexture(scene,'interior-water',f.w,f.h,c=>{px(c,'#5d6168',4,8,f.w-8,f.h-12);px(c,'#7d838c',6,10,f.w-12,f.h-16);px(c,'#3f7fa8',8,12,f.w-16,f.h-20);px(c,'#8fc6e3',10,13,6,2);px(c,'#3b3e43',4,f.h-5,f.w-8,2);});
 if(f.kind==='nest')return canvasTexture(scene,'interior-nest',f.w,f.h,(c,r)=>{px(c,'#6b4a2b',2,10,f.w-4,f.h-12);for(let i=0;i<70;i++){const a=r()*Math.PI*2,d=8+r()*6;px(c,r()<.5?'#d9b866':'#b48d47',Math.round(16+Math.cos(a)*d),Math.round(18+Math.sin(a)*d*.6),2,1);}px(c,'#7b5a33',11,16,10,5);});
 // Baia: piso de palha com cerca baixa nas bordas (as divisórias sólidas são finas).
 if(f.solid)return canvasTexture(scene,`interior-divider-${f.h}`,Math.max(6,f.w),f.h,c=>{px(c,'#5b3d22',0,0,f.w,f.h);px(c,'#7d5835',1,0,f.w-2,f.h-2);for(let y=6;y<f.h;y+=18)px(c,'#3f2a1a',0,y,f.w,2);});
 return canvasTexture(scene,`interior-stall-${f.w}x${f.h}`,f.w,f.h,(c,r)=>{for(let i=0;i<f.w*f.h/9;i++){px(c,r()<.5?'#c9a35a':'#a9844a',Math.floor(r()*f.w),Math.floor(r()*f.h),3,1);}px(c,'#6a4a2c',0,f.h-6,f.w,4);px(c,'#8a6340',0,f.h-6,f.w,1);});
}
export interface InteriorView{fixtures:Map<string,Phaser.GameObjects.Image>;destroy():void}
export function drawFarmInterior(scene:Phaser.Scene,kind:FarmKind):InteriorView{
 const l=FARM_INTERIORS[kind]!,objects:Phaser.GameObjects.GameObject[]=[],fixtures=new Map<string,Phaser.GameObjects.Image>();
 objects.push(scene.add.image(0,0,floor(scene,kind,l)).setOrigin(0).setDepth(-100));
 for(const f of l.fixtures){const img=scene.add.image(f.x,f.y,fixtureTexture(scene,f)).setOrigin(0).setDepth(f.solid?f.y+f.h:-50);fixtures.set(f.id,img);objects.push(img);}
 return{fixtures,destroy:()=>{for(const o of objects)o.destroy();fixtures.clear();}};
}
