# Acabamento da vila — preview.10 em preparação

## Terreno e construções

As transições entre grama e floresta agora usam pesos contínuos, com pequenas irregularidades nas clareiras. A mesma função percorre toda a vila; a reserva retangular usada para impedir árvores sobre construções não é mais pintada no chão. Permanecem a arte original da grama, os blocos pequenos aprovados e os contornos de pedra dos caminhos e praça. Pinturas manuais do editor são preservadas.

O armazém usa escala 0,255, igual à maior parte das fachadas, um aumento de 10,9%. A carpintaria foi para (28, 44), com posição inicial do dono e acesso atualizados. O caminho principal foi afastado da varanda, criando uma faixa de grama; a entrada liga a porta à via horizontal. As moitas respeitam as dimensões reais das artes das fachadas, incluindo o alpendre aberto.

Os dois canteiros de trigo usam artes verticais próprias, ao redor do moinho e dentro do cercado. As artes anteriores permanecem intactas.

As 16 frentes de comércios e construções mantêm a largura original de cada caminho, com término reto junto às fachadas onde havia pontas semicirculares. Não há patamares alargados ou remendos nas laterais. O contorno de pedra acompanha as arestas; as curvas são preservadas nos trajetos entre as construções.

## Píer e pesca

O píer final tem 224 pixels de comprimento, 30% menor que a primeira montagem. A arte foi encurtada com menos vãos, preservando a proporção dos postes e tábuas. O centro do piso caminhável se alinha ao centro do acesso de pedra.

Os enfeites foram ampliados em cerca de 45% a 50%, tomando os bancos como referência: suporte de varas e rede, caixa e cordas, cesta de peixes, âncora e rede. Os objetos deixam a passagem central livre.

Tábuas, água e colisões compartilham as mesmas coordenadas. O jogador entra pela margem, percorre a área seca e retorna. As cordas laterais e a água na ponta impedem a saída pela borda. A camada da corda frontal se sobrepõe corretamente aos pés. Ondas não aparecem sobre o piso seco.

## Perímetro e coreto

O atlas contém 16 sprites de barricadas: oito direções, cada uma limpa ou com pequenas manchas de sangue nas pontas. Há 18 posições no mapa, cinco usando variantes manchadas. A escala é proporcional aos personagens e a colisão acompanha a orientação. O contorno de floresta usa 371 árvores de seis variedades; as áreas de portas e o portão da propriedade permanecem abertas.

O coreto tem passagem central até o fundo do piso. Pilares e guarda-corpo continuam sólidos; as colunas consideram os pontos de detecção dos pés do jogador. Piso, pilares e telhado são camadas distintas. Ao entrar, o telhado fica translúcido para manter o personagem visível, sem carregar outra cena.

## Validação

- 879 testes passaram em 102 arquivos.
- TypeScript e build de produção passaram, com o aviso já conhecido do Vite sobre tamanho do bundle.
- Onze verificações no Chromium para píer, artes, floresta, navegação, coreto e save passaram.
- Doze verificações de conversas e rotinas passaram, com pico de quatro NPCs na praça e nenhum andando enquanto falava ou escutava.
- Sem erros de JavaScript, HTTP ou WebGL.

Os testes de terreno verificam a continuidade das clareiras em toda a área da vila e o antigo limite retangular ao lado da casa comunitária. Os testes de navegação cobrem o acesso ao píer, as superfícies secas, as cordas, o interior do coreto, seus pilares e a passagem da propriedade.

`scripts/qa-village-pier-preview10.cjs` usa comandos de teclado e o movimento real do jogador para testar ida e volta no píer, bloqueio lateral e entrada no coreto. Também verifica as novas artes, a floresta, as rotas dos dez comércios, save e erros do navegador. As capturas foram conferidas visualmente.

`scripts/qa-social-preview10.cjs` repete a simulação das cinco duplas, conversas em comércio, ausência de movimento durante falas, retomada do trabalho, colisões e persistência depois das alterações de mapa.

Nenhuma tag ou release foi criada nesta etapa. A versão permanece preparada como `0.10.0-preview.10`.
