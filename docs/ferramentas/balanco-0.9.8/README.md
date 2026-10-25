# Machado e picareta — balanço 0.9.8

Capturas reais do jogo: preparação, contato e recuperação nos dois personagens e nos dois lados. Os GIFs mostram machado em cima, picareta embaixo, esquerda e direita lado a lado. As árvores foram ocultas apenas para estas capturas.

As ferramentas mantêm uma sprite original rígida, com pivô estável e rotação espelhada, seguindo a abordagem da enxada. O contato permanece no quadro 4, a 18 quadros por segundo; um golpe aplica o efeito uma única vez. Enxada e regador mantêm suas animações anteriores. Todos os PNGs e clipes originais enviados pelo autor foram preservados.

- `farmer-female-machado-picareta.gif` e `farmer-male-machado-picareta.gif`: ciclos completos.
- `farmer-female-preparacao-impacto-retorno.png` e `farmer-male-preparacao-impacto-retorno.png`: fases do golpe.
- `validacao.json`: ações reais com E, contato único, cancelamento, pivô, espelhamento e comparação dos pixels carregados com os PNGs originais.

Reproduzir: `NODE_PATH=/tmp/after-rain-browser/node_modules QA_URL=http://127.0.0.1:5178 node scripts/qa-tool-swings.cjs`. A QA também gera os quadros intermediários localmente.
