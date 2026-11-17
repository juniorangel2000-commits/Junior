import type {ItemId} from '../types';
import type {SocialNpc} from './npc-social';
/** Presentes para os moradores (preview.43, pedido do Junior).
 * - Um presente por dia para cada morador.
 * - Cada um tem o que adora, gosta e não gosta; o resto é recebido com educação.
 * - A reação fica anotada: depois de dar, a mochila mostra o que cada um achou.
 * - Comida pronta da cozinha agrada a todos, se o morador não tiver opinião própria. */
export type GiftTaste='loved'|'liked'|'neutral'|'disliked';
export const GIFT_AFFINITY:Record<GiftTaste,number>={loved:4,liked:2,neutral:1,disliked:-2};
export interface NpcTastes{loved:readonly ItemId[];liked:readonly ItemId[];disliked:readonly ItemId[];
 /** O que o morador diz para cada reação. */
 lines:Record<GiftTaste,string>}
export const NPC_TASTES:Record<SocialNpc,NpcTastes>={
 augusto:{loved:['honey','homemadeBread','heartyBreakfast','cheeseHoneyBread'],liked:['egg','milk','cheese','corn','flour','bean','pamonha'],disliked:['manure','scrap','hay'],
  lines:{loved:'Isto vai direto para a minha mesa, não para a prateleira! Muito obrigado!',liked:'Que bom! Isto sempre tem saída aqui no armazém. Obrigado.',neutral:'Obrigado. Vou achar um lugar para isto.',disliked:'Ah... obrigado, mas isto eu não consigo nem vender.'}},
 bento:{loved:['ironIngot','goldIngot','blackMetalIngot','minerBroth'],liked:['hardwood','ironOre','goldOre','roastedFish','beanTropeiro','roastedSweetPotato'],disliked:['daisy','sunflower','chamomileTea','candle'],
  lines:{loved:'...Isto é bom de verdade. Obrigado. Não esqueço.',liked:'Útil. Obrigado.',neutral:'Hm. Obrigado.',disliked:'Flor? Chá? ...Isto não é para mim.'}},
 amelia:{loved:['rareHerb','chamomile','mushroom','fungalInfusion','herbalTonic'],liked:['herb','mint','daisy','chamomileTea','beeswax','honey'],disliked:['scrap','electronicPart','ironOre'],
  lines:{loved:'Que maravilha! Você sabe exatamente o que me faz feliz.',liked:'Que gentileza. Vou usar com cuidado.',neutral:'Obrigada. Tudo tem alguma utilidade.',disliked:'Hum... isto não combina muito com as minhas ervas.'}},
 tobias:{loved:['hardwood','plank','carrotCake','furniture'],liked:['wood','log','nails','board','peg','pamonha','cornBroa'],disliked:['fish','rareFish','manure'],
  lines:{loved:'Ora, ora! Isto vai virar coisa bonita na minha bancada. Obrigado!',liked:'Sempre se aproveita. Obrigado!',neutral:'Obrigado. Vou guardar na oficina.',disliked:'Peixe na carpintaria? O cheiro não sai da madeira...'}},
 rosa:{loved:['strawberry','pumpkin','strawberryPie','fertilizer','sunflower'],liked:['turnip','lettuce','carrot','tomato','corn','watermelon','sweetPotato','kale','cabbage','duckEgg','gardenSalad'],disliked:['scrap','ironOre','stone'],
  lines:{loved:'Ah, que lindeza! Você entende de terra e de coração.',liked:'Colheita boa! Dá para ver o carinho.',neutral:'Obrigada! Tudo que vem da terra é bem-vindo.',disliked:'Isto não brota... mas obrigada pela lembrança.'}},
 nilo:{loved:['oldMap','goldIngot','electronicPart','rareFish'],liked:['metalPart','gear','goldShard','candle','lantern','blackMetalShard'],disliked:['manure','hay','freshGrass'],
  lines:{loved:'Extraordinário! Isto vai para a vitrine principal!',liked:'Interessante, muito interessante. Obrigado!',neutral:'Obrigado. Toda coisa tem uma história.',disliked:'Hum. Isto aqui não tem história nenhuma para contar.'}},
 celina:{loved:['woolCloth','cotton','yarn','sunflower'],liked:['wool','feather','cloth','daisy','beeswax','strawberryJam'],disliked:['manure','fish','scrap'],
  lines:{loved:'Que perfeito! Já sei até o que vou costurar com isto.',liked:'Que delicadeza. Obrigada!',neutral:'Obrigada. Vou guardar no meu cesto.',disliked:'Ai... isto vai deixar cheiro nos tecidos.'}},
 damiao:{loved:['rareFish','fishStew','watermelonJuice','bait'],liked:['fish','roastedCorn','cornBroa','roastedFish','oatPorridge'],disliked:['hay','candle','daisy'],
  lines:{loved:'Ha! Isto sim é presente de pescador. Obrigado!',liked:'Bom, bom. Obrigado.',neutral:'Obrigado. Vai para o barco... quando ele voltar.',disliked:'Isto não serve nem de isca.'}},
 helena:{loved:['dulceDeLeche','honeyCake','cheese','goatCheese','butter'],liked:['egg','milk','flour','tomato','honey','chamomileTea','pumpkin','strawberry'],disliked:['scrap','manure','ironOre'],
  lines:{loved:'Que delícia! Vou fazer algo especial com isto, e você prova primeiro.',liked:'Ótimo ingrediente! Obrigada.',neutral:'Obrigada. Tudo serve na cozinha.',disliked:'Isto na minha cozinha? Nem pensar...'}},
 icaro:{loved:['gear','spring','electronicPart','metalPart'],liked:['scrap','hinge','nails','ironShard','watermelonJuice','honeyCake'],disliked:['herb','chamomileTea','manure'],
  lines:{loved:'Uau! Já sei onde isto vai encaixar! Obrigado!',liked:'Boa peça! Obrigado.',neutral:'Obrigado. Vai para a caixa de coisas úteis.',disliked:'Erva? Eu não sei o que fazer com isto...'}},
};
/** O que não dá para presentear: ferramentas, máquinas, equipamentos e kits. */
export const NOT_GIFTABLE:ReadonlySet<ItemId>=new Set<ItemId>(['hatchet','pickaxe','hoe','handsaw','hammer','sickle','shovel','sword','shears','milkPail','fishingRod','net','harvestBasket',
 'cheesePress','butterChurn','spinningWheel','loom','stoneMill','clayOven','campfire','beehive','emptyHive','composter','preserveKeg','waxPress','forge','waterPump','lamp','backpack','boots',
 'doorKit','windowKit','fenceKit']);

