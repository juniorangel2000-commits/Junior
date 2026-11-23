# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-23
- **Por:** Claude
- **Continuar a partir de:** `release/v0.10.0-preview.48` (ainda não publicada).
- **Última versão publicada:** `v0.10.0-preview.47`. A Release da preview.47 é criada pelo Junior (tag `v0.10.0-preview.47` no branch `release/v0.10.0-preview.47`).
- **Atenção ao publicar:** além de `NOTAS-<versão>.md`, crie `docs/cenarios/LEIA-<versão>.md`. O processo do Windows copia esse arquivo para a Release e falha se ele não existir.
- **Estado:** a preview.48 tem mina corrigida, vigor, chuva regando a horta, animais soltos com sorteio diário em todos os cenários externos, só com a corda, e HUD novo de vida e vigor. Tudo testado; falta publicar quando o Junior pedir.

## Feito nesta rodada (preview.48)

- **Mina** (pedido: "a colisão está bugada, a animação de mineração só aparece olhando pra cima, a iluminação está estranha").
  - **Animação:** a direção era calculada do pé do personagem até o centro da rocha; qualquer rocha um pouco acima virava "cima-esquerda" e mostrava o personagem de costas. Agora `workDirection` (em `character-directions.ts`) escolhe o eixo dominante. Vale também para machado, foice e picareta na Floresta, na Propriedade e nos Campos.
  - **Iluminação:** a sombra era redesenhada 10×/s e ficava atrasada (faixa clara na borda ao andar). Agora `UndergroundLighting` redesenha quando a câmera ou o jogador se movem, com margem de 48 px, e guarda os polígonos dos lampiões fixos. A rocha maciça usa a textura da pedra escurecida (`MINE_SOLID_ROCK_TILE`) em vez de quadrados pretos.
  - **Escuro de verdade** (pedido do Junior): `MINE_HAZARDS.darkness` tem `radius` (sem lampião) e `lanternRadius`. Nas galerias profundas, sem lampião, a visão é ~1,5 bloco (alpha 0,95–0,985). As rasas e intermediárias continuam abaixo do limite do Bento (0,64).
  - **Colisão:** comparada ponto a ponto com o desenho (galeria e salão de entrada) e bateu em todos os lugares testados. Falta o Junior dizer onde viu o problema.
- **Vigor:** `spendDurability` gasta 1 de vigor por golpe (`TOOL_VIGOR_COST`); o regador gasta 1 a cada 2 regas. Dormir na cama recupera todo o vigor (antes só a pousada recuperava). Com vigor zero, anda a 70% (`EXHAUSTED_SPEED`).
- **Chuva:** dia de chuva conta como regado (`advanceCrop`) e os canteiros aparecem regados; aviso ao acordar. Testes de crescimento em dias secos fixam o tempo aberto com `vi.mock` do `weather-model`.
- **Animais só com a corda e sorteio diário:** a Rosa não vende mais galinha, pato nem porco. `src/data/wild-animals.ts` tem as listas por tipo e os pontos de cada cenário; `wildSpawns(área, dia, já_levados)` (`src/systems/wild-spawns.ts`) sorteia, sem guardar nada no save, quem aparece e onde.
  - **Bosque:** galinhas, cabras e porcos (coelho e cervo continuam fixos). Corda com E, como antes.
  - **Campos:** vacas, ovelhas e patos na beira do rio. Corda com E e G para soltar, como no Bosque (`startFieldEscort`), atravessando para a propriedade como o cavalo (`transferFieldEscortToProperty`). O cavalo continua sempre nos Campos, com a doma; também usa E para prender e G para soltar (sem estábulo ou corda, E faz carinho e diz o que falta).
  - Ids antigos (`forest-*`, `farm-duck-*`, `farm-pig-*`) entraram nas listas, então saves antigos continuam válidos. As vacas e galinhas de enfeite dos Campos saíram (`FIELDS_RETIRED_ANIMALS` ainda aceitos no save).
  - **Pântano:** patos na beira das lagoas e porcos. **Costa:** cabras, galinhas e patos na beira do rio. `TrailScene` cria a `AnimalPopulation` nesses dois; ao sair, `transferTrailEscort` passa o animal para o Bosque (Pântano) ou para os Campos (Costa), e de lá segue para a propriedade. Posições guardadas em `animalPositions.swamp/coast` (opcionais). Pontos escolhidos no jogo com o bloqueio real de cada mapa.
  - **Pomar:** galinhas e porcos. **Ruínas e Estação:** cabras e galinhas. Caminhos em `ROPE_HOME_PATH` (`src/data/wild-animals.ts`): Pomar→Vila→propriedade; Ruínas→Floresta da Cidade→Vila→propriedade; Estação→Ruínas→… . Floresta da Cidade e Vila usam `RopeTransit` (`src/rope-transit.ts`): mostram o animal na corda e só deixam passar rumo à propriedade (lojas, casas, lago, Pomar e Ruínas avisam). `transferEscortTo` move o animal entre cenários; o save valida com `ropeAllowed` (e aceita os antigos do Bosque, `ropeHere`).
  - **Soltar longe de casa (G):** o animal corre (`AnimalBrain.sprint`) até a passagem que leva de volta à origem e some (`runHome` em `AnimalPopulation`, `RopeTransit` e no mundo dos Campos). Volta ao sorteio do cenário dele.
