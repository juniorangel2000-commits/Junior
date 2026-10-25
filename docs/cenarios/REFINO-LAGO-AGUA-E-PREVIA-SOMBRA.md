> Registro das prévias aprovadas e incorporadas à versão 0.9.6.

# Refino do lago da casa, água animada e prévia da sombra

Revisão local, ainda sem nova publicação.

- Retirado o antigo acesso ao lago e as poças decorativas próximas da margem. O antigo caminho e a poça deram lugar ao mesmo piso de grama do entorno; a areia fica apenas na borda do lago.
- Oito pinturas antigas de grama que cortavam a areia em degraus foram corrigidas na cópia do mapa padrão. Os arquivos originais do autor permanecem intactos. Partidas antigas recebem essa correção uma única vez, sem alterar entradas, saídas ou recompensas. Pisos diferentes de grama, construções, cultivos e canteiros preparados são protegidos; futuras edições no editor permanecem livres.
- A própria textura da água agora se deforma e se move, acompanhada por reflexos mais visíveis. Nove partes compartilham um padrão contínuo de 96 pixels; o ciclo de quatro segundos fecha sem salto. As máscaras continuam impedindo desenho sobre terra e pontes.
- Prévia da sombra em MP4 com câmera aproximada e horários visíveis, além de PNG com três posições. O GIF não é necessário para conferir o resultado.

Mídias em `refino-lago-agua-sombra`: `lago-refinado.png`, `agua-em-movimento.mp4`, `sombra-aproximada.mp4` e `sombra-tres-posicoes.png`.

Validação: TypeScript, 477 testes em 47 arquivos e build. Chromium: borda corrigida, pontos preservados, frames da água mudando e repetindo o ciclo, movimento visível nos pixels, máscara fora da terra, sombra com base estável e passagem contínua por zero. Relatório `validacao.json`.

A sombra do personagem também foi ajustada à base visível dos pés, desconsiderando a margem transparente da sprite. O vídeo usa enquadramento próximo e o PNG mostra antes/centro/depois.
