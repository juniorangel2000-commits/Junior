# Prévia da personagem — 23/10/2026

Estado: avaliação local. Não houve publicação, tag nova ou alteração da Release 0.8.0.

A caminhada usa **quatro quadros por direção**, além da pose parada. As oito direções foram mantidas. O ritmo de referência é 7 quadros por segundo; durante a partida a fase acompanha a distância realmente percorrida. A arte compacta aprovada foi preservada, incluindo as mangas e botas originais. O ciclo alterna contato e passagem dos pés, com sombra no membro distante nas vistas laterais.

- `index.html`: prévia autocontida, com oito ângulos, dois penteados, reprodução normal/lenta, pausa e avanço de um quadro. Inclui as cinco imagens de zoom. Pode ser salva e aberta no navegador do computador.
- `caminhada-4-quadros.gif`: ciclo animado com as oito direções simultaneamente.
- `caminhada-no-jogo.mp4`: trecho da caminhada real no cenário.
- `direcoes-parada.png`: poses paradas.
- `caminhada-01.png` a `caminhada-04.png`: cada fase do ciclo.
- `atlas-preso.png` e `atlas-curto.png`: os 40 quadros de cada penteado, extraídos do renderizador real.
- `zoom-50.png`, `zoom-100.png`, `zoom-200.png`: mesma posição externa. A 50%, aparecem o dobro da largura e da altura.
- `zoom-casa-50.png` e `zoom-casa-200.png`: interior, enquadramento completo e câmera próxima.

Validação realizada: TypeScript, 217 testes automatizados e build de produção; navegador com teclado real em oito direções, editor, salvar/recarregar dentro e fora da casa, interação diagonal, zoom, coordenadas do mouse, mapa, mudança de área e redimensionamento. Exportação final conferiu quatro poses distintas para cada direção/penteado, sprites não vazios e ausência de cortes nas bordas. A página de avaliação também foi exercitada no Chromium.

As referências antigas de cabelo longo continuam com o valor preservado no save; este estudo visual usa a arte presa como representação temporária desse estilo legado. O editor atual oferece os dois penteados acima.

Para refazer a exportação, iniciar o Vite e executar `scripts/qa-camera-zoom.cjs`, depois `scripts/build-character-review.cjs`, com Playwright e Chromium disponíveis. `scripts/capture-character-walk.cjs` grava um vídeo bruto e informa em `/tmp/after-rain-walk-trim.json` o intervalo usado na captura. A exportação não publica o jogo.
