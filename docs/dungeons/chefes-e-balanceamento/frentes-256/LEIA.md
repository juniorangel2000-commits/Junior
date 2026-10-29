# Monstros — referências frontais em pose neutra

Sete PNGs RGBA transparentes, cada um com exatamente 256 × 256 pixels:

- 10-demolidor-south.png — operário sem martelete, mãos vazias.
- 20-sentinela-south.png — agente de choque com escudo apoiado ao lado.
- 30-acorrentado-south.png — roupas vinho e correntes em repouso.
- 40-contaminado-south.png — traje oliva e máscara de gás.
- 50-devorador-south.png — corpo largo e avental vinho.
- zumbi-entregador-south.png — jaqueta vermelha e mochila.
- zumbi-moradora-south.png — casaco verde azulado e saia escura.

Todos estão de frente, com os dois pés apoiados na mesma linha e os braços em repouso. O Demolidor e os dois zumbis já estavam neutros; as outras quatro frentes foram redesenhadas para retirar a passada avançada.

Para animar:
- Preserve a tela de 256 × 256 em todos os frames.
- Referência de origem: (128, 235); a arte opaca termina dois pixels acima.
- Preserve as proporções e o enquadramento da referência.
- Sugestão: quatro frames de caminhada por direção, na ordem south, west, east, north.
- Em spritesheet: quatro colunas e quatro linhas; 1024 × 1024 no total.
- A escala maior do Devorador será aplicada pelo jogo, sem ampliar a tela do PNG.

Estas são fontes para produzir as animações definitivas. Os atlas de caminhada do jogo permanecem provisórios até a integração das animações.
