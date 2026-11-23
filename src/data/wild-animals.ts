import type {AnimalKind} from './ancient-forest';

/** Animais de criação soltos pelos cenários (preview.48). Só se conseguem com a corda.
 * Cada tipo tem uma lista fixa de ids (o save guarda quem já foi levado para casa). A cada
 * manhã, cada cenário sorteia quantos aparecem e em que pontos; quem já está na propriedade
 * sai do sorteio, e outro da mesma lista pode aparecer nos dias seguintes. */
export type WildArea='forest'|'openFields'|'swamp'|'coast'|'orchard'|'ruins'|'railway';
export interface WildGroup{readonly kind:AnimalKind;readonly ids:readonly string[];readonly min:number;readonly max:number;readonly spots:WildSpot}
export type WildSpot='pasture'|'river'|'forest'|'swampOpen'|'swampShore'|'coastOpen'|'coastShore'|'orchard'|'ruins'|'railway';
/** Pontos em blocos (Bosque, Pântano, Costa); os dos Campos já estão em px. */
export const TILE_SPOTS:readonly WildSpot[]=['forest','swampOpen','swampShore','coastOpen','coastShore','orchard','ruins','railway'];
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
 // preview.48: o Pântano volta pelo Bosque e a Costa pelos Campos, com o animal na corda.
 swamp:[
  {kind:'duck',ids:ids('wild-duck',7,10),min:1,max:3,spots:'swampShore'},
  {kind:'pig',ids:ids('wild-pig',7,9),min:0,max:2,spots:'swampOpen'},
 ],
 coast:[
  {kind:'goat',ids:ids('wild-goat',7,9),min:0,max:2,spots:'coastOpen'},
  {kind:'chicken',ids:ids('wild-chicken',7,10),min:1,max:3,spots:'coastOpen'},
  {kind:'duck',ids:ids('wild-duck',11,12),min:0,max:1,spots:'coastShore'},
 ],
 // Pomar volta pela Vila; Ruínas pela Floresta da Cidade e a Vila; a Estação ainda passa pelas Ruínas.
 orchard:[
  {kind:'chicken',ids:ids('wild-chicken',11,13),min:1,max:2,spots:'orchard'},
  {kind:'pig',ids:ids('wild-pig',10,11),min:0,max:2,spots:'orchard'},
 ],
 ruins:[
  {kind:'goat',ids:ids('wild-goat',10,11),min:0,max:2,spots:'ruins'},
  {kind:'chicken',ids:ids('wild-chicken',14,15),min:1,max:2,spots:'ruins'},
 ],
 railway:[
  {kind:'goat',ids:ids('wild-goat',12,13),min:1,max:2,spots:'railway'},
  {kind:'chicken',ids:ids('wild-chicken',16,17),min:0,max:2,spots:'railway'},
 ],
};
/** Pontos de aparecimento. Bosque em blocos (alcançáveis da entrada); Campos em px do mapa. */
export const WILD_SPOTS={
 forest:[[22,55],[25,57],[21,15],[25,17],[21,35],[24,37],[75,35],[78,38],[60,59],[61,52],[46,56],[50,55],[41,57],[57,51],[52,45],[43,43],[48,39],[30,52],[47,33],[27,48],[41,33]],
 pasture:[[2312,260],[2792,452],[488,548],[2024,548],[2216,740],[200,836],[1640,836],[2408,932],[1448,1028],[2120,1028],[200,1124],[2600,1124],[1256,1220],[1928,1316],[2792,1316],[1160,1508],[1736,1508],[2408,1508],[1448,1604],[2696,1604],[1928,1700],[1640,1796],[2216,1796],[1352,1988],[2408,1988]],
 river:[[1256,260],[1544,548],[1160,740],[1448,836],[872,932],[1256,1028],[488,1220],[776,1316],[392,1508]],
 swampOpen:[[62,35],[27,35],[18,46],[9,57],[10,13],[81,37],[63,59],[37,48],[11,37],[82,61],[83,17],[74,28]],
 swampShore:[[29,15],[87,45],[55,49],[38,27],[42,55],[25,33],[56,28],[66,41],[44,13]],
 coastOpen:[[62,35],[53,46],[36,24],[90,26],[46,37],[37,48],[29,15],[83,17],[74,28],[22,6],[60,10],[51,21]],
 coastShore:[[32,42],[78,34],[53,48],[60,39],[38,56],[18,9],[31,49],[22,17]],
 orchard:[[44,57],[53,46],[62,35],[27,35],[36,24],[45,13],[10,13],[72,48],[81,37],[28,59],[46,37],[55,26],[11,37]],
 ruins:[[80,13],[71,24],[53,46],[45,13],[27,35],[18,46],[55,26],[46,37],[37,48],[28,59],[38,4],[29,15]],
 railway:[[80,13],[71,24],[62,35],[53,46],[44,57],[35,68],[45,13],[27,35],[18,46],[9,57],[10,13],[81,37],[72,48]],
} as const;
export const WILD_ANIMAL_LIST:readonly {readonly id:string;readonly kind:AnimalKind;readonly area:WildArea}[]=
 (Object.entries(WILD_GROUPS) as [WildArea,readonly WildGroup[]][]).flatMap(([area,groups])=>groups.flatMap(g=>g.ids.map(id=>({id,kind:g.kind,area}))));
export const wildAnimal=(id:string)=>WILD_ANIMAL_LIST.find(a=>a.id===id);

/** Cenários por onde um animal pode passar na corda (além dos Campos, que guardam a posição à parte). */
export const ROPE_AREAS=['forest','property','swamp','coast','orchard','ruins','railway','cityForest','village'] as const;
export type RopeArea=typeof ROPE_AREAS[number]|'openFields';
/** Caminho de cada cenário de origem até a propriedade, na ordem das passagens. */
export const ROPE_HOME_PATH:Readonly<Record<WildArea,readonly RopeArea[]>>={
 forest:['forest','property'],openFields:['openFields','property'],swamp:['swamp','forest','property'],coast:['coast','openFields','property'],
 orchard:['orchard','village','property'],ruins:['ruins','cityForest','village','property'],railway:['railway','ruins','cityForest','village','property'],
};
/** Cenário de origem do animal (os antigos do Bosque contam como Bosque). */
export const ropeOrigin=(id:string):WildArea=>wildAnimal(id)?.area??'forest';
/** O próximo cenário rumo à propriedade, a partir de onde ele está. */
export const ropeNext=(id:string,area:RopeArea):RopeArea|undefined=>{const p=ROPE_HOME_PATH[ropeOrigin(id)],i=p.indexOf(area);return i>=0?p[i+1]:undefined;};
/** O cenário anterior, rumo à origem: para onde ele corre se a corda for solta no caminho. */
export const ropeBack=(id:string,area:RopeArea):RopeArea|undefined=>{const p=ROPE_HOME_PATH[ropeOrigin(id)],i=p.indexOf(area);return i>0?p[i-1]:undefined;};
/** O animal pode estar na corda (ou parado) neste cenário? */
export const ropeAllowed=(id:string,area:RopeArea)=>ROPE_HOME_PATH[ropeOrigin(id)].includes(area);
/** "corre de volta para ___" */
export const ROPE_PLACE:Readonly<Record<RopeArea,string>>={forest:'o Bosque',property:'a propriedade',swamp:'o Pântano',coast:'a Costa',orchard:'o Pomar',ruins:'as Ruínas',railway:'a Estação',cityForest:'a Floresta da Cidade',village:'a Vila',openFields:'os Campos'};
