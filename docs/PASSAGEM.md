# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** Marina e Rui caminham nas oito direções na Propriedade. A animação das diagonais está integrada em `b5e8de4`.

## Feito nesta rodada

- As passadas diagonais seguem a ordem dos quadros dos jogadores. Marina usa seis quadros por vista e Rui usa oito. O ciclo avança pela distância percorrida e se completa em 48 px.
- As fontes diagonais nativas estão em `public/assets/visual/characters/survivors/`. `node scripts/pack-survivor-walk.cjs` monta cada atlas com quatro linhas cardinais e quatro diagonais. A posição dos pés e o tamanho de exibição foram ajustados em conjunto para as novas vistas.
- Os quatro ciclos cardinais foram conferidos pixel a pixel contra a versão anterior. As poses paradas continuam cardinais. Movimentação e colisões seguem a rotina da Propriedade.
- A galeria do Chromium mostra os ciclos ao lado das caminhadas de referência. Para reproduzir, inicie o Vite na porta 5190 e execute `node scripts/capture-art-review.cjs /tmp/qa-sobreviventes survivors-diagonals`.
- Referências anteriores de arte: montaria masculina em `599eafa`, contato da pá e da foice em `5e1623b` e golpe da enxada em `7b4a645`.

## Em andamento e próximo passo exato

- Receber o retorno do Junior sobre as passadas diagonais no GIF e, quando a preview estiver disponível, durante as rotinas na Propriedade. Reproduzir com a galeria ou com `node scripts/qa-village-schedule.cjs --survivors` antes de alterar pose ou compasso.
- O fazendeiro montado usa uma pose por direção e acompanha o lombo animado. Uma inclinação de tronco própria para o galope fica para uma revisão futura, se pedida.

## Pendências e ideias para depois

- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- Base: `npm run check` e 2.204 testes passando. Reinstalação com `npm ci` pelo cache, sem download do binário Electron.
- Integração: `npm run check` e 2.204 testes em 263 arquivos. Conferidas todas as vistas, as diferenças entre quadros consecutivos das botas e a seleção de quadro por distância.
- Chromium: galeria das quatro diagonais sem erros. Na Propriedade, Marina e Rui aguardam quando o trajeto está bloqueado, retomam as caminhadas ao liberar a passagem e usam todos os quadros de leste e sudeste na ida para casa.
