# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD. Abelhas em `61fbd2e`/`becdb22`; patos em `5ee1bb4`; porcos em `a3eb5c8`.
- **Última versão publicada:** `v0.10.0-preview.34`, https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** casa do jogador com móveis, fogão, paredes e piso no mesmo conjunto rústico. Cozinha, máquinas, patos e distanciamento permanecem integrados. Nada publicado; `main`, tags e versão do pacote continuam na preview.34.

## Feito nesta rodada

### Porcos, chiqueiro e composteira (Claude Code)

- A etapa 6 do plano está completa; detalhes em `docs/construcoes/ABELHAS-E-PATOS.md`.
- **Construção:** `pigsty` (Chiqueiro) com interior; nos estágios de obra usa a arte do galinheiro (`farm-construction-view.ts`).
- **Cocho:** aceita `PIG_FOOD` (legumes, frutas e grãos).
- **Esterco:** fica em `site.manure`, com quatro lugares no chão, e é recolhido com `collectManure`.
- **Composteira:** máquina `composter` com `extra` nas receitas (capim ou fibras); `loadMachine` escolhe a receita conforme a mochila.
- **Porco:** saiu de `PREPARED_ANIMAL_KINDS`, então agora é carregado em todos os cenários.
- **SpriteCook sem créditos (0).** O chiqueiro e a composteira usaram os últimos 4. Arte nova daqui em diante fica com o Codex (imagegen) ou com uma recarga.


### Abelhas e patos da criação (Claude Code)

- Tudo detalhado em **`docs/construcoes/ABELHAS-E-PATOS.md`**.
- **Abelhas** (`src/systems/beekeeping.ts`):
  - colmeia vazia comprada com o Augusto e colocada junto a um ipê dos Campos;
  - enxame com 40% de chance a cada 5 dias, pelo calendário;
  - a colmeia povoada vira a máquina `beehive` na Propriedade: mel a cada 4 dias, cera a cada 3 coletas, pausa no Inverno e mel de flor com margaridas ou girassóis maduros por perto.
  - A dica da colmeia passou a ter prioridade sobre a do ipê, como o E.
- **Patos** (`FARM_DUCKS` em `src/data/domestic-animals.ts`):
  - a Rosa vende; o pato mora no galinheiro;
  - ovo de pato a cada 2 manhãs alimentado (`site.duckEggs`);
  - pena a cada 4 ovos recolhidos.
- **Cozinha:** mel e ovo de pato agora têm fonte, então nenhuma receita fica travada (`FUTURE_INGREDIENTS` está vazio).
- **Máquinas:** `CRAFTED_MACHINE_IDS` separa as máquinas que se aprendem e se montam. A colmeia não entra.
- **SpriteCook: restam só 4 créditos.**


### Cozinha, etapa 2 (Claude Code)

- Decisões do Junior: pães e bolos passam ao forno; os quatro efeitos do plano; receitas escondidas na Mina, com os sobreviventes e no mapa antigo. Tudo detalhado em **`docs/construcoes/COZINHA.md`**.
- **Forno de barro:**
  - máquina `clayOven` do sistema do Codex, projeto da Helena, só na Propriedade;
  - E no forno vazio abre o caderno (aba do forno); a fornada leva meio dia;
  - as receitas do forno entram em `MACHINE_RECIPES` com `ingredients` e não carregam pelo item solto;
  - funções `nearEmptyOven` e `loadOven` em `src/systems/machines.ts`;
  - folha de sprites `public/assets/visual/machines/clayOven.png` (parado, aceso e aceso mais forte), registrada em `art.json` com `cuts: []`.
- **Fogueira portátil:**
  - item `campfire`, montado sem bancada;
  - tratada em `main.ts` (`onUseItem`) com `cookInScene`, que cozinha no estado do cenário, sincroniza a mochila própria do Vale e da Vila (`syncInventory`) e salva por `persist()`, desfazendo tudo se falhar.
- **Efeitos** (`src/systems/food-effects.ts`, `save.foodEffect`):
  - café reforçado: +30 de vigor extra (`spendVigor`, usado na pesca e no combate);
  - peixe assado: `bandBonus` na pesca;
  - feijão tropeiro: `UndergroundHazards.damageScale`;
  - suco de melancia: `playerSpeedFactor` em todos os cenários.