/** Níveis de amizade e o que cada morador dá de presente ao chegar neles. */
export const FRIENDSHIP_LEVELS=[
 {at:3,label:'À vontade'},
 {at:8,label:'Amizade'},
 {at:15,label:'Grande amizade'},
 {at:25,label:'Melhores amigos'},
] as const;
/** Presentes nos níveis 8, 15 e 25 (Amizade, Grande amizade, Melhores amigos). */
export const FRIENDSHIP_REWARD_LEVELS=[8,15,25] as const;
export interface FriendshipReward{items:Partial<Record<ItemId,number>>;line:string}
export const FRIENDSHIP_REWARDS:Record<SocialNpc,readonly [FriendshipReward,FriendshipReward,FriendshipReward]>={
 augusto:[{items:{homemadeBread:2,egg:6},line:'Separei umas coisas do armazém para você. Quem é próximo do Augusto não passa fome!'},
  {items:{fertilizer:10,cornSeeds:10},line:'Guardei isto debaixo do balcão especialmente para você.'},
  {items:{goldIngot:2,honey:5},line:'Você virou da família. Isto é o melhor que eu tinha guardado.'}],
 bento:[{items:{ironIngot:3},line:'Fundi a mais. Fica com você.'},
  {items:{goldIngot:2},line:'Ouro. Use bem. Confio em você.'},
  {items:{blackMetalIngot:1},line:'Metal negro. Pouca gente recebe isto de mim. Você merece.'}],
 amelia:[{items:{herbalTonic:2},line:'Preparei dois tônicos para você. Para os dias difíceis.'},
  {items:{rareHerb:5},line:'Ervas raras do meu canteiro secreto. Não conte a ninguém!'},
  {items:{fungalInfusion:3,rareHerb:5},line:'Você cuidou de mim como eu cuido das plantas. Obrigada de coração.'}],
 tobias:[{items:{plank:10},line:'Tábuas bem serradas. Para a sua propriedade.'},
  {items:{hardwood:8},line:'Madeira nobre, das boas. Guardei para alguém especial.'},
  {items:{hardwood:15,nails:10},line:'Meu avô ia gostar de você. Tome, para construir algo bonito.'}],
 rosa:[{items:{fertilizer:10},line:'Adubo da minha receita. A terra vai agradecer!'},
  {items:{strawberrySeeds:10,pumpkinSeeds:10},line:'Sementes das minhas melhores plantas. Cuide bem delas!'},
  {items:{fertilizer:30,sunflowerSeeds:10},line:'Você tem mão boa para a terra. Isto é para o seu jardim.'}],
 nilo:[{items:{oldMap:1},line:'Um mapa antigo da minha coleção. Talvez leve você a algum lugar.'},
  {items:{goldShard:5},line:'Fragmentos de ouro que achei por aí. Uma pequena fortuna.'},
  {items:{electronicPart:3,goldIngot:2},line:'Peças raras da minha vitrine. Você entende o valor delas.'}],
 celina:[{items:{cloth:3},line:'Tecidos que sobraram de uma encomenda. São seus.'},
  {items:{clothing:1},line:'Costurei uma roupa pensando em você.'},
  {items:{accessory:1,clothing:1},line:'Meu melhor trabalho. Para a minha melhor amizade.'}],
 damiao:[{items:{bait:10},line:'Isca boa. Os peixes não resistem.'},
  {items:{rareFish:2},line:'Peguei de madrugada. Dois peixes raros para você.'},
  {items:{fishStew:3,bait:20},line:'Você me lembrou por que eu gosto desta vila. Obrigado.'}],
 helena:[{items:{meal:3},line:'Marmitas para os dias corridos. Coma direito!'},
  {items:{honeyCake:2},line:'Bolo de mel fresquinho. Receita da minha avó.'},
  {items:{heartyBreakfast:5},line:'Para você nunca começar o dia de barriga vazia.'}],
 icaro:[{items:{gear:3},line:'Três engrenagens! Eu sei, eu sei. Mas você merece.'},
  {items:{spring:5,hinge:5},line:'Peças separadas com carinho. Vão ser úteis.'},
  {items:{electronicPart:3,metalPart:5},line:'O que eu tinha de mais precioso na oficina. Agora é seu.'}],
};
