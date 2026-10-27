import type { ItemCost } from '../systems/inventory';
import type { OwnedTool } from '../types';
import {ECOLOGY_BALANCE as ECOLOGY} from './ecology-balance';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  cost: ItemCost;
  output: ItemCost;
  requiresTool?: OwnedTool;
  requiresWorkbench?: boolean;
  durationSeconds?: number;
  unlock?:string;
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

for(const [id,name,cost,output] of [
 ['bandage','Curativo',{cloth:1,herb:2},{bandage:2}],['herbalTonic','Tônico medicinal',{herb:4,rareHerb:1},{herbalTonic:2}],
 ['fertilizer','Adubo vegetal',{fiber:6,herb:1},{fertilizer:2}],['backpack','Mochila reforçada',{cloth:8,cord:4},{backpack:1}],
 ['boots','Botas de caminhada',{cloth:4,cord:2},{boots:1}],['accessory','Acessório de pesca',{cloth:2,rareHerb:1},{accessory:1}],
 ['lamp','Luminária exterior',{wood:4,metalPart:2,electronicPart:1},{lamp:1}],['waterPump','Bomba de irrigação',{metalPart:6,electronicPart:3,plank:4},{waterPump:1}],
 ['homeKit','Kit da casa',{log:3,fiber:4},{plank:6,peg:8}],['workshopKit','Kit da oficina',{log:4,scrap:3},{board:6,metalPart:2}],
 ['survivorKit','Kit de base',{log:4,fiber:6},{plank:8,cord:3}],
] as const)RECIPES.push({id,name,description:'Receita aprendida com os moradores da vila.',cost,output,unlock:id});

RECIPES.push(
 {id:'fungalInfusion',name:'Infusão de cogumelos',description:'Receita da Amélia. Combine ervas e cogumelos para recuperar 50 de vigor.',cost:ECOLOGY.infusion.cost,output:ECOLOGY.infusion.output,unlock:'fungalInfusion',durationSeconds:3},
 {id:'sickle',name:'Foice de Pedra',description:'Ferramenta básica de coleta vegetal.',cost:{flakedStone:1,handle:1,cord:1},output:{sickle:1}},
 {id:'shovel',name:'Pá de Pedra',description:'Ferramenta básica para preparar o chão.',cost:{flakedStone:2,handle:1,cord:1},output:{shovel:1}},
 {id:'forge',name:'Forja própria',description:'Instale na propriedade para fundir sem pagar mão de obra. Este sistema não exige combustível.',cost:{stone:15,wood:8,scrap:6},output:{forge:1},requiresWorkbench:true},
 {id:'furniture',name:'Móvel de madeira',description:'Produto de carpintaria para comercializar.',cost:{wood:10,board:4},output:{furniture:1},requiresWorkbench:true},
 {id:'doorKit',name:'Porta pronta',description:'Componente de construção.',cost:{board:4,peg:4},output:{doorKit:1}},
 {id:'windowKit',name:'Janela pronta',description:'Componente de construção.',cost:{board:3,peg:2},output:{windowKit:1}},
 {id:'fenceKit',name:'Cerca pronta',description:'Componente de construção.',cost:{wood:3},output:{fenceKit:1}}
);
