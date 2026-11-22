import type {RuinLandmark} from './ruins-story';

/** Sala de espera da Estação Ferroviária: 26 × 17 ladrilhos, porta ao sul para a plataforma. */
export const RAILWAY_HALL_SIZE={width:832,height:544};
/** Chegada por dentro, diante do batente; a saída é o vão da porta no rodapé. */
export const RAILWAY_HALL_ENTRY={x:13,y:14};
export const RAILWAY_HALL_EXIT={x:13,y:16};
export const HALL_DOOR={left:384,right:448};
/** Linha da base da parede do fundo e limites do salão, em pixels. */
export const HALL_BACK=188, HALL_FRONT=512, HALL_LEFT=72, HALL_RIGHT=760;
/** Fim do assoalho de tábuas (atrás do balcão, à esquerda). */
export const HALL_BOARDS={left:HALL_LEFT,right:352,top:HALL_BACK-20,bottom:262};

type Piece={file:string;size:[number,number];base:readonly [number,number,number,number]|null;wall?:true;light?:true};
export const HALL_ART={
  window:{file:'janela-do-guiche',size:[112,123],base:null,wall:true},
  counter:{file:'balcao-de-bilhetes',size:[104,111],base:[-49,49,-26,3]},
  shelf:{file:'estante-de-papeis',size:[80,76],base:[-36,36,-18,3]},
  clock:{file:'relogio',size:[50,58],base:null,wall:true},
  timetable:{file:'quadro-de-horarios',size:[66,82],base:null,wall:true},
  lamp:{file:'lamparina',size:[17,37],base:null,wall:true,light:true},
  bench:{file:'banco-de-espera',size:[96,70],base:[-43,43,-18,3]},
  rack:{file:'prateleira-de-bagagem',size:[96,66],base:[-44,44,-16,3]},
  scale:{file:'balanca-de-bagagem',size:[58,67],base:[-25,25,-16,3]},
  trapdoor:{file:'alcapao',size:[84,54],base:null},
} as const satisfies Record<string,Piece>;
export type HallPiece=keyof typeof HALL_ART;
export const HALL_STRUCTURES=['parede-do-fundo','parede-lateral','rodape-frontal','ladrilho-antigo','tabuas-internas'] as const;
export const HALL_TEXTURES=[...HALL_STRUCTURES,...Object.values(HALL_ART).map(a=>a.file)];

export const HALL_COUNTER={x:236,y:262};
export const HALL_TIMETABLE={x:560,y:176};
export const HALL_PROPS:ReadonlyArray<readonly [HallPiece,number,number]>=[
  ['window',236,HALL_BACK-4],['counter',HALL_COUNTER.x,HALL_COUNTER.y],['shelf',122,236],
  ['clock',416,104],['timetable',HALL_TIMETABLE.x,HALL_TIMETABLE.y],
  ['lamp',338,128],['lamp',494,128],['lamp',700,128],
  ['bench',690,300],['bench',690,404],['bench',560,470],
  ['rack',128,356],['scale',116,452],['trapdoor',300,436],
];

const counter:RuinLandmark={name:'Bilheteria',text:'O caixa ainda guarda um maço de bilhetes amarelados. O último tem destino “Cidade”, mas nunca foi destacado.'};
const timetable:RuinLandmark={name:'Quadro de horários',text:'Os horários de partida foram riscados um por um. Embaixo, alguém escreveu a giz: “A linha volta quando a ponte for refeita.”'};
const solids=HALL_PROPS.flatMap(([kind,x,y])=>{const base=HALL_ART[kind].base;return base?[[x+base[0],x+base[1],y+base[2],y+base[3]] as const]:[];});

export function createRailwayHallLayout(){
  const water=()=>false;
  const blocked=(x:number,y:number):boolean=>{
    if(x<HALL_LEFT||x>HALL_RIGHT||y<HALL_BACK)return true;
    if(y>HALL_FRONT&&(x<HALL_DOOR.left||x>HALL_DOOR.right))return true;
    if(y>RAILWAY_HALL_SIZE.height-8)return true;
    // Atrás do balcão: passagem só pela ponta esquerda, junto da estante.
    if(y<HALL_COUNTER.y-8&&x>HALL_COUNTER.x-60&&x<HALL_COUNTER.x+60)return true;
    return solids.some(([left,right,top,bottom])=>x>left&&x<right&&y>top&&y<bottom);
  };
  const inspectNear=(x:number,y:number):RuinLandmark|undefined=>{
    if(Math.abs(x-HALL_COUNTER.x)<62&&y>HALL_COUNTER.y-4&&y<HALL_COUNTER.y+46)return counter;
    if(Math.abs(x-HALL_TIMETABLE.x)<46&&y>=HALL_BACK&&y<HALL_BACK+48)return timetable;
    return undefined;
  };
  return {water,inWater:water,blocked,inspectNear,allowsStep:(_from:{x:number;y:number},to:{x:number;y:number})=>!blocked(to.x,to.y)};
}
