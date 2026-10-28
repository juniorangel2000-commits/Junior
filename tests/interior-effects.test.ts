import {describe,it,expect} from 'vitest';
import {EventEmitter} from 'node:events';
import type Phaser from 'phaser';
import {animateMerchantProps} from '../src/merchant-effects';
import {animateSmithProps} from '../src/smith-effects';
import {createMerchantLayout,MERCHANT_ROOM_ASSETS,merchantPieceVisible} from '../src/data/merchant-rooms';
import {createSmithLayout,smithAsset} from '../src/systems/smith-layout';
import type {SmithLayout} from '../src/systems/smith-layout';
import type {ResidentId} from '../src/systems/merchant-visit';

class ObjectStub {
 active=true;visible=true;x=0;y=0;scaleX=1;scaleY=1;depth=0;alpha=1;
 texture={key:'test'};frame={name:'__BASE'};values=new Map<string,unknown>();commands:unknown[][]=[];
 mask?:{destroy:()=>void;destroyed:boolean};
 data={remove:(key:string)=>this.values.delete(key)};
 setData(key:string,value:unknown){this.values.set(key,value);return this;}getData(key:string){return this.values.get(key);}
 setOrigin(){return this;}setCrop(){return this;}setScale(x:number,y:number){this.scaleX=x;this.scaleY=y;return this;}
 setPosition(x:number,y:number){this.x=x;this.y=y;return this;}setDepth(n:number){this.depth=n;return this;}
 setVisible(v:boolean){this.visible=v;return this;}setAlpha(v:number){this.alpha=v;return this;}
 setMask(m:NonNullable<ObjectStub['mask']>){this.mask=m;return this;}
 createGeometryMask(){const m={destroyed:false,destroy(){this.destroyed=true;}};this.mask=m;return m;}
 clear(){this.commands=[];return this;}
 fillStyle(...a:unknown[]){this.commands.push(['fillStyle',...a]);return this;}
 lineStyle(...a:unknown[]){this.commands.push(['lineStyle',...a]);return this;}
 fillEllipse(...a:unknown[]){this.commands.push(['fillEllipse',...a]);return this;}
 strokeEllipse(...a:unknown[]){this.commands.push(['strokeEllipse',...a]);return this;}
 fillRect(...a:unknown[]){this.commands.push(['fillRect',...a]);return this;}
 lineBetween(...a:unknown[]){this.commands.push(['lineBetween',...a]);return this;}
 destroy(){this.active=false;}
}
function setup(layout:SmithLayout,smith=false){
 const events=new EventEmitter(),objects:ObjectStub[]=[];
 const add=()=>{const o=new ObjectStub();objects.push(o);return o;};
 const scene={events,add:{graphics:add,image:add},make:{graphics:add}} as unknown as Phaser.Scene;
 const originals=new Map(layout.pieces.map(p=>{const a=smith?smithAsset(p.asset):MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset);const o=new ObjectStub().setPosition(p.x,p.y).setScale(p.sx,p.sy).setDepth(p.y).setVisible(smith?p.visible:merchantPieceVisible(layout,p.id));o.texture.key=a?.id??p.asset;return [p.id,o] as const;}));
 const sprites=originals as unknown as Map<string,Phaser.GameObjects.Image>;
 return {events,objects,originals,scene,sprites};
}
describe('shared interior prop animation',()=>{
 it('animates visible lanterns in all nine merchant interiors and only suitable liquid/steam props',()=>{
  for(const id of ['augusto','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro'] as ResidentId[]){
   const layout=createMerchantLayout(id),s=setup(layout),stop=animateMerchantProps(s.scene,layout,s.sprites);
   const effects=s.objects.filter(o=>o.getData('interior-effect'));
   expect(effects.length,id).toBeGreaterThan(0);
   for(const e of effects){const p=layout.pieces.find(p=>p.id===e.getData('interior-effect-owner'))!;expect(p.asset).toMatch(/lantern|lamparina|amelia-water-basin|amelia-tea|damiao-basin/);expect(merchantPieceVisible(layout,p.id)).toBe(true);}
   expect(s.events.listenerCount('update')).toBe(1);stop();expect(s.objects.every(o=>!o.active)).toBe(true);expect(s.events.listenerCount('update')).toBe(0);
  }
 });
 it('changes the flame and lighting over time while preserving authored transforms and following editor movement',()=>{
  const layout=createMerchantLayout('tobias'),snapshot=structuredClone(layout),s=setup(layout),stop=animateMerchantProps(s.scene,layout,s.sprites);
  const p=layout.pieces.find(p=>p.asset==='tobias-lantern')!,sprite=s.originals.get(p.id)!,drawing=s.objects.find(o=>o.getData('interior-effect-owner')===p.id)!;
  const oldCommands=JSON.stringify(drawing.commands),oldStrength=(sprite.getData('fixture-light') as {strength:number}).strength;
  for(let i=0;i<12;i++)s.events.emit('update',0,40);
  expect(JSON.stringify(drawing.commands)).not.toBe(oldCommands);expect((sprite.getData('fixture-light') as {strength:number}).strength).not.toBe(oldStrength);
  expect(layout).toEqual(snapshot);expect([sprite.x,sprite.y,sprite.scaleX,sprite.scaleY]).toEqual([p.x,p.y,p.sx,p.sy]);
  const a=MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset)!,ellipse=drawing.mask!;
  expect(ellipse.destroyed).toBe(false);
  const source=sprite.getData('fixture-light') as {offsetX:number;offsetY:number};
  expect(source.offsetX+a.ox*a.w*p.sx).toBeGreaterThan(a.bounds[0]*p.sx);expect(source.offsetY+a.oy*a.h*p.sy).toBeLessThan(a.bounds[3]*p.sy);
  sprite.setPosition(p.x+31,p.y-17).setScale(p.sx*1.5,p.sy*1.5).setDepth(800);s.events.emit('update',0,40);
  expect(drawing.depth).toBe(800.04);expect(source.offsetX).toBeCloseTo((a.bounds[0]+(a.bounds[2]-a.bounds[0])*.55-a.ox*a.w)*sprite.scaleX);
  stop();expect(ellipse.destroyed).toBe(true);expect(sprite.getData('fixture-light')).toBeUndefined();stop();expect(s.events.listenerCount('shutdown')).toBe(0);
 });
 it('honors disabled effects and hidden parents, and stops light and drawing when hidden at runtime',()=>{
  const layout=createMerchantLayout('tobias');for(const p of layout.pieces)if(p.asset==='tobias-lantern')p.effects=false;
  const s=setup(layout),stop=animateMerchantProps(s.scene,layout,s.sprites);expect(s.objects).toHaveLength(0);expect(s.events.listenerCount('update')).toBe(0);stop();
  const room=createMerchantLayout('tobias'),lamp=room.pieces.find(p=>p.asset==='tobias-lantern')!;lamp.parent='tobias-counter';room.pieces.find(p=>p.id===lamp.parent)!.visible=false;
  const hidden=setup(room),end=animateMerchantProps(hidden.scene,room,hidden.sprites);expect(hidden.objects.some(o=>o.getData('interior-effect-owner')===lamp.id)).toBe(false);
  const other=room.pieces.find(p=>p.asset==='tobias-lantern'&&p.id!==lamp.id)!,sprite=hidden.originals.get(other.id)!,drawing=hidden.objects.find(o=>o.getData('interior-effect-owner')===other.id)!;
  sprite.visible=false;hidden.events.emit('update',0,40);expect(drawing.visible).toBe(false);expect((sprite.getData('fixture-light') as {strength:number}).strength).toBe(0);
  sprite.visible=true;hidden.events.emit('update',0,40);expect(drawing.visible).toBe(true);expect((sprite.getData('fixture-light') as {strength:number}).strength).toBeGreaterThan(0);end();
 });
 it('cleans up on scene shutdown and repeated redraws without leaving masks, lights or update listeners',()=>{
  for(let i=0;i<30;i++){
   const layout=createMerchantLayout('rosa'),s=setup(layout),lamp=layout.pieces.find(p=>p.asset==='rosa-lantern')!,sprite=s.originals.get(lamp.id)!,previous={radius:25};sprite.setData('fixture-light',previous);
   const stop=animateMerchantProps(s.scene,layout,s.sprites);s.events.emit('shutdown');stop();expect(s.events.listenerCount('update')).toBe(0);expect(s.events.listenerCount('shutdown')).toBe(0);expect(s.objects.every(o=>!o.active&&(!o.mask||o.mask.destroyed))).toBe(true);expect(sprite.getData('fixture-light')).toBe(previous);
  }
 });
 it('preserves the smith hearth, water ripples and lamps using the same engine',()=>{
  const room=createSmithLayout(),s=setup(room,true),stop=animateSmithProps(s.scene,room,s.sprites),effects=s.objects.filter(o=>o.getData('interior-effect'));
  expect(new Set(effects.map(o=>o.getData('interior-effect')))).toEqual(new Set(['lamp','hearth','water']));
  const water=effects.find(o=>o.getData('interior-effect')==='water')!,before=JSON.stringify(water.commands);s.events.emit('update',0,80);expect(JSON.stringify(water.commands)).not.toBe(before);stop();
 });
});
