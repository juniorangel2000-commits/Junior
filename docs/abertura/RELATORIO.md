# Tela inicial e abertura de novo jogo

A arte aprovada do garoto diante da propriedade é o fundo da tela inicial, com aproximação e deslocamento suaves, chuva, névoa e reflexos. Os relâmpagos acionam trovões; a preferência por movimento reduzido desativa os flashes. O botão de pausar o fundo foi removido. A música e os efeitos respeitam volume e silêncio nas configurações. O navegador pode exigir a primeira interação para liberar o som.

A abertura aprovada com transições (v2, 25 segundos) aparece ao confirmar um novo jogo masculino. A propriedade é preparada atrás do vídeo, sem avançar o relógio. “Pular” fica oculto e bloqueado até concluir essa preparação. Fim antecipado ou erro de vídeo também aguardam os recursos. A perda de foco pausa vídeo e áudio, e a saída limpa ambos.

O vídeo usa duas faixas separadas, música original e efeitos, para preservar as preferências de volume. A trilha embutida no MP4 fica silenciada. A história feminina ainda não foi fornecida; ela começa normalmente, sem substituir a personagem pelo garoto. Continuar uma partida não repete a abertura.

## Ajuste após a preview.19

O movimento foi reforçado após o relato de que parecia uma imagem parada: ciclo de câmera reduzido de 28 para 12 segundos, maior variação de enquadramento, chuva com mais contraste, névoa com deslocamento mais perceptível e folhas ao vento. A preferência por movimento reduzido continua desativando o movimento da imagem, as folhas e os flashes. A chuva permanece ativa. O teste no navegador agora confere a mudança da transformação CSS da imagem, além dos quadros da chuva.

## Validação

- TypeScript e build de produção.
- Suíte existente: 1.227 testes em 138 arquivos.
- Novos testes de seleção da história e testes de tempestade.
- Chromium: arte real, chuva animada, ausência do botão de pausa e controles em 1280×800, 960×640 e 390×844.
- Chromium: reprodução real do vídeo, decodificação das duas faixas de áudio, partida pausada durante a abertura, perda de foco, Pular, limpeza, Continuar e seleção feminina.
- Regressão do player da viagem à cidade: 18 verificações, incluindo bloqueio antes do carregamento e recuperação de falha.
- Regressão de áudio: música, efeitos e silêncio geral.

Metadados e hashes dos arquivos: ASSETS.json. Alterações locais, sem publicação de release.
