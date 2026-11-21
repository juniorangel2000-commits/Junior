# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Pântano jogável ao sul da Floresta Antiga. O Junior priorizou os cenários novos e adiou a publicação da preview.45.

## Feito nesta rodada

- `a7e0a89` escureceu a água do Pântano e corrigiu o atlas original do jacaré. Em jogo, o nado submerge o corpo e os braços, com ondulações junto à cabeça.
- `443acfc` levou a entrada para o norte do Pântano, conectada a uma trilha no sul da Floresta Antiga. Os marcadores padrão antigos são atualizados ao carregar as edições. O recorte arredondado e o degradê nas vistas laterais do jacaré usam a arte original. As taboas e os juncos ficam em terra firme e as ninfeias ficam na água.
- O editor F2 permite pintar terreno, mover flora e fauna e editar colisões e marcadores. O terreno e os objetos do Pântano têm peças próprias em `public/assets/visual/swamp/`, com fontes em `referencias/cenarios/pantano/`.
- Mapa geral das nove áreas externas e vídeo do jacaré em `/workspace/afterrain-rios-e-jacare/`. O rio do Lago encaixa na Propriedade em 144 pixels. O rio do Platô fica cerca de quatro ladrilhos para o lado da cabeceira do Lago quando as escadas são alinhadas. O canal do Pântano abre ao norte e ao sul, e o lago da Floresta é fechado. A saída sul do rio da Propriedade chega à borda seca dos Campos Abertos.
- A preview.45 também contém a mochila reformulada, a barra rápida maior e a compressão WebP sem perda. Detalhes em `0c8faec:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Ligar a íris azul do Pântano à história da Amélia em três partes. Usar `src/data/npc-stories.ts` como referência. Depois, começar as Ruínas e o conteúdo do Nilo.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md). A continuidade dos rios está marcada no mapa geral. Costa das Marés, Pomar Abandonado e Estação Ferroviária Desativada são propostas para depois dos cenários já planejados.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários. A pesca rara continua exclusiva do lago.
- Inclinação do fazendeiro durante o galope, arte nova do chiqueiro e possível versão para iPhone continuam em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- `npm ci`, `npm run check` e `npm test`. A rodada terminou com 2.217 testes em 266 arquivos, incluindo passagem, marcadores antigos e juncos em terra firme.
- Chromium conferiu a travessia da Floresta ao Pântano nos dois sentidos e o jacaré dentro da água nas quatro direções. A versão anterior do Pântano também foi conferida no editor F2, na mochila e na passarela.
