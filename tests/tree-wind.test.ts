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
 it('keeps the map editor still and allows a restarted game scene to register again',()=>{
  const events=new EventEmitter(),scene={sys:{settings:{key:'Editor'}},events} as unknown as Phaser.Scene;setupTreeWind(scene);expect(events.listenerCount('update')).toBe(0);
  scene.sys.settings.key='Vale';setupTreeWind(scene);events.emit('shutdown');setupTreeWind(scene);expect(events.listenerCount('update')).toBe(1);events.emit('shutdown');
 });
});
