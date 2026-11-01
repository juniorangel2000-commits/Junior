import type {FishingPhase} from '../systems/fishing';
/** The float, the line endpoint and the surface rings share this motion state. */
export function fishingFloatMotion(seconds:number,phase:FishingPhase,held=false,fish=.5,reduced=false){
 const bite=phase==='bite',fighting=phase==='fighting',gentle=reduced?.25:1;
 const x=(Math.sin(seconds*.7)*2.5+Math.sin(seconds*1.3)*.8+(fighting?(fish-.5)*15:0))*gentle;
 const surfaceY=Math.sin(seconds*.8)*.6*gentle;
 const dip=bite?4+Math.sin(seconds*17)*2.2:fighting?2+Math.sin(seconds*5.4)*(held?1.1:1.8):Math.sin(seconds*1.9)*1.15;
 const angle=(bite?Math.sin(seconds*13)*9:fighting?Math.sin(seconds*4)*5+(held?-3:2):Math.sin(seconds*1.4)*3)*gentle;
 return{x,surfaceY,dip:dip*gentle,angle,tension:fighting&&held?.85:bite?.65:.25,
  rings:Array.from({length:3},(_,i)=>{const phase=(seconds*(bite?1.15:.42)+i/3)%1;return{rx:8+phase*27,ry:2+phase*7,alpha:(1-phase)*(bite?.65:.38)};})};
}
