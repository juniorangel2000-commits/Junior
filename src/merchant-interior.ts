import type Phaser from 'phaser';
import {MERCHANT_ROOM_ASSETS,merchantPieceVisible,createMerchantLayout} from './data/merchant-rooms';
import type {ResidentId} from './systems/merchant-visit';
import type {SmithLayout} from './systems/smith-layout';
import type {SmithView} from './smith-layout-art';
import {SMITH_WALL_COLOR} from './smith-finish';
import {animateMerchantProps} from './merchant-effects';
export function preloadMerchantRooms(scene:Phaser.Scene){
 for(const a of MERCHANT_ROOM_ASSETS)if(a.file&&!a.frame)scene.load.image('merchant-room-'+a.id,a.file.startsWith('assets/')?a.file:'dev/augusto/'+a.file);
 scene.load.image('rosa-room-atlas','assets/visual/village/rosa/objetos.png');
 scene.load.image('tobias-room-atlas','assets/visual/village/tobias/objetos.png');
 scene.load.image('amelia-room-atlas','assets/visual/village/amelia/objetos.png');
 scene.load.image('nilo-room-atlas','assets/visual/village/nilo/objetos.png');
 scene.load.image('celina-room-atlas','assets/visual/village/celina/objetos.png');
 scene.load.image('damiao-room-atlas','assets/visual/village/damiao/objetos.png');
 scene.load.image('icaro-room-atlas','assets/visual/village/icaro/objetos.png');
 scene.load.image('helena-room-atlas','assets/visual/village/helena/objetos.png');
}
export function drawMerchantInterior(scene:Phaser.Scene,id:ResidentId,data:SmithLayout=createMerchantLayout(id)):SmithView{
 const owned:Phaser.GameObjects.GameObject[]=[],sprites=new Map<string,Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite>();const add=<T extends Phaser.GameObjects.GameObject>(o:T)=>{owned.push(o);return o;};
 const frame=data.pieces.find(p=>p.id==='structure')!,shade=frame.wallShade??1,key='merchant-wall-'+Math.round(shade*1000);
 if(!scene.textures.exists(key)){const texture=scene.textures.createCanvas(key,576,384)!,c=texture.getContext();c.fillStyle='#3a291d';c.fillRect(24,23,528,341);c.clearRect(33,116,510,234);c.clearRect(257,350,62,18);
  c.fillStyle=`rgb(${SMITH_WALL_COLOR.map((n,i)=>Math.round([183,163,123][i]*(1-shade)+n*shade)).join(',')})`;c.fillRect(33,32,510,84);c.fillStyle='#6a492a';c.fillRect(33,108,510,10);c.fillRect(33,32,510,8);for(const x of [33,166,407,535])c.fillRect(x,32,7,84);texture.refresh();texture.setFilter(0);}
 for(const p of data.pieces){const a=MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset)!;
  const atlas=a.id.startsWith('icaro-')?'icaro-room-atlas':a.id.startsWith('helena-')?'helena-room-atlas':a.id.startsWith('damiao-')?'damiao-room-atlas':a.id.startsWith('celina-')?'celina-room-atlas':a.id.startsWith('nilo-')?'nilo-room-atlas':a.id.startsWith('tobias-')?'tobias-room-atlas':a.id.startsWith('amelia-')?'amelia-room-atlas':'rosa-room-atlas';
  if(a.frame&&a.crop){const t=scene.textures.get(atlas),r=a.crop;if(!t.has(a.frame))t.add(a.frame,0,r.x,r.y,r.width,r.height);t.setFilter(0);}
  const image=a.tile?scene.add.tileSprite(p.x,p.y,p.sx,p.sy,'merchant-room-'+a.id).setOrigin(0).setTileScale(96/1254):scene.add.image(p.x,p.y,a.id==='structure'?key:a.frame?atlas:'merchant-room-'+a.id,a.frame).setOrigin(a.ox,a.oy).setScale(p.sx,p.sy);
  add(image);sprites.set(p.id,image);image.setVisible(merchantPieceVisible(data,p.id)).setData('smithLayoutId',p.id);
  image.setDepth(a.id==='structure'?-1000:a.tile?-990:a.layer==='floor'?-900:a.layer==='wall'?-600:p.parent?(data.pieces.find(b=>b.id===p.parent)!.y)+.1:p.y);
 }
 const front=add(scene.add.graphics().setDepth(10000).setVisible(frame.visible));front.fillStyle(0x33251c).fillRect(24,350,233,14).fillRect(319,350,233,14);
 const stopEffects=animateMerchantProps(scene,data,sprites);
 let select:((id:string)=>void)|undefined,move:((id:string,x:number,y:number)=>void)|undefined;
 const click=(_p:unknown,o:Phaser.GameObjects.Image)=>{const id=o.getData('smithLayoutId');if(id)select?.(id);};
 const drag=(_pointer:unknown,o:Phaser.GameObjects.Image,x:number,y:number)=>{const id=o.getData('smithLayoutId'),p=data.pieces.find(p=>p.id===id);if(!p||!move)return;const dx=x-p.x,dy=y-p.y;const update=(id:string)=>{const piece=data.pieces.find(p=>p.id===id)!,sprite=sprites.get(id);sprite?.setPosition(piece.x+dx,piece.y+dy);for(const child of data.pieces)if(child.parent===id)update(child.id);};update(id);};
 const end=(_p:unknown,o:Phaser.GameObjects.Image)=>{const id=o.getData('smithLayoutId');if(id)move?.(id,o.x,o.y);};
 scene.input.on('gameobjectdown',click);scene.input.on('drag',drag);scene.input.on('dragend',end);
 return{objects:owned,editing(enabled,onSelect,onMove){select=enabled?onSelect:undefined;move=enabled?onMove:undefined;for(const image of sprites.values())if(enabled){image.setInteractive({pixelPerfect:false});scene.input.setDraggable(image);}else{image.disableInteractive();scene.input.setDraggable(image,false);}},destroy(){scene.input.off('gameobjectdown',click);scene.input.off('drag',drag);scene.input.off('dragend',end);stopEffects();for(const o of owned)o.destroy();}};
}
