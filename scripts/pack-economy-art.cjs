/* Mechanical atlas extraction: preserve authored pixels; normalize transparent
 * padding, alpha halos and fixed pivots for Phaser's nearest-neighbour renderer. */
const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root='public/assets/visual/economy';fs.mkdirSync(root,{recursive:true});
const origins={materials:'docs/economia-6/arte/fontes/materiais-forja.png',tools:'docs/economia-6/arte/fontes/ferramentas.png',npcs:process.argv[2]??'docs/economia-6/arte/fontes/comerciantes.png'};
const manifest={sources:origins,files:[]};
const read=p=>PNG.sync.read(fs.readFileSync(p));
function cell(im,x0,y0,x1,y1){const p=new PNG({width:x1-x0,height:y1-y0});PNG.bitblt(im,p,x0,y0,p.width,p.height,0,0);return p;}
function bounds(im){let l=im.width,t=im.height,r=-1,b=-1;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}if(r<l)throw Error('Empty atlas cell');return {l,t,r,b};}
function emit(im,name,w=128,h=128,maxW=112,maxH=112,bottom=120,box=bounds(im)){
 const out=new PNG({width:w,height:h}),sw=box.r-box.l+1,sh=box.b-box.t+1,scale=Math.min(maxW/sw,maxH/sh),dw=Math.round(sw*scale),dh=Math.round(sh*scale),ox=Math.floor((w-dw)/2),oy=bottom-dh;
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const a=((box.t+Math.min(sh-1,Math.floor(y/scale)))*im.width+box.l+Math.min(sw-1,Math.floor(x/scale)))*4,b=((oy+y)*w+ox+x)*4;if(im.data[a+3]<180)continue;out.data[b]=im.data[a];out.data[b+1]=im.data[a+1];out.data[b+2]=im.data[a+2];out.data[b+3]=255;}
 const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,PNG.sync.write(out));manifest.files.push({file,width:w,height:h});return out;
}
const im=read(origins.materials),names=['icons/ironShard.png','icons/ironOre.png','icons/ironIngot.png','icons/goldShard.png','icons/goldOre.png','icons/goldIngot.png','icons/blackMetalShard.png','icons/blackMetalOre.png','icons/blackMetalIngot.png','deposits/iron.png','deposits/gold.png','deposits/blackMetal.png','forge/frame-0.png','forge/frame-1.png','forge/frame-2.png','forge/frame-3.png','icons/crown.png','icons/furniture.png','icons/doorKit.png','icons/windowKit.png','icons/fenceKit.png','icons/mushroom.png','workshop/anvil.png','workshop/tongs.png'];
const rows=[0,256,500,748,im.height];
for(let n=0;n<24;n++){const row=Math.floor(n/6),col=n%6,p=cell(im,col*256,rows[row],(col+1)*256,rows[row+1]);emit(p,names[n],128,128,n>=12&&n<=15?124:112,n>=12&&n<=15?124:112,124);}
fs.copyFileSync(path.join(root,'forge/frame-0.png'),path.join(root,'icons/forge.png'));manifest.files.push({file:path.join(root,'icons/forge.png'),width:128,height:128});
const tools=read(origins.tools);for(let row=0;row<4;row++)for(let col=0;col<5;col++)emit(cell(tools,Math.floor(col*tools.width/5),Math.floor(row*tools.height/4),Math.floor((col+1)*tools.width/5),Math.floor((row+1)*tools.height/4)),`tools/${['stone','iron','gold','blackMetal'][row]}-${['hatchet','pickaxe','hoe','sickle','shovel'][col]}.png`,128,128,104,112,120);
const anchors={};for(const material of ['stone','iron','gold','blackMetal'])for(const tool of ['hatchet','pickaxe','hoe','sickle','shovel']){const im=read(path.join(root,`tools/${material}-${tool}.png`)),centers=[];for(let y=99;y<=108;y++){const xs=[];for(let x=0;x<128;x++)if(im.data[(y*128+x)*4+3])xs.push(x);if(xs.length)centers.push((xs[0]+xs.at(-1))/2);}anchors[`${material}-${tool}`]={x:Math.round(centers.reduce((a,b)=>a+b,0)/centers.length),y:104};}fs.writeFileSync('src/data/tool-art-anchors.json',JSON.stringify(anchors,null,2));
// The generated sheet has uneven column spacing. Extract complete connected
// silhouettes instead of assuming equal cells (which clipped sleeves and hats).
if(origins.npcs){
 const npc=read(origins.npcs),seen=new Uint8Array(npc.width*npc.height),parts=[];
 for(let i=0;i<seen.length;i++){
  if(seen[i]||npc.data[i*4+3]<180)continue;
  const q=[i];seen[i]=1;let n=0,l=npc.width,r=0,t=npc.height,b=0;
  while(q.length){const a=q.pop(),x=a%npc.width,y=Math.floor(a/npc.width);n++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(const k of [x?a-1:-1,x<npc.width-1?a+1:-1,y?a-npc.width:-1,y<npc.height-1?a+npc.width:-1])if(k>=0&&!seen[k]&&npc.data[k*4+3]>=180){seen[k]=1;q.push(k);}
  }
  if(n>600)parts.push({n,l,r,t,b});
 }
 if(parts.length!==40)throw Error(`Expected 40 complete NPC poses; found ${parts.length}`);
 parts.sort((a,b)=>a.t-b.t);const ids=['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro'];
 for(let row=0;row<5;row++)for(const [col,box]of parts.slice(row*8,row*8+8).sort((a,b)=>a.l-b.l).entries()){
  const image=cell(npc,box.l,box.t,box.r+1,box.b+1);
  emit(image,`npcs/${ids[row*2+Math.floor(col/4)]}-${['down','left','up','right'][col%4]}.png`,192,256,160,220,244);
 }
}

fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));console.log(`Packed ${manifest.files.length} dedicated sprites.`);
