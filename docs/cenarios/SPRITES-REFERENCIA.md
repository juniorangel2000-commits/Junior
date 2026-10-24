# Sprites do cenário a partir da referência compacta

Novas pranchas originais preservadas em PNG transparente:

- `public/assets/visual/nature/reference-trees.png`: três árvores frondosas e três pinheiros.
- `public/assets/visual/nature/reference-details.png`: pedra com musgo, tronco caído, toco, samambaia, flores brancas, arbusto, pedras de margem, juncos e cogumelos.

Paleta: sombras verdes profundas, folhagem verde-amarelada sob a luz, madeira quente e pedras com musgo. As imagens foram geradas seguindo a direção visual da referência enviada; a referência não foi usada como mapa plano.

As árvores são recortadas em texturas 208×264 (densidade 2×), mantendo o tamanho no mundo, pivô dos pés e colisões anteriores. Os detalhes da floresta usam texturas 128×128 e escala explícita. Pedras pequenas, samambaias, flores, tocos e margens da propriedade recebem novas versões nas dimensões lógicas existentes. Os PNGs antigos permanecem no projeto.

O chão da floresta agora usa os materiais texturizados do jogo; as trilhas usam uma mistura de piso de mata, musgo e folhas e as margens ganham juncos e pedras. Plantas pequenas não bloqueiam os caminhos. Novos troncos e tocos decorativos também estão disponíveis na paleta do editor. IDs, recursos, animais acolhidos e save não são alterados por esta troca de arte.

## Validação

331 testes passaram; verificação TypeScript e build concluídos. O teste Chromium confirmou entrada, mapa, movimento, pausa, dez acolhimentos únicos, retorno à propriedade, ausência de reaparecimento e recarga na floresta. Capturas reais: `floresta-mapa.png`, `floresta-animais.png` e `animais-propriedade.png`.

O terreno é composto uma vez em blocos de 256×256 e reutilizado ao voltar à floresta. O teste de navegador também foi corrigido para não serializar a cena inteira com suas texturas.

Esta atualização aproxima as sprites ambientais da referência. O traçado e as dimensões do mapa são preservados. As bordas agora misturam os materiais em uma faixa irregular, calculada em coordenadas do mundo para não criar emendas entre blocos. As texturas mantêm a resolução original. A água continua bloqueando passagem; a colisão do deck removido foi retirada. Não houve teste interativo do executável no Windows neste ambiente Linux.

Testes de composição conferem continuidade entre blocos, opacidade e reprodução idêntica das bordas ao revisitar a área.

## Refinamentos da floresta (0.9.2)

- Bordas irregulares misturam grama, terra, mata e margem úmida, sem reduzir a resolução das texturas.
- As seis variantes de árvores agora aparecem na floresta; a fórmula anterior escolhia sempre a variante zero na grade de três células. Portes variados e espelhamentos estáveis quebram a repetição.
- Trilhas usam majoritariamente o mesmo material verde da mata e das clareiras, com apenas 10% do tom de terra; recebem folhas secas em seis tons naturais, concentradas nas bordas; pedras foram removidas e o centro continua legível.
- Teste de regressão verifica que as seis variantes são usadas no mapa real.

## Lago e editor

`public/assets/visual/nature/lake-rocks.png` contém seis rochas novas, incluindo versões submersas. O lago recebe essas rochas e ondulações animadas; o deck foi removido.

As 21 novas sprites ambientais estão disponíveis no editor da propriedade e da floresta. Os mapas, rascunhos, exportações e pontos de chegada/saída são independentes. Instruções em `LEIA-0.9.2.md`; evidências em `validacao-editor-floresta.json`.

## 0.9.3 — margens e zoom

Uma faixa de areia de largura variável acompanha o lago, misturando-se ao piso da mata e à borda úmida. A composição em blocos é montada em uma única textura contínua para eliminar lacunas de arredondamento no zoom. A HUD comum substitui os painéis exclusivos da floresta.

Animação de nado em `swimming.ts`, com poses derivadas da arte original das duas personagens e sem alterar os PNGs fonte. Evidências: `validacao-nado.json`, `nado-feminino.png`, `nado-masculino.png`, `lago-zoom-afastado.png`.
