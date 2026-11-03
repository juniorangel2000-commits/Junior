# Fase 6 — mineração real e depósito particular do Bento

O Bento escava a mesma mina do jogador, transporta apenas pedra e ferro e guarda os materiais nos depósitos já existentes dentro da ferraria. Não foi criado outro prédio, anexo ou móvel.

## Fluxo implementado

1. A viagem semanal da fase 5 continua usando um único Bento e todos os portais reais.
2. Nas galerias, ele escolhe uma face exposta permitida, verifica espaço, alcance e segurança e caminha até a posição de trabalho.
3. O golpe usa `ToolUse`, `applyMineStrike`, `Resources` e `Inventory` existentes. A picareta básica tem desgaste próprio; os materiais e o dano acumulado são os oficiais.
4. A destruição atualiza a célula e as bordas vizinhas. A carga fica exclusivamente em `bentoWork.pack`.
5. De volta à ferraria, ele caminha até a **caixa de minérios** para pedra e o **armário de carvão e ferro** para ferro. As posições e colisões são lidas do layout editável atual.
6. Ele guarda os materiais, retira uma quantidade limitada para um trabalho pessoal e caminha até a bigorna existente. O trabalho consome o próprio estoque, sem gerar produtos para o jogador. O trabalho com pedra também faz manutenção da própria picareta básica.
7. Ao terminar, retoma a rotina e o atendimento habitual. Trabalhos pessoais dentro da oficina não contam como ausência na mina.

O jogador recebe apenas a identificação “Depósito particular do Bento” ao interagir com os recipientes. Não existe transferência, abertura de inventário ou acesso ao estoque do NPC. As receitas, preços, estoque comercial e itens públicos não foram alterados.

## Limites iniciais, provisórios

Nenhum número desta tabela é balanceamento definitivo. A configuração está em `src/data/bento-work.ts`.

| Regra | Valor inicial |
| --- | --- |
| Blocos por expedição | Até 6 |
| Blocos de ferro por expedição | Até 2 |
| Transporte | 32 unidades ponderadas |
| Depósito de pedra | 96 unidades |
| Depósito de ferro | 64 fragmentos equivalentes |
| Tempo de trabalho na mina | Até 75 segundos de simulação |
| Busca local | Raio de 8 células |
| Guardar ou retirar | 1,2 segundo, transferência única no meio da ação |
| Trabalho pessoal | 4 segundos |
| Frequência de trabalho pessoal | Até 2 por dia, intervalo de 180 minutos do relógio |
| Custo de trabalho | 4 pedras ou 1 unidade do ferro disponível |

Um minério de ferro inteiro vale os 9 fragmentos já definidos pela economia atual. Antes de golpear, a capacidade reserva o maior resultado possível, evitando descartar o excedente. Ouro, metal negro, estruturas protegidas e células de missão fornecidas pelo contexto são recusados.

Depósito cheio suspende novas coletas. Durante o horário de trabalho, um serviço pessoal tem prioridade antes de uma nova partida. Uma visita ainda pode ser apenas de inspeção; nada é gerado por tempo ou por viagem. O consumo gradual abre espaço e permite retomar a coleta. Os testes cobrem esse ciclo em duas visitas semanais distintas.

## Persistência e disputas

- Carga, depósitos, desgaste, cotas, ações em andamento e consumo são salvos em `bentoWork`, extensão opcional compatível com os saves anteriores.
- Cada impacto, depósito, retirada e consumo usa uma cópia do save. Só após escrita durável bem-sucedida a mina e o estoque particular são substituídos no estado vivo.
- Os snapshots de cada cenário mantêm o inventário, posição e progressos atuais do jogador ao salvar uma ação do NPC. Isso inclui os cenários que mantêm inventários vivos separados do objeto salvo.
- O mesmo bloco mantém o mesmo ID e dano compartilhado. Apenas quem o destrói recebe o recurso. O estado de impacto de `ToolUse` impede repetir um golpe após recarregar.
- Há conservação validada por material: **carga + depósito + consumo = total coletado**. Não existe estoque inicial gratuito, mesmo que a arte dos recipientes já mostre minério.
- Fora da tela, continuam sendo usados a geometria real, caminho, golpes e limites. Sem adaptador de escrita durável, a rotina continua apenas de inspeção.
- Obstáculos ou alterações no layout não são resolvidos com teleporte. O NPC espera uma rota válida; sua carga é preservada.

