# After Rain 0.10.0-preview.2 — ferraria, vila e editor

Prévia de desenvolvimento portátil para **Windows 11 x64**. O executável é independente e não requer instalação de Node.js ou servidor.

- Nova fachada e interior comercial de Bento, com circulação do NPC entre a oficina, o interior e a vila; comércio e Economia 6.0 preservados.
- Interior montado com sprites independentes em tamanho nativo, balcão, prateleiras, equipamentos de ferraria e armadureiro. Sem cama ou mobiliário residencial.
- Editor completo por **H dentro da ferraria**: mover, arrastar, dimensionar, guardar/exibir, colisão, suporte, piso, tom da parede e animações. Importação/exportação JSON e salvamento na partida. A posição dos móveis e o progresso dos saves anteriores são preservados.
- Parede verde-acinzentada escura, bordas da janela na mesma cor e acabamento de madeira contínuo em todo o contorno, desenhado atrás dos objetos. Cantos da estrutura sem os blocos pretos sob os apoios.
- Retirada a faixa de pedra da separação entre madeira e lajes; a emenda agora é discreta. A peça antiga continua preservada no acervo, sem ser colocada automaticamente.
- Fogo em loop na fornalha, ondulações na água do barril e chamas/luzes oscilantes nas lanternas. As peças mantêm os efeitos ao serem movidas.
- Aproximação das casas acompanha a construção; o poço bloqueia a abertura de pedra e o poste frontal, permitindo passagem por trás do telhado.
- Mapa interno completo da ferraria com posição correta do personagem e transição automática pela porta. Nenhuma tecla E é necessária para entrar ou sair.
- Vila refinada com novos pisos, decoração, postes iluminados e artes de Bento. Biblioteca e sprites antigos preservados.
- Senha administrativa atualizada conforme solicitação do autor, com somente a derivação criptográfica no cliente.

**Controles:** WASD/setas andar; E conversar/interagir; H editar o interior; I mochila; C fabricar; B construir; M mapa; G soltar corda; Ctrl+Alt tela cheia; roda do mouse/+/- zoom; Esc pausa. **F2** abre o editor de mapas nesta prévia de desenvolvimento; não constitui uma mecânica de progressão do jogador.

A prévia mantém o mesmo local de salvamento. Feche o executável antigo antes de abrir o novo. A biblioteca completa de imagens e os fontes estão disponíveis no repositório.

Validação local: TypeScript, **712 testes em 69 arquivos**, build e Chromium para acabamento visual, editor, arraste da janela, importação/exportação, persistência, rollback de falha de gravação, transições, mapa e administração. O GitHub Actions executa novamente os testes e gera o executável no Windows antes de publicar os arquivos e `SHA256SUMS.txt`. O ambiente local Linux não permite um teste interativo nativo em Windows 11.

Esta prévia não substitui a Release estável 0.9.8.
