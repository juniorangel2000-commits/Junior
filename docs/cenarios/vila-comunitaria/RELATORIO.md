# Vila comunitária: fonte, moinho e novos bairros

A vila recebeu os elementos aprovados na proposta visual: fonte circular de pedra no centro da praça, casa comunitária ao norte junto da pousada, moinho e canteiros de trigo a oeste, coreto, celeiro, duas casas residenciais e duas carroças. O poço foi transferido para a área rural do moinho.

A casa comunitária, moinho, celeiro, casas e coreto são cenário externo nesta etapa. Não há novos interiores, serviços ou interações associados às portas decorativas. Os dez comércios mantêm suas fachadas, interiores, serviços e animações; carpintaria e ferraria foram preservadas.

## Organização e renderização

- Onze instâncias de oito artes originais em um atlas transparente. Fonte com ondulação discreta, desenhada sem criar objetos por quadro. O PNG original é preservado e identificado por SHA-256 no manifesto.
- Novos caminhos ligam casa comunitária, coreto, moinho, celeiro e casas à malha comercial. Novos bancos, vasos e postes acompanham os percursos.
- As árvores nativas foram afastadas das silhuetas completas das construções. Flores e vegetação não são colocadas sobre as novas construções ou caminhos.
- Casa comunitária recebe duas fontes de iluminação ao anoitecer; postes seguem o sistema existente de iluminação.
- A geometria dos pés das construções é compartilhada pela colisão do jogador e navegação. Telhados e pás do moinho não criam paredes invisíveis. A fonte usa colisão elíptica e não é água de natação.
- As edições de terreno existentes continuam sobrepostas ao terreno de base; nenhum save ou mapa da propriedade/floresta é reescrito por migração. Uma posição salva que ficou dentro de um obstáculo usa a validação de chegada já existente.

## Validação

- 837 testes em 98 arquivos passaram. Novos testes verificam integridade e recortes do atlas, poço transferido, fonte, colisões compartilhadas, acessibilidade e clareiras.
- TypeScript e build de produção passaram. Permanece o aviso existente sobre tamanho do bundle.
- Sete verificações no Chromium passaram: onze elementos carregados, oito artes distintas, dez comércios acessíveis, fonte sólida sem natação, animação da água com quantidade constante de objetos, ocultação do cenário em interiores, trabalho/almoço/retorno dos dez NPCs sem colisões, save válido com dez rotinas e mapas externos preservados, ausência de erros JavaScript, WebGL e HTTP.
- Simulação da manhã às 09:00, almoço às 12:15 e retorno às 15:00 usa o relógio do jogo. Todos os comerciantes atenderam na manhã e tarde e saíram para o intervalo.
- Capturas diurnas e noturnas conferidas visualmente: `vila-completa.png`, `praca-fonte.png`, `casa-comunitaria-e-coreto.png`, `moinho-e-trigo.png`, `bairro-leste.png`, `praca-noite.png`.

Tudo local, sem push, tag ou publicação.
