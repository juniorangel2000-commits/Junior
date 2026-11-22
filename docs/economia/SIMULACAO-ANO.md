# Simulação de um ano — After Rain

Base: 1 minuto do relógio = 1 segundo real. Um dia (06:00–24:00) = 18 min reais. Um ano = 112 dias ≈ 34 h de jogo.
Tempos de trabalho estimados (segundos reais): till 2, plant 1.5, water 1.6, harvest 1.5, sellTrip 90, coastTrip 150, orchardTrip 120, swampTrip 140, lakeTrip 80, fieldsTrip 60, cast 22, cook 6, collect 3, pet 2.

## 1. Plantações (por canteiro, numa estação inteira de 28 dias)

| Planta | Estações | Semente | Venda | Dias | Rebrota | Colheitas | Lucro/canteiro | Trabalho (min) | Coroas por minuto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nabo | spring | 8 | 8 | 4 | — | 6 | 48 | 1.1 | **42.1** |
| Alface | spring | 8 | 22 | 4 | — | 6 | 84 | 1.1 | **73.7** |
| Cenoura | spring | 12 | 30 | 6 | — | 4 | 72 | 1 | **74** |
| Feijão | spring, summer | 30 | 24 | 7 | 4 | 6 | 114 | 0.9 | **122.8** |
| Tomate | summer | 30 | 24 | 7 | 4 | 6 | 114 | 0.9 | **122.8** |
| Milho | summer | 30 | 28 | 8 | 4 | 5 | 110 | 0.9 | **121.8** |
| Trigo | summer, autumn | 10 | 24 | 6 | — | 4 | 56 | 1 | **57.5** |
| Melancia | summer | 30 | 95 | 12 | — | 2 | 130 | 0.8 | **161.2** |
| Batata-doce | autumn | 16 | 42 | 8 | — | 3 | 78 | 0.9 | **87.6** |
| Abóbora | autumn | 25 | 75 | 10 | — | 2 | 100 | 0.7 | **142.9** |
| Aveia | autumn, winter | 10 | 24 | 6 | — | 4 | 56 | 1 | **57.5** |
| Camomila | autumn | 12 | 28 | 6 | — | 4 | 64 | 1 | **65.8** |
| Couve | winter | 10 | 22 | 5 | — | 5 | 60 | 1.1 | **55.4** |
| Repolho | winter | 20 | 48 | 9 | — | 3 | 84 | 1 | **86.6** |
| Morango | spring | 40 | 30 | 8 | 4 | 5 | 110 | 0.9 | **121.8** |
| Margarida | spring | 10 | 24 | 5 | — | 5 | 70 | 1.1 | **64.6** |
| Girassol | summer, autumn | 18 | 44 | 8 | — | 3 | 78 | 0.9 | **87.6** |
| Hortelã | spring, summer | 16 | 16 | 5 | 4 | 6 | 80 | 0.9 | **86.2** |
| Algodão | summer, autumn | 22 | 62 | 10 | — | 2 | 80 | 0.7 | **114.3** |

- spring: melhor Feijão (122.8 C/min), pior Nabo (42.1 C/min).
- summer: melhor Melancia (161.2 C/min), pior Trigo (57.5 C/min).
- autumn: melhor Abóbora (142.9 C/min), pior Aveia (57.5 C/min).
- winter: melhor Repolho (86.6 C/min), pior Couve (55.4 C/min).

## 2. Animais

Palha: de graça com capim dos Campos (cortar ~3 s) ou 3 fibras (0 C de venda perdida).

| Animal | Preço | Rende por dia | Palha | Lucro/dia | Dias para pagar | Com qualidade excelente (1,5×) |
| --- | --- | --- | --- | --- | --- | --- |
| Galinha | 250 | 20 | 1 | 20 | 13 | 8 |
| Pato | 300 | 16.5 | 1 | 16.5 | 18 | 12 |
| Vaca | obtida de outro jeito | 30 | 1 | 30 | — | — |
| Cabra | obtida de outro jeito | 36 | 1 | 36 | — | — |
| Ovelha | obtida de outro jeito | 20 | 1 | 20 | — | — |
| Porco | 400 | 0 | 1 | 0 | — | — |

## 3. Máquinas (valor acrescentado)

| Máquina | Entrada | Saída | Horas | Valor entra | Valor sai | Ganho por carga | Ganho por dia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Barril de conservas | 3 strawberry | 1 strawberryJam | 72 | 130 | 170 | 40 | 13 |
| Barril de conservas | 3 watermelon | 1 watermelonJam | 72 | 325 | 430 | 105 | 35 |
| Prensa de cera | 2 beeswax | 1 candle | 12 | 60 | 80 | 20 | 40 |
| Composteira | 2 manure | 2 fertilizer | 48 | 0 | 0 | 0 | 0 |
| Composteira | 2 manure | 2 fertilizer | 48 | 0 | 0 | 0 | 0 |
| Queijeira | 1 milk | 1 cheese | 24 | 30 | 70 | 40 | 40 |
| Queijeira | 1 goatMilk | 1 goatCheese | 24 | 36 | 85 | 49 | 49 |
| Batedeira de manteiga | 2 milk | 1 butter | 12 | 60 | 90 | 30 | 60 |
| Roca | 1 wool | 1 yarn | 24 | 60 | 90 | 30 | 30 |
| Tear | 2 yarn | 1 woolCloth | 24 | 180 | 240 | 60 | 60 |
| Moinho de pedra | 1 wheat | 1 flour | 12 | 24 | 40 | 16 | 32 |
| Moinho de pedra | 1 corn | 1 cornmeal | 12 | 28 | 46 | 18 | 36 |
| Moinho de pedra | 1 oat | 1 oatFlakes | 12 | 24 | 40 | 16 | 32 |
| Colmeia | 0 honey | 1 honey | 96 | 0 | 40 | 40 | 10 |

