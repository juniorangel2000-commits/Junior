# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch (etapa 1 do calendário em `79b6d4d`).
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** etapa 1 do calendário concluída e validada; domesticação do cavalo **pausada** até haver cesta de colheita. Não publicado.

## Feito nesta rodada

- O Junior pediu a domesticação do cavalo, mas decidiu que a comida será uma **cesta com vários itens de colheita**, não só nabos. Pediu também novas plantas com calendário. A ordem foi reorganizada e aprovada:
  - `docs/planejamento/CULTIVOS-E-CALENDARIO.md`: etapas 1–6 e catálogo inicial de 19 plantas (legumes, verduras, grãos, frutas, flores, ervas e algodão), mais a regra da cesta.
  - `docs/planejamento/DOMESTICACAO-CAVALO.md`: comida = cesta da Helena (3 colheitas diferentes + 20 C) e padrões adotados para o cocho, a contagem dos dias e o estábulo.
  - `docs/calendario-sazonal-planejado.md`: marcado como retomado.
- **Etapa 1, calendário:** `src/systems/calendar.ts`.
  - Quatro estações de 28 dias (ano de 112 dias), calculadas a partir de `SaveData.day`, sem migração.
  - A interface mostra "Primavera 5" com "Ano 1" logo abaixo; ao passar o mouse aparece "Primavera, dia 5 · Ano 1 · 5º dia da jornada".
  - A lista de saves usa a data completa. Pedido expresso do Junior: mostrar o ano (Ano 1 no primeiro ciclo, Ano 2 no seguinte…).
- Nada do cavalo foi alterado nesta rodada.

## Em andamento e próximo passo exato

- **Etapa 2, cultivos por catálogo.** Antes de implementar, confirmar com o Junior:
  - Com crescimento por dias regados, o nabo deixa de levar 45 segundos e passa a levar 4 dias do jogo, cerca de 48 minutos reais.
  - Isso alonga a missão inicial "Primeira colheita" (plantar, regar, colher). Opções:
    1. A primeira plantação da missão cresce mais rápido.
    2. A missão aceita "planta regada" como passo final.
    3. O nabo cresce em 1 dia.
- Implementação prevista da etapa 2:
  - Campo `crop` em `CropData`, com o nabo como padrão para saves antigos.
  - Crescimento diário somente nos dias regados, rega reiniciada a cada dia e plantas fora de estação murchando na virada.
  - Migração das plantações atuais preservando o progresso proporcional.
- Depois: etapa 3 (arte das plantas pelo Codex), etapa 4 (cesta da Helena) e etapa 5 (cavalo).

## Pendências e ideias para depois

- Domesticação do cavalo: a corda **só depois da doma completa**. Padrões adotados enquanto o Junior não decidir outra coisa:
  - Cada virada de dia com comida no cocho conta.
  - O cocho guarda 3 porções.
  - Estábulo para 1 cavalo, com madeira nobre e arte do curral.
- Quadros de deitar, descansar e levantar do cavalo preservados e ainda não usados.
- Ipês e madeira nobre: machadinha de Ferro ou melhor, 6 golpes, Ferro 1 / Ouro 2 / Metal Negro 3. Galinheiro 6 e curral 10 madeiras nobres; toda construção de animais futura exige madeira nobre.
- Clima, peixes por estação, árvores frutíferas e estufa ficam para a etapa 6 do plano de cultivos.
- Produção animal, variedade visual dos campos, caça e editor F2 continuam pendentes; preservar os ids salvos das moitas.

## Problemas conhecidos

- O pacote continua na preview.33 até a publicação autorizada da preview.34.
- O GitHub informa que o repositório se chama `Junior` (com J maiúsculo). O endereço remoto local foi ajustado; enviar para `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- `npm ci`: ok (com `ELECTRON_SKIP_BINARY_DOWNLOAD=1`).
- `npm run check`: ok, antes e depois.
- `npm test`: antes, 1.861 passaram; depois, **1.866 passaram, zero falhas, 212 arquivos** (5 novos em `tests/calendar.test.ts`).
- `npm run build`: não executado (sem publicação).
- Chromium (`scripts/qa-calendar.cjs`): a interface mostrou "Primavera 1 / Ano 1" no início e "Verão 2 / Ano 2" no dia 142, com a dica completa. Nenhum erro de JavaScript.
