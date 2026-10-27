import {afterEach,describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/amelia/personagem.json';
import {preloadAmeliaSprites,ameliaTexture,AMELIA_WALK_FRAMES,ameliaSourceKey} from '../src/amelia-sprites';
import {CHARACTER_DIRECTIONS,characterFrame} from '../src/character-directions';
import {VillageWalk} from '../src/systems/village-walk';
afterEach(()=>vi.unstubAllGlobals());
describe('Amelia walking and repaired south artwork',()=>{
 it('plays all eight supplied walk frames during movement and retains six-frame legacy cycles',()=>{
  for(const count of [6,8]){
   const walk=new VillageWalk([{x:25,y:3}],34,0,0,32,count),phases=new Set<number>();let p={x:80,y:112};
   for(let i=0;i<120;i++){const result=walk.step(.1,p,()=>false);p={x:result.x,y:result.y};if(result.moving)phases.add(result.phase);}
   expect([...phases].sort((a,b)=>a-b)).toEqual(Array.from({length:count},(_,i)=>i+1));
   expect(walk.step(.1,p,()=>false,()=>1,true).phase).toBe(0);
  }
 });
 it('preserves all 72 supplied PNGs and keeps the repaired south as a separate source',()=>{
  const root='public/assets/visual/village/amelia/';expect(manifest.originalPngs).toHaveLength(72);
  for(const f of manifest.originalPngs){const data=readFileSync(root+f.file);expect(createHash('sha256').update(data).digest('hex')).toBe(f.sha256);expect(data.readUInt32BE(16)).toBe(f.width);expect(data.readUInt32BE(20)).toBe(f.height);}
  expect(createHash('sha256').update(readFileSync(root+manifest.southRepair.file)).digest('hex')).toBe(manifest.southRepair.sha256);expect(manifest.southRepair.frames).toHaveLength(9);
 });
 it('loads seven native directions plus the corrected frontal strip without decoding unused south originals',()=>{
  const files=new Map<string,string>();preloadAmeliaSprites({textures:{exists:()=>false},load:{image:(key:string,path:string)=>files.set(key,path)}} as unknown as Phaser.Scene);expect(files.size).toBe(64);expect(files.has(ameliaSourceKey('down'))).toBe(false);
  for(const path of files.values())expect(()=>readFileSync('public/'+path)).not.toThrow();
  const reload=vi.fn();preloadAmeliaSprites({textures:{exists:()=>true},load:{image:reload}} as unknown as Phaser.Scene);expect(reload).not.toHaveBeenCalled();
 });
 it('uses one baseline/scale for the corrected gait, preserves other poses and releases only its temporary sources',()=>{
  const draw=vi.fn(),add=vi.fn(),remove=vi.fn(),context={imageSmoothingEnabled:true,drawImage:draw,getImageData:()=>({data:new Uint8ClampedArray(2304*256*4)}),putImageData:vi.fn()},canvas={width:0,height:0,getContext:()=>context};vi.stubGlobal('document',{createElement:()=>canvas});
  const scene={textures:{exists:()=>false,get:(key:string)=>({getSourceImage:()=>({width:key.endsWith(':0')?192:256,height:256})}),addCanvas:()=>({add,setFilter:vi.fn()}),remove}} as unknown as Phaser.Scene;
  expect(ameliaTexture(scene)).toBe('village-npc-amelia');expect(canvas).toMatchObject({width:2304,height:2048});expect(context.imageSmoothingEnabled).toBe(false);expect(draw).toHaveBeenCalledTimes(72);
  for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=AMELIA_WALK_FRAMES;f++){
   const call=draw.mock.calls[row*9+f];if(d==='down'){expect(call).toHaveLength(9);expect(call[6]).toBe(manifest.southRepair.targetTop);expect(call[8]/call[4]).toBeCloseTo(manifest.southRepair.scale);}
   else{expect(call).toHaveLength(3);expect(call.slice(1)).toEqual([f*256+(f?0:32),row*256]);}
   expect(add.mock.calls[row*9+f]).toEqual([characterFrame(d,f,8),0,f*256,row*256,256,256]);
  }
  expect(remove).toHaveBeenCalledTimes(64);expect(remove).not.toHaveBeenCalledWith('village-npc-amelia');
 });
});
