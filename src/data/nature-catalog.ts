export const NATURE_KINDS = ['oakA','oakB','oakC','pineA','pineB','pineC','mossBoulder','fallenLog','stump','fern','whiteFlowers','bush','shoreStones','reeds','mushrooms','lakeRockA','lakeRockB','lakeRockC','lakeRockD','lakeRockE','lakeRockF'] as const;
export type NatureKind=typeof NATURE_KINDS[number];
export interface NatureArt {label:string;texture:string;width:number;height:number;pivot:number;solid:boolean;water:boolean}
const art=(label:string,texture:string,width:number,height=width,solid=false,water=false,pivot=124/128):NatureArt=>({label,texture,width,height,solid,water,pivot});
export const NATURE_ART:Record<NatureKind,NatureArt>={
 oakA:art('Frondosa I','asset-tree-0',166,211,true,false,256/264),oakB:art('Frondosa II','asset-tree-1',166,211,true,false,256/264),oakC:art('Frondosa III','asset-tree-2',166,211,true,false,256/264),
 pineA:art('Pinheiro I','asset-pine-0',166,211,true,false,256/264),pineB:art('Pinheiro II','asset-pine-1',166,211,true,false,256/264),pineC:art('Pinheiro III','asset-pine-2',166,211,true,false,256/264),
 mossBoulder:art('Pedra com musgo','forest-detail-boulder',52,52,true),fallenLog:art('Tronco caído','forest-detail-log',68,68,true),stump:art('Toco','forest-detail-stump',38,38,true),fern:art('Samambaia','forest-detail-fern',36),whiteFlowers:art('Flores brancas','forest-detail-flowers',30),bush:art('Arbusto','forest-detail-bush',45),shoreStones:art('Pedras da margem','forest-detail-shore',42,42,false,true),reeds:art('Juncos','forest-detail-reeds',46,46,false,true),mushrooms:art('Cogumelos','forest-detail-mushrooms',26),
 lakeRockA:art('Rocha musgosa','lake-rock-0',75,75,true,true),lakeRockB:art('Rocha alta','lake-rock-1',80,80,true,true),lakeRockC:art('Seixos agrupados','lake-rock-2',60,60,true,true),lakeRockD:art('Rocha submersa','lake-rock-3',80,80,true,true),lakeRockE:art('Dupla do lago','lake-rock-4',72,72,true,true),lakeRockF:art('Pedras baixas','lake-rock-5',56,56,true,true),
};
export function natureArt(kind:string|undefined):NatureArt|undefined{return kind&&Object.hasOwn(NATURE_ART,kind)?NATURE_ART[kind as NatureKind]:undefined;}