- **Adaptações:** a Mina não gasta vigor, então o tropeiro reduz dano. O vigor continua com limite 100 no save, então o café dá vigor extra temporário.
- **Prato do dia:** serviço `dish-of-day` da Helena; paga o dobro, uma vez por dia (`save.kitchen`).
- **Receitas escondidas** (`discoverDishAndSave`), que aparecem como "???" no caderno:
  - Mineração: caldo do mineiro, na primeira expedição;
  - acampamento amigável: ensopado de peixe;
  - mapa antigo: bolo de mel.
- **Café da manhã reforçado** entrou na lista da Helena, depois do pão caseiro. A Helena agora tem 15 receitas.
- **Arte do SpriteCook:** forno parado e aceso, fogueira e 7 pratos. **Restam cerca de 64 créditos.**
- **Correção durante o QA:**
  - O `canPlay()` do Vale recusa ações com modal aberto, então a fornada fecha o caderno antes de carregar o forno.
  - O `syncInventory` do Vale não tinha sido inserido na primeira tentativa; foi corrigido.


### Nova arrumação da casa (Claude Code, pedidos do Junior)

- Arrumação inicial (`createDefaultHome`):
  - cama centrada sob a janela esquerda (2,2);
  - fogão centrado na parede do fundo (5,2);
  - **estante baixa nova** centrada sob a janela direita (8,2);
  - mesa (8,4) com **duas cadeiras** (7,4) e (10,4);
  - tapete (2,5) e vaso (1,7);
  - regador e sementes lado a lado no canto inferior direito, em (8,7) e (9,7) (`HOME_SUPPLIES`).
- **Fogão:** passou a ocupar 2×1 (só a fileira encostada na parede) e é desenhado 12 px acima, com o corpo no rodapé e a chaminé subindo pela parede. A **cama** também subiu 14 px, com a cabeceira no rodapé. A colisão não mudou.
- **Janelas:** foram deslocadas 13 px para dentro na arte da parede (`shiftWallPanel` em `src/home-room-art.ts`), para ficarem centradas sobre a grade (x=96 e x=288). Vale para os três rebocos e os três pisos.
- **Estante baixa:** gerada no SpriteCook com a casa rústica como guia de estilo, em `public/assets/visual/home-furniture/spritecook/shelf.png`, na resolução original. A estante do Codex (`shelf.png`) continua no repositório, sem uso. Restam cerca de 196 créditos no SpriteCook.
- **Migração** (`src/systems/save.ts`):
  - Casas ainda na arrumação inicial antiga (`legacyDefaultHome`, da preview.34) recebem a arrumação nova inteira, mantendo piso e paredes, se o save inteiro continuar válido. Isso inclui as variações da preview.35: com o fogão em (4,2) ou a estante em (9,7). Ver `untouchedLegacyLayout`.
  - Se alguém estiver parado no lugar de um móvel novo, a casa fica como estava e só ganha o fogão num lugar livre.
  - A regra do Codex que tirava a estante de (8,2) saiu: a estante agora é baixa e cabe sob a janela.
  - Casas reorganizadas pelo editor não mudam.
- **Testes:**
  - `tests/home-layout-migration.test.ts` foi reescrito para a regra nova.
  - Os testes do editor (`tests/home.test.ts`) usam a casa antiga explícita (`legacyDefaultHome`), porque testam o editor e não a arrumação.
  - `tests/mine-rescue.test.ts` move a cama para (5,5), porque (6,2) agora é o fogão.
- Captura: `docs/planejamento/qa-moveis/casa-arrumacao-nova.png`.


### Casa do jogador — conjunto rústico (Codex)