- **Pássaros** (sabiá e saíra) diminuíram de 30 para 17 px, menores que o coelho.
- **HUD:** painel do relógio só com dia, hora e dinheiro. Vida (coração) e vigor (raio) em barras verticais empilhadas no centro da direita, na moldura de madeira dos painéis; fora da mina a vida fica cheia.

## Rodadas anteriores (resumo)

- **Um ano jogado e economia rebalanceada** (pedido do Junior). Relatório: [docs/economia/RELATORIO-ANO-1.md](economia/RELATORIO-ANO-1.md).
  - **Simulações:** `scripts/economia/ano.test.ts` e `scripts/economia/jogador.test.ts`. Rodam só com `ECONOMIA=1 npx vitest run scripts/economia` e reescrevem os `.md` de `docs/economia`.
  - **Mudanças:**
    - rebrota de feijão, tomate e hortelã passou para 4 dias, com sementes mais caras;
    - ovo, leite e lã subiram, e os produtos de máquina também;
    - os pratos foram recalculados pela regra de `tests/prices-balance.test.ts`;
    - o peixe comum caiu para 12 C (`FISH_PRICE`), e o raro subiu para 70 C;
    - o Pomar ficou sazonal (`ORCHARD_FRUIT_SEASONS`);
    - os concursos da Feira e da Colheita foram corrigidos.
  - **No navegador:** foram 113 noites com horta, saves e recarga em cada virada de estação, até o Ano 2, sem erros.
  - As mudanças estão na preview.47, cuja Release o Junior ainda não tinha criado, e as notas já incluem o balanço.

- **Arte dos festivais** (do Junior, recortada do fundo magenta), em `public/assets/visual/festivals` e com as fontes em `referencias/cenarios/festivais`:
  - nove barracas, três por festival da praça;
  - fogueira animada da praia, com caixote de conchas e cesto;
  - postes com flâmulas da estação;
  - lanternas de papel e de metal acesas na Noite das Lanternas.

  `loadFestivalArt` carrega tudo só no dia da festa. O carregamento paralelo de moradores e da arte foi corrigido: cada item só fica pronto quando o próprio arquivo chegou.
- **Validação da fauna** pedida pelo Codex: no Chromium, caranguejo, gaivota, tartaruga, esquilo, ouriço, garça e morcego reagiram certo, sem erros. Ainda falta conferir lagartixa, coruja, pombo, rato, borboleta, perdiz e raposa, porque a segunda leva não rodou por erro do script de teste.

