import {RUINS_ART, type RuinKind} from './ruins-art';
import type {RuinLandmark} from './ruins-story';

export const RUINS_CELLAR_SIZE={width:640,height:416};
export const RUINS_CELLAR_ENTRY={x:10,y:10};
export const RUINS_CELLAR_EXIT={x:10,y:11};
export const CELLAR_SEAL={x:482,y:221};
export const CELLAR_PROPS:ReadonlyArray<readonly [RuinKind,number,number]>=[
  ['ruin-corner',122,161],['ruin-wall-break',228,145],['ruin-corner',364,153],
  ['ruin-relief',501,151],['ruin-cargo',137,231],['ruin-urns',128,288],
  ['ruin-cargo',236,183],['ruin-pillar',265,276],['ruin-amphora',470,287],
  ['ruin-plinth',CELLAR_SEAL.x,CELLAR_SEAL.y],
  ['ruin-flagstones',319,191],['ruin-flagstones',353,311],['ruin-flagstones',432,249],
  ['ruin-steps',336,365],['ruin-rubble',523,320],
];
const cratePapers:RuinLandmark={
  name:'Inventário do posto',
  text:'O registro diz “Selo do Desvio: sob guarda do encarregado”. Uma anotação manda devolver o selo à oficina assim que o rio baixasse.',
};
const bronzeSeal:RuinLandmark={
  name:'Mesa do encarregado',
  text:'A cera no canto da mesa tem três pontas, com o mesmo desenho encontrado no mapa do desvio.',
  seal:true,
};
const solid=CELLAR_PROPS.flatMap(([kind,x,y])=>RUINS_ART[kind].bases.map(([a,b,c,d])=>[x+a,x+b,y+c,y+d] as const));

export function createRuinsCellarLayout(){
  const water=()=>false;
  const blocked=(x:number,y:number):boolean=>{
    if(x<61||x>579||y<139||y>385)return true;
    if(y>351&&(x<295||x>377))return true;
    return solid.some(([left,right,top,bottom])=>x>left&&x<right&&y>top&&y<bottom);
  };
  const inspectNear=(x:number,y:number):RuinLandmark|undefined=>{
    if(Math.hypot(x-CELLAR_SEAL.x,y-CELLAR_SEAL.y)<62)return bronzeSeal;
    if(Math.hypot(x-137,y-231)<55)return cratePapers;
    return undefined;
  };
  return {water,inWater:water,blocked,inspectNear,allowsStep:(_from:{x:number;y:number},to:{x:number;y:number})=>!blocked(to.x,to.y)};
}
