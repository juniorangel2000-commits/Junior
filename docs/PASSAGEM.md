# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD do branch. Implementação desta rodada em `88dd14c`, `f28f27c` e `5424eee`.
- **Última versão publicada:** `v0.10.0-preview.34`, https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** interiores, ovos e leite validados, inclusive ordenha no navegador. Otimizações de desempenho e novo capim animado nos Campos Abertos concluídos. Branch enviado ao GitHub. **Não publicado; main, tags e versão do pacote não foram alteradas.**

## Feito nesta rodada

- **Entrada no curral corrigida** (`88dd14c`):
  - Reproduzido o deslocamento de 32 px. Instrumentação confirmou que o terreno estava livre e a segunda chamada de `recoverPlayerPosition` encontrava a vaca como obstáculo.
  - A vaca estava recolhida, mas seu sprite nascia visível até o primeiro `AnimalPopulation.update`. Ao restaurar a partida, isso afastava o jogador da porta.
  - Animais recolhidos agora já nascem ocultos, e `blocksPoint` consulta o estado de recolhimento imediatamente. Animais soltos e conduzidos pela corda continuam colidindo. O alcance da porta continua 30 px.
  - Três testes de regressão em `tests/animal-population.test.ts`; o QA de produção também exige que carregar não afaste o jogador da porta.
- **Ovos e leite** (implementação anterior do Claude preservada):
  - Cocho interno por construção: galinheiro 12, curral 8 palhas. Cada animal alojado come 1 palha às 06:00, com prioridade para quem está há mais tempo sem comer.
  - Galinhas alimentadas põem ovos nos seis ninhos; E recolhe. Vacas alimentadas exibem a gota de leite; E perto delas com o balde inicia 1 s de ordenha.
  - Balde na bancada: 4 tábuas regulares + 2 fragmentos de ferro, exigindo martelo.
  - Helena compra ovo (8) e leite (16); Rosa compra ovo (8). Não há venda desses produtos pelas lojas.
  - `animal-production.ts` faz ações com gravação antes de aplicar, recuperação de até 7 manhãs usando estoque real e migração sem produção retroativa.
  - QA completo passou: abastecer ambos os cochos, produzir 2 ovos, recolher ovo, sair do galinheiro, entrar no curral, mostrar a gota e ordenhar 1 leite. Capturas em `docs/planejamento/qa-producao/`.
- **Desempenho** (`f28f27c`):
  - Junior confirmou que o travamento percebido era nos **Campos Abertos**, e pediu também conferir os outros mapas.
  - `meadow-visibility.ts`: índice espacial das moitas. A atualização visual consulta só a região da câmera; a busca de grama pelos animais usa células próximas. Mantidas as mesmas margens de visibilidade, crescimento, posições e colisões.
  - Coleta automática não copia o save inteiro quando `read()` está disponível e ainda não há `groundItems`. Antes, o `??` no campo ausente caía em `snapshot()` a cada consulta.
  - A HUD guarda os dados atuais, mas não refaz seus textos por frações de minuto ou pixels de caminhada; o marcador do mapa continua com a posição exata. Controles de zoom evitam alterações de DOM sem mudança de valor.
  - `Daylight` só cria o shader das janelas em mapas que realmente possuem essas janelas, usando camadas simples de cor quando não há luz de janela. Sombras solares, clima e luzes locais preservados.
  - Novo `scripts/qa-world-performance.cjs`: amostra Propriedade, galinheiro, curral, Campos, Floresta, Lago, Platô, Mina Antiga, Acesso à Cidade e Vila. `QA_SCENES=Campos,Floresta` filtra; `QA_CPU_PROFILE=1` grava perfis; aceita `QA_URL` e diretório de saída como argumento.
  - Comparação em `docs/planejamento/qa-campos-abertos/desempenho.json`, feita antes da troca de arte do capim: HUD média Campos 0,93 → 0,40 ms; Lago 2,78 → 0,26; Vila 2,36 → 0,54. Todos os mapas amostrados sem erros JS.
  - **Não afirmar ganho de FPS:** o ambiente usa SwiftShader (GPU emulada). Os tempos de quadro não demonstraram melhora consistente e não estimam o desempenho do executável no PC do Junior. Ainda falta ele conferir a fluidez em hardware real.
