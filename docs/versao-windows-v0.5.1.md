# After Rain 0.5.1 — Windows x64

Correção pequena sobre a 0.5.0, no mesmo projeto e com os mesmos saves.

## Alterações

- **H** é o único atalho de teclado para personalizar o interior da casa.
- **E** continua entrando, saindo e usando a cama. Em outro ponto do interior, orienta usar H sem abrir o editor.
- **B** continua abrindo a construção no exterior; no interior, orienta usar H.
- A dica na HUD mostra **E** para cama/saída e **H** para a personalização.
- Os botões de personalização pelo mouse continuam disponíveis.

As [três propostas de HUD](direcao-visual/hud/README.md) são estudos para escolha. O executável preserva o visual atual da interface.

## Verificação e distribuição

Preparação local concluída: TypeScript, **163 testes em 13 arquivos**, build e fluxo no Chromium. Conferidos E na entrada/saída/cama, H no editor, B externo, pausa, botões pelo mouse e save/reload do interior. Nenhum erro JavaScript ou asset ausente no fluxo.

A geração e publicação do portátil Windows será acionada pela tag **v0.5.1**. O download só deve ser indicado como disponível após a execução concluir e o arquivo público ser conferido.

O armazenamento continua em `%APPDATA%\Depois da Chuva`, com appId `br.depoisdachuva.jogo`, origem `chuva://jogo`, chave `depois-da-chuva-v1` e formato versão 2. O save do navegador permanece separado. Feche o aplicativo antigo antes de abrir a nova versão.

O pacote destina-se a Windows 10/11 de 64 bits e funciona offline, sem Node.js ou servidor. A execução interativa em Windows nativo não foi realizada neste ambiente Linux.
