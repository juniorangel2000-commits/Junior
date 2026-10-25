export const WATER_ANIMATION = { frames:64, fps:16, tile:32, period:96 } as const;
/** Continuous, four-second loop sampled in world space; adjacent cells share the wave. */
export function waterSurfaceAlpha(frame:number,x:number,y:number):number {
  const tau=Math.PI*2,t=tau*((frame%WATER_ANIMATION.frames+WATER_ANIMATION.frames)%WATER_ANIMATION.frames)/WATER_ANIMATION.frames;
  const u=tau*x/WATER_ANIMATION.period,v=tau*y/(WATER_ANIMATION.period/2);
  const ridge=Math.pow(Math.max(0,Math.cos(v+t+Math.sin(u-t)*.42)),10);
  const reflection=Math.pow(Math.max(0,Math.cos(u*2-v*.5-t)),10)*Math.pow(Math.max(0,Math.sin(v*.5+t)),4);
  return Math.round(255*(ridge*(.12+.025*Math.sin(u+t))+reflection*.16));
}

/** The drawn water texture itself moves; highlights alone were too hard to see. */
export function animatedWaterRGB(frame:number,x:number,y:number,source?:{size:number;pixels:Uint8ClampedArray}):readonly number[] {
  const period=WATER_ANIMATION.period,tau=Math.PI*2;
  const t=tau*((frame%WATER_ANIMATION.frames+WATER_ANIMATION.frames)%WATER_ANIMATION.frames)/WATER_ANIMATION.frames;
  const u=tau*x/period,v=tau*y/period;
  const sx=x+Math.sin(t+v)*4.5+Math.sin(t*2+u)*1.25;
  const sy=y+Math.cos(t+u)*2.5+Math.sin(t-v)*1.5;
  const size=source?.size??period,wrap=(n:number)=>(n%size+size)%size;
  const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  const glow=waterSurfaceAlpha(frame,x,y)/255;
  return [0,1,2].map(c=>{
    const pixel=(px:number,py:number)=>source?.pixels[(wrap(py)*size+wrap(px))*4+c]??[48,130,138][c];
    const top=pixel(ix,iy)*(1-fx)+pixel(ix+1,iy)*fx,bottom=pixel(ix,iy+1)*(1-fx)+pixel(ix+1,iy+1)*fx;
    const base=top*(1-fy)+bottom*fy;
    return Math.round(base*(1-glow*.65)+[175,222,209][c]*glow*.65);
  });
}
