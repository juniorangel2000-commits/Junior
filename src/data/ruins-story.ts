import {weatherForDay} from '../weather-model';

export const RUINS_CLUES = {
  milestone: 'o marco da estrada',
  wagon: 'a carroça quebrada',
  workshop: 'a oficina em ruínas',
} as const;
export type RuinsClue = keyof typeof RUINS_CLUES;

export interface RuinLandmark {
  name: string;
  text: string;
  clue?: RuinsClue;
  map?: true;
  cellar?: true;
  seal?: true;
}

export const RUINS_HATCH_ID='ruin-hatch-65-31';
export const RUINS_WET_TRACK:RuinLandmark={name:'Marcas de roda',text:'A chuva escureceu a terra dentro dos sulcos. As rodas desviaram do pátio e pararam junto à escada do porão.'};
export const ruinsHasWetTraces=(day:number)=>weatherForDay(day)==='rain'||day>1&&weatherForDay(day-1)==='rain';

export const RUINS_LANDMARKS: Readonly<Record<string,RuinLandmark>> = {
  'ruin-waystone-18-8': {
    name:'Marco da estrada',
    text:'Sob o musgo está escrito “Posto de Descanso”. Uma linha menor foi riscada à pressa: “Na cheia, aguarde o sino antes de seguir.”',
    clue:'milestone',
  },
  'ruin-cart-16-15': {
    name:'Carroça quebrada',
    text:'O baú rachado guarda um recibo: “Última carga para a cidade. Remédios a bordo. Roda traseira presa, aguardando conserto.”',
    clue:'wagon',
  },
  'ruin-toll-9-14': {
    name:'Guichê abandonado',
    text:'Por esta janela conferiam as cargas. Ainda há entalhes onde o guarda ia marcando cada carroça que passava.',
  },
  'ruin-trough-16-26': {
    name:'Bebedouro de pedra',
    text:'Os cavalos descansavam aqui enquanto os viajantes esperavam o sino. A água da chuva ainda junta no fundo.',
  },
  'ruin-well-33-28': {
    name:'Poço antigo',
    text:'A pedra da borda cedeu de tanto puxarem o balde. Numa das fiadas há uma marca escura que fica bem acima do nível atual.',
  },
  'ruin-bell-41-24': {
    name:'Sino do entreposto',
    text:'A corda quebrou, mas o bronze ficou. Um toque chamava para a partida. Dois avisavam que o caminho estava fechado.',
  },
  'ruin-cistern-68-34': {
    name:'Cisterna em ruínas',
    text:'Ramos e folhas cobrem o fundo da cisterna. O último nível de água deixou uma mancha de barro no alto da parede.',
  },
  'ruin-facade-46-40': {
    name:'Oficina em ruínas',
    text:'Um bilhete preso junto à janela diz: “A última roda está pronta. Escondi o traçado do desvio sob o pedestal da praça baixa, onde a água ainda não chegou.”',
    clue:'workshop',
  },
  'ruin-sundial-56-56': {
    name:'Relógio de sol tombado',
    text:'No pedestal do relógio há uma data gravada. É a mesma que aparece no recibo da última carroça.',
  },
  'ruin-plinth-52-51': {
    name:'Pedestal entalhado',
    text:'Três figuras marcam a pedra: um marco de estrada, uma roda de carroça e uma bigorna. Por baixo delas há a fresta de um nicho.',
    map:true,
  },
  [RUINS_HATCH_ID]: {
    name:'Porão do armazém',
    text:'O portão de ferro tem um fecho de três pontas. No desenho do pedestal deve haver a indicação de como abrir.',
    cellar:true,
  },
};
