import type {SaveData,ResourceNode,ItemId,TilePoint} from '../types';
import {Inventory} from './inventory';
import {ECOLOGY_BALANCE as B} from '../data/ecology-balance';
export type TreeSpecies='oak'|'pine';
export type TreeArea='property'|'forest';
export interface GrowingTree extends TilePoint {id:string;species:TreeSpecies;plantedAt:number;phase:'growing'|'stump';planted?:boolean}
export interface TreeGrowthData {version:1;sequence:number;property:GrowingTree[];forest:GrowingTree[];migrated:{property:boolean;forest:boolean}}
export const treeClock=(s:{day:number;time:number})=>(s.day-1)*1440+s.time;
export function ensureTreeGrowth(s:SaveData):TreeGrowthData{return s.treeGrowth??={version:1,sequence:0,property:[],forest:[],migrated:{property:false,forest:false}};}
export const isGrowingTreeId=(id:string)=>/^growth-[pf]-[1-9]\d*$/.test(id);
export function treeStage(tree:GrowingTree,now:number):0|1|2|3{const days=Math.max(0,now-tree.plantedAt)/1440;return days>=B.growthDays[3]?3:days>=B.growthDays[2]?2:days>=B.growthDays[1]?1:0;}
const nextTreeId=(d:TreeGrowthData,area:TreeArea)=>`growth-${area==='forest'?'f':'p'}-${++d.sequence}`;
export function growingTreeResources(s:SaveData,area:TreeArea):ResourceNode[]{
 return(s.treeGrowth?.[area]??[]).map(t=>({id:t.id,x:t.x,y:t.y,kind:t.phase==='stump'?'stump':'standingTree',treeSpecies:t.species,treePlanted:t.planted??t.phase==='growing',treePlantingSoil:(t.planted??t.phase==='growing')&&t.phase==='growing'&&Math.floor(t.plantedAt/1440)===s.day-1,...t.phase==='growing'?{treeStage:treeStage(t,treeClock(s))}:{}}));
}
export function plantTree(s:SaveData,item:ItemId,point:TilePoint,blocked:(x:number,y:number)=>boolean):{ok:boolean;message:string}{
 const area=s.activeArea??'property';if((item!=='oakSeed'&&item!=='pineSeed')||area==='village')return{ok:false,message:'Plante na propriedade ou na floresta.'};
 if(!Number.isInteger(point.x)||!Number.isInteger(point.y)||point.x<2||point.x>93||point.y<2||point.y>69||blocked(point.x,point.y))return{ok:false,message:'Escolha terra livre, longe da água e das construções.'};
 const data=s.treeGrowth,trees=data?.[area]??[];
 if((data?.sequence??0)>=1e9||trees.length>=B.treeLimit||trees.some(t=>Math.hypot(t.x-point.x,t.y-point.y)<B.seedSpacing))return{ok:false,message:'Deixe espaço entre as árvores ou recolha os tocos existentes.'};
 const i=new Inventory(s.inventory);if(!i.spend({[item]:1}))return{ok:false,message:'Você não possui esta semente.'};
 const d=ensureTreeGrowth(s);d[area].push({id:nextTreeId(d,area),x:point.x,y:point.y,species:item==='pineSeed'?'pine':'oak',plantedAt:treeClock(s),phase:'growing',planted:true});s.inventory={...i.data};
 return{ok:true,message:'Semente plantada. A árvore ficará adulta em sete dias do jogo.'};
}
/** The original tree is still recorded as depleted; managed cycles use new IDs. */
export function harvestGrowingTree(s:SaveData,area:TreeArea,node:ResourceNode):{handled:boolean;managed:boolean}{
 const existing=s.treeGrowth?.[area].find(t=>t.id===node.id);
 if(node.kind==='stump'&&existing){const d=ensureTreeGrowth(s);d[area]=d[area].filter(t=>t.id!==node.id);return{handled:true,managed:true};}
 if(node.kind!=='standingTree')return{handled:false,managed:false};
 const d=ensureTreeGrowth(s);if(existing)d[area]=d[area].filter(t=>t.id!==node.id);
 if((node.treeStage??3)===3)d[area].push({id:nextTreeId(d,area),x:node.x,y:node.y,species:node.treeSpecies??'oak',plantedAt:treeClock(s),phase:'stump',planted:node.treePlanted??false});
 return{handled:true,managed:!!existing};
}
/** One migration per area: previously decorative stumps become collectible once. */
export function migrateTreeStumps(s:SaveData,area:TreeArea,objects:readonly {id:string;x:number;y:number;kind:string;depleted?:boolean}[]):void{
 const d=ensureTreeGrowth(s);if(d.migrated[area])return;
 for(const o of objects)if(o.depleted&&(o.kind==='standingTree'||o.kind.startsWith('oak')||o.kind.startsWith('pine'))&&d[area].length<B.treeLimit&&!d[area].some(t=>t.x===o.x&&t.y===o.y))d[area].push({id:nextTreeId(d,area),x:o.x,y:o.y,species:o.kind.startsWith('pine')?'pine':'oak',plantedAt:treeClock(s),phase:'stump'});
 d.migrated[area]=true;
}
export function validTreeGrowth(value:unknown):value is TreeGrowthData{
 if(!value||typeof value!=='object')return false;const d=value as TreeGrowthData;
 if(d.version!==1||!Number.isSafeInteger(d.sequence)||d.sequence<0||d.sequence>1e9||!d.migrated||typeof d.migrated.property!=='boolean'||typeof d.migrated.forest!=='boolean')return false;
 const ids=new Set<string>();
 for(const area of ['property','forest'] as const){const rows=d[area],tiles=new Set<string>();if(!Array.isArray(rows)||rows.length>B.treeLimit)return false;
  for(const t of rows){if(!t||!isGrowingTreeId(t.id)||!t.id.startsWith(`growth-${area==='forest'?'f':'p'}-`)||Number(t.id.split('-')[2])<1||Number(t.id.split('-')[2])>d.sequence||ids.has(t.id)||!['oak','pine'].includes(t.species)||!['growing','stump'].includes(t.phase)||t.planted!==undefined&&typeof t.planted!=='boolean'||!Number.isSafeInteger(t.x)||!Number.isSafeInteger(t.y)||t.x<1||t.x>94||t.y<1||t.y>70||!Number.isFinite(t.plantedAt)||t.plantedAt<0||t.plantedAt>1440*1e6||tiles.has(`${t.x},${t.y}`))return false;ids.add(t.id);tiles.add(`${t.x},${t.y}`);}
 }return true;
}
