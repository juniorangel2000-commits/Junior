# Fase 11 — polimento e verificação integrada

Esta etapa estabiliza a vida social da fase 10 e verifica sua integração à
mineração já existente. Não refaz a arte aprovada nem introduz novos sistemas.

## Ajustes de polimento

- As falas de discordância acompanham a identidade do morador mesmo quando o
  encontro lista o par na ordem inversa. Rosa/Amélia e Tobias/Ícaro usam a mesma
  chave de afinidade sem trocar suas opiniões.
- Uma gravação antiga do trabalho de Bento que ainda não possua relações não
  apaga relações recém-gravadas pelo jogador. Posição e inventário atuais
  continuam sendo obtidos do snapshot da cena.
- Encontros interrompidos por trabalho, atendimento, guia, mudança de área ou
  viagem soltam ambos os atores. Interrupção e recarregamento não concedem
  afinidade de conclusão. A conversa não se inicia com tempo parado ou inválido.
- Os gestos sociais utilizam os quadros oficiais de idle nas oito direções;
  não alteram os pés, a colisão nem a posição para produzir movimento visual.
- Teste de desempenho garante apenas dois snapshots e duas gravações por
  encontro completo (reserva e conclusão), nenhum durante frames ociosos e
  nenhum por reentrar na cena no mesmo dia.

## Escopo de regressão

A suíte cobre colisões e acessibilidade das galerias, autotile arredondado,
recursos únicos e concorrência de golpes, desgaste, mochila cheia, renovação,
perigos, missões, objetos únicos, viagens pelas passagens reais, interrupção de
expedições, derrota/resgate, depósitos privados, retorno de Bento, migração de
saves e falhas de armazenamento. A verificação social acrescenta relações
negativas, dias futuros/inválidos, repetição diária, lembranças verdadeiras,
limites de histórico e economia preservada.

`qa-npc-social.cjs` usa estados de teste explicitamente preparados, mas aciona a
transação real de resgate, a cena real, seus diálogos e rotinas nativas. Confere
resposta e memória, save/continue, conversa com terceiro na praça, pés fixos,
despedida e retomada do trabalho. O posicionamento inicial da fixture não é
comportamento de movimento do jogo.

## Resultados

- TypeScript e build de produção aprovados, sem novas dependências.
- 31 testes direcionados de relações e conversas aprovados.
- QA no Chromium aprovado: lembrança real, resposta diária, inventário e moedas
  preservados, save/continue, conversa espontânea com memória em terceira pessoa,
  pés fixos, despedida e prioridade do horário de trabalho. Nenhum erro de
  JavaScript, textura ausente ou recurso 404.
- A inspeção foi executada em duas etapas, usando checkpoint de teste para a
  retomada. A fixture da ferraria foi ajustada para depois da visita matinal de
  Bento ao Ícaro; sua saída naquele horário era a rotina normal, não perda do NPC
  ou de afinidade. O script padrão já usa o horário de atendimento adequado.
- Suíte global: **1.767 testes aprovados em 195 arquivos**, sem falhas.
  Comando: `npx vitest run --maxWorkers=1 --testTimeout=30000`.
  Executada uma única vez para esta entrega, incluindo os testes novos e a
  regressão de todos os sistemas; nenhuma asserção foi relaxada.
- `git diff --check` aprovado. Código verificado no commit
  `df9781c334b54b36387b8d4016d3d86463865d35`; o fechamento posterior altera apenas
  estes relatórios. Branch sincronizada com o GitHub.

Prévias locais: `/workspace/npcs-fase10-qa/01-Bento-lembra-do-resgate.png`,
`02-Resposta-e-afinidade.png`, `03-Relacao-preservada-apos-recarregar.png`,
`04-Conversa-espontanea-com-memoria-real.png`, `05-Rotinas-retomadas-no-horario.png`.
O checkpoint contém somente uma partida de QA e não integra a distribuição.

## Distribuição

Código posterior à release `v0.10.0-preview.29`, salvo em
`feature/vida-social-npcs`. A versão do pacote continua sendo a da última
publicação; não foi gerado nem anunciado um novo executável Windows nesta etapa.
