# Estação Ferroviária Desativada

> **Montada pelo Claude em 22/11/2026** (`d5d643c`). Arquivos: `src/data/railway-art.ts` (peças, tamanhos e bases), `src/data/railway.ts` (planta, vegetação, colisão e pontos de examinar), `src/railway-world.ts` (piso, trilhos e desvanecimento), `src/data/railway-hall.ts` e `src/railway-hall-world.ts` (sala de espera), integração em `src/scenes/TrailScene.ts` (área `railway`, cena `Estacao`). Diferenças em relação à planta proposta: a escada desce na ponta oeste da plataforma (x=24–27) direto para a travessia da linha principal; a rampa ficou na ponta leste (x=73–76); a travessia da linha de carga fica em x=66–69, ligada ao galpão por cascalho; os trilhos não bloqueiam a passagem (só veículos, mureta e objetos sólidos).

O Junior escolheu a Estação como próximo cenário e pediu ao Codex um kit completo de arte. O Claude implementou o mapa seguindo as decisões das Ruínas. Em seguida, o Junior pediu móveis frontais, um interior mais abandonado e trilhas externas mais naturais. A revisão usa a malha da primeira versão com novas paredes, móveis e vestígios. Leia [a passagem](../PASSAGEM.md) e use [o manifesto das artes](../../referencias/cenarios/estacao-ferroviaria/manifest.json).

## Direção de arte

Estação ferroviária rural brasileira abandonada, com reboco ocre descascado, telhas quebradas, madeira cinzenta, ferrugem e capim crescendo entre os dormentes. Preserve a perspectiva e a escala visual do posto nas Ruínas. Use floresta e vegetação rasteira da paleta do jogo nas bordas, e samambaia, silvas, trepadeiras e capim ferroviário junto às construções. Concentre as manchas densas na linha de carga desativada, atrás dos prédios e ao pé da plataforma. Deixe as travessias, a porta, a rampa e a estrada legíveis.

Monte a cena por pisos e objetos independentes. As texturas são repetíveis, e o desenho natural das margens sai do terreno e da mistura entre materiais. Use contornos irregulares nas clareiras e faça o lastro desaparecer gradualmente no solo. Reserve ferrugem, telhas e ferramentas caídas para os locais em que teriam caído ou ficado guardadas. Combine manchas mais densas de capim alto com espaços vazios. A geração em `src/data/railway.ts` preserva estrada, plataforma e trilhas, e acompanha as edições locais de piso e objetos.

## Planta inicial para o Claude

Use como ponto de partida 96 × 72 ladrilhos de 32 px, mesma grade das Ruínas. As posições abaixo são propostas, medidas na grade local da Estação. Ajuste no jogo usando o fazendeiro em escala normal.

| Posição aproximada | Montagem |
| --- | --- |
| Norte, centro da via em `y=4` | Asfalto atravessa o mapa, desde as Ruínas a oeste até o limite leste. Preserve faixa livre e textura contínua nos dois limites. |
| `x=48–56`, `y=24–31` | Prédio principal com frente para o sul. A porta abre a sala de espera e bilhetes. A placa faz a identificação da área. |
| `x=24–75`, `y=32–37` | Plataforma com banco, cobertura, mureta fragmentada, rampa a oeste e escada perto da travessia. Mantenha saídas transitáveis nas extremidades. |
| Centro em `y=40` | Linha principal junto da plataforma e da travessia de madeira. A oeste, ela vira para o sul antes da divisa com as Ruínas e termina entre as árvores. |
| `y=48` | Segunda linha, destinada a manobra e carga. Use um batente numa ponta e o trecho quebrado junto da antiga área de manutenção. Deixe o vão entre as linhas caminhar livremente. |
| `x=65–82`, `y=49–57` | Galpão de carga voltado para o trilho. Distribua caixotes, latões, barril e carrinho perto da rampa. |
| `x=17–23`, `y=37–45` | Cabine de sinais, poste, semáforo e peças de manutenção. Proteja a travessia com grade curta nos lados, com abertura nos dois extremos do acesso. |