- Pedido atual: refazer os móveis; depois o Junior pediu fogão combinando e embutido junto à parede, proporções padronizadas, piso e paredes combinando, janelas livres exceto a cama e cadeira menor.
- Artes próprias geradas por imagegen: cama, mesa, cadeira, estante, tapete, vaso, fogão e sala vazia. Fontes originais preservadas em `public/assets/visual/home-furniture/`, com hashes e recortes em `art.json`. `scripts/pack-home-furniture.cjs` empacota sem reduzir PNGs; o Phaser dimensiona a exibição.
- `src/home-art.ts`: imagens no lugar dos móveis procedurais, escala uniforme (sem esticar), base inferior centralizada e profundidade existente. Cadeira limitada a 42 px de altura. Fogão de 64 px de largura, recuado 12 px para encaixar a traseira no rodapé, entre as janelas. Fonte antiga do fogão preservada em `visual/kitchen`, sem uso em jogo.
- `src/home-room-art.ts`: piso de tábuas e parede com reboco, vigas, duas janelas, quadro e luminária do mesmo estilo. Parede termina em y=64; piso x=32..352 e y=64..288; porta sul x=160..224. Abertura desenhada corresponde à circulação real. Luz da luminária ajustada ao novo lugar.
- As nove combinações de acabamento continuam disponíveis: madeira clara/escura/pedra e creme/sálvia/argila. Escuro usa tingimento da madeira; reboco é tingido preservando detalhes; pedra usa a textura anterior entre as vigas novas. Texturas são montadas uma vez, sem trabalho por quadro.
- Estante padrão mudou de (8,2), na frente da janela, para (9,7), na lateral inferior direita. A cama é o único móvel sob uma janela.
- Compatibilidade: `migrateSave` reposiciona somente a estante original ainda em (8,2), testando casa e save inteiros. Se o destino tiver jogador/obstáculo, tenta (8,6) e (1,7). Se nada couber, preserva o save. Móveis já reorganizados são mantidos. Casa implícita antiga é recuperada quando a nova base da estante coincidir com jogador salvo. Quatro testes cobrem isso, incluindo idempotência e entrada não modificada.
- Editor H, cama, fogão, colisões e IDs das peças continuam funcionando. `tests/home.test.ts` usa um espaço livre novo para testar reposicionamento/limite, e `tests/home-save.test.ts` instala sua cadeira de teste fora da nova estante. As verificações de acesso e persistência foram mantidas.
- `scripts/qa-home-furniture.cjs` passou no Chromium: sete artes, proporções, cadeira menor, estante, troca de acabamentos via editor, mover vaso, colisão anterior/nova, acesso à cama e saída, persistência ao sair/voltar, sem erros JS. Evidências em `docs/planejamento/qa-moveis/`.
- `scripts/qa-kitchen.cjs` repetido com a casa final: caderno abre, omelete preparada e salva, salada indisponível sem cenoura, consumo recupera vigor de 20 a 60. Capturas desta repetição em `/tmp/qa-cozinha-final`; o QA anterior está no repositório.
- Houve tentativas de QA interrompidas por reload do Vite durante os ajustes; a conferência final acima foi repetida com as fontes estáveis.
- Integrei por merge os commits do Claude `3821c62` e `2bf19ec` que chegaram durante a rodada, preservando a semente nova no chão da casa e a documentação da cozinha.


### Cozinha, etapa 1 (Claude Code, `5ef5287`, `c377838`, `b7d816d`)

- Decisões do Junior:
  - o **fogão a lenha já vem na casa**;
  - a arte que faltava é gerada no SpriteCook.
- Detalhes, tabela de receitas e preços em **`docs/construcoes/COZINHA.md`**.
- **Fogão:** móvel `woodStove` (2×2, um por casa) na casa padrão em (4,2). Pode ser movido pelo editor (H).
  - Saves anteriores recebem o fogão no primeiro lugar livre. Cada lugar é testado com o save inteiro, para não cair sobre o jogador que salvou dentro de casa.
  - Um save sem `home`, salvo onde o fogão fica, ganha a casa antiga explícita antes da migração.
- **Helena** ensina 14 receitas, **uma por vez**, no serviço `learn-dish`. O rótulo mostra a próxima receita e o preço (20–50 C).
- **E no fogão** abre o caderno (`src/cookbook-ui.ts`): receitas aprendidas e ingredientes, com o que falta. Cozinhar gasta os ingredientes e 1 madeira, e salva antes de aplicar.
- **Pratos:** recuperam vigor pela mochila ou pela barra (`useConsumable`) e a Helena os compra. Nenhuma loja vende.
- **Mel** (`honey`) e **ovo de pato** (`duckEgg`) já existem como itens com arte, mas sem fonte. O caderno avisa "mel chega com as abelhas" e "ovo de pato chega com a criação de patos".
- **Arte do SpriteCook** em `public/assets/visual/kitchen/`, com ids em `spritecook-assets.json`:
  - fogão, guiado por uma captura da casa;
  - 14 pratos, mel e ovo de pato, guiados pelos ícones de ovo e leite.
  - O Junior apontou que o pote de mel estava fechado com a colher atravessando a tampa. Mel e doce de leite foram refeitos com o pote aberto.
