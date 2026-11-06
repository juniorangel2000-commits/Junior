const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');const dir=path.resolve(__dirname,'../public/assets/visual/farm');
const source='/workspace/generated_images/exec-c5f23772-6246-4e5a-b78f-347c2e396656.png',p=PNG.sync.read(fs.readFileSync(source));
const xs=[0,380,907,p.width],ys=[0,375,825,p.height],frames={};
for(let row=0;row<3;row++)for(const[col,kind]of['coop','barn','silo'].entries()){
 const x=xs[col],y=ys[row],w=xs[col+1]-x,h=ys[row+1]-y;let b=[w,h,0,0];for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(p.data[((y+j)*p.width+x+i)*4+3]>80)b=[Math.min(b[0],i),Math.min(b[1],j),Math.max(b[2],i+1),Math.max(b[3],j+1)];frames[kind+'-'+row]={x:x+b[0],y:y+b[1],width:b[2]-b[0],height:b[3]-b[1]};
 if(row===2){const f=frames[kind+'-'+row],o=new PNG({width:f.width,height:f.height});PNG.bitblt(p,o,f.x,f.y,f.width,f.height,0,0);fs.writeFileSync(path.join(dir,kind+'.png'),PNG.sync.write(o));}
}
fs.copyFileSync(source,path.join(dir,'buildings.png'));fs.writeFileSync(path.join(dir,'buildings.json'),JSON.stringify({file:'assets/visual/farm/buildings.png',frames},null,2)+'\n');
const hay=PNG.sync.read(fs.readFileSync('/workspace/generated_images/exec-87578f2a-3916-470a-bf28-4b0c4f4527ed.png')),icon=new PNG({width:128,height:128});for(let y=0;y<128;y++)for(let x=0;x<128;x++){const sx=Math.floor(x/128*hay.width),sy=Math.floor(y/128*hay.height),i=(sy*hay.width+sx)*4,j=(y*128+x)*4;for(let k=0;k<4;k++)icon.data[j+k]=hay.data[i+k];}fs.writeFileSync(path.join(dir,'hay.png'),PNG.sync.write(icon));
console.log(p.width,p.height,frames);
// Remove the generated matte from transparent edges before atlas registration.
for(let i=0;i<p.data.length;i+=4)if(p.data[i]>120&&p.data[i+1]<p.data[i]*.4&&p.data[i+2]<p.data[i]*.4)p.data[i+3]=0;
fs.writeFileSync(path.join(dir,'buildings.png'),PNG.sync.write(p));
for(const kind of ['barn','silo']){const f=frames[kind+'-2'],o=new PNG({width:f.width,height:f.height});PNG.bitblt(p,o,f.x,f.y,f.width,f.height,0,0);fs.writeFileSync(path.join(dir,kind+'.png'),PNG.sync.write(o));}
const open=PNG.sync.read(fs.readFileSync('/workspace/generated_images/exec-6f7df777-020f-4acd-8970-ccacd8ae1cbe.png'));for(let i=0;i<open.data.length;i+=4)if(open.data[i]>120&&open.data[i+1]<open.data[i]*.4&&open.data[i+2]<open.data[i]*.4)open.data[i+3]=0;
fs.writeFileSync(path.join(dir,'coop.png'),PNG.sync.write(open));

// The current item art is maintained with the authoring source in the repository.
require('./prepare-hay-sprite.cjs');
