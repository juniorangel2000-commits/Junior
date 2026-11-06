import {inventoryToolCondition,wearInventoryTool} from './tool-instances';
import {FISHING_HABITATS,rollFishingReward,fishingRewardItems,validFishingReward,type FishingReward} from '../data/fishing-catches';
import {BAITS,FISH_HABITS,rodControlBonus,speciesWeight,recordFishingReward,type BaitStyle} from './fishing-progress';
import type {SaveData} from '../types';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
export type FishingPhase='waiting'|'bite'|'fighting'|'caught'|'escaped'|'cancelled';
export const FISHING_RULES={waitMin:10,waitMax:20,hookSeconds:3,maxFightSeconds:45,vigorCost:3} as const;
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
export class FishingSession {
 phase:FishingPhase='waiting';
 readonly reward:FishingReward;
 escapeReason?:'late-hook'|'lost-fish'|'timeout';
 readonly waitSeconds:number;
 readonly rare:boolean;
 readonly bandSize:number;
 fish=.5;band=.5;velocity=0;progress=.28;
 elapsed=0;fightSeconds=0;biteRemaining:number=FISHING_RULES.hookSeconds;
 private target=.5;
 private turn=0;
 private swimAge=0;
 constructor(readonly skill:number,readonly net=false,accessory=false,private random:()=>number=Math.random,habitat:keyof typeof FISHING_HABITATS='lake',readonly equipment:{rodTier?:number;bait?:BaitStyle;time?:number;day?:number}={}){
  this.waitSeconds=FISHING_RULES.waitMin+clamp(random())*(FISHING_RULES.waitMax-FISHING_RULES.waitMin);
  const chance=clamp(random()),rules=FISHING_HABITATS[habitat],rare=rules.rare&&chance<.04+clamp(skill,0,2)*.04+(accessory?.03:0);
  this.reward=rollFishingReward(rare,net,random,rules.trash,id=>speciesWeight(id,equipment.time??720,equipment.day??1,equipment.bait??'worm'));this.rare=this.reward.kind==='fish'&&rare;
  this.bandSize=.28+(clamp(skill,1,2)-1)*.08+(net?.05:0)+rodControlBonus(equipment.rodTier??0,net);
 }
 hook():boolean{if(this.phase!=='bite')return false;this.phase='fighting';return true;}
 cancel():void{if(this.phase!=='caught'&&this.phase!=='escaped')this.phase='cancelled';}
 step(seconds:number,held=false):void{
  if(!Number.isFinite(seconds)||seconds<=0)return;
  if(this.phase==='waiting'||this.phase==='bite'){
   this.elapsed+=seconds;
   if(this.elapsed>=this.waitSeconds){this.phase='bite';this.biteRemaining=Math.max(0,FISHING_RULES.hookSeconds-(this.elapsed-this.waitSeconds));if(!this.biteRemaining){this.phase='escaped';this.escapeReason='late-hook';}}
   return;
  }
  if(this.phase!=='fighting')return;
  let remaining=Math.min(seconds,1);
  while(remaining>1e-8&&this.phase==='fighting'){
   const dt=Math.min(remaining,1/120);remaining-=dt;this.fightSeconds+=dt;this.swimAge+=dt;this.turn-=dt;
   const habit=FISH_HABITS[this.reward.kind==='fish'?this.reward.specimens[0].species:'tilapia'];
   if(this.turn<=0){this.target=.08+clamp(this.random())*.84;this.turn=habit.turn+clamp(this.random())*habit.turn;}
   const movement=this.reward.kind==='trash'?Math.sin(this.swimAge*1.3)*.008:(this.target-this.fish)*habit.speed+Math.sin(this.swimAge*habit.frequency)*habit.sway;
   this.fish=clamp(this.fish+clamp(movement,-.5,.5)*dt,.045,.955);
   this.velocity=clamp((this.velocity+(held?2.1:-1.65)*dt)*Math.exp(-1.6*dt),-.72,.72);
   this.band+=this.velocity*dt;const half=this.bandSize/2;
   if(this.band<half){this.band=half;this.velocity=Math.max(0,-this.velocity*.12);}
   if(this.band>1-half){this.band=1-half;this.velocity=Math.min(0,-this.velocity*.12);}
   const inside=Math.abs(this.fish-this.band)<=half;
   this.progress=clamp(this.progress+dt*(inside?(this.rare?.115:.16)*(this.net?1.1:1):-.085));
   if(this.progress>=1)this.phase='caught';else if(this.progress<=0){this.phase='escaped';this.escapeReason='lost-fish';}else if(this.fightSeconds>=FISHING_RULES.maxFightSeconds){this.phase='escaped';this.escapeReason='timeout';}
  }
 }
}
type Writer=(draft:SaveData)=>boolean;
const persist=(draft:SaveData,write:Writer):boolean=>{try{return write(draft);}catch{return false;}};
export function beginFishingCast(save:SaveData,net:boolean,rare:boolean|FishingReward,write:Writer):{ok:boolean;message:string}{
 if(!save.villageProgress?.fishingSkill)return{ok:false,message:'Aprenda a pescar com Damião na cabana do lago ou na vila.'};
 if(typeof rare!=='boolean'&&(!validFishingReward(rare)||(rare.kind==='fish'?rare.specimens.length:rare.quantity)!==(net?2:1)))return{ok:false,message:'Captura inválida.'};
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory),baitCost=BAITS[draft.fishingProgress?.bait??'worm'].cost;
 if(!inventory.has(net?'net':'fishingRod')||!inventory.has('bait',baitCost))return{ok:false,message:`Você precisa do equipamento e de ${baitCost} ${baitCost===1?'isca':'iscas'} para este preparo.`};
 if(inventoryToolCondition(inventory.data,net?'net':'fishingRod').durability<=0)return{ok:false,message:'Este equipamento está sem durabilidade. Leve-o para reparar.'};
 const capacity=new Inventory(draft.inventory);
 if(!capacity.transact({bait:baitCost},typeof rare==='boolean'?{[rare?'rareFish':'fish']:net?2:1}:fishingRewardItems(rare)))return{ok:false,message:'Libere espaço na mochila para a captura antes de lançar a linha.'};
 inventory.spend({bait:baitCost});wearInventoryTool(inventory.data,net?'net':'fishingRod');draft.inventory={...inventory.data};
 const p=draft.villageProgress??=createVillageProgress();p.vigor=Math.max(0,p.vigor-FISHING_RULES.vigorCost);
 if(!persist(draft,write))return{ok:false,message:'Não foi possível salvar o lançamento. A isca e o vigor foram preservados.'};
 save.inventory=draft.inventory;save.villageProgress=draft.villageProgress;save.fishingProgress=draft.fishingProgress;return{ok:true,message:''};
}
export function collectFishingCatch(save:SaveData,net:boolean,rare:boolean|FishingReward,write:Writer):{ok:boolean;message:string}{
 const amount=net?2:1;
 if(typeof rare!=='boolean'&&(!validFishingReward(rare)||(rare.kind==='fish'?rare.specimens.length:rare.quantity)!==amount))return{ok:false,message:'Captura inválida.'};
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory);
 if(!inventory.transact({},typeof rare==='boolean'?{[rare?'rareFish':'fish']:amount}:fishingRewardItems(rare)))return{ok:false,message:'Sem espaço para guardar a captura. Libere espaço antes de tentar novamente.'};
 if(typeof rare!=='boolean')recordFishingReward(draft,rare);
 draft.inventory={...inventory.data};if(typeof rare!=='boolean')draft.lastFishingHaul={day:save.day,reward:structuredClone(rare)};if(!persist(draft,write))return{ok:false,message:'Não foi possível salvar a captura. Tente guardá-la novamente.'};
 save.inventory=draft.inventory;if(typeof rare!=='boolean'){save.lastFishingHaul=draft.lastFishingHaul;save.fishingProgress=draft.fishingProgress;}
 if(typeof rare!=='boolean')return{ok:true,message:rare.kind==='trash'?'Material recolhido e guardado na mochila.':net?'Você capturou 2 peixes!':'Peixe capturado!'};
 return{ok:true,message:rare?(net?'Você capturou 2 peixes raros!':'Você capturou um peixe raro!'):(net?'Você capturou 2 peixes!':'Peixe capturado!')};
}
