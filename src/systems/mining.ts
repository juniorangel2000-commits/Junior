import type {ResourceNode,SaveData} from '../types';
import {ECONOMY_BALANCE as B,type Metal,shard,ore} from '../data/economy-balance';
import {toolCondition,newEconomyState} from './economy';
const hash=(text:string)=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;};
export function depositMetal(node:ResourceNode):Metal|undefined{
 if(node.kind!=='vein')return undefined;if(node.metal)return node.metal;
 const area=node.id.startsWith('f-')||node.id.startsWith('spawn-f-')?'forest':'property',mix=B.deposits[area],sample=hash(node.id);
 if(sample<mix.blackMetal)return'blackMetal';if(sample<mix.blackMetal+mix.gold)return'gold';if(sample<mix.blackMetal+mix.gold+mix.iron)return'iron';return undefined;
}
export function canMine(s:SaveData,metal:Metal):boolean{return toolCondition(s,'pickaxe').tier>=(metal==='iron'?0:metal==='gold'?1:2);}
export function metalDrop(metal:Metal,id:string,sample=hash(`${id}:whole-ore`)){return{[sample<B.wholeChance[metal]?ore(metal):shard(metal)]:1};}
export function recordMetal(s:SaveData,metal:Metal){const e=s.economy6??=newEconomyState();e.mined[metal]=(e.mined[metal]??0)+1;}
