# Teste da Propriedade na Godot

Experimento para avaliar a Godot 4 (branch `experimento/godot`). **O jogo de verdade continua
em Phaser** e não muda: este projeto não entra nas versões publicadas nem lê as suas partidas.

## Abrir

1. Baixe a **Godot 4.4** (gratuita, uns 100 MB, sem instalar): https://godotengine.org/download
   — a versão "Standard", não a ".NET".
2. Abra a Godot, clique em **Importar**, escolha a pasta `godot-teste` (o arquivo
   `project.godot`) e depois **Importar e editar**. Na primeira vez ela prepara as imagens.
3. **F5** (ou o botão ▶ no canto de cima) roda a Propriedade. Ande com **WASD** ou as setas.

## Pintar o terreno

1. Na árvore de cenas (à esquerda), clique em **Pintura**.
2. Embaixo, abra a aba **TileMap**. Aparecem os 9 materiais na ordem: grama, floresta, campo,
   estrada seca, estrada úmida, terra de plantio, areia, musgo e água.
3. Escolha um material e pinte no mapa. **O terreno de verdade muda na hora**, com as bordas
   irregulares e a água animada. Ferramentas úteis da aba: lápis (bloco a bloco), retângulo,
   balde (preenche uma área) e borracha. Botão direito apaga.
4. **Ctrl+S** salva.

A água bloqueia o personagem: pintar água cria lago ou rio onde quiser.

## Mexer nos objetos

- Árvores, casa, poço, cercas, pedras e ponte estão em **Objetos** (na árvore de cenas).
- Clique num objeto no mapa e **arraste** para mudar de lugar. **Ctrl+D** duplica;
  **Delete** apaga.
- Para pôr um objeto novo: arraste uma imagem de `arte/objetos` (no painel **Sistema de
  arquivos**, embaixo à esquerda) para dentro do nó **Objetos**.
- Quem fica na frente de quem é automático (pela posição vertical), como no jogo.

## Como foi feito

- `ferramentas/preparar_artes.py`: copia do jogo os materiais do terreno, as artes dos
  objetos e os quadros do personagem; lê o mapa extraído do jogo rodando.
- `ferramentas/montar_propriedade.gd`: monta `cenas/propriedade.tscn` a partir de
  `dados/propriedade.json` (rode só para recomeçar do zero; apaga o que foi editado).
- `shaders/terreno.gdshader` e `scripts/terreno.gd`: o terreno desenhado a partir da pintura.
- `scripts/jogador.gd`: o personagem andando nas 8 direções.

## O que ainda não tem

Horta funcionando, cavalo, animais, dia e noite, sombras, interface e colisão com árvores e
casas. É só a Propriedade para avaliar o editor, o mapa e o desempenho.
