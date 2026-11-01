/** Find non-transparent pixels inside one atlas cell, retaining a sampling border. */
export function atlasTrimBounds(
  rgba: Uint8ClampedArray, atlasWidth: number,
  cell: {x:number;y:number;width:number;height:number},
): {x:number;y:number;width:number;height:number} | undefined {
  let left=cell.width,top=cell.height,right=-1,bottom=-1;
  for(let y=0;y<cell.height;y++) for(let x=0;x<cell.width;x++) {
    if(!rgba[((cell.y+y)*atlasWidth+cell.x+x)*4+3])continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<0)return undefined;
  left=Math.max(0,left-1);top=Math.max(0,top-1);
  right=Math.min(cell.width-1,right+1);bottom=Math.min(cell.height-1,bottom+1);
  return {x:left,y:top,width:right-left+1,height:bottom-top+1};
}
