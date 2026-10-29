# Animações originais — cat

`original.zip` preserva o pacote enviado, sem alterações. `metadata.json` é a metadata original do arquivo.

Atlas: `public/assets/visual/dungeons/pet-cat.png`, com 212 frames em quatro direções. O empacotador `scripts/prepare-pet-assets.py` compara cada recorte do atlas com os pixels RGBA decodificados da fonte; nenhum frame é redesenhado ou redimensionado.

Os frames mantêm seus tamanhos individuais. Pontos de apoio compensam o padding diferente entre ações. O filtro usa vizinho mais próximo, preservando a transparência original.

SHA-256 do ZIP: `5fd006b86238900cd60561ee07a785ff161255f899797081bb18d7c19db10139`.
