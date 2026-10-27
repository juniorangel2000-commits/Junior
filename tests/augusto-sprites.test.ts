import {afterEach,describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type Phaser from 'phaser';
import {preloadAugustoSprites,augustoTexture,augustoSourceKey,AUGUSTO_FRAME_SIZE,AUGUSTO_WALK_FRAMES} from '../src/augusto-sprites';
import {CHARACTER_DIRECTIONS,characterFrame} from '../src/character-directions';

afterEach(()=>vi.unstubAllGlobals());
describe('Augusto supplied sprite set',()=>{
 it('retains every uploaded PNG byte and the native idle/walking resolutions',()=>{
  const root='public/assets/visual/village/augusto',m=JSON.parse(readFileSync(root+'/manifest.json','utf8'));
  expect(m.originalPngs).toHaveLength(56);
  for(const f of m.originalPngs){const data=readFileSync(root+'/'+f.file);expect(createHash('sha256').update(data).digest('hex')).toBe(f.sha256);expect(data.readUInt32BE(16)).toBe(f.width);expect(data.readUInt32BE(20)).toBe(f.height);}
  expect(new Set(m.originalPngs.map((f:{width:number})=>f.width))).toEqual(new Set([112,160]));
 });
 it('loads eight original rotations and six correctly named Walk frames for each direction',()=>{
  const files=new Map<string,string>();preloadAugustoSprites({load:{image:(key:string,path:string)=>files.set(key,path)}} as unknown as Phaser.Scene);
  expect(files.size).toBe(56);for(const dir of CHARACTER_DIRECTIONS){expect(files.get(augustoSourceKey(dir))).toMatch(/rotations\/.+\.png$/);for(let f=1;f<=6;f++){const path=files.get(augustoSourceKey(dir,f))!;expect(path).toContain('/animations/Walk/');expect(()=>readFileSync('public/'+path)).not.toThrow();}}
 });
 it('translates idle padding only, preserving native pixels and every authored walking offset',()=>{
  const draw=vi.fn(),add=vi.fn(),filter=vi.fn(),context={imageSmoothingEnabled:true,drawImage:draw},canvas={width:0,height:0,getContext:()=>context};vi.stubGlobal('document',{createElement:()=>canvas});
  const texture={add,setFilter:filter};const scene={textures:{exists:()=>false,get:(key:string)=>({getSourceImage:()=>({width:key.endsWith(':0')?112:160,height:key.endsWith(':0')?112:160})}),addCanvas:()=>texture}} as unknown as Phaser.Scene;
  expect(augustoTexture(scene)).toBe('village-npc-augusto');expect(canvas).toMatchObject({width:1120,height:1280});expect(context.imageSmoothingEnabled).toBe(false);expect(draw).toHaveBeenCalledTimes(56);
  for(let row=0;row<8;row++)for(let frame=0;frame<7;frame++){const call=draw.mock.calls[row*7+frame];expect(call).toHaveLength(3);expect(call.slice(1)).toEqual([frame*160+(frame?0:24),row*160+(frame?0:24)]);expect(add.mock.calls[row*7+frame]).toEqual([characterFrame(CHARACTER_DIRECTIONS[row],frame,AUGUSTO_WALK_FRAMES),0,frame*160,row*160,AUGUSTO_FRAME_SIZE,AUGUSTO_FRAME_SIZE]);}
  expect(filter).toHaveBeenCalledWith(0);
 });
});
