# Ipês-amarelos e madeira nobre (preview.34, em andamento)

Seis ipês-amarelos existem somente nos Campos Abertos, em clareiras longe dos
caminhos, do abrigo e dos animais. Agora usam arte própria de ipê-amarelo em
`public/assets/visual/open-fields/ipe-yellow.png`, com copa florida irregular,
galhos visíveis e tronco retorcido. A recoloração da árvore comum foi removida.

A árvore tem 300 px de altura e aproximadamente 303 px de largura no mundo,
preservando a proporção da arte. As árvores comuns dos Campos têm até 220 px
de altura. O recorte e o apoio na raiz estão em `src/data/ipe-art.ts`; a margem
transparente é removida por um frame de textura, sem modificar os pixels originais.

Posições, ids dos seis ipês, colisão dos troncos, golpes, rendimentos, rebrota e
saves foram preservados. A copa continua translúcida ao passar por trás, e a
árvore balança pelo ponto de apoio ao receber um golpe.

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

- [Ipê com a arte nova](qa/ipe-de-pe.png)
- [Golpe de machadinha](qa/ipe-golpe.png)
- [Toco após o corte](qa/ipe-toco.png)
- [Madeira na mochila](qa/mochila-madeira-nobre.png)
- [Referência antiga, recolorida](ipe-de-pe.png)
- [Mapa atualizado dos Campos com os ipês](qa/mapa-campos-ipes.png) (o do canto superior
  esquerdo aparece como toco porque foi derrubado na conferência)
