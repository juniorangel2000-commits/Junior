export const FISHING_CAST_TIMING={windup:.55,launch:.75,land:1.9} as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
/** One shared tool swing; the original body only makes a small, slow vertical hop. */
export function fishingCastMotion(seconds:number){
 const time=Math.max(0,seconds),hop=clamp((time-.45)/.9);
 return{
  swing:time<FISHING_CAST_TIMING.windup?-.15-.8*smooth(time/FISHING_CAST_TIMING.windup):-.95*(1-smooth((time-FISHING_CAST_TIMING.windup)/.7)),
  hop:Math.sin(hop*Math.PI)**2*3,
  travel:clamp((time-FISHING_CAST_TIMING.launch)/(FISHING_CAST_TIMING.land-FISHING_CAST_TIMING.launch)),
 };
}
