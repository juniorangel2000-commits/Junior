# Oficina do Ícaro

Interior próprio com 16 objetos originais em atlas transparente e 19 peças posicionadas: bancada de atendimento, armário de peças, bancada com morsa, mesa de reparos, compressor, painel de ferramentas, caixote, motor em manutenção, óleo, livro de ordens, caixa de ferramentas, correias e engrenagens, duas lanternas, banco, tapete e janela. Piso de madeira e parede escura seguem os demais comércios. A fachada já existente foi preservada.

O editor de desenvolvimento abre com H e exporta `After-Rain-Oficina-Editada.json`. Colisões, navegação e efeitos de luz usam os sistemas compartilhados. Os interiores genéricos antigos que não foram modificados são atualizados; alterações personalizadas do jogador permanecem intactas.

Ícaro agora integra a rotina dos dez comerciantes. Atendimento das 08:00 às 12:00 e das 13:30 às 18:00; almoço na praça, retorno à oficina, encerramento do atendimento às 18:00. O estado da rotina é validado e persistido no save. Caminhada mantém os seis passos recebidos em cada direção.

## Validação

- 833 testes em 97 arquivos passaram, incluindo circulação, migração de interiores, preservação de personalizações, compatibilidade de save e rotina sem atravessar obstáculos.
- TypeScript e build de produção passaram; permanece o aviso já existente de tamanho do bundle.
- 16 verificações no Chromium passaram: atlas e poses, comparação pixel a pixel das 49 poses das demais direções, condução com seis passos, atendimento e retrato, interior, editor, exportação JSON, save, fachada, iluminação, entrada e saída caminhando, almoço e retorno, dez rotinas ativas, ausência de erros JavaScript, WebGL e HTTP.
- Captura do interior conferida visualmente; resultados detalhados em `validacao.json`.

Alterações locais. Sem push, tag ou publicação.
