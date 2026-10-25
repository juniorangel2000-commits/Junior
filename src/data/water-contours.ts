/** Smooth, asymmetric bays; radius/shore detail is independent of the tile grid. */
export function lakeDistance(x:number,y:number,cx:number,cy:number,rx:number,ry:number,seed:number):number {
  const nx=(x-cx)/rx,ny=(y-cy)/ry,r=Math.hypot(nx,ny);
  if(r>1.65)return (r-1)*Math.min(rx,ry);
  const a=Math.atan2(ny,nx);
  const profile=.92+.085*Math.sin(3*a+seed)+.055*Math.cos(5*a-seed*.7)+.065*Math.sin(2*a+seed*.4);
  const t=Math.max(0,Math.min(1,(r-1.1)/.55)),inside=Math.min(1,r/.6);
  const fade=(1-t*t*(3-2*t))*inside*inside*(3-2*inside);
  return (r-1+(1-profile)*fade)*Math.min(rx,ry);
}
