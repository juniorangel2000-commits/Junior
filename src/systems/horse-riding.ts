import type {SaveData} from '../types';
import {HORSE_ID,horseTaming} from './horse-taming';
/** Montaria (docs/construcoes/MONTARIA.md). `save.riding` diz que o jogador está montado no
 * cavalo domado; o cavalo segue com ele por todos os cenários ao ar livre. */
export const ownsTamedHorse=(s:Pick<SaveData,'recruitedAnimals'|'horseTaming'>)=>!!s.recruitedAnimals?.includes(HORSE_ID)&&horseTaming(s as SaveData).tamed;
/** Motivo para não montar agora (vazio se pode). */
export function mountProblem(s:SaveData):string{
 if(!ownsTamedHorse(s))return 'Você ainda não tem um cavalo domado na Propriedade.';
 if(s.animalEscort)return 'Solte a corda antes de montar.';
 return '';
}
/** Cenários fechados: ao entrar, o jogador desce e o cavalo volta para a Propriedade. */
export const INDOOR_SCENES:readonly string[]=['Interior','Mina','Mineracao','Dungeons','Editor'];
export function validRiding(v:unknown,s:Record<string,unknown>):boolean{
 return v===undefined||v===true&&Array.isArray(s.recruitedAnimals)&&s.recruitedAnimals.includes(HORSE_ID);
}
