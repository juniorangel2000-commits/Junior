/** Ground-level geometry shared by player movement and NPC navigation. */
export function pointInPolygon(x:number,y:number,points:readonly (readonly [number,number])[]):boolean{
 let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const[ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }return inside;
}
const cottageFootprint=[[-72,-105],[72,-105],[72,-27],[19,-27],[19,-37],[-19,-37],[-19,-27],[-72,-27]] as const;
/** Roof overhang, grass and steps are traversable; the doorway is recessed. */
export function cottageSolidPoint(x:number,y:number,anchor:{x:number;y:number}):boolean{
 return pointInPolygon(x-anchor.x,y-anchor.y,cottageFootprint);
}
export function cottageSolidTile(x:number,y:number,anchor:{x:number;y:number}):boolean{
 return [0,8,16,24,31].some(dx=>[0,8,16,24,31].some(dy=>cottageSolidPoint(x*32+dx,y*32+dy,anchor)));
}
/** Include the whole stone bowl/opening, plus the two grounded timber posts. */
export function wellFootprint(x:number,y:number,anchor:{x:number;y:number},scale:number):boolean{
 const sx=128+(x-anchor.x)/scale,sy=256+(y-anchor.y)/scale;
 return ((sx-124)/69)**2+((sy-185)/42)**2<=1
  ||((sx-128)/55)**2+((sy-160)/31)**2<=1
  ||sx>=174&&sx<=198&&sy>=199&&sy<=245
  ||sx>=59&&sx<=84&&sy>=191&&sy<=229;
}
