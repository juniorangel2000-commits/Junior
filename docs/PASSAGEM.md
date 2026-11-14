# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD. Patos e distanciamento nos Campos corrigidos e conferidos em `ec3ec4f`.
- **Última versão publicada:** `v0.10.0-preview.34`, https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** máquinas aprovadas no QA de navegador. Patos da Floresta Antiga e distanciamento nos Campos corrigidos e conferidos no navegador. **Suíte inteira passando e build ok.** Nada foi publicado; `main`, tags e versão do pacote estão inalteradas.

## Feito nesta rodada

### Patos e distanciamento nos Campos (Claude Code, `ec3ec4f`)

- **Causa da falha dos patos:** a detecção do jogador usava `lineClear`, que testa o mesmo bloqueio do caminho, inclusive o limite do habitat. Um jogador em terra, fora da faixa da margem, ficava invisível para o pato, que não fugia.
  - Correção: `AnimalBrain` ganhou um parâmetro opcional `sightBlocked` e o método `canSee`. A detecção usa `canSee`.
  - Sem `sightBlocked`, nada muda para os outros animais (continua `lineClear`). Os patos passam só os sólidos como bloqueio de visão.
- **O teste também estava errado:** o ponto `(384,500)` não é válido para o pato (`canStand` falso, o tile 11 fica fora da faixa), então ele não podia dar nenhum passo.
  - Agora o teste procura o ponto de margem mais distante em que o pato pode ficar.
  - Também confere que `lineClear` é falso e `canSee` é verdadeiro para o jogador em terra.
  - Os passos continuam limitados a 8 px.
- `scripts/qa-forest-ducks.cjs` (Chromium) passou duas vezes seguidas:
  - os dois patos nascem no lago;
  - um pato posto na margem, com o jogador em terra, foge e entra na água;
  - passo máximo por quadro de 2–5 px, sem saltos;
  - nenhum erro de JavaScript.
  - A porteira da floresta agora é atravessada a pé; o script caminha até a cena abrir.
  - Evidências em `docs/planejamento/qa-patos/`.
- **Distanciamento nos Campos:** no código, todos os animais soltos (cavalo, 2 vacas, 3 galinhas e 2 coelhos) já eram selvagens, via `createFieldAnimalBrain`. Faltava conferir no jogo.
  - `scripts/qa-fields-distance.cjs` passou. Com o jogador a 90 px, cada um se afasta em 2 s: o cavalo vai a 146 px, as vacas a 170–180, as galinhas a 211–217 e os coelhos a 235–244.
  - Uma vaca forçada a deitar levanta e foge.
  - Evidências em `docs/planejamento/qa-campos-distancia/`.

### Máquinas e animais (Codex, antes desta rodada)

#### Máquinas (`7d38fc8`)


- Cinco primeiras do plano `docs/planejamento/ANIMAIS-E-RECEITAS.md`: **queijeira, batedeira de manteiga, roca, tear e moinho de pedra**.
- Projetos aprendidos em serviços dos NPCs, seguindo o sistema existente:
  - Bento: queijeira (60 C), batedeira (50 C).
  - Tobias: roca (40 C), tear (50 C).
  - Ícaro: moinho (60 C).
  - Receitas aprendidas persistem em `villageProgress.recipes` e foram incluídas no whitelist. Montagem exige bancada e martelo; custos em `src/data/machines.ts`.
- Máquina pronta é item da mochila. **Usar / instalar** ou ativar o slot na barra coloca na frente do jogador. Vale na Propriedade e nos interiores de galinheiro, curral e aprisco; não na casa, dungeons ou outros mapas.
- Use matéria-prima pela mochila/barra, ou E com ela selecionada, para carregar uma máquina próxima. E na vazia guarda na mochila; trabalhando não pode ser recolhida; pronta entrega só o produto, mantendo a máquina instalada.
- Receitas:
  - 1 leite → 1 queijo; 1 leite de cabra → 1 queijo de cabra (1 dia).
  - 2 leites → 1 manteiga (meio dia).
  - 1 lã → 1 novelo; 2 novelos → 1 tecido (1 dia cada).
  - 2 trigos → 1 farinha; 2 milhos → 1 fubá; 2 aveias → 1 aveia em flocos (meio dia).
