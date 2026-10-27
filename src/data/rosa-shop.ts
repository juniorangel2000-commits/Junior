import {pointInPolygon} from './architecture-collision';
export const ROSA_SHOP={texture:'village-rosa-shop',file:'assets/visual/village/rosa/fachada.png',width:1536,height:1024,scale:.23,
 door:{x:770,y:820},foot:915/1024,chimney:{x:385,y:96},lamps:[{x:634,y:581},{x:906,y:580}],
 glass:[{x:305,y:573,width:171,height:129},{x:1044,y:574,width:188,height:131},{x:746,y:354,width:45,height:60}],
} as const;
const walls=[[160,494],[1371,494],[1371,816],[863,816],[863,787],[678,787],[678,817],[160,817]] as const;
const stock=[[60,751],[247,724],[507,760],[520,859],[283,884],[78,851]] as const;
const rightStock=[[1064,765],[1356,700],[1465,751],[1472,879],[1103,884]] as const;
export function rosaShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 const p={x:ROSA_SHOP.door.x+(x-(b.x+.5)*32)/ROSA_SHOP.scale,y:ROSA_SHOP.door.y+(y-(b.y*32+25))/ROSA_SHOP.scale};
 return pointInPolygon(p.x,p.y,walls)||pointInPolygon(p.x,p.y,stock)||pointInPolygon(p.x,p.y,rightStock);
}
