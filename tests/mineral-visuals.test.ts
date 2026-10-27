import {describe,it,expect} from 'vitest';
import {markMinerals} from '../src/economy-visuals';
describe('mineral sprite identity',()=>{
 it('updates only the resource sprite, retaining its anchor and avoiding shadows or nearby decorations',()=>{
  function sprite(id?:string){const data=new Map<string,unknown>(id?[['resource-id',id]]:[]),s={x:400,y:500,texture:{key:'lake-rock-0'},calls:[] as string[],getData:(k:string)=>data.get(k),setData(k:string,v:unknown){data.set(k,v);return this;},setTexture(key:string,frame:string){this.calls.push('texture');this.texture={key:key+':'+frame};return this;},clearTint(){return this;},setOrigin(){return this;},setScale(){return this;},setDisplaySize(){return this;}};return s;}
  const decoration=sprite(),resource=sprite('metal-resource'),frames=new Set<string>(),scene={children:{list:[decoration,resource]},textures:{exists:()=>true,get:()=>({has:(key:string)=>frames.has(key),add:(key:string)=>frames.add(key),setFilter:()=>undefined})}};
  const nodes=[{id:'metal-resource',kind:'vein' as const,x:2,y:2,metal:'iron' as const}];
  markMinerals(scene as unknown as Parameters<typeof markMinerals>[0],nodes);
  expect(resource.texture.key).toBe('detailed-ore-atlas:iron');expect(decoration.calls).toHaveLength(0);expect(resource.x).toBe(400);expect(resource.y).toBe(500);
  markMinerals(scene as unknown as Parameters<typeof markMinerals>[0],nodes);expect(resource.calls).toHaveLength(1);
 });
});
