import Phaser from 'phaser';

/** New source PNGs stay intact. Crops are built once, with nearest-neighbor sampling. */
function cropCell(scene: Phaser.Scene, sourceKey: string, column: number, row: number, columns: number, rows: number): HTMLCanvasElement | undefined {
  if (!scene.textures.exists(sourceKey)) return;
  const source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  // Atlas rows are separated by authored transparent gutters, not exact grid fractions.
  const xs=sourceKey==='reference-trees-source'?[0,430,827,1254]:[0,438,868,1254];
  const ys=sourceKey==='reference-trees-source'?[0,577,1254]:[0,500,875,1254];
  const x=Math.floor((xs[column]??column*1254/columns)*source.width/1254);
  const y=Math.floor((ys[row]??row*1254/rows)*source.height/1254);
  const width=Math.floor(xs[column+1]*source.width/1254)-x,height=Math.floor(ys[row+1]*source.height/1254)-y;
  const scan=document.createElement('canvas');scan.width=width;scan.height=height;
  const ctx=scan.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(source,x,y,width,height,0,0,width,height);
  const image=ctx.getImageData(0,0,width,height);let left=width,top=height,right=-1,bottom=-1;
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const i=(py*width+px)*4;image.data[i+3]=image.data[i+3]>=160?255:0;
    if(!image.data[i+3])continue;
    left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
  }
  if(right<left)return;ctx.putImageData(image,0,0);
  const trimmed=document.createElement('canvas');trimmed.width=right-left+1;trimmed.height=bottom-top+1;
  trimmed.getContext('2d')!.drawImage(scan,left,top,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);
  return trimmed;
}
function fit(scene:Phaser.Scene,key:string,source:HTMLCanvasElement,width:number,height:number,ground=height-2):void {
  if(scene.textures.exists(key))return;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d')!;g.imageSmoothingEnabled=false;
  const scale=Math.min((width-4)/source.width,(ground-2)/source.height);
  const w=Math.round(source.width*scale),h=Math.round(source.height*scale);
  g.drawImage(source,Math.round((width-w)/2),ground-h,w,h);
  scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
export const REFERENCE_DETAILS = ['boulder','log','stump','fern','flowers','bush','shore','reeds','mushrooms'] as const;
export function setupReferenceNature(scene:Phaser.Scene):void {
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const source=cropCell(scene,'reference-trees-source',col,row,3,2);if(!source)continue;
    fit(scene,`asset-${row?'pine':'tree'}-${col}`,source,208,264,256);
  }
  REFERENCE_DETAILS.forEach((id,i)=>{
    const source=cropCell(scene,'reference-details-source',i%3,Math.floor(i/3),3,3);if(!source)return;
    fit(scene,`forest-detail-${id}`,source,128,128,124);
    const aliases:Partial<Record<typeof id,readonly [string,number,number]>>={
      boulder:['asset-stone',30,20],stump:['tree-stump',32,24],fern:['asset-fern',32,30],
      flowers:['asset-flowers-white',32,28],shore:['asset-shore-stones',38,22],
    };
    const alias=aliases[id];if(alias)fit(scene,alias[0],source,alias[1],alias[2]);
  });
}
