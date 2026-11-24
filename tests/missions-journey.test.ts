import {describe,expect,it} from 'vitest';
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {CHAPTERS,FINAL_CHAPTER,missionKey} from '../src/data/missions';
import {trackMissions} from '../src/systems/missions';
import {missionContext,newMissionLog} from '../src/systems/mission-checks';
import {SOCIAL_NPCS} from '../src/data/npc-social';
import {DISH_IDS} from '../src/data/kitchen';
import {PROJECTS} from '../src/data/projects';
import {MINE_MISSION_IDS} from '../src/data/mine-missions';
import {ITEM_IDS} from '../src/data/items';

/** Jornada completa: uma partida que fez tudo deve ganhar as 46 conquistas, até "O Vale Renasceu".
 * Prova que cada missão pode ser cumprida com o que o jogo guarda (nomes de itens, cenários e serviços corretos). */
function everything(){
 const s=createNewSave(createCharacterProfile('Tudo')) as any;
 s.day=600;
 for(const id of ITEM_IDS)if(typeof s.inventory[id]==='number')s.inventory[id]=1;
 s.itemQuality=Object.fromEntries(['turnip','lettuce','carrot','bean','tomato','corn','wheat','watermelon','sweetPotato','pumpkin','oat','chamomile','kale','cabbage','strawberry','daisy','sunflower','mint','cotton'].map(i=>[i,{good:0,excellent:1,seen:1}]));
 s.progress={collected:true,craftedTools:true,harvested:true,processed:true,builtWorkbench:true,sawn:true,builtShelter:true};
 s.farmingProgress={prepared:true,planted:true,watered:true,harvested:true};
 s.crops=Array.from({length:100},(_,i)=>({x:i%50,y:30+Math.floor(i/50),growth:0,watered:i<5,crop:'turnip',days:0,day:1}));
 s.preparedSoil=Array.from({length:100},(_,i)=>({x:i%50,y:30+Math.floor(i/50)}));s.restoredFarmSoil=[{x:13,y:11}];s.homeSupplies={wateringCan:true,seedPacket:true};s.wateringCanWater=4;
 s.villageEconomy={coins:150_000,met:[...SOCIAL_NPCS]};
 const kinds:[string,string,number][]=[['coop','chicken',4],['coop','duck',2],['barn','cow',4],['aprisco','goat',2],['aprisco','sheep',2],['pigsty','pig',4],['stable','horse',0],['silo','',0]];
 const ids:string[]=[];const sites=kinds.map(([k,a,n],i)=>{const animals=Array.from({length:n},(_,j)=>`${a}-${i}-${j}`);ids.push(...animals);return{id:i+1,kind:k,x:i*8,y:2,delivered:{},finished:true,animals,hay:0};});
 // nomes reais dos animais (o jogo confere a espécie pelo id)
 const real:Record<string,string[]>={chicken:['forest-chicken-1','forest-chicken-2','wild-chicken-3','breed-chicken-1'],duck:['farm-duck-1','farm-duck-2'],cow:['forest-cow-1','forest-cow-2','wild-cow-3','breed-cow-1'],goat:['forest-goat-1','forest-goat-2'],sheep:['forest-sheep-1','forest-sheep-2'],pig:['farm-pig-1','farm-pig-2','farm-pig-3','farm-pig-4']};
 for(const site of sites){const kind=kinds[site.id-1][1];if(real[kind])site.animals=real[kind].slice(0,site.animals.length);}
 s.farmConstruction={version:1,nextId:sites.length+1,sites};
 s.recruitedAnimals=sites.flatMap((x:any)=>x.animals).concat(['wild-chicken-4','wild-chicken-5','wild-cow-4','wild-sheep-3']);
 s.animalCare={day:600,animals:Object.fromEntries(s.recruitedAnimals.map((id:string)=>[id,{bond:30}]))};
 s.machines={version:1,nextId:20,items:['cheesePress','butterChurn','stoneMill','spinningWheel','loom','preserveKeg','clayOven','composter','waxPress'].map((kind,i)=>({id:i+1,kind,x:i,y:0,space:'property'}))};
 s.npcSocial={version:1,players:Object.fromEntries(SOCIAL_NPCS.map(n=>[n,{affinity:90,giftDay:5}])),pairs:{},memories:{}};
 s.npcStories=Object.fromEntries(SOCIAL_NPCS.map(n=>[n,3]));
 s.festivalDone={'seed-fair':1,'beach-party':1,'harvest-festival':1,'lantern-night':1};
 s.projects=Object.fromEntries(PROJECTS.map(p=>[p.id,{coins:p.coins,items:{...p.items},funded:1}]));
 s.economy6={...(s.economy6??{}),tools:Object.fromEntries(['hatchet','pickaxe','hoe','sickle','shovel','sword'].map(t=>[t,{tier:3,durability:800}]))};
 s.mineMissions={version:1,rewarded:0,quests:Object.fromEntries(MINE_MISSION_IDS.map(id=>[id,{status:'completed',progress:1,visited:[],completedDay:10}]))};
 s.villageInstallations=[...Array.from({length:4},(_,i)=>({kind:'pump',x:i,y:0})),{kind:'lamp',x:9,y:9},{kind:'forge',x:8,y:8}];
 s.petShelter={stage:3,x:1,y:1};
 s.dungeons={version:1,xp:999,attributes:{strength:10,resistance:10,agility:10,vitality:0,precision:0,survival:0},selectedPet:'p1',completed:{'abandoned-central-square':5,'mall-parking':3},recentResults:[],petForageDay:12,
  pets:['dog','cat','golden-retriever'].map((sp,i)=>({id:'p'+i,species:sp,rare:i===0,xp:0,attributes:{speed:5,resistance:5,perception:5,protection:0,efficiency:0}}))};
 s.treeGrowth={version:1,sequence:2,property:[],forest:[],migrated:{property:true,forest:true}};
 s.campfires=[{space:'property',x:1,y:1}];
 s.horseTaming={version:1,trust:7,tamed:true,name:'Trovão'};
 s.riding=true;
 Object.assign(s,{ruinsMapFound:true,ruinsSealFound:true,ruinsSealIdentified:true,ruinsClues:['a','b','c']});
 s.survivorCamp={cycle:3,nextVisitDay:620,kind:'peaceful',warned:false,aggressive:false,members:[],residents:Array.from({length:8},(_,i)=>({id:'r'+i,name:'Aliado '+i,character:'farmer-male',x:0,y:0,hp:100,status:'resident',direction:'down'}))};s.villageSurvivors=['marina','rui'];
 s.communityCenter={stage:3};
 s.beekeeping={version:1,nextId:2,traps:[{id:1,ipe:'ipe-1',x:1,y:1,day:3}]};
 s.home={floor:'pine',wall:'sage',furniture:Array.from({length:10},(_,i)=>({id:'f'+i,kind:'chair',x:i,y:1}))};
 s.fishingProgress={records:Object.fromEntries(['lambari','tilapia','carpa','bagre','truta','dourado'].map(f=>[f,{}])),basket:[],rodTier:2,bait:'worm',preparedBait:true,orderDay:30};
 s.villageProgress={...s.villageProgress,recipes:[...DISH_IDS,'fertilizer','tailoring'],rareFishTaskCompleted:true,outfit:'female'};
 s.propertyVisitDay=20;s.npcOutingGifts={rosa:12};s.kitchen={dishOfDaySold:40};s.scrapSorting={day:10,count:4};
 s.greenhouse={x:53,y:22,crops:Array.from({length:48},(_,i)=>({x:i%8,y:Math.floor(i/8),growth:0,watered:true,crop:'strawberry',days:0,day:1}))};
 s.bentoExpedition={version:1,health:100,grace:0,cooldown:0,party:{}};
 const services=['inn-rumor','contract-accept','contract-deliver','request-tobias','request-amelia','request-helena','request-bento','inn-rest','dish-of-day','learn-tailoring','learn-medicine','scrap-sort','repair-hoe','fishing-order','fishing-specimens-sell','welcome-marina','welcome-rui','shelter-carpentry','shelter-textiles','shelter-fittings','plan-survivor','mill-grind','lucia-buy','lucia-sell-homemadeBread'];
 s.missions={...newMissionLog(),areas:['property','forest','openFields','village','cityForest','fishingLake','swamp','coast','orchard','highland','ruins','railway','survivorCamp','mine'],events:[...services.map(x=>'service:'+x),'train','lighthouse']};
 return s;
}

describe('jornada completa das missões',()=>{
 it('quem fez tudo ganha as 46 conquistas, até O Vale Renasceu',()=>{
  const s=everything();const earned=trackMissions(s);const ctx=missionContext(s,s.missions!);
  const failing=CHAPTERS.flatMap(ch=>ch.missions.filter(m=>{const r=m.test(ctx);return typeof r==='boolean'?!r:r[0]<r[1];}).map(m=>missionKey(ch,m)));
  expect(failing).toEqual([]);
  expect(earned.length).toBe(CHAPTERS.length);
  expect(earned.at(-1)!.id).toBe(FINAL_CHAPTER.id);
 });
 it('as conquistas saem na ordem da trilha',()=>{
  const s=everything();const earned=trackMissions(s).filter(c=>!c.side&&c!==FINAL_CHAPTER).map(c=>c.id);
  expect(earned).toEqual(CHAPTERS.filter(c=>!c.side&&c!==FINAL_CHAPTER).map(c=>c.id));
 });
});
