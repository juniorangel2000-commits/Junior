# Ipês-amarelos e madeira nobre (preview.34, em andamento)

Seis ipês-amarelos existem somente nos Campos Abertos, em clareiras longe dos
caminhos, do abrigo e dos animais. A copa dourada é gerada em memória a partir
da árvore `asset-tree-1` do projeto: a folhagem é remapeada para tons de amarelo
pela luminosidade, e tronco, contorno e sombra mantêm as cores originais.

| Regra | Valor |
| --- | --- |
| Ferramenta | Machadinha de Ferro ou melhor. A de Pedra é recusada sem golpe. |
| Golpes | 6 por árvore, cada um gasta 1 de durabilidade da cópia usada |
| Madeira nobre por árvore | Ferro 1 · Ouro 2 · Metal Negro 3 (mais 2 galhos) |
| Rebrota | 7 dias; enquanto isso fica um toco |
| Galinheiro | +6 madeiras nobres |
| Curral | +10 madeiras nobres |

**Regra do projeto:** toda construção de animais, inclusive as próximas, exige
madeira nobre (`ANIMAL_BUILDING_MATERIAL` em `src/data/farm-buildings.ts`). O
teste `tests/ipe-trees.test.ts` falha se uma construção com `animal` não pedir.

Compatibilidade: os ids das moitas de capim não mudam (os troncos dos ipês são
registrados depois de gerar as moitas). Saves antigos recebem a madeira nobre com
estoque zero. Galinheiros e currais já concluídos continuam válidos; obras em
andamento passam a pedir a madeira nobre para terminar.

A madeira nobre usa `public/assets/visual/open-fields/hardwood.png`, recolorida a
partir do ícone de troncos do projeto.

Conferência no navegador: `scripts/qa-ipe-trees.cjs` (servidor Vite em
`127.0.0.1:5190`). Ela verifica a recusa da machadinha de pedra, os seis golpes com
ferro, o toco, a madeira na mochila, o mapa e o toco mantido ao continuar o jogo.

- [Ipê de pé](ipe-de-pe.png)
- [Mapa dos Campos com os ipês](mapa-campos-ipes.png) (o do canto superior
  esquerdo aparece como toco porque foi derrubado na conferência)
