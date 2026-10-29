# Cenário 4 — Floresta de Acesso à Cidade

Implementação local posterior à preview.11, sem publicação ou alterações remotas.

## Resultado

Mapa independente de 96 × 72 tiles de 32 pixels (3072 × 2304), conectado ao norte da vila. Entrada sul sem construções; floresta com 422 árvores variadas, quatro clareiras, trilhas secundárias, 65 obstáculos naturais distintos e três pequenas poças.

As trilhas usam curvas suaves que passam pelas junções autorais, com bordas irregulares discretas. Árvores e obstáculos respeitam sua geometria final. A floresta ocupa a maior parte do mapa; há áreas exploráveis fora da trilha principal.

A estrada forma um L normal (└), com trecho vertical ao norte do cotovelo e trecho horizontal para a direita. O asfalto fica restrito às primeiras 14 linhas do mapa, com rachaduras, marcações e manchas de umidade. Os dois contornos de cerca acompanham o traçado e seus cotovelos. Duas aberturas se ligam às trilhas; os fios intactos bloqueiam a passagem.

Postes são de madeira com musgo. A vista lateral mostra fios separados; a vista longitudinal mantém os três fios comprimidos e sobrepostos, conforme o último ajuste solicitado. A placa verde mostra exatamente “↑ City”, com suportes metálicos.

Neblina leve com deriva lenta e tonalidade fria aparece somente neste cenário. Sprites de vegetação existentes são reutilizados; o atlas de asfalto, cercas e placa foi criado separadamente. Fontes PNG permanecem intactas; o recorte de alpha ocorre somente na textura em memória.

## Integração

A conexão na vila é um pequeno caminho natural ao norte, contornando o banco do coreto. Os sprites, interiores, NPCs, rotinas e mapas anteriores não foram reconstruídos. A remoção de árvores e plantas na vila se restringe à área necessária para abrir essa conexão.

O novo cenário tem caminhada, zoom, mapa, pausa, relógio, crescimento dos cultivos existentes, salvamento e continuação na posição correta. A volta coloca o jogador na chegada norte da vila, sem levar a neblina para lá. O atlas novo carrega ao entrar no cenário; o terreno é rasterizado uma vez e reutilizado. Um índice espacial limita os segmentos de trilha avaliados no preparo do terreno.

O ponto `city-dungeons-access` está reservado com direção norte, duração futura de viagem de 5000 ms e identificadores para praça abandonada e estacionamento. A interação informa que o acesso futuro ainda não está disponível. Nenhum mapa de dungeon, menu de cidade, viagem ou combate novo foi implementado.

## Arquivos

Criados:

- `src/data/city-forest.ts`: geometria, trilhas curvas, estrada, cercas, passagens, árvores, obstáculos e colisões.
- `src/city-forest-world.ts`: terreno, cenário, atlas, neblina e desenho das cercas.
- `src/scenes/CityForestScene.ts`: cena independente, controles, mapa, relógio, save e retorno.
- `public/assets/visual/city-forest/`: PNG e manifesto com recortes, alinhamento e hash da arte nova.
- `tests/city-forest.test.ts`: navegação, conexões, estrada, cercas e persistência.
- `scripts/qa-city-forest.cjs`: integração real no Chromium e capturas.

Alterados:

- `src/main.ts`, `src/scenes/ValleyScene.ts` e `src/scenes/VillageScene.ts`: registro, ligação e retomada da nova cena.
- `src/data/village.ts`, `src/village-world.ts` e `src/village-greenery.ts`: apenas abertura e desenho da conexão norte.
- `src/types.ts`, `src/systems/save.ts` e `src/ui.ts`: área, posição, validação e identificação no HUD/mapa.
- `src/solar-shadows.ts`: projeção da sombra do jogador da nova cena.
- `src/systems/animals.ts` e `src/systems/tree-growth.ts`: restrição explícita dos sistemas antigos aos mapas já suportados, sem acrescentar coleta ou condução de animais ao novo mapa.

## Validação executada

73 testes direcionados em seis arquivos passaram: cenário novo, migrações de save, árvores, animais, cabana do Damião e solo/cultivo. Não foi executada a suíte completa do jogo.

TypeScript e build de produção passaram. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

16 verificações no Chromium passaram, registradas em `validacao.json`:

- Entrada caminhando pelo norte da vila.
- Carregamento da floresta, cercas, placa e neblina somente na cena nova.
- Caminhada com Player pelas rotas até as duas passagens, quatro clareiras e acesso futuro.
- Colisão contra os fios intactos.
- Captura real do mapa.
- Save válido e continuação na posição salva após recarregar a página.
- Retorno à vila com seus dez NPCs e sem a neblina.
- Ausência de erros JavaScript e arquivos ausentes durante esses fluxos.

As capturas finais foram conferidas visualmente após arredondar as trilhas. Não houve teste de executável Windows nem medição de FPS em hardware real nesta etapa. O acesso à cidade permanece desativado pelo escopo solicitado.
