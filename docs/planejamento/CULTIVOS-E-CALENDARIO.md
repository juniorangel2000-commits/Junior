# Cultivos e calendário — plano aprovado

Status: organização aprovada pelo Junior em 13/11/2026. O catálogo abaixo é a
**proposta inicial**; nomes, estações e prazos ainda podem ser ajustados antes da
etapa 3. Este documento retoma `docs/calendario-sazonal-planejado.md`.

## Ordem das etapas

1. **Calendário:** quatro estações de 28 dias calculadas a partir do contador de dias
   que já existe (`SaveData.day`). A interface mostra estação, dia e ano. Não exige
   migração.
2. **Cultivos por catálogo:** cada canteiro guarda qual planta tem. O crescimento passa
   a contar por dias regados, não mais por segundos. O nabo entra no catálogo e as
   plantações dos saves atuais são convertidas.
3. **Novas plantas:** os itens do catálogo abaixo, com sementes vendidas pela Rosa.
   A arte de sementes, fases de crescimento e colheitas fica com o Codex. Hoje só o
   nabo tem arte (fases desenhadas em código em `src/art.ts` e ícone da semente);
   refazer o nabo no mesmo padrão das novas plantas.
4. **Cesta de colheita (Helena):** receita fixa com colheitas da Primavera e do Verão, usada futuramente na domesticação do cavalo.
5. **Domesticação do cavalo:** ver `DOMESTICACAO-CAVALO.md`.
6. **Depois:** clima (chuva regando, frio), peixes por estação, árvores frutíferas
   e estufa.

## Regras de comércio (decisões do Junior, 13/11/2026)

- **Nenhuma loja vende colheitas ao jogador.** Nas lojas, o comércio agrícola é **só de sementes**.
- **NPCs específicos podem comprar as colheitas do jogador.** Hoje o Augusto, a Rosa
  e o Nilo compram nabo (18 C). Para cada planta nova, definir quais NPCs compram e
  por quanto. Sugestão: a Rosa compra legumes, grãos e frutas; a Amélia, ervas; a
  Celina, algodão; a Helena, ingredientes de cozinha.
- Contratos de entrega de colheita (Helena: 10 nabos; contrato de colheita da Rosa)
  continuam como estão.

## Sementes especiais (etapa futura)

O Junior quer elaborar **sementes especiais que crescem o ano todo**, obtidas de
maneiras diferentes (não só compradas). As sementes comuns seguem as estações.
Formas de obtenção e quais plantas ainda serão definidas.

## Calendário

- Primavera, Verão, Outono e Inverno, nessa ordem, com 28 dias cada. Um ano tem 112 dias.
- Para `day` = 1, 2, 3…: `estação = floor((day-1)/28) % 4`, `dia da estação = (day-1) % 28 + 1`
  e `ano = floor((day-1)/112) + 1`.
- Partidas existentes continuam do dia em que estão. Por exemplo, o dia 30 vira
  Verão, dia 2, Ano 1.

## Regras de cultivo (etapa 2)

- Cada planta tem uma ficha com estações, dias até a colheita, rebrota (dias até
  produzir de novo, se houver), semente, preço da semente e rendimento.
- Cresce **um dia** a cada dia em que foi regada. Dia sem rega não avança e não mata.
- Planta fora de estação murcha na virada de estação. A interface avisa ao plantar
  quando não há dias suficientes para colher antes da troca.
- Plantas com rebrota permanecem no canteiro depois da colheita e produzem de novo.

## Catálogo inicial (proposta)

| Grupo | Planta | Estações | Dias | Rebrota | Usos principais |
| --- | --- | --- | --- | --- | --- |
| Legumes e verduras | Nabo (já existe) | Primavera | 4 | — | Cesta, refeições, contratos |
| | Alface | Primavera | 4 | — | Cesta, refeições |
| | Cenoura | Primavera | 6 | — | Cesta (favorita dos cavalos) |
| | Tomate | Verão | 7 | 3 | Cesta, refeições |
| | Batata-doce | Outono | 8 | — | Cesta, refeições |
| | Abóbora | Outono | 10 | — | Cesta, refeições |
| | Couve | Inverno | 5 | — | Cesta, refeições |
| | Repolho | Inverno | 9 | — | Cesta, refeições |
| Grãos | Feijão | Primavera, Verão | 7 | 3 | Refeições da Helena |
| | Milho | Verão | 8 | 4 | Cesta, ração animal |
| | Trigo | Verão, Outono | 6 | — | Ração animal, pão |
| | Aveia | Outono, Inverno | 6 | — | Cesta (cavalos), ração animal |
| Frutas de canteiro | Morango | Primavera | 8 | 4 | Cesta, presentes |
| | Melancia | Verão | 12 | — | Cesta, presentes |
| Flores | Margarida | Primavera | 5 | — | Presentes, decoração |
| | Girassol | Verão, Outono | 8 | — | Presentes, sementes de girassol |
| Ervas e temperos | Hortelã | Primavera, Verão | 5 | 3 | Preparados da Amélia |
| | Camomila | Outono | 6 | — | Preparados da Amélia |
| Fibras | Algodão | Verão, Outono | 10 | — | Tecidos da Celina |

Sem prazo definido ainda: árvores frutíferas (laranjeira, mangueira), cana-de-açúcar
e café, que são plantas perenes e ficam para a etapa 6.

## Cesta de colheita (etapa 4)

- Receita revisada pelo Junior em 13/11/2026 para dificultar o acesso: **cada cesta = 1 cenoura + 1 morango + 1 milho + 20 C**.
- Cenoura e morango são colheitas da Primavera; milho é do Verão. O jogador deve guardar parte da colheita da primeira estação e chegar à segunda.
- Não aceita substituições nem compra de cesta pronta só por moedas. Nenhuma loja vende as colheitas.
- Serviço "Preparar cesta de colheita", exclusivo da Helena; ingredientes e quantidades disponíveis aparecem no painel. Cada pedido entrega uma cesta na mochila.
- Mochila cheia, estoque no limite, falta de ingredientes ou de moedas recusam a operação sem perdas. A cesta permanece salva e pode ser empilhada.
- Domesticação, cocho e estábulo continuam na etapa 5; a cesta fica guardada até essa integração.

## Arte necessária (Codex)

Para cada planta: ícone da semente, 3 ou 4 fases de crescimento no canteiro, planta
madura e ícone da colheita. Também ícone da cesta e do cocho. Manter a escala e o
estilo do nabo atual.

## Compatibilidade

- Plantações atuais de nabo são convertidas preservando o progresso proporcional.
- O item `seeds` continua sendo a semente de nabo, para não invalidar saves.
- Itens novos entram em `VILLAGE_ITEM_IDS`, para que saves antigos os recebam com zero.
