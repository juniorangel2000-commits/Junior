# After Rain 0.9.3 — HUD padrão, margens e nado

Execute `After-Rain-0.9.3-Windows-x64.exe` no Windows 11 x64. Pacote portátil; não exige Node.js ou servidor.

## Mudanças

- A propriedade, a casa e a floresta usam a mesma HUD: missões, inventário, nove slots, música, relógio, mapa, zoom e pausa. As duas barras exclusivas da floresta foram retiradas.
- O lago ganhou areia em uma faixa irregular, com borda úmida e transição para a vegetação.
- O chão da floresta é desenhado como uma superfície contínua; as emendas que apareciam no zoom afastado foram removidas.
- Natação com as sprites oficiais preservadas: em água profunda fica apenas a cabeça acima da superfície; a silhueta real do corpo aparece azul-esverdeada sob a água. Oito direções, flutuação, ondulações, rastro e respingo de entrada. Água rasa mantém a caminhada; a imersão é gradual. Consulte `../personagens/NADO-PROVISORIO.md`.
- Nadar usa 55% da velocidade de caminhada. Ao chegar à margem, a personagem retoma a caminhada. Rochas e outros obstáculos continuam sólidos; ferramentas não são usadas durante o nado.
- Salvar e recarregar na água mantém a posição e o estado visual de nado. Os pontos de chegada do editor continuam exigindo chão firme.

## Controles

**WASD/setas:** caminhar ou nadar. **E:** interagir em terra. **I:** inventário. **M:** mapa real do cenário atual. **+/-**, roda e **Home:** zoom. **Esc:** menu padrão de pausa, salvamento e volta ao início. **F2:** editor do cenário atual.

## Editor e mapas

As 21 novas sprites ambientais permanecem na paleta da propriedade e da floresta. Use **Ponto de chegada** e **Saída para o outro mapa** para reposicionar as passagens. **Aplicar mapas e jogar** salva a edição. Exporte o JSON de cada cenário para guardar ou enviar suas alterações. Os mapas e rascunhos são separados.

## Validação

353 testes automatizados, verificação TypeScript e build. Chromium: HUD comum, mapa e indicador de posição, inventário, pausa, salvamento e volta ao início, editor e passagens personalizadas; água animada; nado com as duas personagens e oito direções, saída para a margem, pausa no inventário e recarga na água nos dois cenários.

A geração do executável Windows pelo GitHub Actions foi retomada por solicitação do usuário. A validação interativa de jogabilidade foi feita no Chromium neste ambiente Linux; o efeito de nado é verificado em WebGL e Canvas.

## Mapas enviados e nova edição

Os arquivos recebidos foram incorporados como base. A propriedade usa saída no bloco **1,52** e chegada em **2,52**; a floresta usa saída **94,46** e chegada **93,46**. Pressione E sobre o bloco de saída marcado. A antiga passagem ao sul da floresta está fechada por árvores variadas e piso de mata. As posições anteriores não trocam mais o cenário.

No editor, os botões **Propriedade** e **Floresta Antiga** alternam o cenário sem perder o trabalho. Cada mapa mantém seu próprio desfazer/refazer. **Aplicar mapas e jogar** salva os dois; **Voltar sem aplicar** descarta a sessão de edição. Exporte o JSON de cada mapa para guardar ou enviar as próximas alterações.

A paleta inclui grama, grama clara, piso de mata, musgo, trilha com folhas, caminho seco, terra úmida, madeira, calçamento, água, areia e terra.

## Rochas e recursos renováveis

As rochas grandes e as novas sprites de pedra são mineráveis com picareta. Os golpes parciais são salvos. Rochas na água exigem alcançar a partir de chão firme; nenhuma ferramenta pode ser selecionada ou usada durante o nado. Árvores podem ser cortadas com machadinha.

Recursos soltos surgem em posições aleatórias válidas, sem ocupar casas, plantações, construções, passagens ou os caminhos principais. O limite automático é de **64 recursos na propriedade** e **48 na floresta**, considerando os recursos fixos coletáveis além dos gerados. Árvores e decoração posicionadas no editor preservam o desenho do mapa; objetos colocados manualmente podem superar esse limite e então nenhuma reposição extra é gerada.

Após coletar, a reposição aguarda **4 horas no relógio do jogo** (cerca de 2 minutos de simulação). Ela respeita o limite e procura outra posição válida. Pausar não avança o temporizador. Salvar/recarregar preserva posições e tempo de espera e não repete recompensas. A floresta e a propriedade têm controles independentes de população.

Os PNGs originais das árvores foram preservados. Os recortes agora seguem as silhuetas completas, corrigindo o corte de copa que aparecia em uma variação.
