# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-22
- **Por:** Claude
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** o rio da Propriedade agora corta os Campos Abertos de norte a sul, com duas pontes iguais às da propriedade, e deságua no mar da Costa das Marés. A Costa fica ao sul dos Campos e não tem mais estrada, trilho nem ligação com a Estação. A preview.45 segue em desenvolvimento e também traz a Estação, as Ruínas, o Pântano, a mochila reformulada, a barra rápida maior e a compressão WebP.

## Feito nesta rodada

- **O Junior recusou a Costa ligada à Estação** (`294c6c0`, do Codex): "quero a costa ligada pra baixo dos campos, onde os rios da propriedade seguem para os campos e depois desaguam no mar da costa, sem trilho, sem ligação com a estação" e "deixa pontes iguais as da propriedade no rio que vai cortar os campos". As artes, o editor F2 e o save da Costa feitos pelo Codex foram mantidos. Mudou a geografia e a ligação.
- **`4744354` (rio nos Campos).** O rio desce de `x≈1180` no topo até `x≈516` no rodapé, com 50 a 64 px de meia-largura (`FIELDS_RIVER`, `fieldsWater` e `fieldsRiverEdge` em `src/data/open-fields.ts`). A água bloqueia animais, construções e pets. O jogador nada, como na propriedade.
  - `fieldsSolid` reúne só os obstáculos sólidos, usados pelo jogador. `fieldsBlocked` é sólido ou água.
  - O chão ganhou margem molhada e acabamento de água (`src/open-fields-ground.ts`), e `addWaterMotion` anima a correnteza.
- **Pontes dos Campos.** `FIELDS_BRIDGES` em `src/data/bridges.ts`: norte em `x=30–36, y=15–16` e sul em `x=13–19, y=54–55`.
  - O desenho é o mesmo das pontes da propriedade: `drawPropertyBridges` virou o caso particular de `drawBridges(scene, bridges)`.
  - Só se entra pelas cabeceiras (`mapBridgeAllowsStep`), e os corrimãos são sólidos (`mapBridgeRail`).
  - As trilhas das cabeceiras saem da trilha principal (`fieldsBridgePathDistance`).
  - `19631dc` desceu a ponte norte da linha 7 para a 15, porque a copa do `ipe-0` cobria a travessia.
- **Saída sul dos Campos para a Costa.** A trilha principal desce até `FIELDS_COAST_EXIT` (`x=912`), com placa e a dica "Costa das Marés ao sul". `OpenFieldsScene.enterCoast` salva `activeArea='coast'` e abre a Costa. A volta pela borda norte da Costa cai em `FIELDS_COAST_RETURN` (912, 2160).
  - Cadeia de retomada: Vale → `enterFields` → Campos → Costa. O Vale e os Campos preservam `'coast'`; a Vila e a CityForest não passam mais pela Costa.
- **Costa refeita** (`src/data/coast.ts` e `src/coast-world.ts`). A chegada fica ao norte, em `COAST_ENTRY` (28,4), com a saída em `COAST_EXIT` (28,1); a proteção é `coastEntryProtected`. O mar ocupa o sul e o leste, com a praia em `COAST_SHORE`. O rio entra pela coluna 16, a mesma posição em que sai dos Campos, e deságua no mar a oeste do píer.
  - Peças: cabana (54,41), píer (64,46), barco (52,52), varal de redes, lanternas, cerca, troncos, rochas e conchas.
  - Espuma e grãos de areia seguem a linha da praia (`COAST_SHORE_POINTS`).
- **Retirado da ligação antiga.** Saíram `RAILWAY_COAST_EXIT`/`RETURN`, `coastRoadProtected` e o asfalto e trilho da Costa. Também saíram a placa da Estação para a Costa e o caso `coast` em `ROAD_LINKS`, `outgoingRoad` e `resumeViaRoad` (`TrailScene`).
- **Saves antigos.** A geração de árvores, pedras, moitas e ervas dos Campos continua igual. `ORIGINAL_TRAILS` alimenta a geração, e o trecho novo da trilha não entra nela.
  - O que cai no rio, na margem ou nas trilhas novas é retirado depois. Saíram 13 árvores e pedras, de 141 para 128, e 122 moitas, de 1.269 para 1.147.
  - As restantes mantêm id e posição, conferido contra o HEAD anterior.
  - Os ids retirados ficam em `FIELDS_RETIRED_PATCHES`. `migrateSave` apaga apenas os cortes guardados dessas moitas.
  - O jogador salvo nadando volta no mesmo ponto (`fieldsPlayerSafe`). Animais salvos na água voltam à posição inicial.

## Em andamento e próximo passo exato

- O Junior deve jogar os Campos com o rio e a Costa no PC dele e dizer o que ajustar: posição das pontes, largura do rio e o caminho até a praia.
- A Costa ainda não tem atividade. Ideias: pesca no mar e na foz, conchas para coletar e uma história ligada ao barco.
- História curta da sala de espera da Estação: textos e recompensa a definir pelo Junior.
- Ligar a íris azul à história da Amélia (`src/data/npc-stories.ts`); a história do Nilo pode reaproveitar o selo das Ruínas.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md), atualizada com o rio e a Costa.
- O limite leste da Estação é só um bloqueio no fim do mapa. A estrada continua visível até a borda, à espera de um destino que não é a Costa.
- O Pomar Abandonado fica como ideia para outra área.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários.
- Arte nova do chiqueiro: o Junior vai pedir depois. Possível versão para iPhone continua em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste roda os Campos a cerca de 11 FPS com SwiftShader.
- Na margem logo abaixo de uma ponte, o personagem só fica com água rasa, não nada. É igual às pontes da propriedade.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta, e `qa-farm-interior.cjs` tem uma falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Base da rodada: `npm run check` passou e `npm test` passou com 2.236 testes, antes de mexer na Costa.
- Final: `npm run check` e `npm test` passaram, com 2.243 testes em 269 arquivos. O `npm run build` passou.
- `tests/coast.test.ts` foi reescrito para a nova geografia e cobre:
  - a passagem Campos ↔ Costa nos dois sentidos, com chegada protegida no F2;
  - a Estação sem peças da Costa;
  - o rio que continua dos Campos e deságua no mar;
  - o mar ao sul e ao leste;
  - a praia caminhável até a água e o píer;
  - o rio e as pontes dos Campos;
  - a migração dos cortes de moitas e o jogador salvo nadando.
- `tests/ipe-trees.test.ts` agora soma as moitas restantes com as retiradas (1.269).
- No Chromium foram conferidos:
  - as duas pontes atravessadas a pé, sem nadar;
  - a subida na ponte pela água, recusada;
  - a saída sul com a dica, a chegada na Costa em (912, 144) e a volta aos Campos em (912, 2160);
  - o save na Costa e a retomada no mesmo ponto depois de recarregar a página;
  - zero erros de página.
- As capturas ficaram fora do repositório.
