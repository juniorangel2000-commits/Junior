import {FISHING_CAST_TIMING} from './fishing-cast-motion';
export const NET_SURFACE_SIZE={width:64,height:42} as const;
export function fishingNetMotion(seconds:number,travel:number){
 const t=Math.max(0,Math.min(1,travel)),settled=Math.max(0,seconds-FISHING_CAST_TIMING.land);
 return{width:NET_SURFACE_SIZE.width*(.22+t*.78),height:NET_SURFACE_SIZE.height*(.22+t*.78),rotation:t<1?-.22*(1-t):Math.sin(settled*.8)*.009,lift:t<1?0:Math.sin(settled*1.5)*.45,alpha:t<1?1:.82};
}
/** Keep the deployed rim on the water, including casts near a pier or bank. */
export function netFitsWater(x:number,y:number,water:(x:number,y:number)=>boolean):boolean {
 return [[0,0],[-28,0],[28,0],[0,-15],[0,15],[-20,-10],[20,-10],[-20,10],[20,10]].every(([dx,dy])=>water(x+dx,y+dy));
}
