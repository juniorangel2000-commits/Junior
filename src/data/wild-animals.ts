import type {AnimalKind} from './ancient-forest';

/** Animais de criação soltos pelos cenários (preview.48). Só se conseguem com a corda.
 * Cada tipo tem uma lista fixa de ids (o save guarda quem já foi levado para casa). A cada
 * manhã, cada cenário sorteia quantos aparecem e em que pontos; quem já está na propriedade
 * sai do sorteio, e outro da mesma lista pode aparecer nos dias seguintes. */
export type WildArea='forest'|'openFields';
export interface WildGroup{readonly kind:AnimalKind;readonly ids:readonly string[];readonly min:number;readonly max:number;readonly spots:'pasture'|'river'|'forest'}
const ids=(prefix:string,from:number,to:number)=>Array.from({length:to-from+1},(_,i)=>`${prefix}-${from+i}`);

/** Os ids antigos (galinhas, cabras, vacas e ovelhas do Bosque; patos e porcos que a Rosa vendia)
 * continuam valendo: saves com esses animais seguem válidos. */
export const WILD_GROUPS:Readonly<Record<WildArea,readonly WildGroup[]>>={
 forest:[
  {kind:'chicken',ids:['forest-chicken-1','forest-chicken-2',...ids('wild-chicken',3,6)],min:1,max:3,spots:'forest'},
  {kind:'goat',ids:['forest-goat-1','forest-goat-2',...ids('wild-goat',3,6)],min:1,max:2,spots:'forest'},
  {kind:'pig',ids:[...ids('farm-pig',1,4),...ids('wild-pig',5,6)],min:0,max:2,spots:'forest'},
 ],
 openFields:[
  {kind:'cow',ids:['forest-cow-1','forest-cow-2',...ids('wild-cow',3,6)],min:1,max:2,spots:'pasture'},
  {kind:'sheep',ids:['forest-sheep-1','forest-sheep-2',...ids('wild-sheep',3,6)],min:1,max:3,spots:'pasture'},
  {kind:'duck',ids:[...ids('farm-duck',1,4),...ids('wild-duck',5,6)],min:0,max:3,spots:'river'},
 ],
};
/** Pontos de aparecimento. Bosque em blocos (alcançáveis da entrada); Campos em px do mapa. */
export const WILD_SPOTS={
 forest:[[22,55],[25,57],[21,15],[25,17],[21,35],[24,37],[75,35],[78,38],[60,59],[61,52],[46,56],[50,55],[41,57],[57,51],[52,45],[43,43],[48,39],[30,52],[47,33],[27,48],[41,33]],
 pasture:[[2312,260],[2792,452],[488,548],[2024,548],[2216,740],[200,836],[1640,836],[2408,932],[1448,1028],[2120,1028],[200,1124],[2600,1124],[1256,1220],[1928,1316],[2792,1316],[1160,1508],[1736,1508],[2408,1508],[1448,1604],[2696,1604],[1928,1700],[1640,1796],[2216,1796],[1352,1988],[2408,1988]],
 river:[[1256,260],[1544,548],[1160,740],[1448,836],[872,932],[1256,1028],[488,1220],[776,1316],[392,1508]],
} as const;
export const WILD_ANIMAL_LIST:readonly {readonly id:string;readonly kind:AnimalKind;readonly area:WildArea}[]=
 (Object.entries(WILD_GROUPS) as [WildArea,readonly WildGroup[]][]).flatMap(([area,groups])=>groups.flatMap(g=>g.ids.map(id=>({id,kind:g.kind,area}))));
export const wildAnimal=(id:string)=>WILD_ANIMAL_LIST.find(a=>a.id===id);