Coloque a locomotiva, o tender e um vagão do mesmo lado da travessia, deixando espaço para o resto do pátio. Use o vagão de carga e a dresina em pontos separados. A linha principal faz a curva para o sul no lado oeste. A linha secundária pode terminar no pátio, os desvios ferrugentos servem de detalhe junto dela e a estrada segue visualmente para leste.

### Saída para as Ruínas

Em `src/data/ruins-road.ts`, use a referência `RUINS_ROAD_Y = 4`. A nova passagem pode detectar a divisa em `{x: 94, y: 4}` nas Ruínas, com retorno em `{x: 92, y: 4}` voltado para oeste. Na Estação, use a saída oeste em `{x: 1, y: 4}` e uma chegada em `{x: 4, y: 4}` voltada para leste. Mantenha a ligação oeste já existente das Ruínas com a Estrada da Cidade. Use `MapExitPassage` para reconhecer a travessia correndo e a pé, com posições de chegada fora dos gatilhos.

Use `preloadCityRoadArt` e `readCityAsphalt` de `src/city-forest-world.ts` e a composição de bordas de `src/ruins-world.ts`. Igualar as cores e o contorno do asfalto na emenda, incluindo o desgaste com musgo que a borda leste das Ruínas já aplica. Mantenha a meia-largura de 3,16 ladrilhos e proteja o ponto de chegada e sua faixa caminhável em partidas com pinturas antigas. O limite leste da Estação recebe um contorno de mapa discreto até existir um destino. A faixa de asfalto continua visível até esse limite.

### Interior

O salão tem 26 × 17 ladrilhos. A bilheteria fechada, a estante de malas e a balança ficam à esquerda. Os bancos de frente, um deles quebrado, ocupam a direita perto do quadro de horários. Paredes frontais com lambril contínuo e reboco descascado dão fundo aos objetos. O piso combina ladrilho antigo, manchas de umidade e tábuas delimitadas no guichê. Bilhetes rasgados, rachaduras, cacos e malas espalhadas marcam o abandono.

A entrada pela plataforma responde a **E** ou clique próximo. A volta é pelo batente ao sul, que esmaece junto ao personagem. O perímetro e os pés dos móveis têm colisões próprias, enquanto tapete, bilhetes e grade fechada ficam no nível do piso. A bilheteria e o quadro de horários podem ser examinados. A planta interna fica em `src/data/railway-hall.ts`. O editor F2 abre o mapa externo.

## Uso dos PNGs

O kit reúne **90 peças de uso individual e 13 pranchas-fonte**. Os recortes ficam em `referencias/cenarios/estacao-ferroviaria/`. Mantenha as fontes em resolução nativa. As peças carregadas pelo jogo ficam em `public/assets/visual/railway/`. Gere os recortes novamente com `node scripts/pack-railway-art.cjs`. O manifesto indica recorte, dimensão nativa e referência de ancoragem de cada PNG.

| Pasta | Arquivos e função |
| --- | --- |
| `sprites/exterior/` | 37 peças. Prédio principal, locomotiva, tender, três tipos de vagão e dresina. Cabine, galpão, cobertura, escada, rampa e mureta. Sinais, batente, alavanca, poste, coluna d'água, banco, placa e grade. Capins, trepadeira, arbustos, samambaia, árvore jovem e pedras. Bagagens, latões, caixotes, carrinho, telhas, cerca caída, barril e quadro externo. |
| `sprites/interior/` | 14 peças da primeira sala de espera. |
| `sprites/interior-frontal/` | 22 peças da reforma. Paredes, guichê, batente, lambril, bancos, bilheteria, quadro de horários, relógio, lampião, bagagens e marcas de desgaste. |
| `pisos/` | 6 texturas opacas de 256 × 256 px. Terra com musgo, cascalho, lastro, lajes da plataforma, tábuas internas e ladrilho antigo. Amostre com origem no mundo para preservar a continuidade entre blocos. |
| `trilhos/` | 11 peças. Retas horizontal e vertical, travessia modular, via envelhecida, trecho quebrado, travessia isolada, dormente, eixos, pilha de dormentes, lastro solto e caixa de desvio. |

### Escala, profundidade e encaixes

