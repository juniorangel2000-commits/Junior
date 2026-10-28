# Contraste e acabamento dos pisos

A praça recebeu um cordão contínuo de pedra ao redor do piso quadriculado, com juntas radiais e variação de luz na borda. A transição para a grama ficou mais curta, evitando que as pedras pareçam dissolver na vegetação.

Os caminhos receberam uma faixa estreita de terra mais escura e quente entre a terra clara e a grama. A textura original de terra foi mantida no acabamento, sem alterar a largura física das passagens ou adicionar obstáculos. Bancos, arbustos, postes e fonte permanecem nos mesmos lugares.

O acabamento é calculado na geração do terreno. O mapa usa oito materiais normalizados e armazena o resultado na textura já existente, sem criar objetos ou refazer bordas durante a caminhada. Pinturas manuais de terreno continuam aplicadas depois dos materiais de base e acabamentos.

## Validação

- 839 testes em 99 arquivos passaram, incluindo normalização dos materiais e circulação.
- TypeScript e build de produção passaram; permanece o aviso existente sobre tamanho do bundle.
- Oito verificações no Chromium passaram. Os dez NPCs trabalharam, saíram para almoçar e voltaram sem atravessar cenário; save e mapas externos preservados, sem erros JavaScript, WebGL ou HTTP.
- Capturas diurna e noturna da praça e dos caminhos conferidas visualmente.

Alterações locais, com backup, sem push, tag ou publicação.
