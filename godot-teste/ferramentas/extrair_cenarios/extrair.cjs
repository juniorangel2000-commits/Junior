// Exporta um cenário do After Rain (Phaser) para o protótipo Godot:
// chão (imagem), objetos (arte + posição + profundidade), bloqueio e água (grade de 16 px).
// Uso: node extrair.cjs <area> <pasta-saida>
const fs=require('node:fs'),path=require('node:path');
const {start,goArea}=require('./comum.cjs');
(async()=>{
const [area,outRoot]=process.argv.slice(2);const out=path.join(outRoot,area);fs.mkdirSync(path.join(out,'arte'),{recursive:true});
const {b,page,errs}=await start();
await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;});
if(area!=='property')await goArea(page,area);
await page.evaluate(()=>{for(const s of game.scene.scenes)if(s.scene.isActive()&&s.scene.key!=='Vale'||s.scene.key==='Vale')s.time&&(s.time.paused=true);});
const meta=await page.evaluate(()=>{
 const sc=game.scene.scenes.filter(s=>s.scene.isActive()&&s.scene.key!=='Vale').sort((a,b)=>b.children.list.length-a.children.list.length)[0]??game.scene.getScene('Vale');
 window.__sc=sc;const cam=sc.cameras.main;const W=cam._bounds.width,H=cam._bounds.height;
 const player=sc.player?.sprite;
 const GROUND=-60;
 const ground=[],objs=[],skip={};
 for(const o of sc.children.list){
  if(!o.visible||o.alpha<=0.01||o.scrollFactorX===0||o===player)continue;
  const key=o.texture?.key??'';
  if(o.depth<=GROUND&&o.type!=='Sprite'&&o.type!=='Graphics'&&o.type!=='Container'){ground.push(o);continue;}
  if(o.type!=='Image'||!key||/^(solar-silhouette|__WHITE|__DEFAULT|__MISSING|ambient)/.test(key)||o.depth<0){skip[o.type+':'+key.replace(/[:|].*/,'')]=(skip[o.type+':'+key.replace(/[:|].*/,'')]||0)+1;continue;}
  const f=o.frame;
  objs.push({tex:key,frame:f.name,x:o.x,y:o.y,ox:o.originX,oy:o.originY,w:o.displayWidth,h:o.displayHeight,flipX:o.flipX,flipY:o.flipY,rot:o.rotation,alpha:o.alpha,depth:o.depth,tint:o.isTinted?o.tintTopLeft:null});
 }
 window.__ground=ground;window.__objs=objs;
 return {scene:sc.scene.key,W,H,objs:objs.length,ground:ground.map(o=>o.type+':'+(o.texture?.key??'')+'@'+o.depth),skip};
});
console.log(JSON.stringify({...meta,objs:meta.objs},null,0).slice(0,2000));
// Chão em blocos de 1024 px (evita texturas enormes no navegador).
const tiles=[];
for(let y=0;y<meta.H;y+=1024)for(let x=0;x<meta.W;x+=1024){
 const url=await page.evaluate(async([x,y])=>{const sc=window.__sc;const w=Math.min(1024,sc.cameras.main._bounds.width-x),h=Math.min(1024,sc.cameras.main._bounds.height-y);
  const rt=sc.make.renderTexture({width:w,height:h},false);rt.camera.setScroll(x,y);const list=[...window.__ground].sort((a,b)=>a.depth-b.depth);rt.draw(list);
  return await new Promise(r=>rt.snapshot(img=>{const u=img.src;rt.destroy();r(u);}));},[x,y]);
 const file=`chao-${x}-${y}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));tiles.push({x,y,file});
}
// Arte dos objetos: um PNG por textura+quadro.
const arts=await page.evaluate(()=>{const seen={};for(const o of window.__objs){const id=o.tex+'|'+o.frame;if(seen[id])continue;
 const tex=game.textures.get(o.tex),f=tex.get(o.frame);const c=document.createElement('canvas');c.width=f.cutWidth;c.height=f.cutHeight;const g=c.getContext('2d');
 g.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,f.cutWidth,f.cutHeight);seen[id]=c.toDataURL('image/png');}return seen;});
const names={};let n=0;
for(const [id,url] of Object.entries(arts)){const name=(id.replace(/\|__BASE$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'obj'+(n++)).slice(0,90)+'.png';names[id]=name;fs.writeFileSync(path.join(out,'arte',name),Buffer.from(url.split(',')[1],'base64'));}
const objs=await page.evaluate(()=>window.__objs);for(const o of objs){o.arte=names[o.tex+'|'+o.frame];}
// Bloqueio e água a cada 16 px (centro da célula).
const grid=await page.evaluate(()=>{const sc=window.__sc;const W=sc.cameras.main._bounds.width,H=sc.cameras.main._bounds.height;
 const blocked=sc.movementBlockedPoint??sc.blockedPoint??(sc.movementBlockedAt?((x,y)=>sc.movementBlockedAt(Math.floor(x/32),Math.floor(y/32))):null)??(sc.blockedTile?((x,y)=>sc.blockedTile(Math.floor(x/32),Math.floor(y/32))):null);
 const swim=sc.swimmingPoint;const cols=W/16,rows=H/16;let solid='',water='';
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=x*16+8,py=y*16+8;let s=false,w=0;try{s=!!blocked?.call(sc,px,py);}catch{}try{w=Number(swim?.call(sc,px,py))||0;}catch{}
  solid+=s?'1':'0';water+=String(Math.max(0,Math.min(9,Math.round(w*9))));}
 return {cols,rows,solid,water,hasBlocked:!!blocked,hasSwim:!!swim};});
fs.writeFileSync(path.join(out,'cenario.json'),JSON.stringify({area,scene:meta.scene,width:meta.W,height:meta.H,ground:tiles,objs,grid}));
console.log('ok',area,'objetos',objs.length,'artes',Object.keys(arts).length,'grade',grid.cols+'x'+grid.rows,'bloq',grid.hasBlocked,'agua',grid.hasSwim,'erros',errs.slice(0,3));
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
