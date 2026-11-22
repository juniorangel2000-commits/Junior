type Base = readonly [left:number, right:number, top:number, bottom:number];
interface CoastArt {
  label:string;
  width:number;
  height:number;
  pivot:number;
  bases:readonly Base[];
  water:boolean;
}
const art=(label:string,width:number,height:number,bases:readonly Base[]=[],water=false,pivot=.96):CoastArt=>
  ({label,width,height,pivot,bases,water});
export const COAST_ART={
  'coast-hut':art('Abrigo dos pescadores',196,146,[[-83,83,-40,1]]),
  'coast-pier':art('Píer da enseada',460,112,[],true),
  'coast-boat':art('Barco encalhado',132,84,[[-55,54,-36,1]]),
  'coast-net-rack':art('Varal de redes',92,78,[[-36,-27,-7,2],[27,36,-7,2]]),
  'coast-broken-fence':art('Cerca desgastada',96,48,[[-42,42,-8,2]]),
  'coast-lantern':art('Lampião da costa',29,60,[[-6,6,-6,2]]),
  'coast-rocks':art('Rochas da maré',92,57,[[-39,39,-20,3]],true),
  'coast-driftwood':art('Madeira trazida pela maré',62,33,[[-21,21,-8,2]]),
  'coast-tall-grass':art('Capim das dunas',48,55),
  'coast-groundcover':art('Arbusto rasteiro costeiro',54,39),
  'coast-shells':art('Conchas e seixos',29,17),
  'coast-dune-grass':art('Capim baixo das dunas',45,36),
} as const;
export type CoastKind=keyof typeof COAST_ART;
export const COAST_KINDS=Object.keys(COAST_ART) as CoastKind[];
export const isCoastKind=(kind:string|undefined):kind is CoastKind=>!!kind&&Object.hasOwn(COAST_ART,kind);
