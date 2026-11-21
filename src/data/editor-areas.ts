export const EDITOR_AREAS = ['property','forest','village','cityForest','fishingLake','survivorCamp','highland','swamp','abandoned-central-square','mall-parking'] as const;
export type EditorArea = typeof EDITOR_AREAS[number];
export type StoredMapArea = Exclude<EditorArea,'property'>;
export const EDITOR_AREA_NAMES:Record<EditorArea,string>={property:'Propriedade Abandonada',forest:'Floresta Antiga',village:'Vila',cityForest:'Estrada da Cidade',fishingLake:'Lago da Cachoeira',survivorCamp:'Acampamento dos Sobreviventes',highland:'Platô da Nascente',swamp:'Pântano','abandoned-central-square':'Praça abandonada','mall-parking':'Estacionamento'};
export const isDungeonArea=(area:EditorArea):area is 'abandoned-central-square'|'mall-parking'=>area==='abandoned-central-square'||area==='mall-parking';
