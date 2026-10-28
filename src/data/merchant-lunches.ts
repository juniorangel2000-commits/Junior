import type {RoutineId} from '../systems/merchant-routine';

export const MERCHANT_LUNCHES:Readonly<Record<RoutineId,{start:number;end:number}>>={
 augusto:{start:720,end:770},bento:{start:720,end:770},
 rosa:{start:760,end:810},amelia:{start:760,end:810},
 celina:{start:800,end:850},nilo:{start:800,end:850},
 tobias:{start:840,end:890},icaro:{start:840,end:890},
 damiao:{start:880,end:930},helena:{start:880,end:930},
};

export const PLAZA_CONVERSATIONS:readonly {
 pair:readonly [RoutineId,RoutineId];lines:readonly (readonly [string,string])[];
}[]=[
 {pair:['augusto','bento'],lines:[
  ['Bento, deixei seu pão separado no armazém.','Obrigado! Depois do almoço passo para buscar.'],
  ['Como anda o movimento na ferraria?','Hoje consegui terminar os reparos mais cedo.'],
 ]},
 {pair:['rosa','amelia'],lines:[
  ['Amélia, minhas mudas estão cheias de brotos.','A chuva ajudou. Vou levar algumas ervas para você.'],
  ['Nada como uma pausa perto da fonte.','E uma boa conversa para acompanhar.'],
 ]},
 {pair:['celina','nilo'],lines:[
  ['Nilo, aquele tecido antigo daria um belo bordado.','Guardei uma amostra para você ver com calma.'],
  ['Estou pensando em uma estampa com flores da vila.','Posso procurar desenhos antigos para inspirar você.'],
 ]},
 {pair:['tobias','icaro'],lines:[
  ['Ícaro, terminei o reforço daquela bancada.','Ótimo! Mais tarde levo as ferramentas.'],
  ['Essa sombra é boa para descansar os braços.','Concordo. A oficina pode esperar um pouco.'],
 ]},
 {pair:['damiao','helena'],lines:[
  ['Helena, amanhã devo trazer peixe fresco.','Vou preparar um prato especial na pousada.'],
  ['O vento está bom para a pescaria.','Então espero boas histórias no jantar!'],
 ]},
];

export const merchantLunchHours=(id:RoutineId)=>{
 const {start,end}=MERCHANT_LUNCHES[id];
 const format=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
 return {start:format(start),end:format(end)};
};