- **Festivais da vila** (`src/systems/festivals.ts`, `src/festival-decor.ts`), um por estação:

  | Festival | Data e local | Anfitrião e concurso |
  | --- | --- | --- |
  | Feira das Sementes | Primavera 14, praça, 10h–18h | Rosa, concurso de flores (girassol, camomila ou íris) |
  | Festa da Praia | Verão 14, Costa das Marés, 15h–21h | Damião, 3 caranguejos, com fogueira e a vila em roda (`BEACH_FIRE`, `BEACH_RING` em `npc-outings.ts`) |
  | Festa da Colheita | Outono 21, praça, 10h–19h | Augusto, 5 de uma colheita |
  | Noite das Lanternas | Inverno 21, praça, 17h–23h | Helena, troca de presentes com 1 prato; +1 de amizade com todos |

  - As lojas param, e até quem está de folga vai à festa. Na vila, os moradores ficam no período de intervalo e se juntam na praça.
  - O concurso aparece na conversa com o anfitrião, uma vez por ano (`festivalDone` no save, campo opcional e validado).
  - A praça ganha bandeirinhas, barracas e lanternas, ainda provisórias.
  - A HUD mostra o festival do dia ao lado do ano. Passando o mouse na data, aparece o próximo festival.
  - Foram conferidas no Chromium a Feira (prêmio de 200 coroas) e a Festa da Praia (prêmio de 300).

- **Atividades nos cenários novos** (preview.47, em desenvolvimento):
  - **Costa:** 12 conchas na areia (`src/systems/forage.ts`) voltam em 2 dias, e a Celina compra. Com a rede na mochila, dá para pegar caranguejo: ele só se assusta bem de perto (`fleeScale`), foge devagar e o alcance é de 150 px. O Damião compra.
  - **Pântano:** as três íris azuis podem ser colhidas e voltam em 7 dias.
  - **Cozinha:** suco de laranja, doce de pera, torta de maçã (no forno) e caranguejada, ensinados pela Helena e vendidos na pousada.
  - **Histórias:** Amélia ("A íris da vó Dita") e Nilo ("A marca das três pontas", com o cofre da bilheteria da Estação). Agora os dez moradores têm história.
  - **Ícones provisórios:** concha, íris e caranguejo vêm das artes do jogo ou do desenho dos bichos. Os pratos novos são pratos existentes com a cor trocada.
  - **Save:** ganhou `forageHarvest`, campo opcional e validado. Os itens novos entram em saves antigos pela migração da mochila.

- **Fauna dos cenários** (`e902bff`, `f3e4935`): 14 espécies com repouso, caminhada, corrida, voo e ações próprias por espécie. A Costa tem caranguejo, gaivota e tartaruga marinha. O Pomar tem esquilo e ouriço. O Pântano tem garça. As Ruínas têm morcego, lagartixa e coruja. A Estação tem pombo e rato. Os Campos têm borboleta, perdiz e raposa.
  - A folha `public/assets/visual/nature/critters.png` usa células de 64 × 64 e cinco poses por vista. Cada linha guarda o perfil direito, a frente e as costas. O jogo espelha o perfil para a esquerda e escolhe uma das quatro direções pelo deslocamento. As quatro cores da borboleta ficam em linhas próprias.
  - As fontes estão em `referencias/animais/fauna-do-vale/`. Os arquivos em `direcoes/` guardam frente na primeira linha e costas na segunda.
  - `CritterField` usa os quadros de voo quando a ave levanta, de corrida ao fugir, de piscada quando a coruja está em repouso e de bola quando o ouriço se protege. O caranguejo abaixa perto da água e continua capturável com rede.
  - Os pássaros ambientes ganharam duas variantes, sabiá e saíra, com pouso, bicada e voo (`3cc4c48`, `public/assets/visual/nature/ambient-birds.png`). As abelhas usam a animação por código, conforme solicitado.

