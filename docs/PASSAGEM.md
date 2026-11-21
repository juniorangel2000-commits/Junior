# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Pântano jogável ao sul da Floresta Antiga, com a silhueta do jacaré sob a água. O Junior pediu para seguir com os cenários novos após este ajuste. A publicação da preview.45 continua adiada.

## Feito nesta rodada

- `a31a887` acrescentou a silhueta negra do corpo do jacaré. A silhueta acompanha os 16 quadros do atlas, usa a mesma máscara da água e fica sob a correnteza, com a cabeça e as ondulações acima. Vídeo em `/workspace/afterrain-rios-e-jacare/jacare-sombra-na-agua.mp4`.
- `a7e0a89` escureceu a água do Pântano e corrigiu o atlas original do jacaré. `443acfc` arredondou o recorte lateral com degradê, levou a entrada para o norte do Pântano e conectou a trilha ao sul da Floresta Antiga. Os marcadores padrão antigos são atualizados ao carregar as edições. As taboas e os juncos ficam em terra firme e as ninfeias ficam na água.
- O editor F2 permite pintar terreno, mover flora e fauna e editar colisões e marcadores. O terreno e os objetos do Pântano têm peças próprias em `public/assets/visual/swamp/`, com fontes em `referencias/cenarios/pantano/`.
- Mapa geral das nove áreas externas e vídeo do jacaré em `/workspace/afterrain-rios-e-jacare/`. O rio do Lago encaixa na Propriedade em 144 pixels. O rio do Platô fica cerca de quatro ladrilhos para o lado da cabeceira do Lago quando as escadas são alinhadas. O canal do Pântano abre ao norte e ao sul, e o lago da Floresta é fechado. A saída sul do rio da Propriedade chega à borda seca dos Campos Abertos.
- A preview.45 também contém a mochila reformulada, a barra rápida maior e a compressão WebP sem perda. Detalhes em `0c8faec:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Começar pelas Ruínas. Nilo já fala de ruínas além do Platô da Nascente em `src/data/npc-conversations.ts`. Usar essa ligação para montar um cenário com piso, muros e vegetação em peças editáveis, acesso nos dois sentidos e um local para a peça antiga da história dele.
- Ligar a íris azul do Pântano à história da Amélia em três partes. Usar `src/data/npc-stories.ts` como referência para ambas as histórias.
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

- `npm ci`, `npm run check` e `npm test`. Os 2.217 testes em 266 arquivos passaram antes e depois do ajuste.
- Chromium conferiu a silhueta, seu alinhamento nas quatro direções e sua posição sob a camada de correnteza. A ida e a volta pela Floresta Antiga também foram conferidas no jogo.
