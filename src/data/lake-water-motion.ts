import type {MapEditData} from '../systems/map-editor';
import {paintedWaterPoint} from './terrain-paint';
import {lakeWater,lakeWaterDistance,lakePier,lakeBridge} from './fishing-lake';
export const LAKE_CASCADE={x:49.2*32,top:6.2*32,bottom:18.3*32,halfWidth:25} as const;
const fraction=(n:number)=>n-Math.floor(n);
export function lakeSurfaceMotion(time:number,edits?:MapEditData){
 const result:Array<{x:number;y:number;radius:number;alpha:number;lean:number}>=[];
 for(let i=0;i<112;i++){
  const phase=fraction(time*.00013+i*.618),x=(16+(i*17.31)%67)*32+Math.sin(time*.0003+i)*9,y=(20+(i*9.17)%42)*32+phase*12;
  if(lakeWaterDistance(x/32,y/32)>-1.1||lakePier(x/32,y/32)||lakeBridge(x/32,y/32)||!paintedWaterPoint(edits?.terrain,x,y,(px,py)=>lakeWater(px/32,py/32)))continue;
  result.push({x,y,radius:8+phase*18,alpha:Math.sin(phase*Math.PI)*(.1+(i%4)*.025),lean:Math.sin(i*1.9)*.12});
 }
 return result;
}
export function lakeCascadeMotion(time:number){
 const {x,top,bottom,halfWidth}=LAKE_CASCADE,fall=bottom-top;
 return Array.from({length:64},(_,i)=>{
  const phase=fraction(time*(.0009+(i%5)*.00004)+i*.38197),spread=Math.sin(i*2.39996)*halfWidth;
  return{x:x+spread*(.72+.28*phase)+Math.sin(phase*9+i)*1.3,y:top+phase*fall,length:10+(i%7)*3,width:i%4===0?2:1,alpha:(.14+.26*Math.sin(phase*Math.PI))*(1-Math.abs(spread)/halfWidth*.25)};
 });
}
export function lakeImpactMotion(time:number){
 return Array.from({length:28},(_,i)=>{
  const phase=fraction(time*.00065+i*.618),angle=i*2.39996,radius=12+phase*60;
  return{x:LAKE_CASCADE.x+Math.cos(angle)*radius,y:LAKE_CASCADE.bottom+8+Math.sin(angle)*radius*.3-Math.sin(phase*Math.PI)*(7+i%6),radius:.7+(i%3)*.45,alpha:Math.sin(phase*Math.PI)*.46};
 });
}
