# Materiais de chão

[ground-materials.png](ground-materials.png) e [floor-finishes.png](floor-finishes.png) são atlas originais criados com a ferramenta de geração de imagens, usando a direção visual do próprio projeto como referência de cores e linguagem de pixel art. O primeiro segue a arte das árvores; o segundo acrescenta madeira e pavimentação ao conjunto. Não foram copiados de outro jogo ou de uma biblioteca externa. São **onze materiais no total**.

As duas imagens-fonte permanecem preservadas. O SHA-256 de `ground-materials.png`, com **1254×1254 pixels**, é:

```text
1941e707e796d273358804658ae133569ea24bde72c41295836ccfaa884c74ad
```

O SHA-256 de `floor-finishes.png`, com **1774×887 pixels**, é:

```text
fb0b815dde9a41b241c2b4c5ccfcdd7e814100b8ad4d28fd26c5eee1bbc4e128
```

## Organização do atlas

`ground-materials.png` contém nove células de 418×418 pixels, em uma grade 3×3. A leitura começa no canto superior esquerdo, da esquerda para a direita e depois de cima para baixo.

| Linha | Coluna | ID | Material |
| --- | --- | --- | --- |
| 1 | 1 | `grass` | Grama verde da propriedade |
| 1 | 2 | `forest` | Chão de bosque com musgo e folhas |
| 1 | 3 | `meadow` | Grama dourada dos campos |
| 2 | 1 | `path-dry` | Terra de estrada seca |
| 2 | 2 | `path-wet` | Terra de estrada úmida |
| 2 | 3 | `soil` | Solo cultivado |
| 3 | 1 | `sand` | Areia e cascalho de margem |
| 3 | 2 | `moss` | Musgo úmido |
| 3 | 3 | `water` | Água azul-esverdeada |

`floor-finishes.png` contém duas células de 887×887 pixels, lado a lado:

| Coluna | ID | Material |
| --- | --- | --- |
| 1 | `wood` | Tábuas de madeira |
| 2 | `paving` | Pavimentação de pedra |

## Adaptação no jogo

`src/visual-assets.ts` carrega as imagens locais com as chaves `terrain-materials-source` e `terrain-finishes-source`. `src/terrain-sprites.ts` recorta o interior de cada célula, excluindo uma pequena faixa da divisória, e prepara onze sprites de **96×96 pixels**, com chaves `asset-ground-<ID>`. Os acabamentos adicionais usam `asset-ground-wood` e `asset-ground-paving`.

Cada sprite cobre três tiles lógicos de 32 pixels por lado. Essa escala visual é independente das colisões e das parcelas de cultivo. O recorte e a renderização usam nearest-neighbor, sem suavização.

A tabela `FINISH`, em `src/terrain-sprites.ts`, define a cor média e o contraste de cada material. O ajuste preserva os desenhos da textura, mas reduz a intensidade dos realces para facilitar a leitura do personagem, das árvores e dos recursos. Ele ocorre nos sprites preparados em memória; não modifica o PNG-fonte.

`src/terrain-art.ts` combina os materiais em uma única imagem estática do mundo. A amostragem espelhada conecta as bordas dos materiais de chão; máscaras calculadas pelas coordenadas misturam regiões, estrada seca e úmida, grama e margens. As máscaras compartilham cálculos em blocos de 2×2 pixels, mas cada pixel do sprite é amostrado individualmente. `src/world.ts` reutiliza a textura final entre carregamentos de partidas.

A água é uma exceção ao espelhamento: `joinWaterEdges`, em `src/terrain-sprites.ts`, mistura uma faixa de dez pixels nas bordas do sprite preparado em memória. O terreno repete esse material sem inverter a direção das ondulações, com deslocamentos sinuosos calculados pelas coordenadas do mundo. Isso evita o padrão de losangos formado pelo espelhamento da água. As poças da estrada também usam pixels desse sprite, dentro de contornos baixos e irregulares.

`src/art.ts` reduz o sprite inteiro de madeira de 96×96 para o piso construído de 32×32 pixels. Em `src/terrain-art.ts`, os tablados das duas pontes usam o material `wood` girado em 90 graus, preservando a armação lateral existente. As três pedras grandes de acesso à porta recebem o material `paving` em seu miolo.

## Limites

- Os atlas contêm materiais de superfície, não uma biblioteca pronta de autotiles com todos os cantos e junções desenhados. As transições são compostas pelo código.
- A repetição espelhada reduz emendas, mas pode continuar perceptível em áreas extensas.
- A armação lateral das pontes e as pequenas pedras decorativas mantêm a arte anterior. Os tablados, pisos de madeira construídos e miolos das três pedras grandes de acesso foram refeitos com os novos materiais.
- A água deste atlas é estática; a textura não implementa uma nova animação, clima ou simulação de água.
- A adaptação visual não define novas colisões, recursos, áreas cultiváveis ou dados de save.
