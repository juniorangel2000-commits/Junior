# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Estação Ferroviária Desativada jogável, ligada às Ruínas nos dois sentidos. Sala de espera reformulada com arte frontal, trilhas externas mais naturais e capim alto. A preview.45 segue em desenvolvimento e também traz a mochila reformulada, a barra rápida maior, a compressão WebP, o Pântano e as Ruínas.

## Feito nesta rodada

- `167e302` refez a sala com 22 sprites frontais. O salão de 832 × 544 px ganhou bilheteria fechada, bancos desgastados, lambril, reboco descascado, marcas de umidade e objetos soltos. A porta ao sul esmaece quando o jogador passa atrás dela. O piso ganha uma soleira junto à bilheteria, e as colisões acompanham os móveis. A porta exterior e os pontos de inspeção respondem a E ou clique próximo.
- O mesmo commit suavizou as trilhas, variou as bordas de cascalho, musgo e lajes e continuou a fase da textura de desgaste do asfalto das Ruínas. As entradas de trilhas permanecem abertas. A Estação passou a chamar o sistema compartilhado de companheiros e os pássaros ambientes.
- `2695727` espalhou a vegetação alta pelo pátio, pelas bordas da mata e junto ao galpão. O exterior ficou com 1.576 tufos editáveis, 1.232 com pelo menos 47 px de altura. Eles ficam fora do asfalto, da plataforma e das rotas principais, esmaecem perto do jogador e dispensam sombra projetada. Pintar piso no F2 suprime os tufos automáticos da célula. Edições explícitas podem mover ou remover cada tufo.
- A fogueira portátil agora pode ser montada pela mochila ou por um slot. `cd58c88` sincroniza o inventário ao recolher a fogueira e permite vê-la na mochila imediatamente.
- O mapa e a sala originais que o Claude implementou em `d5d643c` estão detalhados em `add7fef:docs/PASSAGEM.md`. A porta retorna ao patamar externo e a travessia das Ruínas segue pelo mesmo asfalto em `y=4`. Os detalhes, a planta e o manifesto das artes atuais estão no [roteiro da Estação](cenarios/ESTACAO-FERROVIARIA.md). As sprites frontais preservam as fontes em `referencias/cenarios/estacao-ferroviaria/` e os PNGs de jogo ficam em `public/assets/visual/railway/interior-frontal/`.

## Em andamento e próximo passo exato

- O Junior pode conferir a sala e a vegetação no branch da preview.45. O F2 edita o exterior. A planta dos móveis e as colisões da sala ficam em `src/data/railway-hall.ts`.
- História curta da sala de espera: textos e recompensa a definir pelo Junior. A grade fechada pode virar um acesso de manutenção depois.
- Ligar a íris azul à história da Amélia (`src/data/npc-stories.ts`); a história do Nilo pode reaproveitar o selo das Ruínas.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md).
- O limite leste da Estação é só um bloqueio no fim do mapa; a estrada continua visível até a borda, à espera de um destino.
- Costa das Marés e Pomar Abandonado ficam como ideias para outras áreas.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários.
- Inclinação do fazendeiro no galope, arte nova do chiqueiro e possível versão para iPhone continuam em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Base da rodada: `npm ci`, `npm run check`, 2.232 testes em 268 arquivos.
- Final: `npm run check` e `npm test`, com 2.236 testes em 268 arquivos. Os testes novos da Estação cobrem a arte frontal e o corredor da bilheteria, as trilhas, a posição do companheiro na sala e a densidade, passagem e edição do capim.
- No Chromium, passaram a mochila e os nove slots por arraste, clique e teclado, duas machadinhas com durabilidades independentes, fabricação de corda, soltar e recolher itens, passos, fogueira pela mochila e pelo atalho, mapa, zoom, pausa, entrada e saída da sala, retomada com posição e slots e ida e volta às Ruínas. Também foi conferida a presença dos controladores de companheiros e pássaros.
- Na revisão do capim, o Chromium desenhou os 1.576 tufos, todos sobre chão caminhável. Uma edição importada no F2 removeu o tufo escolhido e continuou aplicada ao retornar ao jogo. As capturas e os dois registros do navegador estão em `/workspace/afterrain-estacao/revisao/`. Zero erros de página nos testes concluídos.
