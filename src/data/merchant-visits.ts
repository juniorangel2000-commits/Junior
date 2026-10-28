import type {RoutineId} from '../systems/merchant-routine';
export interface MerchantVisitPlan {
 host:RoutineId;start:number;end:number;purpose:string;
 lines:readonly [string,string];
 workOrder:readonly number[];pause:number;
}
/** Different supply errands and conversations for each resident, every game day. */
export const MERCHANT_VISITS:Readonly<Record<RoutineId,MerchantVisitPlan>>={
 augusto:{host:'rosa',start:540,end:710,purpose:'Buscando sementes com Rosa',lines:['Rosa, quais sementes chegaram hoje?','Separei as melhores para o armazém.'],workOrder:[0,1,2,3],pause:7},
 bento:{host:'icaro',start:550,end:715,purpose:'Conferindo ferramentas com Ícaro',lines:['Ícaro, vamos conferir essas ferramentas?','Deixei as peças ajustadas na bancada.'],workOrder:[1,0,3,2],pause:9},
 rosa:{host:'amelia',start:825,end:970,purpose:'Conversando sobre plantas com Amélia',lines:['Amélia, o que acha destas mudas?','Com cuidado e água, vão crescer bem.'],workOrder:[2,0,3,1],pause:6},
 tobias:{host:'bento',start:970,end:1075,purpose:'Buscando ferragens com Bento',lines:['Bento, vim buscar as dobradiças.','Estão prontas. Testei cada uma.'],workOrder:[3,1,0,2],pause:10},
 amelia:{host:'helena',start:965,end:1075,purpose:'Levando ervas para Helena',lines:['Helena, trouxe ervas para o chá.','Vão aquecer a conversa dos hóspedes.'],workOrder:[0,2,1,3],pause:8},
 nilo:{host:'augusto',start:900,end:1070,purpose:'Trocando novidades com Augusto',lines:['Augusto, encontrou algo antigo nas entregas?','Guardei uma caixa para você examinar.'],workOrder:[1,3,2,0],pause:12},
 celina:{host:'nilo',start:560,end:718,purpose:'Pesquisando tecidos com Nilo',lines:['Nilo, procuro ideias para novos bordados.','Estes tecidos antigos podem inspirar você.'],workOrder:[2,3,0,1],pause:7.5},
 damiao:{host:'rosa',start:975,end:1078,purpose:'Buscando mantimentos com Rosa',lines:['Rosa, preciso de mantimentos para a pescaria.','Preparei uma cesta para sua viagem.'],workOrder:[3,0,2,1],pause:11},
 helena:{host:'celina',start:830,end:960,purpose:'Encomendando tecidos com Celina',lines:['Celina, preciso de toalhas para a pousada.','Vou escolher um tecido bem resistente.'],workOrder:[0,3,1,2],pause:6.5},
 icaro:{host:'tobias',start:815,end:965,purpose:'Ajustando uma bancada com Tobias',lines:['Tobias, podemos reforçar uma bancada?','Tenho madeira boa para esse reparo.'],workOrder:[1,2,0,3],pause:8.5},
};
