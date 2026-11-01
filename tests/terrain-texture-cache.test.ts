import { expect, it } from 'vitest';
import { reusableTerrainTexture } from '../src/terrain-texture-cache';
it('reuses equal terrain, invalidates in-place edits and rebuilds missing textures',()=>{
 const keys=new Set<string>();let removed=0;
 const textures={exists:(key:string)=>keys.has(key),remove:(key:string)=>{keys.delete(key);removed++;}};
 const terrain:Record<string,string>={};
 expect(reusableTerrainTexture(textures,'village',terrain)).toBe(false);keys.add('village');
 expect(reusableTerrainTexture(textures,'village',{})).toBe(true);expect(removed).toBe(0);
 terrain['1,1']='water';expect(reusableTerrainTexture(textures,'village',terrain)).toBe(false);expect(removed).toBe(1);keys.add('village');
 expect(reusableTerrainTexture(textures,'village',structuredClone(terrain))).toBe(true);
 keys.delete('village');expect(reusableTerrainTexture(textures,'village',terrain)).toBe(false);
});
it('isolates maps and texture managers',()=>{
 const keys=new Set<string>();const store=()=>({exists:(k:string)=>keys.has(k),remove:(k:string)=>keys.delete(k)});
 const a=store(),b=store();expect(reusableTerrainTexture(a,'ground',undefined)).toBe(false);keys.add('ground');
 expect(reusableTerrainTexture(a,'ground',undefined)).toBe(true);expect(reusableTerrainTexture(b,'ground',undefined)).toBe(false);
 expect(reusableTerrainTexture(a,'lake',undefined)).toBe(false);
});
