# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch (etapa 2 em `69bfe41`).
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** etapas 1 (calendário) e 2 (cultivos por dias regados) do plano de cultivos concluídas e validadas. Domesticação do cavalo pausada até a cesta de colheita. Não publicado.

## Feito nesta rodada

- **Plano** em `docs/planejamento/CULTIVOS-E-CALENDARIO.md`. Decisões do Junior nesta rodada:
  - A comida do cavalo será uma cesta com vários itens de colheita.
  - O catálogo terá mais que vegetais: legumes, verduras, grãos, frutas, flores, ervas e algodão.
  - Mostrar o ano na interface.
  - **Nenhuma loja vende colheitas; o comércio agrícola é só de sementes.**
  - **NPCs específicos podem comprar colheitas do jogador.** Hoje o Augusto, a Rosa e o Nilo compram nabo; para cada planta nova, definir quem compra.
  - **Sementes especiais** que crescem o ano todo, obtidas de formas diferentes, ficam para uma etapa futura.
  - A missão "Primeira colheita" **só termina ao colher**.
- **Etapa 1, calendário:** `src/systems/calendar.ts`. Estações de 28 dias calculadas de `SaveData.day`; a interface mostra "Primavera 5" e "Ano 1", com a data completa como dica; a lista de saves usa a data.
- **Etapa 2, cultivos por catálogo:**
  - `src/data/crops.ts` tem a ficha de cada planta. Por enquanto só o nabo: 4 dias, devolve 1 semente.
  - Em `src/systems/farming.ts`, cada canteiro guarda `crop`, `days` (dias regados) e `day` (dia de referência). Cresce 1 dia por dia regado, e a rega vale só para o próprio dia.
  - Planta fora de estação murcha na virada, com aviso na Propriedade. Planta com `regrow` fica no canteiro após colher. Plantar fora de estação é recusado, e há aviso quando faltam dias na estação.
  - **O nabo cresce em todas as estações, provisoriamente**, até a etapa 3 trazer plantas para cada estação; depois fica só na Primavera.
  - `Farming.update(segundos, dia)`: os 12 cenários passam o dia atual; sem dia, nada cresce.
  - Adubo: +1 dia de crescimento e rega do dia.
  - Saves antigos: canteiros sem `crop/days/day` continuam válidos e são convertidos na primeira atualização, preservando o progresso proporcional (por exemplo, 0,7 vira 2 de 4 dias).
- README atualizado (não fala mais em 45 segundos).

## Em andamento e próximo passo exato

- **Etapa 3, novas plantas (Codex, precisa de arte).** Para cada planta do catálogo: ícone da semente, 3 ou 4 fases no canteiro, planta madura e ícone da colheita. Refazer o nabo no mesmo padrão: hoje as fases são desenhadas em código em `src/art.ts` (`crop-0..2`), o ícone da semente é `public/assets/visual/icons/seeds.png` e o do nabo é um ícone vetorial em `src/ui.ts`.
- Ao incluir cada planta:
  - Acrescentar a ficha em `CROPS`.
  - Criar os itens de semente e colheita em `src/data/items.ts` e em `VILLAGE_ITEM_IDS`.
  - Sementes à venda na Rosa. Colheitas só compradas por NPCs específicos, nunca vendidas em lojas.
  - Restringir o nabo à Primavera.
  - Generalizar o desenho das fases, que hoje usa `crop-${stage}` só do nabo, em `ValleyScene` e `MapEditorScene`.
  - Fazer o plantio escolher a semente equipada, já que `plant` aceita o id da planta.
- Depois: etapa 4 (cesta da Helena: 3 colheitas diferentes + 20 C) e etapa 5 (cavalo).

## Pendências e ideias para depois

- Domesticação do cavalo: a corda **só depois da doma completa**. Padrões adotados enquanto o Junior não decidir outra coisa:
  - Cada virada de dia com comida no cocho conta.
  - O cocho guarda 3 porções.
  - Estábulo para 1 cavalo, com madeira nobre e arte do curral.
- Contratos de entrega de nabo (Helena: 10 nabos; contrato da Rosa) seguem ativos.
- Quadros de deitar, descansar e levantar do cavalo preservados e ainda não usados.
- Ipês e madeira nobre: machadinha de Ferro ou melhor, 6 golpes, Ferro 1 / Ouro 2 / Metal Negro 3. Toda construção de animais exige madeira nobre.
- Clima (chuva regando), peixes por estação, árvores frutíferas e estufa: etapa 6.
- Produção animal, variedade visual dos campos, caça e editor F2 continuam pendentes; preservar os ids salvos das moitas.

## Problemas conhecidos

- O pacote continua na preview.33 até a publicação autorizada da preview.34.
- Até a etapa 3 só existe o nabo, que cresce o ano todo (provisório, ver acima).
- Ritmo novo: o primeiro nabo leva 4 dias regados, cerca de 48 minutos reais, se o jogador regar todo dia.
- O repositório se chama `Junior` (J maiúsculo); enviar para `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- `npm ci`: ok (com `ELECTRON_SKIP_BINARY_DOWNLOAD=1`).
- `npm run check`: ok.
- `npm test`: baseline 1.861; após a etapa 1, 1.866; após a etapa 2, **1.876 passaram, zero falhas, 213 arquivos**.
  - Novos: `tests/calendar.test.ts` (5) e `tests/crops.test.ts` (10), este com plantas de teste para estação e rebrota.
  - Testes antigos de cultivo, sono e recarga reescritos para dias regados.
- `npm run build`: não executado (sem publicação).
- Chromium:
  - `scripts/qa-calendar.cjs`: "Primavera 1 / Ano 1" e "Verão 2 / Ano 2".
  - `scripts/qa-crop-days.cjs`: plantio, "Nabo · faltam 4 dias regados · precisa de água", rega diária por 4 dias, "Colher nabo" no dia 5 e colheita +1 nabo. Um save antigo com canteiro 0,7 carregado e convertido para 2 de 4 dias.
  - Nenhum erro de JavaScript.