- Use os pés do fazendeiro e o batente da porta como referência. Comece com fachada de aproximadamente 245–295 px de largura, locomotiva de 145–178 px, vagão de 130–168 px e cabine de 92–112 px. Escale sinais, bancos e malas lado a lado com o jogador. Os recortes preservam a proporção original e dimensões nativas variam por peça.
- A âncora de base-centro orienta a colocação inicial. Para profundidade e colisão, use o ponto de contato com o solo, as rodas nos vagões e as bases dos postes na cobertura. O deck e os caminhos pertencem ao piso. Bancos e móveis ficam na ordenação por Y. Coberturas e partes altas que possam cobrir o jogador precisam de camada dianteira independente ou recorte por região e fade, como os objetos altos das Ruínas.
- Cada reta de 128 × 128 px ocupa **64 × 64 px no mundo** em escala 0,5. Para uma linha com centro em `y=40`, a reta começa na linha 39. Deixe vizinhas se tocarem exatamente; as bordas dos trilhos já coincidem. A `travessia-modular.png` tem 192 × 224 px e substitui **96 px de reta**, começando 24 px acima da origem dos módulos adjacentes. Ela tem a mesma bitola nos dois lados. Reserve um trecho de três ladrilhos e comece a repetição seguinte exatamente na borda da travessia. Use o lastro sob a via e a travessia como piso no fluxo transversal.
- O trecho quebrado, o trilho envelhecido e a travessia isolada têm bitolas e proporções próprias. Use como objetos de detalhe, entradas de oficina ou pontas de via e ajuste as junções no editor se integrar um deles a uma reta. O batente cobre visualmente uma ponta de linha.
- Faça hitboxes justas nos pés dos objetos, rodas, pilares e laterais dos veículos. Garanta que porta, rampa, escadas e travessias funcionem com os pés do personagem, inclusive em deslocamento diagonal. Teste as extremidades das plataformas contra subida lateral sem degrau ou rampa. Capim e sombras leves podem renderizar sem colisão. Em manchas densas, siga as Ruínas com tufos sem sombra projetada e desvanecimento limitado ao entorno do personagem.

## Integração e conferência

1. Implemente dados e renderização modular usando `src/data/ruins.ts`, `src/ruins-world.ts` e `src/ruins-cellar-world.ts` de referência. Adicione tipos da Estação, terreno, decoração, colisão e os pontos nomeados. Monte cada construção, flora e objeto com IDs estáveis para que o F2 consiga mover, ocultar ou substituir peças.
2. Integre o trecho ao fluxo de `src/scenes/TrailScene.ts` ou extraia os componentes compartilhados que o mapa realmente precisar. Siga o fluxo de `src/scenes/CityForestScene.ts` para transição nos dois sentidos. Procure pelos casos de `ruins` e `Ruinas` nas rotas de retomada, menu, registro de cena, carregamento e pausa. Confira `src/main.ts` e `src/travel-loading.ts`.
3. Cadastre o exterior no editor em `src/data/editor-areas.ts` e em `src/systems/scene-map-edits.ts`. Confira a recarga da edição de piso, vegetação, objetos, pontos e colisão. A planta modular do interior fica em `src/data/railway-hall.ts`. Armazene posições e edições em campos opcionais de `src/types.ts` e valide limites em `src/systems/save.ts`. Reabra partidas da preview.44 e saves das Ruínas. Preserve o mapa e a posição no porão.
4. Reaproveite HUD, relógio, zoom limitado ao mapa, mochila, barra rápida, passos por material, ferramentas e ciclo de luz, inclusive na sala. Em vegetação densa, mantenha animação e sombras próximas da câmera sem trabalho por tufo a cada quadro.
5. Teste ida e volta caminhando, correndo e em diagonal. Confira rua contínua na emenda, portas e travessias na abertura certa, escala de ambos os fazendeiros contra a fachada e arte do vagão, ordem de profundidade, colisões, posição ao retomar e editor F2. Tire capturas no asfalto, na plataforma e na sala, e um mapa geral que mostre o encaixe da estrada.
6. Rode `npm run check` e `npm test`, teste o trajeto no navegador e registre o resultado no GitHub e em `docs/PASSAGEM.md` seguindo `AGENTS.md`.
