import type {ItemId} from '../types';
import {ITEMS} from './items';

/** Singular e plural dos itens usados nas receitas (preview.49), para escrever "1 Corda vegetal" e
 * "3 Cordas vegetais". Itens fora da lista usam o nome de sempre. */
const FORMS:Partial<Record<ItemId,readonly [string,string]>>={
 accessory:['Acessório','Acessórios'],backpack:['Mochila reforçada','Mochilas reforçadas'],bandage:['Curativo','Curativos'],
 blackMetalIngot:['Lingote de Metal Negro','Lingotes de Metal Negro'],blade:['Lâmina de sucata','Lâminas de sucata'],board:['Tábua regular','Tábuas regulares'],
 boots:['Par de botas','Pares de botas'],branch:['Galho','Galhos'],butterChurn:['Batedeira de manteiga','Batedeiras de manteiga'],campfire:['Fogueira portátil','Fogueiras portáteis'],
 cheesePress:['Queijeira','Queijeiras'],clayOven:['Forno de barro','Fornos de barro'],cloth:['Tecido','Tecidos'],composter:['Composteira','Composteiras'],
 cord:['Corda vegetal','Cordas vegetais'],doorKit:['Telhado de tábuas','Telhados de tábuas'],electronicPart:['Componente eletrônico','Componentes eletrônicos'],
 fertilizer:['Fertilizante','Fertilizantes'],fiber:['Fibra vegetal','Fibras vegetais'],flakedStone:['Pedra lascada','Pedras lascadas'],forge:['Forja própria','Forjas próprias'],
 fungalInfusion:['Infusão de cogumelos','Infusões de cogumelos'],furniture:['Banco de madeira','Bancos de madeira'],gear:['Engrenagem','Engrenagens'],
 goldIngot:['Lingote de Ouro','Lingotes de Ouro'],hammer:['Martelo rudimentar','Martelos rudimentares'],handle:['Cabo','Cabos'],handsaw:['Serrote','Serrotes'],
 hatchet:['Machadinha','Machadinhas'],herb:['Erva','Ervas'],herbalTonic:['Tônico de ervas','Tônicos de ervas'],hinge:['Dobradiça','Dobradiças'],hoe:['Enxada','Enxadas'],
 ironIngot:['Lingote de Ferro','Lingotes de Ferro'],ironShard:['Fragmento bruto de Ferro','Fragmentos brutos de Ferro'],lamp:['Luminária','Luminárias'],log:['Tronco','Troncos'],
 loom:['Tear','Teares'],metalPart:['Peça metálica','Peças metálicas'],milkPail:['Balde de ordenha','Baldes de ordenha'],mushroom:['Cogumelo','Cogumelos'],nails:['Prego','Pregos'],
 peg:['Cavilha','Cavilhas'],pickaxe:['Picareta','Picaretas'],plank:['Tábua bruta','Tábuas brutas'],preserveKeg:['Barril de conservas','Barris de conservas'],
 rareHerb:['Erva rara','Ervas raras'],shears:['Tesoura de tosquia','Tesouras de tosquia'],shovel:['Pá','Pás'],sickle:['Foice','Foices'],spinningWheel:['Roca','Rocas'],
 spring:['Mola','Molas'],stone:['Pedra','Pedras'],stoneMill:['Moinho de pedra','Moinhos de pedra'],sword:['Espada improvisada','Espadas improvisadas'],
 waterPump:['Aspersor automático','Aspersores automáticos'],waxPress:['Prensa de cera','Prensas de cera'],windowKit:['Ninho e baias','Ninhos e baias'],
};
/** Nome do item na forma certa para a quantidade (1 = singular). */
export const itemForm=(id:ItemId,n:number)=>{const f=FORMS[id];return f?f[n===1?0:1]:ITEMS[id].name;};
/** "3 Cordas vegetais", "1 Corda vegetal". */
export const itemAmount=(id:ItemId,n:number)=>`${n} ${itemForm(id,n)}`;
