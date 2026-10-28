import {VILLAGE_GARDENS,VILLAGE_GROVES,villagePathEdge,villagePlazaDistance,villageLawnDistance} from './village';
import {WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import {villageLandmarkClearing} from './village-landmarks';

export const villageSmooth=(n:number):number=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export const VILLAGE_GROUND_MATERIALS=8;
/** Grass, forest, meadow, dirt, stone, soil, earth shoulder and stone curb. Shared by the
 * renderer and layout checks; no random changes occur when revisiting town. */
export function villageGroundWeights(x:number,y:number):readonly number[]{
 const edge=Math.min(x+.5,y+.5,WORLD_WIDTH-.5-x,WORLD_HEIGHT-.5-y);
 let woodland=(1-villageSmooth((edge-2.5-Math.sin(x*.27+y*.13)*1.2)/8.5))*.82;
 for(const grove of VILLAGE_GROVES){const d=Math.hypot((x-grove.x)/grove.rx,(y-grove.y)/grove.ry);woodland=Math.max(woodland,(1-villageSmooth((d-.3)/.9))*.44);}
 if(villageLandmarkClearing(x,y,48))woodland*=.15;
 // One continuous dirt network and one stone square. No disconnected aprons,
 // dirt leaking through the plaza, or road material crossing its garden islands.
 const pathDistance=villagePathEdge(x,y),plazaDistance=villagePlazaDistance(x,y);
 let path=1-villageSmooth((pathDistance+.08)/.42);
 const lawn=1-villageSmooth((villageLawnDistance(x,y)-.7)/.48);
 const plaza=1-villageSmooth((plazaDistance-.985)/.025);
 const paving=plaza*(1-lawn);
 path*=1-plaza;
 let soil=0;
 for(const garden of VILLAGE_GARDENS){const d=Math.hypot((x-garden.x)/garden.rx,(y-garden.y)/garden.ry);soil=Math.max(soil,(1-villageSmooth((d-.72)/.32))*(garden.kind==='flowers'?.2:.85));}
 path*=1-paving;soil*=1-paving-path;
 const rest=1-paving-path-soil,forest=rest*woodland;
 const meadow=(rest-forest)*(.10+.10*Math.sin(x*.31+y*.13)*Math.cos(y*.27-x*.11));
 // Narrow, continuous finishes make the materials readable without adding
 // obstacles or changing the width available to actors. Authored terrain is
 // still applied over every material by the renderer.
 const curb=villageSmooth((plazaDistance-.985)/.01)*(1-villageSmooth((plazaDistance-1.012)/.015));
 const shoulder=villageSmooth((pathDistance+.15)/.22)*(1-villageSmooth((pathDistance-.2)/.3))*.8*(1-plaza)*(1-curb);
 const base=1-curb-shoulder;
 return [(rest-forest-meadow)*base,forest*base,meadow*base,path*base,paving*base,soil*base,shoulder,curb];
}
