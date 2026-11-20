// Folhas laterais derivadas diretamente da animação de machadinha aprovada.
// Recorte/limpeza de alfa, sem reduzir a fonte de imagegen nem redesenhar o corpo.
const fs=require('fs'),{PNG}=require('pngjs'),{createHash}=require('crypto');
const chopping=JSON.parse(fs.readFileSync('public/assets/visual/characters/player-chopping.json')),characters={};
const hands={
 'farmer-male':[[[142,173],[180,118],[172,94],[155,185],[159,200],[142,173]],[[101,179],[63,117],[77,93],[78,187],[78,201],[101,179]]],
 'farmer-female':[[[151,188],[169,128],[157,89],[156,191],[155,199],[151,188]],[[81,190],[62,123],[76,94],[66,195],[67,202],[81,190]]]
};
let cell;
for(const id of ['farmer-male','farmer-female']){
 const bytes=fs.readFileSync(`referencias/personagens/ferramentas-corpo/${id}.png`),p=PNG.sync.read(bytes);
 if(p.width/6!==p.height/2)throw Error('Folha deve ter 6×2 células quadradas');cell=p.width/6;
 for(let i=3;i<p.data.length;i+=4)p.data[i]=p.data[i]>=200?255:0;
 // Só o componente do personagem em cada célula: descarta resíduos soltos do
 // removedor de ferramenta. Não modifica as cores nem preenche pixels do corpo.
 for(let row=0;row<2;row++)for(let col=0;col<6;col++){
  const seen=new Uint8Array(cell*cell);let largest=[];
  for(let n=0;n<seen.length;n++){
   if(seen[n])continue;seen[n]=1;const x=n%cell,y=Math.floor(n/cell),index=((row*cell+y)*p.width+col*cell+x)*4;
   if(!p.data[index+3])continue;
   const component=[n];for(let q=0;q<component.length;q++){
    const c=component[q],cx=c%cell,cy=Math.floor(c/cell);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||nx>=cell||ny<0||ny>=cell)continue;const k=ny*cell+nx;
     if(seen[k])continue;seen[k]=1;const i=((row*cell+ny)*p.width+col*cell+nx)*4;if(p.data[i+3])component.push(k);
    }
   }if(component.length>largest.length)largest=component;
  }
  const keep=new Set(largest);for(let n=0;n<seen.length;n++)if(!keep.has(n))p.data[((row*cell+Math.floor(n/cell))*p.width+col*cell+n%cell)*4+3]=0;
 }
 const factor=cell/256,grips=hands[id].map((poses,row)=>poses.map(([x,y],col)=>{
  const tx=Math.round(x*factor),ty=Math.round(y*factor);let best,score=Infinity;
  for(let dy=-14;dy<=14;dy++)for(let dx=-14;dx<=14;dx++){
   const px=tx+dx,py=ty+dy,i=((row*cell+py)*p.width+col*cell+px)*4;
   if(p.data[i+3]&&p.data[i]>150&&p.data[i]>p.data[i+1]+12&&p.data[i+1]>p.data[i+2]+12&&dx*dx+dy*dy<score){best=[px,py];score=dx*dx+dy*dy;}
  }if(!best)throw Error(`Mão ausente: ${id} ${row} ${col}`);return best;
 }));
 const file=`assets/visual/characters/${id}/work-body.png`,base=chopping.characters[id];
 fs.writeFileSync('public/'+file,PNG.sync.write(p));characters[id]={file,rows:base.rows.slice(2),hands:grips,scale:base.scale/factor,sourceSha256:createHash('sha256').update(bytes).digest('hex')};
}
fs.writeFileSync('public/assets/visual/characters/player-tool-body.json',JSON.stringify({frameWidth:cell,frameHeight:cell,characters},null,2)+'\n');
