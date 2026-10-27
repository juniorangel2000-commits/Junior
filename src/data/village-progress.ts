/** Progress is separate from stock so services, contracts and learned recipes
 * cannot be duplicated by moving an item into or out of the quickbar. */
export const VILLAGE_RECIPE_IDS=['bandage','herbalTonic','fungalInfusion','fertilizer','backpack','boots','accessory','lamp','waterPump','homeKit','workshopKit','survivorKit'] as const;
export const VILLAGE_PLAN_IDS=['home','workshop','survivor'] as const;
export const VILLAGE_RUMOR_IDS=['forest-lake','old-ruins','survivor-camp'] as const;
export const VILLAGE_SURVIVOR_IDS=['marina','rui'] as const;
export type VillagePlan=typeof VILLAGE_PLAN_IDS[number];
export interface VillageContract {day:number;dueDay:number;delivered:number;completed:boolean}
export interface VillageProgress {
  toolLevels:{hatchet:number;pickaxe:number;hoe:number};
  recipes:string[];
  plans:VillagePlan[];
  fishingSkill:number;
  rareFishTaskCompleted:boolean;
  contract?:VillageContract;
  rumors:string[];
  outfit:'original'|'female'|'male';
  vigor:number;
}
export interface VillageInstallation {kind:'lamp'|'pump'|'forge';x:number;y:number}

export function createVillageProgress():VillageProgress {
  return{toolLevels:{hatchet:0,pickaxe:0,hoe:0},recipes:[],plans:[],fishingSkill:0,rareFishTaskCompleted:false,rumors:[],outfit:'original',vigor:100};
}
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const integer=(value:unknown,min:number,max:number):value is number=>Number.isSafeInteger(value)&&Number(value)>=min&&Number(value)<=max;
const knownList=(value:unknown,known:readonly string[]):boolean=>Array.isArray(value)&&value.length<=known.length
  &&new Set(value).size===value.length&&value.every(id=>typeof id==='string'&&known.includes(id));

export function validateVillageProgress(value:unknown):value is VillageProgress {
  if(!record(value)||!record(value.toolLevels)
    ||Object.keys(value.toolLevels).some(id=>!['hatchet','pickaxe','hoe'].includes(id))
    ||!['hatchet','pickaxe','hoe'].every(id=>integer((value.toolLevels as Record<string,unknown>)[id],0,2))
    ||!knownList(value.recipes,VILLAGE_RECIPE_IDS)||!knownList(value.plans,VILLAGE_PLAN_IDS)
    ||!knownList(value.rumors,VILLAGE_RUMOR_IDS)||!integer(value.fishingSkill,0,2)
    ||typeof value.rareFishTaskCompleted!=='boolean'||!['original','female','male'].includes(value.outfit as string)
    ||!integer(value.vigor,0,100))return false;
  if(value.contract!==undefined){
    const c=value.contract;
    if(!record(c)||!integer(c.day,1,999_999)||!integer(c.dueDay,c.day,999_999)
      ||!integer(c.delivered,0,10)||typeof c.completed!=='boolean'||c.completed&&c.delivered!==10)return false;
  }
  return true;
}

/** Fixed property coordinates; one fixture per cell and a bounded save payload. */
export function validateVillageInstallations(value:unknown):value is VillageInstallation[] {
  if(!Array.isArray(value)||value.length>64)return false;
  const occupied=new Set<string>();
  for(const fixture of value){
    if(!record(fixture)||!['lamp','pump','forge'].includes(fixture.kind as string)||!integer(fixture.x,1,94)||!integer(fixture.y,1,70))return false;
    const cell=`${fixture.x},${fixture.y}`;
    if(occupied.has(cell))return false;occupied.add(cell);
  }
  return true;
}
export function validateVillageSurvivors(value:unknown):value is string[] {return knownList(value,VILLAGE_SURVIVOR_IDS);}
