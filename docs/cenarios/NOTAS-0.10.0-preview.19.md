# After Rain 0.10.0-preview.19 — abertura e tela inicial

A tela inicial agora usa a arte do garoto diante da propriedade, com chuva, névoa, movimento sutil e trovões sincronizados com relâmpagos. A música acompanha a cena. O controle para pausar o fundo foi removido; a aba em segundo plano suspende a animação, e a preferência por movimento reduzido desativa os flashes.

## Novo jogo

- A abertura aprovada, com transições, sonoplastia original e a frase “E FOI ASSIM QUE TUDO COMEÇOU...”, acompanha o início de um novo jogo masculino.
- A propriedade é preparada enquanto o vídeo reproduz. O relógio da partida fica pausado e **Pular** só aparece quando os recursos estiverem prontos.
- Continuar uma partida não repete a abertura. A personagem feminina começa normalmente enquanto sua abertura específica não estiver disponível.
- Música e efeitos têm volumes independentes. O vídeo pausa ao perder o foco e o som respeita o silenciamento.

## Viagem à cidade

- Andar até o acesso da estrada oferece a confirmação **Ir até a cidade?**, sem exigir a tecla de interação.
- A viagem usa o vídeo correspondente ao personagem masculino ou feminino.
- A trilha continua do vídeo ao menu de expedições. Ao iniciar uma rodada, um efeito de suspense faz a passagem para os sons de combate.

Saves, recompensas, pets e melhorias anteriores continuam compatíveis.

## Validação

Build de produção, 1.229 testes automatizados, verificações no Chromium da tela inicial em três tamanhos, reprodução real dos vídeos e das faixas de áudio, bloqueio de Pular, perda de foco, limpeza dos controles e retorno por Continuar. Regressões de áudio e do player da viagem à cidade também passaram. O pipeline Windows repete TypeScript e testes antes de gerar o pacote.

Baixe `After-Rain-0.10.0-preview.19-Windows-x64.exe`. O executável é portátil. A integridade pode ser conferida com `SHA256SUMS.txt`.
