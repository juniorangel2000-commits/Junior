const fs=require('node:fs');
const base='public/assets/visual/fishing/catches/';
for(const [file,cols,rows,ids] of [['fish',3,2,['lambari','tilapia','carpa','bagre','truta','dourado']],['trash',2,2,['rusty-can','soaked-branch','old-boot','tangled-rope']]]){
 const png=fs.readFileSync(base+file+'.png'),width=png.readUInt32BE(16),height=png.readUInt32BE(20),cw=width/cols,ch=height/rows;
 const bounds=file==='fish'?[[43,252,499,478],[22,212,512,504],[0,222,488,492],[19,96,510,358],[19,105,491,349],[4,80,494,346]]:[[101,170,554,530],[96,140,566,548],[53,59,621,527],[63,121,578,553]];
 const views=ids.map((id,i)=>{const [l,t,r,b]=bounds[i],pad=10,left=Math.max(0,l-pad),top=Math.max(0,t-pad),right=Math.min(cw,r+pad),bottom=Math.min(ch,b+pad);return `<view id="${id}" viewBox="${i%cols*cw+left} ${Math.floor(i/cols)*ch+top} ${right-left} ${bottom-top}"/>`;}).join('');
 fs.writeFileSync(base+file+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">${views}<image width="${width}" height="${height}" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`);
}
