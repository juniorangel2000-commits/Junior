import {damiaoAtLake} from '../data/fisher-schedule';
import type { SaveData } from '../types';
import { MerchantDailyRoutine, MERCHANT_DAILY_PLAN, merchantPeriod, merchantMayEnter, type RoutineId, type RoutineArea, type MerchantRoutineState, type RoutineEnvironment } from './merchant-routine';
import { merchantRoomNavigation, resolveMerchantLayout } from '../data/merchant-rooms';
import { smithNavigation, resolveSmithLayout } from './smith-layout';
import type { BentoRoomNavigation } from './bento-routine';
import { MERCHANT_VISITS } from '../data/merchant-visits';
import { villagePointBlocked, villageBlockedAt } from '../data/village';
import { freeArrival, actorsOverlap } from './actor-arrival';

const IDS: readonly RoutineId[]=['augusto','bento','rosa','tobias','amelia','nilo','celina','damiao','helena','icaro'];
const models=new WeakMap<SaveData,BackgroundVillage>();
const clock=(s:SaveData)=>s.day*1440+s.time;
const roomCache=new Map<RoutineId,{signature:string;navigation:BentoRoomNavigation}>();
export function villageRoutineNavigation(save:SaveData,id:RoutineId):BentoRoomNavigation{
  const layout=id==='bento'?save.blacksmithScene:save.merchantScenes?.[id];
  const signature=JSON.stringify(layout??null),cached=roomCache.get(id);
  if(cached?.signature===signature)return cached.navigation;
  const navigation=id==='bento'?smithNavigation(resolveSmithLayout(save.blacksmithScene)):merchantRoomNavigation(id,resolveMerchantLayout(id,save.merchantScenes?.[id]));
  roomCache.set(id,{signature,navigation});return navigation;
}
class BackgroundVillage {
  readonly routines=new Map<RoutineId,MerchantDailyRoutine>();
  private readonly rooms=new Map<RoutineId,BentoRoomNavigation>();
  last:number;
  constructor(readonly save:SaveData){
    this.last=clock(save);
    for(const id of IDS)this.rooms.set(id,villageRoutineNavigation(save,id));
    for(const [index,id] of IDS.entries()){
      const previous=save.villageRoutines?.[id];
      const saved=previous?.updatedAt!==undefined&&Math.abs(clock(save)-previous.updatedAt)<=5?previous:this.initial(id,index);
      this.routines.set(id,new MerchantDailyRoutine(id,{x:saved.x,y:saved.y,direction:saved.direction,shop:saved.area==='shop'},this.rooms.get(id)!,saved,6,owner=>this.rooms.get(owner)!));
    }
    save.villageRoutines=Object.fromEntries([...this.routines].map(([id,r])=>[id,r.state]));
  }
  private initial(id:RoutineId,index:number):MerchantRoutineState{
    const period=merchantPeriod(id,this.save.time),visit=MERCHANT_VISITS[id];
    const host=period==='work'&&this.save.time>=visit.start&&this.save.time<visit.end&&merchantMayEnter(visit.host,this.save,id)?visit.host:id;
    const nav=this.rooms.get(host)!,tile=nav.tileSize??32;
    const stop=nav.stops?.[period==='closed'?0:index%Math.max(1,nav.stops.length)]??{x:36,y:19};
    const point=period==='break'?MERCHANT_DAILY_PLAN.plaza[id]:stop;
    const preferred={x:(point.x+.5)*(period==='break'?32:tile),y:(point.y+.5)*(period==='break'?32:tile)};
    const blocked=period==='break'?(x:number,y:number)=>villagePointBlocked(x,y,this.save.villageMapEdits):(x:number,y:number)=>!nav.validPosition!(x,y);
    const free=freeArrival(preferred,blocked,[])??preferred;
    return {area:period==='break'?'village':'shop',...free,direction:'down',stop:index%4,wait:1+index*.4,serviceUntil:0,socialUntil:0,socialDay:0,updatedAt:clock(this.save),...(host!==id&&period!=='break'?{roomOwner:host}:{})};
  }
  private environment(id:RoutineId):RoutineEnvironment{
    const routine=this.routines.get(id)!,current=routine.roomOwner;
    const navigation=(owner=current)=>this.rooms.get(owner)!;
    const actors=(area:RoutineArea,owner=current)=>[...this.routines].filter(([other,r])=>other!==id&&!(other==='damiao'&&damiaoAtLake(this.save))&&r.state.area===area&&(area==='village'||r.roomOwner===owner)).map(([,r])=>r.state);
    const scenery=(area:RoutineArea,x:number,y:number,owner=current)=>area==='shop'?!navigation(owner).validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
    return {
      blocked:(area,x,y,owner=current)=>area==='village'?villageBlockedAt(x,y,this.save.villageMapEdits)||actors(area).some(a=>Math.floor(a.x/32)===x&&Math.floor(a.y/32)===y):navigation(owner).isBlocked(x,y)||actors(area,owner).some(a=>actorsOverlap({x:(x+.5)*8,y:(y+.5)*8},a)),
      cellBlocked:(area,x,y)=>area==='village'?villageBlockedAt(x,y,this.save.villageMapEdits):!!navigation().cellBlocked?.(x,y)||navigation().isBlocked(x,y)||actors(area).some(a=>a.x>x*8-20&&a.x<(x+1)*8+20&&a.y>y*8-12&&a.y<(y+1)*8+12),
      fits:(area,x,y,owner=current)=>!scenery(area,x,y,owner)&&!actors(area,owner).some(a=>actorsOverlap({x,y},a)),
      arrival:(area,p,owner=current)=>freeArrival(p,(x,y)=>scenery(area,x,y,owner),actors(area,owner)),
    };
  }
  step(seconds:number):void{
    for(const id of IDS)this.routines.get(id)!.step(seconds,this.save,this.environment(id));
    this.last=clock(this.save);
  }
}
/** Seed first/legacy visits from the current schedule rather than every shop doorstep. */
export function prepareVillageRoutines(save:SaveData):void{
  if(!models.has(save))models.set(save,new BackgroundVillage(save));
}
/** The village scene updates its visible actors; other world maps update them here. */
export function advanceBackgroundVillage(save:SaveData,seconds:number):void{
  if(save.activeArea==='village'||!Number.isFinite(seconds)||seconds<=0)return;
  let model=models.get(save);
  if(!model||Math.abs(clock(save)-model.last)>5){model=new BackgroundVillage(save);models.set(save,model);}
  model.step(Math.min(seconds,.1));
}
