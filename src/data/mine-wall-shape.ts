/** The renderer and collision tests use the same exposed-corner radius. */
export const MINE_WALL_RADIUS=12;
export function mineWallCorners(mask:number){
 const n=!!(mask&1),e=!!(mask&2),s=!!(mask&4),w=!!(mask&8);
 return{nw:!n&&!w?MINE_WALL_RADIUS:0,ne:!n&&!e?MINE_WALL_RADIUS:0,se:!s&&!e?MINE_WALL_RADIUS:0,sw:!s&&!w?MINE_WALL_RADIUS:0};
}
/** Continuous surface variation, periodic with the material atlas, avoids identical corner stamps. */
export function organicMineWallContains(x:number,y:number,mask:number,tileX:number,tileY:number):boolean{
 if(mask===15)return true;
 const wx=tileX*32+x,wy=tileY*32+y,tau=Math.PI*2;
 const edge=(along:number,across:number)=>Math.max(.2,1.1+.85*Math.sin(along*tau/64+across*tau/128)+.45*Math.sin(along*tau/128-across*tau/64));
 if(!(mask&1)&&y<edge(wx,tileY*32))return false;
 if(!(mask&2)&&32-x<edge(wy,(tileX+1)*32))return false;
 if(!(mask&4)&&32-y<edge(wx,(tileY+1)*32))return false;
 if(!(mask&8)&&x<edge(wy,tileX*32))return false;
 const radius=(cx:number,cy:number)=>Math.max(9,Math.min(15.5,MINE_WALL_RADIUS+.5+2.8*Math.sin((cx+cy)*tau/128)+1.4*Math.sin((cx*2-cy)*tau/256)));
 const corners=mineWallCorners(mask);
 if(corners.nw){const r=radius(tileX*32,tileY*32);if(x<r&&y<r&&Math.hypot(x-r,y-r)>r)return false;}
 if(corners.ne){const r=radius((tileX+1)*32,tileY*32);if(x>32-r&&y<r&&Math.hypot(x-(32-r),y-r)>r)return false;}
 if(corners.se){const r=radius((tileX+1)*32,(tileY+1)*32);if(x>32-r&&y>32-r&&Math.hypot(x-(32-r),y-(32-r))>r)return false;}
 if(corners.sw){const r=radius(tileX*32,(tileY+1)*32);if(x<r&&y>32-r&&Math.hypot(x-r,y-(32-r))>r)return false;}
 return true;
}

/** Concave corners complete the same contour on the floor side of a formation. */
export function organicMineFloorCornerRock(x:number,y:number,mask:number,tileX:number,tileY:number):boolean{
 const tau=Math.PI*2,radius=(cx:number,cy:number)=>Math.max(9,Math.min(15.5,MINE_WALL_RADIUS+.5+2.8*Math.sin((cx+cy)*tau/128)+1.4*Math.sin((cx*2-cy)*tau/256)));
 if((mask&9)===9){const r=radius(tileX*32,tileY*32);if(x<r&&y<r&&Math.hypot(x-r,y-r)>r)return true;}
 if((mask&3)===3){const r=radius((tileX+1)*32,tileY*32);if(x>32-r&&y<r&&Math.hypot(x-(32-r),y-r)>r)return true;}
 if((mask&6)===6){const r=radius((tileX+1)*32,(tileY+1)*32);if(x>32-r&&y>32-r&&Math.hypot(x-(32-r),y-(32-r))>r)return true;}
 if((mask&12)===12){const r=radius(tileX*32,(tileY+1)*32);if(x<r&&y>32-r&&Math.hypot(x-r,y-(32-r))>r)return true;}
 return false;
}
export const MINE_FLOOR_CORNER_MASKS=[3,6,9,12,7,11,13,14,15] as const;
