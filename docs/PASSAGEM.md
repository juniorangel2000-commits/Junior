# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** Marina e Rui caminham, param e viram nas oito direções na Propriedade. Caminhada em `b5e8de4` e parada em `26adaa2`.

## Feito nesta rodada

- Quatro poses paradas diagonais por sobrevivente, baseadas nas poses dos jogadores e nas passadas de Marina e Rui. As fontes em resolução nativa ficam em `public/assets/visual/characters/survivors/`. `node scripts/pack-survivor-walk.cjs` monta os atlas de caminhada e de parada.
- Ao chegar, a primeira pose parada segue a direção da última passada. A origem dos pés coincide nos dois atlas. Marina e Rui assentam por 180 ms e então viram em passos de 45 graus a cada 75 ms até olhar para o jogador ou para a tarefa.
- O teste no Chromium percorreu o trajeto de descanso, verificou a chegada por uma diagonal livre, conferiu as quatro poses olhando para o jogador e retomou a caminhada até o poço. A gravação na Propriedade ficou em `/workspace/afterrain-sobreviventes-paradas/parada-e-retomada.gif`.
- Referências de arte anteriores em `b462fc4:docs/PASSAGEM.md`. Montaria masculina em `599eafa`, contato da pá e da foice em `5e1623b` e golpe da enxada em `7b4a645`.

## Em andamento e próximo passo exato

- A rodada de transição de Marina e Rui está concluída. Para repetir a conferência, inicie Vite na porta 5190 e rode `node scripts/qa-village-schedule.cjs --survivors` com o Playwright disponível. O caso cobre bloqueio, caminhada, chegada, conversa e retorno ao trabalho.
- Fechar a preview.44 quando o Junior pedir a publicação, seguindo o protocolo de release em `AGENTS.md`.

## Pendências e ideias para depois

- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.
- Inclinação de tronco do fazendeiro montado durante o galope pode ser revista em uma rodada futura, se pedida.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- Base: `npm ci` pelo cache, com o download do binário Electron desativado, `npm run check` e 2.204 testes em 263 arquivos.
- Integração: `npm run check`, 2.204 testes em 263 arquivos e QA dos sobreviventes no Chromium sem erros.
