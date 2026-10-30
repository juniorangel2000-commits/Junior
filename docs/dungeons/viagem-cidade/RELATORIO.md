# Viagem à cidade: vídeos por personagem, música e confirmação

## Comportamento

Ao caminhar até o acesso norte da estrada na Floresta de Acesso à Cidade, o jogo pergunta **Ir até a cidade?**. Confirmar inicia a viagem; Agora não ou Escape mantém o jogador no mundo. Cancelar não reabre o aviso a cada quadro: é necessário se afastar e voltar ao acesso. A saída explícita do menu de expedições também retorna sem abrir imediatamente outra confirmação. A tecla E continua como alternativa opcional, passando pela mesma confirmação.

O vídeo é escolhido pelo `profile.characterId`, com a mesma personagem feminina padrão do renderizador para saves antigos sem esse campo. Os dois MP4 enviados foram preservados byte a byte em `public/assets/video/expedition/`; `VIDEOS.json` registra a correspondência, nomes originais, codecs, duração e SHA-256. Ambos são H.264 em 1920×1080. Os JPG são quadros iniciais extraídos dos próprios vídeos para pôster de carregamento.

O vídeo usa toda a área disponível com proporções preservadas. **Pular** começa oculto e desativado. A cena só inicia a apresentação após o preload do Phaser; adicionalmente, a liberação do botão e a entrada no menu aguardam a decodificação das duas prévias e as fontes da interface. Se o vídeo terminar antes, o último quadro aguarda os recursos. Cliques antecipados não contornam o bloqueio.

Fim natural e Pular usam a mesma conclusão única. Erro de vídeo ou 15 segundos sem progresso não impedem o acesso ao menu depois de os recursos ficarem prontos. Se a preparação do próprio menu falhar, aparece uma saída explícita para voltar e tentar novamente. Há alternativa de reprodução por clique em caso de bloqueio de autoplay. Vídeo, temporizador e listeners são descartados ao terminar ou encerrar a cena. Perder foco pausa o vídeo e o watchdog; retomar o foco permite continuar, inclusive se a página estava em segundo plano ao iniciar a viagem.

## Áudio

- Trilha procedural original, suave e em tom menor, com loop de 48 segundos.
- Durante vídeo e menu, toca a mesma fonte, sem reinício. O ganho é 25% do volume musical configurado pelo jogador.
- O áudio nativo dos MP4 fica silenciado apenas durante a reprodução no jogo, evitando música duplicada e sons fora das configurações. Os arquivos originais mantêm suas faixas AAC.
- Ao iniciar a expedição, a trilha desaparece em aproximadamente 0,65 segundo; toca um efeito de suspense com menos de um segundo. Depois ficam os efeitos do jogo, sem música de fundo no combate.
- Retomar um checkpoint abre diretamente a partida pausada, sem repetir vídeo ou suspense inicial.
- Voltar ao menu após as recompensas retoma a trilha do menu. Sair ao mundo restaura a música normal. Volumes de música/efeitos, silêncio geral e suspensão em segundo plano permanecem independentes.

## Validação

- 1.227 testes em 138 arquivos aprovados. Dois novos casos cobrem a seleção dos vídeos e a compatibilidade do personagem padrão dos saves antigos.
- TypeScript e compilação de produção aprovados, incluindo os MP4/JPG na pasta de distribuição.
- 18 verificações de mídia e áudio no Chromium: decodificação real dos dois MP4, espera de carregamento, fim antecipado, Pular, erro de mídia, pausa/foco, evento tardio de mídia, waveform sem clipping, volume baixo, continuidade e encerramento da música, suspense e silêncio geral.
- 13 verificações do fluxo real: movimento pelo teclado até o acesso sem E, cancelamento, Escape, rearme ao se afastar, confirmação, vídeo feminino, Pular, áudio contínuo no menu, início da partida, recompensas, saída e vídeo masculino terminando naturalmente.
- 61 verificações da regressão geral das dungeons aprovadas, incluindo retomada de save, armas, chefes, HUD e recompensas. Os scripts existentes foram atualizados para confirmar a nova pergunta da estrada.
- Regressão clássica de áudio aprovada: abertura, mundo, chuva, efeitos, ajustes, persistência, troca rápida de cenas e suspensão. Seu fixture antigo tentava plantar sem preparar a terra e verificar a rega antes da animação; foi atualizado para preparar um canteiro válido e esperar a aplicação da água, sem alterar o cultivo do jogo.

Total de verificações estruturadas: **92**, sem erros JavaScript nas execuções finais. A correção de cliques na apresentação foi verificada por um clique real em Pular. O teste isolado mantém somente seu vídeo feminino de fixture em loop durante a captura; o fluxo real verifica o término natural sem loop. Os testes gráficos usam Chromium com renderização por software e não substituem um teste do executável no Windows.

## Reprodução

`npm test` · `npm run build`

Com `npm run dev -- --port 5187`, execute os scripts com `QA_URL=http://127.0.0.1:5187`:

- `node scripts/qa-expedition-cinematic.cjs` (`CINEMATIC_QA_OUTPUT` escolhe o diretório de evidências).
- `node scripts/qa-city-expedition-flow.cjs` (`CITY_QA_OUTPUT`).
- `node scripts/qa-dungeons.cjs` (`DUNGEON_QA_OUTPUT`).
- `node scripts/qa-audio.cjs`.

As alterações estão preparadas após a preview.18, sem nova publicação nesta etapa.
