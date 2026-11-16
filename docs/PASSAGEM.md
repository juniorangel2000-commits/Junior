# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-16
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.37` (último commit desta rodada; ver `git log`).
- **Última versão publicada:** `v0.10.0-preview.36` (Release pre-release com instalador e portátil; tag em `502005b`, `main` igual). Workflow do Windows conferido: passou.
- **Estado:** preview.37 em andamento, **não publicada**. Rodada de desempenho: contador F3, liberação de imagens por cenário e correção do vazamento da Propriedade prontos e testados.

## Feito nesta rodada

### Desempenho (Claude Code)

O Junior disse que o jogo está pesado, tanto no tamanho quanto nos travamentos. Medições, o que foi feito e os próximos passos estão em `docs/planejamento/DESEMPENHO.md`.

- **F3:** contador de FPS, imagens e memória (`src/performance-overlay.ts`).
- **Liberação de imagens ao sair de cada cenário** (`src/scene-texture-release.ts`). Depois de visitar o mundo, o pico caiu de 2,3 GB para ~1,1 GB.
- **Vazamento antigo corrigido:** `children.removeAll(true)` não destruía nada no Phaser 3.90. A Propriedade guardava o mundo anterior a cada volta, com a água animada rodando. Agora `destroySceneChildren` (`src/scene-children.ts`) destrói de verdade (Vale, Masmorras e Editor). Propriedade estável em 996 MB.
- `scripts/qa-texture-release.cjs`: idas e voltas sem imagens faltando, sem erros e sem crescer memória.
- `scripts/qa-kitchen.cjs` atualizado para as receitas escondidas ("???").

### Antes, nesta versão

- preview.36 publicada pelo Junior; workflow passou (instalador, portátil, `SHA256SUMS.txt`, `LEIA.md`).

## Em andamento e próximo passo exato

1. Pedir ao Junior para abrir o jogo, apertar **F3** e contar o FPS e os MB na Propriedade, na Vila e nos Campos, além da configuração do PC.
2. Seguir `docs/planejamento/DESEMPENHO.md` → "Próximos passos": tirar da Propriedade o cavalo, os pets do abrigo e os animais que não estão lá; recortar os atlas; WebP sem perda para o instalador.
3. Publicar só quando o Junior pedir (modelo da preview.36).

## Pendências e ideias para depois

- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`: animais, cozinha, abelhas, patos, porcos, máquinas e qualidade estão prontos. Faltam a conferência dos preços jogando e as artes provisórias.
- Estábulo/corda, montaria e calendário seguem planos anteriores.
- Há stash antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Interiores dos animais não persistem posição interna individual e ficam claros à noite.
- Travamentos nos Campos ainda precisam ser medidos no PC do Junior: otimizações anteriores estão em `f28f27c`, capim em `5424eee`; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- Arte definitiva dos interiores deve permanecer em resolução original (`setScale`/`setDisplaySize`, piso `FLOOR_SCALE=2`); o Junior rejeitou redução dos PNGs.
- `scripts/qa-farm-interior.cjs` falha (já falhava antes da preview.37): perto da porta do galinheiro aparece a dica da missão ("Plantar uma semente da estação · E") em vez de "Entrar no galinheiro". Investigar se é só o roteiro ou a prioridade da dica.
- Qualidade: unidades soltas no chão e recolhidas voltam como comuns. Uma entrada sem registro logo depois de um gasto sem registro, antes de salvar, pode ser contada errado (raro; o save confere tudo).

## Testes

- `npm run check`: ok.
- `npm test`: **2.089 passaram, zero falhas, 236 arquivos**.
- Chromium (`CHROMIUM_PATH=/opt/pw-browsers/chromium` quando o padrão não existir):
  - `qa-texture-release`, `qa-quality`, `qa-pigs` e `qa-kitchen`: OK.
  - `qa-farm-interior`: falha antiga (ver Problemas conhecidos).
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