- **SpriteCook:** sobram cerca de 230 créditos.

### Sementes na casa do início

- O pacote de 7 sementes no chão da casa usava o ícone antigo `icons/seeds.png`, uma moita com flores brancas. Agora usa a semente de nabo nova (`crops/turnip/seed.png`, textura `home-seed-packet`), a mesma da mochila.
- Captura em `docs/planejamento/qa-cozinha/casa-inicio-sementes.png`.

### Comparação de escala dos animais novos (`09d3bda`)

- `scripts/capture-new-animals.cjs` monta, na Propriedade e no zoom normal, a fileira: jogador, galinha, pato, coelho, abelha, porco, ovelha, cabra, vaca, cervo e cavalo.
- Gera `escala-parados.png`, `escala-andando.gif` e `tamanhos.json` em `docs/planejamento/qa-animais-novos/`. Os quadros soltos ficam fora do repositório.
- As escalas ficaram coerentes; nenhuma foi alterada.
- `docs/construcoes/MAQUINAS.md` criado, e o andamento do plano foi atualizado (`b9b30fa`).

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
- `ANIMAL_ART` e `animalFrame` reconhecem atlas compactos. Escalas iniciais: porco `.28`, pato `.18`, coelho `.16`, cervo `.28`, abelha `.08`. Comparação visual concluída pelo Claude em `09d3bda`, em `docs/planejamento/qa-animais-novos/`.
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

1. Próxima etapa do plano (7): **barril de conservas** (geleias de morango e melancia, com mel) e **prensa de cera** (cera vira vela), mais o equilíbrio de preços. A arte dessas duas máquinas ainda não existe.
2. Qualidade dos produtos e pratos (cozinha, etapa 3).
3. Não conferido no navegador: a composteira (coberta por teste unitário) e o mel de flor.
- Não publicar sem pedido do Junior. O pacote continua preview.34; tudo está no branch preview.35.

## Pendências e ideias para depois

- Cozinha etapa 1 concluída; continuar etapa 2 e depois criação/produção de porco, pato e abelhas, conforme `docs/planejamento/ANIMAIS-E-RECEITAS.md`. Não confundir arte pronta com sistema de criação pronto.
- Produção por amizade/qualidade e preços finais ficam para depois. Estábulo/corda, montaria e calendário seguem planos anteriores.
- Há stash antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Interiores dos animais não persistem posição interna individual e ficam claros à noite.
- Travamentos nos Campos ainda precisam ser medidos no PC do Junior: otimizações anteriores estão em `f28f27c`, capim em `5424eee`; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- Galinheiro/curral/aprisco, ovos/leite/lã e tesoura estavam validados antes desta rodada (`e00c675`, `a13381b`, `011516c`). Ver `docs/construcoes/APRISCO.md` e evidências em `docs/planejamento/qa-aprisco/`.
- Arte definitiva dos interiores do SpriteCook deve permanecer em resolução original (`setScale`/`setDisplaySize`, piso `FLOOR_SCALE=2`); o Junior rejeitou redução dos PNGs. Fontes de novas artes desta rodada foram geradas por imagegen.

## Testes

- `npm run check`: ok.
- `npm test`: **2.073 passaram, zero falhas, 234 arquivos**. Novo: `tests/pigs.test.ts` (5).
- `npm run build`: não repetido desde a rodada do Codex.
- Chromium, nesta rodada:
  - `scripts/qa-pigs.cjs`: OK. O chiqueiro aparece na Propriedade, num lugar escolhido pela mesma regra de colocação do jogo. O porco aparece dentro à noite, o cocho recebe 6 sobras, e de manhã aparece esterco, que é recolhido.
  - `scripts/qa-beekeeping.cjs` e `scripts/qa-ducks.cjs`: OK.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
