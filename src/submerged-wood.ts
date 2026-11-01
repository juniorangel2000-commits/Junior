import type Phaser from 'phaser';
/** Water colour gradually covers only the submerged ends, preserving the dry planks. */
export function submergedWood(scene:Phaser.Scene,sourceKey:string,key:string,rects:readonly (readonly [number,number,number,number])[],x:number,y:number,width:number,height:number,depth:number):void{
 if(!scene.textures.exists(key)){
  const source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const c=canvas.getContext('2d')!;
  for(const [rx,ry,rw,rh] of rects){
   c.save();c.beginPath();c.rect(rx,ry,rw,rh);c.clip();c.drawImage(source,0,0);c.restore();
  }
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  for(const [rx,ry,rw,rh] of rects)for(let py=ry;py<ry+rh;py++)for(let px=rx;px<rx+rw;px++){
   const i=(py*canvas.width+px)*4,t=Math.min(1,(py-ry)/Math.max(1,rh*.65));
   if(!pixels.data[i+3])continue;
   for(let k=0;k<3;k++)pixels.data[i+k]=pixels.data[i+k]*(1-t*.76)+[45,109,108][k]*t*.76;
   pixels.data[i+3]*=t*.88;
  }
  c.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas)!.setFilter(0);
 }
 scene.add.image(x,y,key).setOrigin(0).setDisplaySize(width,height).setDepth(depth).setData('submerged-wood',true);
}
