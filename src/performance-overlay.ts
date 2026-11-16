import type Phaser from 'phaser';
/** Contador de desempenho (F3): quadros por segundo, tempo do quadro mais lento,
 * imagens carregadas e a memória que elas ocupam na placa de vídeo, memória do
 * JavaScript e objetos do cenário atual. Serve para o Junior medir no próprio PC. */
export interface PerformanceSample{fps:number;worstFrameMs:number;textures:number;textureMB:number;heapMB?:number;objects:number;scenes:string[]}
/** Memória de vídeo estimada: largura × altura × 4 bytes de cada imagem carregada. */
export function textureMemory(game:Phaser.Game):{count:number;bytes:number}{
 let count=0,bytes=0;
 for(const key of game.textures.getTextureKeys()){
  const t=game.textures.get(key);count++;
  for(const s of t.source)bytes+=(s.width||0)*(s.height||0)*4;
 }
 return{count,bytes};
}
export function samplePerformance(game:Phaser.Game,frameTimes:readonly number[]):PerformanceSample{
 const active=game.scene.getScenes(true),{count,bytes}=textureMemory(game);
 const avg=frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:0;
 const heap=(performance as Performance&{memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize;
 return{fps:avg?Math.round(1000/avg):0,worstFrameMs:Math.round(Math.max(0,...frameTimes)),textures:count,textureMB:Math.round(bytes/1048576),
  heapMB:heap===undefined?undefined:Math.round(heap/1048576),objects:active.reduce((n,s)=>n+s.children.length,0),scenes:active.map(s=>s.scene.key)};
}
export function installPerformanceOverlay(game:Phaser.Game):void{
 const box=document.createElement('pre');box.className='performance-overlay';box.hidden=true;box.setAttribute('aria-live','off');
 Object.assign(box.style,{position:'fixed',top:'8px',left:'8px',zIndex:'9999',margin:'0',padding:'8px 10px',background:'rgba(24,16,8,.82)',color:'#f6ead0',font:'12px/1.45 monospace',borderRadius:'6px',pointerEvents:'none',whiteSpace:'pre'});
 document.body.append(box);
 const frames:number[]=[];let last=performance.now(),timer=0;
 const tick=(now:number)=>{frames.push(now-last);last=now;if(frames.length>120)frames.shift();if(!box.hidden)requestAnimationFrame(tick);};
 const render=()=>{const s=samplePerformance(game,frames);
  box.textContent=`FPS ${s.fps}  ·  quadro mais lento ${s.worstFrameMs} ms\nImagens ${s.textures}  ·  ${s.textureMB} MB na placa de vídeo\n`+(s.heapMB!==undefined?`JavaScript ${s.heapMB} MB\n`:'')+`Objetos ${s.objects}  ·  ${s.scenes.join(', ')||'menu'}\nF3 fecha`;};
 window.addEventListener('keydown',e=>{if(e.key!=='F3')return;e.preventDefault();box.hidden=!box.hidden;
  if(box.hidden){clearInterval(timer);return;}frames.length=0;last=performance.now();requestAnimationFrame(tick);render();timer=window.setInterval(render,500);});
}