- Junior pediu **balão sobre a máquina com o item pronto**. Implementado no estilo da HUD: moldura marrom, fundo claro, ponteiro e sprite do produto. Fica até a coleta. Durante trabalho há duas poses mecânicas e barra discreta.
- `src/systems/machines.ts`:
  - `save.machines` opcional, com instâncias por ID, espaço (`property` / `farm:<id>`), posição e carga `{recipe,startedAt,readyAt}`.
  - Prazos usam relógio absoluto do jogo; viagens/sono/recarregamento não reiniciam nem duplicam. Não escreve/copía o save a cada quadro.
  - Instalação/carga/coleta/recolhimento são atômicos: salva antes de aplicar. Mochila cheia e falha de gravação preservam itens/cargas.
  - Colisão e proteção contra sobreposição, água, recursos, construções, plantações, atores e portas. Em interiores verifica circulação do piso; na Propriedade, corredores locais. A busca só roda ao instalar.
  - Validação de IDs, espaços, moradias, posições, sobreposição, receita e prazo. Saves antigos não recebem máquinas instaladas.
- Integração nas duas cenas, em `GameUI` (item ativo/ativação de ingredientes e máquinas), navegação dos NPCs, animais, cultivo, construção e crescimento de recursos. `MachineView` atualiza arte a 10 Hz, sem renderizar balões fora da câmera.
- Itens novos: cinco máquinas + queijo, queijo de cabra, manteiga, novelo, farinha, fubá e aveia em flocos. Tecido usa o item existente, com ícone novo; estoque e regras anteriores do tecido foram preservados.
- Helena compra queijo (40), queijo de cabra (52), manteiga (48), farinha (24), fubá (26), aveia em flocos (22); Celina compra novelo (54). Lojas não vendem esses **produtos novos**. Preços iniciais.
- Arte própria gerada por imagegen em `public/assets/visual/machines/`. Originais `source.png` e `products-source.png` preservados; `scripts/pack-machine-art.cjs` gera recortes/ícones sem reduzir os pixels. Hashes em `art.json`.
- **26 testes novos** em `tests/machines.test.ts` passaram: todas as receitas, prazos, circulação, ações, falha de save, estoque cheio, migração, serviços, moradias diferentes e rascunho antigo de Bento.
- **`scripts/qa-machines.cjs` passou no Chromium**: aprende cinco projetos, monta as máquinas, instala uma na Propriedade e quatro no curral, usa barra rápida, processa lã → novelos → tecido, leite → manteiga e trigo → farinha; confere balões corretos; queijeira termina enquanto está em outro cenário; recolhe máquina vazia e recarrega sem duplicação.
- Evidências portáteis em `docs/planejamento/qa-maquinas/`: balões, novelo pronto e `validacao.json`.
- Um teste inicial de navegador caiu por retornar o objeto Camera do Phaser em `page.evaluate`; corrigido para retornar void. O QA completo acima foi repetido e passou. Não era crash confirmado do jogo.

#### Animais e pedidos adicionais (`4178e7e`)

