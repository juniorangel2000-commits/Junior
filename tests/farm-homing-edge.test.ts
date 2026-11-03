import {expect,it} from 'vitest';
import {AnimalBrain} from '../src/systems/animals';
import {farmSiteBlocked,farmAnimalSettled,farmYard,farmAnchor,farmHomePoint,type FarmSite} from '../src/systems/farm-construction';
import {FOREST_ANIMALS} from '../src/data/ancient-forest';
it('keeps each assigned species physically inside its yard through long idle walks',()=>{
 for(const [kind,animal]of[['coop','chicken'],['barn','cow']]as const){const s:FarmSite={kind,id:1,x:22,y:28,delivered:{},finished:true,animals:[],hay:0,gateOpen:true},p=farmAnchor(s);let a:AnimalBrain;a=new AnimalBrain(FOREST_ANIMALS.find(a=>a.kind===animal)!.id,animal,p.x,p.y+32,false,(x,y)=>farmSiteBlocked(s,x,y)||farmAnimalSettled(s,a,a.radius)&&!farmYard(s,x,y));let arrived=false;
 for(let i=0;i<2000;i++){const settled=farmAnimalSettled(s,a,a.radius);a.update(.05,settled?{x:100,y:100}:farmHomePoint(s),[a],!settled,2,false);if(settled)arrived=true;if(arrived&&i>500)expect(farmAnimalSettled(s,a,a.radius),JSON.stringify({kind,i,x:a.x,y:a.y})).toBe(true);}
 expect(arrived).toBe(true);
 }
});
