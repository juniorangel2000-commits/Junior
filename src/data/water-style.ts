/** Approved forest finish (option 4), shared by every map and editor water. */
const SHALLOWS=[125,176,160] as const;
const smooth=(value:number):number=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export function waterFinishChannel(value:number,channel:number,shorePixels=-100):number {
 const shallow=smooth((shorePixels+28)/28)*.22;
 const depth=.9+.1*smooth((shorePixels+100)/100);
 return value*depth*(1-shallow)+SHALLOWS[channel]*shallow;
}
