import {pointInPolygon} from './architecture-collision';
export const AMELIA_SHOP={texture:'village-amelia-shop',file:'assets/visual/village/amelia/fachada.png',width:1536,height:1024,scale:.255,
 door:{x:628,y:860},foot:953/1024,chimney:{x:421,y:39},lamps:[{x:484,y:653},{x:768,y:650}],
 glass:[{x:570,y:327,width:126,height:92},{x:368,y:628,width:45,height:83},{x:901,y:466,width:390,height:113},{x:895,y:624,width:423,height:219}],
} as const;
const walls=[[249,530],[871,530],[871,866],[698,866],[698,831],[555,831],[555,866],[249,866]] as const;
const greenhouse=[[873,580],[1340,580],[1340,903],[873,903]] as const;
export function ameliaSourceSolid(x:number,y:number):boolean{
 return pointInPolygon(x,y,walls)||pointInPolygon(x,y,greenhouse)||((x-476)/57)**2+((y-896)/42)**2<=1||((x-762)/57)**2+((y-896)/42)**2<=1;
}
export function ameliaShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 return ameliaSourceSolid(AMELIA_SHOP.door.x+(x-(b.x+.5)*32)/AMELIA_SHOP.scale,AMELIA_SHOP.door.y+(y-(b.y*32+25))/AMELIA_SHOP.scale);
}