## Arte integrada

Foram criadas três folhas transparentes de ações, cada uma com seis quadros em quatro direções: picareta, martelo e manuseio de material. Os quadros de manuseio também são usados ao contrário para retirar materiais. Estão em `public/assets/visual/village/bento/work-*.png`.

`bento-work-art.ts` usa escala e pivôs dos pés fixos por direção e sincroniza o contato da picareta com o impacto real. A caminhada oficial em oito direções permanece; ao terminar ou atender o jogador, a textura original é restaurada. Os arquivos originais gerados foram preservados em `/workspace/generated_images`.

## Arquivos principais

- Regras: `src/data/bento-work.ts`.
- Estado e validação: `src/systems/bento-work-state.ts`, `src/types.ts`, `src/systems/save.ts`.
- Mineração: `src/systems/bento-mining.ts`, `src/systems/tool-use.ts`.
- Estoque, consumo e transações: `src/systems/bento-stock.ts`, `bento-commit.ts`, `bento-workshop.ts`.
- Depósitos e navegação: `src/systems/bento-fixtures.ts`, `bento-travel.ts`.
- Apresentação: `src/bento-work-art.ts`, `src/bento-travel-view.ts`, `src/scenes/VillageScene.ts`.
- Rotina e serviços: `src/systems/bento-schedule.ts`, `merchant-routine.ts`, `village-background.ts`.
- Snapshots: `ValleyScene`, `VillageScene`, `CityForestScene`, `FishingLakeScene`, `ForestScene`, `HighlandScene`, `MineScene`, `SurvivorCampScene`.
- Verificação: `tests/bento-work.test.ts`, `tests/tool-use.test.ts`, `scripts/qa-bento-work.cjs`.

## Verificação concluída

- **258 testes em 16 arquivos passaram**, cobrindo mineração compartilhada, ferro real, cotas, conservação de recursos, depósito cheio, consumo, retomada de coleta, recarga no meio do golpe, disputas com o jogador, falhas de escrita, perigo antes do impacto, rota física, serviços e compatibilidade de saves. Inclui regressões de mineração, perigos, economia, layout da ferraria e rotina dos comerciantes.
- **Build de produção passou** (`npm run build`). Permanece o aviso conhecido do Vite sobre o tamanho do pacote JavaScript; não impediu a geração da distribuição.
- **Chromium passou**, com ciclo visível de mineração, atualização local do terreno, salvar/continuar, caminhada até o depósito existente, retirada, bigorna, retorno à textura original e reabertura dos serviços. Sem erros de JavaScript, texturas ausentes ou quadros inválidos.
- A demonstração visual usa uma cópia de teste com zumbis e morcegos removidos para o observador acompanhar o trabalho inteiro. O código de produção mantém os perigos; testes separados verificam que o Bento interrompe o próximo golpe se um perigo se aproxima. A defesa e fuga completas ainda são da fase 7.
- O inventário/economia do jogador foi comparado antes e depois do ciclo; não houve alteração. As peças da ferraria não foram criadas, movidas ou substituídas.

Roteiro reproduzível: `node scripts/qa-bento-work.cjs`, com servidor Vite em `127.0.0.1:5190`. Capturas em `/workspace/bento-fase6-qa/`:

1. `01-Bento-minerando.png`
2. `02-Bloco-real-escavado.png`
3. `03-Guardando-no-deposito-existente.png`
4. `04-Retirando-material-proprio.png`
5. `05-Trabalho-pessoal-na-bigorna.png`
6. `06-Estoque-salvo-e-atendimento-normal.png`

## Limites e próxima fase

Esta fase implementa o trabalho autônomo e o depósito particular. Comandos de expedição conjunta, liderança, separação, defesa e fuga pertencem à **fase 7**. O Bento interrompe a mineração se surge um perigo; não foi implementado um combate automático provisório nesta entrega. Missões e novos eventos pertencem à fase 8 e o resgate completo à fase 9.

A build para publicação e um novo instalador não foram solicitados nesta fase. A versão do projeto permanece `0.10.0-preview.28`.
