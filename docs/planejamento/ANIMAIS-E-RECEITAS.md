# Animais, produtos e receitas — proposta

Status: proposta de 14/11/2026, a partir do pedido do Junior:
- ovelha e cabra completas;
- porco, pato e abelhas novos;
- cada animal com seu produto e receitas;
- receitas que misturam matérias-primas.

Os valores são pontos de partida para ajustar. Complementa `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`, que já define a alimentação com palha, os ovos e a ordenha, e vale para todos os animais abaixo.

## Regras gerais

- Cada animal alojado e **alimentado no dia** produz; sem comida, a produção pausa.
- **Comércio:** como nas colheitas, **nenhuma loja vende** produtos animais, artesanais ou pratos. **NPCs específicos compram** do jogador.
- **Toda construção de animais exige madeira nobre**, inclusive aprisco, chiqueiro e colmeia.
- Produtos e pratos podem ser vendidos, usados em receitas ou pedidos em contratos e missões.

## Animais e produtos

| Animal | Moradia | Como conseguir | Produto | Frequência | Como coletar |
| --- | --- | --- | --- | --- | --- |
| Galinha | Galinheiro | Floresta ou Rosa (já existe) | Ovo | 1 por dia | Aparece no chão do galinheiro |
| Pato (novo) | Galinheiro (divide com as galinhas) | Rosa | Ovo de pato; pena (às vezes) | Ovo a cada 2 dias; pena 1 em 4 coletas | Chão do galinheiro |
| Vaca | Curral | Floresta (já existe) | Leite | 1 por dia | Ordenha com balde |
| Cabra | Aprisco (novo) | Floresta (já existe) | Leite de cabra | 1 por dia | Ordenha com balde |
| Ovelha | Aprisco (novo) | Floresta (já existe) | Lã | A cada 3 dias | Tosquia com tesoura (nova ferramenta) |
| Porco (novo) | Chiqueiro (novo) | Rosa | Esterco | 1 por dia | Aparece no chão do chiqueiro |
| Abelhas (novo) | Colmeia (objeto, sem cercado) | Enxame (ver abaixo) | Mel; cera | Mel a cada 4 dias; cera 1 em 3 coletas | E na colmeia |
| Cavalo | Estábulo | Doma | — | — | Montaria no futuro |

- **Mel conforme as flores:** com margaridas ou girassóis plantados perto da colmeia, o mel vira "mel de margarida" ou "mel de girassol", que valem mais. Isso dá uso às flores do catálogo.
- **Abelhas sem alimentação:** colmeias não comem palha. Elas produzem de março a novembro do jogo (Primavera a Outono) e param no Inverno.
- **Enxame:** sugestão de que apareça nos ipês floridos dos Campos Abertos, coletado com uma caixa de abelhas feita na bancada. Alternativa: comprar a colmeia pronta.

## Equipamentos de produção (artesanato)

São fabricados na bancada e colocados na Propriedade. Você põe a matéria-prima, espera e retira o produto.

| Equipamento | Entrada | Saída | Tempo |
| --- | --- | --- | --- |
| Queijeira | 1 leite / 1 leite de cabra | 1 queijo / 1 queijo de cabra | 1 dia |
| Batedeira de manteiga | 2 leites | 1 manteiga | meio dia |
| Roca | 1 lã | 1 novelo | 1 dia |
| Tear | 2 novelos | 1 Tecido (item que já existe, usado pela Celina) | 1 dia |
| Moinho de pedra | 2 trigos / 2 milhos / 2 aveias | 1 farinha / 1 fubá / 1 aveia em flocos | meio dia |
| Composteira | 2 estercos + 3 capins ou fibras | 2 Fertilizantes (item que já existe) | 2 dias |
| Barril de conservas | 3 frutas (morango ou melancia) + 1 mel | 1 geleia | 3 dias |
| Prensa de cera | 2 ceras | 1 vela | meio dia |

## Cozinha: receitas que misturam matérias-primas

