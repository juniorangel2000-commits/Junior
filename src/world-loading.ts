import horsePoses from './data/horse-poses.json';
import riderLift from './data/horse-rider-lift.json';
import {AREA_NAMES} from './data/area-names';
import {RIDER_ART,riderFile,riderPose} from './data/horse-rider-art';
/** Tela de carregamento (preview.41): a paisagem do destino em camadas que passam, na cor da
 * hora do dia, e a personagem montada galopando por uma trilha que é a própria barra de
 * progresso, levantando poeira. Embaixo, o passo da viagem e uma dica que se alterna. */
export interface WorldLoadingInfo{character?:string;area?:string;time?:number}
export type LoadingPeriod='morning'|'day'|'evening'|'night';
export const LOADING_PLACES:Record<string,string>=AREA_NAMES;
export const LOADING_TIPS:readonly string[]=[
 'Com o cavalo domado, aperte V perto dele para montar. Shift galopa.',
 'Regar todo dia e adubar aumentam a chance de colheita boa ou excelente.',
 'Faça carinho nos animais todo dia: amigos dão ovos e leite melhores.',
 'Produtos bons valem 1,25× mais; os excelentes, 1,5×.',
 'A tecla C abre a fabricação sem bancada; cada bancada tem as receitas dela.',
 'Montado, o cavalo não entra na água nem em lugares fechados.',
 'Encha o cocho dos abrigos antes de dormir para os animais comerem pela manhã.',
 'Ferramentas melhores no ferreiro podem ser refeitas depois na bancada de trabalho.',
 'Pratos feitos com ingredientes bons dão mais vigor.',
 'O cavalo acompanha você pelos caminhos ao ar livre do vale.',
];
/** Passo da viagem conforme o carregamento avança. */
export function loadingStep(progress:number):string{
 return progress<.25?'Selando o cavalo…':progress<.5?'Seguindo pela trilha…':progress<.8?'Passando pela porteira…':'Quase chegando…';
}
/** Hora do dia (minutos desde a meia-noite) para a cor do céu. */
export function loadingPeriod(time:number|undefined):LoadingPeriod{
 if(time===undefined)return'day';const h=(time/60)%24;
 return h<5.5||h>=20?'night':h<9?'morning':h<17?'day':'evening';
}