## 4. Cozinha (vender o prato × vender os ingredientes)

| Prato | Onde | Ingredientes valem | Prato vale | Ganho | Prato do dia (2×) | Vigor |
| --- | --- | --- | --- | --- | --- | --- |
| Torta de morango | oven | 262 | 380 | 118 | 498 | 70 |
| Pão com queijo e mel | stove | 307 | 415 | 108 | 523 | 80 |
| Torta de maçã | oven | 228 | 335 | 107 | 442 | 70 |
| Broa de milho | oven | 204 | 300 | 96 | 396 | 50 |
| Café da manhã reforçado | stove | 247 | 335 | 88 | 423 | 50 |
| Bolo de cenoura | oven | 182 | 265 | 83 | 348 | 60 |
| Bolo de mel | oven | 172 | 250 | 78 | 328 | 75 |
| Sopa de abóbora | stove | 209 | 285 | 76 | 361 | 60 |
| Caranguejada | stove | 112 | 180 | 68 | 248 | 65 |
| Pamonha | stove | 178 | 245 | 67 | 312 | 55 |
| Pão caseiro | oven | 132 | 195 | 63 | 258 | 45 |
| Doce de pera | stove | 70 | 130 | 60 | 190 | 40 |
| Feijão tropeiro | stove | 138 | 190 | 52 | 242 | 70 |
| Doce de leite | stove | 132 | 180 | 48 | 228 | 45 |
| Mingau de aveia | stove | 112 | 155 | 43 | 198 | 50 |
| Suco de melancia | stove | 113 | 155 | 42 | 197 | 30 |
| Suco de laranja | stove | 30 | 70 | 40 | 110 | 30 |
| Caldo do mineiro | stove | 86 | 120 | 34 | 154 | 65 |
| Salada da horta | stove | 78 | 110 | 32 | 142 | 35 |
| Ensopado de peixe | stove | 80 | 110 | 30 | 140 | 70 |
| Omelete de couve | stove | 64 | 90 | 26 | 116 | 40 |
| Chá de camomila com mel | stove | 70 | 95 | 25 | 120 | 35 |
| Peixe assado | campfire | 14 | 30 | 16 | 46 | 30 |
| Batata-doce assada | campfire | 44 | 60 | 16 | 76 | 25 |
| Milho assado | campfire | 30 | 40 | 10 | 50 | 20 |

## 5. Coleta, pesca e serviços

| Atividade | Coroas por visita | Minutos | Coroas por minuto | Observação |
| --- | --- | --- | --- | --- |
| Conchas (Costa) | 81 | 3.7 | **21.9** | 9 pontos, voltam em 2 dias |
| Caranguejo com rede (5 por visita) | 110 | 3.8 | **29.3** | rede custa 120 |
| Frutas do Pomar | 98 | 2.7 | **36.3** | 7 frutas, voltam em 3 dias |
| Íris azul | 180 | 3.3 | **54** | 3 plantas, voltam em 7 dias |
| Pesca no lago (10 lançamentos) | 113 | 5 | **22.6** | ~5% raro |
| Lenha (20 madeiras) | 40 | 2 | **20** | machadinha |
| Pedra (20) | 0 | 2 | **0** | picareta |
| Sucata (10) | 40 | 1.7 | **24** |  |

Contratos: tobias 20 wood → 90 C (vale 40 na loja); helena 10 turnip → 100 C (vale 80 na loja); amelia 12 herb → 80 C (vale 24 na loja); bento 15 scrap → 120 C (vale 60 na loja).

## 6. O ano dia a dia

Dias de chuva no ano 1: 28 (primavera 10, verão 5, outono 7, inverno 6). A chuva ainda não rega a horta.

Saídas aos cenários no ano: rosa 23, amelia 24, nilo 24, icaro 25, damiao 23, celina 24, tobias 24.
Folgas no ano: augusto 16, rosa 16, tobias 16, amelia 16, nilo 16, celina 16, icaro 16.

### Conflitos e furos encontrados

- Nenhum.

### Festivais: valor do prêmio × custo da entrega

- Feira das Sementes: entrega mais barata vale 72 C; prêmio ≈ 420 C.
- Festa da Praia: entrega mais barata vale 66 C; prêmio ≈ 366 C.
- Festa da Colheita: entrega mais barata vale 120 C; prêmio ≈ 790 C.
- Noite das Lanternas: entrega mais barata vale 30 C; prêmio ≈ 326 C.