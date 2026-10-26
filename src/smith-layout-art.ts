import Phaser from 'phaser';
import {SMITH_ASSETS,smithAsset,smithProject,smithPieceVisible,smithFloorSeam,smithPieceDepth,type SmithLayout,type SmithPiece} from './systems/smith-layout';
import {finishSmithPixel,finishSmithWindow,SMITH_WALL_COLOR} from './smith-finish';
import {animateSmithProps} from './smith-effects';
const key=(id:string)=>'smith-layout-'+id;
let roomRevision=0;
export function preloadSmithLayout(scene:Phaser.Scene){for(const a of SMITH_ASSETS)scene.load.image(key(a.id),'dev/vila-v31/'+a.file);}
export interface SmithView {objects:Phaser.GameObjects.GameObject[];editing(enabled:boolean,onSelect?:(id:string)=>void,onMove?:(id:string,x:number,y:number)=>void):void;destroy():void}
export function drawSmithLayout(scene:Phaser.Scene,data:SmithLayout):SmithView{
 const objects:Phaser.GameObjects.GameObject[]=[],sprites=new Map<string,Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite>();
 const add=<T extends Phaser.GameObjects.GameObject>(o:T):T=>{objects.push(o);return o;};
 const frame=data.pieces.find(p=>p.id==='structure')!;
 const mask=(rects:Array<{x:number;y:number;w:number;h:number}>,invert=false)=>{const g=add(scene.make.graphics({x:0,y:0},false).fillStyle(0xffffff));for(const r of rects)g.fillRect(r.x,r.y,r.w,r.h);const m=g.createGeometryMask();m.invertAlpha=invert;return m;};
 const windowPoint=smithProject(data,119,56),windowW=50*frame.sx/.5,windowH=58*frame.sy/.5;
 // Palette finish is applied at runtime, including the window halo and side plaster.
 const finishedKey='smith-room-finish-'+(++roomRevision),finished=scene.textures.createCanvas(finishedKey,1062,617)!;
 const context=finished.getContext();context.drawImage(scene.textures.get(key('structure')).getSourceImage() as HTMLImageElement,0,0);
 const pixels=context.getImageData(0,0,1062,617);
 for(let y=0;y<617;y++)for(let x=0;x<1062;x++){const i=(y*1062+x)*4,c=pixels.data;const value=finishSmithPixel(c[i],c[i+1],c[i+2],c[i+3],x,y,frame.wallShade??.98);c.set(value,i);}
 context.putImageData(pixels,0,0);finished.refresh();
 finished.add('plaster',0,300,64,56,50);
 const windowKey=finishedKey+'-window',windowTexture=scene.textures.createCanvas(windowKey,108,124)!,windowContext=windowTexture.getContext();
 windowContext.drawImage(scene.textures.get(key('structure')).getSourceImage() as HTMLImageElement,186,60,108,124,0,0,108,124);
 const windowPixels=windowContext.getImageData(0,0,108,124);windowPixels.data.set(finishSmithWindow(windowPixels.data,108,124,frame.wallShade??.98));windowContext.putImageData(windowPixels,0,0);windowTexture.refresh();
 const patch=add(scene.add.tileSprite(windowPoint.x,windowPoint.y,windowW,windowH,finishedKey,'plaster').setOrigin(0).setTileScale(frame.sx,frame.sy).setDepth(-910).setVisible(frame.visible));void patch;
 for(const p of data.pieces){const a=smithAsset(p.asset)!;
  if(a.crop&&!finished.has(a.frame!))finished.add(a.frame!,0,a.crop.x,a.crop.y,a.crop.width,a.crop.height);
  const texture=a.frame==='window'?windowKey:p.id==='structure'||a.crop?finishedKey:key(a.id);
  const image=a.tile?scene.add.tileSprite(p.x,p.y,p.sx,p.sy,key(a.id)).setOrigin(0).setTileScale(160/(scene.textures.get(key(a.id)).getSourceImage() as HTMLImageElement).width,160/(scene.textures.get(key(a.id)).getSourceImage() as HTMLImageElement).height)
   :scene.add.image(p.x,p.y,texture,a.frame==='window'?'__BASE':a.frame??'__BASE').setOrigin(a.ox,a.oy).setScale(p.sx,p.sy);
  add(image);sprites.set(p.id,image);image.setVisible(smithPieceVisible(data,p)).setData('smithLayoutId',p.id);
  // Positive rectangles work in Canvas too (inverted geometry masks are WebGL-only).
  if(p.id==='structure')image.setMask(mask([
   {x:frame.x,y:frame.y,w:1062*frame.sx,h:windowPoint.y-frame.y},
   {x:frame.x,y:windowPoint.y,w:windowPoint.x-frame.x,h:windowH},
   {x:windowPoint.x+windowW,y:windowPoint.y,w:frame.x+1062*frame.sx-windowPoint.x-windowW,h:windowH},
   {x:frame.x,y:windowPoint.y+windowH,w:1062*frame.sx,h:frame.y+617*frame.sy-windowPoint.y-windowH}
  ]));
 }
 for(const p of data.pieces)sprites.get(p.id)!.setDepth(p.id==='structure'?-900:smithPieceDepth(data,p));
 const wall=smithProject(data,60,49),wallEnd=smithProject(data,527,119),wallColor=(SMITH_WALL_COLOR[0]<<16)|(SMITH_WALL_COLOR[1]<<8)|SMITH_WALL_COLOR[2];
 add(scene.add.rectangle(wall.x,wall.y,wallEnd.x-wall.x,wallEnd.y-wall.y,wallColor,frame.wallShade??.98).setOrigin(0).setDepth(-600).setVisible(frame.visible));
 const seam=smithFloorSeam(data);if(seam)add(scene.add.graphics().setDepth(-805).lineStyle(.6,0x54432e,.12).lineBetween(seam.x,seam.top,seam.x,seam.bottom));
 // Only the outer masonry occludes actors; timber moulding is behind furniture.
 const left=smithProject(data,46,24),right=smithProject(data,541,24),bottom=smithProject(data,24,283);
 add(scene.add.image(frame.x,frame.y,finishedKey,'__BASE').setOrigin(0).setScale(frame.sx,frame.sy).setDepth(10000).setVisible(frame.visible).setMask(mask([{x:-100,y:-100,w:left.x+100,h:700},{x:right.x,y:-100,w:900-right.x,h:700},{x:-100,y:bottom.y,w:1000,h:500}])));
 const stopEffects=animateSmithProps(scene,data,sprites);
 let selected:((id:string)=>void)|undefined,moved:((id:string,x:number,y:number)=>void)|undefined;
 const click=(_pointer:unknown,o:Phaser.GameObjects.Image)=>{const id=o.getData('smithLayoutId');if(id)selected?.(id);};
 const drag=(_pointer:unknown,o:Phaser.GameObjects.Image,x:number,y:number)=>{const id=o.getData('smithLayoutId'),p=data.pieces.find(p=>p.id===id);if(!p||!moved)return;const dx=x-p.x,dy=y-p.y;const move=(p:SmithPiece)=>{const s=sprites.get(p.id);s?.setPosition(p.x+dx,p.y+dy);if(s?.mask instanceof Phaser.Display.Masks.GeometryMask)s.mask.geometryMask.setPosition(dx,dy);for(const c of data.pieces)if(c.parent===p.id)move(c);};move(p);};
 const end=(_pointer:unknown,o:Phaser.GameObjects.Image)=>{const id=o.getData('smithLayoutId');if(id)moved?.(id,o.x,o.y);};
 scene.input.on('gameobjectdown',click);scene.input.on('drag',drag);scene.input.on('dragend',end);
 return{objects,editing(enabled,onSelect,onMove){selected=enabled?onSelect:undefined;moved=enabled?onMove:undefined;for(const o of sprites.values()){if(enabled){o.setInteractive({pixelPerfect:!(o instanceof Phaser.GameObjects.TileSprite),alphaTolerance:128});scene.input.setDraggable(o);}else{o.disableInteractive();scene.input.setDraggable(o,false);}}},destroy(){scene.input.off('gameobjectdown',click);scene.input.off('drag',drag);scene.input.off('dragend',end);stopEffects();for(const o of objects)o.destroy();scene.textures.remove(windowKey);scene.textures.remove(finishedKey);}};
}
