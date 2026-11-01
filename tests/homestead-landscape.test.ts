import {it,expect} from 'vitest';
import {homesteadPetPath,mountainSolid,mountainFits,mountainLayout,onHomesteadPetPath} from '../src/data/homestead-landscape';
import {propertyHouseSolidPoint} from '../src/data/property-collision';
import {shelterSolid} from '../src/systems/pet-shelter';
it('curves a connected walkable path around the house to each supported shelter site',()=>{
 for(const site of [{x:960,y:352},{x:896,y:288},{x:1056,y:352},{x:896,y:224}]){
  const path=homesteadPetPath(site);
  expect(path).toHaveLength(65);expect(path.at(-1)).toEqual({x:site.x,y:site.y+18});
  for(const [i,p] of path.entries()){
   expect(propertyHouseSolidPoint(p.x,p.y)).toBe(false);expect(shelterSolid(site,p.x,p.y)).toBe(false);expect(mountainSolid(site,p.x,p.y)).toBe(false);
   if(i)expect(Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y)).toBeLessThan(16);
   expect(onHomesteadPetPath(site,p.x,p.y)).toBe(true);
  }
 }
});
it('keeps the mountain behind the shelter and protects existing construction or prepared tiles',()=>{
 const site={x:960,y:352},plan=mountainLayout(site);
 expect(plan.baseY).toBeLessThan(site.y-50);expect(mountainSolid(site,plan.x,plan.baseY-50)).toBe(true);
 expect(mountainSolid(site,site.x,site.y)).toBe(false);expect(mountainSolid(site,plan.x+plan.width/2+64,100)).toBe(false);
 expect(mountainFits(site,[])).toBe(true);expect(mountainFits(site,[{kind:'workbench',x:26,y:5}])).toBe(false);
 expect(mountainFits(site,[],[{x:26,y:5}])).toBe(false);
});
