/** Positive on dry land. Several broad lobes avoid a circular sand disc. */
export function lakeIslandLand(x:number,y:number):number {
 const dx=(x-29)/2.7,dy=(y-38)/1.8,angle=Math.atan2(dy,dx),radius=1+.12*Math.sin(angle*3+.6)+.07*Math.cos(angle*5-.4)+.04*Math.sin(angle*7);
 return(radius-Math.hypot(dx,dy))*1.8;
}
/** Small waves around a fixed mooring point; no drift away from the dock. */
export const lakeBoatMotion=(time:number)=>({y:Math.sin(time*.0013)*.55,rotation:Math.sin(time*.00085)*.007+Math.sin(time*.0017)*.002});
/** Coast blending must stay bounded even where the two shore ripples coincide. */
export function lakeBankBlend(distance:number,x:number,y:number):number {
 const island=Math.hypot((x-29)/2.7,(y-38)/1.8)<1.5;
 const width=island?.3+.045*Math.sin(x*.31+y*.23)+.035*Math.sin(y*.6-x*.19):.78+.18*Math.sin(x*.31+y*.23)+.13*Math.sin(y*.6-x*.19);
 return Math.max(0,Math.min(1,1-Math.abs(distance)/Math.max(.14,width)));
}
