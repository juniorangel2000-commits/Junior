# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD. Revisão de rotinas e arte em `9d06bfe` e `99ce073`.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, já na `main`. Nada foi publicado nesta rodada; pacote, main e tags permanecem como estavam.
- **Estado:** retomado o trabalho do Claude. Novas rotinas da vila conferidas no navegador; removido teleporte de visitas e de Marina/Rui; passadas próprias dos sobreviventes; pegada/profundidade das ferramentas corrigidas; chiqueiro com estados alinhados fechado/aberto a 90 graus. Check, 2.199 testes e build passaram.

## Feito nesta rodada

### Retomada

- O ambiente tinha apenas a cópia antiga da preview.35. Foi necessário buscar os refs no GitHub com execução fora do sandbox (proxy inacessível no sandbox). Última passagem do Claude era a preview.44, após publicação da .43.
- Mantido o trabalho da .43: presentes, amizade, respostas, oito histórias pessoais, folgas, chuva, pousada, visitas à propriedade, Marina/Rui e velocidade dos NPCs igual à do jogador. Detalhes nas notas da preview.43 e documentos dos sistemas.
- Durante a rodada chegaram `4d65a0c` e `39f15b1`, dois commits de documentação que se anulam. Foram integrados por merge, sem sobrescrever o trabalho remoto.
- Base validada: `npm ci` (sem baixar binário do Electron), check e 2.192 testes / 259 arquivos passando.

### Rotinas e deslocamento

- `scripts/qa-village-schedule.cjs`: confere a cena real, não apenas regras isoladas:
  - Augusto passeia na folga com sol;
  - Nilo vai à pousada na folga chuvosa;
  - Augusto almoça dentro da pousada com chuva e volta à loja;
  - Rosa janta na pousada e volta para casa às 21h.
- Conferidos trajetos, transferências por portas, ausência de colisão com cenário, passo máximo de 8,4 px por atualização de 0,1 s, serviço fechado durante pausa/folga e save válido com dez moradores.
- Preparação do QA foi corrigida: desbloquear a entrada da vila na partida de teste; não tentar sair de uma loja sem estar dentro; tirar o jogador da porta durante o teste de saída do NPC. Essas falhas eram das fixtures, não regressões do produto.
- Encontrado e removido o atalho que colocava o visitante no destino após seis segundos bloqueado. `PropertyVisitWalk` mantém a posição e deixa `VillageWalk` tentar novamente o caminho. Sem campo novo no save.
- `--property-visit`: Ícaro fica 12 s diante de bloqueio, retoma e caminha cerca de 2.643 px até a casa; depois volta à estrada e só então desaparece. Máximo 8,4 px por quadro; sem erros JS.
- O mesmo atalho de teleporte existia em Marina/Rui e foi removido, reutilizando o controlador.
- `--survivors`: confere Marina/Rui bloqueados por 12 s, retomada, imagens de caminhada mudando e chegada à tarefa sem saltos.
- Evidências em `docs/planejamento/qa-rotinas-preview44/`.

### Arte e animações — pedidos adicionais do Junior

Prioridades informadas: personagem montado, sobreviventes, arte do chiqueiro, ferramentas e conferir outros itens.

- **Sobreviventes:** primeira proposta descartada porque os quadros pareciam repetidos. Junior pediu conferir as caminhadas originais dos jogadores (aprovadas) e usá-las como referência.
  - Folhas dos quadros originais foram montadas em `/tmp` para referência, sem alterar os assets dos jogadores.
  - Novas artes de Marina (6 quadros por vista) e Rui (8), nas quatro vistas principais: sul, norte, leste e oeste. Ciclo de 48 px percorridos, como os jogadores, em vez do balanço de uma pose parada.
  - Parados mantêm as poses originais; animação avança só ao andar e reinicia ao parar. Não há animação idle rodando em loop.
  - Fontes de imagegen preservadas em `public/assets/visual/characters/survivors/*-walk-source.png`. Atlas, recortes, hashes e escalas em `walk.json`; `scripts/pack-survivor-walk.cjs` não reduz os pixels, alinha cada linha por deslocamento fixo e remove transparência residual abaixo de alfa 200.
  - `src/data/survivor-walk.ts` fornece direção e fase. **Diagonais próprias ainda não existem:** continua a vista lateral dominante, como antes. Não afirmar que foram criadas oito vistas.
