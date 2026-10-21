# Personagem — arte e personalização

Os quatro arquivos `farmer-*.png` são arte original gerada a partir da ficha aprovada em `referencias/otimizadas/webp/outras/personagem_original.webp`. As fontes permanecem intactas. Os PNGs antigos `baixo_*`, `esquerda_*`, `direita_*` e `cima_*` continuam disponíveis como fallback.

| Fonte | Dimensão | Conteúdo | SHA-256 |
| --- | --- | --- | --- |
| `farmer-bun.png` | 1230×1278 | Coque, 16 poses | `b97f293e407254c579a48ad3e23115b8b7e75a4b7a3178ce16a1a2dcdf30757d` |
| `farmer-short.png` | 1230×1278 | Curto, 16 poses | `a4837f51083bf617aa5a41d1a8684e1be63473d16d6eae8c7dfcd6293482f649` |
| `farmer-long.png` | 1230×1278 | Longo, 16 poses | `41c4d5e00b27b060603add5b3dbe71b751c69921856f63c8ddda55aa915d49cd` |
| `farmer-bags.png` | 2172×724 | Quatro vistas da bolsa | `9c09e81b1c59a25c6e9eeb78dd99181303dfac83f600ec3e9a458174e45a54eb` |

Cada folha de personagem tem quatro colunas de animação e quatro linhas: frente, esquerda, direita e costas. A bolsa usa uma única linha na mesma ordem. O código calcula as células pela dimensão real das imagens, sem presumir células quadradas.

`src/character-sprites.ts` prepara cópias em memória: alpha ≥170 fica opaco; somente o maior componente conexo de cada célula é mantido para descartar pontos soltos e fragmentos da linha vizinha. O recorte proporcional usa uma escala comum para os quatro quadros de cada direção. O canvas final é **48×64**, com arte de até 60 pixels de altura e pés na base. Não se alargam os perfis para preencher o canvas.

Máscaras de materiais preservam a luminosidade ao aplicar pele, cabelo, macacão e camisa. A bolsa é uma camada opcional de 12×13, alinhada ao quadril. Os resultados personalizados usam cache limitado. Toda a renderização usa nearest-neighbor, sem suavização.

Veja [escopo, capturas e validação](../../../../docs/personagem-e-criacao.md).
