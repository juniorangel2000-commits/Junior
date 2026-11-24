// Monta, dentro da página, os dados auxiliares com as funções do próprio jogo.
module.exports=async function buildX(){
 const fb=(await import('/src/data/farm-buildings.ts')).FARM_BUILDINGS;
 const mine=await import('/src/systems/mine-mission-state.ts'),dun=await import('/src/dungeons/progression.ts');
 const of=await import('/src/data/open-fields.ts'),ruins=await import('/src/data/ruins-story.ts'),camp=await import('/src/systems/survivor-camp.ts');
 const md=await import('/src/data/mine-missions.ts');const gh=await import('/src/systems/greenhouse.ts');const invm=await import('/src/systems/inventory.ts'),ti=await import('/src/systems/tool-instances.ts');
 const home=await import('/src/systems/home.ts'),lvl=await import('/src/systems/home-level.ts');
 return{
  farmCost:Object.fromEntries(Object.entries(fb).map(([k,v])=>[k,{...v.cost}])),
  addItem:(s,i,n)=>{if(ti.individualTool(i)){if((s.inventory[i]??0)>=n)return;const I=new invm.Inventory(s.inventory);if(I.transact({},{[i]:n-(s.inventory[i]??0)}))s.inventory=I.data;else if(!(s.missions.seen??=[]).includes(i))s.missions.seen.push(i);}else s.inventory[i]=Math.max(s.inventory[i]??0,n);},
  greenhouse:(s,level)=>({x:53,y:22,...(s.greenhouse??{}),crops:gh.greenhousePlots(level).map(p=>({x:p.x,y:p.y,growth:0,watered:true,crop:'strawberry',days:0,day:s.day,care:{missed:0}}))}),
  newMine:()=>mine.newMineMissions(),
  completeMine:(st,n,day)=>{for(const def of md.MINE_MISSIONS.slice(0,n)){const q=st.quests[def.id];if(q.status==='completed')continue;q.status='completed';q.acceptedDay=day;q.completedDay=day;q.progress=md.mineMissionTarget(def.id);if(def.visits)q.visited=def.visits.map((_,i)=>i);if(def.kind==='repeat')q.cycle=md.mineRequestCycle(day);else delete q.cycle;
   const origin=md.mineMissionOrigin(def.id,q.cycle??0);if(origin)q.object={uid:md.mineMissionObjectId(def.id,q.cycle??0),state:'delivered',position:{x:origin.x,y:origin.y}};}},newDungeon:()=>dun.createDungeonProgress(),
  fish:{count:1,lengthCm:20,weightGrams:150,firstDay:1},horse:'field-horse-1',
  ipe:of.FIELDS_IPES[0],clues:Object.keys(ruins.RUINS_CLUES),floor:Object.keys(home.FLOOR_STYLES).find(f=>f!=='oak'),
  camp:n=>{const base=camp.ensureSurvivorCamp({profile:{name:'Junior'},day:40});const t=base.members[0];return{...base,residents:Array.from({length:n},(_,i)=>({...t,id:'camp-'+(50+i)+'-0',name:'Aliado '+i,status:'resident'}))};},
  fillHome:(s,n)=>{const size=lvl.playerHomeSize(s);const kinds=home.FURNITURE_KINDS;let id=0;
   for(const kind of kinds)for(let y=0;y<size.height&&s.home.furniture.length<n;y++)for(let x=0;x<size.width&&s.home.furniture.length<n;x++){const piece={id:'home-'+kind+'-'+(9000+id++),kind,x,y};const t={...s.home,furniture:[...s.home.furniture,piece]};if(home.validateHome(t,true,size))s.home.furniture.push(piece);}},
 };
};
