# Fazendeiro enviado pelo jogador

Integração local preparada em 23/10/2026, junto da fazendeira. Não publicada em Release.

Origem: `e_um_personagem_fazendeiro.zip`.
SHA-256: `fc946d66d5ad64c038bf46991978588e9b0ef0f8f4ade0a7bd6eac0b9b8bf96d`.

O pacote contém 72 PNGs de 256×256: uma pose parada e oito quadros de caminhada
em cada uma das oito direções. Os arquivos e o `metadata.json` foram preservados
byte a byte em `public/assets/visual/characters/farmer-male/`.

## Integração

- A seleção oferece **Fazendeira** e **Fazendeiro**, ambos com visual fixo e campo
  de nome. Não há controles de pele, cabelo, roupa ou acessórios.
- O fazendeiro usa todos os oito quadros originais da pasta `Walking`, em ordem.
  A fazendeira mantém os seis quadros da pasta `Walk` e sua imagem anterior.
- O atlas e a prévia respeitam o número de quadros de cada personagem; não se
  descartam os últimos quadros nem se completam sequências com poses repetidas.
- A velocidade dos dois permanece 84 pixels/s, com um ciclo de passos a cada
  48 pixels percorridos: a prévia usa 14 quadros/s no fazendeiro e 10,5 na fazendeira.
- O fazendeiro mantém os pixels nativos do PNG em quadros de textura 192×256,
  retirando apenas margens transparentes, com origem fixa (128, 240). O tamanho
  exibido no mundo continua 48×64. Não há redução prévia da textura: a seleção
  e o zoom usam a arte detalhada, com as oscilações originais preservadas.
- `characterId: farmer-male` identifica o fazendeiro no salvamento. Partidas com
  `farmer-female` e partidas antigas sem esse campo continuam válidas. A escolha
  não altera o inventário, os objetos já recolhidos ou as edições salvas do mapa.

## Prévias e verificações

`selecao.png` mostra a seleção dos dois personagens; `no-jogo.png`, o fazendeiro
no cenário. `oito-direcoes.png` reúne as poses paradas e `caminhada.png` reproduz
as oito caminhadas em PNG animado (APNG), sem redução de cores ou resolução.
`caminhada.gif` é uma alternativa com paleta limitada. `zoom-200.png` mostra a
textura no zoom máximo. As imagens usam o próprio renderizador do jogo.

Checks, 301 testes em 23 arquivos e build passaram. Os testes de movimento,
colisões, estabilidade a 30/60/144 FPS e cadência da prévia cobrem os dois
personagens. O salvamento verifica os dois IDs com progresso e mapa editado.

O roteiro `scripts/qa-character.cjs` percorre ambos no Chromium e compara todos
os 128 quadros com os pixels nativos originais e com os atlas do mundo, incluindo
uma contagem para detectar qualquer pixel visível recortado. Também testa
troca de personagem durante a prévia animada, layout, teclas nas oito direções,
salvar/recarregar dentro e fora de casa, interação diagonal, retrato de Lia e
erros de JavaScript/carregamento. A rodada completa passou para os dois personagens.

As prévias podem ser regeneradas, após esse roteiro, com
`python scripts/build-character-previews.py` (requer Pillow).
