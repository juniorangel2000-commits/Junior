# Acabamento da vila — preview.10

## Terreno e construções

As transições entre grama e floresta agora usam pesos contínuos, com pequenas irregularidades nas clareiras. A mesma função percorre toda a vila; a reserva retangular usada para impedir árvores sobre construções não é mais pintada no chão. Permanecem a arte original da grama, os blocos pequenos aprovados e os contornos de pedra dos caminhos e praça. Pinturas manuais do editor são preservadas.

O armazém usa escala 0,32, com a porta comparada à altura dos NPCs. Isso amplia a fachada em 25,5% sobre a escala 0,255 da revisão anterior (39,1% sobre a preview.9). A carpintaria foi para (28, 44), com posição inicial do dono e acesso atualizados. O caminho principal foi afastado da varanda, criando uma faixa de grama; a entrada liga a porta à via horizontal. As moitas respeitam as dimensões reais das artes das fachadas, incluindo o alpendre aberto.

Os dois canteiros de trigo usam artes verticais próprias, ao redor do moinho e dentro do cercado. As artes anteriores permanecem intactas.

As 16 frentes de comércios e construções mantêm a largura original de cada caminho, com término reto junto às fachadas onde havia pontas semicirculares. Não há patamares alargados ou remendos nas laterais. O contorno de pedra acompanha as arestas; as curvas são preservadas nos trajetos entre as construções.

## Píer e pesca

O píer final tem 224 pixels de comprimento, 30% menor que a primeira montagem. A arte foi encurtada com menos vãos, preservando a proporção dos postes e tábuas. O centro do piso caminhável se alinha ao centro do acesso de pedra.

Os enfeites foram ampliados em cerca de 45% a 50%, tomando os bancos como referência: suporte de varas e rede, caixa e cordas, cesta de peixes, âncora e rede. Os objetos deixam a passagem central livre.

Tábuas, água e colisões compartilham as mesmas coordenadas. O jogador entra pela margem, percorre a área seca e retorna. As cordas laterais e a água na ponta impedem a saída pela borda. A camada da corda frontal se sobrepõe corretamente aos pés. Ondas não aparecem sobre o piso seco.

O acesso de pedra afunila gradualmente e termina reto sob a primeira tábua. Sua linha central vem das mesmas coordenadas do piso do píer; o acabamento das duas bordas de pedra fica entre os postes. A ida e a volta continuam testadas com o movimento real do personagem.

## Grama alta e árvores

Há 169 moitas em grupos nos espaços entre vias e comércios. A reserva ao redor das construções segue seus contornos opacos em faixas de 16 pixels, medidas nos PNGs com limiar de alpha 160, em vez de bloquear todo o retângulo transparente. Perfis incluem SHA-256 das artes para detectar metadados desatualizados. Os alpendres ficam reservados entre os pilares.

Os nove pontos do retângulo de cada sprite são conferidos contra o piso e a água, com margem junto à beira. Pinturas do editor também são respeitadas: grama pode receber moitas, mas piso e água pintados em qualquer canto impedem a colocação. A faixa do píer é excluída. Os juncos do cenário antigo foram removidos do lago, mantendo apenas as pedras existentes; o teste no navegador também exige ausência dessa vegetação.

As árvores usam grupos com borda ondulada, raízes deslocadas e distâncias variadas. A copa inteira precisa caber fora das silhuetas das construções; portas, acesso da propriedade e vias mantêm afastamento.

## Perímetro e coreto

O atlas contém 16 sprites de barricadas: oito direções, cada uma limpa ou com pequenas manchas de sangue nas pontas. Há 18 posições no mapa, cinco usando variantes manchadas. A escala é proporcional aos personagens e a colisão acompanha a orientação. O contorno e os pequenos bosques usam 265 árvores de seis variedades, com posições e espaçamento irregulares; as áreas de portas e o portão da propriedade permanecem abertas.

O coreto tem passagem central até o fundo do piso. Pilares e guarda-corpo continuam sólidos; as colunas consideram os pontos de detecção dos pés do jogador. Piso, pilares e telhado são camadas distintas. Ao entrar, o telhado fica translúcido para manter o personagem visível, sem carregar outra cena.

## Validação

- 885 testes passaram em 103 arquivos.
- TypeScript e build de produção passaram, com o aviso já conhecido do Vite sobre tamanho do bundle.
- Treze verificações no Chromium para píer, artes, floresta, navegação, coreto e save passaram.
- Doze verificações de conversas e rotinas passaram, com pico de quatro NPCs na praça e nenhum andando enquanto falava ou escutava.
- Sem erros de JavaScript, HTTP ou WebGL.

Os testes de terreno verificam a continuidade das clareiras em toda a área da vila e o antigo limite retangular ao lado da casa comunitária. Os testes de navegação cobrem o acesso ao píer, as superfícies secas, as cordas, o interior do coreto, seus pilares e a passagem da propriedade.

`scripts/qa-village-pier-preview10.cjs` usa comandos de teclado e o movimento real do jogador para testar ida e volta no píer, bloqueio lateral e entrada no coreto. Também verifica as novas artes, a floresta, as rotas dos dez comércios, save e erros do navegador. As capturas foram conferidas visualmente.

`scripts/qa-social-preview10.cjs` repete a simulação das cinco duplas, conversas em comércio, ausência de movimento durante falas, retomada do trabalho, colisões e persistência depois das alterações de mapa.

Versão `0.10.0-preview.10` validada para publicação pelo workflow Windows, com tag correspondente à versão do pacote.
