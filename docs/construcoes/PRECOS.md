# Equilíbrio de preços (preview.36)

Regra conferida por `tests/prices-balance.test.ts`. O valor de um ingrediente é o maior
preço que algum morador paga por ele.

1. **Máquinas:** o produto vale pelo menos **1,3×** o que entra (composteira, colmeia e
   forno ficam fora: o adubo não é vendido e o forno segue a regra dos pratos).
2. **Pratos:** valem pelo menos o valor dos ingredientes mais 1 madeira de lenha, vezes
   **1,35** no fogão, **1,45** no forno e **1,3** na fogueira, arredondado de 5 em 5.
3. **Sem atalho:** nenhum item é vendido por um morador mais barato do que outro morador
   paga por ele.
4. A qualidade multiplica o preço de venda: bom 1,25×, excelente 1,5×
   (`docs/construcoes/QUALIDADE.md`).

## O que mudou

| Item | Antes | Agora | Motivo |
| --- | --- | --- | --- |
| Moinho | 2 grãos → 1 farinha | 1 grão → 1 farinha | 2 trigos valiam 48 e a farinha 24 |
| Farinha / Fubá / Aveia em flocos | 24 / 26 / 22 | 32 / 37 / 32 | 1,3× o grão |
| Tear | 2 novelos → tecido (8 C) | 2 novelos → **tecido de lã** (150 C) | 2 novelos valem 108 |
| Geleia de melancia | 330 | 370 | 3 melancias e 1 mel valem 280 |

| Prato | Antes | Agora |
| --- | --- | --- |
| Omelete de couve | 36 | 55 |
| Salada da horta | 60 | 95 |
| Pão caseiro | 80 | 130 |
| Café da manhã reforçado | 120 | 210 |
| Broa de milho | 115 | 190 |
| Pamonha | 110 | 165 |
| Sopa de abóbora | 110 | 205 |
| Bolo de cenoura | 110 | 180 |
| Feijão tropeiro | 100 | 155 |
| Suco de melancia | 70 | 135 |
| Mingau de aveia | 75 | 120 |
| Chá de camomila com mel | 55 | 95 |
| Doce de leite | 95 | 120 |
| Torta de morango | 160 | 275 |
| Pão com queijo e mel | 170 | 285 |
| Milho assado | 22 | 40 |
| Batata-doce assada | 26 | 50 |
| Caldo do mineiro | 90 | 95 |
| Ensopado de peixe | 95 | 110 |
| Bolo de mel | 150 | 190 |

O peixe assado ficou em 30. O prato do dia continua pagando o dobro.

## A conferir jogando

- Os preços dos animais (galinha, vaca, pato 300 C, porco 400 C) e o tempo para eles se
  pagarem com ovo, leite e qualidade.
- Se o ovo (8 C) e o leite (16 C) estão baixos demais perto das colheitas.
- Se a lucratividade dos pratos está alta demais no começo do jogo.
