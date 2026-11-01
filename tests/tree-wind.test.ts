import {describe,it,expect} from 'vitest';
import {EventEmitter} from 'node:events';
import type Phaser from 'phaser';
import {setupTreeWind} from '../src/tree-wind';
const tree=(key:string)=>({texture:{key},active:true,visible:true,x:100,y:200,rotation:.02,scaleX:.7,scaleY:.7,setRotation(n:number){this.rotation=n;return this;}});
describe('adult tree wind',()=>{
 it('sways only adults, preserves roots/transforms, restores hidden trees and disposes a single scene callback',()=>{
  const adult=tree('asset-tree-0'),young=tree('ecology-oak-young'),events=new EventEmitter(),scene={sys:{settings:{key:'Vale'}},children:{list:[adult,young]},events,cameras:{main:{worldView:{x:0,y:0,right:500,bottom:500}}}} as unknown as Phaser.Scene;
  setupTreeWind(scene);setupTreeWind(scene);expect(events.listenerCount('update')).toBe(1);for(let i=0;i<40;i++)events.emit('update',i*50,50);
  expect(adult.rotation).not.toBe(.02);expect(Math.abs(adult.rotation-.02)).toBeLessThanOrEqual(.006);expect([adult.x,adult.y,adult.scaleX,adult.scaleY]).toEqual([100,200,.7,.7]);expect(young.rotation).toBe(.02);
  adult.visible=false;events.emit('update',3000,50);expect(adult.rotation).toBe(.02);adult.visible=true;events.emit('update',3050,50);events.emit('shutdown');expect(adult.rotation).toBe(.02);expect(events.listenerCount('update')).toBe(0);
 });
 it.each(['Vale','Vila','Floresta','AcessoCidade','Lago','Dungeons'])('animates new trees and culls distant trees in %s',key=>{
  const events=new EventEmitter(),adult=tree('asset-pine-2');adult.x=1000;
  const list=[adult],scene={sys:{settings:{key}},children:{list},events,cameras:{main:{worldView:{x:0,y:0,right:500,bottom:500}}}} as unknown as Phaser.Scene;
  setupTreeWind(scene);events.emit('update',50,50);expect(adult.rotation).toBe(.02);
  adult.x=150;events.emit('update',100,50);expect(adult.rotation).not.toBe(.02);
  const added=tree('asset-tree-1');list.push(added);
  for(let i=0;i<12;i++)events.emit('update',150+i*50,50);
  expect(added.rotation).not.toBe(.02);adult.active=false;events.emit('update',900,50);
  events.emit('shutdown');expect(added.rotation).toBe(.02);expect(events.listenerCount('update')).toBe(0);
 });
 it('keeps the map editor still and allows a restarted game scene to register again',()=>{
  const events=new EventEmitter(),scene={sys:{settings:{key:'Editor'}},events} as unknown as Phaser.Scene;setupTreeWind(scene);expect(events.listenerCount('update')).toBe(0);
  scene.sys.settings.key='Vale';setupTreeWind(scene);events.emit('shutdown');setupTreeWind(scene);expect(events.listenerCount('update')).toBe(1);events.emit('shutdown');
 });
});
