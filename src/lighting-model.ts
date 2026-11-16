import {dayMinutes} from './daylight-model';
/** Cor da luz em cada hora do dia (docs/construcoes/ILUMINACAO.md).
 * `ambient`: quanto de cada cor da cena chega à tela (1 = como foi desenhado).
 * `saturation` e `contrast`: 1 = sem mudança. `lamps`: força das luzes quentes (janelas,
 * lampiões, fogueiras, halo do personagem e vaga-lumes). `clouds`: sombra das nuvens no
 * chão. `pollen`: partículas na luz baixa do sol. Entre dois horários, a mistura é suave. */
export interface LightingState{ambient:[number,number,number];saturation:number;contrast:number;lamps:number;clouds:number;pollen:number;fireflies:number;vignette:number}
type Key=LightingState&{at:number};
const k=(at:number,ambient:[number,number,number],saturation:number,contrast:number,lamps:number,clouds:number,pollen:number,fireflies:number,vignette:number):Key=>({at,ambient,saturation,contrast,lamps,clouds,pollen,fireflies,vignette});
/** Madrugada e noite azuis e escuras; amanhecer rosado; dia claro; pôr do sol dourado. */
const KEYS:Key[]=[
 k(0,   [.25,.31,.52],.62,1.04,1,  0, 0,1, .34),
 k(270, [.27,.32,.52],.64,1.04,1,  0, 0,.8,.32),
 k(345, [.62,.50,.62],.82,1.02,.75,.3,.2,0,.22), // primeira luz, rosada
 k(400, [1.02,.86,.82],.98,1.03,.2,.7,.8,0,.14), // nascer do sol
 k(480, [1,.97,.92],1.04,1.03,0,  1, .4,0,.1),
 k(720, [1,1,.99],1.06,1.03,0,  1, 0, 0,.08),
 k(960, [1,.97,.9],1.07,1.04,0,  1, .3,0,.1),
 k(1065,[1.05,.9,.74],1.1,1.05,.15,.9,1, 0,.16), // hora dourada
 k(1125,[.9,.68,.6],1.04,1.05,.6,.6,.7,0,.22), // pôr do sol
 k(1180,[.44,.42,.62],.78,1.05,.95,.2,0, .6,.3),  // anoitecer
 k(1260,[.27,.32,.53],.64,1.04,1,  0, 0, 1, .34),
 k(1440,[.25,.31,.52],.62,1.04,1,  0, 0, 1, .34),
];
const smooth=(x:number)=>x*x*(3-2*x);
const NEUTRAL:LightingState={ambient:[1,1,1],saturation:1,contrast:1,lamps:0,clouds:0,pollen:0,fireflies:0,vignette:0};
/** `intensity` (0–1, opção do jogador) aproxima tudo do neutro. Dentro de casa a noite
 * fica bem mais clara (lareira e lampião) e não há nuvens nem pólen. Chuva: céu fechado,
 * cores mais apagadas, sem nuvens correndo, pólen nem vaga-lumes. */
/** `indoors`: true na casa (bem clara à noite); 'shelter' nos abrigos dos animais, que
 * escurecem à noite e dependem do lampião. */
export function lightingAt(time:number,intensity=1,indoors:boolean|'shelter'=false,rain=false):LightingState{
 const t=dayMinutes(time),i=KEYS.findIndex(x=>x.at>t),a=KEYS[i-1],b=KEYS[i],x=smooth((t-a.at)/(b.at-a.at));
 const m=(p:number,q:number)=>p+(q-p)*x,s=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:1));
 let out:LightingState={ambient:[m(a.ambient[0],b.ambient[0]),m(a.ambient[1],b.ambient[1]),m(a.ambient[2],b.ambient[2])],saturation:m(a.saturation,b.saturation),contrast:m(a.contrast,b.contrast),
  lamps:m(a.lamps,b.lamps),clouds:m(a.clouds,b.clouds),pollen:m(a.pollen,b.pollen),fireflies:m(a.fireflies,b.fireflies),vignette:m(a.vignette,b.vignette)};
 if(rain)out={...out,ambient:[out.ambient[0]*.82,out.ambient[1]*.86,out.ambient[2]*.92],saturation:out.saturation*.8,clouds:0,pollen:0,fireflies:0,lamps:Math.min(1,out.lamps+.15)};
 if(indoors){const lift=indoors==='shelter'?.3:.7;out={...out,ambient:out.ambient.map(c=>c+(1-c)*lift) as [number,number,number],saturation:1+(out.saturation-1)*.4,clouds:0,pollen:0,fireflies:0,vignette:out.vignette*(indoors==='shelter'?1:.6),lamps:indoors==='shelter'?Math.max(out.lamps,.6):out.lamps*.6};}
 const mix=(n:number,v:number)=>n+(v-n)*s;
 return{ambient:[mix(1,out.ambient[0]),mix(1,out.ambient[1]),mix(1,out.ambient[2])],saturation:mix(1,out.saturation),contrast:mix(1,out.contrast),lamps:out.lamps*s,clouds:out.clouds*s,pollen:out.pollen*s,fireflies:out.fireflies*s,vignette:out.vignette*s};
}
export {NEUTRAL as NEUTRAL_LIGHTING};