// Silhuetas do destino em SVG, repetidas na horizontal (largura 480).
const W=480,H=160;
const pine=(x:number,b:number,h:number)=>`M${x-h*.32},${b}L${x},${b-h}L${x+h*.32},${b}Z`;
const roundTree=(x:number,b:number,r:number)=>`M${x-1.5},${b}h3v${-r*.9}h-3Z M${x},${b-r*.9-r} m${-r},0 a${r},${r} 0 1,0 ${r*2},0 a${r},${r} 0 1,0 ${-r*2},0`;
const house=(x:number,b:number,w:number,h:number)=>`M${x},${b}v${-h}l${w/2},${-h*.7}l${w/2},${h*.7}v${h}Z`;
const hills=(b:number,amp:number,phase=0)=>{let d=`M0,${H}L0,${b}`;for(let x=0;x<=W;x+=40)d+=`Q${x+20},${b-amp*Math.sin((x+phase)/W*Math.PI*4)-amp} ${x+40},${b}`;return d+`L${W},${H}Z`;};
const peaks=(b:number,list:[number,number,number][])=>list.map(([x,w,h])=>`M${x-w},${b}L${x},${b-h}L${x+w},${b}Z`).join(' ');
function scenery(area:string):{far:string;near:string}{
 switch(area){
  case'forest':case'cityForest':case'survivorCamp':return{far:hills(120,10)+' '+[30,90,150,230,300,380,440].map((x,i)=>pine(x,122,60+(i%3)*14)).join(' '),
   near:hills(140,6,90)+' '+[10,70,120,200,260,330,410,460].map((x,i)=>pine(x,142,40+(i%2)*16)).join(' ')};
  case'fishingLake':case'highland':return{far:peaks(120,[[60,90,80],[200,110,105],[330,80,70],[440,100,90]])+` M0,${H}V120H${W}V${H}Z`,
   near:`M0,${H}V138H${W}V${H}Z `+[40,140,300,420].map(x=>roundTree(x,140,12)).join(' ')};
  case'village':return{far:hills(124,8)+' '+[40,110,190,270,350,430].map((x,i)=>house(x,126,30+(i%2)*8,22+(i%3)*5)).join(' '),
   near:hills(142,5,60)+' '+[20,160,300,400].map(x=>roundTree(x,144,11)).join(' ')};
  case'openFields':return{far:hills(118,12),near:hills(140,5,30)+' '+Array.from({length:40},(_,i)=>`M${i*12+4},146l2,-14l2,14Z`).join(' ')};
  default:return{far:hills(122,10)+' '+house(210,124,44,30)+' '+[60,120,330,420].map(x=>roundTree(x,124,14)).join(' '),
   near:hills(142,6,120)+' '+Array.from({length:16},(_,i)=>`M${i*30},140h3v-14h-3Z M${i*30-2},130h34v3h-34Z`).join(' ')};
 }
}
const svgLayer=(d:string,fill:string)=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><path fill='${fill}' d='${d}'/></svg>`)}")`;
/** No Lago, a faixa da frente é água. */
const WATER:Record<LoadingPeriod,string>={morning:'#6f9fbf',day:'#5a93bd',evening:'#6a5d86',night:'#22355a'};
const PALETTE:Record<LoadingPeriod,{sky:[string,string];far:string;near:string;ground:string}>={
 morning:{sky:['#f7d7a9','#a9cde3'],far:'#8fae7d',near:'#5e8150',ground:'#4b6a3f'},
 day:{sky:['#9fd0ef','#e3f2dc'],far:'#7fa66c',near:'#4f7a43',ground:'#3f6436'},
 evening:{sky:['#f2a56c','#6c4f7b'],far:'#6a5a5f',near:'#4a3f48',ground:'#3a3138'},
 night:{sky:['#101b33','#2c3c5e'],far:'#26324a',near:'#1a2337',ground:'#141b2a'},
};

type Atlas=Record<string,{frame:{x:number;y:number;w:number;h:number};spriteSourceSize:{x:number;y:number}}>;
/** Quadros do cavalo, lidos uma vez só (a tela aparece em toda troca de cenário). */
let cachedAtlas:Atlas|undefined;
/** Monta a tela dentro de `holder`. Devolve o controle do progresso; a animação para sozinha
 * quando a tela sai do documento. */
