# Validação da prévia do editor

Prévia local `0.8.1-editor.1`, gerada em 23/10/2026 sobre o trabalho existente da branch `title-screen-0.5`. Este registro descreve a validação local antes da disponibilização da prévia. A publicação do executável é feita pelo workflow editor-preview.yml, mantendo a versão estável e o site atuais. As alterações anteriores de personagem e zoom foram preservadas.

- `npm run check`: passou.
- `npm test`: 271 testes passaram em 23 arquivos.
- `npm run build`: passou; permanece o aviso de tamanho do bundle Phaser.
- `scripts/qa-map-editor.cjs`: pintura e movimento por mouse, desfazer/refazer, proteção, colisão de água/terra, importação inválida, exportação, rascunho separado, cancelar/aplicar/recarregar, recursos esgotados, retorno ao interior, atalhos e layout em 960 e 1280 pixels passaram.
- `scripts/qa-map-editor-desktop.cjs`: aplicativo Electron empacotado, origem `chuva://`, importação, exportação real para arquivo, falha de salvamento sem perda do rascunho, tentativa seguinte bem-sucedida, persistência e F2 passaram.
- Executável Windows x64 gerado com electron-builder e `--publish never`. Conteúdo ASAR conferido: editor presente, protocolo e diretório de salvamento mantidos; binário interno PE32+ x86-64.
- O teste interativo do aplicativo foi executado no Linux. Não houve execução nativa no Windows 11 neste ambiente.

A prévia está em `release/editor-preview/After-Rain-Editor-Preview-Windows-x64.exe`, acompanhada de instruções e SHA-256. A pasta release é ignorada pelo Git.
