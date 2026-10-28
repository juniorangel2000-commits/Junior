# Praça renovada

A praça recebeu piso de pedras quadradas alinhadas, seis bancos voltados para a fonte em quatro orientações, quatro canteiros circulares de pedra com arbustos arredondados e seis postes nas bordas. Os bancos laterais usam artes próprias de perfil; os da parte inferior são vistos de costas, sem girar uma imagem frontal sobre o chão.

Os antigos bancos, vasos e postes que ocupavam a área central foram substituídos por uma composição simétrica. Os pequenos gramados acompanham os canteiros novos, sem arbustos ou flores antigos sobrepostos. As novas artes ficam em `public/assets/visual/village/plaza`, com recortes e hashes no manifesto. O piso e o mobiliário antigos permanecem preservados nos arquivos.

Os dois canteiros de vegetais e a mancha de terra correspondente foram retirados do cenário e da colisão. O poço e os dois canteiros de trigo permanecem no moinho. A arte retirada não é mais carregada no jogo. Fachadas, interiores e serviços dos dez comércios permanecem como estavam.

## Validação

- 839 testes em 99 arquivos passaram; TypeScript e build de produção passaram. Permanece o aviso existente sobre tamanho do bundle.
- Oito verificações integradas no Chromium passaram: onze elementos arquitetônicos carregados, dez peças da praça, quatro sentidos de banco, quatro canteiros circulares, seis postes nos pontos previstos, ausência dos canteiros de legumes, acesso aos dez comércios, fonte e água animada, visibilidade ao entrar/sair dos interiores, save e mapas externos preservados, ausência de erros JavaScript, WebGL e HTTP.
- Os dez comerciantes foram simulados no trabalho de manhã, almoço na praça e retorno à tarde, sem atravessar cenário. Os dez pontos de almoço seguem acessíveis.
- Novos testes cobrem a integridade das artes, os recortes, a colisão compartilhada do mobiliário e a circulação até os pontos de almoço.
- Capturas de dia e noite conferidas visualmente. `praca-fonte.png` mostra a composição final; `moinho-e-trigo.png` registra a retirada dos vegetais.

Alterações locais, com backup, sem push, tag ou publicação.
