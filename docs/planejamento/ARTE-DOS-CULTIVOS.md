# Arte dos cultivos — etapa 3

19 plantas, com uma sprite comum de semente plantada (estágio 0) e seis sprites por espécie: semente, quatro fases de crescimento
(a última é a planta madura) e colheita. Os atlas originais estão em
`referencias/cultivos/`; os PNGs utilizados pelo jogo estão em
`public/assets/visual/crops/<id>/`.

Para preparar novamente os recortes: `node scripts/prepare-crops.cjs`.
Cada atlas tem 6 colunas × 4 linhas de 256 px. Ordem das colunas: semente,
broto, planta jovem, desenvolvimento, madura e colheita. O arquivo
`referencias/cultivos/catalogo.json` registra atlas e linha de cada planta.
Os recortes das espécies têm 192 px e transparência binária. O estágio 0 usa
`planted-seed.png`, sem broto, comum a todas as plantas. Os arquivos
`stage-0..3.png` são carregados como fases vegetativas 1..4; a fase 4 é madura.

`scripts/measure-crop-layout.cjs` mede a parte visível dos PNGs sem alterar a arte
e grava `src/data/crop-sprite-layout.json`. O preparo dos recortes também chama
essa medição. `src/crop-layout.ts` utiliza esses limites: rasteiras centralizadas
no canteiro, caules apoiados pela raiz, maduras com largura máxima de 26 px e
margem lateral de pelo menos 2 px. Jogo e editor compartilham o mesmo alinhamento.
Ícones de sementes e colheitas continuam centralizados.

As plantas só podem ser plantadas em terra arada com a enxada. A captura do jardim demonstra as fases sobre canteiros preparados.

Sementes podem ser equipadas na mochila ou na barra rápida. Rosa vende todas
as sementes; a estação e o tempo aparecem na descrição. Nenhum comerciante
vende colheitas. Os valores abaixo são o equilíbrio inicial, sujeito a testes.

| Planta | Estações | Dias regados | Rebrota | Semente (C) | Colheita (C) | Compradores |
|---|---|---:|---:|---:|---:|---|
| Nabo | Primavera | 4 | — | 8 | 8 | Rosa, Augusto e Nilo |
| Alface | Primavera | 4 | — | 8 | 18 | Rosa e Helena |
| Cenoura | Primavera | 6 | — | 12 | 26 | Rosa e Helena |
| Feijão | Primavera, Verão | 7 | 3 | 18 | 22 | Rosa e Helena |
| Tomate | Verão | 7 | 3 | 20 | 24 | Rosa e Helena |
| Milho | Verão | 8 | 4 | 22 | 28 | Rosa e Helena |
| Trigo | Verão, Outono | 6 | — | 10 | 24 | Rosa e Helena |
| Melancia | Verão | 12 | — | 30 | 80 | Rosa e Helena |
| Batata-doce | Outono | 8 | — | 16 | 38 | Rosa e Helena |
| Abóbora | Outono | 10 | — | 25 | 65 | Rosa e Helena |
| Aveia | Outono, Inverno | 6 | — | 10 | 24 | Rosa e Helena |
| Camomila | Outono | 6 | — | 12 | 28 | Amélia |
| Couve | Inverno | 5 | — | 10 | 22 | Rosa e Helena |
| Repolho | Inverno | 9 | — | 20 | 48 | Rosa e Helena |
| Morango | Primavera | 8 | 4 | 24 | 30 | Rosa e Helena |
| Margarida | Primavera | 5 | — | 10 | 24 | Rosa |
| Girassol | Verão, Outono | 8 | — | 18 | 38 | Rosa |
| Hortelã | Primavera, Verão | 5 | 3 | 16 | 18 | Amélia |
| Algodão | Verão, Outono | 10 | — | 22 | 56 | Celina |

O nabo conserva os ids `seeds` e `turnip` e os preços anteriores.
A cesta da Helena e a domesticação do cavalo são as etapas seguintes.

[Prévia das sementes, quatro fases e colheitas](qa-catalogo-cultivos/catalogo.png).
