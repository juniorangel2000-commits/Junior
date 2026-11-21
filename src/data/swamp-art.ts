/** Arte modular usada pelo mapa e pela paleta do editor. */
export const SWAMP_ART = {
  'swamp-cypress': { label: 'Cipreste do pântano', width: 230, height: 248, pivot: .96, solid: true, water: false },
  'swamp-willow': { label: 'Salgueiro', width: 266, height: 212, pivot: .96, solid: true, water: false },
  'swamp-alder': { label: 'Amieiro', width: 154, height: 186, pivot: .96, solid: true, water: false },
  'swamp-stump': { label: 'Toco oco', width: 72, height: 63, pivot: .93, solid: true, water: false },
  'swamp-cattails': { label: 'Taboas', width: 56, height: 57, pivot: .94, solid: false, water: false },
  'swamp-sedges': { label: 'Juncos baixos', width: 53, height: 40, pivot: .94, solid: false, water: false },
  'swamp-log': { label: 'Tronco encharcado', width: 102, height: 56, pivot: .74, solid: true, water: false },
  'swamp-stones': { label: 'Pedras de brejo', width: 66, height: 47, pivot: .86, solid: true, water: true },
  'swamp-lilies': { label: 'Ninfeias', width: 63, height: 47, pivot: .65, solid: false, water: true },
  'swamp-iris': { label: 'Íris azul', width: 41, height: 47, pivot: .9, solid: false, water: false },
  'swamp-boardwalk': { label: 'Passarela de brejo', width: 550, height: 106, pivot: .47, solid: false, water: true },
  'swamp-frog': { label: 'Sapo', width: 29, height: 25, pivot: .88, solid: false, water: false },
  'swamp-caiman': { label: 'Jacaré', width: 93, height: 37, pivot: .5, solid: false, water: true },
} as const;
export type SwampKind = keyof typeof SWAMP_ART;
export const SWAMP_KINDS = Object.keys(SWAMP_ART) as SwampKind[];
export function isSwampKind(kind: string | undefined): kind is SwampKind {
  return !!kind && Object.hasOwn(SWAMP_ART, kind);
}
export const SWAMP_GROUND = ['sod', 'mud', 'peat', 'silt'] as const;
