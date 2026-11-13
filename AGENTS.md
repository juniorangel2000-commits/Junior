# Regras para agentes de IA — After Rain

Este projeto é desenvolvido em **revezamento entre Claude Code e Codex**, conforme
os limites de uso de cada um. Nenhum dos dois vê a conversa do outro: o que não
estiver enviado ao GitHub e registrado em `docs/PASSAGEM.md` não existe para quem
assume depois. Estas regras valem para os dois e têm prioridade sobre instruções
antigas como `docs/00_COLE_PRIMEIRO_NO_CODEX.txt`.

## Como o Junior pede as coisas

Estas regras valem automaticamente em toda sessão; o Junior não precisa repeti-las.
A mensagem dele pode ser só a tarefa. Interprete assim:

- **Só a tarefa** (ex.: "adicione galinhas ao curral"): siga o protocolo de início,
  faça a tarefa e o encerramento **sem publicar**.
- **Tarefa + "publicar"** (ex.: "adicione galinhas e publique"): faça o
  encerramento **com publicação** de uma nova versão.
- **"publicar"** sozinho: publique o que já está pronto no branch atual.
- **"limite"** (ou "meu limite está acabando"): faça imediatamente o
  encerramento de emergência.
- **"onde paramos?"**: resuma `docs/PASSAGEM.md` sem alterar nada.

Sem ponto de partida informado, continue de onde `docs/PASSAGEM.md` indica.

## Fontes da verdade

- Repositório: `github.com/juniorangel2000-commits/Junior`.
- `main`: sempre igual à última versão publicada.
- `docs/PASSAGEM.md`: estado atual, onde continuar e próximos passos. É reescrito
  ao fim de toda rodada.
- `docs/cenarios/NOTAS-<versão>.md`: notas de cada versão publicada, no formato
  já usado nas anteriores.

## Protocolo de início

1. `git fetch --all --tags` e vá para o ponto indicado pelo Junior ou, se ele não
   indicar, para o campo "Continuar a partir de" de `docs/PASSAGEM.md`.
2. Leia `docs/PASSAGEM.md` inteiro. Se houver trabalho em andamento (WIP),
   continue dele; não recomece nem desfaça o trabalho do outro agente sem motivo
   registrado.
3. `npm ci`, `npm run check` e `npm test` antes de alterar qualquer coisa. Anote
   falhas que já existiam, para não confundi-las com regressões suas.
4. Se a tarefa for grande ou ambígua, apresente o plano ao Junior antes de
   implementar.

## Durante o trabalho

- Trabalhe no branch `release/v0.10.0-preview.N` da próxima versão (N = última
  publicada + 1). Crie-o a partir da última versão se ainda não existir.
- Commits pequenos e frequentes, com mensagens em português.
- Envie (push) ao GitHub com frequência, não só no final.
- Nunca reescreva histórico publicado: sem `push --force`, sem rebase de branch
  já enviado e sem apagar ou mover branches e tags.
- Partidas salvas anteriores devem continuar compatíveis. Mudança no formato do
  save exige migração e teste.
- Textos do jogo e documentação em português do Brasil.

## Protocolo de encerramento (toda rodada, mesmo incompleta)

1. Rode `npm run check` e `npm test` (e `npm run build` se for publicar).
2. Commit e push do branch. Trabalho incompleto vai com prefixo `WIP:` na
   mensagem do commit.
3. Reescreva `docs/PASSAGEM.md` seguindo o modelo do próprio arquivo, faça
   commit e push dele.
4. Somente se o Junior pediu para **publicar** e check, testes e build passaram:
   1. `npm version 0.10.0-preview.N --no-git-tag-version` (atualiza
      `package.json` e `package-lock.json`).
   2. Crie `docs/cenarios/NOTAS-0.10.0-preview.N.md`.
   3. Commit `Release preview.N: <resumo>` e push do branch.
   4. Tag anotada `v0.10.0-preview.N` e push da tag. Isso dispara o workflow
      que gera o executável Windows e publica a Release. Tag publicada não se
      apaga nem se move: correção vira a versão N+1.
   5. Atualize a `main`: `git push origin release/v0.10.0-preview.N:main`. Se o
      GitHub recusar por não ser avanço direto, não force; avise o Junior.
5. Responda ao Junior com: branch, último commit, tag (se houver), resultado
   dos testes e o próximo passo.

## Encerramento de emergência (limite acabando)

Pare onde estiver. Faça commit `WIP: <o que estava fazendo>` com tudo o que existe,
mesmo que os testes falhem, e push do branch. Atualize `docs/PASSAGEM.md` com o
estado e o próximo passo exato, registrando que os testes não foram concluídos.
Não publique versão nem crie tag.
