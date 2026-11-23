import type {ItemId} from '../types';

/** Obras grandes (preview.48, docs/planejamento/GASTOS-GRANDES.md): casa, estufa, obras do Vale e
 * casas para novos moradores. Pagas aos poucos com coroas e materiais; depois de tudo entregue, a
 * obra leva alguns dias e fica pronta. */
export type ProjectGroup='home'|'greenhouse'|'vale'|'resident';
export interface ProjectDef{
 id:string;group:ProjectGroup;name:string;npc:string;coins:number;items:Partial<Record<ItemId,number>>;days:number;
 requires?:string;description:string;done:string;
}
export const PROJECTS:readonly ProjectDef[]=[
 {id:'home-1',group:'home',name:'Casa: sala maior',npc:'tobias',coins:10_000,items:{plank:60,stone:20},days:2,
  description:'O Tobias aumenta a sala (de 12 × 10 para 16 × 12): mais espaço e o dobro de móveis.',done:'A sala da sua casa ficou maior.'},
 {id:'home-2',group:'home',name:'Casa: quarto',npc:'tobias',coins:25_000,items:{plank:80,hardwood:10,doorKit:1},days:3,requires:'home-1',
  description:'A casa cresce para 20 × 12, com espaço de quarto. Dormir em casa passa a dar 120 de vigor pela manhã.',done:'Seu quarto novo está pronto.'},
 {id:'home-3',group:'home',name:'Casa: cozinha nova',npc:'tobias',coins:40_000,items:{stone:40,plank:30,windowKit:2},days:4,requires:'home-2',
  description:'Cozinha nova: o fogão de casa não gasta mais lenha e também faz os pratos de forno (pão, bolos e tortas). A casa fica com 20 × 14.',done:'A cozinha nova está pronta: o fogão faz até os pratos de forno.'},
 {id:'greenhouse',group:'greenhouse',name:'Estufa',npc:'tobias',coins:100_000,items:{plank:60,glass:30,hardwood:10},days:5,
  description:'Uma estufa na propriedade: 24 canteiros que plantam qualquer semente em qualquer estação.',done:'A estufa está pronta. Plante o que quiser, o ano todo.'},
 {id:'greenhouse-2',group:'greenhouse',name:'Estufa: ampliação',npc:'tobias',coins:60_000,items:{glass:30,plank:30},days:3,requires:'greenhouse',
  description:'Dobra a estufa para 48 canteiros.',done:'A estufa agora tem 48 canteiros.'},
 {id:'vale-moinho',group:'vale',name:'Obra do Vale: moinho',npc:'augusto',coins:30_000,items:{plank:40,stone:20,woolCloth:4},days:4,
  description:'Consertar as pás e a mó do moinho. Ele volta a moer trigo, milho e aveia para a vila.',done:'O moinho voltou a girar!'},
 {id:'vale-ponte',group:'vale',name:'Obra do Vale: ponte da Floresta da Cidade',npc:'bento',coins:60_000,items:{ironIngot:20,plank:40},days:5,requires:'vale-moinho',
  description:'Uma ponte nova no caminho para a Floresta da Cidade: atalho para as Ruínas.',done:'A ponte nova está aberta.'},
 {id:'vale-farol',group:'vale',name:'Obra do Vale: farol da Costa',npc:'damiao',coins:80_000,items:{goldIngot:15,stone:30,glass:10},days:6,requires:'vale-ponte',
  description:'Reacender o farol da Costa: pesca noturna e um barco com mercadorias de fora.',done:'O farol da Costa está aceso.'},
 {id:'vale-estacao',group:'vale',name:'Obra do Vale: Estação',npc:'icaro',coins:150_000,items:{ironIngot:40,goldIngot:10,metalPart:20},days:7,requires:'vale-farol',
  description:'Reativar os trilhos e a locomotiva: o trem volta a ligar a Estação, a Vila e a Costa.',done:'O trem voltou a apitar no Vale!'},
 {id:'casa-leste',group:'resident',name:'Reformar a casa leste',npc:'tobias',coins:45_000,items:{plank:50,doorKit:1,windowKit:2},days:4,
  description:'A casinha a leste da praça vira a padaria da Lúcia, uma moradora nova.',done:'A Lúcia se mudou para a casa leste e abriu a padaria.'},
 {id:'casa-sul',group:'resident',name:'Reformar a casa sul',npc:'tobias',coins:60_000,items:{plank:60,hardwood:10},days:5,
  description:'A casinha ao sul vira o consultório do Jonas, um veterinário novo na vila.',done:'O Jonas se mudou para a casa sul e abriu o consultório.'},
];
export const projectDef=(id:string)=>PROJECTS.find(p=>p.id===id);
