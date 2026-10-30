# After Rain 0.10.0-preview.20 — efeitos da tela inicial e reprodução dos vídeos

A chuva da tela inicial está mais suave, com menos chiado e graves e volume reduzido. A imagem tem movimento mais perceptível, com névoa e folhas ao vento.

## Tela inicial

- **Efeitos visuais → Animações e clarões** permite seguir o sistema, ativar os efeitos ou usar movimento reduzido. A escolha fica salva.
- A opção **Ativos** permite ligar os efeitos mesmo se o Windows estiver configurado para reduzir animações.
- Os trovões respeitam volume e silêncio, mas não são mais desativados pela preferência de movimento visual.
- O relógio da tempestade acompanha o tempo real, evitando atrasar os clarões quando a renderização fica lenta.
- O fundo continua sem botão de pausa. Suspender a aba interrompe a animação temporariamente.

## Vídeos

- O protocolo do aplicativo agora aceita leitura de vídeo por intervalos de bytes, permitindo carregar e buscar trechos dos arquivos locais.
- Falhas de mídia e tempo de espera não fecham mais o vídeo como se tivesse terminado normalmente. A cena oferece **Tentar novamente** e permite **Pular** após preparar os recursos.
- Concluir o carregamento não encerra um vídeo ainda em reprodução.
- Os vídeos de caminhada masculino e feminino têm aproximadamente 10 segundos cada. A abertura de novo jogo masculino continua com 25 segundos.

## Validação

Compilação de produção, testes automatizados e verificações no Chromium dos efeitos visuais, preferências de movimento, trovões, carregamento, recuperação de falha e reprodução integral dos dois vídeos de caminhada pelo serviço de intervalos de bytes utilizado no desktop. Essas verificações não reproduzem o computador Windows específico do jogador.

Saves e progresso anteriores continuam compatíveis. Baixe `After-Rain-0.10.0-preview.20-Windows-x64.exe`. Confira a integridade com `SHA256SUMS.txt`.
