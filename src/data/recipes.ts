import type { ItemCost } from '../systems/inventory';
import type { OwnedTool } from '../types';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  cost: ItemCost;
  output: ItemCost;
  requiresTool?: OwnedTool;
  requiresWorkbench?: boolean;
  durationSeconds?: number;
}

// Regras de progressão ficam reunidas aqui para permitir ajustes sem mudar os sistemas.
export const RECIPES: CraftingRecipe[] = [
  {
    id: 'cord', name: 'Corda vegetal',
    description: 'Trance 3 fibras vegetais para fazer uma corda reutilizável, conduzir animais e montar ferramentas.',
    cost: { fiber: 3 }, output: { cord: 1 },
  },
  {
    id: 'flaked-stone', name: 'Pedra lascada',
    description: 'Prepare uma pedra afiada para a machadinha ou a picareta.',
    cost: { stone: 2 }, output: { flakedStone: 1 },
  },
  {
    id: 'handle', name: 'Cabo',
    description: 'Prepare um galho para servir de cabo de ferramenta.',
    cost: { branch: 1 }, output: { handle: 1 },
  },
  {
    id: 'pegs', name: 'Cavilhas',
    description: 'Transforme um galho em quatro cavilhas para juntar peças de madeira.',
    cost: { branch: 1 }, output: { peg: 4 },
  },
  {
    id: 'hatchet', name: 'Machadinha de pedra',
    description: 'Uma ferramenta simples para cortar árvores e preparar as primeiras tábuas.',
    cost: { handle: 1, flakedStone: 1, cord: 1 }, output: { hatchet: 1 },
  },
  {
    id: 'pickaxe', name: 'Picareta rudimentar',
    description: 'Permite extrair pedras das rochas da região.',
    cost: { handle: 1, flakedStone: 2, cord: 1 }, output: { pickaxe: 1 },
  },
  {
    id: 'hoe', name: 'Enxada simples',
    description: 'Prepare novos canteiros no chão livre da propriedade, plante, regue e colha.',
    cost: { handle: 1, flakedStone: 1, cord: 1 }, output: { hoe: 1 },
  },
  {
    id: 'hammer', name: 'Martelo rudimentar',
    description: 'Monte a bancada e junte os módulos do primeiro abrigo.',
    cost: { handle: 1, stone: 1, cord: 1 }, output: { hammer: 1 },
  },
  {
    id: 'rough-planks', name: 'Preparar tábuas com machadinha',
    description: 'Abra um tronco em duas tábuas para construir a primeira bancada.',
    cost: { log: 1 }, output: { plank: 2 }, requiresTool: 'hatchet', durationSeconds: 4,
  },
  {
    id: 'blade', name: 'Lâmina de sucata',
    description: 'Prepare uma lâmina reaproveitada na bancada para montar o serrote.',
    cost: { scrap: 1 }, output: { blade: 1 }, requiresWorkbench: true,
  },
  {
    id: 'handsaw', name: 'Serrote improvisado',
    description: 'Monte um serrote na bancada usando lâmina, cabo e corda vegetal.',
    cost: { blade: 1, handle: 1, cord: 1 }, output: { handsaw: 1 }, requiresWorkbench: true,
  },
  {
    id: 'sawn-planks', name: 'Serrar tábuas na bancada',
    description: 'Use o serrote na bancada para aproveitar melhor cada tronco.',
    cost: { log: 1 }, output: { board: 3 }, requiresTool: 'handsaw', requiresWorkbench: true, durationSeconds: 3,
  },
];
