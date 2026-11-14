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
| Abelhas (novo) | Colmeia (objeto, sem cercado) | Colmeia artificial comprada na Vila + enxame dos ipês (ver abaixo) | Mel; cera | Mel a cada 4 dias; cera 1 em 3 coletas | E na colmeia |
| Cavalo | Estábulo | Doma | — | — | Montaria no futuro |

- **Mel conforme as flores:** com margaridas ou girassóis plantados perto da colmeia, o mel vira "mel de margarida" ou "mel de girassol", que valem mais. Isso dá uso às flores do catálogo.
- **Abelhas sem alimentação:** colmeias não comem palha. Elas produzem de março a novembro do jogo (Primavera a Outono) e param no Inverno.
- **Enxame (decisão do Junior):**
  1. A **colmeia artificial vazia é comprada na Vila**; sugestão: Armazém do Augusto.
  2. Você a coloca perto de um **ipê** nos Campos Abertos, como a cesta (até 2 blocos do tronco).
  3. **A cada 5 dias** há uma chance de um enxame ocupá-la (proposta: 40%, ajustável).
  4. Com o enxame dentro, E recolhe a **colmeia povoada**, que é colocada na Propriedade e passa a produzir.
  5. Sem enxame, a colmeia continua esperando; E recolhe a colmeia vazia de volta.
  - Por ser comprada e não construída, a colmeia fica **fora da regra da madeira nobre**, a menos que o Junior queira incluí-la no preço.

## Ambientes internos das construções de animais

Pedido do Junior: galinheiro, curral e as próximas construções de animais (aprisco, chiqueiro, estábulo) ganham **interior**, e as **máquinas podem ser colocadas lá dentro**. O cenário segue o modelo de interior da casa e da ferraria (grade de 32 px, objetos com colisão), mas **as máquinas não usam editor**: são colocadas como a cesta do cavalo (ver abaixo).

**Entrada:** E na porta da construção pronta abre o interior, com transição como a da casa. A saída fica pela mesma porta.

**Tamanhos propostos:**

| Construção | Interior | Fixos |
| --- | --- | --- |
| Galinheiro | 10×8 | Cocho, bebedouro e 6 ninhos (os ovos aparecem nos ninhos) |
| Curral | 14×10 | Cocho, bebedouro e 4 baias (ordenha na baia) |
| Aprisco | 12×9 | Cocho, bebedouro e cercadinho de tosquia |
| Chiqueiro | 10×8 | Cocho e lamaçal |
| Estábulo | 8×7 | Baia, cocho e suporte da sela (para a montaria futura) |

**Animais:** de dia (06:00–18:00) ficam no cercado externo, com a porteira aberta; à noite entram e aparecem lá dentro, onde também dá para alimentar, ordenhar, tosquiar e recolher ovos. Mais tarde, a chuva também pode levá-los para dentro.

**Máquinas:** cada interior tem área livre onde as máquinas podem ser colocadas como a cesta (ver abaixo).

**Save:** o interior de cada construção é salvo pelo id da obra, com as máquinas, as cargas e os produtos prontos. Construções já prontas recebem um interior vazio, só com os fixos.

**Arte:**
- Piso e paredes de cada construção (palha, terra batida e tábuas).
- Cocho (vazio e cheio), bebedouro, ninhos (vazio e com ovo), baias e lamaçal.

## Máquinas de processamento

Pedido do Junior: o processamento é feito em **máquinas**, e não na bancada. A arte, os nomes e os detalhes são nossos, sem copiar outro jogo.

**Como colocar** (decisão do Junior: igual à cesta do cavalo, sem editor)
- A máquina pronta é um **item da mochila**.
- **Usar** o item (pela mochila ou pela barra rápida) coloca a máquina no chão **à sua frente**, como objeto com colisão.
- O jogo recusa um lugar sem espaço ou que bloqueie porta, cocho, ninhos ou passagem.
- Vale **dentro das construções de animais** e, se o Junior quiser, também ao ar livre na Propriedade.
- **E na máquina vazia** recolhe de volta para a mochila; uma máquina trabalhando não pode ser recolhida.

**Como funcionam**
- **Usar a matéria-prima** de frente para a máquina (ou E com ela na mão) coloca uma carga.
- A máquina trabalha sozinha com o tempo do jogo, mesmo com você em outro cenário ou dormindo, e mostra uma animação enquanto trabalha.
- Quando termina, aparece um **ícone do produto** sobre ela; **E retira** o produto.
- Cada máquina processa **uma carga por vez**.
- Carga, tempo restante e produto pronto ficam no save. Uma falha ao salvar não perde a matéria-prima.

**Como conseguir**

Você aprende o projeto com um NPC, no mesmo padrão de "Aprender adubo" (Rosa) e "Aprender iluminação e bombas" (Ícaro). Depois, monta a máquina na bancada, uma vez, com os materiais do projeto.

| NPC | Ensina |
| --- | --- |
| Tobias (carpintaria) | Barril de conservas, roca, tear e composteira |
| Bento (ferraria) | Queijeira, batedeira de manteiga e prensa de cera |
| Ícaro (mecânica) | Moinho de pedra |

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
- **Máquinas**, com estados vazia, trabalhando e pronta: queijeira, batedeira, roca, tear, moinho, composteira, barril, prensa e fogão a lenha.

## Ordem sugerida

1. Interiores do galinheiro e do curral, com cocho e ninhos dentro e a rotina dia/noite dos animais.
2. Produção básica: alimentação, ovo nos ninhos e leite (`PRODUCAO-ANIMAL-PLANO.md`).
3. Ovelha e cabra: arte animada, aprisco com interior, lã, leite de cabra e tesoura.
4. Sistema de máquinas, colocáveis nos interiores, e as primeiras: queijeira, batedeira, roca, tear e moinho.
5. Fogão a lenha e as receitas de cozinha.
6. Porco (chiqueiro com interior, esterco e composteira), pato e abelhas (colmeia, mel e cera).
7. Barril de conservas, prensa de cera, efeitos dos pratos e equilíbrio de preços.

## Decisões em aberto

- ~~Equipamentos ou serviços de NPC~~: decidido, **máquinas** na Propriedade.
- ~~Onde ficam as máquinas~~: decidido, **dentro das construções de animais**. Também ao ar livre na Propriedade?
- Rotina dos animais: no cercado de dia e dentro à noite, está bom?
- O porco produz esterco (que vira fertilizante)? Ou prefere outro produto?
- Cozinhar no **fogão a lenha de casa**?
- ~~Abelhas~~: decidido, colmeia artificial comprada na Vila e enxame nos ipês, com chance a cada 5 dias.
- Preços de venda de cada produto.
