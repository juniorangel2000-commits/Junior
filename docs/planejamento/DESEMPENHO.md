# Desempenho e tamanho do jogo

Começou na preview.37, a pedido do Junior ("o jogo está pesado": tamanho e travamentos).

## Medições (navegador da nuvem, SwiftShader)

Memória de vídeo estimada (largura × altura × 4 de cada imagem carregada):

| Momento | Antes | Depois da preview.37 |
| --- | --- | --- |
| Propriedade, ao começar | 996 MB | 996 MB |
| Vila | 1.919 MB | 1.919 MB |
| Depois de visitar todos os cenários | 2.330 MB | ~1.100 MB |
| Propriedade depois de 4 viagens | 1.212 MB (crescendo) | 996 MB (estável) |

Tamanho: o build tem 443 MB (2.185 PNGs, ~380 MB; vídeos 46 MB; código 3 MB) e o
instalador 527 MB.

## Feito

1. **Contador F3** (`src/performance-overlay.ts`): FPS, quadro mais lento, imagens e MB
   na placa de vídeo, memória do JavaScript e objetos do cenário. O Junior usa no PC dele.
2. **Liberação de imagens** (`src/scene-texture-release.ts`): ao terminar, cada cenário apaga
   as imagens que só ele criou (menos as que a Propriedade, dormindo, está mostrando, e as
   máscaras). Animações que usavam essas imagens também saem. Propriedade e editor não
   liberam.
3. **Vazamento da Propriedade corrigido** (`src/scene-children.ts`):
   `children.removeAll(true)` não destrói objetos no Phaser 3.90. A cada `loadState` o mundo
   anterior continuava vivo, inclusive a água animada (27 MB e uma atualização por quadro a
   cada volta). Agora os objetos são destruídos. O mesmo valia para Masmorras e Editor.
4. Ícones de itens no chão voltam a carregar depois de liberados.

Conferência: `scripts/qa-texture-release.cjs` vai e volta duas vezes entre a Propriedade, a
Vila e a Floresta. Ele procura imagens faltando (`__MISSING`) e erros, e confere que a
memória volta ao valor inicial.

## Campos Abertos: animais fugindo travavam

O Junior relatou travadas com o cavalo e os animais correndo. `scripts/perf-fields.cjs` mediu:

| Parte (por quadro, perseguindo os animais) | Antes | Agora |
| --- | --- | --- |
| Animais (rota de fuga) | 25 ms | 2,7 ms |
| Pior travada | 1,6–2,3 s | 0,28 s |
| Luz do dia (sombras) | picos de 1,6 s | até 7 ms |

Causas e correções:

1. **Rota de fuga** (`AnimalBrain.plan`): cada recálculo conferia centenas de milhares de
   pontos, montando um texto para buscar cada célula de obstáculo.
   - `fieldsBlocked` agora usa índice numérico.
   - A busca guarda o que já conferiu. Nos Campos (`staticWorld`), a memória vale entre
     recálculos, porque os obstáculos não mudam.
   - Os recálculos têm intervalos levemente diferentes, para os animais não calcularem
     todos no mesmo quadro.
2. **Sombras** (`SolarShadows`): a silhueta de pedras e árvores era desenhada (com
   desfoque) quando aparecia na tela pela primeira vez. Agora é feita ao entrar no
   cenário. Personagens animados continuam sob demanda.

O restante do tempo por quadro aqui é o desenho por software do navegador da nuvem
(~57 ms parado); no PC do Junior isso fica na placa de vídeo.

## Preview.39

- **Interiores dos abrigos à noite:** modo `'shelter'` da luz nova, com lampiões na parede.
- **Atlas dos animais compactados** (`scripts/pack_animal_atlases.py`): 132 MB → 42 MB de
  memória de vídeo, com pixels idênticos (o script confere). Propriedade: 1.002 → 917 MB.
  No pacote, os animais caíram de 22 MB para 7 MB, porque os originais saem do instalador.
- **Instalador menor (pendente de decisão do Junior):**
  - Recomprimir os PNGs sem perda (oxipng) dá só 6%.
  - **WebP sem perda dá 31%**, com pixels visíveis idênticos (`exact`). O Chromium do jogo
    reconhece o WebP mesmo com o nome `.png`, então dá para converter só o pacote final no
    build, sem mudar caminhos no código (testado no Phaser).
  - Precisa de um conversor no build: a dependência `sharp` (npm, funciona no Windows) ou
    o Pillow (Python) no workflow. Adicionar a dependência foi bloqueado nesta sessão e
    precisa do aval do Junior.

## Próximos passos

- **Propriedade carrega o que não usa:** atlas do cavalo (45 MB, ele vive nos Campos),
  fontes dos pets do abrigo (~60 MB: cachorro 23 MB, golden 13, gato 12, border collie 12),
  coelho, cervo, pato e porco (8 MB cada), e o nado (2 × 29 MB) antes de nadar.
- **Atlas dos animais com muito espaço vazio:** recortar os quadros sem mudar pixels.
- **WebP sem perda** para o instalador (economia típica de 25–40% em pixel art), com
  conferência pixel a pixel. Revisar arquivos sem uso dentro de `public/assets`.
- **Vídeos** da estrada (16 + 13 MB): reduzir só com o aval do Junior (há pequena perda).
- **Campos Abertos:** medir no PC do Junior com o F3 antes de mexer.
