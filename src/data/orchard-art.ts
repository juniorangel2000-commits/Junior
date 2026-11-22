type Bounds = readonly [left:number,right:number,top:number,bottom:number];
export type OrchardFruit = 'apple'|'pear'|'orange';
type OrchardArt = {
  label:string;width:number;height:number;pivot:number;bases:readonly Bounds[];fruit?:OrchardFruit;tree?:true;
};
const trunk:Bounds=[-15,15,-10,4];
export const ORCHARD_ART={
  'orchard-apple':{label:'Macieira antiga',width:154,height:147,pivot:.96,bases:[trunk],fruit:'apple',tree:true},
  'orchard-pear':{label:'Pereira antiga',width:143,height:155,pivot:.96,bases:[trunk],fruit:'pear',tree:true},
  'orchard-orange':{label:'Laranjeira antiga',width:161,height:153,pivot:.96,bases:[trunk],fruit:'orange',tree:true},
  'orchard-dry-tree':{label:'Frutífera seca',width:153,height:152,pivot:.96,bases:[trunk],tree:true},
  'orchard-shed':{label:'Galpão do pomar',width:208,height:192,pivot:.97,bases:[[-82,82,-33,2]]},
  'orchard-press':{label:'Prensa antiga',width:126,height:108,pivot:.97,bases:[[-51,48,-29,2]]},
  'orchard-wall':{label:'Muro baixo de pedra',width:122,height:55,pivot:.94,bases:[[-57,57,-19,2]]},
  'orchard-crates':{label:'Caixotes de fruta',width:75,height:53,pivot:.96,bases:[[-29,28,-14,2]]},
} as const satisfies Record<string,OrchardArt>;
export type OrchardKind=keyof typeof ORCHARD_ART;
export const ORCHARD_KINDS=Object.keys(ORCHARD_ART) as OrchardKind[];
export const ORCHARD_FRUITS=['apple','pear','orange'] as const satisfies readonly OrchardFruit[];
export const orchardFruitFile=(fruit:OrchardFruit)=>`assets/visual/orchard/${fruit}.png`;
export const isOrchardKind=(kind:string|undefined):kind is OrchardKind=>!!kind&&Object.hasOwn(ORCHARD_ART,kind);
export const orchardArt=(kind:string|undefined):OrchardArt|undefined=>isOrchardKind(kind)?ORCHARD_ART[kind]:undefined;
