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
export const HALL_BOARDS={left:HALL_LEFT,right:344,top:HALL_BACK,bottom:275};

type Piece={file:string;size:[number,number];base:readonly [number,number,number,number]|null;wall?:true;floor?:true;light?:true};
export const HALL_ART={
  counter:{file:'bilheteria-fechada',size:[112,116],base:[-52,52,-25,2]},
  clock:{file:'relogio-de-pendulo',size:[27,51],base:null,wall:true},
  timetable:{file:'horarios-gastos',size:[72,58],base:null,wall:true},
  lamp:{file:'lampiao-frontal',size:[17,43],base:null,wall:true,light:true},
  bench:{file:'banco-frontal',size:[112,64],base:[-50,50,-16,2]},
  brokenBench:{file:'banco-quebrado',size:[104,60],base:[-46,46,-15,2]},
  rack:{file:'estante-de-malas',size:[106,55],base:[-49,49,-19,2]},
  scale:{file:'balanca-frontal',size:[42,71],base:[-18,18,-17,2]},
  grate:{file:'grade-de-manutencao',size:[60,28],base:null,floor:true},
  rubble:{file:'reboco-caido',size:[42,24],base:[-13,13,-9,0]},
  tickets:{file:'bilhetes-rasgados',size:[32,21],base:null,floor:true},
  trunk:{file:'mala-antiga',size:[47,31],base:[-20,20,-12,1]},
  mat:{file:'tapete-rasgado',size:[82,46],base:null,floor:true},
  bucket:{file:'balde-de-incendio',size:[25,25],base:[-9,9,-9,1]},
  planks:{file:'ripas-caidas',size:[63,34],base:[-22,22,-11,1]},
  cracks:{file:'rachaduras-e-poeira',size:[103,42],base:null,floor:true},
} as const satisfies Record<string,Piece>;
export type HallPiece=keyof typeof HALL_ART;
export const HALL_WALL_PANELS=['parede-com-heras','parede-descascada','parede-descascada','parede-com-guiche'] as const;
export const HALL_STRUCTURES=['parede-com-heras','parede-descascada','parede-com-guiche','lambril-frontal','porta-da-plataforma','rodape-de-pedra'] as const;
export const HALL_TEXTURES=[...HALL_STRUCTURES,...Object.values(HALL_ART).map(a=>a.file)];
export const HALL_FLOORS=['ladrilho-antigo','tabuas-internas'] as const;

export const HALL_COUNTER={x:236,y:262};
export const HALL_TIMETABLE={x:560,y:176};
export const HALL_PROPS:ReadonlyArray<readonly [HallPiece,number,number]>=[
  ['counter',HALL_COUNTER.x,HALL_COUNTER.y],['rack',132,220],['scale',139,334],
  ['clock',411,154],['timetable',HALL_TIMETABLE.x,HALL_TIMETABLE.y],
  ['lamp',173,148],['lamp',349,151],['lamp',605,152],
  ['bench',673,249],['brokenBench',650,370],['bench',618,463],
  ['trunk',184,352],['trunk',687,462],['bucket',96,395],['planks',119,472],
  ['rubble',709,221],['rubble',111,487],['rubble',724,471],
  ['grate',301,431],['mat',416,503],
  ['tickets',277,284],['tickets',641,389],['cracks',312,374],['cracks',683,440],
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
    // O guichê está fechado. O trecho sob a estrutura e atrás do balcão fica fora da circulação.
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
