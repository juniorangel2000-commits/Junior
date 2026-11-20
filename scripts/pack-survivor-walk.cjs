// Preserva a fonte e os pixels. Cada linha recebe um deslocamento fixo, sem
// recentralizar a silhueta a cada quadro (o movimento dos pés é intencional).
const fs=require('node:fs'),{PNG}=require('pngjs'),{createHash}=require('node:crypto');
const root='public/assets/visual/characters/survivors/';
const manifest={cell:256,rows:['south','north','east','west'],alphaCutoff:200,characters:{}};
function box(p,x0,y0,w,h){let l=x0+w,t=y0+h,r=x0-1,b=y0-1;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(p.data[(y*p.width+x)*4+3]>=200){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}if(r<l)throw Error('quadro vazio');return{x:l,y:t,width:r-l+1,height:b-t+1};}
for(const [id,columns] of [['marina',6],['rui',8]]){
 const bytes=fs.readFileSync(root+id+'-walk-source.png'),p=PNG.sync.read(bytes);
 const cellWidth=p.width/columns,cellHeight=p.height/4;
 if(cellWidth>256||cellHeight>256)throw Error(`${id}: célula maior que 256 px`);
 const out=new PNG({width:columns*256,height:4*256}),rows=[],heights=[];
 for(let row=0;row<4;row++){
  const bounds=Array.from({length:columns},(_,col)=>box(p,Math.floor(col*cellWidth),Math.floor(row*cellHeight),Math.floor((col+1)*cellWidth)-Math.floor(col*cellWidth),Math.floor((row+1)*cellHeight)-Math.floor(row*cellHeight)));
  const centers=bounds.map((b,c)=>b.x-Math.floor(c*cellWidth)+b.width/2).sort((a,b)=>a-b),shiftX=Math.round(128-(centers[columns/2-1]+centers[columns/2])/2),shiftY=232-Math.max(...bounds.map(b=>b.y-Math.floor(row*cellHeight)+b.height));
  for(let col=0;col<columns;col++){
   const b=bounds[col];heights.push(b.height);
   for(let y=0;y<Math.floor((row+1)*cellHeight)-Math.floor(row*cellHeight);y++)for(let x=0;x<Math.floor((col+1)*cellWidth)-Math.floor(col*cellWidth);x++){
    const dx=x+shiftX,dy=y+shiftY,s=((Math.floor(row*cellHeight)+y)*p.width+Math.floor(col*cellWidth)+x)*4;
    if(p.data[s+3]<200)continue;
    if(dx<0||dx>=256||dy<0||dy>=256)throw Error(`${id}: recorte cortaria o personagem`);
    const d=((row*256+dy)*out.width+col*256+dx)*4;p.data.copy(out.data,d,s,s+3);out.data[d+3]=255;
   }
  }
  rows.push({shiftX,shiftY,bounds});
 }
 const idle=PNG.sync.read(fs.readFileSync(root+id+'-south.png')),idleHeight=box(idle,0,0,idle.width,idle.height).height;
 heights.sort((a,b)=>a-b);const median=(heights[heights.length/2-1]+heights[heights.length/2])/2;
 fs.writeFileSync(root+id+'-walk.png',PNG.sync.write(out));
 manifest.characters[id]={columns,file:`assets/visual/characters/survivors/${id}-walk.png`,sourceSha256:createHash('sha256').update(bytes).digest('hex'),scale:idleHeight*.25/median,rows};
}
fs.writeFileSync(root+'walk.json',JSON.stringify(manifest,null,2)+'\n');
