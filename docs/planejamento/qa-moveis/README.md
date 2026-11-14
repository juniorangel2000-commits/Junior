# Casa do jogador — móveis e acabamentos

Conferência no Chromium em 14/11/2026, com Vite em 127.0.0.1:5190.

- `scripts/qa-home-furniture.cjs`: sete sprites originais carregadas, proporções
  preservadas, cadeira com 42 px de altura, estante fora da janela (9,7).
- Troca de piso/parede pelo editor: escuro/sálvia, pedra/argila e claro/creme.
- Vaso movido de (2,6) para (1,6): base antiga liberada e nova bloqueada.
- Acesso à cama e saída mantidos; disposição preservada ao sair e voltar à casa.
- Sem erros de JavaScript. Medidas e resultados em `validacao.json`.
- `scripts/qa-kitchen.cjs`: nova arte do fogão, abertura do caderno, ingredientes
  insuficientes, preparo de omelete, persistência e consumo do prato aprovados.
- Quatro testes em `tests/home-layout-migration.test.ts` conferem a mudança da
  estante em saves antigos, preservação de casas reorganizadas, idempotência,
  não mutação da entrada e proteção de quem salvou dentro da casa.

As capturas são do jogo real. `casa-moveis.png` mostra a disposição inicial;
`casa-reorganizada.png` mostra o vaso movido pelo editor.
