import {describe,it,expect} from 'vitest';
import {cabinPoint,cabinAllowsStep,CABIN_FISHER_EXIT} from '../src/data/fisher-cabin';
import {lakeDeckAllowsStep,LAKE_PIER_PROPS,lakePier,lakeStructureBlockedPoint,lakeShoreCoverage} from '../src/data/fishing-lake';
describe('raised lake platform boundaries',()=>{
 it('only crosses the porch boundary at the foot of the staircase',()=>{
  for(const[x,y,dx,dy]of[[158,690,-20,0],[835,879,0,20],[1310,718,25,0],[650,980,20,0]]){const from=cabinPoint(x,y),to=cabinPoint(x+dx,y+dy);expect(cabinAllowsStep(from,to)).toBe(false);expect(cabinAllowsStep(to,from)).toBe(false);}
 });
 it('preserves the complete legitimate walk down the porch staircase',()=>{for(let i=1;i<CABIN_FISHER_EXIT.length;i++){const a=CABIN_FISHER_EXIT[i-1],b=CABIN_FISHER_EXIT[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2);for(let j=0;j<steps;j++){const from={x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},to={x:a.x+(b.x-a.x)*(j+1)/steps,y:a.y+(b.y-a.y)*(j+1)/steps};expect(cabinAllowsStep(from,to)).toBe(true);expect(cabinAllowsStep(to,from)).toBe(true);}}});
 it.each([[70,45.7,70,45.9],[70,47.2,70,47.4],[62.5,46,62.7,46],[65,43.6,65,43.8],[31,59.3,31,59.5],[31,61,31,61.2]])('blocks lateral entry and exit: %s,%s to %s,%s',(ax,ay,bx,by)=>{const a={x:ax*32,y:ay*32},b={x:bx*32,y:by*32};expect(lakeDeckAllowsStep(a,b)).toBe(false);expect(lakeDeckAllowsStep(b,a)).toBe(false);});
 it.each([[79.4,46.5,79.6,46.5],[27.4,60,27.6,60],[35.4,60,35.6,60]])('keeps the actual land entrances open: %s,%s to %s,%s',(ax,ay,bx,by)=>{const a={x:ax*32,y:ay*32},b={x:bx*32,y:by*32};expect(lakeDeckAllowsStep(a,b)).toBe(true);expect(lakeDeckAllowsStep(b,a)).toBe(true);});
 it('moves the equipment into the wider head of the pier and gives it collision',()=>{for(const p of LAKE_PIER_PROPS){expect(p.x).toBeLessThan(66.6);expect(lakePier(p.x,p.y)).toBe(true);expect(lakeStructureBlockedPoint(p.x,p.y)).toBe(true);}expect(lakeStructureBlockedPoint(79.5,44)).toBe(false);});
 it('feathers the shoreline over individual pixels rather than four-pixel blocks',()=>{const values=[-1,-.5,0,.5,1].map(px=>lakeShoreCoverage(px/32));expect(values[0]).toBe(1);expect(values[4]).toBe(0);expect(values[1]).toBeGreaterThan(values[2]);expect(values[2]).toBeGreaterThan(values[3]);});
});
