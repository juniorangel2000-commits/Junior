# After Rain 0.9.2 — floresta e editor

Prévia para Windows 11 x64. Execute `After-Rain-0.9.2-Windows-x64.exe`.

## Novidades

- Árvores frondosas e pinheiros com seis sprites, portes variados e distribuição estável.
- Piso de floresta com folhas, musgo e transições suaves; trilha integrada ao chão da mata.
- Seis novas sprites de rochas, pedras nas margens e dentro do lago; deck de madeira removido.
- Ondulações animadas na água da floresta e da propriedade.
- Editor disponível nos dois cenários, com as 21 novas sprites ambientais na paleta.
- Saída e ponto de chegada configuráveis para os dois sentidos da transição.

## Como editar

1. Na propriedade ou na Floresta Antiga, pressione **F2**. Na floresta também há o botão **Editar**.
2. Use **Ponto de chegada** para escolher onde aparece ao entrar nesse cenário. Use **Saída para o outro mapa** para escolher onde a tecla E troca de cenário. Clique em um ponto de chão livre.
3. Pinte o terreno ou posicione, mova e remova objetos. As rochas do lago e juncos também podem ser colocados sobre água. As novas sprites ambientais são elementos de decoração; os recursos de coleta continuam na paleta existente.
4. Use **Aplicar e jogar** para salvar no jogo. **Cancelar** descarta a sessão. Desfazer/refazer e rascunhos continuam disponíveis.
5. Use **Exportar** em cada cenário para guardar seu arquivo: `After-Rain-propriedade-mapa.json` e `After-Rain-forest-mapa.json`. Envie os dois arquivos para incorporar suas alterações à próxima atualização. Importe cada arquivo no cenário correspondente.

Propriedade e floresta têm dados e rascunhos separados. Os marcadores são destacados no editor: chegada em verde e saída em dourado. Áreas fixas importantes e clareiras dos animais ficam protegidas.

## Jogar

**WASD/setas:** caminhar. **E:** interagir e atravessar pela saída sinalizada. Na propriedade, use as mãos vazias para entrar na floresta. **M:** mapa real do cenário atual. **+/- e roda:** zoom. **Esc:** pausa.

Animais acolhidos, inventário, construções, plantações e progresso anterior continuam salvos. As duas ordens de coleta dos objetos da casa seguem os testes existentes.

## Validação

331 testes automatizados; TypeScript e build. Chromium: transições, mapa, movimento, pausa, dez acolhimentos únicos, retorno e recarga; água animada; edição na floresta; paleta nova; rocha sobre água; exportação/importação JSON; rejeição de arquivo do outro cenário; saídas e chegadas personalizadas nos dois sentidos, inclusive após recarregar.

O executável é gerado e conferido pelo GitHub Actions em Windows. Não houve teste interativo do executável no Windows neste ambiente Linux.
