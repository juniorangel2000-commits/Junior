# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-16
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.38` (criado da `main`, que é a preview.37 publicada).
- **Última versão publicada:** `v0.10.0-preview.37` (Release pre-release; tag em `d1a74a6`, `main` igual). Workflow do Windows conferido: passou.
- **Estado:** preview.37 publicada. Aguardando o Junior jogar e mandar os números do F3 e a opinião sobre luz e sombras.

## Feito nesta rodada

### Desempenho (Claude Code)

O Junior disse que o jogo está pesado, tanto no tamanho quanto nos travamentos. Medições, o que foi feito e os próximos passos estão em `docs/planejamento/DESEMPENHO.md`.

- **F3:** contador de FPS, imagens e memória (`src/performance-overlay.ts`).
- **Liberação de imagens ao sair de cada cenário** (`src/scene-texture-release.ts`). Depois de visitar o mundo, o pico caiu de 2,3 GB para ~1,1 GB.
- **Vazamento antigo corrigido:** `children.removeAll(true)` não destruía nada no Phaser 3.90. A Propriedade guardava o mundo anterior a cada volta, com a água animada rodando. Agora `destroySceneChildren` (`src/scene-children.ts`) destrói de verdade (Vale, Masmorras e Editor). Propriedade estável em 996 MB.
- `scripts/qa-texture-release.cjs`: idas e voltas sem imagens faltando, sem erros e sem crescer memória.
- `scripts/qa-kitchen.cjs` atualizado para as receitas escondidas ("???").
- **Campos Abertos travando com animais fugindo:** a rota de fuga custava 25 ms por quadro e a sombra de pedras e árvores travava até 1,6 s. Agora são 2,7 ms e 7 ms no máximo. Detalhes em `DESEMPENHO.md`; medidor em `scripts/perf-fields.cjs`.

### Iluminação nova e sombras (Claude Code)

- Novo sistema de luz, com noite de verdade, postes, nuvens, vaga-lumes e pólen. Detalhes em `docs/construcoes/ILUMINACAO.md`.
- O Junior pediu: postes iluminando mais em volta (só os postes), e sombras ajustadas. Depois disse que as sombras estavam péssimas e tinham um vão até o objeto.
  - Agora tudo em pé projeta sombra, colada ao pé.
  - **Falta a opinião dele** sobre o resultado das sombras (`docs/planejamento/luz-depois/`).
- **Cavalo domado** (falha antiga do `qa-horse-taming`): ele ficava 6–9 s comendo a última cesta e ignorava o jogador. Agora termina a refeição e vem (`HorseIdleCycle.finish`). O QA passa inteiro.

### Antes, nesta versão

- preview.36 publicada pelo Junior; workflow passou (instalador, portátil, `SHA256SUMS.txt`, `LEIA.md`).

## Em andamento e próximo passo exato

1. ✅ Release `v0.10.0-preview.37` publicada; workflow passou.
2. Pedir ao Junior os números do **F3** no PC dele (FPS e MB na Propriedade, na Vila e nos Campos) e a opinião sobre as sombras e a luz. Seguir `docs/planejamento/DESEMPENHO.md` → "Próximos passos".

## Pendências e ideias para depois

- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`: animais, cozinha, abelhas, patos, porcos, máquinas e qualidade estão prontos. Faltam a conferência dos preços jogando e as artes provisórias.
- Estábulo/corda, montaria e calendário seguem planos anteriores.
- Há stash antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Interiores dos animais não persistem posição interna individual e ficam claros à noite.
- Travamentos nos Campos ainda precisam ser medidos no PC do Junior: otimizações anteriores estão em `f28f27c`, capim em `5424eee`; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- Arte definitiva dos interiores deve permanecer em resolução original (`setScale`/`setDisplaySize`, piso `FLOOR_SCALE=2`); o Junior rejeitou redução dos PNGs.
- `qa-open-fields` e `qa-horse-fields` têm `executablePath:'/usr/bin/chromium'` fixo; rode com uma cópia sem esse caminho.
- `scripts/qa-farm-interior.cjs` falha (já falhava antes da preview.37): perto da porta do galinheiro aparece a dica da missão ("Plantar uma semente da estação · E") em vez de "Entrar no galinheiro". Investigar se é só o roteiro ou a prioridade da dica.
- Qualidade: unidades soltas no chão e recolhidas voltam como comuns. Uma entrada sem registro logo depois de um gasto sem registro, antes de salvar, pode ser contada errado (raro; o save confere tudo).

## Testes

- `npm run check`: ok.
- `npm test`: **2.092 passaram, zero falhas, 237 arquivos**.
- `npm run build`: ok (aviso de tamanho do pacote, que já existia).
- Chromium (`CHROMIUM_PATH=/opt/pw-browsers/chromium` quando o padrão não existir):
  - `qa-texture-release`, `qa-quality`, `qa-pigs`, `qa-kitchen`, `qa-fields-distance`, `qa-open-fields` e `qa-horse-fields`: OK.
  - `qa-farm-interior`: falha antiga (ver Problemas conhecidos).
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
