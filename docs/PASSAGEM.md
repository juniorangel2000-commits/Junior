# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Ruínas e porão do antigo posto jogáveis. O Junior colocou o cenário a leste da Estrada da Cidade, pediu o asfalto contínuo no limite norte e aprovou a investigação, os vestígios da chuva e a identificação de uma peça pelo Nilo. A publicação da preview.45 continua adiada.

## Feito nesta rodada

- `fda4425` e `b61f14f` criaram as primeiras dez peças de alvenaria e outras 22 sprites, incluindo armazém, lajeados, carroça, sino, guichê e cisterna. `bd1e8ac` acrescentou a escada e o selo de bronze. As fontes ficam em `referencias/cenarios/ruinas/` e os recortes em `public/assets/visual/ruins/`. Regere com `node scripts/pack-ruins-art.cjs`.
- `17a7459` criou a ligação nos dois sentidos pela divisa leste da Estrada da Cidade. O asfalto cruza o norte das Ruínas inteiro, com as construções e trilhas ao sul. Para montar o mapa geral, alinhe o centro da estrada na linha 10 do mapa da Estrada e na linha 4 das Ruínas. A borda leste das Ruínas reserva espaço para a futura continuação.
- O mapa externo de 96 × 72 ladrilhos abre no F2 da versão de desenvolvimento. Pisos, alvenaria, vegetação e colisões têm edição independente. Arcos e entradas de pedra têm passagem livre entre as bases. A nova saída preserva a travessia mesmo em partidas com pintura antiga no fim da Estrada da Cidade.
- O arco leva ao antigo posto. As pistas no marco, na carroça e na oficina explicam o último transporte de remédios. O jogador pode encontrá-las em qualquer ordem e abrir o nicho do pedestal uma vez para obter o Mapa antigo.
- `bd1e8ac` espalhou capim baixo, flores e samambaias, variou os lajeados e misturou cascalho aos acostamentos. Marcas de roda aparecem durante a chuva e no dia seguinte. O mapa abre a escada perto da cisterna, com posição do porão salva separadamente.
- `b59b883` criou 14 sprites próprias para o porão degradado, e `fc04620` montou a sala de 832 × 544 px com paredes, lajes úmidas, aro de escada, ralo, móveis arruinados, barris, caixas e lanternas. As bases dos móveis, o perímetro e o vão da escada têm colisões próprias. A escada ao norte leva de volta ao armazém.
- O selo pode ser recolhido na mesa do encarregado. Conversando com Nilo, o jogador abre **Serviços → Identificar o selo**. A identificação fica registrada na partida, e o jogador conserva a peça na mochila.
- Capturas e validação em `/workspace/afterrain-ruinas/`. O Pântano continua ao sul da Floresta Antiga, com a silhueta submersa do jacaré de `a31a887` e as melhorias registradas em `8b820d0:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Conferir o cenário das Ruínas com o Junior e decidir qual nova área deve aproveitar a continuação leste da estrada. Costa das Marés, Pomar Abandonado e Estação Ferroviária Desativada permanecem como propostas.
- Ligar a íris azul à história da Amélia, usando `src/data/npc-stories.ts`. A investigação das Ruínas já tem um fechamento com o Nilo. A história pessoal dele pode reaproveitar o selo se o Junior quiser desenvolver essa ligação.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md). O encaixe dos rios continua marcado no mapa geral anterior.
- A preview.45 contém a mochila reformulada, a barra rápida maior e a compressão WebP sem perda. Detalhes em `0c8faec:docs/PASSAGEM.md`.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários. A pesca rara continua exclusiva do lago.
- Inclinação do fazendeiro durante o galope, arte nova do chiqueiro e possível versão para iPhone continuam em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Base da rodada: `npm ci`, `npm run check`, 2.217 testes em 266 arquivos.
- Final: `npm run check` e `npm test`, com 2.225 testes em 267 arquivos. Os testes das Ruínas cobrem a continuidade do asfalto, o acesso aos pontos da história, o editor, as pistas, a chuva, o porão e a identificação persistente do selo.
- No Chromium, foram conferidos a ida e a volta pela estrada, a passagem pelo arco, a coleta única do mapa, os vestígios da chuva e a importação de piso, objeto e colisão no editor. No porão final, a descida, a coleta do selo, a retomada da posição e a subida pela nova escada passaram. Nilo identificou a peça pelo painel de serviços da Vila. Os registros ficam em `/workspace/afterrain-ruinas/`.
