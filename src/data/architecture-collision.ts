/** Ground footprints only: eaves, roofs, shadows and grass never become walls. */
export function cottageSolidPoint(x:number,y:number,anchor:{x:number;y:number}):boolean{
 return x>=anchor.x-76&&x<=anchor.x+77&&y>=anchor.y-166&&y<=anchor.y-16;
}
export function cottageSolidTile(x:number,y:number,anchor:{x:number;y:number}):boolean{
 const left=anchor.x-76,right=anchor.x+77,top=anchor.y-166,bottom=anchor.y-16;
 return x*32<right&&(x+1)*32>left&&y*32<bottom&&(y+1)*32>top;
}
/** Stone bowl AND its opening are solid; the thin wooden front post is separate. */
export function wellFootprint(x:number,y:number,anchor:{x:number;y:number},scale:number):boolean{
 const sx=128+(x-anchor.x)/scale,sy=256+(y-anchor.y)/scale;
 return ((sx-128)/73)**2+((sy-188)/48)**2<=1||sx>=178&&sx<=196&&sy>=211&&sy<=245;
}
