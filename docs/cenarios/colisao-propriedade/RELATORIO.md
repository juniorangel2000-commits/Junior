# Ampliação de colisões da propriedade

Correção local após o relato na v0.10.0-preview.6. Ainda não incluída no executável publicado.

- Casa: área própria de colisão, separada das fachadas da vila. Laterais ampliadas em 18 pixels para cada lado; fundos em 30 pixels; frente em 35 pixels. Rebaixo central preserva os 36 pixels da passagem da porta e a caixa de pés do jogador.
- Poço: margem adicional de 8 pixels de mundo ao redor da pedra e dos postes. A conversão considera a escala do PNG e não altera sua arte.
- Movimento e navegação usam a mesma geometria. A recuperação de posições antigas existente foi validada para ambos os obstáculos.
- Entrada automática, saída da casa e coleta de água continuam funcionais.

Verificação: TypeScript e build aprovados; 753 testes em 77 arquivos; 15 verificações no navegador, incluindo nove aproximações físicas, recuperação de posições, coleta de oito cargas de água e passagem pela porta. Sem erros de execução ou arquivos ausentes.

A captura oculta as árvores apenas para revisão.

Arquivos principais: `src/data/property-collision.ts`, `src/data/property-well.ts`, `src/data/architecture-collision.ts`, `src/world.ts`, `tests/property-collision.test.ts`, `tests/world-regions.test.ts`, `scripts/qa-property-collision.cjs`. A expectativa de posição de parada em `scripts/qa-rosa-shop.cjs` também acompanha o novo limite.
