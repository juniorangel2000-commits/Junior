# Abertura e distribuição após a preview.22

## Diagnóstico e resultado local

O executável portátil usa o extrator NSIS: sua configuração remove e extrai a pasta temporária em cada execução e a remove ao sair. O pacote da preview.22 tem 402.310.695 bytes. Além dessa extração anterior à janela, o jogo carregava recursos de toda a vila e construía uma propriedade descartável antes de mostrar o menu.

No Chromium local com renderização por software, duas medições anteriores ao ajuste levaram 15,79 e 16,00 segundos até o menu. A medição com registro completo encontrou 1.012 recursos de artes/catálogos, 216.590.139 bytes e 1.521 texturas, além da propriedade já construída.

Após adiar o cenário, duas medições deram 2,05 e 4,03 segundos, com quatro texturas do Phaser e sem propriedade construída. As medições posteriores incluíram outra verificação concorrente; são evidência de remoção do trabalho inicial, não uma garantia de tempo para o Windows do jogador. Os arquivos JSON importados pelo servidor de desenvolvimento ainda aparecem no registro de rede, mesmo sem carregar as imagens do mundo.

## Alterações

- O menu é criado primeiro. Recursos e canvases só são preparados quando uma partida ou o editor é solicitado. O carregador deduplica pedidos simultâneos e permite tentar novamente após falha, sem inicializar arte incompleta.
- O novo jogo masculino continua usando o vídeo enquanto prepara a partida. Pular permanece bloqueado até os recursos e o cenário estarem prontos. Carregar partida e a abertura sem vídeo mostram progresso.
- Moradores, interiores e ferraria carregam na primeira entrada na vila. As visitas seguintes reutilizam os atlas preparados.
- As texturas de origem de Bento, Augusto e Rosa são liberadas após construir os atlas: 152 texturas redundantes removidas do gerenciador. Os arquivos originais e os quadros das animações permanecem intactos.
- O build exclui 21,17 MiB de referências, prévias históricas e pisos substituídos. Os originais permanecem em `public/` e no Git. Testes verificam que os recursos usados pelos comércios, ferraria, pisos atuais e referência do editor não fazem parte da exclusão.
- A configuração prepara também um instalador por usuário, além do portátil, com o mesmo diretório de saves e sem apagar dados na desinstalação. O instalador evita a extração completa a cada abertura depois de instalado. A configuração foi validada; o binário Windows será gerado quando a próxima publicação for solicitada.

## Limites da limpeza

Parte de `public/dev` contém sprites usados no jogo. As cópias `previous-*` também são usadas nas migrações de mapas e saves. Sua remoção indiscriminada quebraria conteúdo ou compatibilidade. Esta etapa remove trabalho desnecessário na abertura, arquivos comprovadamente substituídos do pacote e texturas redundantes em memória.

Verificações: `scripts/qa-startup.cjs`, `scripts/qa-world-refresh.cjs`, `scripts/qa-save-library.cjs`, testes de preparação assíncrona e conteúdo da distribuição, suíte completa, build e validação do schema do electron-builder. As melhorias ainda não fazem parte do executável publicado da preview.22.
