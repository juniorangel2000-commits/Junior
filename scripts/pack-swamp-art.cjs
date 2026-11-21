/** Extrai peças nativas do Pântano, preservando as folhas de origem. */
const fs = require('node:fs');
const { PNG } = require('pngjs');
const sources = 'referencias/cenarios/pantano/';
const output = 'public/assets/visual/swamp/';
const read = file => PNG.sync.read(fs.readFileSync(sources + file + '.png'));
const write = (file, image) => fs.writeFileSync(output + file + '.png', PNG.sync.write(image));

function gridBounds(image, cols, rows, index, inset = 0) {
  const col = index % cols, row = Math.floor(index / cols);
  return {
    left: Math.floor(col * image.width / cols) + inset,
    top: Math.floor(row * image.height / rows) + inset,
    right: Math.floor((col + 1) * image.width / cols) - inset,
    bottom: Math.floor((row + 1) * image.height / rows) - inset,
  };
}
function trim(image, { left, top, right, bottom }) {
  let x0 = right, x1 = left - 1, y0 = bottom, y1 = top - 1;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    if(image.data[(y*image.width+x)*4+3]<150)continue;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  }
  if(x1<x0)throw Error('Célula vazia na arte do Pântano');
  return {left:x0,top:y0,right:x1+1,bottom:y1+1};
}
function crop(image, {left,top,right,bottom}) {
  const out=new PNG({width:right-left,height:bottom-top});
  PNG.bitblt(image,out,left,top,out.width,out.height,0,0);
  for(let i=3;i<out.data.length;i+=4)if(out.data[i]<150)out.data[i]=0;
  return out;
}
function split(file,names,cols,rows,inset,transparent) {
  const source=read(file);
  names.forEach((name,index)=>{
    const region=gridBounds(source,cols,rows,index,inset);
    write(name,crop(source,transparent?trim(source,region):region));
  });
}
split('ground',['sod','mud','peat','silt'],2,2,12,false);
split('trees',['cypress','willow','alder','stump'],2,2,3,true);
split('props',['cattails','sedges','log','stones','lilies','iris'],2,3,20,true);
split('boardwalk',['boardwalk'],1,1,0,true);

const frames={};
for(const [id,rows,preferred] of [['frog',1,528],['caiman',4,320]]){
  const source=read(id),cells=Array.from({length:4*rows},(_,i)=>crop(source,trim(source,gridBounds(source,4,rows,i,3))));
  const side=Math.ceil(Math.max(preferred,...cells.map(p=>Math.max(p.width,p.height)+16))/16)*16;
  const atlas=new PNG({width:side*4,height:side*rows});
  cells.forEach((image,index)=>{
    const row=Math.floor(index/4),col=index%4;
    const dx=row===0&&id==='caiman'?side-image.width-12:row===2?12:Math.round((side-image.width)/2);
    const dy=id==='frog'?side-image.height-35:row===1?side-image.height-12:row===3?12:Math.round((side-image.height)/2);
    PNG.bitblt(image,atlas,0,0,image.width,image.height,col*side+dx,row*side+dy);
  });
  frames[id]=side;
  write(id,atlas);
}
fs.writeFileSync(output+'animals.json',JSON.stringify(frames,null,2)+'\n');
