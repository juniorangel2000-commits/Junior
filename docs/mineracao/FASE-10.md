# Fase 10 — relações sociais simples

Implementação da opção A da especificação: relações persistentes entre o jogador
e os dez moradores existentes, e entre moradores. Profissões, preços, horários,
lojas e expedições continuam usando suas regras originais.

## Comportamento

- Conversas ganham cumprimento conforme a afinidade, indicação discreta da
  relação e duas respostas opcionais. Uma resposta por morador por dia altera
  a afinidade em +1 ou −1, com limites de −100 a 100. Reabrir ou recarregar não
  permite repetir a recompensa. Receber a primeira vara mantém prioridade.
- Encontros usam os percursos e pausas existentes da praça e das visitas às
  lojas. Somente moradores próximos, disponíveis e na mesma área participam.
  Eles ficam parados, viram-se, fazem uma breve mudança de olhar com os quadros
  oficiais, conversam, despedem-se e retomam sua rotina física.
- Só uma conversa concluída altera a afinidade do par. Pequenas diferenças de
  opinião podem reduzi-la; relações negativas reduzem a frequência de encontros.
  Trabalho, atendimento, orientação e controle de viagens interrompem a conversa.
- Memórias provêm de fatos registrados: companhia efetiva numa viagem,
  descoberta de galerias, retirada por zumbis, pedidos interrompidos/concluídos,
  resgate e viagem produtiva. Convite sem companhia não cria lembrança.
- Bento pode comentar fatos reais tanto com o jogador quanto com outro morador.
  A fala entre moradores usa terceira pessoa. No máximo uma lembrança por dia
  em diálogo com cada morador; a mesma lembrança respeita intervalo de três dias.
  Comentários ambientais têm controle próprio de repetição.
- Damião utiliza o mesmo sistema na cabana do lago. Bento em viagem mantém o
  painel de expedição e seus comandos, com cumprimento e comentário contextual.

## Persistência e desempenho

`SaveData.npcSocial` é opcional: partidas anteriores continuam válidas. Validação
confere identidades, pares canônicos, limites de afinidade, datas e eventos.
Ocorrências repetidas agregam contadores por chave fixa, sem histórico infinito.

A reserva de encontro e sua conclusão são transações distintas: reabrir o jogo
no meio de uma conversa libera a rotina, sem conceder afinidade nem repetir o
mesmo encontro naquele dia. Falhas de armazenamento não aplicam a relação nem
confirmam uma lembrança. Resgate e entrega de pedido registram memória na mesma
transação das consequências e recompensas originais.

Não há busca social de caminhos, novas texturas ou dependências. Os encontros
reutilizam a navegação existente. A atualização consulta o estado atual antes de
criar um snapshot; frames ociosos não gravam saves sociais.

## Arquivos

Novos: `src/data/npc-social.ts`, `src/systems/npc-social-state.ts`,
`src/systems/npc-social.ts`, `tests/npc-social.test.ts`,
`scripts/qa-npc-social.cjs`.

Integração: `types.ts`, `systems/save.ts`, `systems/merchant-conversations.ts`,
`systems/village-background.ts`, `scenes/VillageScene.ts`, `village-ui.ts/.css`,
`lake-fisher-visit.ts`, `bento-expedition-menu.ts`, `systems/bento-commit.ts`,
`systems/bento-expedition.ts`, `systems/bento-travel.ts`,
`systems/mine-mission-lifecycle.ts`, `systems/mine-missions.ts`,
`systems/underground-recovery.ts` e testes direcionados correspondentes.

## Limites assumidos

Não há novo clip gestual de braços: o gesto leve utiliza poses de olhar oficiais,
sem simular animação inexistente. Não há romance, novas profissões, moradores
extras, mudança econômica nem reorganização de agenda. O calendário sazonal e
seus eventos continuam adiados, conforme orientação do usuário.

A verificação integrada e os ajustes finais estão registrados em `FASE-11.md`.
A release `v0.10.0-preview.29` contém as fases 1–9; esta fase é código posterior
na branch `feature/vida-social-npcs`, ainda sem nova distribuição Windows.
