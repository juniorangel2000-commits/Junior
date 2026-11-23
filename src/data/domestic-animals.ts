import {FOREST_ANIMALS,type AnimalKind} from './ancient-forest';
import {WILD_ANIMAL_LIST} from './wild-animals';
import {HORSE_ID} from '../systems/horse-taming';
/** Animais que podem pertencer ao jogador: os da Floresta Antiga e o cavalo domado
 * dos Campos Abertos. O cavalo nunca vai para a Floresta. */
/** Patos da criação (ids da época em que a Rosa vendia; hoje soltos nos Campos). Não são os patos do lago. */
export const FARM_DUCKS=[1,2,3,4].map(n=>({id:`farm-duck-${n}`,kind:'duck' as AnimalKind}));
/** Porcos da criação (ids da época em que a Rosa vendia; hoje soltos no Bosque). */
export const FARM_PIGS=[1,2,3,4].map(n=>({id:`farm-pig-${n}`,kind:'pig' as AnimalKind}));
/** Animais de raça do veterinário Jonas (preview.48): produzem sempre, no mínimo, na qualidade boa. */
export const BREED_ANIMALS=[...[1,2,3,4].map(n=>({id:`breed-chicken-${n}`,kind:'chicken' as AnimalKind})),...[1,2].map(n=>({id:`breed-goat-${n}`,kind:'goat' as AnimalKind})),...[1,2].map(n=>({id:`breed-cow-${n}`,kind:'cow' as AnimalKind}))];
export const isBreedAnimal=(id:string)=>id.startsWith('breed-');
const all=[...FOREST_ANIMALS,{id:HORSE_ID,kind:'horse' as AnimalKind},...FARM_DUCKS,...FARM_PIGS,...WILD_ANIMAL_LIST,...BREED_ANIMALS];
/** Todos os que podem pertencer ao jogador, sem repetir id (os animais soltos da preview.48 incluídos). */
export const DOMESTIC_ANIMALS:readonly {readonly id:string;readonly kind:AnimalKind}[]=all.filter((a,i)=>all.findIndex(b=>b.id===a.id)===i).map(a=>({id:a.id,kind:a.kind}));
export const domesticAnimal=(id:unknown)=>DOMESTIC_ANIMALS.find(a=>a.id===id);
export const isDomesticAnimal=(id:unknown):id is string=>!!domesticAnimal(id);
