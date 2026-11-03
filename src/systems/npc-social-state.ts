import {SOCIAL_NPCS,SOCIAL_MEMORY_KINDS,NPC_SOCIAL,type SocialNpc,type SocialMemoryKind} from '../data/npc-social';
import {MINE_MISSION_IDS,type MineMissionId} from '../data/mine-missions';
export interface PlayerRelationship{affinity:number;responseDay?:number;memoryDay?:number}
export interface ResidentRelationship{affinity:number;startedDay:number;completedDay?:number;encounters:number}
export interface SocialMemory{npc:SocialNpc;kind:SocialMemoryKind;detail?:MineMissionId;sequence:number;day:number;count:number;mentionedDay?:number;sharedDay?:number}
export interface NpcSocialState{version:1;players:Partial<Record<SocialNpc,PlayerRelationship>>;pairs:Record<string,ResidentRelationship>;memories:Record<string,SocialMemory>}
export const newNpcSocial=():NpcSocialState=>({version:1,players:{},pairs:{},memories:{}});
export const socialNpc=(v:unknown):v is SocialNpc=>typeof v==='string'&&SOCIAL_NPCS.includes(v as SocialNpc);
export const socialPairKey=(a:SocialNpc,b:SocialNpc)=>[a,b].sort().join(':');
export const socialMemoryKey=(npc:SocialNpc,kind:SocialMemoryKind,detail?:MineMissionId)=>[npc,kind,detail??'-'].join(':');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const int=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const affinity=(v:unknown)=>int(v,NPC_SOCIAL.min,NPC_SOCIAL.max);
export function validNpcSocial(v:unknown,maxDay=999999):v is NpcSocialState{
 if(!record(v)||v.version!==1||!record(v.players)||!record(v.pairs)||!record(v.memories)||Object.keys(v.players).length>SOCIAL_NPCS.length||Object.keys(v.pairs).length>NPC_SOCIAL.maxPairs||Object.keys(v.memories).length>NPC_SOCIAL.maxMemories)return false;
 for(const[id,p]of Object.entries(v.players))if(!socialNpc(id)||!record(p)||!affinity(p.affinity)||['responseDay','memoryDay'].some(k=>p[k]!==undefined&&!int(p[k],1,maxDay)))return false;
 for(const[key,p]of Object.entries(v.pairs)){
  const[a,b,...extra]=key.split(':');if(extra.length||!socialNpc(a)||!socialNpc(b)||a===b||key!==socialPairKey(a,b)||!record(p)||!affinity(p.affinity)||!int(p.startedDay,1,maxDay)||!int(p.encounters,0,NPC_SOCIAL.maxCount)||p.completedDay!==undefined&&(!int(p.completedDay,1,Number(p.startedDay))||p.encounters===0)||p.encounters!==0&&p.completedDay===undefined)return false;
 }
 for(const[key,m]of Object.entries(v.memories)){
  if(!record(m)||!socialNpc(m.npc)||!SOCIAL_MEMORY_KINDS.includes(m.kind as SocialMemoryKind)||!int(m.sequence,1,NPC_SOCIAL.maxCount)||!int(m.day,1,maxDay)||!int(m.count,1,Number(m.sequence))||['mentionedDay','sharedDay'].some(k=>m[k]!==undefined&&!int(m[k],Number(m.day),maxDay)))return false;
  const detail=m.detail as MineMissionId|undefined,kind=m.kind as SocialMemoryKind;
  if((kind==='gallery'||kind.startsWith('request-'))?(detail===undefined||!MINE_MISSION_IDS.includes(detail)):detail!==undefined)return false;
  if(kind==='gallery'&&!['gallery-survey','forgotten-passage'].includes(detail!))return false;
  if(key!==socialMemoryKey(m.npc,kind,detail))return false;
 }
 return true;
}
