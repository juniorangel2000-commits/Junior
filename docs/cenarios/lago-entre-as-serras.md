# Lago entre as Serras

Novo cenário de pesca a oeste do acesso à cidade, baseado na prévia aprovada: lago central de contorno orgânico, mata irregular, encosta norte em resolução nativa com mirante e escadaria refinada, cadeias rochosas paralelas nos limites oeste e leste, cachoeira ao norte, píer em T ampliado com barco a leste e ponte sobre o rio de saída a sudoeste.

A passagem oeste do acesso à cidade fica na altura 33; no lago, ela chega pelo lado leste na mesma altura. A saída sul do lago leva ao norte da propriedade, pela margem leste do rio, sem atravessar a montanha. O rio termina no eixo 45,5, alinhado ao rio da propriedade. Os pontos de entrada deixam espaço para chegar sem retornar automaticamente.

O mirante só é acessível pela escadaria: as faces das rochas continuam bloqueadas. As colisões são derivadas dos contornos das imagens, incluindo as paredes laterais e o vão da passagem leste. Água, margens, ponte e piso do píer usam a mesma geometria nas colisões; não há grama alta na água. A vegetação usa manchas de grama alta, samambaias, flores, arbustos e cogumelos, com amostragem de toda a base para preservar água e caminhos. Os objetos continuam selecionáveis no editor. Reutiliza as árvores do jogo, com animação e transparência quando ocultam o jogador. O rio e o lago recebem ondulações leves; a cachoeira tem movimento discreto.

E inicia a pesca perto da margem ou sobre o píer; usar a vara/rede na mochila também funciona. Mantém os requisitos existentes: habilidade ensinada por Damião, equipamento e isca. A pesca usa o inventário real, salva o resultado e consome a isca mesmo se for cancelada.

O cenário preserva relógio, plantações, rotinas da vila e companheiros. Câmera, scroll, zoom, pausa, mapa e saída ao menu seguem os outros cenários. Continuar uma partida salva no lago retorna ao próprio lago.

F2 inclui o lago no editor, com histórico, pintura, objetos, importação e exportação independentes. A encosta, a escadaria, a ponte, o píer e as chegadas são marcos protegidos para manter a navegação. A gravação usa o formato 4 já preparado para a próxima versão; não publica nem altera a versão distribuída.

Validação: `tests/fishing-lake.test.ts` testa acesso contínuo, colisões e persistência; `scripts/qa-fishing-lake.cjs` confere a apresentação real e o editor; `scripts/qa-lake-transitions.cjs` testa pesca, passagens nos dois sentidos e retomada do save. A suíte geral também cobre a preservação dos recursos da propriedade ao liberar o novo acesso.

O acabamento 4, da floresta, foi escolhido como padrão global para os cenários. `waterFinishChannel` centraliza profundidade e margem para propriedade, floresta, vila, lago, poças do acesso à cidade, pintura do editor e superfície animada. A textura-base permanece a original do jogo.

O acesso à escadaria é uma ligação curta à trilha principal. O anel do lago acompanha o contorno irregular da água e cruza a ponte uma única vez; o antigo ramal paralelo da esquerda foi removido. As copas são reservadas pela silhueta inteira ao redor das trilhas, não somente pelo tronco.

A margem diante da escadaria foi recuada localmente por um contorno suave; a trilha passa pela frente da base, com espaço de terra antes da água. O píer foi deslocado três blocos para oeste, seus objetos ficam fora da trilha e o acesso acompanha a nova posição. A ponte tem oito blocos de extensão, com piso e passagem derivados da mesma configuração, e a trilha se alinha aos dois extremos.

