export const WATER_ANIMATION = { frames:64, fps:16, tile:32, period:64 } as const;
/** Continuous, four-second loop sampled in world space; adjacent cells share the wave. */
export function waterSurfaceAlpha(frame:number,x:number,y:number):number {
  const tau=Math.PI*2,t=tau*((frame%WATER_ANIMATION.frames+WATER_ANIMATION.frames)%WATER_ANIMATION.frames)/WATER_ANIMATION.frames;
  const u=tau*x/64,v=tau*y/32;
  const ridge=Math.pow(Math.max(0,Math.cos(v+t+Math.sin(u-t)*.42)),18);
  const reflection=Math.pow(Math.max(0,Math.cos(u*2-v*.5-t)),14)*Math.pow(Math.max(0,Math.sin(v*.5+t)),6);
  return Math.round(255*(ridge*(.045+.015*Math.sin(u+t))+reflection*.075));
}
