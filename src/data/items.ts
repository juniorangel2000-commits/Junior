import type { ItemId } from '../types';

// IDs de saves são estáveis. Madeira legada continua distinta de troncos e tábuas.
export const ITEMS: Record<ItemId, { name: string; description: string }> = {
  wood: { name: 'Madeira', description: 'Lenha e madeira reaproveitada, usada nas cercas e nos bancos.' },
  stone: { name: 'Pedra', description: 'Pedras pequenas para ferramentas e construção.' },
  seeds: { name: 'Sementes', description: 'Sementes de nabo para a horta.' },
  turnip: { name: 'Nabos', description: 'Sua primeira colheita.' },
  branch: { name: 'Galhos', description: 'Recolha os feixes de madeira no chão para fabricar cabos.' },
  log: { name: 'Troncos', description: 'Use a machadinha em árvores, troncos caídos e tocos; transforme os troncos obtidos em tábuas.' },
  plank: { name: 'Tábuas brutas', description: 'Feitas com machadinha; usadas na bancada e nas peças do abrigo.' },
  scrap: { name: 'Sucata metálica', description: 'Encontrada na parte oeste da propriedade. Na bancada, transforme em lâmina.' },
  hatchet: { name: 'Machadinha', description: 'Corta árvores e permite fazer as primeiras tábuas.' },
  pickaxe: { name: 'Picareta', description: 'Quebra veios de pedra e recupera materiais.' },
  hoe: { name: 'Enxada', description: 'E ou clique prepara um canteiro no solo livre da propriedade. Shift + E ou Shift + clique desfaz o canteiro vazio e restaura o piso anterior.' },
  handsaw: { name: 'Serrote', description: 'Usado junto à bancada para serrar e construir paredes e portas.' },
  fiber: { name: 'Fibras vegetais', description: 'Recolha samambaias, flores brancas, arbustos e juncos das margens do rio para fazer cordas e cobertura.' },
  cord: { name: 'Cordas vegetais', description: 'Prendem as partes das ferramentas e permitem conduzir animais até a propriedade.' },
  flakedStone: { name: 'Pedras lascadas', description: 'Pedras preparadas para as cabeças da machadinha e da picareta.' },
  handle: { name: 'Cabos', description: 'Um galho preparado para receber a cabeça de uma ferramenta.' },
  peg: { name: 'Cavilhas', description: 'Encaixes de madeira para a bancada, paredes e portas.' },
  blade: { name: 'Lâminas de sucata', description: 'Preparadas na bancada para montar o serrote.' },
  board: { name: 'Tábuas regulares', description: 'O serrote improvisado aproveita um tronco em três tábuas regulares, reservadas para carpintaria futura.' },
  hammer: { name: 'Martelo rudimentar', description: 'Necessário para montar bancada e peças do abrigo.' },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
export const ITEM_NAMES = Object.fromEntries(ITEM_IDS.map(id => [id, ITEMS[id].name])) as Record<ItemId, string>;
