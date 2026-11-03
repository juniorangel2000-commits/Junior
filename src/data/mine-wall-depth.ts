/** A two-cell visual face fades into hidden bedrock without a square back edge.
 * Ore and physical contact still belong only to the exposed front layer. */
export function mineWallLight(exposed:number,x:number,y:number,inner=false):number{
 const depth=Math.min(exposed&1?y:Infinity,exposed&2?32-x:Infinity,exposed&4?32-y:Infinity,exposed&8?x:Infinity)+(inner?32:0);
 return Math.max(0,Math.min(1,1-depth/64));
}
export function mineWallRefreshCells(cells:readonly{x:number;y:number}[]):{x:number;y:number}[]{
 const points=new Map<string,{x:number;y:number}>();for(const p of cells){points.set(p.x+','+p.y,p);if(cells.length>1)for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]]){const q={x:p.x+dx,y:p.y+dy};points.set(q.x+','+q.y,q);}}return[...points.values()];
}
