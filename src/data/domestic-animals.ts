import {FOREST_ANIMALS,type AnimalKind} from './ancient-forest';
import {HORSE_ID} from '../systems/horse-taming';
/** Animais que podem pertencer ao jogador: os da Floresta Antiga e o cavalo domado
 * dos Campos Abertos. O cavalo nunca vai para a Floresta. */
/** Patos da criação: comprados com a Rosa; moram no galinheiro. Não são os patos do lago. */
export const FARM_DUCKS=[1,2,3,4].map(n=>({id:`farm-duck-${n}`,kind:'duck' as AnimalKind}));
export const DOMESTIC_ANIMALS:readonly {readonly id:string;readonly kind:AnimalKind}[]=[...FOREST_ANIMALS,{id:HORSE_ID,kind:'horse'},...FARM_DUCKS];
export const domesticAnimal=(id:unknown)=>DOMESTIC_ANIMALS.find(a=>a.id===id);
export const isDomesticAnimal=(id:unknown):id is string=>!!domesticAnimal(id);
