# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Ruínas e porão jogáveis com mais grama alta. O Junior escolheu a Estação Ferroviária Desativada como o próximo cenário e pediu que o Claude a programe com o kit preparado pelo Codex. A preview.45 segue em desenvolvimento.

## Feito nesta rodada

- `5fc8349` espalhou 1.602 tufos de grama alta no mapa externo das Ruínas e 29 no porão. As manchas variam em altura e densidade. A estrada, as trilhas, os vãos e os pontos de inspeção ficam livres. No exterior, os IDs estáveis permitem desfazer ou mover os tufos no F2. O capim alto evita sombra projetada, e o jogo só reduz a opacidade dos tufos próximos ao personagem.
- `5b79269` preparou a arte da Estação. O kit tem 68 PNGs de uso individual e dez pranchas-fonte, com fachada, vagões, plataforma, trilhos, pisos, vegetação, paredes e móveis degradados. Os arquivos ficam em `referencias/cenarios/estacao-ferroviaria/`. `node scripts/pack-railway-art.cjs` refaz os recortes com as emendas testadas. O conteúdo está pronto para montagem pelo Claude.
- O mapa jogável das Ruínas, o porão, a investigação do transporte e a identificação do selo pelo Nilo estão registrados em `39b6098:docs/PASSAGEM.md`. Para o mapa geral, a via sai da Estrada da Cidade em `y=10` e percorre as Ruínas em `y=4`. A ligação com a Estação continua em `y=4`.
- O Pântano permanece ao sul da Floresta Antiga, com a silhueta submersa do jacaré de `a31a887` e as melhorias registradas em `8b820d0:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- O Claude deve começar pelo [roteiro da Estação Ferroviária](cenarios/ESTACAO-FERROVIARIA.md). Monte primeiro os pisos e a ligação leste em mão dupla pelas Ruínas. Em seguida, encaixe trilhos, fachadas e sala de espera com colisões e objetos editáveis no F2. O roteiro dá as dimensões, as posições iniciais, a escala, as âncoras, os arquivos do jogo a conferir e os testes de entrada, volta, salvamento e HUD.
- Ligar a íris azul à história da Amélia, usando `src/data/npc-stories.ts`. A investigação das Ruínas já tem um fechamento com o Nilo. A história pessoal dele pode reaproveitar o selo se o Junior quiser desenvolver essa ligação.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md). O encaixe dos rios continua marcado no mapa geral anterior.
- Costa das Marés e Pomar Abandonado ficam como ideias para outras áreas.
- A preview.45 contém a mochila reformulada, a barra rápida maior e a compressão WebP sem perda. Detalhes em `0c8faec:docs/PASSAGEM.md`.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários. A pesca rara continua exclusiva do lago.
- Inclinação do fazendeiro durante o galope, arte nova do chiqueiro e possível versão para iPhone continuam em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Base da rodada: `npm ci`, `npm run check`, 2.225 testes em 267 arquivos.
- Final: `npm run check` e `npm test`, com 2.226 testes em 267 arquivos. O teste novo cobre densidade e distribuição do capim alto, faixas livres, bases de alvenaria e edição dos tufos.
- No Chromium, o mapa das Ruínas renderizou os 1.602 tufos novos e as manchas do porão, com piso caminhável nos tufos e zero erros de página. Capturas e contagens em `/workspace/afterrain-ruinas/`.
- Conferidos os 68 PNGs, as dez fontes, o conteúdo do ZIP e 16 emendas, incluindo os lados dos pisos e o encaixe da travessia modular às retas. Pranchas e ZIP em `/workspace/afterrain-estacao/`. A montagem da Estação no navegador acompanha a implementação do Claude.
