import {WORLD_WIDTH,WORLD_HEIGHT} from '../data/world-size';
type TreeTile={x:number;y:number};
/** Soft canopy/root preference, rebuilt only when the live tree layout changes. */
export class TreeAvoidanceField {
 private signature='';
 private readonly cells=new Float32Array(WORLD_WIDTH*WORLD_HEIGHT);
 refresh(trees:readonly TreeTile[]):void {
  const signature=trees.map(t=>`${t.x},${t.y}`).join(';');if(signature===this.signature)return;
  this.signature=signature;this.cells.fill(0);
  for(const tree of trees)for(let y=Math.max(0,tree.y-5);y<=Math.min(WORLD_HEIGHT-1,tree.y+2);y++)for(let x=Math.max(0,tree.x-3);x<=Math.min(WORLD_WIDTH-1,tree.x+3);x++){
   // The crown extends above the foot in the game's top-down projection.
   const d=Math.hypot((x-tree.x)/2.6,(y-tree.y+1.25)/3.1);
   if(d>=1)continue;const index=y*WORLD_WIDTH+x;
   const root=Math.max(0,1-Math.hypot(x-tree.x,y-tree.y)/1.7)*1.8;
   this.cells[index]=Math.min(4,this.cells[index]+(1-d)*2.4+root);
  }
 }
 readonly cost=(x:number,y:number):number=>x>=0&&y>=0&&x<WORLD_WIDTH&&y<WORLD_HEIGHT?this.cells[Math.floor(y)*WORLD_WIDTH+Math.floor(x)]:4;
}
export const treeTiles=(nodes:readonly {kind:string;x:number;y:number}[]):TreeTile[]=>nodes.filter(n=>n.kind==='standingTree');
/** Painted natural ground is still habitat; built/cultivated floors remain clear. */
export function naturalPlantGround(terrain:string|undefined):boolean {
 return terrain===undefined||['grass','meadow','forest','moss'].includes(terrain);
}
