/** Conversas dos moradores da Vila (preview.41, pedido do Junior): cada vez que você abre a
 * janela, pode vir uma conversa diferente. A primeira vez continua a apresentação de
 * `VILLAGE_NPCS[].dialogue`; depois, sorteia uma destas, sem repetir a anterior. */
export const NPC_CONVERSATIONS:Record<string,readonly (readonly string[])[]>={
 augusto:[
  ['Chegou uma carroça de mantimentos ontem. Pouca coisa, mas cada saco de farinha aqui vale ouro.','Se tiver sobra de colheita, eu troco. Ninguém passa fome nesta vila enquanto eu cuidar do armazém.'],
  ['Antes da chuva, eu vendia de tudo: parafusos, tecidos, até rádio.','Hoje vendo o que dá. E o que dá, a gente divide. É assim que se recomeça.'],
  ['Viu o quadro de pedidos na frente do centro comunitário? Os vizinhos deixam recados lá.','Um pedido entregue faz mais pela vila do que dez promessas.'],
  ['Minha prateleira muda todo dia. O que não tem hoje, pode aparecer amanhã.','Passe aqui de manhã cedo: as melhores coisas saem antes do almoço.'],
  ['Você reparou como a vila ficou mais barulhenta? Martelo, serrote, gente rindo...','Eu gosto desse barulho. Significa que estamos vivos.'],
  ['A Rosa me trouxe sementes novas. Ela diz que a terra daqui é teimosa, mas generosa.','Igual a gente, não é? Teimosos e generosos.'],
 ],
 bento:[
  ['O ferro não perdoa pressa. Se esquentar demais, racha; se esquentar de menos, não dobra.','Ferramenta boa é feita com paciência. Igual a amizade.'],
  ['Andei pela mina antiga de novo. Ainda tem veios de ferro esperando quem tenha coragem.','Leve tocha, comida e não vá sozinho para o fundo. A Serra guarda segredos.'],
  ['Peças de construção? Eu faço, mas cobro o meu tempo.','Se quiser economizar, leve sua sucata para o Ícaro separar. Ele tem mãos boas para isso.'],
  ['Uma ferramenta de ouro corta como manteiga. Mas a de metal negro... aquela é outra história.','Quando tiver o minério certo, venha falar comigo.'],
  ['Meu pai dizia: quem cuida da ferramenta, a ferramenta cuida dele.','Traga as suas para reparar antes que quebrem no meio do trabalho.'],
  ['De manhã eu trabalho na ferraria; às vezes saio para buscar minério.','Se a porta estiver fechada, não é desfeita: é o fogo esperando lenha.'],
 ],
 amelia:[
  ['Sabia que a camomila nasce melhor perto das pedras? Ela gosta de se esconder.','As plantas que sobreviveram à chuva são as mais fortes. Respeito muito elas.'],
  ['Cogumelos aparecem depois da garoa, na sombra da Floresta Antiga.','Traga alguns e eu preparo uma infusão que devolve o fôlego.'],
  ['Uma erva rara vale mais do que parece. Não pela raridade, mas pelo que ela cura.','Se encontrar alguma, guarde com cuidado, longe do sol.'],
  ['Às vezes eu sento na margem do lago só para ouvir a água.','Curar também é isso: parar um pouco e respirar.'],
  ['O adubo da Rosa faz milagre na horta. Plantas bem cuidadas dão colheitas melhores.','Regue todo dia. A terra percebe quando alguém se importa.'],
  ['A Helena me pediu ervas para o chá da pousada.','Se tiver sobra, deixe no quadro de pedidos. Todo mundo sai ganhando.'],
 ],
 tobias:[
  ['Madeira boa range diferente. Com o tempo você aprende a escutar.','Tábua serrada com calma encaixa sem precisar de força.'],
  ['Estou reformando o telhado da pousada. Quer dizer... tentando, entre uma chuva e outra.','Se tiver madeira sobrando, o quadro de pedidos sempre tem um recado meu.'],
  ['Uma bancada de construção muda tudo. Com ela você faz portas, janelas e máquinas.','Comece pela bancada de trabalho e vá crescendo.'],
  ['Cavilha é coisa pequena, mas segura a casa inteira.','Nunca subestime uma peça pequena. Nem uma pessoa quieta.'],
  ['Vi umas galinhas soltas perto da Floresta. Coitadas, precisam de um galinheiro.','Se construir um, faça com cerca firme: raposa não pede licença.'],
  ['Meu avô construiu metade das casas desta vila.','Agora é a minha vez de reconstruir a outra metade. E você, a sua propriedade.'],
 ],
 rosa:[
  ['Nabo é paciente: cresce até em terra cansada.','Comece por ele. Depois, quando a terra acordar, plante o que quiser.'],
  ['Colheita bem regada e adubada tem mais chance de sair boa ou excelente.','Não é garantia, é carinho. A terra devolve com o tempo.'],
  ['Deixei um contrato no quadro de pedidos. Preciso de nabos para a vila.','Pode entregar aos poucos. Eu anoto tudo.'],
  ['Cada estação pede uma semente diferente. Fique de olho no calendário.','Plantar fora de época é como cantar sem música: até sai, mas não fica bom.'],
  ['Estou criando uns patos no açude. Eles adoram a horta... e comem metade dela.','Se quiser um, eu arrumo. Mas prepare o galinheiro antes.'],
  ['O Augusto diz que eu falo com as plantas.','Falo mesmo. E elas crescem mais. Tire suas conclusões.'],
 ],
 nilo:[
  ['Encontrei uma moeda antiga com um brasão que não conheço.','Cada objeto perdido é uma história esperando alguém para contar.'],
  ['Mapas antigos são meus favoritos. Mostram caminhos que talvez nem existam mais.','Se achar um, traga. Eu pago bem e ainda conto o que sei.'],
  ['Antes da chuva, esta região tinha estradas até a cidade.','Hoje a Estrada da Cidade é mato e lembrança. Mas lembrança também tem valor.'],
  ['Um viajante me disse que viu ruínas ao sul do asfalto, seguindo a leste pela Estrada da Cidade.','Parece que houve um posto de parada por ali. Se achar alguma peça diferente, venha me contar.'],
  ['Antiguidade não é coisa velha. É coisa que sobreviveu.','Como esta vila. Como você, que chegou até aqui.'],
  ['Meu antiquário abre todos os dias. Nunca se sabe quando chega um tesouro.','Às vezes o tesouro é só uma boa conversa, como esta.'],
 ],
 celina:[
  ['Uma costura reta depende da mão firme e do coração tranquilo.','Por isso costuro de manhã, antes da vila acordar.'],
  ['Lã de ovelha bem cuidada vira um tecido macio que dura anos.','Se criar ovelhas, traga a lã. Eu ensino o caminho até o tecido.'],
  ['Uma mochila reforçada faz toda a diferença numa expedição.','Mais espaço, menos idas e vindas. Seus pés agradecem.'],
  ['Estou costurando roupas para os sobreviventes do acampamento.','Ninguém recomeça bem com frio. Um agasalho é um abraço que fica.'],
  ['Cores alegres ajudam a vila a sorrir. Ando tingindo tecidos com flores.','Girassol dá um amarelo lindo. Margarida, um creme suave.'],
  ['Botas boas levam você mais longe do que qualquer estrada.','Se as suas estiverem gastas, venha me ver.'],
 ],
 damiao:[
  ['Peixe grande não morde isca apressada.','Espere a linha esticar. A pressa espanta o que a paciência pega.'],
  ['O Lago da Cachoeira tem trutas que só aparecem cedinho.','Quem acorda junto com a névoa volta com o balde cheio.'],
  ['Todo dia eu deixo uma encomenda no quadro de pedidos.','Uma espécie diferente por dia. Pescar com propósito tem outro gosto.'],
  ['Meu barco ficou preso depois da chuva. Hoje pesco da margem mesmo.','Às vezes perder algo nos ensina outro jeito de fazer.'],
  ['Uma vara melhor ajuda a segurar os peixes mais bravos.','Mas a vara não pesca sozinha. O segredo está no pulso.'],
  ['Já viu o reflexo da lua no lago? Parece um peixe dourado parado.','Dizem que dá sorte. Eu prefiro acreditar.'],
 ],
 helena:[
  ['Hoje a sopa é de abóbora. Amanhã... depende do que a Rosa trouxer.','Cozinhar para a vila é minha forma de dizer que ninguém está sozinho.'],
  ['Se estiver cansado, a pousada tem cama quentinha.','Uma noite bem dormida vale mais que qualquer tônico.'],
  ['Todo dia eu escolho um prato do dia e pago o dobro por ele.','Fique de olho: às vezes é justamente o que você sabe fazer.'],
  ['Ouvi rumores sobre pegadas estranhas ao norte da Floresta.','Rumor é como tempero: um pouco dá sabor, demais estraga.'],
  ['Pratos feitos com ingredientes bons dão mais energia.','Ovo de galinha bem cuidada faz omelete que ninguém esquece.'],
  ['A vila fica mais bonita quando alguém volta para contar como foi o dia.','Então conte! Como estão as coisas na propriedade?'],
 ],
 icaro:[
  ['Sucata é só uma peça esperando a chance de ser útil de novo.','Traga a sua. Eu separo pregos, molas, dobradiças... e às vezes uma engrenagem.'],
  ['Engrenagem é a peça mais rara da sucata. Quando aparece, eu comemoro.','Moinhos, teares e queijeiras não funcionam sem ela.'],
  ['Estou tentando consertar um rádio velho. Se funcionar, talvez a gente ouça a cidade.','Ou só chiado. Mas chiado também é companhia.'],
  ['Luminárias deixam a propriedade segura à noite.','E um aspersor automático poupa muito balde. Os dois projetos estão aqui na oficina.'],
  ['O Bento faz peças novas, eu salvo as velhas.','Juntos, a vila não fica parada. Ele com o fogo, eu com a paciência.'],
  ['Às vezes desmonto uma coisa só para entender como ela funciona.','Depois monto de novo. Quase sempre sobra um parafuso.'],
 ],
};
/** Sorteia uma conversa diferente da última mostrada para o morador. */
export function pickConversation(npc:string,last:number|undefined,random=Math.random):{index:number;lines:readonly string[]}|undefined{
 const list=NPC_CONVERSATIONS[npc];if(!list?.length)return undefined;
 let index=Math.floor(random()*list.length);
 if(list.length>1&&index===last)index=(index+1)%list.length;
 return{index,lines:list[index]};
}
