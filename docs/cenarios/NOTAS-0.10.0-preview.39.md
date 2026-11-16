# After Rain 0.10.0-preview.39 — Bancadas, fabricação e artes novas

**Fabricação separada**
- A tecla **C** abre a fabricação feita sem bancada: cordas, cabos, ferramentas de pedra,
  tábuas com machadinha, preparados e a fogueira.
- Usar a **bancada de trabalho** abre só as receitas dela: lâmina, serrote, tesoura, balde,
  serrar tábuas, espada, mochila, botas e acessório de pesca.
- Nova **bancada de construção** (8 tábuas serradas, 6 pedras e 4 cavilhas, com o martelo):
  porta, janela, banco, forja, luminária, bomba, máquinas e kits.
- Cada janela tem filtros por categoria.
- As duas bancadas têm arte nova e ocupam **2 blocos** de largura. Uma bancada já colocada
  cresce para o lado se houver espaço; senão continua com 1 bloco.

**Cerca sem módulo**
- A cerca é construída direto no modo de construção, com 3 madeiras por trecho. O reparo
  custa 2 madeiras.
- Módulos de cerca guardados na mochila viram 3 madeiras cada.

**Abrigos à noite**
- Galinheiro, curral, aprisco e chiqueiro escurecem à noite, com lampiões na parede.
- O chiqueiro ficou só com o chão de palha.

**Artes novas**
- Esterco, adubo, méis de margarida e de girassol, tecido de lã e ícones próprios para
  cavilhas, ervas, ervas raras, mapa antigo, mochila, botas e peças metálicas.
- A fogueira portátil aparece acesa no chão enquanto você cozinha nela.
- Três abelhinhas voam em volta da colmeia de dia.

**Desempenho**
- Os animais usam um terço da memória de vídeo de antes, com a mesma imagem. O instalador
  ficou cerca de 15 MB menor.

Partidas anteriores continuam compatíveis.

Validação: TypeScript, 2.109 testes em 240 arquivos e build de produção aprovados. No
Chromium foram conferidos as janelas de fabricação, as bancadas de 2 blocos, os interiores
à noite, as abelhas, a fogueira, os porcos, as conservas e as idas e voltas entre cenários.