- **Moradores nos cenários novos** (`src/systems/npc-outings.ts`, `src/npc-outing-visit.ts`):
  - Rosa vai ao Pomar, Amélia ao Pântano, Nilo às Ruínas e Ícaro à Estação, na plataforma. Damião (à tarde, depois do lago) e Celina vão à Costa. Tobias vai aos Campos, perto dos ipês.
  - Cada um sai 2 dias por semana, fora da folga e sem chuva, e fica no ponto dele trabalhando. Quando o jogador chega perto, vira para ele.
  - A conversa usa o painel da vila: amizade, presentes, história e uma fala do lugar. O presente do dia dá +1 de amizade, e o save guarda `npcOutingGifts`, campo opcional e validado.
  - Na vila, a loja fica fechada nesse horário, e a placa e a janela do morador dizem onde ele está e quando volta.
  - Os testes de rotina da vila passaram a usar um dia sem saídas (`tests/helpers/quiet-day.ts`).

- **Pomar Abandonado** (Codex: `19bcf29`, `84d8360`; Claude terminou):
  - **Onde fica:** a leste da Vila. A saída é a borda leste da Vila em (94, 62), e a chegada é a borda oeste do Pomar em (1, 56). No vale, o Pomar fica em (6144, 192), logo abaixo das Ruínas.
  - **O que tem:** trilhas de terra, macieiras, pereiras, laranjeiras e frutíferas secas, prensa antiga, galpão, lagoa de irrigação e caixotes (`src/data/orchard.ts`, `src/orchard-world.ts`).
  - **Frutas:** caídas no chão, recolhidas com E. Voltam em 3 dias (`orchardHarvest` no save) e Rosa compra na Vila.
  - **F2 e divisas:** o Pomar funciona no F2, e as divisas com a Vila e as Ruínas usam o chão compartilhado.
  - **Acabamento do Claude:**
    - as frutas caídas ficaram menores, a pedido do Junior (de 17 para 13 px);
    - perto da saída leste da Vila, a dica mostra "Pomar Abandonado ao leste";
    - Organizar a mochila agora põe maçã, pera e laranja em comida;
    - o Pomar entrou no mapa do vale.

- **Mapa do vale** ([documento](cenarios/MAPA-DO-VALE.md)): todos os mapas externos montados na posição em que as saídas se encontram.
  - A posição de cada mapa e as divisas estão em `src/data/valley-seams.ts` (`VALLEY_LAYOUT`, `VALLEY_SEAMS`).
  - A imagem é gerada com o `captureMap()` de cada cena e 160 px de margem, para as copas da borda cruzarem a divisa.
- **Campos alinhados à Propriedade** (`fa38fbb`): a chegada norte fica em x=816, a mesma coluna da saída sul da Propriedade.
  - O rio entra com a posição e a largura do rio da Propriedade, e a ponte norte fica na trilha principal.
  - A geração antiga (`ORIGINAL_TRAILS`, `ORIGINAL_ENTRY_X`) mantém ids e posições dos saves. O que caiu no rio ou nas trilhas novas está em `FIELDS_RETIRED_PATCHES`, e `migrateSave` apaga só esses cortes.
  - `fieldsPlayerSafe` aceita a posição salva nadando.
- **Pântano só com lagos** (`d699f06`, a pedido do Junior):
  - O canal virou a lagoa da passarela, e há uma lagoa nova ao sul. Nenhuma água encosta nas bordas.
  - O jacaré `swamp-caiman-49-29` passou para (49, 45).
  - Edições F2 antigas que apontem para esse id ou para nenúfares do canal deixam de aparecer, sem invalidar o save.
- **Chão compartilhado nas divisas** (`dee10f8`):
  - **Por quê:** o Junior comparou com a divisa Floresta ↔ Propriedade ("parecem continuação") e achou as outras "cortadas". O degradê de cor de `d699f06` saiu.
  - **Como:** `drawValleySeams(scene, área, água)` aplica a técnica de `map-seam-ground` em todas as divisas. Numa faixa de 256 px, o chão vira uma mistura das texturas de floresta, grama, prado e musgo em coordenadas do vale, idêntica dos dois lados da linha. Perto do Pântano, a paleta `marsh` puxa para musgo e lama.
  - **Ficam de fora:** a água de cada mapa e os trechos `open`, onde trilha, estrada ou rio atravessam.
  - **Camada:** a faixa fica em −89, acima do terreno pintado no F2 (−90) e abaixo de objetos e personagens. No Platô, fica em −69.
