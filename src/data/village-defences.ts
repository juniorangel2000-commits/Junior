export type BarricadeDirection='north'|'northeast'|'east'|'southeast'|'south'|'southwest'|'west'|'northwest';
export const VILLAGE_BARRICADES:readonly {x:number;y:number;direction:BarricadeDirection;blood?:boolean}[]=[
 {x:18,y:8,direction:'north'},{x:30,y:7,direction:'north',blood:true},
 {x:43,y:6,direction:'north'},{x:56,y:7,direction:'north'},
 {x:70,y:10,direction:'northeast'},{x:82,y:18,direction:'northeast',blood:true},
 {x:90,y:28,direction:'east'},{x:91,y:41,direction:'east'},
 {x:90,y:55,direction:'southeast',blood:true},{x:84,y:64,direction:'southeast'},
 {x:69,y:66,direction:'south'},{x:54,y:66,direction:'south'},
 {x:39,y:66,direction:'south',blood:true},{x:24,y:65,direction:'southwest'},
 {x:12,y:60,direction:'southwest'},{x:10,y:42,direction:'west'},
 {x:9,y:30,direction:'west',blood:true},{x:10,y:18,direction:'northwest'},
];
export function villageBarricadeBlockedPoint(x:number,y:number):boolean{
 return VILLAGE_BARRICADES.some(p=>{
  const dx=x-(p.x+.5)*32,dy=y-(p.y*32+25);
  if(p.direction==='east'||p.direction==='west')return Math.abs(dx)<12&&dy>=-40&&dy<=0;
  if(p.direction==='north'||p.direction==='south')return Math.abs(dx)<29&&dy>=-13&&dy<=0;
  return Math.abs(dx)<25&&dy>=-26&&dy<=0;
 });
}
