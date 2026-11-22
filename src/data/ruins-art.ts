/** Dimensions and ground contact, in world pixels from each sprite's pivot. */
export const RUINS_ART = {
  'ruin-wall': { label: 'Muro baixo em ruínas', width: 132, height: 42, pivot: .94, bases: [[-63, 63, -10, 3]] },
  'ruin-corner': { label: 'Parede quebrada', width: 94, height: 96, pivot: .94, bases: [[-43, 43, -13, 3], [-40, -22, -26, -13]] },
  'ruin-arch': { label: 'Arco antigo', width: 166, height: 144, pivot: .95, bases: [[-76, -43, -13, 5], [46, 77, -13, 5]] },
  'ruin-rubble': { label: 'Montinho de escombros', width: 95, height: 43, pivot: .91, bases: [[-36, 39, -17, 4]] },
  'ruin-pillar': { label: 'Pilar entalhado', width: 43, height: 92, pivot: .94, bases: [[-19, 19, -13, 4]] },
  'ruin-plinth': { label: 'Pedestal quebrado', width: 103, height: 55, pivot: .91, bases: [[-48, 48, -25, 4]] },
  'ruin-well': { label: 'Poço de pedra', width: 89, height: 66, pivot: .91, bases: [[-30, 31, -26, 5]] },
  'ruin-facade': { label: 'Fachada da oficina', width: 147, height: 107, pivot: .94, bases: [[-68, 68, -16, 4]] },
  'ruin-waystone': { label: 'Marco da estrada', width: 38, height: 46, pivot: .94, bases: [[-15, 15, -8, 4]] },
  'ruin-steps': { label: 'Degraus gastos', width: 112, height: 47, pivot: .91, bases: [] },
  'ruin-storehouse': { label: 'Armazém sem teto', width: 176, height: 151, pivot: .94, bases: [[-83,-39,-14,5],[36,83,-14,5]] },
  'ruin-relief': { label: 'Parede com relevos', width: 155, height: 109, pivot: .94, bases: [[-72,73,-13,4]] },
  'ruin-cart': { label: 'Carroça quebrada', width: 108, height: 74, pivot: .88, bases: [[-47,42,-24,6]] },
  'ruin-flagstones': { label: 'Lajeado com musgo', width: 103, height: 94, pivot: .51, bases: [] },
  'ruin-urns': { label: 'Potes de barro', width: 57, height: 47, pivot: .90, bases: [[-23,25,-19,5]] },
  'ruin-sundial': { label: 'Relógio de sol tombado', width: 76, height: 70, pivot: .90, bases: [[-31,32,-13,6]] },
  'ruin-window': { label: 'Janela em ruínas', width: 59, height: 93, pivot: .94, bases: [[-26,27,-11,4]] },
  'ruin-hearth': { label: 'Lareira quebrada', width: 78, height: 94, pivot: .93, bases: [[-34,32,-15,6]] },
  'ruin-trough': { label: 'Bebedouro de pedra', width: 87, height: 50, pivot: .85, bases: [[-40,40,-29,7]] },
  'ruin-ring': { label: 'Fundação circular', width: 120, height: 95, pivot: .59, bases: [[-54,-27,-25,20],[22,55,-25,18],[-32,32,-43,-22],[-40,26,20,37]] },
  'ruin-wall-break': { label: 'Muro desmoronado', width: 122, height: 50, pivot: .93, bases: [[-57,56,-14,4]] },
  'ruin-gateposts': { label: 'Batentes do portão', width: 150, height: 102, pivot: .94, bases: [[-68,-31,-13,4],[27,68,-13,4]] },
  'ruin-cistern': { label: 'Cisterna em ruínas', width: 97, height: 65, pivot: .79, bases: [[-41,41,-39,10]] },
  'ruin-toll': { label: 'Guichê abandonado', width: 112, height: 104, pivot: .94, bases: [[-51,51,-17,5]] },
  'ruin-planter': { label: 'Canteiro de pedra', width: 91, height: 62, pivot: .83, bases: [[-38,37,-25,9]] },
  'ruin-bell': { label: 'Sino do entreposto', width: 90, height: 89, pivot: .94, bases: [[-41,41,-14,5]] },
  'ruin-bench': { label: 'Banco de pedra caído', width: 83, height: 48, pivot: .91, bases: [[-35,35,-16,5]] },
  'ruin-column-bases': { label: 'Bases de colunas', width: 121, height: 45, pivot: .91, bases: [[-56,-27,-12,5],[-20,18,-16,5],[28,57,-10,5]] },
  'ruin-marker': { label: 'Laje entalhada', width: 66, height: 40, pivot: .88, bases: [[-25,24,-12,4]] },
  'ruin-cargo': { label: 'Caixas esquecidas', width: 72, height: 55, pivot: .91, bases: [[-30,31,-16,5]] },
  'ruin-amphora': { label: 'Ânfora quebrada', width: 57, height: 41, pivot: .89, bases: [[-23,23,-13,5]] },
  'ruin-lintel': { label: 'Blocos entalhados', width: 94, height: 59, pivot: .91, bases: [[-40,39,-17,6]] },
  'ruin-hatch': { label: 'Escada de porão', width: 110, height: 84, pivot: .77, bases: [[-43,44,-48,10]] },
} as const;

export type RuinKind = keyof typeof RUINS_ART;
export const RUIN_KINDS = Object.keys(RUINS_ART) as RuinKind[];
export function isRuinKind(kind: string | undefined): kind is RuinKind {
  return !!kind && Object.hasOwn(RUINS_ART, kind);
}
