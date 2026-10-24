import Phaser from 'phaser';

/** New source PNGs stay intact. Crops are built once, with nearest-neighbor sampling. */
function cropCell(scene: Phaser.Scene, sourceKey: string, column: number, row: number, columns: number, rows: number): HTMLCanvasElement | undefined {
  if (!scene.textures.exists(sourceKey)) return;
  const source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  // Atlas rows are separated by authored transparent gutters, not exact grid fractions.
  const xs=sourceKey==='lake-rocks-source'?[0,457,833,1254]:sourceKey==='reference-trees-source'?[0,430,827,1254]:[0,438,868,1254];
  const ys=sourceKey==='lake-rocks-source'?[0,700,1254]:sourceKey==='reference-trees-source'?[0,577,1254]:[0,500,875,1254];
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
/** Separate complete silhouettes; fixed grid cuts used to clip one canopy. */
function treeSilhouettes(scene:Phaser.Scene):HTMLCanvasElement[]{
  if(!scene.textures.exists('reference-trees-source'))return [];
  const source=scene.textures.get('reference-trees-source').getSourceImage() as HTMLImageElement;
  const scan=document.createElement('canvas');scan.width=source.width;scan.height=source.height;
  const g=scan.getContext('2d',{willReadFrequently:true})!;g.drawImage(source,0,0);
  const pixels=g.getImageData(0,0,scan.width,scan.height).data,w=scan.width,h=scan.height;
  const pending=new Uint8Array(w*h),queue=new Int32Array(w*h),parts:Array<{x:number;y:number;image:HTMLCanvasElement}>=[];
  for(let i=0;i<pending.length;i++)pending[i]=pixels[i*4+3]>=160?1:0;
  for(let seed=0;seed<pending.length;seed++){
    if(!pending[seed])continue;pending[seed]=0;queue[0]=seed;let count=1,left=w,right=0,top=h,bottom=0;
    for(let at=0;at<count;at++){
      const point=queue[at],x=point%w,y=Math.floor(point/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(const next of [x>0?point-1:-1,x<w-1?point+1:-1,y>0?point-w:-1,y<h-1?point+w:-1])if(next>=0&&pending[next]){pending[next]=0;queue[count++]=next;}
    }
    if(count<5000)continue;
    const image=document.createElement('canvas');image.width=right-left+1;image.height=bottom-top+1;
    const paint=image.getContext('2d')!,result=paint.createImageData(image.width,image.height);
    for(let at=0;at<count;at++){const point=queue[at],i=((Math.floor(point/w)-top)*image.width+point%w-left)*4;result.data.set(pixels.subarray(point*4,point*4+4),i);result.data[i+3]=255;}
    paint.putImageData(result,0,0);parts.push({x:left,y:top,image});
  }
  return parts.sort((a,b)=>Math.floor(a.y/(h*.46))-Math.floor(b.y/(h*.46))||a.x-b.x).map(p=>p.image);
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
  const trees=treeSilhouettes(scene);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const source=trees.length===6?trees[row*3+col]:cropCell(scene,'reference-trees-source',col,row,3,2);if(!source)continue;
    fit(scene,`asset-${row?'pine':'tree'}-${col}`,source,208,264,256);
  }
  for(let i=0;i<6;i++){
    const source=cropCell(scene,'lake-rocks-source',i%3,Math.floor(i/3),3,2);
    if(source)fit(scene,`lake-rock-${i}`,source,128,128,124);
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
