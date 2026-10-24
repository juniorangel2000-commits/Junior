# Sprites do cenário a partir da referência compacta

Novas pranchas originais preservadas em PNG transparente:

- `public/assets/visual/nature/reference-trees.png`: três árvores frondosas e três pinheiros.
- `public/assets/visual/nature/reference-details.png`: pedra com musgo, tronco caído, toco, samambaia, flores brancas, arbusto, pedras de margem, juncos e cogumelos.

Paleta: sombras verdes profundas, folhagem verde-amarelada sob a luz, madeira quente e pedras com musgo. As imagens foram geradas seguindo a direção visual da referência enviada; a referência não foi usada como mapa plano.

As árvores são recortadas em texturas 208×264 (densidade 2×), mantendo o tamanho no mundo, pivô dos pés e colisões anteriores. Os detalhes da floresta usam texturas 128×128 e escala explícita. Pedras pequenas, samambaias, flores, tocos e margens da propriedade recebem novas versões nas dimensões lógicas existentes. Os PNGs antigos permanecem no projeto.

O chão da floresta agora usa os materiais texturizados do jogo; as trilhas recebem pedrinhas em tons quentes e as margens ganham juncos e pedras. Plantas pequenas não bloqueiam os caminhos. Troncos e tocos decorativos acompanham posições das árvores. IDs, recursos, animais acolhidos e save não são alterados por esta troca de arte.

## Validação

322 testes passaram; verificação TypeScript e build concluídos. O teste Chromium confirmou entrada, mapa, movimento, pausa, dez acolhimentos únicos, retorno à propriedade, ausência de reaparecimento e recarga na floresta. Capturas reais: `floresta-mapa.png`, `floresta-animais.png` e `animais-propriedade.png`.

O terreno é composto uma vez em blocos de 256×256 e reutilizado ao voltar à floresta. O teste de navegador também foi corrigido para não serializar a cena inteira com suas texturas.

Esta atualização aproxima as sprites ambientais da referência. O traçado e as dimensões do mapa são preservados; as bordas do terreno ainda seguem a grade existente. Não houve teste interativo do executável no Windows neste ambiente Linux.
