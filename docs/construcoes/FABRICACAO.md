# Fabricação por lugar e categoria (preview.39)

Pedido do Junior: separar o que é feito sem bancada, na bancada de trabalho e numa bancada de
construção nova, e dividir em categorias. Dados em `src/data/recipe-groups.ts`.

## Onde cada receita é feita

| Lugar | Categorias e receitas |
| --- | --- |
| **Sem bancada** | Materiais: corda, pedra lascada, cabo, cavilhas, tecer tecido · Ferramentas: machadinha, picareta, enxada, martelo, foice, pá · Ações: preparar tábuas com machadinha · Preparados: curativo, tônico, infusão, adubo vegetal · Construções: fogueira portátil |
| **Bancada de trabalho** | Materiais: lâmina de sucata · Ferramentas: serrote, tesoura de tosquia, balde de ordenha · Equipamentos: espada, mochila, botas, acessório de pesca · Ações: serrar tábuas |
| **Bancada de construção** | Construções: porta, janela, banco de madeira, forja, luminária, bomba de irrigação · Máquinas: queijeira, batedeira, roca, tear, moinho, forno de barro, composteira, barril, prensa · Kits: casa, oficina, base |

Receita nova sem grupo: bancada de trabalho se pedir bancada, senão sem bancada; categoria
Materiais.

## Bancada de construção

- Montada no modo de construção, como a bancada de trabalho: 8 tábuas serradas, 6 pedras e
  4 cavilhas, com o martelo. Usada com E (abre a aba dela).
- Arte provisória: a bancada de trabalho com tábuas, tijolos e esquadro por cima. A arte
  definitiva (2 blocos de largura) está pedida em `docs/planejamento/ARTE-PENDENTE.md`.

## Janela de fabricação

Abas no alto: Sem bancada, Bancada de trabalho e Bancada de construção (com "ao alcance" ou
"longe"). Abaixo, as categorias da aba (Todas e as que existem nela). As receitas de uma
bancada longe aparecem, mas o botão pede para se aproximar.

## Cerca sem módulo

- A cerca é construída direto no modo de construção com 3 madeiras por trecho. O reparo de
  um trecho desgastado custa 2 madeiras.
- A receita do módulo saiu, e o carpinteiro não compra nem vende mais módulos.
- Saves anteriores: cada módulo na mochila vira 3 madeiras (migração em `save.ts`, com teste).
  O item `fenceKit` continua existindo só para os saves antigos abrirem.
