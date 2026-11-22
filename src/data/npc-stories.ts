import type {ItemId} from '../types';
import type {SocialNpc} from './npc-social';
/** Histórias pessoais dos moradores (preview.43, pedido do Junior).
 * Cada história tem 3 partes. Cada parte se abre com a amizade (3, 8 e 15) e pede uma
 * entrega; ao entregar, o morador conta como continuou e dá a recompensa.
 * Amélia e Nilo ganham a história junto com o pântano e as ruínas (cenários novos do Junior). */
export interface StoryPart{
 title:string;
 /** Amizade mínima para o morador contar esta parte. */
 affinity:number;
 /** O que o morador conta ao pedir. */
 ask:readonly string[];
 need:Partial<Record<ItemId,number>>;
 /** O que ele diz ao receber. */
 thanks:readonly string[];
 reward:{items?:Partial<Record<ItemId,number>>;coins?:number;recipe?:string};
}
export interface NpcStory{title:string;parts:readonly [StoryPart,StoryPart,StoryPart]}
/** Amizade extra ao concluir cada parte. */
export const STORY_AFFINITY=3;

export const NPC_STORIES:Partial<Record<SocialNpc,NpcStory>>={
 amelia:{title:'A íris da vó Dita',parts:[
  {title:'O caderno de ervas',affinity:3,
   ask:['Minha avó Dita era benzedeira. Ela falava de uma íris azul que crescia na beira das lagoas, antes da chuva.','Quero refazer o caderno de ervas dela, começando pelas plantas comuns. Me traz ervas?'],
   need:{herb:6},thanks:['Já sequei e prensei todas. A primeira página do caderno está pronta.','Ela escrevia o nome de cada planta com a letra mais bonita que eu já vi.'],reward:{coins:100,items:{bandage:3}}},
  {title:'A flor do Pântano',affinity:8,
   ask:['Encontrei um desenho no caderno: a íris azul, na beira das lagoas do Pântano.','Se ela ainda existe, deve estar lá. Me traz uma? Mesmo que seja só uma.'],
   need:{blueIris:1},thanks:['É ela! Exatamente como no desenho da vó Dita.','Ela dizia que a íris acalma o coração. Agora acredito.'],reward:{items:{herbalTonic:3},coins:150}},
  {title:'O chá da benzedeira',affinity:15,
   ask:['A última receita do caderno é o chá da benzedeira: íris azul, ervas raras e mel.','Quero servir na vila, para quem perdeu alguém na chuva. Me ajuda a juntar?'],
   need:{blueIris:3,rareHerb:2,honey:2},thanks:['A vila inteira tomou o chá. Teve gente que chorou, teve gente que riu.','O caderno da vó Dita está completo. Fica uma cópia com você.'],reward:{items:{fungalInfusion:2,herbalTonic:3},coins:350}},
 ]},
 nilo:{title:'A marca das três pontas',parts:[
  {title:'Os arquivos molhados',affinity:3,
   ask:['A marca do selo de bronze é da antiga companhia da ferrovia. Tenho certeza.','Guardei uns arquivos da estação, mas estão úmidos e enferrujados. Preciso de pano e sucata para limpar as caixas.'],
   need:{cloth:2,scrap:6},thanks:['Achei! Uma lista de cargas com a mesma marca: três pontas, uma em cima da outra.','O selo fechava os vagões de valor. Alguma coisa importante passava por aquela estação.'],reward:{coins:120,items:{goldShard:2}}},
  {title:'O cofre da bilheteria',affinity:8,
   ask:['Na sala de espera da Estação tem um cofre emperrado atrás da bilheteria.','Com peças de metal e pregos eu desmonto a fechadura sem estragar nada.'],
   need:{metalPart:3,nails:10},thanks:['Abriu. Dentro, bilhetes nunca usados e um livro de registro.','A última viagem registrada levava sementes e remédios para a cidade. Nunca chegou.'],reward:{items:{oldMap:1},coins:180}},
  {title:'O museu do vale',affinity:15,
   ask:['Quero montar um pequeno museu na loja, com o selo, os bilhetes e o livro.','Preciso de uma vitrine firme: madeira nobre e um lingote de ouro para os detalhes.'],
   need:{hardwood:4,goldIngot:1},thanks:['O museu está aberto. A vila inteira veio ver o selo.','Quem chegar depois vai saber o que passou por aqui. Obrigado por ajudar a contar essa história.'],reward:{items:{accessory:1,furniture:1},coins:400}},
 ]},
 tobias:{title:'A ponte do avô',parts:[
  {title:'Medir o vão',affinity:3,
   ask:['Lembra que eu disse que meu avô construiu metade da vila? A obra preferida dele era a ponte do riacho.','A chuva levou quase tudo. Quero reconstruir, mas primeiro preciso de tábuas para medir o vão e montar o andaime.'],
   need:{plank:10},thanks:['Tábuas retinhas! Já marquei o vão: são onze passos de uma margem à outra.','O andaime está de pé. Agora vem a parte difícil.'],reward:{coins:150,items:{nails:10}}},
  {title:'Amarrar a estrutura',affinity:8,
   ask:['O andaime aguenta, mas a estrutura da ponte precisa de cavilhas e corda firme.','Meu avô amarrava as vigas antes de pregar. Dizia que corda segura o que o prego não alcança.'],
   need:{peg:10,cord:5},thanks:['Cavilhas boas, corda forte. A estrutura já atravessa o riacho.','Sabe que passei a noite olhando os desenhos dele? Estou seguindo cada traço.'],reward:{items:{hardwood:5},coins:100}},
  {title:'As vigas de madeira nobre',affinity:15,
   ask:['Falta o principal: as vigas. Só madeira nobre aguenta a correnteza na época das chuvas.','Com isso, a ponte fica pronta. A ponte do meu avô, de pé de novo.'],
   need:{hardwood:10,nails:20},thanks:['Pronto. A ponte está de pé.','Ontem atravessei e chorei no meio dela, igual criança. Obrigado. Esta ponte também é sua agora.'],reward:{items:{furniture:1},coins:400}},
 ]},
 helena:{title:'O caderno da vó Lúcia',parts:[
  {title:'A primeira página',affinity:3,
   ask:['Achei o caderno de receitas da minha avó Lúcia no sótão. A chuva molhou quase todas as páginas.','A primeira dá para ler: um doce de leite cozido devagar. Me ajuda com os ingredientes?'],
   need:{milk:3,egg:4},thanks:['O cheiro da cozinha ficou igualzinho ao da casa dela...','Tome, vou ensinar a receita para você. Ela ia gostar.'],reward:{recipe:'dulceDeLeche',coins:80}},
  {title:'A página manchada de mel',affinity:8,
   ask:['A segunda página tem uma mancha de mel bem no meio. Acho que é um bolo.','Testei de memória e falta alguma coisa. Preciso de mel e farinha para tentar de novo.'],
   need:{honey:3,flour:4},thanks:['Acertei! Era um bolo de mel, e o segredo era bater a massa cantando. Ela cantava sempre.','Leve a receita. E cante enquanto faz.'],reward:{recipe:'honeyCake',items:{honeyCake:1}}},
  {title:'O prato de domingo',affinity:15,
   ask:['A última página é o prato de domingo: pão com queijo e mel, que ela servia para a família inteira.','Quero fazer um almoço de domingo para a vila toda, como ela fazia. Me ajuda?'],
   need:{cheese:3,honey:3,homemadeBread:2},thanks:['A vila inteira veio. Teve gente que eu nunca tinha visto rir.','O caderno agora é nosso. Obrigada por me devolver a minha avó, nem que seja por um domingo.'],reward:{recipe:'cheeseHoneyBread',items:{heartyBreakfast:3},coins:300}},
 ]},
 damiao:{title:'O barco do Damião',parts:[
  {title:'Soltar o barco',affinity:3,
   ask:['Meu barco ficou preso entre as pedras da margem depois da chuva.','Com corda e lenha para fazer alavanca, talvez dê para soltar.'],
   need:{cord:6,wood:15},thanks:['Soltou! Está torto e cheio de água, mas soltou.','Agora é tirar ele da água e ver o estrago.'],reward:{items:{bait:10},coins:80}},
  {title:'Remendar o casco',affinity:8,
   ask:['O casco tem três buracos e uma tábua rachada.','Preciso de tábuas e pregos. Muitos pregos.'],
   need:{plank:12,nails:15},thanks:['Remendado. Coloquei na água e ele boiou. Fiquei uma hora só olhando.','Falta pouco para ele voltar ao lago de verdade.'],reward:{items:{rareFish:1,bait:10}}},
  {title:'De volta ao lago',affinity:15,
   ask:['Para aguentar a correnteza perto da cachoeira, o barco precisa de quilha de madeira nobre e reforço de ferro.','Depois disso, quero que você seja a primeira pessoa a pescar comigo nele.'],
   need:{hardwood:8,ironIngot:2},thanks:['Ele voltou. O meu barco voltou ao lago.','Pescamos juntos ao amanhecer, lembra? Leve esta rede. Era do meu pai, e agora é sua.'],reward:{items:{net:1,rareFish:2},coins:250}},
 ]},
 augusto:{title:'A carroça da cidade',parts:[
  {title:'Encher a carroça',affinity:3,
   ask:['Quero mandar uma carroça de mantimentos para os sobreviventes do acampamento.','Começo com o que a terra dá: nabos e cenouras.'],
   need:{turnip:10,carrot:5},thanks:['A carroça saiu hoje cedo. Eles mandaram dizer que foi o melhor jantar em semanas.','E se a gente fizesse disso uma rota?'],reward:{coins:200}},
  {title:'Farinha para o inverno',affinity:8,
   ask:['O acampamento pediu farinha e fubá para guardar para o frio.','Comida que dura é comida que salva.'],
   need:{flour:5,cornmeal:5},thanks:['Mandei tudo. Agora eles têm pão até a primavera.','Sabe, o armazém nunca teve tanto sentido como agora.'],reward:{items:{fertilizer:10},coins:150}},
  {title:'A feira da vila',affinity:15,
   ask:['Tive uma ideia: uma feira na praça, com gente da vila e do acampamento.','Preciso do melhor que a gente produz: queijo, mel e tecido de lã.'],
   need:{cheese:3,honey:3,woolCloth:2},thanks:['A feira foi um sucesso! Gente trocando, rindo, dançando.','Você ajudou a vila a virar uma comunidade de verdade. Isto aqui é para você.'],reward:{items:{goldIngot:2},coins:500}},
 ]},
 bento:{title:'O martelo do pai',parts:[
  {title:'O cabo quebrado',affinity:3,
   ask:['O martelo do meu pai quebrou. O cabo rachou de velho.','Não quero um novo. Quero aquele. Para o ferro do reparo, preciso de minério.'],
   need:{ironOre:10},thanks:['O ferro está bom. Já comecei a forjar a cinta do cabo.','...Obrigado.'],reward:{items:{ironIngot:2}}},
  {title:'Cabo de madeira nobre',affinity:8,
   ask:['Meu pai usava cabo de madeira nobre. Dizia que ela entende a mão.','E preciso de lingotes para o reforço.'],
   need:{hardwood:3,ironIngot:5},thanks:['O cabo encaixou como se tivesse nascido ali.','Ele ia gostar de saber que alguém ajudou. Ele gostava de gente que trabalha.'],reward:{items:{goldShard:4},coins:150}},
  {title:'A cabeça de ouro',affinity:15,
   ask:['Vou fazer o que meu pai sempre quis: uma cabeça de ouro para o martelo.','Não é luxo. É promessa. Preciso de lingotes de ouro.'],
   need:{goldIngot:3},thanks:['Está pronto. O martelo do meu pai, como ele sonhava.','Você é a primeira pessoa que deixo segurar. ...Tome. Metal negro. Faça algo que dure.'],reward:{items:{blackMetalIngot:2},coins:300}},
 ]},
 rosa:{title:'O jardim da praça',parts:[
  {title:'Terra boa',affinity:3,
   ask:['A praça da vila está toda de pedra e lama. Quero fazer um jardim no meio dela.','Para começar, preciso mostrar ao conselho que a terra daqui produz. Me traz nabos?'],
   need:{turnip:15},thanks:['O conselho provou a sopa de nabo e aprovou o jardim!','Agora vem a parte bonita.'],reward:{items:{fertilizer:10}}},
  {title:'Cores da estação',affinity:8,
   ask:['Um jardim precisa de cor e de cheiro. Morango e abóbora para a horta comunitária.','O que crescer ali é de todo mundo.'],
   need:{strawberry:6,pumpkin:4},thanks:['As crianças já colhem morango escondidas. Eu finjo que não vejo.','Falta só uma coisa para o jardim ficar completo.'],reward:{items:{strawberrySeeds:10,pumpkinSeeds:5}}},
  {title:'Girassóis',affinity:15,
   ask:['Minha mãe dizia que girassol é a flor da esperança: vira o rosto para o sol, mesmo depois da chuva.','Quero uma fileira deles no centro do jardim.'],
   need:{sunflower:6,daisy:6},thanks:['Os girassóis estão virados para o sol. A vila inteira para para olhar.','Obrigada. Este jardim tem um canteiro com o seu nome.'],reward:{items:{fertilizer:30,sunflowerSeeds:10},coins:300}},
 ]},
 celina:{title:'Agasalhos para o acampamento',parts:[
  {title:'A primeira lã',affinity:3,
   ask:['O frio está chegando e os sobreviventes do acampamento quase não têm roupa.','Se eu tiver lã, começo hoje mesmo.'],
   need:{wool:6},thanks:['Já tenho os primeiros cachecóis prontos.','Mas para casacos de verdade, preciso de mais.'],reward:{coins:150}},
  {title:'Tecido e novelo',affinity:8,
   ask:['Casaco pede tecido grosso e novelo para as costuras.','É muito trabalho, mas cada ponto é um pouco de calor para alguém.'],
   need:{woolCloth:4,yarn:4},thanks:['Os casacos ficaram prontos! O Rui chorou quando vestiu o dele.','Falta uma última coisa: roupa leve para o verão.'],reward:{items:{cloth:3},coins:150}},
  {title:'Roupa para todas as estações',affinity:15,
   ask:['Com algodão, faço roupa leve para todo mundo. Assim ninguém fica sem nada em estação nenhuma.'],
   need:{cotton:10},thanks:['Pronto. Todo mundo no acampamento tem roupa para o ano inteiro.','Costurei uma coisa para você também. Com o mesmo carinho.'],reward:{items:{clothing:1,accessory:1},coins:200}},
 ]},
 icaro:{title:'O rádio do Ícaro',parts:[
  {title:'Peças do rádio',affinity:3,
   ask:['Lembra do rádio velho? Descobri que ele não liga porque faltam peças por dentro.','Me traz sucata? Talvez o que eu preciso esteja no meio dela.'],
   need:{scrap:15},thanks:['Achei! Um transformador inteirinho no meio da sucata.','O rádio acendeu uma luzinha. Só uma. Mas acendeu.'],reward:{items:{gear:1},coins:100}},
  {title:'Mola e engrenagem',affinity:8,
   ask:['O botão de sintonia está travado. Preciso de molas e engrenagens para o mecanismo.'],
   need:{spring:4,gear:2},thanks:['A sintonia gira! Ouvi chiado em todas as estações...','Mas numa delas, por um segundo, juro que ouvi uma voz.'],reward:{items:{hinge:5},coins:150}},
  {title:'A voz da cidade',affinity:15,
   ask:['Para ouvir aquela voz, preciso de uma antena boa: componentes eletrônicos e peças de metal.','Se der certo... a gente vai saber se tem mais alguém lá fora.'],
   need:{electronicPart:3,metalPart:4},thanks:['Funcionou. Era uma voz de verdade, de outro grupo de sobreviventes, longe daqui.','Não estamos sozinhos. Você me ajudou a descobrir isso. Fica com o melhor da minha caixa.'],reward:{items:{electronicPart:2,spring:5,gear:3},coins:400}},
 ]},
};