- **Do Codex, em paralelo** (`626c962`, `944dd23`, `35c0f88`, `67508cb`, juntados em `d8d4e2d`, `a0d8498` e `7f72c4b`):
  - A linha principal da Estação curva para o sul e termina entre as árvores. Lastro e trilhos usam a mesma geometria em `src/data/railway.ts` e `src/railway-world.ts`, e a travessia, a plataforma e a estrada para as Ruínas continuam acessíveis.
  - A foz da Costa foi arredondada (`src/data/coast.ts`). Na divisa com os Campos, o rio continua em x≈461–571, contra 459–570 nos Campos, dentro do trecho aberto da divisa.
  - Os Campos ganharam pesca no rio, com vara ou rede, seguindo a exigência de isca do Damião. A Costa usa a pesca compartilhada de praias e rios, e os peixes raros continuam exclusivos do lago.
  - A arte panorâmica, o atlas com Mina, Galerias, dungeons e interiores, e os detalhes do píer e da Estação ficam em `/workspace/afterrain-costa/`, na máquina do Codex.

## Em andamento e próximo passo exato

- Perguntar ao Junior onde a colisão da mina falha.
- O painel de Companheiros encosta no topo das barras de vida/vigor em telas de 800 px de altura (as barras não capturam cliques).
- Publicar a preview.48 quando pedido (notas e LEIA).

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md).
- Peixes por estação e tela do calendário ficam depois dos cenários.
- Arte nova do chiqueiro e possível versão para iPhone seguem em planejamento.

## Problemas conhecidos

- O desempenho dos Campos Abertos ainda precisa de medição com F3 no PC do Junior. No Chromium de teste, com SwiftShader, os Campos rodam a cerca de 11 FPS.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem uma falha antiga na dica da porta.
- Preserve as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- preview.48: `npm run check` passou e `npm test` passou com 2.279 testes (2 pulados). Depois dos animais: 2.292 testes. No Chromium: mineração nas quatro direções, escuridão com e sem lampião, barras do HUD, sorteio do Bosque em dois dias, vaca levada dos Campos à propriedade com a corda; pato do Pântano pelo Bosque e cabra da Costa pelos Campos até a propriedade; cabra da Estação pelas Ruínas, Floresta da Cidade e Vila até a propriedade; galinha do Pomar solta na Vila e cabra da Costa solta nos Campos correram de volta e sumiram.

- Na preview.47 integrada, `npm run check` passou e `npm test` passou com 2.271 testes em 275 arquivos.
- `tests/critters.test.ts` confere os quadros com margens transparentes, os horários de aparecimento, a direção e o lugar de cada espécie no mapa. `tests/ambient-birds.test.ts` confere a folha de poses e os pousos e voos dos bandos.
- Saídas dos moradores: 2.258 testes. No Chromium, os sete moradores foram encontrados no cenário, conversaram e deram o presente, sem erros de página.
- Final, com o Pomar: `npm run check` passou e `npm test` passou com 2.254 testes em 271 arquivos.
- No Chromium, com o Pomar:
  - Vila → Pomar, com chegada em (4,5; 56,5);
  - a fruta foi recolhida com E, e a segunda tentativa foi recusada;
  - o save no Pomar foi recarregado e voltou dentro dele;
  - a volta chegou na saída leste da Vila;
  - zero erros de página.
- `tests/valley-seams.test.ts` confere:
  - que cada divisa fica na borda comum dos dois mapas;
  - que a mistura é inteira junto à linha e zero nas trilhas e rios;
  - que o Pântano não tem água nas bordas.
- `tests/coast.test.ts` e `tests/open-fields.test.ts` conferem a chegada alinhada, a continuidade do rio na borda, as pontes e a migração dos cortes. O teste de geometria da Estação confere a curva.
- No Chromium foram conferidos:
  - Propriedade → Campos, com chegada em (816, 140), a ponte norte atravessada a pé e a volta;
  - Campos ↔ Costa e a retomada na Costa;
  - a foz revisada, nas capturas do Codex;
  - zero erros de página.
