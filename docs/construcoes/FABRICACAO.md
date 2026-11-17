# Fabricação por lugar e categoria (preview.39)

Pedido do Junior: separar o que é feito sem bancada, na bancada de trabalho e numa bancada de
construção nova, e dividir em categorias. Dados em `src/data/recipe-groups.ts`.

## Onde cada receita é feita

| Janela | Categorias |
| --- | --- |
| **Fabricação (tecla C)** | Materiais: corda, pedra lascada, cabo, cavilhas, tecido, tábuas com machadinha · Ferramentas: machadinha, picareta, enxada, martelo, foice, pá · Cura: curativo, tônico, infusão · Campo: adubo vegetal, fogueira portátil |
| **Bancada de trabalho** | Materiais: lâmina, tábuas serradas · Ferramentas: serrote · Melhorias: as 5 ferramentas em ferro, ouro e metal negro · Criação: tesoura de tosquia, balde de ordenha · Equipamentos: mochila, botas, acessório de pesca · Combate: espada |
| **Bancada de construção** | Peças da casa: porta, janela · Móveis: banco · Instalações: forja, luminária, bomba · Máquinas: as nove · Projetos: kits da casa, oficina e base |

Receita nova sem grupo: bancada de trabalho se pedir bancada, senão sem bancada; categoria
Materiais.

## Melhorias de ferramentas na bancada de trabalho

- Machadinha, picareta, enxada, foice e pá, em ferro, ouro e metal negro (15 receitas).
- **Aprendidas** quando o Bento entrega aquela melhoria pela primeira vez (encomenda
  retirada). Como isso vem das encomendas guardadas, as partidas antigas já contam o que foi
  feito.
- Na bancada: os mesmos materiais do ferreiro, **sem mão de obra e sem espera de dias**
  (alguns segundos de trabalho). A ordem continua Pedra → Ferro → Ouro → Metal Negro, e a
  melhoria vale para a ferramenta ativa na mochila. Código: `workbenchUpgrade` em
  `src/systems/economy.ts`.

## Bancada de construção

- Montada no modo de construção, como a bancada de trabalho: 8 tábuas serradas, 6 pedras e
  4 cavilhas, com o martelo. Usada com E (abre a aba dela).
- **As duas bancadas ocupam 2 blocos de largura**, com a arte do Junior de 16/11/2026
  (`docs/arte-recebida/bancadas/`, importada por `scripts/import_art_bancadas.py`).
- Partidas antigas: a bancada de trabalho cresce para o bloco da direita se ele estiver livre;
  se houver algo encostado, ela fica com 1 bloco (`narrow: true`) e continua funcionando.

## Janela de fabricação

Cada lugar abre a própria janela, sem abas: a tecla C abre "Fabricação"; usar a bancada de
trabalho ou a de construção abre só as receitas dela.

- **Filtros por categoria com contador:** "Ferramentas 2/6" quer dizer 2 prontas para fazer
  agora, de 6.
- **Prontas primeiro:** dentro de cada filtro, as receitas que dá para fazer vêm antes.
- **Para aprender:** as receitas ainda não aprendidas ficam fora das categorias, num filtro
  próprio que diz com quem aprender (Amélia, Celina, Rosa, Tobias, Ícaro, Helena, Augusto, ou
  o Bento para as melhorias).
- **Cada janela lembra a última categoria** escolhida enquanto o jogo está aberto.
- Se o jogador se afastar com a janela de uma bancada aberta, aparece o aviso para chegar perto.

## Cerca sem módulo

- A cerca é construída direto no modo de construção com 3 madeiras por trecho. O reparo de
  um trecho desgastado custa 2 madeiras.
- A receita do módulo saiu, e o carpinteiro não compra nem vende mais módulos.
- Saves anteriores: cada módulo na mochila vira 3 madeiras (migração em `save.ts`, com teste).
  O item `fenceKit` continua existindo só para os saves antigos abrirem.

## Peças de construção (preview.41)

Ideia do Junior: a sucata vira peças.

- **Ícaro separa sucata** (serviço "Separar sucata"): até 10 por dia, 5 C cada. Na manhã
  seguinte você busca as peças. Por sucata: pregos 35% (1 a 3), dobradiça 20%, molas 18%,
  engrenagem 12%, ferrugem 15% (`src/systems/scrap-sorting.ts`; save `scrapSorting`).
- **Bento vende as peças, caro** (depois que a ferraria abre o comércio de minérios):
  pregos 18 C, dobradiça 50 C, molas 60 C, engrenagem 90 C. O Ícaro compra sobras barato.
- **Onde entram:** só nas máquinas, que já são aprendidas na Vila:
  - queijeira: mola e engrenagem;
  - batedeira, roca e tear: engrenagem (o tear também leva uma mola);
  - barril de conservas e composteira: pregos;
  - prensa de cera: molas e dobradiça;
  - moinho: duas engrenagens.
- Telhado de tábuas (antiga porta pronta) e ninho e baias (antiga janela pronta) ainda **não**
  pedem peças: o galinheiro usa os dois e pode vir antes
  de chegar à Vila. Decidir com o Junior antes de mudar.
- Ícones do lote 01 (`items/nails.png`, `hinge.png`, `spring.png`, `gear.png`).
