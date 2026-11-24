// Mutação de cada capítulo: cumpre as missões dele. s = estado; inv(id,n) põe na mochila; area(a) e ev(e) registram.
module.exports=`
const CROPS=['turnip','lettuce','carrot','bean','tomato','corn','wheat','watermelon','sweetPotato','pumpkin','oat','chamomile','kale','cabbage','strawberry','daisy','sunflower','mint','cotton'];
const SOCIAL=['augusto','bento','rosa','tobias','amelia','nilo','celina','damiao','helena','icaro'];
const site=(kind,animals)=>{const c=s.farmConstruction??={version:1,nextId:1,sites:[]};const n=c.sites.length;c.sites.push({id:c.nextId++,kind,x:2+(n%8)*11,y:44+Math.floor(n/8)*9,delivered:{...X.farmCost[kind]},finished:true,gateOpen:true,animals,hay:0});for(const a of animals)if(!(s.recruitedAnimals??=[]).includes(a))s.recruitedAnimals.push(a);};
const machine=k=>{const m=s.machines??={version:1,nextId:1,items:[]};m.items.push({id:m.nextId++,kind:k,x:2+m.items.length*3,y:64,space:'property'});};
const crops=n=>{};
const exc=(...ids)=>{s.itemQuality??={};for(const i of ids){s.itemQuality[i]={good:0,excellent:1,seen:1};inv(i,1);}};
const friends=(n,v)=>{s.npcSocial??={version:1,players:{},pairs:{},memories:{}};SOCIAL.slice(0,n).forEach(k=>s.npcSocial.players[k]={...(s.npcSocial.players[k]??{}),affinity:Math.max(v,s.npcSocial.players[k]?.affinity??0),giftDay:3});};
const tools=t=>{s.economy6.tools??={};for(const k of ['hatchet','pickaxe','hoe'])s.economy6.tools[k]={...(s.economy6.tools[k]??{durability:100}),tier:t};};
const quests=n=>{s.mineMissions??=X.newMine();X.completeMine(s.mineMissions,n,s.day);};
const done=id=>{(s.projects??={})[id]={coins:P.find(p=>p.id===id).coins,items:{...P.find(p=>p.id===id).items},funded:1};};
const pets=list=>{s.dungeons??=X.newDungeon();s.dungeons.pets=list.map((sp,i)=>({id:'pet-'+i,species:sp,rare:i===2,xp:0,attributes:{speed:i?2:15,resistance:0,perception:0,protection:0,efficiency:0}}));};
return {
'primeira-colheita':()=>{s.homeSupplies={...(s.homeSupplies??{}),wateringCan:true,seedPacket:true};s.wateringCanWater=4;Object.assign(s.farmingProgress,{prepared:true,planted:true,watered:true,harvested:true});},
'terra-nova':()=>{inv('hoe',1);s.crops.slice(0,5).forEach(c=>c.watered=true);ev('restore-soil');},
'maos-a-obra':()=>{Object.assign(s.progress,{collected:true,craftedTools:true,harvested:true,processed:true,builtWorkbench:true,sawn:true,builtShelter:true});},
'vizinhos':()=>{area('village');s.villageEconomy.met=[...SOCIAL];inv('lettuceSeeds',2);s.villageEconomy.coins=800;ev('service:inn-rumor');},
'raizes':()=>{crops(30);inv('turnip',1);inv('lettuce',1);inv('carrot',1);inv('fertilizer',1);exc('carrot');},
'primeiro-anzol':()=>{inv('fishingRod',1);s.fishingProgress={records:{lambari:X.fish,tilapia:X.fish,carpa:X.fish},basket:[],rodTier:0,bait:'worm',preparedBait:false};area('fishingLake');inv('roastedFish',1);},
'a-corda':()=>{inv('cord',1);site('coop',['forest-chicken-1','forest-chicken-2']);inv('egg',2);},
'fogao':()=>{s.villageProgress.recipes=[...new Set([...s.villageProgress.recipes,'kaleOmelette','gardenSalad','pamonha','pumpkinSoup','orangeJuice'])];for(const d of ['kaleOmelette','gardenSalad','pamonha','pumpkinSoup','orangeJuice'])inv(d,1);},
'vida-na-vila':()=>{friends(1,5);for(const e of ['contract-accept','contract-deliver','request-tobias','request-amelia','request-helena','request-bento','inn-rest','dish-of-day'])ev('service:'+e);},
'curral':()=>{site('barn',['forest-cow-1']);inv('milk',1);site('aprisco',['forest-goat-1','forest-sheep-1']);inv('wool',1);},
'explorador':()=>{for(const a of ['forest','openFields','swamp','coast','orchard','cityForest'])area(a);},
'coletor':()=>{for(const i of ['shell','blueIris','apple','pear','orange','mushroom','rareHerb','sand','freshGrass','hardwood'])inv(i,1);s.treeGrowth={...(s.treeGrowth??{version:1,property:[],forest:[],migrated:{property:true,forest:true}}),sequence:1};s.campfires=[{space:'property',x:40,y:30}];},
'cavalo':()=>{s.horseTaming={version:1,trust:7,tamed:true,name:'Trovao',lastFedDay:s.day};site('stable',[X.horse]);s.riding=true;},
'estacoes':()=>{for(const i of ['tomato','pumpkin','kale','watermelon'])inv(i,1);crops(50);},
'bichos-felizes':()=>{s.animalCare={day:s.day,animals:{'forest-chicken-1':{bond:26},'forest-cow-1':{bond:12}}};site('silo',[]);inv('hay',3);inv('duckEgg',1);site('pigsty',['farm-pig-1']);inv('manure',1);},
'oficina':()=>{machine('cheesePress');machine('butterChurn');machine('stoneMill');inv('cheese',1);inv('butter',1);inv('flour',1);},
'oficio':()=>{ev('service:learn-tailoring');s.villageProgress.outfit='female';inv('boots',1);ev('service:learn-medicine');inv('fungalInfusion',1);ev('service:scrap-sort');ev('service:repair-hoe');inv('harvestBasket',1);},
'diario-cheio':()=>{s.fishingProgress={basket:[],bait:'worm',rodTier:0,preparedBait:false,...(s.fishingProgress??{})};s.fishingProgress.records={lambari:X.fish,tilapia:X.fish,carpa:X.fish,bagre:X.fish,truta:X.fish,dourado:X.fish};s.villageProgress.rareFishTaskCompleted=true;s.fishingProgress.rodTier=2;s.fishingProgress.preparedBait=true;ev('service:fishing-order');ev('service:fishing-specimens-sell');},
'rede':()=>{inv('net',1);inv('crab',1);inv('crabStew',1);inv('glass',2);},
'luz-no-escuro':()=>{inv('lantern',1);area('mine');inv('ironShard',3);inv('ironIngot',1);quests(1);ev('bento-party');},
'agua':()=>{s.villageInstallations=[...Array.from({length:4},(_,i)=>({kind:'pump',x:20+i,y:30})),{kind:'lamp',x:30,y:30},{kind:'forge',x:32,y:30}];},
'colmeia':()=>{inv('emptyHive',1);s.beekeeping={version:1,nextId:2,traps:[{id:1,ipe:X.ipe.id,x:X.ipe.x,y:X.ipe.y,day:s.day}]};inv('beehive',1);for(const i of ['honey','beeswax','candle','daisyHoney','sunflowerHoney'])inv(i,1);},
'amizades':()=>{friends(6,55);s.npcStories={rosa:1};s.propertyVisitDay=s.day;s.npcOutingGifts={rosa:s.day};ev('service:welcome-marina');ev('service:welcome-rui');},
'casinha':()=>{s.petShelter={...(s.petShelter??{x:1,y:1}),stage:3};for(const e of ['shelter-carpentry','shelter-textiles','shelter-fittings'])ev('service:'+e);},
'primeira-expedicao':()=>{area('cityForest');s.dungeons??=X.newDungeon();s.dungeons.completed['abandoned-central-square']=1;pets(['dog']);s.dungeons.attributes.strength=1;s.dungeons.petForageDay=s.day;},
'lar':()=>{done('home-1');done('home-2');done('home-3');X.fillHome(s,10);s.home.floor=X.floor;},
'ferro':()=>{tools(1);inv('sickle',1);inv('shovel',1);inv('goldShard',1);quests(3);},
'artesao':()=>{for(const k of ['spinningWheel','loom','preserveKeg','clayOven','composter'])machine(k);for(const i of ['yarn','woolCloth','strawberryJam'])inv(i,1);},
'receitas':()=>{s.villageProgress.recipes=[...new Set([...s.villageProgress.recipes,...DISHES.filter(d=>!['minerBroth','fishStew','honeyCake'].includes(d))])];for(const d of DISHES.slice(0,12))inv(d,1);inv('homemadeBread',1);inv('applePie',1);},
'longe':()=>{for(const a of ['highland','ruins','railway','survivorCamp'])area(a);},
'ruinas':()=>{inv('ruinSeal',1);Object.assign(s,{ruinsMapFound:true,ruinsSealFound:true,ruinsSealIdentified:true,ruinsClues:X.clues.slice(0,3)});inv('oldMap',1);},
'sobreviventes':()=>{s.survivorCamp=X.camp(8);s.communityCenter={stage:3};inv('sword',1);ev('service:plan-survivor');},
'hordas':()=>{s.dungeons??=X.newDungeon();s.dungeons.completed={'abandoned-central-square':3,'mall-parking':1};pets(['dog','cat','golden-retriever']);s.dungeons.attributes={...s.dungeons.attributes,strength:5,resistance:5};},
'horta-farta':()=>{crops(100);for(const c of CROPS)inv(c,1);exc('turnip','lettuce','tomato','pumpkin','kale');},
'ouro':()=>{inv('goldIngot',1);tools(2);quests(5);},
'escondidas':()=>{s.villageProgress.recipes=[...new Set([...s.villageProgress.recipes,'minerBroth','fishStew','honeyCake'])];for(const d of DISHES)inv(d,1);},
'fazenda-cheia':()=>{site('coop',['farm-duck-1','wild-chicken-3','wild-chicken-4']);site('barn',['forest-cow-2','wild-cow-3','wild-cow-4']);site('aprisco',['forest-goat-2','forest-sheep-2','wild-goat-3']);site('pigsty',['farm-pig-2','farm-pig-3','farm-pig-4']);site('coop',['wild-chicken-5','wild-chicken-6','farm-duck-2']);s.animalCare.animals={...s.animalCare.animals,'forest-cow-1':{bond:27},'forest-goat-1':{bond:28}};},
'historias':()=>{s.npcStories=Object.fromEntries(SOCIAL.map(k=>[k,3]));friends(10,85);},
'estufa':()=>{done('greenhouse');done('greenhouse-2');},
'vale':()=>{for(const p of ['vale-moinho','vale-ponte','vale-farol','vale-estacao'])done(p);ev('service:mill-grind');ev('train');ev('lighthouse');},
'novos-vizinhos':()=>{done('casa-leste');done('casa-sul');site('coop',['breed-chicken-1']);ev('service:lucia-buy');ev('service:lucia-sell-homemadeBread');},
'metal-negro':()=>{inv('blackMetalShard',1);inv('blackMetalIngot',1);tools(3);quests(7);},
'veterano':()=>{s.dungeons??=X.newDungeon();pets(['dog','cat','border-collie','golden-retriever'].slice(0,3));s.dungeons.completed={'abandoned-central-square':5,'mall-parking':3};s.dungeons.attributes={strength:10,resistance:10,agility:10,vitality:0,precision:0,survival:0};},
'festas':()=>{s.festivalDone={'seed-fair':1,'beach-party':1,'harvest-festival':1,'lantern-night':1};},
'economias':()=>{s.villageEconomy.coins=120000;},
'anos':()=>{s.day=340;},
};`;
