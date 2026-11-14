# Máquinas de processamento

Implementado no branch `release/v0.10.0-preview.35`, ainda sem publicação. Dados em
`src/data/machines.ts`; regras em `src/systems/machines.ts`.

## Aprender e montar

Cada projeto é aprendido uma vez, num serviço do NPC, e fica salvo em
`villageProgress.recipes`. Depois a máquina é montada na **bancada**, com martelo.

| Máquina | Ensina | Projeto | Montagem na bancada |
| --- | --- | --- | --- |
| Queijeira | Bento | 60 C | 8 tábuas regulares, 2 lingotes de ferro, 4 cavilhas |
| Batedeira de manteiga | Bento | 50 C | 6 tábuas regulares, 4 fragmentos de ferro, 2 cavilhas |
| Roca | Tobias | 40 C | 8 tábuas regulares, 4 cordas, 4 cavilhas |
| Tear | Tobias | 50 C | 12 tábuas regulares, 6 cordas, 6 cavilhas, 2 madeiras nobres |
| Moinho de pedra | Ícaro | 60 C | 20 pedras, 2 lingotes de ferro, 6 tábuas regulares, 1 peça metálica |

## Instalar e recolher

- A máquina pronta é um item da mochila. **Usar** pela mochila ou pela barra rápida
  coloca a máquina no chão, à frente do jogador.
- Vale na Propriedade e nos interiores do galinheiro, do curral e do aprisco. Não vale
  na casa, nas masmorras nem em outros mapas.
- O jogo recusa lugares que bloqueiem a passagem ou fiquem sobre água, recursos,
  construções, plantações, personagens, animais ou portas.
- E na máquina **vazia** devolve a máquina para a mochila. Trabalhando, ela não pode
  ser recolhida. Pronta, E entrega só o produto, e a máquina continua instalada.

## Carregar e coletar

- Usar a matéria-prima, ou E com ela selecionada, de frente para a máquina coloca
  uma carga. Cada máquina processa **uma carga por vez**.
- O tempo corre pelo relógio do jogo, mesmo com o jogador em outro cenário ou
  dormindo. Recarregar o save não reinicia nem duplica a carga.
- Durante o trabalho a máquina alterna duas poses e mostra uma barra discreta.
  Quando termina, um **balão no estilo da HUD** mostra o produto até a coleta.

| Máquina | Entrada | Saída | Tempo |
| --- | --- | --- | --- |
| Queijeira | 1 leite | 1 queijo | 1 dia |
| Queijeira | 1 leite de cabra | 1 queijo de cabra | 1 dia |
| Batedeira de manteiga | 2 leites | 1 manteiga | meio dia |
| Roca | 1 lã | 1 novelo | 1 dia |
| Tear | 2 novelos | 1 tecido | 1 dia |
| Moinho de pedra | 2 trigos | 1 farinha | meio dia |
| Moinho de pedra | 2 milhos | 1 fubá | meio dia |
| Moinho de pedra | 2 aveias | 1 aveia em flocos | meio dia |

## Comércio

Nenhuma loja vende os produtos novos. Preços iniciais, a ajustar jogando:

| Comprador | Produto | Preço |
| --- | --- | --- |
| Helena | Queijo | 40 |
| Helena | Queijo de cabra | 52 |
| Helena | Manteiga | 48 |
| Helena | Farinha | 24 |
| Helena | Fubá | 26 |
| Helena | Aveia em flocos | 22 |
| Celina | Novelo | 54 |

O tecido continua sendo o item que já existia, com as mesmas regras e o mesmo estoque.

## Save

- `save.machines` é opcional. Cada máquina guarda id, espaço (`property` ou
  `farm:<id da obra>`), posição e carga `{recipe, startedAt, readyAt}`.
- Instalar, carregar, coletar e recolher salvam antes de aplicar. Mochila cheia ou
  falha ao salvar preservam os itens e as cargas.
- Saves anteriores começam sem máquinas instaladas.

## Arte e verificação

- Arte em `public/assets/visual/machines/`. Os originais `source.png` e
  `products-source.png` estão preservados. `scripts/pack-machine-art.cjs` gera os
  recortes e os ícones sem reduzir os pixels; os hashes ficam em `art.json`.
- Testes: `tests/machines.test.ts` (26).
- Navegador: `scripts/qa-machines.cjs`, com evidências em `docs/planejamento/qa-maquinas/`.