export function mountWorldLoading(holder:HTMLElement,label:string,info:WorldLoadingInfo={}):{setProgress(v:number):void}{
 const period=loadingPeriod(info.time),area=info.area??'property',pal=PALETTE[period],scene=scenery(area);
 const character=RIDER_ART.includes(info.character??'')?info.character!:RIDER_ART[0];
 holder.innerHTML=`<section class="world-loading wl" role="status" aria-live="polite" data-period="${period}">
  <div class="wl-sky"><span class="wl-sun"></span></div><div class="wl-stars"></div><div class="wl-layer wl-far"></div><div class="wl-layer wl-near"></div>
  <div class="wl-content"><div class="wl-card"><span class="wl-eyebrow">A caminho de</span><p class="wl-place"></p><h2></h2>
   <div class="wl-trail"><canvas width="560" height="150" aria-hidden="true"></canvas><div class="wl-path"><div class="wl-fill"></div></div></div>
   <progress class="wl-progress" max="1" value="0" aria-label="Carregamento dos recursos"></progress>
   <p class="wl-step">${loadingStep(0)}</p><p class="wl-tip"><strong>Dica</strong> <span></span></p></div></div></section>`;
 const root=holder.querySelector<HTMLElement>('.wl')!;
 root.querySelector('h2')!.textContent=label;root.querySelector('.wl-place')!.textContent=LOADING_PLACES[area]??LOADING_PLACES.property;
 root.style.setProperty('--wl-sky-a',pal.sky[0]);root.style.setProperty('--wl-sky-b',pal.sky[1]);root.style.setProperty('--wl-ground',area==='fishingLake'?WATER[period]:pal.ground);
 root.querySelector<HTMLElement>('.wl-far')!.style.backgroundImage=svgLayer(scene.far,pal.far);
 root.querySelector<HTMLElement>('.wl-near')!.style.backgroundImage=svgLayer(scene.near,pal.near);
 const tip=root.querySelector<HTMLElement>('.wl-tip span')!,step=root.querySelector<HTMLElement>('.wl-step')!,bar=root.querySelector<HTMLProgressElement>('progress')!,fill=root.querySelector<HTMLElement>('.wl-fill')!;
 let tipIndex=Math.floor(Math.random()*LOADING_TIPS.length);tip.textContent=LOADING_TIPS[tipIndex];
 let target=0,shown=0,lastTip=performance.now();
 // Cavalo galopando para a direita com a personagem por cima, nos quadros do jogo.
 const canvas=root.querySelector('canvas')!,ctx=canvas.getContext('2d');
 const horse=new Image(),rider=new Image();let atlas=cachedAtlas;
 const pose=riderPose(character,'right');
 horse.src='assets/animals/horse/atlas-packed.png';rider.src=riderFile(character);
 if(!atlas)fetch('assets/animals/horse/atlas-packed.json').then(r=>r.json()).then(j=>{atlas=cachedAtlas=j.frames;}).catch(()=>{});
 const run=horsePoses.Run.east;
 const dust:{x:number;y:number;life:number;r:number}[]=[];let last=performance.now(),distance=0;
 const draw=(now:number)=>{
  if(!root.isConnected)return;requestAnimationFrame(draw);
  const dt=Math.min(.05,(now-last)/1000);last=now;shown+=(target-shown)*Math.min(1,dt*4);
  fill.style.width=`${shown*100}%`;
  if(now-lastTip>5000){lastTip=now;tipIndex=(tipIndex+1)%LOADING_TIPS.length;tip.classList.remove('wl-in');void tip.offsetWidth;tip.textContent=LOADING_TIPS[tipIndex];tip.classList.add('wl-in');}
  if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
  const scale=.85,x=60+shown*(canvas.width-150),foot=canvas.height-6;distance+=dt*260;
  const frame=run[Math.floor(distance/26)%run.length];
  if(Math.random()<dt*28)dust.push({x:x-26,y:foot-2,life:1,r:2+Math.random()*3});
  for(const d of dust){d.life-=dt*1.6;d.x-=dt*40;d.y-=dt*8;}
  while(dust.length&&dust[0].life<=0)dust.shift();
  for(const d of dust){ctx.fillStyle=`rgba(214,186,140,${Math.max(0,d.life)*.55})`;ctx.beginPath();ctx.arc(d.x,d.y,d.r*(1.6-d.life*.6),0,Math.PI*2);ctx.fill();}
  // A célula do atlas tem 192 px com os cascos a 56 px abaixo do centro, como no jogo.
  const ox=x-96*scale,oy=foot-(96+56)*scale;
  const f=atlas?.[String(frame)];
  if(f&&horse.complete)ctx.drawImage(horse,f.frame.x,f.frame.y,f.frame.w,f.frame.h,ox+f.spriteSourceSize.x*scale,oy+f.spriteSourceSize.y*scale,f.frame.w*scale,f.frame.h*scale);
  if(f&&rider.complete&&rider.naturalWidth){const lift=Math.max(-6,Math.min(6,(riderLift as number[])[frame]??0));ctx.drawImage(rider,pose.sourceX,pose.sourceY,pose.width,pose.height,
   ox+pose.x*scale,oy+(pose.y-lift)*scale,pose.width*pose.scale*scale,pose.height*pose.scale*scale);}
 };
 requestAnimationFrame(draw);
 return{setProgress(v:number){target=Math.max(0,Math.min(1,v));bar.value=target;step.textContent=loadingStep(target);}};
}
