import {FOREST_ANIMALS,type AnimalKind} from './ancient-forest';
import {HORSE_ID} from '../systems/horse-taming';
/** Animais que podem pertencer ao jogador: os da Floresta Antiga e o cavalo domado
 * dos Campos Abertos. O cavalo nunca vai para a Floresta. */
export const DOMESTIC_ANIMALS:readonly {readonly id:string;readonly kind:AnimalKind}[]=[...FOREST_ANIMALS,{id:HORSE_ID,kind:'horse'}];
export const domesticAnimal=(id:unknown)=>DOMESTIC_ANIMALS.find(a=>a.id===id);
export const isDomesticAnimal=(id:unknown):id is string=>!!domesticAnimal(id);
