/** Small abandoned side chamber; the ordinary pickaxe opens its stone neck. */
export const FORGOTTEN_GALLERY={x:18,y:88,rx:4.6,ry:3.6,neck:{left:22,right:24,top:87,bottom:89}}as const;
export const forgottenGalleryFloor=(x:number,y:number)=>((x-FORGOTTEN_GALLERY.x)/FORGOTTEN_GALLERY.rx)**2+((y-FORGOTTEN_GALLERY.y)/FORGOTTEN_GALLERY.ry)**2<1;
export const mineMissionSeal=(x:number,y:number)=>x>=22&&x<=24&&y>=87&&y<=89;
