# After Rain — abertura chuvosa

**Estado:** implementada na versão 0.5.0 em desenvolvimento. O executável público 0.4.0 continua com a tela anterior. O vídeo do Flow ainda não foi recebido nem incluído.

O jogo passa a se chamar **After Rain**. A abertura acompanha a premissa definida pelo autor: uma chuva transformou pessoas em zumbis, e a vida precisa ser reconstruída depois da catástrofe. Essa narrativa orienta o visual; os sistemas de inimigos e combate continuam fora desta entrega.

![Abertura chuvosa de After Rain](capturas/after-rain-inicio.png)

- [Abertura em 960×640](capturas/after-rain-inicio-960.png).
- [Fundo chuvoso sem texto, para referência do Flow](capturas/after-rain-fundo.png).
- [Cenário base sem interface](capturas/after-rain-cenario-base.png).
- [Criação de personagem após sair do menu](capturas/after-rain-criacao.png).

## Implementado

- Menu com logo tipográfico After Rain, carvão, verde azulado, neblina e detalhes âmbar. Nome atualizado no HUD, título da página, janela e configuração de produto do desktop.
- Cenário real da propriedade, com câmera em trajetória fechada de 36 segundos. Somente a apresentação se move: jogador, relógio, plantações, inventário e save permanecem parados.
- Garoa e névoa desenhadas localmente em um canvas de apresentação, com atualização limitada a 30 quadros/s e resolução reduzida. Sem serviços de clima, shaders remotos ou novos downloads.
- Luz discreta nas janelas, exclusiva da apresentação. A desaturação e os efeitos do menu são removidos ao abrir a criação ou a partida.
- Novo jogo e Continuar, quando houver save válido; Continuar é a ação principal nesse caso.
- Botão Pausar fundo/Animar fundo controla câmera, chuva e eventual vídeo. Preferência de movimento reduzido e aba oculta interrompem animações. Media, callbacks e observador de tamanho são limpos ao sair.
- Suporte a vídeo local opcional, mudo, em loop, com proporção preservada por `object-fit: cover`. Se o codec ou o carregamento falhar, o cenário continua disponível.
- Configuração atual em `src/data/title-background.ts`: `video: null`. Assim, nenhum vídeo inexistente é solicitado.

## Arquivos principais

`src/title-screen.ts` monta o menu e gerencia mídia/acessibilidade; `src/title-weather.ts` desenha chuva/neblina; `src/title-camera.ts` define a trajetória. A integração está em `src/ui.ts`, `src/main.ts`, `src/scenes/ValleyScene.ts` e `src/style.css`.

`index.html`, `desktop/main.cjs` e `electron-builder.yml` usam o novo nome. **AppId, pasta `%APPDATA%\Depois da Chuva`, protocolo `chuva://jogo`, chave `depois-da-chuva-v1` e formato de save versão 2 permanecem estáveis**, para localizar as partidas existentes. Os documentos e as releases históricas conservam seus nomes originais.

## Vídeo no Flow

Use a arte do próprio jogo como referência. O objetivo é uma vinheta de ambientação para o menu, com espaço legível à esquerda e a propriedade à direita.

- Formato recomendado: **MP4/H.264**, 1920×1080, proporção 16:9, 24 ou 30 fps, cerca de **8 segundos**, sem áudio.
- Câmera fixa top-down; chuva fina, névoa leve, vegetação discreta e luz quente na casa. Manter a pixel art e as proporções da referência.
- Sem nome do jogo, legendas, HUD, botões ou marcas d'água dentro do clipe. Esses elementos são aplicados pelo jogo.
- Início e fim com a mesma composição, luminosidade e posição dos objetos. Evitar cortes, relâmpagos, mudanças de câmera e ações que não terminem no estado inicial.
- Se a ferramenta oferecer controle de quadro inicial/final, usar a mesma referência nos dois. Ainda será necessário revisar a emenda depois da exportação.

Prompt sugerido:

> Vídeo em pixel art 2D top-down, fiel à imagem de referência de After Rain. Uma propriedade rural silenciosa em um mundo pós-apocalíptico depois de uma chuva que transformou pessoas em zumbis. Casa antiga de paredes creme e telhado de terracota, vegetação retomando o terreno, caminho de terra molhado com poças. Céu encoberto, tons frios de verde azulado e cinza, garoa diagonal fina, névoa baixa lenta e luz âmbar suave nas janelas como sinal de abrigo. Atmosfera melancólica de sobrevivência e recomeço. Câmera fixa, composição estável, casa à direita, lado esquerdo livre para o menu. Apenas movimentos pequenos e cíclicos de chuva, água e folhas. O último quadro retorna naturalmente ao primeiro. Duração de oito segundos, 16:9, sem áudio. Sem texto, logotipo, interface, botões, visão isométrica, 3D ou fotorrealismo.

Quando o clipe for recebido, copiar para `public/assets/video/menu-loop.mp4`, conferir o conteúdo e a emenda, e configurar:

```ts
export const TITLE_BACKGROUND = {
  video: { src: 'assets/video/menu-loop.mp4', type: 'video/mp4' as const },
};
```

O projeto não exige esse arquivo enquanto `video` for `null`. WebM local também é aceito. Nenhum vídeo de teste deve ser distribuído como se fosse o clipe final.

## Validação

- TypeScript, **135 testes em nove arquivos**, build de produção e sintaxe do desktop aprovados. Permanece o aviso de tamanho do bundle do Phaser.
- Chromium/Playwright: nome After Rain, câmera em movimento sem alterar personagem, relógio, plantações, inventário ou bytes do save. A chuva realmente anima e fica estática junto da câmera ao usar Pausar fundo.
- Layouts 1440×900, 1280×800 e 960×640 sem corte horizontal; botões acessíveis. A revisão da interface também conferiu 390×844.
- Novo jogo, criação, movimento, retorno ao início e Continuar conferidos. Câmera normal, cor, placa de Lia e acompanhamento do personagem são restaurados ao sair do menu; luzes e efeitos exclusivos da abertura são removidos.
- Um save real criado pelo build estático 0.4.0 foi carregado e recarregado sem perder aparência, posição ou inventário. A troca de nome mantém o caminho e o formato dos dados.
- Preferência de movimento reduzido inicia a apresentação parada; mudar a preferência pausa/retoma câmera e chuva.
- Vídeo opcional testado separadamente com MP4 de QA fora do repositório: autoplay mudo, loop, inline, pausa, retomada, visibilitychange simulado, limpeza, codec sem suporte, arquivo inválido, reprodução rejeitada e cancelamento de carregamento. Nenhum clipe do Flow foi usado nesses testes.
- Configuração padrão não cria elemento ou requisição de vídeo ausente; zero erros JavaScript/HTTP na navegação normal.

O teste de vídeo usa uma mídia de teste, e o clipe final ainda precisa de revisão de enquadramento, codec e emenda quando for enviado. A versão 0.5.0 não foi publicada nem testada interativamente em Windows nativo nesta etapa.
