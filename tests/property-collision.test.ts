import {describe,it,expect} from 'vitest';
import {propertyHouseSolidPoint,propertyHouseSolidTile} from '../src/data/property-collision';
import {HOMESTEAD_HOUSE} from '../src/data/property-homestead';
import {PROPERTY_WELL,WELL_BASE,wellSolidPoint,nearPropertyWell} from '../src/data/property-well';
import {HOME_OUTDOOR_DOORWAY,HOME_OUTDOOR_SPAWN} from '../src/systems/home';
import {DoorwayPassage} from '../src/systems/map-transition';
import {freeArrival} from '../src/systems/actor-arrival';
const h=HOMESTEAD_HOUSE,ground={x:h.x,y:h.groundY};
describe('expanded property architecture collision',()=>{
 it('protects the facade, sides and rear that previously allowed sprite overlap',()=>{
  for(const[dx,dy]of[[80,-60],[-80,-60],[0,-125],[-45,3],[45,3]])expect(propertyHouseSolidPoint(ground.x+dx,ground.y+dy)).toBe(true);
  expect(propertyHouseSolidPoint(ground.x+96,ground.y-60)).toBe(false);expect(propertyHouseSolidPoint(ground.x,ground.y-145)).toBe(false);
  expect(propertyHouseSolidTile(23,16)).toBe(true);expect(propertyHouseSolidTile(24,16)).toBe(false);
 });
 it('leaves a complete foot-box passage at the door, including automatic entry and the outdoor spawn',()=>{
  const d=HOME_OUTDOOR_DOORWAY;
  for(const x of [d.x-17,d.x,d.x+17])for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(propertyHouseSolidPoint(x+dx,d.y-1+dy)).toBe(false);
  expect(new DoorwayPassage().update({x:d.x,y:d.y+2},{x:d.x,y:d.y-1},d)).toBe(true);
  expect(freeArrival(HOME_OUTDOOR_SPAWN,propertyHouseSolidPoint,[])).toEqual(HOME_OUTDOOR_SPAWN);
 });
 it('adds a world-sized safety margin around the well stonework and posts without preventing water collection',()=>{
  expect(wellSolidPoint(PROPERTY_WELL.x+34,WELL_BASE.y)).toBe(true);
  expect(wellSolidPoint(PROPERTY_WELL.x,WELL_BASE.y+18)).toBe(true);
  expect(wellSolidPoint(PROPERTY_WELL.x,PROPERTY_WELL.y-85)).toBe(false);
  expect(nearPropertyWell(WELL_BASE.x,WELL_BASE.y+36)).toBe(true);
 });
 it('can recover old save positions caught by either expanded obstacle to nearby free ground',()=>{
  const blocked=(x:number,y:number)=>propertyHouseSolidPoint(x,y)||wellSolidPoint(x,y);
  for(const point of [{x:ground.x+80,y:ground.y-50},{x:ground.x+45,y:ground.y-20},{x:WELL_BASE.x,y:WELL_BASE.y+21}]){
   const free=freeArrival(point,blocked,[]);expect(free).not.toBeNull();expect(free).not.toEqual(point);
   for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(blocked(free!.x+dx,free!.y+dy)).toBe(false);
  }
 });
});
