# Rotinas, identificação dos NPCs e armazém editado

Alterações implementadas localmente, sem nova publicação ou commit nesta etapa.

## Rotinas de Augusto e Bento

O relógio existente do jogo determina atendimento, intervalo na praça, retorno e encerramento. Augusto atende entre 08:00–12:00 e 13:30–20:00; Bento entre 08:00–12:00 e 13:30–19:00. Durante o intervalo, eles caminham até a praça, podem conversar uma vez por dia e retornam aos respectivos comércios. Os destinos e tempos estão centralizados em `MERCHANT_DAILY_PLAN`.

A navegação reutiliza `VillageWalk` e o A* existentes. No interior, a busca considera todo o espaço ocupado pelos pés, incluindo as quinas entre células, para evitar travamentos nos móveis. A chegada em outro ambiente utiliza `freeArrival`, respeitando o jogador e os outros atores. Uma porta ocupada faz o NPC esperar.

A condução continua opcional. Uma condução concluída pode priorizar o atendimento por até 45 minutos do jogo durante o intervalo; o encerramento noturno continua valendo. Conversas, contratos e serviços permanecem acessíveis; somente compra e venda dependem do horário e do interior correto. O comando da transação também verifica essas condições.

As rotinas avançam enquanto a vila está ativa. Ao voltar de outro cenário, o destino é atualizado pelo relógio atual e o NPC percorre o trajeto. Os demais oito comerciantes ainda não receberam rotinas diárias individuais.

O campo opcional `villageRoutines` guarda posição, ambiente, destino da ronda, espera, prioridade de atendimento e conversa já realizada. Os campos anteriores do Bento e dos moradores continuam atualizados para compatibilidade.

## Nomes e balões

Os nomes permanentes sobre os comerciantes e sobre Lia foram removidos. O nome e a função aparecem em uma identificação junto ao cursor somente ao passar o mouse sobre o personagem. Sair do personagem, abrir um menu ou trocar de cenário oculta essa identificação.

Nomes e falas agora usam texto HTML no tamanho da tela, sem serem ampliados pela câmera. A moldura de madeira, o papel e as cores reutilizam a HUD existente. A conversa exibe uma fala por vez, com uma pequena ponta indicando o personagem, sem cabeçalhos permanentes com nomes.

O componente compartilhado é `VillageNpcOverlays`, utilizado pela vila e pela propriedade. Seus elementos e eventos são removidos ao encerrar a cena; cenas inativas não deixam identificações sobre o cenário atual.

## Armazém recebido

O arquivo `After-Rain-Armazem-Editado.json` foi incorporado integralmente como `src/data/augusto-layout.json`: 41 peças, incluindo peças guardadas, colisões e acessórios vinculados. Não houve reposicionamento artístico ou alteração dos PNGs.

Partidas que ainda usam o primeiro armazém intacto recebem o novo padrão. Edições próprias posteriores são preservadas. A entrada, o espaço do proprietário e o acesso ao balcão foram validados. O cenário continua disponível no editor existente.

## Correções encontradas durante a validação

- O centro de uma célula podia estar livre enquanto uma quina do corpo encostava no móvel. A busca agora reserva a célula inteira.
- O início de uma condução copiava propriedades internas da sprite para o estado persistente. Agora copia explicitamente apenas X e Y, evitando falhas em `structuredClone` e no salvamento.
- Identificações pertencentes à cena anterior são removidas enquanto ela fica inativa.

## Evidências

`qa.json` contém a conferência no navegador: rotinas, encontro, horários, compra bloqueada sem consumo de Coroas, serviços preservados, salvamento, identificação de Lia e Augusto ao passar o mouse, tipografia em diferentes níveis de zoom e balão com a moldura real da HUD.

`augusto-bento-conversa.png` e `armazem-editado-hover.png` mostram o resultado. As árvores foram ocultadas apenas nas capturas de revisão.

A sprite frontal da Rosa foi separada sem alterar seus bytes: PNG RGBA, 192×256, em `/workspace/Rosa-Frente-Original.png`.

Testes adicionais: `tests/merchant-routine.test.ts` e `tests/augusto-authored-layout.test.ts`. Verificação real em `scripts/qa-merchant-routines.cjs`; regressão dos sistemas anteriores em `scripts/qa-merchant-interiors.cjs`.

Validação final: TypeScript e build aprovados; **736 testes em 73 arquivos**, **20 verificações de rotinas/interface** e **22 verificações de regressão** no navegador, todas aprovadas. O aviso já existente de tamanho do bundle permanece.
