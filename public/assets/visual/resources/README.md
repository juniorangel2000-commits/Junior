# Sprites de recursos

[resource-atlas.png](resource-atlas.png) é um atlas original criado com a ferramenta de geração de imagens, usando as árvores do próprio jogo como referência de paleta, iluminação e linguagem de pixel art. Ele reúne pedras soltas, rocha minerável, arbusto de sementes, fibras, galhos e sucata. Não foi copiado de outro jogo ou de uma biblioteca externa.

A imagem-fonte de **1536×1024 pixels** permanece preservada. Seu SHA-256 é:

```text
f8f19e35ca2d54b4d3c4f9015555f75727bc504ea5d2d53a1a8ca301df9a0d71
```

## Organização e escala

O atlas contém seis células de **512×512 pixels**, em uma grade 3×2. A ordem começa no canto superior esquerdo, da esquerda para a direita e depois de cima para baixo.

| Linha | Coluna | ID | Sprite preparado | Aparência e leitura |
| --- | --- | --- | --- | --- |
| 1 | 1 | `stone` | 30×20 px | Pequenas pedras soltas, baixas, coletáveis com as mãos |
| 1 | 2 | `vein` | 48×54 px | Rocha alta e ancorada, trabalhada com picareta |
| 1 | 3 | `seeds` | 36×36 px | Arbusto arredondado com sementes douradas |
| 2 | 1 | `fiber` | 32×38 px | Hastes finas e altas com fibras claras |
| 2 | 2 | `branch` | 36×24 px | Grupo baixo de galhos de madeira |
| 2 | 3 | `scrap` | 30×28 px | Peças de metal envelhecido e enferrujado |

As dimensões acima descrevem o canvas visual, não o tamanho da colisão. A diferença de silhueta e escala separa as pedras soltas da formação minerável. O arbusto compacto de sementes e as hastes de fibras também permanecem distinguíveis à escala de jogo.

## Adaptação no jogo

`src/visual-assets.ts` carrega a imagem local com a chave `resource-atlas-source`. `src/resource-sprites.ts` recorta cada célula e registra as texturas `asset-<ID>`.

Durante a preparação, o alpha é convertido em valores binários: pixels com alpha **maior ou igual a 160** tornam-se opacos (`255`); os demais ficam transparentes (`0`). Uma faixa lateral da célula também é descartada para evitar fragmentos de células vizinhas. A limpeza remove o halo suave da geração somente na cópia em memória, preservando a fonte.

Após localizar os limites visíveis, o recorte é reduzido proporcionalmente para caber no canvas de destino. A proporção é mantida, com centralização horizontal e base alinhada a um pixel da borda inferior. Esse alinhamento fornece um pivô inferior coerente com o chão. O recorte e a renderização usam nearest-neighbor, sem suavização ou deformação deliberada das silhuetas.

Se a fonte não estiver disponível, a preparação do novo atlas retorna sem substituir texturas. `src/visual-assets.ts` mantém a adaptação dos assets antigos como fallback para as chaves ainda ausentes.

## Limites

- A adaptação deste atlas altera a aparência dos seis recursos. A distribuição fora das trilhas fica em `src/data/resource-layout.ts`; a [documentação da etapa](../../../../docs/recursos-e-margens.md) explica a realocação com IDs preservados. Recompensas e ferramentas exigidas continuam iguais.
- O atlas contém estados estáticos. Animações completas de corte, mineração, queda e coleta continuam dependendo dos sistemas e assets correspondentes.
- O limiar de alpha e as dimensões de destino ficam em `src/resource-sprites.ts`, para permitir ajustes futuros sem modificar a imagem-fonte.
