import type {SaveData,TilePoint} from '../types';
import {Home,HOME_WIDTH,HOME_HEIGHT} from './home';
export interface MineRescueState {
 version:1;count:number;day:number;time:number;elapsedMinutes:number;
 bedId:string;stage:'waking'|'leaving'|'complete';variant:number;
}
export function validMineRescue(value:unknown,maxDay:number):value is MineRescueState {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const s=value as MineRescueState;
 return s.version===1&&Number.isSafeInteger(s.count)&&s.count>0&&s.count<=1e9&&Number.isInteger(s.day)&&s.day>=1&&s.day<=maxDay&&Number.isFinite(s.time)&&s.time>=0&&s.time<1440&&Number.isFinite(s.elapsedMinutes)&&s.elapsedMinutes>=0&&s.elapsedMinutes<=120&&typeof s.bedId==='string'&&s.bedId.length>0&&s.bedId.length<=100&&['waking','leaving','complete'].includes(s.stage)&&Number.isInteger(s.variant)&&s.variant>=0&&s.variant<3;
}
/** Physics stays on reachable floor; the resting pose is drawn on the owned bed. */
export function rescueHomePlacement(home:Home):{bedId:string;player:TilePoint;bento:TilePoint}|undefined {
 const floors:TilePoint[]=[];
 for(let y=2;y<HOME_HEIGHT;y++)for(let x=1;x<HOME_WIDTH-1;x++)if(!home.isBlocked(x,y)&&home.canReachExit({x,y}))floors.push({x:x*32+16,y:y*32+16});
 for(const bed of home.data.furniture.filter(f=>f.kind==='bed')){
  const center={x:(bed.x+1)*32,y:(bed.y+1)*32},sorted=[...floors].sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y));
  for(const player of sorted){const bento=sorted.find(p=>Math.hypot(p.x-player.x,p.y-player.y)>=30&&Math.hypot(p.x-player.x,p.y-player.y)<=72);if(bento)return{bedId:bed.id,player,bento};}
 }
}
export const rescuePending=(save:SaveData)=>save.mineRescue?.stage==='waking';
export function rescueDialogue(save:SaveData):string[]{
 const variants=[
  'Você me deu um susto! Encontrei você desmaiado na mina e trouxe você de volta para casa.',
  'Ah, acordou! Encontrei você caído numa das galerias. Achei melhor trazer você para sua cama.',
  'Ainda bem que você abriu os olhos. A mina quase levou a melhor hoje. Trouxe você para descansar em casa.',
 ];
 return[variants[save.mineRescue?.variant??0],'Os recursos que você carregava ficaram pelo caminho. Consegui trazer suas ferramentas e equipamentos. O que estava guardado em casa continua seguro.','Descanse um pouco. Na próxima exploração, cuide da sua vida e volte antes de ficar sem forças. Vou voltar para a oficina.'];
}
/** Acknowledgement is durable before movement/control resumes; it never reapplies losses. */
export function acknowledgeMineRescue(save:SaveData,write:(draft:SaveData)=>boolean):boolean {
 if(!rescuePending(save))return false;
 const trip=save.bentoTravel?.trip;if(!trip||trip.area!=='home'||trip.leg!=='rescue-dialogue')return false;
 const draft=structuredClone(save);draft.mineRescue!.stage='leaving';
 const actor=draft.bentoTravel!.trip!;actor.leg='rescue-home-exit';actor.route=[];actor.index=0;actor.wait=0;actor.moving=false;actor.blocked=false;
 try{if(!write(draft))return false;}catch{return false;}
 save.mineRescue=draft.mineRescue;save.bentoTravel=draft.bentoTravel;return true;
}
