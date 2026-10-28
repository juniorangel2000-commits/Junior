import {VILLAGE_GARDENS,VILLAGE_GROVES,villagePathEdge,villagePlazaDistance,villageLawnDistance} from './village';
import {WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import {villageLandmarkClearing} from './village-landmarks';

export const villageSmooth=(n:number):number=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
/** Grass, forest floor, meadow, dirt, cobbles and garden soil. Shared by the
 * renderer and layout checks; no random changes occur when revisiting town. */
export function villageGroundWeights(x:number,y:number):readonly number[]{
 const edge=Math.min(x+.5,y+.5,WORLD_WIDTH-.5-x,WORLD_HEIGHT-.5-y);
 let woodland=(1-villageSmooth((edge-2.5-Math.sin(x*.27+y*.13)*1.2)/8.5))*.82;
 for(const grove of VILLAGE_GROVES){const d=Math.hypot((x-grove.x)/grove.rx,(y-grove.y)/grove.ry);woodland=Math.max(woodland,(1-villageSmooth((d-.3)/.9))*.44);}
 if(villageLandmarkClearing(x,y,48))woodland*=.15;
 // One continuous dirt network and one stone square. No disconnected aprons,
 // dirt leaking through the plaza, or road material crossing its garden islands.
 let path=1-villageSmooth((villagePathEdge(x,y)+.08)/.42);
 const lawn=1-villageSmooth((villageLawnDistance(x,y)-.7)/.48);
 const plaza=1-villageSmooth((villagePlazaDistance(x,y)-.91)/.12);
 const paving=plaza*(1-lawn);
 path*=1-plaza;
 let soil=0;
 for(const garden of VILLAGE_GARDENS){const d=Math.hypot((x-garden.x)/garden.rx,(y-garden.y)/garden.ry);soil=Math.max(soil,(1-villageSmooth((d-.72)/.32))*(garden.kind==='flowers'?.2:.85));}
 path*=1-paving;soil*=1-paving-path;
 const rest=1-paving-path-soil,forest=rest*woodland;
 const meadow=(rest-forest)*(.10+.10*Math.sin(x*.31+y*.13)*Math.cos(y*.27-x*.11));
 return [rest-forest-meadow,forest,meadow,path,paving,soil];
}
