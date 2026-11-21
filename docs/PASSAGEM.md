# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** Pântano jogável em `38a1ce5`. O Junior priorizou os cenários novos e adiou a publicação da preview.45.

## Feito nesta rodada

- Pântano de 96 × 72 ladrilhos, com acesso ao nordeste da Floresta Antiga. O cenário combina quatro pisos de brejo, um canal com água animada, lagoas, trilhas, três árvores próprias, tocos, pedras, troncos, vegetação aquática e uma passarela.
- Passarela acessível pelas cabeceiras, com bloqueio nas laterais. Árvores e pedras têm colisão nas bases. Nado, pesca na margem com a tabela de águas comuns, HUD, mochila, mapa e salvamento usam os sistemas existentes.
- Sprites e animações de sapo e jacaré. Sapos saltam entre pausas e jacarés se movem dentro da água. Íris azul da Amélia já aparece no mapa.
- Editor F2 do Pântano com pintura dos pisos, posicionamento de árvores, passarela, flora e fauna, marcadores de entrada e saída e pincéis para bloquear, liberar ou restaurar colisão. As edições são gravadas na partida.
- As fontes de arte estão em `referencias/cenarios/pantano/` e as peças do jogo em `public/assets/visual/swamp/`. `node scripts/pack-swamp-art.cjs` extrai os recortes e os atlas. Capturas da validação em `/workspace/afterrain-pantano/`.
- A preview.45 também contém a mochila reformulada, a barra rápida maior e a compressão WebP sem perda que já estavam no branch. Detalhes da rodada anterior em `0c8faec:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Testar o Pântano com o Junior e ligar a íris azul à história da Amélia em três partes. Usar `src/data/npc-stories.ts` como referência. Depois, começar as Ruínas e o conteúdo do Nilo.
- Quando o Junior pedir a publicação, conferir se o Windows executa a compressão com `sharp` e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md). Costa das Marés, Pomar Abandonado e Estação Ferroviária Desativada são propostas para depois dos cenários já planejados.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois da prioridade atual dos cenários. A pesca rara continua exclusiva do lago.
- Inclinação do fazendeiro durante o galope, arte nova do chiqueiro e possível versão para iPhone continuam em planejamento.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Base do branch: `npm ci`, `npm run check`, 2.210 testes e build WebP. A compressão local reduziu 388,5 MiB de PNG para 242,3 MiB de imagens.
- Pântano: `npm run check` e 2.214 testes em 266 arquivos.
- Chromium: ida e volta pela Floresta Antiga, mochila e mapa, travessia da passarela e bloqueio lateral, animação das duas espécies, pintura de chão, movimento de árvore, pincel de colisão e gravação das edições.
