import {VILLAGE_BUILDINGS,VILLAGE_GARDENS,VILLAGE_GROVES,villagePathEdge,villagePlazaDistance,villageLawnDistance} from './village';
import {WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import {VILLAGE_LANDMARKS,villageLandmarkClearing} from './village-landmarks';

export const villageSmooth=(n:number):number=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
/** Grass, forest floor, meadow, dirt, cobbles and garden soil. Shared by the
 * renderer and layout checks; no random changes occur when revisiting town. */
export function villageGroundWeights(x:number,y:number):readonly number[]{
 const edge=Math.min(x+.5,y+.5,WORLD_WIDTH-.5-x,WORLD_HEIGHT-.5-y);
 let woodland=(1-villageSmooth((edge-2.5-Math.sin(x*.27+y*.13)*1.2)/8.5))*.82;
 for(const grove of VILLAGE_GROVES){const d=Math.hypot((x-grove.x)/grove.rx,(y-grove.y)/grove.ry);woodland=Math.max(woodland,(1-villageSmooth((d-.3)/.9))*.44);}
 if(villageLandmarkClearing(x,y,48))woodland*=.15;
 const rough=Math.sin(x*2.2+y*.7)*.07+Math.cos(y*1.6-x*.3)*.05;
 let path=1-villageSmooth((villagePathEdge(x,y)+.28+rough)/.85);
 const lawn=1-villageSmooth((villageLawnDistance(x,y)-.7)/.48);
 let paving=(1-villageSmooth((villagePlazaDistance(x,y)-.86+rough*.04)/.18))*(1-lawn);
 for(const building of VILLAGE_BUILDINGS){
  if(y<building.y-.1||y>building.y+5.5)continue;
  const front=1-villageSmooth((Math.hypot((x-building.x)/3.8,(y-building.y-2)/2.6)-.48)/.65);
  if(building.shop==='blacksmith'||building.shop==='mechanic'||building.shop==='inn')paving=Math.max(paving,front*.88);
  else path=Math.max(path,front*.88);
 }
 for(const building of VILLAGE_LANDMARKS){
  if(!['community','cottage','granary','gazebo','windmill'].includes(building.kind))continue;
  const apron=1-villageSmooth((Math.hypot((x-building.x)/3.5,(y-building.y-1)/1.7)-.5)/.6);
  if(building.kind==='community'||building.kind==='gazebo')paving=Math.max(paving,apron*.9);
  else path=Math.max(path,apron*.85);
 }
 let soil=0;
 for(const garden of VILLAGE_GARDENS){const d=Math.hypot((x-garden.x)/garden.rx,(y-garden.y)/garden.ry);soil=Math.max(soil,(1-villageSmooth((d-.72)/.32))*(garden.kind==='flowers'?.2:.85));}
 path*=1-paving;soil*=1-paving-path;
 const rest=1-paving-path-soil,forest=rest*woodland;
 const meadow=(rest-forest)*(.10+.10*Math.sin(x*.31+y*.13)*Math.cos(y*.27-x*.11));
 return [rest-forest-meadow,forest,meadow,path,paving,soil];
}
