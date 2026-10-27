import {afterEach,describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/tobias/personagem.json';
import {preloadTobiasSprites,tobiasTexture,TOBIAS_WALK_FRAMES,tobiasSourceKey} from '../src/tobias-sprites';
import {CHARACTER_DIRECTIONS,characterFrame} from '../src/character-directions';
afterEach(()=>vi.unstubAllGlobals());
describe('Tobias walking and repaired south artwork',()=>{
 it('preserves all 56 supplied PNGs and keeps the repaired south as a separate source',()=>{
  const root='public/assets/visual/village/tobias/';expect(manifest.originalPngs).toHaveLength(56);
  for(const f of manifest.originalPngs){const data=readFileSync(root+f.file);expect(createHash('sha256').update(data).digest('hex')).toBe(f.sha256);expect(data.readUInt32BE(16)).toBe(f.width);expect(data.readUInt32BE(20)).toBe(f.height);}
  expect(createHash('sha256').update(readFileSync(root+manifest.southRepair.file)).digest('hex')).toBe(manifest.southRepair.sha256);expect(manifest.southRepair.frames).toHaveLength(7);
 });
 it('loads seven native directions plus the corrected frontal strip without decoding unused south originals',()=>{
  const files=new Map<string,string>();preloadTobiasSprites({load:{image:(key:string,path:string)=>files.set(key,path)}} as unknown as Phaser.Scene);expect(files.size).toBe(50);expect(files.has(tobiasSourceKey('down'))).toBe(false);
  for(const path of files.values())expect(()=>readFileSync('public/'+path)).not.toThrow();
 });
 it('uses one baseline/scale for the corrected gait, preserves other poses and releases only its temporary sources',()=>{
  const draw=vi.fn(),add=vi.fn(),remove=vi.fn(),context={imageSmoothingEnabled:true,drawImage:draw,getImageData:()=>({data:new Uint8ClampedArray(1792*256*4)}),putImageData:vi.fn()},canvas={width:0,height:0,getContext:()=>context};vi.stubGlobal('document',{createElement:()=>canvas});
  const scene={textures:{exists:()=>false,get:(key:string)=>({getSourceImage:()=>({width:key.endsWith(':0')?192:256,height:256})}),addCanvas:()=>({add,setFilter:vi.fn()}),remove}} as unknown as Phaser.Scene;
  expect(tobiasTexture(scene)).toBe('village-npc-tobias');expect(canvas).toMatchObject({width:1792,height:2048});expect(context.imageSmoothingEnabled).toBe(false);expect(draw).toHaveBeenCalledTimes(56);
  for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=TOBIAS_WALK_FRAMES;f++){
   const call=draw.mock.calls[row*7+f];if(d==='down'){expect(call).toHaveLength(9);expect(call[6]).toBe(manifest.southRepair.targetTop);expect(call[8]/call[4]).toBeCloseTo(manifest.southRepair.scale);}
   else{expect(call).toHaveLength(3);expect(call.slice(1)).toEqual([f*256+(f?0:32),row*256]);}
   expect(add.mock.calls[row*7+f]).toEqual([characterFrame(d,f,6),0,f*256,row*256,256,256]);
  }
  expect(remove).toHaveBeenCalledTimes(50);expect(remove).not.toHaveBeenCalledWith('village-npc-tobias');
 });
});
