# Polimento local de natação após a versão 0.9.3

Pedidos atuais: animar somente o corpo submerso; corrigir partes quebradas; ondulações atrás da personagem inteira; caminhar no raso e nadar apenas em água profunda. O usuário confirmou a última opção após esclarecimento.

## Comportamento

A caminhada usa seus quadros originais completos e sincronizados entre parte visível e parte submersa até a água chegar perto do pescoço. O limiar `deepThreshold` passou a 0,9. Em água profunda, a cabeça permanece original e o corpo usa um ciclo próprio de movimentos suaves dos braços e pernas. Ao parar, os movimentos desaceleram sem reiniciar a pose. A silhueta mantém a cor e a transparência da base.

Os membros usam os pixels originais em segmentos rígidos, com reforço arredondado da largura dos braços na silhueta, sem esticar os PNGs ou deformar as botas. Os apoios dos ombros são localizados pelas mangas; há sobreposição nas articulações. As pernas ficam próximas, com flexão mais visível dos joelhos e elevação alternada dos pés. A bota inteira recebe o mesmo movimento, inclusive quando a ponta cruza o divisor central numa diagonal. Pés ocultos/sobrepostos mantêm o grupo original, sem duplicar membros invisíveis. Os atlas são gerados uma vez por aparência e as bordas têm alfa binário para preservar pixels definidos.

A orientação visual mais recente substitui o pedido anterior de manter todos os círculos atrás do corpo. A onda principal agora usa dois arcos contínuos: o traseiro fica atrás da silhueta; o dianteiro passa sobre o corpo submerso e a superfície da água, abaixo da cabeça. Leves irregularidades e traços finos dão uma curva orgânica. Não há recorte por células quadradas da silhueta. O rastro permanece na água ao fundo. Os dois Graphics são reutilizados e descartados juntos; funciona em WebGL e Canvas sem ler pixels ou criar texturas por frame.

## Arquivos

- `src/swimming/body-animation.ts`: preparação dos segmentos, ciclo fechado e controle de cadência.
- `src/swimming/renderer.ts`: atlas do corpo; preservação da cabeça e da caminhada no raso.
- `src/swimming/water-effects.ts`: arcos dianteiro/traseiro contornando a linha da água, sem cortes quadrados.
- `src/swimming/config.ts`: limiar de profundidade.
- `tests/swimming-body.test.ts`, `tests/swimming-controller.test.ts`, `tests/player-swimming.test.ts`: ciclo, continuidade, pernas próximas, caminhada rasa e velocidade.
- `scripts/qa-swim-body.cjs`: duas personagens, oito vistas, doze fases, recortes, partes conectadas, volume, cabeça original, pixels definidos e arcos atrás/à frente do corpo e proteção da cabeça; capturas reais do Phaser.
- `scripts/qa-swimming.cjs`: regressão nas margens reais, colisões, editor, cenas e salvamento.

## Ajustes e evidências

`SWIM_BODY_MOTION`: 0,72 ciclo/s em movimento e 0,28 parado; suavização de cadência 5. `swimBodyPose` define amplitudes das articulações. `SWIMMING_CONFIG` mantém velocidade de nado de 55%, opacidade de 45% e recortes individuais das cabeças.

Prévias em `nado-corpo/previa-animada.gif` (ampliada) e `nado-corpo/oito-direcoes.gif` (todas as vistas). Validações gráficas em `nado-corpo/validacao.json` e `validacao-canvas.json`; regressão em `../cenarios/validacao-nado.json`.

Os 128 PNGs oficiais permanecem intactos e nenhum deles ultrapassa a área do atlas. TypeScript, 368 testes e build fazem parte da verificação desta etapa; os relatórios do navegador registram seus próprios resultados e datas.

O ciclo adapta a arte existente; não é uma animação nova desenhada quadro a quadro. Novos personagens precisam de conferência das articulações e dos recortes. As alterações estão locais, sem nova publicação: a Release 0.9.3 existente não foi substituída.

## Prévia da sequência completa

Pedido posterior: GIF entrando na água e nadando, com oscilação vertical suave. A amplitude de flutuação passou a 1 pixel do mundo; as câmeras da propriedade e da floresta acompanham a posição lógica do Player, sem incorporar o balanço visual do sprite. O zoom, as colisões e a posição salva continuam usando as mesmas coordenadas.

Captura real em `entrada-na-agua/entrada-nado-flutuacao.gif` e `.mp4`, com 166 quadros a 12 fps (13,83 segundos): caminhada em terra, entrada gradual até o pescoço, nado frontal, flutuação parada, nado lateral e retorno à margem. O roteiro é reproduzível por `scripts/capture-water-transition.cjs`. `entrada-na-agua/captura.json` registra os estados, a profundidade, as posições e a câmera em cada quadro; a pausa na água verifica flutuação vertical visível com câmera estável.

A prévia completa foi atualizada com os arcos envolvendo a personagem, braços mais arredondados e pernadas ampliadas. Os testes verificam que o arco frontal realmente cruza a silhueta submersa e permanece abaixo da cabeça, além de conferir que a silhueta não ganha partes soltas nas duas personagens e nas oito direções.

## Cabelo submerso e desaparecimento abaixo da cintura

`src/swimming/underwater-appearance.ts` aplica uma queda suave de opacidade da cintura ao começo dos pés. O corpo e a camada de água recebem o mesmo degradê, evitando uma marca residual das botas. A silhueta conserva o contorno e os pixels definidos; somente o alfa varia por linha. No nível dos pés resta 2,5% da opacidade da textura, cerca de 1,1% depois da opacidade global do corpo. A cabeça e a caminhada visível acima da água usam as texturas originais sem o degradê.

Uma camada própria projeta a parte inferior do cabelo original da fazendeira sob a água. A extração ignora o rosto e usa a paleta e o contorno das sprites fornecidas; não modifica os PNGs. O desenho acompanha posição, direção, escala e flutuação, atrás do corpo submerso. O recorte na linha da água e o desvanecimento das pontas mantêm essa sombra dentro da água. O fazendeiro não recebe essa camada extra.

Parâmetros em `SWIMMING_CONFIG`: `footVisibility`, `hairShadowOpacity`, `hairShadowDrop` e `hairShadowReach`. As linhas da cintura e dos pés são medidas por personagem e direção. Os atlas são preparados uma vez e funcionam em WebGL e Canvas. Os testes gráficos verificam o alfa progressivo em cada linha, os pés com alfa máximo 7/255, a presença do cabelo nas oito vistas da fazendeira e sua ordenação e alinhamento.

Prévia ampliada: `nado-corpo/cabelo-e-degrade.gif`. A sequência completa atualizada está exportada como `entrada-na-agua/entrada-nado-degrade.gif` e `.mp4`. Os arquivos anteriores ficam preservados como referência do estágio anterior. Esta etapa permanece local.
