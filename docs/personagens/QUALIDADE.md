# Correção da perda de detalhe

A primeira integração reduzia os PNGs de 256×256 para quadros de textura 48×64.
Esses quadros reduzidos eram ampliados novamente na seleção, no zoom e nas
prévias de revisão. Os arquivos originais não foram alterados, mas a textura
usada pelo jogo já havia descartado detalhes.

A correção separa resolução da textura e tamanho no mundo:

- Cada quadro mantém seus pixels originais, sem reamostragem. A área 192×256
  retira somente margens transparentes; nenhum pixel visível é cortado.
- A origem permanece fixa em cada personagem. Não há recentralização por
  quadro nem deformação da arte durante a caminhada.
- O sprite continua ocupando 48×64 unidades no cenário. A escala é aplicada
  na exibição pelo Phaser, permitindo que o zoom aproveite os detalhes nativos.
- A seleção utiliza a mesma textura detalhada. O PNG das oito direções e a
  prévia animada `caminhada.png` usam os quadros nativos sem redução de tamanho.
- `caminhada.png` é um PNG animado (APNG), preservando as cores. O GIF permanece
  como alternativa, mas seu formato limita a paleta de cores.

`comparacao-qualidade.png` mostra o original enviado, a antiga textura reduzida
ampliada para comparação e o quadro corrigido produzido pelo jogo. As imagens
originais e corrigidas são alinhadas pela mesma origem e exibidas em escala 1:1.

O roteiro `scripts/qa-character.cjs` compara os 128 quadros do jogo com os PNGs
nativos e verifica a contagem de pixels visíveis, o atlas usado no cenário,
o tamanho exibido, zoom de 200%, movimento e salvamento dos dois personagens.
Uma rodada completa gera `validacao-browser.json` com o resultado persistente.

Checks, 301 testes e build passaram após a correção. A publicação continua
pendente da revisão visual solicitada pelo jogador.
