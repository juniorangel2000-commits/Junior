# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD. A tag desta versão é `v0.10.0-preview.44`.
- **Estado:** versão 0.10.0-preview.44 preparada para Windows x64. O status da publicação e os arquivos ficam na [Release da preview.44](https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.44).

## Feito nesta rodada

- Atualizados `package.json`, `package-lock.json`, [notas da versão](cenarios/NOTAS-0.10.0-preview.44.md) e [instruções de instalação](cenarios/LEIA-0.10.0-preview.44.md).
- Marina e Rui caminham e param nas oito direções na Propriedade. As viradas avançam de 45 em 45 graus depois de uma breve pausa ao chegar. Caminhada em `b5e8de4` e parada em `26adaa2`.
- A versão reúne a montaria masculina de `599eafa`, os contatos da pá e da foice de `5e1623b`, a correção da enxada de `7b4a645`, a porteira aberta a 90 graus de `99ce073` e o trajeto a pé dos visitantes de `9d06bfe`.

## Em andamento e próximo passo exato

- Usar esta versão como base para a próxima tarefa depois de conferir a publicação no GitHub. Para repetir a conferência no jogo, inicie Vite na porta 5190 e rode `node scripts/qa-village-schedule.cjs --survivors` com o Playwright disponível.

## Pendências e ideias para depois

- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas estão em `docs/planejamento/`.
- Inclinação de tronco do fazendeiro montado durante o galope pode ser revista em uma rodada futura, se pedida.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- `npm ci` pelo cache, `npm run check`, 2.204 testes em 263 arquivos e build local concluídos.
- Confira o empacotamento Windows no workflow da tag, que gera o instalador, o portátil e os hashes SHA-256.
- QA anterior no Chromium cobriu bloqueio, caminhada, chegada diagonal, conversa e retomada até o poço. Detalhes em `85c419e:docs/PASSAGEM.md`.