- **Ferramentas:** `ToolVisual` reduzia a direção real para esquerda/direita antes de escolher mão e profundidade, inclusive nas vistas de costas. Agora `toolHandPlacement` mantém a mão das oito direções; só o desenho é espelhado. Ferramentas de costas ficam atrás do corpo. Artes completas de mineração/machadinha mantidas, com suas cores por nível.
- **Chiqueiro:** Junior retomou o item em espera e pediu a mesma construção em dois estados. Rejeitou a primeira abertura a 45 graus e pediu **90 graus**.
  - Fonte correta gerada em `public/assets/visual/farm/pigsty-open-source.png`. A folha fica perpendicular à cerca, vista de lado, com o vão livre.
  - A versão fechada é a textura original. O renderer aplica somente a região da folha da fonte nova (318,775,166,192, normalizada a 816×967), mantendo telhado, paredes, chão e demais cercas exatamente iguais.
  - QA compara todos os pixels fora da região da porteira: **zero diferenças**. Colisões e dimensões continuam seguindo o `gateOpen` existente.
  - Sprites exportadas `chiqueiro-fechado.png` / `chiqueiro-aberto.png` e comparação `pigsty.png` em `docs/planejamento/qa-arte-preview44/`.
- **Montaria:** conferida visualmente nos dois personagens, nas oito direções, andando e galopando. GIFs de vistas principais e diagonais na pasta de QA. Não foram substituídas as artes do cavaleiro: são oito poses existentes acompanhando o cavalo animado, sem uma nova animação independente do corpo montado. A captura usa `HorseMount` real e não composição ilustrativa.
- Os testes existentes de atlas de animais/personagens/ferramentas também passaram; isso confere referências, arquivos e recortes e não substitui a revisão visual de cada asset de todos os mapas.
- `scripts/capture-art-review.cjs` gera comparações pelos adaptadores reais de renderização. Modos: `survivors`, `horse`, `horse-diagonals`, `tools-male`, `tools-female`, `pigsty`. Usa Chromium (`CHROMIUM_PATH` opcional), Vite em 5190 e ffmpeg. Quadros temporários ficam em `/tmp`.
- Prévia detalhada, GIFs e medidas: `docs/planejamento/qa-arte-preview44/README.md`. Lista de arte atualizada em `docs/planejamento/ARTE-PENDENTE.md`.

## Em andamento e próximo passo exato

1. Seguir o retorno do Junior sobre os GIFs e os dois estados do chiqueiro. A caminhada original dos jogadores deve continuar preservada.
2. Se for expandir a arte dos sobreviventes: criar diagonais próprias e poses paradas correspondentes; hoje só quatro vistas são autorais. Para a montaria, avaliar com o Junior quais vistas ainda incomodam antes de substituir as poses fornecidas por ele.
3. Histórias da Amélia (flor rara no pântano) e Nilo (peça antiga nas ruínas) continuam aguardando os novos cenários. Não criar esses mapas só por esta revisão.
4. Desempenho: ainda faltam os números de F3 no PC do Junior.
- Não publicar sem pedido. O pacote continua preview.43; trabalho novo no branch preview.44.

## Pendências e ideias para depois

- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`: animais, cozinha, abelhas, patos, porcos, máquinas e qualidade já implementados antes desta rodada. Equilibrar preços jogando e substituir artes provisórias conforme a lista atualizada.
- Estábulo/corda e calendário seguem os planos anteriores. Visitas noturnas de Bento/Damião/Helena e aniversários são ideias, não implementadas aqui.
- Há stash antigo da preview.34 com documentação/evidências do estábulo aberto: não aplicar sobre a passagem atual.

## Problemas conhecidos

- Interiores dos animais não persistem a posição individual.
- Travamentos nos Campos ainda precisam de medição no PC do Junior; este ambiente usa SwiftShader. Não afirmar que FPS foi resolvido.
- Originais de arte devem permanecer sem redução de PNGs; o jogo ajusta a exibição.
- `qa-animal-escort.cjs` desatualizado na volta à Propriedade; corda conferida em `qa-horse-taming`.
- `qa-open-fields` / `qa-horse-fields` fixam `/usr/bin/chromium`; precisam de caminho compatível em outro ambiente.
- `qa-farm-interior.cjs` tem falha antiga na dica da porta do galinheiro.
- Qualidade de itens soltos no chão e recolhidos volta a comum.
- Chromium/SwiftShader pode travar após minutos de movimento e não terminar o Lago. `qa-horse-riding.cjs` usa navegadores separados por etapa.

## Testes

- Base: `npm ci`, `npm run check`, **2.192 testes / 259 arquivos**, todos passando.
- Final: `npm run check`, **2.199 testes / 262 arquivos**, zero falhas, e `npm run build` passando. Aviso de tamanho do bundle já existente.
- Novos testes: `property-visit-walk.test.ts` (3), `survivor-walk-art.test.ts` (2), `tool-hand-placement.test.ts` (2).
- Chromium: rotinas da vila, visita bloqueada/retomada/retorno, sobreviventes na propriedade e todas as capturas de arte acima passaram sem erros de execução.
- QAs exigem servidor `npm run dev -- --host 127.0.0.1 --port 5190 --strictPort`. Neste ambiente abrir porta/browser/rede exigiu execução fora do sandbox; não alterar proxies ou configuração de segurança.
