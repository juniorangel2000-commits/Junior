const fs=require('node:fs');
const base='public/assets/visual/fishing/catches/';
for(const [file,ids,bounds] of [
 ['fish',['lambari','tilapia','carpa','bagre','truta','dourado'],[[43,252,499,478],[534,212,991,504],[1023,222,1512,492],[19,608,511,870],[531,617,1003,861],[1027,592,1518,858]]],
 ['trash',['rusty-can','soaked-branch','old-boot','tangled-rope'],[[101,170,554,531],[722,140,1193,549],[52,686,622,1155],[690,747,1206,1180]]],
]){
 const png=fs.readFileSync(base+file+'.png'),width=png.readUInt32BE(16),height=png.readUInt32BE(20),fw=file==='fish'?512:627,fh=file==='fish'?320:627;
 // Targeted groups isolate each silhouette even in the viewport's letterbox space.
 // A viewBox alone exposes neighbouring atlas pixels above/below wide fish.
 const frames=ids.map((id,i)=>{const[l,t,r,b]=bounds[i],x=Math.max(0,l-4),y=Math.max(0,t-4),w=Math.min(width,r+4)-x,h=Math.min(height,b+4)-y;return{id,x,y,w,h};});
 const clips=frames.map(f=>`<clipPath id="${f.id}-clip"><rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"/></clipPath>`).join('');
 const groups=frames.map(f=>`<g class="catch" id="${f.id}"><svg width="${fw}" height="${fh}" viewBox="${f.x} ${f.y} ${f.w} ${f.h}"><g clip-path="url(#${f.id}-clip)"><use href="#atlas"/></g></svg></g>`).join('');
 fs.writeFileSync(base+file+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}" viewBox="0 0 ${fw} ${fh}"><style>.catch{display:none}.catch:target{display:inline}</style><defs><image id="atlas" width="${width}" height="${height}" href="data:image/png;base64,${png.toString('base64')}"/>${clips}</defs>${groups}</svg>\n`);
}
