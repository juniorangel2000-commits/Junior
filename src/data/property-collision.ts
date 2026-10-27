import {pointInPolygon} from './architecture-collision';
import {HOMESTEAD_HOUSE} from './property-homestead';
/** The property facade has a low front wall and broad side posts. Keep the
 * player outside these silhouettes; only the central doorstep is recessed. */
export const PROPERTY_HOUSE_FOOTPRINT=[[-90,-135],[90,-135],[90,8],[25,8],[25,-4],[-25,-4],[-25,8],[-90,8]] as const;
export function propertyHouseSolidPoint(x:number,y:number):boolean{
 return pointInPolygon(x-HOMESTEAD_HOUSE.x,y-HOMESTEAD_HOUSE.groundY,PROPERTY_HOUSE_FOOTPRINT);
}
export function propertyHouseSolidTile(x:number,y:number):boolean{
 return [0,8,16,24,31].some(dx=>[0,8,16,24,31].some(dy=>propertyHouseSolidPoint(x*32+dx,y*32+dy)));
}
