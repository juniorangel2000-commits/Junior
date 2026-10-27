/** Source coordinates, measured on the untouched 1254px building artwork. */
export const BLACKSMITH_HOUSE={
 source:'source-village-blacksmith',texture:'village-blacksmith-house',frontTexture:'village-blacksmith-house-front',size:1254,scale:.28,
 door:{x:310,y:1004},foot:1120/1254,
 chimneys:[{x:565,y:142},{x:983,y:260}],
 lamps:[{x:174,y:810},{x:846,y:660}],furnace:{x:970,y:752},
} as const;
const solids=[
 {x:140,y:746,w:448,h:258}, // Closed cottage.
 {x:690,y:670,w:470,h:220}, // Workshop rear wall and hanging tools.
 {x:870,y:760,w:205,h:160}, // Furnace masonry; the apron remains walkable.
 {x:650,y:640,w:60,h:365},{x:1144,y:640,w:60,h:370}, // Posts.
 {x:690,y:890,w:110,h:95}, // Workbench.
 {x:850,y:954,w:105,h:85}, // Anvil stump, rather than its overhanging head.
 {x:1030,y:925,w:125,h:130}, // Charcoal/tools along the right side.
] as const;
export function blacksmithLocalPoint(x:number,y:number,building:{x:number;y:number}){
 return{x:BLACKSMITH_HOUSE.door.x+(x-(building.x+.5)*32)/BLACKSMITH_HOUSE.scale,y:BLACKSMITH_HOUSE.door.y+(y-(building.y*32+25))/BLACKSMITH_HOUSE.scale};
}
export const blacksmithSourceSolid=(x:number,y:number)=>solids.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
export function blacksmithBlockedPoint(x:number,y:number,building:{x:number;y:number}):boolean{const p=blacksmithLocalPoint(x,y,building);return !(p.x>=264&&p.x<=356&&p.y>=980)&&blacksmithSourceSolid(p.x,p.y);}
