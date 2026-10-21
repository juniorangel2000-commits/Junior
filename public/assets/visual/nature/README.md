# Decoração de pedras e flores

`decorations.png` é um atlas original criado com a ferramenta de geração de imagens, tomando as árvores e os recursos do próprio jogo como referência. A fonte de **1254×1254 pixels** permanece preservada, em uma grade 3×3 com células de 418 pixels.

SHA-256: `eb7c04ffb111d15589e64fa2f480dd4b7a1ebe7c0a41172f3cdfd156b740807f`.

| Célula | Chave preparada | Canvas | Uso |
| --- | --- | --- | --- |
| 1 | `asset-paving-0` | 36×22 | Pedra de passagem irregular |
| 2 | `asset-paving-1` | 38×20 | Pedra de passagem alongada |
| 3 | `asset-paving-2` | 32×20 | Pedra de passagem curta |
| 4 | `asset-flowers-white` | 32×28 | Flores brancas com folhagem |
| 5 | `asset-flowers-pink` | 32×28 | Flores rosadas e lilases |
| 6 | `asset-flowers-yellow` | 30×26 | Flores amarelas |
| 7 | `asset-shore-stones` | 38×22 | Grupo baixo de pedras com musgo |
| 8 | `asset-fern` | 32×30 | Samambaia |
| 9 | `asset-grass-tuft` | 28×24 | Capim baixo |

A leitura das células segue da esquerda para a direita, de cima para baixo. `src/decor-sprites.ts` recorta cada peça proporcionalmente, alinha a base e prepara alpha binário: valores menores que 160 ficam transparentes. A adaptação também descarta resíduos vermelhos saturados nas bordas da geração. Essas operações acontecem na cópia em memória, sem alterar o PNG-fonte.

Os sprites usam nearest-neighbor. As pedras pequenas e as flores são compostas nas camadas estáticas existentes; não criam colisões, itens coletáveis ou dados de save. Os assets procedurais anteriores continuam como fallback. `trees-approved.png`, o atlas de árvores da etapa anterior, permanece intacto.

Veja [capturas, integração e validação](../../../../docs/decoracao-pedras-flores.md).