Sugestão: um **fogão a lenha** dentro de casa, montado como mobília. Cada prato gasta 1 lenha (madeira comum) e recupera vigor; alguns NPCs compram ou pedem em missões.

| Prato | Ingredientes | Vigor |
| --- | --- | --- |
| Omelete de couve | 2 ovos + 1 couve | 40 |
| Salada da horta | 1 alface + 1 tomate + 1 cenoura | 35 |
| Pão caseiro | 2 farinhas + 1 ovo + 1 leite | 45 |
| Broa de milho | 2 fubás + 1 ovo + 1 manteiga | 50 |
| Bolo de cenoura | 2 farinhas + 2 ovos + 1 cenoura + 1 leite | 60 |
| Pamonha | 2 milhos + 1 leite + 1 manteiga | 55 |
| Mingau de aveia | 1 aveia em flocos + 1 leite + 1 mel | 50 |
| Sopa de abóbora | 1 abóbora + 1 batata-doce + 1 manteiga | 60 |
| Feijão tropeiro | 2 feijões + 1 couve + 1 ovo + 1 fubá | 70 |
| Torta de morango | 2 farinhas + 2 morangos + 1 manteiga + 1 ovo de pato | 70 |
| Doce de leite | 3 leites + 1 mel | 45 |
| Pão com queijo e mel | 1 pão caseiro + 1 queijo + 1 mel | 80 |
| Suco de melancia | 1 melancia + 1 hortelã | 30 |
| Chá de camomila com mel | 1 camomila + 1 mel | 35 |

Alguns pratos podem dar efeitos além do vigor (por exemplo, andar mais rápido ou pescar melhor por algumas horas). Isso fica para uma etapa posterior.

## Quem compra

| NPC | Compra |
| --- | --- |
| Helena (pousada) | Ovos, leite, queijo, manteiga, farinha e pratos |
| Rosa (sementes) | Ovos, ovos de pato e fertilizante |
| Celina (costura) | Lã, novelo, tecido e penas |
| Amélia (ervas) | Mel, cera, vela e chás |
| Nilo (viajante) | Queijos, geleias e mel de flor (leva para outras regiões, paga mais e aparece em dias certos) |

## Arte necessária

- **Animais animados** no padrão da vaca e do cavalo, em 8 direções, andando e parados: ovelha, cabra, porco e pato. A ovelha e a cabra existem hoje só como arte simples.
- **Construções:** aprisco e chiqueiro (o estábulo está com o Codex). Colmeia como objeto, mais abelhas pequenas voando perto.
- **Ícones:**
  - Produtos: ovo de pato, pena, leite de cabra, lã, esterco, mel (3 tipos), cera.
  - Artesanato: queijo (2), manteiga, novelo, farinha, fubá, aveia em flocos, geleia (2), vela.
  - Pratos: os 14 da tabela.
  - Ferramentas: balde de ordenha e tesoura de tosquia.
- **Equipamentos**, com estados vazio, trabalhando e pronto: queijeira, batedeira, roca, tear, moinho, composteira, barril, prensa e fogão a lenha.

## Ordem sugerida

1. Produção básica: alimentação, ovo e leite (`PRODUCAO-ANIMAL-PLANO.md`).
2. Ovelha e cabra: arte animada, aprisco, lã, leite de cabra e tesoura.
3. Primeiros equipamentos: queijeira, batedeira, roca, tear e moinho.
4. Fogão a lenha e as receitas de cozinha.
5. Porco (chiqueiro, esterco e composteira), pato e abelhas (colmeia, mel e cera).
6. Barril de conservas, prensa de cera, efeitos dos pratos e equilíbrio de preços.

## Decisões em aberto

- Processar em **equipamentos na Propriedade** (proposta acima) ou por **serviços de NPC**, como a cesta da Helena?
- O porco produz esterco (que vira fertilizante)? Ou prefere outro produto?
- Cozinhar no **fogão a lenha de casa**?
- Abelhas: enxame nos ipês ou colmeia comprada?
- Preços de venda de cada produto.
