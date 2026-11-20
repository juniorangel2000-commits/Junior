# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD. Ferramentas laterais refeitas a partir da machadinha; próxima prioridade do Junior é o masculino montado.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, já na `main`. Nada publicado nesta rodada; pacote e main continuam na .43.
- **Estado:** implementadas animações laterais de enxada, pá, foice e regador para os dois personagens, mantendo os ícones. Fontes de corpo refeitas diretamente da machadinha após o retorno sobre estilo e pegadas. Check, 2.203 testes / 263 arquivos e build passaram. Implementação em `d70d45c`, refeita após retorno do Junior em `5133e15`.

## Feito nesta rodada

### Ferramentas — pedidos e decisões mais recentes do Junior

- A ordem pedida foi ferramentas primeiro, depois o masculino montado.
- A primeira tentativa de enxada embutida na folha mudou tamanho/orientação entre quadros e foi rejeitada. Junior sugeriu sprites simples exclusivas da animação, mantendo os ícones, e pediu **somente vistas laterais**.
- Pediu movimentos distintos: enxada com arco da picareta/machadinha; pá cava/faz alavanca; foice corta embaixo. Depois pediu proporção igual às ferramentas existentes, corrigir cabos fora das mãos e refazer com base direta nas animações aprovadas, pois estavam distintas.
- A base intermediária de corpo, derivada da mineração, foi substituída. **Não voltar a ela**, nem compartilhar um único mapa de mãos entre masculino e feminino.

### Implementação final

- Fontes nativas em `referencias/personagens/ferramentas-corpo/`, editadas por imagegen a partir das laterais de `work-chopping.png`, removendo a machadinha. Mantêm o masculino com sua postura/cabelo e a feminina com corpo esguio e coque próprios dela. São seis poses × duas vistas, 2172×724, sem reduzir a fonte.
- `scripts/prepare-player-tool-body.cjs` limpa alfa/resíduos soltos, conserva os pixels nativos e produz `work-body.png` para cada personagem e `player-tool-body.json`. Escala/origem vêm da machadinha; **pegadas calibradas por personagem, direção e pose**. Testes verificam pele opaca em cada ponto da mão.
- `src/player-tool-body.ts` carrega as células nativas e converte cada ponto de pegada para o mundo. O corpo original fica oculto apenas durante a ação e sua visibilidade é restaurada ao terminar/cancelar, inclusive se já estava oculto.
- `src/data/player-tool-motion.ts` mantém nove posições do relógio existente:
  - enxada: preparação, levantar à frente como a machadinha, golpe, recuperação;
  - pá: inserir no chão e alavanca, sem pose acima da cabeça;
  - foice: varredura baixa, sem erguer ao ombro;
  - regador: acompanha as mãos, preservando o jato autoral anterior.
- São só esquerda/direita na apresentação. Direção lógica da interação preservada: norte/sul usam lateral direita; diagonais à esquerda usam a esquerda. Picareta/machadinha originais continuam em quatro vistas, sem substituir suas folhas.
- `public/assets/visual/tools/work/`: fonte de imagegen e sprites simples de enxada/pá/foice, exclusivas do movimento. `scripts/prepare-work-tools.cjs` recorta as células de 724 px sem reduzir PNGs; `art.json` guarda pegadas e escala.
- Enxada/pá com cerca de **30 px** de altura no mundo; foice **22 px**, proporcionais à picareta/machadinha. A mesma textura rígida é usada em todo o ciclo, sem mudar desenho, espelhamento ou tamanho.
- `src/work-tool-art.ts` troca apenas os tons neutros da cabeça metálica por nível. Os ícones do inventário não foram alterados; foice/pá continuam começando em ferro.
- `ToolVisual.show` integra corpo + ferramenta; `playGather` agora recebe o corpo do jogador também na pá/foice da Propriedade e na foice da Floresta/Campos. Mesmos relógios, regras do solo, custos, durabilidade e formato de save anteriores.
- Documentação da arte em `public/assets/visual/tools/work/README.md` e lista de pendências atualizada.

### Prévias e conferência

- `scripts/capture-art-review.cjs`, modos `tools-male` e `tools-female`, mostra o **adaptador real** em esquerda/direita: machadinha e picareta como referência, depois enxada, pá, foice e regador.
- GIFs finais e auditorias em `docs/planejamento/qa-arte-preview44/ferramentas-laterais/`.
- Conferidos preparação, levantamento, contato e recuperação dos dois personagens. O QA verifica textura/escala/espelhamento constantes, quatro níveis de ferramenta, corpo oculto durante a ação e restauração ao terminar/cancelar. Sem erros JS.
- Estas capturas são conferência do renderer; não afirmar que foi percorrido um ciclo completo de plantio em todos os mapas.

### Trabalho anterior preservado da preview.44

