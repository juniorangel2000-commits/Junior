const {PNG}=require('pngjs'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'public/assets/visual/characters');
const sources={'farmer-male':'farmer-male.png','farmer-female':'farmer-female.png'};
module.exports=function prepare(work){const frames={};
function bounds(p,x,y,w,h,brown=false){let b=[w,h,0,0];for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=((y+j)*p.width+x+i)*4;if(p.data[k+3]>128&&(!brown||p.data[k]>p.data[k+1]*1.15&&p.data[k+1]>p.data[k+2]*1.1&&p.data[k]>30))b=[Math.min(b[0],i),Math.min(b[1],j),Math.max(b[2],i+1),Math.max(b[3],j+1)];}return b;}
for(const[id,file]of Object.entries(sources)){
 const original=path.join(root,'referencias/personagens/trabalho-refinado',id+'-'+work+'.png'),p=PNG.sync.read(fs.readFileSync(original));if(p.width!==1536||p.height!==1024)throw Error('Expected 24 authored 256px cells');
 // O retorno reutiliza exatamente o repouso para evitar troca de rosto no loop.
 for(let row=0;row<4;row++)PNG.bitblt(p,p,0,row*256,256,256,1280,row*256);
 for(let i=3;i<p.data.length;i+=4)p.data[i]=p.data[i]>=128?255:0;
 fs.writeFileSync(path.join(folder,id,'work-'+work+'.png'),PNG.sync.write(p));
 const front=PNG.sync.read(fs.readFileSync(path.join(folder,id,'Idle/rotations/south.png'))),a=bounds(front,0,0,256,256),b=bounds(p,0,0,256,256),scale=(a[3]-a[1])/(b[3]-b[1])/4;
 const rows=[];for(const[row,direction]of['south','north','east','west'].entries()){
  const ref=PNG.sync.read(fs.readFileSync(path.join(folder,id,'Idle/rotations',direction+'.png'))),refBounds=bounds(ref,0,0,256,256),refBoot=bounds(ref,60,refBounds[3]-8,140,8,true);
  const ownBounds=bounds(p,80,row*256,100,256),ownBoot=bounds(p,60,row*256+ownBounds[3]-8,140,8,true);
  const refFootX=60+(refBoot[0]+refBoot[2])/2,ownFootX=60+(ownBoot[0]+ownBoot[2])/2;
  const originX=(ownFootX-(refFootX-128)/4/scale)/256;
  const refOriginY=id==='farmer-male'?240:232;
  const originY=(ownBounds[3]+(refOriginY+12-refBounds[3])/4/scale)/256;
  rows.push({direction,originX,originY});
 }
 frames[id]={file:`assets/visual/characters/${id}/work-${work}.png`,scale,rows};
}
fs.writeFileSync(path.join(folder,'player-'+work+'.json'),JSON.stringify({frameWidth:256,frameHeight:256,columns:6,rows:4,characters:frames},null,2)+'\n');console.log(JSON.stringify(frames));

};
