# Natação com as sprites oficiais

Implementação local conforme a especificação de natação recebida em 24/10/2026. A orientação atual substitui a proposta antiga de aguardar animações do PixelLab: os PNGs oficiais são preservados e o efeito funciona com as poses já existentes.

## Arquivos e funcionamento

- `src/swimming/config.ts`: parâmetros e recortes nativos por personagem e direção; consulta de profundidade pela distância à margem.
- `src/swimming/controller.ts`: estados `land`, `wading`, `swim_idle` e oito estados direcionais; transição gradual de imersão.
- `src/swimming/renderer.ts`: componente reutilizável `SwimmingVisual`. A cabeça usa a textura original; a parte submersa usa a silhueta real das poses originais, em azul-esverdeado. Uma cópia da textura original da água, recortada pela mesma silhueta, fica acima do corpo e abaixo da cabeça. Recortes e origens idênticos mantêm as camadas alinhadas.
- `src/swimming/water-effects.ts`: uma única instância de Graphics reutilizada para ondulações, rastro e respingo de entrada, com flutuação discreta.
- `src/swimming.ts`: exportações de compatibilidade para o restante do jogo.
- `src/player.ts`: integração sem substituir a movimentação ou a caixa de colisão existente. A cabeça fica estável; sob a água, as poses originais alternam lentamente para indicar movimento. Ao sair, restaura recorte, origem e velocidade de caminhada e oculta todas as camadas aquáticas.
- `src/scenes/ValleyScene.ts` e `src/scenes/ForestScene.ts`: profundidade calculada sobre a água real de cada mapa, incluindo pisos editados. Pontes/pisos da propriedade permanecem caminháveis.
- `scripts/qa-swimming.cjs`, `tests/swimming-controller.test.ts` e `tests/player-swimming.test.ts`: validações do sistema.

Os atlas submersos são criados uma vez por aparência, compartilhados no gerenciador de texturas e não são gerados a cada frame. Os PNGs de origem não são escritos. As camadas e os efeitos são descartados com o sprite do ator. A cor do corpo é aplicada no atlas para funcionar tanto em WebGL quanto no renderizador Canvas, sem depender de tint exclusivo de GPU.

## Ajustes

Em `SWIMMING_CONFIG`: velocidade máxima de nado `speedFactor` (0,55 da caminhada), opacidade do corpo `bodyOpacity` (0,45 em água profunda), cor `bodyTint` (#164f5a), sobreposição da água `surfaceOpacity` (0,22), faixa rasa `shallowDistance` (8 pixels do mundo), profundidade visual completa `deepDistance` (40 pixels), limiar lógico `deepThreshold` (0,35), suavização `transitionRate` (12), amplitude de flutuação `bobAmplitude` (0,65 pixel do mundo), frequências das ondulações `idleRippleHz` e `movingRippleHz`.

`HEAD_BOTTOM` define o recorte em pixels nativos 192×256, individualmente nas oito vistas da fazendeira e do fazendeiro. Não existe proporção universal de cabeça. `SwimmingAppearance` permite fornecer tamanho, densidade, número de frames, recortes e função de desenho para outro ator ou futuro NPC; cada aparência precisa de `cacheKey` único. Os NPCs atuais não recebem comportamento de natação automaticamente.

## Validação e limites

Resultados detalhados em `docs/cenarios/validacao-nado.json` e `validacao-nado-canvas.json`, gerados pelo teste real no Chromium. Capturas: `nado-feminino.png` e `nado-masculino.png`. Os 128 PNGs oficiais foram comparados por SHA-256 com a cópia anterior e permanecem idênticos.

A profundidade é inferida da distância à margem, pois o mapa não possui batimetria. As poses submersas adaptam a caminhada existente em ritmo lento; não são animações novas de braçada. A superfície usa a textura de água já existente, sobre a silhueta, sem redesenhar o lago. A validação gráfica usa Chromium no Linux; não representa teste de um novo executável Windows.

A etapa inicial foi concluída somente local. Em seguida o usuário autorizou: “adicione tudo e gere o executavel”. A geração e disponibilização da versão 0.9.3 foram então retomadas.