- Depois das máquinas, Junior pediu preparar sprites/animações dos outros animais. Confirmou incluir **porco, pato, abelhas, coelho e cervo**.
- Geradas artes próprias de todos, oito direções × (parado + quatro poses de movimento), com fontes preservadas em `public/assets/animals/<tipo>/source.png`, recortes/hashes em `atlas.json` e atlas compacto de **5 colunas × 8 linhas**, célula 224.
- `scripts/pack-next-animal-sprites.cjs` empacota sem reduzir pixels; aceita diretório raiz como argumento.
- `ANIMAL_ART` e `animalFrame` reconhecem atlas compactos. Escalas iniciais: porco `.28`, pato `.18`, coelho `.16`, cervo `.28`, abelha `.08`. Ainda falta comparação visual final no jogo/GIF.
- Coelho/cervo já entram nas cenas existentes através do controlador `AnimalWalkCycle`, sem mudar seus IDs salvos. Coelho dá pequenos saltos; cervo anda em quatro patas.
- Porco e abelhas **só preparados**, sem spawn/criação/produção. Não são carregados automaticamente, para evitar memória de texturas sem uso. `preloadAnimalSprites(scene, tipos)` permite carga explícita. `beeFlightFrame` fornece ciclo de asas independente dos passos.
- Pato foi ativado porque Junior pediu em seguida **entrar na água da Floresta Antiga, como habitat**:
  - `src/systems/forest-ducks.ts`: habitat em água e até uma faixa curta da margem, respeitando sólidos, busca de nascimento no lago.
  - `src/forest-waterfowl.ts`: dois patos ambientais perto do lago, animação compartilhada, pés recortados ao nadar, ondulações leves, sombra apenas em terra. `ForestScene` cria/atualiza/destrói junto ao ambiente.
  - São fauna ambiental separada de `AnimalPopulation`/`DOMESTIC_ANIMALS`: não há captura, alojamento ou ovo de pato nesta etapa. Posições não persistem ao sair da cena, como fauna ambiente.
- Junior também pediu manter distanciamento nos Campos Abertos e esclareceu: **afastar do jogador**, não distância entre animais.
  - `createFieldAnimalBrain` centraliza a criação com comportamento selvagem para todos os animais soltos. Raio da doma do cavalo continua ajustado pelo controlador existente: domado não foge.
  - Vacas deitadas consideram a aproximação no raio de detecção para levantar e fugir, em vez de esperar o jogador encostar.

## Em andamento e próximo passo exato

1. Gerar uma comparação ou GIF dos cinco animais novos (porco, pato, abelha, coelho e cervo) em escala real, com vaca, galinha e jogador como referência, incluindo o voo da abelha. As escalas iniciais estão em `ANIMAL_ART`; ainda falta a conferência visual.
2. Atualizar o plano geral (`docs/planejamento/ANIMAIS-E-RECEITAS.md`): as máquinas já têm implementação e QA; falta fechar a documentação.
3. Próxima etapa do plano: **cozinha** (fogão a lenha, receitas da Helena e caderno); depois a criação e a produção de porco, pato e abelhas. A arte deles existe, mas o sistema de criação não.
- Não publicar sem pedido do Junior. O pacote continua preview.34; tudo está no branch preview.35.

## Pendências e ideias para depois

- Após fechar máquinas e arte: cozinha (fogão/receitas/caderno), depois criação/produção de porco, pato e abelhas, conforme `docs/planejamento/ANIMAIS-E-RECEITAS.md`. Não confundir arte pronta com sistema de criação pronto.
- Produção por amizade/qualidade e preços finais ficam para depois. Estábulo/corda, montaria e calendário seguem planos anteriores.
- Há stash antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Interiores dos animais não persistem posição interna individual e ficam claros à noite.
- Travamentos nos Campos ainda precisam ser medidos no PC do Junior: otimizações anteriores estão em `f28f27c`, capim em `5424eee`; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- Galinheiro/curral/aprisco, ovos/leite/lã e tesoura estavam validados antes desta rodada (`e00c675`, `a13381b`, `011516c`). Ver `docs/construcoes/APRISCO.md` e evidências em `docs/planejamento/qa-aprisco/`.
- Arte definitiva dos interiores do SpriteCook deve permanecer em resolução original (`setScale`/`setDisplaySize`, piso `FLOOR_SCALE=2`); o Junior rejeitou redução dos PNGs. Fontes de novas artes desta rodada foram geradas por imagegen.

## Testes

- `npm run check`: ok.
- `npm test`: **2.015 passaram, zero falhas, 228 arquivos** (`ec3ec4f`).
- `npm run build`: ok (aviso de tamanho do pacote, que já existia).
- Chromium, nesta rodada:
  - `scripts/qa-forest-ducks.cjs`: OK.
  - `scripts/qa-fields-distance.cjs`: OK.
- Antes, com o Codex:
  - QA das máquinas (`scripts/qa-machines.cjs`) passou;
  - 26 testes de máquinas e 7 de arte dos animais novos.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`. Os scripts usam o Playwright instalado; `CHROMIUM_PATH` é opcional.
