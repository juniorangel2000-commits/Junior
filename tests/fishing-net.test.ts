import {describe,it,expect} from 'vitest';
import {fishingNetMotion,NET_SURFACE_SIZE,netFitsWater} from '../src/data/fishing-net-motion';
import {FISHING_CAST_TIMING} from '../src/data/fishing-cast-motion';
describe('deployed cast net',()=>{
 it('opens continuously during travel and settles at a stable water footprint',()=>{const held=fishingNetMotion(0,0),air=fishingNetMotion(1,.5),land=fishingNetMotion(FISHING_CAST_TIMING.land,1);expect(held.width).toBeLessThan(air.width);expect(air.width).toBeLessThan(land.width);expect(land.width).toBe(NET_SURFACE_SIZE.width);expect(land.height).toBe(NET_SURFACE_SIZE.height);expect(land.rotation).toBe(0);expect(land.alpha).toBeLessThan(1);for(let n=0;n<200;n++){const m=fishingNetMotion(2+n*.1,1);expect(Math.abs(m.lift)).toBeLessThanOrEqual(.45);expect(Math.abs(m.rotation)).toBeLessThanOrEqual(.009);expect(m.width).toBe(land.width);}});
 it('rejects a landing with its rim across a bank even when its center is in water',()=>{const water=(x:number,y:number)=>x>0&&y>0;expect(water(10,20)).toBe(true);expect(netFitsWater(10,20,water)).toBe(false);expect(netFitsWater(40,40,water)).toBe(true);});
});
