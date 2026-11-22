import {MEADOW_PATCHES,type MeadowPatch} from '../data/open-fields';

// As moitas não mudam de lugar: só as células perto da câmera precisam ser visitadas.
const CELL=256;
const cells=new Map<string,MeadowPatch[]>();
for(const p of MEADOW_PATCHES){const key=`${Math.floor(p.x/CELL)},${Math.floor(p.y/CELL)}`;const bucket=cells.get(key)??[];bucket.push(p);cells.set(key,bucket);}
export function meadowPatchesInRect(left:number,top:number,right:number,bottom:number):MeadowPatch[]{
 const result:MeadowPatch[]=[];
 for(let y=Math.floor(top/CELL);y<=Math.floor(bottom/CELL);y++)for(let x=Math.floor(left/CELL);x<=Math.floor(right/CELL);x++){
  for(const p of cells.get(`${x},${y}`)??[])if(p.x>left&&p.x<right&&p.y>top&&p.y<bottom)result.push(p);
 }
 return result;
}
