/** Nomes dos lugares do vale, escolhidos pelo Junior (preview.41). Use sempre estes nomes. */
export const AREA_NAMES={
 property:'Propriedade Abandonada',
 forest:'Floresta Antiga',
 village:'Vila',
 cityForest:'Estrada da Cidade',
 fishingLake:'Lago da Cachoeira',
 openFields:'Campos Abertos',
 highland:'Platô da Nascente',
 survivorCamp:'Acampamento dos Sobreviventes',
 swamp:'Pântano',
 ruins:'Ruínas',
 railway:'Estação Ferroviária',
 coast:'Costa das Marés',
 mine:'Mina Antiga',
} as const;
export type AreaNameKey=keyof typeof AREA_NAMES;
