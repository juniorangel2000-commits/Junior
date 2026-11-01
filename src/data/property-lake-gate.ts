import type {MapEditData} from '../systems/map-editor';
/** East of the river and mountain, this grassy opening leads between the trees without painting a dirt road. */
export const propertyLakeApproach=(x:number,y:number)=>{
 if(y<0||y>18)return false;
 const t=y/18,center=75+.65*Math.sin(t*Math.PI)-.3*Math.sin(t*Math.PI*2),width=1.75+.3*Math.sin(y*.45);
 return Math.abs(x-center)<=width;
};
export function withPropertyLakePath(map?:MapEditData):MapEditData {
 const next:MapEditData=map?{...map,terrain:{...map.terrain}}:{version:1,width:96,height:72,terrain:{},objects:{}};
 // Keep the native grass. The sign and resource/tree clearance define the passage.
 return next;
}
