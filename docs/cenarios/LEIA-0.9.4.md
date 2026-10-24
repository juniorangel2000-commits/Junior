# After Rain 0.9.4 — Windows 11 x64

Baixe `After-Rain-0.9.4-Windows-x64.exe`, coloque em uma pasta de sua preferência e abra com dois cliques. O pacote é portátil: não exige instalação, Node.js ou servidor.

## Controles

- WASD ou setas: andar; caminhar no raso e nadar em água profunda.
- E: interagir, usar a ferramenta e atravessar a saída marcada. Perto de um animal selvagem, prende uma corda disponível.
- G: soltar o animal e recuperar a corda.
- C: fabricação. Uma corda vegetal custa 3 fibras e pode ser feita na propriedade ou na floresta, sem bancada.
- I: mochila; arraste itens para os nove slots. Um slot vazio deixa as mãos livres.
- 1–9: selecionar slot. Nenhuma ferramenta pode ser equipada durante o nado.
- M: mapa. H: personalizar a casa. F2: editor dos mapas e suas passagens.
- Roda do mouse ou +/−: zoom; Home: voltar a 100%.
- Esc: fechar janelas ou pausar. Ctrl + Alt: alternar tela cheia.
- Ícone de música na barra: configurações de som da partida.

## Conduzir animais

Fabrique uma corda, aproxime-se do animal e pressione E. Os animais fogem e são um pouco mais lentos que a personagem. Só um animal pode ser conduzido por vez. A corda limita a distância; conduza por terra e contorne os obstáculos. Vá até a saída marcada da floresta com o animal próximo e pressione E. Ao chegar à propriedade, ele é acolhido e a corda volta ao inventário. O animal nunca entra na mochila. G permite soltar antes disso.

A corda acompanha a mão esquerda da personagem e a cabeça do animal, inclusive durante as animações. As espécies que ainda não receberam sprites animadas mantêm o visual provisório anterior.

## Partidas e mapas

O save usa o mesmo local das versões anteriores: `%APPDATA%\Depois da Chuva`. Atualizar o executável não exige apagar a partida. Posição dos animais, condução, coletas, plantações e progresso são salvos. O save do navegador é separado do aplicativo.

O editor F2 permite trocar entre Propriedade Abandonada e Floresta Antiga, pintar pisos, posicionar objetos e editar entrada e saída. Exporte cada mapa em JSON para guardar uma cópia das edições. Solte ou entregue o animal antes de abrir o editor.

Recursos soltos respeitam limites automáticos de 64 na propriedade e 48 na floresta. Após coletar, a reposição aguarda quatro horas do relógio do jogo e procura outra posição válida. Objetos colocados manualmente no editor preservam seu desenho e podem superar esse limite.

`SHA256SUMS.txt` contém o hash SHA-256 do executável para conferir a integridade. O pacote é gerado em Windows pelo GitHub Actions; a verificação interativa desta atualização ocorreu no Chromium/Linux.
