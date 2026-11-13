import type {ItemCost} from '../systems/inventory';
/** Receita aprovada: guardar colheitas da Primavera e esperar o milho do Verão. */
export const HARVEST_BASKET_COST={carrot:1,strawberry:1,corn:1} as const satisfies ItemCost;
export const HARVEST_BASKET_FEE=20;
export const HARVEST_BASKET_DESCRIPTION='1 cenoura + 1 morango (Primavera) + 1 milho (Verão) + 20 C. Cada pedido prepara uma cesta. Guarde parte da colheita da Primavera até o Verão.';
