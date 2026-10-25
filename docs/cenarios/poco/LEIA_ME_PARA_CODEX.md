# AFTER RAIN — POÇO EM PIXEL ART

Pacote contendo duas versões do mesmo poço para integrar ao jogo:

01_Poco_Sem_Interacao/poco_parado_256x256.png
  - Sprite parado para aparecer no cenário o tempo todo.
  - 256x256 px, PNG RGBA, fundo transparente.
  - É idêntico ao quadro_01 da animação para evitar deslocamento visível.

02_Animacao_Interacao/quadro_01.png ... quadro_08.png
  - Sequência de uso: a manivela gira, o carretel desenrola a corda,
    o balde desce à água e retorna cheio com gotas.
  - 8 PNGs transparentes, 256x256 px, alinhados ao mesmo ponto.

02_Animacao_Interacao/spritesheet_8_quadros_2048x256.png
  - Mesma animação em spritesheet horizontal de 8 quadros (256x256 cada).

02_Animacao_Interacao/previsualizacao.gif
  - Visualização de teste, com fundo sólido. NÃO usar como sprite no jogo.

manifest.json: tempos dos quadros, sequência e parâmetros.

INSTRUÇÕES PARA O CODEX / PHASER + TYPESCRIPT
1. Criar o sprite parado com a textura do diretório 01.
2. Carregar o spritesheet da pasta 02 com frameWidth=256 e frameHeight=256.
3. Criar animação 'poco_usar' com 8 quadros, repeat=0.
4. Usar a duração de cada quadro em manifest.json, se a engine permitir.
   Se não, aproxime usando 5 quadros/s ou 8 fps, conforme o efeito desejado.
5. Quando o jogador estiver ao alcance do poço e pressionar E,
   ativar 'poco_usar' uma única vez, bloquear novos acionamentos até o fim,
   e retornar a 'poco_parado' ao concluir.
6. Sincronizar o momento de obter água com a animação (ex.: quando o balde
   terminar de subir). Conceder somente se as regras de inventário permitirem.
7. NÃO aplicar upscale com suavização; manter pixelArt:true / nearest-neighbor.
8. A colisão deve corresponder à base de pedra, não aos 256x256 inteiros.
9. Todos os arquivos usam o MESMO alinhamento e escala; não recentralizar quadros.
10. Não fazer commit/push nem alterar GitHub sem autorização explícita.

NOTA
O sprite parado é o quadro inicial da animação. Os quadros são uma
representação visual pronta para prototipagem; verifique alinhamento,
oclusão e transição no ambiente real do jogo.
