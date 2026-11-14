# Abelhas e patos da criação

Implementado no branch `release/v0.10.0-preview.35`, ainda sem publicação. Segue o plano
aprovado em `docs/planejamento/ANIMAIS-E-RECEITAS.md`.

## Abelhas

Código em `src/systems/beekeeping.ts` (`save.beekeeping`) e no sistema de máquinas (máquina `beehive`).

1. **Colmeia vazia:** serviço do Augusto, 120 C. É um serviço porque a loja dele sorteia o estoque do dia.
2. **Nos Campos Abertos:** usar a colmeia vazia coloca-a no chão, a até 2 passos do tronco de um **ipê em pé**. Cabe uma por ipê, até 6 no total.
3. **Enxame:** a cada 5 dias há **40%** de chance de um enxame ocupar a colmeia. O sorteio vem do calendário e da colmeia, então recarregar o save não sorteia de novo. Com enxame, a arte muda de desbotada para colorida.
4. **E na colmeia:** com enxame, vira o item **colmeia povoada**; sem enxame, a colmeia vazia volta para a mochila.
5. **Na Propriedade:** a colmeia povoada é instalada como as máquinas (só ao ar livre).
   - Ela faz **mel a cada 4 dias** e **cera a cada 3 coletas**.
   - Se o mel ficaria pronto no **Inverno**, ele passa para o primeiro dia da Primavera.
   - Enquanto trabalha, abelhinhas aparecem na entrada. Quando o mel fica pronto, aparece o balão do pote.
   - A colmeia instalada não volta para a mochila: E só recolhe o mel.
6. **Mel de flor:** margaridas ou girassóis **maduros** a até 3 passos dão mel de margarida ou mel de girassol. As receitas usam o mel comum.

Comércio: Amélia compra mel (40), cera (30), mel de margarida (70) e mel de girassol (75).
Nilo compra os méis de flor por 85 e 90. Nenhuma loja vende esses produtos.

## Patos da criação

Os patos do lago da Floresta continuam sendo fauna ambiente. Os da criação são outros:
`farm-duck-1` a `farm-duck-4`.

- **Compra:** a Rosa vende cada pato por 300 C, no serviço "Acolher um pato". Ele vai para a Propriedade, como a galinha.
- **Moradia:** mora no **galinheiro**, junto com as galinhas (`allowedAnimals: chicken e duck`).
- **Ovo de pato:** cada pato alimentado bota um a cada **2 manhãs**, num ninho livre (`site.duckEggs`). Nunca cai no mesmo ninho de um ovo de galinha.
- **Pena:** E no ninho recolhe o ovo de pato, e **a cada 4** ovos de pato recolhidos vem uma pena (`site.duckCollected`).
- **Comércio:** Rosa compra o ovo de pato (14); Celina compra a pena (12).

Com o mel e o ovo de pato, nenhuma receita da cozinha fica mais sem fonte.

## Arte (SpriteCook)

- Colmeia: a colmeia povoada é a arte com abelhas desenhadas por script; a colmeia vazia é a mesma arte, desbotada.
- Cera, ninho com ovo de pato e pena.
- Méis de flor: o ícone do mel em outro tom.
- Os ids estão em `public/assets/visual/kitchen/spritecook-assets.json` e em `public/assets/visual/farm/interior/spritecook-assets.json`.

## Verificação

- Testes: `tests/beekeeping.test.ts` (10) e `tests/ducks.test.ts` (6).
- Navegador:
  - `scripts/qa-beekeeping.cjs`, com capturas em `docs/planejamento/qa-abelhas/`;
  - `scripts/qa-ducks.cjs`, com capturas em `docs/planejamento/qa-patos/`.
