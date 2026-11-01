export const URBAN_PROP_KINDS=['urban-sedan','urban-hatchback','urban-van','urban-suv','urban-fountain','urban-bench-vertical','urban-bench','urban-lamp','urban-barrier','urban-bush','urban-drum','urban-supply','urban-bin'] as const;
export const VILLAGE_PROP_KINDS=['village-bench','village-lantern','village-barrel','village-flowerpot','village-woodpile','village-anvil','village-crates','village-sacks','village-basket','village-planter','village-bin','village-bench-north','village-bench-south','village-bench-east','village-bench-west','village-shrubs-white','village-shrubs-lilac'] as const;
export const EXTRA_PROP_KINDS=[...URBAN_PROP_KINDS,...VILLAGE_PROP_KINDS] as const;
export type ExtraPropKind=typeof EXTRA_PROP_KINDS[number];
export const EXTRA_PROP_NAMES:Record<ExtraPropKind,string>={
 'urban-sedan':'Carro sedan','urban-hatchback':'Carro compacto','urban-van':'Van','urban-suv':'SUV','urban-fountain':'Fonte urbana','urban-bench-vertical':'Banco vertical urbano','urban-bench':'Banco urbano','urban-lamp':'Poste urbano','urban-barrier':'Barreira','urban-bush':'Arbusto urbano','urban-drum':'Tambor','urban-supply':'Caixa de suprimentos','urban-bin':'Lixeira urbana',
 'village-bench':'Banco','village-lantern':'Poste da vila','village-barrel':'Barril','village-flowerpot':'Vaso','village-woodpile':'Pilha de lenha','village-anvil':'Bigorna','village-crates':'Caixotes','village-sacks':'Sacos','village-basket':'Cesto','village-planter':'Canteiro','village-bin':'Lixeira','village-bench-north':'Banco · norte','village-bench-south':'Banco · sul','village-bench-east':'Banco · leste','village-bench-west':'Banco · oeste','village-shrubs-white':'Arbustos brancos','village-shrubs-lilac':'Arbustos lilás',
};
export const URBAN_PROP_SIZES:Record<typeof URBAN_PROP_KINDS[number],readonly [number,number,boolean]>={
 'urban-sedan':[76,116,true],'urban-hatchback':[76,116,true],'urban-van':[76,116,true],'urban-suv':[76,116,true],
 'urban-fountain':[170,145,true],'urban-bench-vertical':[30,80,true],'urban-bench':[80,45,true],'urban-lamp':[70,140,true],
 'urban-barrier':[64,55,true],'urban-bush':[76,48,false],'urban-drum':[55,55,true],'urban-supply':[55,55,true],'urban-bin':[55,55,true],
};
