// Pack authored frames by translation only, preserving the original PNGs and pixels.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),source=process.argv[2];if(!source)throw Error('Usage: node scripts/import-cow-sprites.cjs extracted-package-folder');
const base=path.join(root,'public/assets/animals/cow'),meta=JSON.parse(fs.readFileSync(path.join(source,'metadata.json'))),state=meta.states.find(s=>s.folder==='Idle');
const directions=['south','west','east','north','south-west','south-east','north-west','north-east'],cell=192,columns=9,foot=46,records=[],heads=[],files=[];
for(const d of directions){files.push({file:state.frames.rotations[d],direction:d,action:'Idle'});for(const f of state.frames.animations.Walk[d])files.push({file:f,direction:d,action:'Walk'});}
const animations={};for(const action of ['Lie_Down','Rest_Cycle','Stand_Up']){animations[action]={};for(const d of ['south','west','east']){animations[action][d]=[];for(const f of state.frames.animations[action][d]){animations[action][d].push(files.length);files.push({file:f,direction:d,action});}}}
const atlas=new PNG({width:columns*cell,height:Math.ceil(files.length/columns)*cell}),torsoTargets={};
for(const [frame,entry]of files.entries()){
 const file=path.join(source,entry.file),bytes=fs.readFileSync(file),im=PNG.sync.read(bytes),x=(cell-im.width)/2,y=(cell-im.height)/2;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0)throw Error('Invalid canvas');PNG.bitblt(im,atlas,0,0,im.width,im.height,frame%columns*cell+x,Math.floor(frame/columns)*cell+y);
 let bottom=0,sumX=0,n=0;const pink=[];
 const dx=entry.direction.includes('east')?48:entry.direction.includes('west')?-48:0,dy=entry.direction==='north'?-35:entry.direction==='south'?25:entry.direction.includes('north')?-20:5;
 for(let py=0;py<im.height;py++)for(let px=0;px<im.width;px++){
  const i=(py*im.width+px)*4,r=im.data[i],g=im.data[i+1],b=im.data[i+2],a=im.data[i+3];if(a<128)continue;bottom=Math.max(bottom,py+y);
  const ax=px+x,ay=py+y,side=entry.direction==='east'?ax>=40&&ax<=112:entry.direction==='west'?ax>=80&&ax<=152:ax>=70&&ax<=122;
  if(side&&ay>=78&&ay<=138){sumX+=ax;n++;}
  if(r>150&&r-g>25&&b>65&&Math.abs(px-im.width/2-dx)<27&&Math.abs(py-im.height/2-dy)<23)pink.push([px,py]);
 }
 const tx=n?sumX/n:cell/2;if(entry.action==='Idle')torsoTargets[entry.direction]=tx;
 const adjust=frame<72?[0,0]:[Math.round((torsoTargets[entry.direction]-tx)*2)/2,cell/2+foot-bottom];
 let hx=pink.length?pink.reduce((s,p)=>s+p[0],0)/pink.length:im.width/2+dx,hy=pink.length?pink.reduce((s,p)=>s+p[1],0)/pink.length:im.height/2+dy;
 hx=Math.max(0,Math.min(im.width-1,Math.round(hx)));hy=Math.max(0,Math.min(im.height-1,Math.round(hy)));heads.push([hx+x-cell/2,hy+y-cell/2-foot]);
 const dest=path.join(base,entry.file);fs.mkdirSync(path.dirname(dest),{recursive:true});if(path.resolve(file)!==path.resolve(dest))fs.copyFileSync(file,dest);records.push({...entry,frame,width:im.width,height:im.height,x,y,adjust,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
if(path.resolve(source)!==path.resolve(base))fs.copyFileSync(path.join(source,'metadata.json'),path.join(base,'metadata.json'));fs.writeFileSync(path.join(base,'atlas.png'),PNG.sync.write(atlas));fs.writeFileSync(path.join(base,'atlas.json'),JSON.stringify({cell,columns,directions,animations,frames:records},null,2)+'\n');
const file=path.join(root,'src/data/animal-head-anchors.json'),anchors=JSON.parse(fs.readFileSync(file));anchors.cow=heads;fs.writeFileSync(file,JSON.stringify(anchors)+'\n');
fs.writeFileSync(path.join(root,'src/data/cow-poses.json'),JSON.stringify({animations,adjustments:records.map(f=>f.adjust)},null,2)+'\n');console.log('Cow:',files.length,'original frames, atlas',atlas.width,atlas.height);
