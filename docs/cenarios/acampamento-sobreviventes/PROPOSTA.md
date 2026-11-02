# Acampamento de Sobreviventes

Implementado como cenário separado ao norte da Floresta Antiga, preservando o mapa e o estilo da prévia aprovada. O acesso fica a oeste do lago da floresta: só sete pares discretos de pegadas e uma abertura entre as árvores, sem pintar estrada ou caminho de terra.

## Aparência

Barracas bege e oliva, fogueira, suprimentos e cercas rústicas novas; árvores, pedras, chão, luz, chuva e pássaros usam os sistemas existentes. Os objetos do acampamento são editáveis em F2. As imagens originais das barracas e cercas continuam preservadas nesta pasta.

Os sobreviventes têm cabelos e roupas diferentes dos fazendeiros: coque escuro com jaqueta vinho ou azul, cabelo loiro curto com colete oliva ou marrom. A cabeça nova e a roupa aplicada pela máscara do corpo seguem as poses fornecidas dos jogadores: oito direções, seis quadros de caminhada para a base feminina e oito para a masculina, ciclo de 48 pixels do mundo e repouso sem repetição de passos. A roupa não injeta braços da pose parada sobre os braços animados. O recorte da cabeça termina no queixo e remove as sobras do coque antigo nas vistas laterais. A revisão em navegador verifica ausência de membros extras e preservação da silhueta das pernas em todos os quadros.

## Visitas e hostis

O primeiro grupo é pacífico. Novos grupos chegam a cada três dias de jogo; os seguintes podem ser hostis. Os visitantes entram e saem andando pelo portão sul. A passagem de um dia ou o carregamento do save não os transporta para outra posição nem sorteia novamente o encontro.

Hostis avisam antes de atacar. O jogador pode escolher recuar e tem cinco segundos de simulação para sair da proximidade. Escolher permanecer, avançar para muito perto ou continuar próximo após o prazo inicia perseguição e ataques. O mundo usa vigor para os ferimentos. Golpes têm intervalo, alcance e verificação de obstáculos; a fuga continua possível.

Q abre o equipamento de defesa no acampamento. A espada básica das expedições pode ser equipada ou guardada. E ou clique perto de um agressor ataca: com a espada equipada, usa a mesma arte, escala, arco, apresentação e som da dungeon, com alcance de 74 pixels, 22 de dano e intervalo de 0,85 s. Desarmado usa alcance de 42 pixels e 6 de dano, sem efeito de espada. Aliados e visitantes pacíficos não recebem golpes. Agressores derrotados recuam andando; não geram uma fonte ilimitada de recursos.

## Recrutamento e casa comunitária

E abre a conversa com visitantes pacíficos. Até oito sobreviventes podem ser recrutados. O convite é salvo antes de confirmar. Eles deixam o acampamento a pé, atravessam a Floresta Antiga e a propriedade pelos acessos existentes e chegam à casa comunitária da Vila do Recomeço. A posição muda de cenário somente na passagem correspondente. Rotas bloqueadas aguardam e tentam novamente, nunca pulam o obstáculo.

Os moradores ficam na área da casa comunitária durante o dia. À noite caminham até a porta antes de entrar para descansar; de manhã saem pelo mesmo ponto. Esta etapa utiliza a fachada existente; não cria um interior navegável novo para o jogador.

## Pedidos de ajuda

Após o convite já há um diálogo para pedir ajuda. Um pedido combinado durante a mudança espera a chegada à casa comunitária. Também é possível conversar novamente com o aliado na vila e encontrá-lo andando nos mapas por onde passa.

- Buscar madeira caída na floresta: traz 4 madeiras.
- Coletar ervas na floresta: traz 2 ervas.
- Regar a horta da propriedade: rega até 6 plantas reais que estejam sem água.

Cada sobrevivente aceita um pedido por dia, entre 08:00 e 19:00, e só um pedido por vez. A tarefa exige trajeto, tempo de trabalho e retorno à casa comunitária. A coleta é um serviço de exploração com quantidade limitada; não derruba árvores ou retira nós editados do mapa. Madeira e ervas são entregues pela conversa depois do retorno. Se a mochila estiver cheia, ficam guardadas com o aliado. Pedido, entrega e recompensa são transacionais; falhar ao salvar não consome a tarefa e conversar de novo não duplica itens. Regar não consome água do regador do jogador.

## Compatibilidade e validação

Campos opcionais mantêm partidas anteriores compatíveis. Visitas, moradores, localização, aparência, pedido atual e equipamento de defesa são persistidos. O acampamento tem HUD, inventário, fabricação, mapa, zoom e companheiro animal.

A validação inclui 1.548 testes automatizados em 179 arquivos, build de produção e um roteiro Chromium em `scripts/qa-survivor-camp.cjs`: entrada por caminhada, pegadas fora da água, deslocamento dos visitantes sem saltos, convite e retomada de save, recuo seguro, ataque hostil, golpe visual da espada, chegada à casa comunitária e pedido com recompensa persistida. A galeria e o vídeo de caminhada são exportados das texturas efetivamente usadas no jogo.

O calendário sazonal permanece adiado. Estas alterações são de desenvolvimento e não alteram o instalador já publicado da preview.26.
