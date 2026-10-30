# Tela inicial e abertura de novo jogo

A arte aprovada do garoto diante da propriedade é o fundo da tela inicial, com aproximação e deslocamento suaves, chuva, névoa e reflexos. Os relâmpagos acionam trovões; a preferência por movimento reduzido desativa os flashes. O botão de pausar o fundo foi removido. A música e os efeitos respeitam volume e silêncio nas configurações. O navegador pode exigir a primeira interação para liberar o som.

A abertura aprovada com transições (v2, 25 segundos) aparece ao confirmar um novo jogo masculino. A propriedade é preparada atrás do vídeo, sem avançar o relógio. “Pular” fica oculto e bloqueado até concluir essa preparação. Fim antecipado ou erro de vídeo também aguardam os recursos. A perda de foco pausa vídeo e áudio, e a saída limpa ambos.

O vídeo usa duas faixas separadas, música original e efeitos, para preservar as preferências de volume. A trilha embutida no MP4 fica silenciada. A história feminina ainda não foi fornecida; ela começa normalmente, sem substituir a personagem pelo garoto. Continuar uma partida não repete a abertura.

## Ajuste após a preview.19

O movimento foi reforçado após o relato de que parecia uma imagem parada: ciclo de câmera reduzido de 28 para 12 segundos, maior variação de enquadramento, chuva com mais contraste, névoa com deslocamento mais perceptível e folhas ao vento. A preferência por movimento reduzido continua desativando o movimento da imagem, as folhas e os flashes. A chuva permanece ativa. O teste no navegador agora confere a mudança da transformação CSS da imagem, além dos quadros da chuva.

## Chuva mais limpa

A ambiência agora usa dois filtros suaves em 1.700 Hz e remoção dos graves abaixo de 140 Hz. O nível RMS foi reduzido de aproximadamente 0,0283 para 0,012 (cerca de 7,5 dB), preservando o estéreo, o controle independente dos efeitos e a emenda sem estalo. A verificação no Chromium confere o volume e a redução das variações rápidas associadas ao chiado.

O movimento da imagem respeita `prefers-reduced-motion`, inclusive a regra global de acessibilidade. Isso pode explicar uma imagem sem movimento no Windows; não foi reproduzida uma falha de ativação com a preferência normal. Chuva e movimento não dependem do botão de som.

## Ativação dos efeitos visuais

A preferência de movimento reduzido reproduz a combinação relatada: chuva ativa, imagem estática e ausência de clarões. O menu agora oferece **Efeitos visuais → Animações e clarões**, com **Seguir o sistema**, **Ativos** e **Reduzidos**. A escolha é persistida separadamente do save. A opção Ativos permite ativar os efeitos explicitamente mesmo com a preferência do sistema. Não há botão para pausar o fundo.

O trovão acompanha o relógio da tempestade independentemente da preferência visual, respeitando volume e silenciamento. O relógio usa o tempo transcorrido entre quadros, sem o limite de 100 ms que atrasava os ciclos durante renderização lenta. Suspender a aba reinicia a referência de tempo para evitar acumular esse intervalo.

O teste no Chromium verifica chuva ativa e imagem estática sob movimento reduzido, som de trovão nesse modo, ativação explícita da imagem, clarão real no canvas e persistência da preferência ao retornar ao menu. Isso reproduz um caminho possível; não confirma a configuração específica do computador do jogador.

## Validação

- TypeScript e build de produção.
- Suíte existente: 1.227 testes em 138 arquivos.
- Novos testes de seleção da história e testes de tempestade.
- Chromium: arte real, chuva animada, ausência do botão de pausa e controles em 1280×800, 960×640 e 390×844.
- Chromium: reprodução real do vídeo, decodificação das duas faixas de áudio, partida pausada durante a abertura, perda de foco, Pular, limpeza, Continuar e seleção feminina.
- Regressão do player da viagem à cidade: 18 verificações, incluindo bloqueio antes do carregamento e recuperação de falha.
- Regressão de áudio: música, efeitos e silêncio geral.

Metadados e hashes dos arquivos: ASSETS.json. Alterações locais, sem publicação de release.

## Vídeo interrompido na viagem

O protocolo do aplicativo desktop foi configurado para mídia (`stream: true`) e os MP4/WebM agora recebem respostas por intervalo de bytes: `Accept-Ranges`, `Content-Length`, `Content-Range` e status 206 para requisições válidas. Isso permite carregar o cabeçalho e outros trechos do arquivo sem tratar toda requisição como um arquivo genérico. Intervalos inválidos recebem 416.

O player compartilhado não considera mais um erro de mídia ou timeout como uma conclusão normal. Em falha, mantém a cena e oferece **Tentar novamente**, com **Pular** disponível apenas após preparar os recursos. A perda de foco não dispara tentativas automáticas em uma cena com falha. O carregamento concluído não encerra um vídeo que ainda está reproduzindo.

Validação: 11 testes dos bytes servidos (arquivo completo, intervalos abertos, fechados, sufixos e inválidos) e 2 testes da seleção dos vídeos. Chromium reproduziu os dois vídeos da estrada até o fim, em velocidade normal, pelo mesmo handler de bytes usado no desktop: 9,963 segundos cada, com requisições 206 reais. O player foi testado com falha simulada e repetição bem-sucedida. Esses testes não reproduzem o Windows do jogador nem confirmam qual erro ocorreu naquela execução.