- `9d06bfe`, `99ce073`, `94810c0`: revisão das rotinas/arte e passagem anterior, já enviados junto desta rodada.
- Rotinas da vila: Augusto folga com sol, Nilo na pousada com chuva, almoço de Augusto e volta à loja, jantar/retorno de Rosa. QA de caminhos físicos, pausas/serviço e save com dez moradores em `scripts/qa-village-schedule.cjs` e `qa-rotinas-preview44/`.
- Removido teleporte após seis segundos de bloqueio nas visitas da Propriedade e em Marina/Rui. `PropertyVisitWalk` usa `VillageWalk`, espera/replaneja. Conferidos bloqueio de 12 s, retomada, chegada e retorno, passos máximos de 8,4 px/0,1 s, sem saltos. Sem campo novo no save.
- Marina com seis passos e Rui com oito nas quatro vistas principais, baseados nas caminhadas originais dos jogadores. Ciclo por 48 px percorridos, sem idle infinito. Diagonais próprias ainda pendentes. Fontes, atlas, hashes, `scripts/pack-survivor-walk.cjs`, `src/data/survivor-walk.ts` e QA preservados.
- Chiqueiro fechado original e aberto a **90 graus**: `pigsty-open-source.png`, patch só da folha aplicado pelo renderer. Comparação fora da porteira: zero pixels diferentes. Sprites exportadas e GIFs na pasta `qa-arte-preview44/`.
- Montaria anterior conferida nas oito vistas, andando/galopando. Ainda são oito poses acompanhando o cavalo, não uma animação nova do corpo montado. O masculino atual continua sendo a cabeça dele sobre a base feminina.

## Em andamento e próximo passo exato

1. Seguir o retorno do Junior sobre os GIFs finais das ferramentas. Fontes e metadados atuais já substituem os rascunhos rejeitados.
2. **Depois, masculino montado**, conforme a ordem pedida. Existe proposta de oito poses sentadas em `referencias/personagens/montaria/masculino-proposta.png`, fonte nativa de imagegen; **ainda não aplicada, encaixada ou aprovada**. Ler o README ao lado.
   - Validar proporções, mãos, pernas e identidade sobre o cavalo nas oito vistas.
   - Preservar a personagem feminina e o atlas/animação do cavalo.
   - Fonte 1536×1024, quatro colunas × duas linhas. O carregamento atual usa células de 192: precisa de adaptador/encaixe próprio, incluindo `src/world-loading.ts`, não só trocar o PNG.
   - Não alterar o clamp de `riderLift` sem evidência: nos quadros Walk/Run os valores já estão entre -4 e 3; extremos de outros estados não são o problema da montaria.
3. Sobreviventes: diagonais autorais/poses paradas correspondentes continuam como expansão futura. Caminhadas originais dos jogadores devem permanecer intactas.
4. Não publicar sem pedido. Trabalho novo na .44; última publicada e pacote continuam .43.

## Pendências e ideias para depois

- Histórias de Amélia (flor rara no pântano) e Nilo (peça nas ruínas) aguardam os novos cenários; não criar mapas apenas por esta revisão.
- Plano `ANIMAIS-E-RECEITAS.md`: animais, cozinha, abelhas, patos, porcos, máquinas e qualidade implementados antes desta rodada. Equilibrar preços jogando, substituir artes provisórias conforme a lista atualizada.
- Estábulo/corda/calendário seguem planos anteriores; visitas noturnas e aniversários são ideias, não implementados aqui.
- Stash antigo da preview.34: não aplicar sobre esta passagem.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de números de F3 no PC do Junior. Ambiente de QA usa SwiftShader; não afirmar FPS resolvido.
- Interiores dos animais não persistem posição individual.
- Qualidade de itens soltos/recolhidos volta a comum.
- `qa-animal-escort.cjs` desatualizado na volta; corda conferida em `qa-horse-taming`.
- `qa-farm-interior.cjs` tem falha antiga na dica da porta do galinheiro.
- Alguns QAs fixam `/usr/bin/chromium`; ajustar caminho em outro ambiente. Chromium/SwiftShader pode travar após minutos de movimento; `qa-horse-riding` separa navegadores.
- Originais de arte devem permanecer sem redução; escala só no jogo.

## Testes

- Base desta rodada: `npm ci` offline (sem binário do Electron), check e **2.199 testes / 262 arquivos** passando antes de editar.
- Primeira integração: check, **2.203 testes / 263 arquivos** e build passaram. Depois foi refeita a base do corpo por retorno do Junior.
- Segunda base final: check, quatro testes direcionados, **2.203 testes / 263 arquivos** (169 s) e build passaram, zero falhas. Aviso de tamanho do bundle já existente.
- `tests/player-tool-body.test.ts`: escala/espelhamento constantes, arco lateral espelhado, contato no chão, pá/foice sem levantar acima da cabeça, regador sem inclinação dupla, dimensões nativas, pegadas na pele por personagem/pose e proporção das ferramentas.
- Navegador: duas capturas finais completas, sem erros JS, invariantes de rigidez, níveis e visibilidade passando. Previews anteriores mantidos apenas em /tmp foram substituídos na pasta de evidências.
- Servidor QA: Vite em 5190, Chromium e ffmpeg. Neste ambiente porta/browser/rede exigiram execução fora do sandbox; não alterar proxies ou configurações de segurança.