- **Capim novo** (`5424eee`):
  - Junior não gostou do capim anterior nem da rotação da moita inteira; pediu inspiração no capim de Stardew Valley e para ver o resultado.
  - Arte própria gerada por imagegen: `public/assets/visual/open-fields/meadow-grass.png`, três variantes × quatro poses de brisa. PNG original preservado; recortes, hash e raízes alinhadas em `meadow-grass.json`.
  - `meadow-grass-art.ts` prepara os recortes em resolução original e remove o halo semitransparente em memória, seguindo o corte de alfa já usado na vegetação. Nenhuma redução do PNG em disco.
  - Nos Campos, tufos mais baixos e abertos, com proporção própria. Animação lenta das folhas em fases diferentes, sem girar a base e somente nas moitas visíveis. Capim cortado mantém a pose de rebrota.
  - As sprites compartilhadas de vegetação nos outros mapas não foram substituídas.
  - Captura mostrada ao Junior: `docs/planejamento/qa-campos-abertos/capim-novo.png`.
  - `scripts/qa-open-fields.cjs` atualizado para pular a introdução, iniciar a caminhada fora do gatilho da passagem e capturar o capim novo. Entrada andando, corte, recolhimento, mochila, mapa, recarregamento e volta andando passaram; `validacao.json` registra o resultado.
- **Arte definitiva dos interiores preservada** (SpriteCook, `a397d2d`): não reduzir os PNGs. Usar `setScale`/`setDisplaySize`; piso com `FLOOR_SCALE=2`. Manifesto em `public/assets/visual/farm/interior/spritecook-assets.json`. Prompts futuros: "front-facing, axis-aligned, NOT isometric".

## Em andamento e próximo passo exato

- Não há código WIP desta rodada. Aguardar a avaliação visual do Junior sobre o capim e o teste de fluidez no PC dele. Caso ainda trave, medir especificamente a região/zoom e o save afetados em hardware real; não interpretar os FPS do SwiftShader como confirmação de solução.
- Etapa 2 de animais concluída tecnicamente. Próximo conteúdo do plano: **ovelha e cabra com aprisco**, quando solicitado. Acabamentos opcionais: ajustar preços jogando e som próprio de ordenha.
- **Versões são apenas proposta, ainda não confirmada:** preview.35 interiores/ovos/leite; .36 ovelha/cabra; .37 máquinas; .38 cozinha; .39 porco/pato/abelhas.
- Não publicar sem pedido atual do Junior. O `package.json` continua em preview.34 até a publicação autorizada.
- O SpriteCook está autorizado na conta do Junior; o Codex não tem esse conector nesta sessão. A arte do capim desta rodada foi gerada por imagegen.

## Pendências e ideias para depois

- Plano completo em `docs/planejamento/ANIMAIS-E-RECEITAS.md`; produção em `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`.
- Confirmar com Junior a regra do estábulo para a corda do cavalo, não para ele comer.
- Chamar cavalo de longe, montaria e quadros de deitar/descansar.
- Sementes especiais, clima e peixes por estação, árvores frutíferas e estufa.
- Há um stash local antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar por cima desta PASSAGEM nem desfazer os interiores atuais.** O trabalho atual está todo no branch preview.35 enviado.

## Problemas conhecidos

- Animais no interior não guardam sua posição; ao entrar reaparecem nas baias (vacas) ou posições iniciais (galinhas).
- Interiores dos animais ficam sempre claros à noite.
- Build avisa sobre o tamanho do chunk principal, sem falhar. Separar módulos só se nova medição justificar.
- FPS em hardware real ainda não conferido; ver ressalva da medição acima.

## Testes

- Antes de alterar: `npm ci`, `npm run check` e `npm test`: **1.954 passaram / 220 arquivos**, zero falhas.
- Final: `npm run check`: ok; `npm test`: **1.962 passaram / 223 arquivos**, zero falhas; `npm run build`: ok.
- Testes novos: colisão inicial/recolhimento/corda, ausência de cópia do save com chão vazio, seleção espacial das moitas, integridade e fases do atlas do capim.
- Chromium: produção de ovos/leite completa; dez amostras de cenários sem erros JS; Campos Abertos com entrada, corte, coleta, inventário, mapa, recarregamento e retorno aprovados.
- Execução dos QAs: Vite em 5190, Playwright externo e `CHROMIUM_PATH=/usr/bin/chromium` onde necessário. Evidências em `docs/planejamento/qa-producao/` e `docs/planejamento/qa-campos-abertos/`.
