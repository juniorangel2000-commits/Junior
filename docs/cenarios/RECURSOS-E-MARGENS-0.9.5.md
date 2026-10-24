# After Rain 0.9.5 — recursos, terreno e luz

Esta revisão substitui os detalhes visuais e de temporização dos documentos locais anteriores. Os mapas do autor e seus pontos de transição são preservados.

## Recursos

| Objeto | Ferramenta | Recompensa |
| --- | --- | --- |
| Samambaia, flores brancas, arbusto, juncos | Mãos | 6 fibras |
| Arbusto de berries | Mãos | 3 sementes e 2 fibras |
| Pedras pequenas novas | Mãos | 3 pedras |
| Galhos novos | Mãos | 4 madeiras e 3 galhos |
| Tronco caído | Machado, 3 golpes | 6 madeiras, 2 troncos e 2 galhos |
| Toco | Machado, 3 golpes | 4 madeiras, 1 tronco e 1 galho |
| Rochas musgosas, altas, seixos agrupados e pedras baixas | Picareta, 5 golpes | 4 pedras |

Os recursos soltos surgem aleatoriamente respeitando o teto de 64 na propriedade e 48 na floresta. A população inclui troncos e tocos. Juncos só surgem na margem do rio da propriedade, nunca no interior ou ao redor de lagos. As outras três plantas de fibra aparecem nos dois cenários.

Coletas manuais aguardam 4.320 minutos (três dias completos do jogo). O prazo, a espécie, os golpes parciais e as coletas são salvos. O retorno usa outra posição livre e outro ID, respeitando o limite. Rochas mantêm seu prazo anterior de 240 minutos; troncos e tocos usam três dias. A migração dos prazos antigos é feita uma única vez, sem recriar recompensas.

Berries, pedras pequenas e galhos têm novas artes transparentes, preservadas em `public/assets/visual/nature`. As imagens antigas foram retiradas das rotas ativas, mantendo os arquivos originais para preservar trabalho. Plantas recolhíveis saem quando seu piso é pintado no editor; desfazer restaura a pintura e o objeto juntos. Plantas aleatórias não retornam sobre pisos personalizados.

## Propriedade

Rio ampliado de 128 para 160 pixels, com margens arenosas irregulares e úmidas também nos lagos. As pontes têm 192 e 224 pixels, com cabeceiras em terra e guarda-corpos. Não é possível subir da água diretamente no tablado nem sair dele lateralmente para a água.

O acesso à casa é um caminho curvo de terra até a ponte, sem pedras gastas grandes. Recursos aleatórios evitam a passagem. Árvores são verificadas em nove pontos da célula de raiz; as afetadas pela nova margem mudam para terra próxima, conservando IDs e progresso. O editor também rejeita raízes parcialmente sobre a água.

Canteiros secos e molhados, solo removível com Shift + enxada + E/clique, e as melhorias de fabricação/primeira colheita fazem parte desta revisão. A enxada usa a arte provisória até o envio da nova animação pelo autor.

## Fases do dia

Madrugada 00:00–06:00; manhã 06:00–12:00; tarde 12:00–19:00; noite 19:00–00:00. A cor e a intensidade interpolam continuamente, inclusive na meia-noite, com luz dourada no fim da tarde e azul frio na madrugada. A noite mantém visibilidade para explorar.

Esc → Visual do vale permite desligar o efeito e ajustar sua intensidade. A preferência é salva separadamente da partida, funciona nos dois cenários e é aplicada mesmo com o menu aberto. O interior da casa recebe apenas uma fração do efeito. HUD, mapa de consulta, editor e animação chuvosa da tela inicial permanecem legíveis. O efeito funciona em Canvas e WebGL sem exigir pipeline de shader.

## Validação

`npm run check`, 453 testes em 43 arquivos e `npm run build`. QA com Chromium: coleta/reload, golpes e recompensas, três dias/limites, juncos, pontes, nado, margens, canteiros secos/molhados, troca de área, fases do dia, preferências/reload e pintura/desfazer plantas. Relatórios JSON em `recursos-renovaveis`, `propriedade-pontes-agua` e `fases-do-dia`.
