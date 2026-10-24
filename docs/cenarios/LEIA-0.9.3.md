# After Rain 0.9.3 — HUD padrão, margens e nado

Execute `After-Rain-0.9.3-Windows-x64.exe` no Windows 11 x64.

## Mudanças

- A propriedade, a casa e a floresta usam a mesma HUD: missões, inventário, nove slots, música, relógio, mapa, zoom e pausa. As duas barras exclusivas da floresta foram retiradas.
- O lago ganhou areia em uma faixa irregular, com borda úmida e transição para a vegetação.
- O chão da floresta é desenhado como uma superfície contínua; as emendas que apareciam no zoom afastado foram removidas.
- Animação provisória de nado, até a substituição pelas poses do PixelLab. Nado automático ao entrar na água, na propriedade e na floresta. As duas personagens têm quatro poses de braçada em oito direções, corpo parcialmente submerso, flutuação e ondulações.
- Nadar usa 55% da velocidade de caminhada. Ao chegar à margem, a personagem retoma a caminhada. Rochas e outros obstáculos continuam sólidos; ferramentas não são usadas durante o nado.
- Salvar e recarregar na água mantém a posição e o estado visual de nado. Os pontos de chegada do editor continuam exigindo chão firme.

## Controles

**WASD/setas:** caminhar ou nadar. **E:** interagir em terra. **I:** inventário. **M:** mapa real do cenário atual. **+/-**, roda e **Home:** zoom. **Esc:** menu padrão de pausa, salvamento e volta ao início. **F2:** editor do cenário atual.

## Editor e mapas

As 21 novas sprites ambientais permanecem na paleta da propriedade e da floresta. Use **Ponto de chegada** e **Saída para o outro mapa** para reposicionar as passagens. **Aplicar e jogar** salva a edição. Exporte o JSON de cada cenário para guardar ou enviar suas alterações. Os mapas e rascunhos são separados.

## Validação

337 testes automatizados, verificação TypeScript e build. Chromium: HUD comum, mapa e indicador de posição, inventário, pausa, salvamento e volta ao início, editor e passagens personalizadas; água animada; nado com as duas personagens e oito direções, saída para a margem, pausa no inventário e recarga na água nos dois cenários.

O pacote é gerado no Windows pelo GitHub Actions. A validação interativa de jogabilidade foi feita no Chromium neste ambiente Linux.
