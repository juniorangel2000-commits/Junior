# Lote 01 — sprites de fazenda, pixel art (PNG RGBA)

Origem: folha aprovada com a porteira aberta em 90 graus.

## Pastas
- `provisorios`: esterco, adubo.
- `terreno`: lamaçal (arte para uma área lógica 3×2 blocos).
- `colmeia`: quatro estados independentes.
- `produtos`: mel de margarida, mel de girassol, tecido de lã.
- `porteira`: porteira fechada, aberta em 90 graus e poste auxiliar.
- `inventario`: 20 pequenos ícones isolados.
- `animacoes`: quadros alinhados e spritesheets prontos para os dois objetos com estados.

## Importação
Conserve os PNGs RGBA originais; use nearest-neighbor apenas na renderização no jogo.
Para a colmeia, use quadros 1 e 2 para loop de produção e quadro 0 para parada; quadro 3 representa colmeia vazia.
Para a porteira, use quadro 0 fechada e quadro 1 aberta. A colisão lógica deve ser diferente quando aberta.
Confira o mapeamento de IDs em `manifest.json` antes de copiar para os caminhos reais do jogo.
O pacote não foi publicado nem inserido automaticamente no repositório.
