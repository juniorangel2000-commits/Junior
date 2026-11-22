import type {RuinLandmark} from './ruins-story';

export const RUINS_CELLAR_SIZE={width:832,height:544};
export const RUINS_CELLAR_ENTRY={x:12,y:7};
export const RUINS_CELLAR_EXIT={x:12,y:3};
export const CELLAR_SEAL={x:599,y:286};
export const CELLAR_PAPERS={x:141,y:253};

const CELLAR_STRUCTURES=['back-wall','side-wall','sill','floor','stairs'] as const;
export const CELLAR_ART={
  shelf:{size:[124,89],pivot:.94,base:[-55,55,-15,4]},
  barrels:{size:[111,107],pivot:.90,base:[-47,48,-30,6]},
  desk:{size:[133,102],pivot:.94,base:[-58,59,-23,6]},
  lantern:{size:[22,36],pivot:.78,base:null},
  'broken-shelf':{size:[111,100],pivot:.93,base:[-48,49,-18,4]},
  sacks:{size:[83,76],pivot:.92,base:[-33,34,-20,5]},
  crates:{size:[89,88],pivot:.93,base:[-40,41,-19,4]},
  drain:{size:[57,53],pivot:.51,base:null},
  rubble:{size:[76,36],pivot:.88,base:[-31,31,-12,4]},
} as const;

type CellarProp=keyof typeof CELLAR_ART;
export const CELLAR_TEXTURES=[...CELLAR_STRUCTURES,...Object.keys(CELLAR_ART)];
export const CELLAR_PROPS:ReadonlyArray<readonly [CellarProp,number,number]>=[
  ['shelf',CELLAR_PAPERS.x,CELLAR_PAPERS.y],
  ['barrels',254,260],
  ['sacks',106,341],['crates',220,354],['rubble',284,382],
  ['broken-shelf',708,262],['desk',CELLAR_SEAL.x,CELLAR_SEAL.y],
  ['sacks',736,338],['crates',720,431],['barrels',650,451],
  ['rubble',103,468],['rubble',521,390],['drain',489,451],
  ['lantern',105,202],['lantern',312,210],['lantern',584,206],['lantern',759,219],
];

const papers:RuinLandmark={
  name:'Inventário do posto',
  text:'O registro diz “Selo do Desvio: sob guarda do encarregado”. Uma anotação manda devolver o selo à oficina assim que o rio baixasse.',
};
const seal:RuinLandmark={
  name:'Mesa do encarregado',
  text:'A cera no canto da mesa tem três pontas, com o mesmo desenho encontrado no mapa do desvio.',
  seal:true,
};
const solids=CELLAR_PROPS.flatMap(([kind,x,y])=>{
  const base=CELLAR_ART[kind].base;
  return base?[[x+base[0],x+base[1],y+base[2],y+base[3]]]:[];
});

export function createRuinsCellarLayout(){
  const water=()=>false;
  const blocked=(x:number,y:number):boolean=>{
    if(x<80||x>752||y<104||y>496)return true;
    if(y<214&&(x<362||x>438))return true;
    return solids.some(([left,right,top,bottom])=>x>left&&x<right&&y>top&&y<bottom);
  };
  const inspectNear=(x:number,y:number):RuinLandmark|undefined=>{
    if(Math.hypot(x-CELLAR_SEAL.x,y-CELLAR_SEAL.y)<63)return seal;
    if(Math.hypot(x-CELLAR_PAPERS.x,y-CELLAR_PAPERS.y)<62)return papers;
    return undefined;
  };
  return {water,inWater:water,blocked,inspectNear,allowsStep:(_from:{x:number;y:number},to:{x:number;y:number})=>!blocked(to.x,to.y)};
}
