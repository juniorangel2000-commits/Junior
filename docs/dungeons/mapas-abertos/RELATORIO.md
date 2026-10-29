# Mapas abertos e experiência junto da vida

Revisão local posterior a `mapas-e-hud`. Sem publicação.

As árvores e as construções foram retiradas da praça e do estacionamento, tanto na cena como nas prévias do menu e na geometria usada pela navegação. Não há colisões remanescentes dos prédios ou troncos. Foram mantidos os pisos, canteiros, fonte, veículos e pequenos objetos urbanos.

O banco ganhou uma arte vertical própria, com perspectiva redesenhada, madeira envelhecida, apoios claros e musgo. As duas laterais da fonte usam essa versão, com o banco da direita espelhado para manter os assentos voltados para o centro. O PNG original do atlas urbano permanece intacto; a nova arte fica em um arquivo separado, com transparência e recorte descrito em `benches.json`.

A barra de experiência saiu do topo. Experiência e nível aparecem no canto inferior esquerdo, ao lado da vida, com cores distintas e contadores. Ao completar as melhorias, o nível continua visível e a barra informa “Combinação completa”. Relógio, chefe, Arsenal e pet continuam nas bordas da tela. A disposição se adapta a telas estreitas.

## Validação

58 testes passaram em quatro arquivos: layout e retomada de saves, colisões, navegação e sistemas das dungeons. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

39 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem ausência de árvores e prédios nas cenas, bancos verticais voltados para a fonte, experiência e nível ao lado da vida, telas de 1600/680/521/390 pixels, cartas, combate, chefe, pausa e retomada do save. A câmera das capturas é controlada pelo roteiro; no jogo normal ela acompanha o personagem.

Não foi feita uma nova medição de dificuldade, FPS em Windows ou simulação de partidas completas nesta revisão.

[Praça](praca-completa.png) · [Estacionamento](estacionamento-completo.png) · [HUD ampla](hud-ampla.png) · [HUD de 521 pixels](hud-521.png) · [HUD de 390 pixels](hud-390.png) · [Menu](menu-cidade.png) · [Validação](validacao.json)
