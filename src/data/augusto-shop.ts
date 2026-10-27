/** Native facade supplied with Augusto's store, without cropping or repainting. */
export const AUGUSTO_SHOP={texture:'village-augusto-shop',file:'assets/visual/village/augusto/fachada.png',width:1101,height:655,scale:.32,
 door:{x:589,y:582},foot:640/655,chimney:{x:950,y:28},lamps:[{x:481,y:454},{x:692,y:454}],
 glass:[{x:510,y:220,width:59,height:55},{x:826,y:413,width:109,height:67}],
} as const;
export function augustoShopLocal(x:number,y:number,b:{x:number;y:number}){
 return{x:AUGUSTO_SHOP.door.x+(x-(b.x+.5)*32)/AUGUSTO_SHOP.scale,y:AUGUSTO_SHOP.door.y+(y-(b.y*32+25))/AUGUSTO_SHOP.scale};
}
export function augustoShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 const p=augustoShopLocal(x,y,b);
 // Only the ground-level walls and displays are solid. Keep the doorway and
 // its steps accessible; the roof is an overhang, never an invisible wall.
 const entrance=Math.abs(x-(b.x+.5)*32)<24&&y>=b.y*32+17;
 return !entrance&&(p.x>=456&&p.x<=1060&&p.y>=362&&p.y<=584||p.x>=35&&p.x<=421&&p.y>=452&&p.y<=617||p.x>=796&&p.x<=1073&&p.y>=553&&p.y<=620||p.x>=451&&p.x<=505&&p.y>=559&&p.y<=620||p.x>=684&&p.x<=741&&p.y>=551&&p.y<=618);
}
