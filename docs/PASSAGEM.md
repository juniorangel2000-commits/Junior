# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.33`, base `3401715`; integração dos Campos Abertos em andamento nesta rodada.
- **Última versão publicada:** `v0.10.0-preview.32`
- **Estado:** em andamento (WIP)

## Feito nesta rodada

- Protocolo de revezamento criado exatamente como solicitado, com `CLAUDE.md` apontando para `AGENTS.md`.
- Branch da próxima versão criado a partir da preview.32, preservando o trabalho iniciado em `feature/limpeza-vacas-curral`.
- Criados terreno, abrigo rural e sprite de capim para Campos Abertos, ao sul da propriedade. Dimensão solicitada: 96 × 72 blocos (3.072 × 2.304), igual à propriedade.
- Integração local em validação: entrada/saída caminhando, capim cortado com a foice, rebrota em três dias, coleta no chão, ervas/cogumelos, vacas/galinhas/coelhos, pássaros, HUD e inventário.
- Capim fresco seca no silo em um dia do jogo; cada capim rende uma palha, mantendo 3 fibras → 1 palha.

## Em andamento e próximo passo exato

- Concluir a conferência visual e os testes dos Campos Abertos antes de fazer commit da implementação. A máquina reiniciou durante a primeira execução completa; os arquivos persistiram.
- `npm ci` e `npm run check` passaram após a retomada; `npm test` está rodando novamente. Consultar logs em `/workspace/campos-abertos-qa` nesta máquina, sem depender deles no próximo ambiente.
- Executar `node scripts/qa-open-fields.cjs` com Vite na porta 5190, conferir mapa/abrigo, ida e volta e save/continue; concluir `npm run check` e `npm test`; enviar implementação ao GitHub e reescrever esta passagem com os resultados reais.
- Junior NÃO pediu publicação nesta rodada. Não criar tag nem subir versão do pacote. Próxima publicação, quando solicitada: preview.33.

## Pendências e ideias para depois

- Produção animal: alimentação/cochos, ovos, balde e ordenha ainda não implementados. Plano em `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`.
- Captura e caça dos animais dos novos campos ficam para uma etapa própria; nesta primeira versão eles circulam no cenário.
- Calendário sazonal adiado pelo Junior até terminar os cenários (`docs/calendario-sazonal-planejado.md`).
- Compatibilidade de partidas antigas e durabilidade individual das ferramentas precisam continuar preservadas.

## Problemas conhecidos

- Preview.32 é a última versão publicada. Não confundir arquivos em desenvolvimento com conteúdo do instalador existente.
- O editor F2 dos Campos Abertos ainda não está integrado; o mapa M e a exploração são o escopo atual.
- No primeiro teste de navegação havia uma erva muito perto de uma árvore; corrigido. Os nove testes específicos passaram depois da correção.

## Testes

- `npm run check`: ok após a retomada.
- `npm test`: em execução. Antes da retomada, 9 testes dos Campos Abertos passaram; 38 testes de construção/migração também passaram. Não há resultado completo desta rodada ainda.
- `npm run build`: não executado nesta rodada.
- Conferido no jogo: entrada a pé, corte com a foice, coleta de capim e inventário. Conferência do mapa, retorno e recarga em andamento.
