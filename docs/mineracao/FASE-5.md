# Fase 5 — movimentação e rotina de Bento

**Concluída.** 262 testes em 18 arquivos passaram, além da checagem TypeScript,
build de produção e roteiro completo no Chromium. Sem erros de JavaScript ou
sprites ausentes na verificação do jogo.

## Funcionalidade entregue

Bento faz viagens semanais reais: oficina → Vila → estrada de acesso à cidade
→ Lago entre as Serras → Platô da Nascente → recepção da Mina Antiga → galerias.
Depois percorre os acessos no sentido inverso, entra na própria oficina e retoma
a rotina e o atendimento. A arte e os móveis existentes da ferraria permanecem.

- Uma identidade, o mesmo Bento e os sprites oficiais. A Vila reutiliza seu
  sprite existente; os demais cenários mostram esse mesmo estado salvo. A rotina
  comercial fica suspensa durante a viagem, sem criar outro ferreiro.
- Oito direções de idle e seis quadros de caminhada em cada direção: 56 arquivos
  oficiais conferidos. A fase depende da distância percorrida, com idle nas
  paradas e direção preservada. Não foram alterados os personagens aprovados.
- Preparação na oficina, saída pela porta, viagem, exame das galerias próximas,
  retorno, entrada na oficina e retomada do expediente. Paradas e destinos ficam
  salvos. Há uma breve transição visual ao atravessar cada acesso real.
- O A* da Vila é reutilizado. Escadas, ponte do platô, margens, paredes e portas
  usam as mesmas restrições físicas do jogador. Passagem ocupada ou bloqueada
  faz Bento esperar/replanejar. Não há salto para o destino após mudar a hora.
- Fora da tela, a simulação avança o mesmo percurso pelo relógio, incluindo
  retomada após dormir. Não mantém outros cenários ativos. Ao entrar num mapa
  observado, o avanço acumulado para; Bento continua caminhando no ritmo normal.
- A busca de rota pode avançar em lotes de 32 nós por atualização, evitando uma
  busca longa inteira num único quadro. Estado de movimento e rota ficam no
  save; apenas o cache da busca é reconstruído após carregar.
- Conversar durante a viagem usa a HUD existente e pausa a simulação. Os
  diálogos informam a viagem, o retorno ou a passagem impedida; ainda não há
  comandos de expedição conjunta.
- A ferraria fica fechada durante preparação, viagem, exploração, retorno,
  intervalo e fora do expediente. Presença física e horário controlam o acesso.
  Ao retomar o atendimento, os serviços existentes voltam.
- Entrega de materiais, pagamento, cancelamento, retirada, reparos e pedido
  econômico de Bento verificam disponibilidade antes de alterar inventário ou
  Coroas. A forja própria continua independente. Preços, receitas, ferramentas,
  itens, estoque comercial e prazos de encomendas permanecem os anteriores.
- Gás e ameaças conhecidas são evitados na escolha da rota. Se o centro da
  primeira galeria estiver ocupado por um zumbi, Bento escolhe outra parada
  segura. A posição dele é protegida na renovação de rochas e na primeira
  criação dos inimigos da mina.
- A mina pode ser inicializada para o NPC sem deslocar o jogador, mudar seu
  cenário, iniciar uma expedição do jogador ou criar recursos no inventário.

## Configuração inicial, provisória

`src/data/bento-schedule.ts` concentra os dias e horários da viagem:

| Parâmetro | Valor |
| --- | --- |
| Dias regulares | 2 e 5 da semana de sete dias do jogo |
| Terceira viagem | Dia 7, chance semanal de 30% |
| Preparação | Início de nova viagem entre 07:00 e 09:00 |
| Preparar antes de sair | 8 segundos de simulação |
| Exploração próxima da entrada | 100 minutos do jogo |
| Limite para iniciar o retorno | 16:00; espera/interrupção pode atrasar a chegada |
| Retomar atividades após chegar | 6 segundos de simulação |
| Caminhada | 48 pixels do mundo por segundo |
| Repetir uma passagem bloqueada | A cada 2 segundos |
| Transição de acesso | 0,3 s para sair e 0,3 s para aparecer no acesso seguinte |

A terceira viagem depende da semente salva e da semana; recarregar não refaz o
sorteio. O dia absoluto e o relógio existentes orientam a semana. Não foi criado
calendário de estações, clima ou eventos gerais. Uma passagem bloqueada pode
impedir a viagem; Bento não é teletransportado para cumprir a contagem semanal.

## Verificação

- Testes direcionados de agenda, ida e volta por todos os mapas, limite de
  deslocamento visível, entrada ocupada, troca de dia/hora, save/continue,
  interrupção por conversa, rota segura, regeneração e bloqueio de serviços.
- Testes dos sprites oficiais, rotinas e conversas dos outros comerciantes,
  viagem de Damião, economia, ferraria, mineração e compatibilidade dos saves.
- Roteiro de Chromium: saída real da oficina, um único Bento visível, serviços
  bloqueados durante a ausência, conversa e pausa, continuação na mesma posição,
  renderização na estrada/lago/platô/Mina Antiga/galerias e retorno à oficina com
  atendimento liberado. Capturas em `/workspace/bento-fase5-qa/`.

## Arquivos desta fase

Novos: `src/data/bento-schedule.ts`, `src/systems/bento-schedule.ts`,
`src/systems/bento-travel-state.ts`, `src/systems/bento-travel.ts`,
`src/systems/bento-navigation.ts`, `src/systems/world-route.ts`,
`src/bento-travel-view.ts`, `tests/bento-travel.test.ts`,
`tests/bento-sprites.test.ts`, `scripts/qa-bento-travel.cjs`.

Integração: `src/bento-sprites.ts`, `src/systems/village-walk.ts`,
`src/systems/fisher-travel.ts`, `src/systems/merchant-routine.ts`,
`src/systems/merchant-conversations.ts`, `src/systems/village-background.ts`,
`src/systems/economy.ts`, `src/systems/village-services.ts`,
`src/blacksmith-panel.ts`, `src/types.ts`, `src/systems/save.ts`,
`src/systems/underground.ts`, `src/systems/underground-renewal.ts`,
`src/systems/underground-hazards.ts` e os cenários `VillageScene`,
`CityForestScene`, `FishingLakeScene`, `HighlandScene` e `MineScene`.

## Limites desta entrega e próxima fase

**A fase 6 é a mineração real limitada de Bento, com inventário próprio,
transporte e depósito privado dentro da oficina existente.** Nesta etapa ele
examina o local; a viagem não destrói rochas, fabrica produtos ou concede minérios.

As paradas de preparação/retorno usam idle oficial. Quadros específicos de mãos
preparando ferramentas, bigorna, forja, mineração, coleta, guardar e retirar
materiais ainda precisam ser produzidos/integrados às atividades efetivas.
Não são apresentados como animações de trabalho finalizadas.

Expedições conjuntas, liderança/comandos, defesa/fuga completa, missões únicas,
resgate por Bento e relacionamentos continuam nas fases 7–10. A rotina preserva
as visitas e conversas existentes nos dias sem viagem.

Sem dependências novas, publicação ou alteração da versão do instalador.
