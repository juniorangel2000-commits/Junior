# Validação da prévia do editor

Prévia local `0.8.1-editor.1`, gerada em 23/10/2026 sobre o trabalho existente da branch `title-screen-0.5`. A prévia foi disponibilizada no GitHub em 23/10/2026; a versão estável 0.8.0 e o site permanecem iguais. As alterações anteriores de personagem e zoom foram preservadas.

- `npm run check`: passou.
- `npm test`: 271 testes passaram em 23 arquivos.
- `npm run build`: passou; permanece o aviso de tamanho do bundle Phaser.
- `scripts/qa-map-editor.cjs`: pintura e movimento por mouse, desfazer/refazer, proteção, colisão de água/terra, importação inválida, exportação, rascunho separado, cancelar/aplicar/recarregar, recursos esgotados, retorno ao interior, atalhos e layout em 960 e 1280 pixels passaram.
- `scripts/qa-map-editor-desktop.cjs`: aplicativo Electron empacotado, origem `chuva://`, importação, exportação real para arquivo, falha de salvamento sem perda do rascunho, tentativa seguinte bem-sucedida, persistência e F2 passaram.
- Executável Windows x64 gerado com electron-builder e `--publish never`. Conteúdo ASAR conferido: editor presente, protocolo e diretório de salvamento mantidos; binário interno PE32+ x86-64.
- O teste interativo do aplicativo foi executado no Linux. Não houve execução nativa no Windows 11 neste ambiente.

A prévia está em `release/editor-preview/After-Rain-Editor-Preview-Windows-x64.exe`, acompanhada de instruções e SHA-256. A pasta release é ignorada pelo Git.

## Download público conferido

- Pré-release: https://github.com/juniorangel2000-commits/Junior/releases/tag/editor-preview-0.8.1-1
- Executável: https://github.com/juniorangel2000-commits/Junior/releases/download/editor-preview-0.8.1-1/After-Rain-Editor-Preview-Windows-x64.exe
- Código preservado na branch `preview/editor-0.8.1`, commit `217d4c31732c69ec796849edd69c5ef7346e9861`. O trabalho local na branch original foi mantido.
- CI Windows: https://github.com/juniorangel2000-commits/Junior/actions/runs/40038454594 — tipos, 271 testes, build e publicação concluídos.
- Download anônimo integral verificado: HTTP 200, 133324825 bytes, SHA-256 `b528d66c11a53de585a32894904a67cb4a8ab4bbc9657239d573c747b7a515ab`.
- O executável em release/editor-preview foi atualizado para esse pacote gerado no Windows. A execução interativa no Windows 11 continua não testada.
