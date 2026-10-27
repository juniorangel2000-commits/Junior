/** Ground footprints only: eaves, roofs, shadows and grass never become walls. */
export function cottageSolidPoint(x:number,y:number,anchor:{x:number;y:number}):boolean{
 const dx=x-anchor.x,dy=y-anchor.y;
 // The roof overhang is above the character, not a 166px invisible wall.
 if(dx< -76||dx>77||dy< -110||dy> -16)return false;
 const bevel=Math.max(0,8-Math.min(dy+110,-16-dy));
 return dx>=-76+bevel&&dx<=77-bevel;
}
export function cottageSolidTile(x:number,y:number,anchor:{x:number;y:number}):boolean{
 const left=anchor.x-76,right=anchor.x+77,top=anchor.y-110,bottom=anchor.y-16;
 return x*32<right&&(x+1)*32>left&&y*32<bottom&&(y+1)*32>top;
}
/** Stone bowl AND its opening are solid; the thin wooden front post is separate. */
export function wellFootprint(x:number,y:number,anchor:{x:number;y:number},scale:number):boolean{
 const sx=128+(x-anchor.x)/scale,sy=256+(y-anchor.y)/scale;
 return ((sx-128)/77)**2+((sy-184)/57)**2<=1
  ||sx>=178&&sx<=196&&sy>=207&&sy<=245
  ||sx>=60&&sx<=84&&sy>=183&&sy<=226;
}
