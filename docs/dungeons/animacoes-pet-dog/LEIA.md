# Animações originais — dog

`original.zip` preserva o pacote enviado, sem alterações. `metadata.json` é a metadata original do arquivo.

Atlas: `public/assets/visual/dungeons/pet-dog.png`, com 156 frames em quatro direções. O empacotador `scripts/prepare-pet-assets.py` compara cada recorte do atlas com os pixels RGBA decodificados da fonte; nenhum frame é redesenhado ou redimensionado.

Os frames mantêm seus tamanhos individuais. Pontos de apoio compensam o padding diferente entre ações. O filtro usa vizinho mais próximo, preservando a transparência original.

SHA-256 do ZIP: `6977a08219865569041d459144659954a8498c36f9fcf29661a41da38ea0bc26`.