A trilha não contorna mais o trecho norte após a escadaria: termina no acesso ao mirante. O cenário contém pedras terrestres em chão seco e somente as rochas aquáticas D/E, que têm linha de água desenhada, próximas das margens. O centro do lago permanece livre. Toda a margem recebe uma faixa irregular de areia, com variações locais de largura; moitas maiores usam a verificação de toda a silhueta para não cobrir água ou caminhos. O trecho final do acesso segue reto até a base da escada, em um trecho único e contínuo, sem uma curva ou ponta arredondada antes da ligação. A cor do cascalho se aproxima gradualmente da mediana da terra na arte da montanha. Pequenos cardumes de sombras nadam sob os reflexos, evitando margens, rochas, ponte, píer e terra pintada no editor; são apenas efeitos visuais.

A entrada do rio agora faz uma união suave com o lago, com margens assimétricas, meandros e largura variável. A geometria mantém o alinhamento da ponte e a continuidade com o rio da propriedade. O jogador pode entrar na água e nadar; rochas, penhascos, barco e proteções da ponte/píer permanecem sólidos. Uma partida salva na água retorna ao mesmo ponto, já com a apresentação de natação.

## Cabana de pesca

A arte aprovada da cabana fica na margem leste, antes da entrada da cidade: madeira envelhecida, varanda elevada em pilares e escada de madeira. A imagem original de 1448 × 1086 é preservada, exibida com 432 pixels de largura. Paredes e guarda-corpos têm colisões separadas do piso transitável; a frente do guarda-corpo usa uma camada de oclusão. A clareira reserva a silhueta inteira para as árvores não cobrirem a construção. Um ramal curto liga a escada ao caminho existente, sem ocupar a água.

Damião visita o lago das 08:00 às 11:30. Alterna pausas na varanda e no píer, usando as animações originais de caminhada; não fala durante o deslocamento. A posição inicial segue o relógio salvo, em vez de reiniciar a rotina a cada visita do jogador. O trajeto usa passagens com espaço para os pés, desvia dos obstáculos nativos e espera quando o jogador ou uma edição bloqueia o próximo passo.

E ou um clique próximo abre a conversa, compra/venda e os mesmos serviços de pesca da vila (aulas e entrega do peixe raro). A conversa pausa o mundo e o personagem. Inventário, carteira e serviços são gravados juntos; uma falha de gravação não aplica a transação. Às 11:30 ele deixa de aparecer no lago e retoma a rotina anterior da vila, incluindo almoço e visitas. Durante a manhã não é exibido nem ocupa espaço de colisão na vila.

A cabana é um ponto de atendimento externo: varanda e escada acessíveis, porta fechada. Não foi criado um interior novo. A versão do save e do pacote permanecem inalteradas.

Validação específica: `tests/fisher-cabin.test.ts` verifica percurso, pés, colisões, horários e transações; `scripts/qa-fisher-cabin.cjs` verifica a apresentação, atendimento real, persistência e retorno à vila no navegador.

A cabana foi recuada dois blocos para norte, mantendo a escala da arte. O ramal começa sob os últimos degraus, continua no eixo da escada e depois faz uma curva suave até a trilha. Sua largura é menor na chegada e aumenta gradualmente junto à bifurcação. A clareira acompanha um contorno arredondado, em vez de uma grande reserva retangular. O trajeto de Damião usa os mesmos pontos da chegada.

Novos grupos irregulares de árvores e pinheiros preenchem áreas secas nas bordas oeste, sul, leste e ao norte da cabana. Usam variações de espécie, porte e espaçamento, com a reserva da copa inteira para não cobrir caminhos, água ou a cabana. Os novos objetos conservam IDs individuais para edição. A validação cobre o alinhamento com a escada, o afunilamento do caminho e a continuidade da caminhada até o píer.

Os cantos livres de paredões recebem uma segunda camada de composição: pequenos grupos de árvores e pinheiros, pedras musgosas e seixos, alguns troncos/tocos, samambaias, arbustos, cogumelos, flores e três variedades de grama. A seleção reserva a base e a altura de cada objeto, rejeita faces de montanha, água, caminhos e marcos protegidos, e usa espécies e espaçamentos variados. São objetos individuais com IDs estáveis, usando as artes existentes.
