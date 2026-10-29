# Mapas e HUD das dungeons

Revisão local posterior às cartas e chefes. Sem publicação. Vampire Survivors foi usado como referência de circulação, leitura de hordas e organização das informações, mantendo a ambientação urbana e as artes do After Rain.

## Mapas

A praça ganhou um circuito de pavimento com cantos arredondados, entradas amplas pelos quatro lados e quatro áreas de grama. A fonte central é o ponto de orientação; bancos e postes ficam fora do núcleo de combate. Árvores formam grupos irregulares nas bordas e em dois canteiros. Veículos, construções e suprimentos marcam setores do perímetro.

No estacionamento, os veículos se concentram nas duas laterais. O centro fica livre para conduzir hordas e enfrentar chefes. As vagas, a faixa de entrada do shopping e as setas pintadas ajudam a orientar a movimentação. Há manchas, rachaduras e vegetação nas bordas para caracterizar o abandono.

O piso de asfalto recebeu uma sobreposição de cor para reduzir o ruído visual. Pavimento, desgaste e sombras são desenhados uma vez na textura do chão; não criam centenas de objetos atualizados durante o combate. As prévias do menu usam o mesmo terreno, árvores e posições dos cenários reais, respeitando a profundidade dos objetos.

Os dois mapas continuam medindo 3072 × 2304 pixels. A revisão preserva as regras de inimigos, armas, bônus e chefes.

## HUD

- Barra de experiência fina no topo, com nível e progresso numérico.
- Relógio em destaque no centro superior; o modo de rodadas apresenta também o contador da rodada.
- Nome do cenário à esquerda; eliminações, inimigos restantes e botão de pausa à direita.
- Barra do chefe em uma faixa própria abaixo do relógio.
- Vida no canto inferior esquerdo, Arsenal ao centro e estado do pet à direita.
- Bônus ativos compactos e próxima oferta de arma identificada enquanto houver espaço.
- Evoluções continuam destacadas em dourado; cargas e recarga do Escudo de Choque permanecem visíveis.
- Em telas estreitas, o Arsenal ocupa uma linha acima dos painéis de vida e pet.

O módulo `src/dungeons/hud.ts` concentra o HTML da HUD. A maior parte dela não intercepta o ponteiro; o botão de pausa e os espaços do Arsenal permitem interação. O ícone de pausa usa SVG para evitar caracteres ausentes na fonte.

## Saves existentes

Uma posição salva que continue livre é preservada. Se o novo cenário colocar um obstáculo no ponto de um personagem, inimigo ou pet, o carregamento procura um espaço livre próximo. Vida, experiência, melhorias e equipamentos são mantidos. Desvios de navegação que terminem dentro de um objeto novo são descartados e recalculados pelo sistema existente.

## Validação

118 testes aprovados em oito arquivos, incluindo sete novos testes de layout, circulação, posição inicial e recuperação de atores em saves antigos. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

A preparação do teste de retomada foi ajustada para resolver escolhas pendentes antes de criar uma partida pausada. Uma escolha de carta salva já era retomada corretamente; o teste anterior esperava a tela de pausa mesmo quando havia outra escolha em espera.

Dez partidas simuladas foram repetidas nos novos mapas, com movimentação, escolhas e combate reais. Duas das cinco partidas da praça sobreviveram e completaram as melhorias compatíveis antes dos 15 minutos; as outras três morreram. As cinco partidas do estacionamento concluíram as 50 rodadas. O bot é uma ferramenta de verificação, não uma avaliação humana de dificuldade ou diversão. Não foram medidos FPS em computadores Windows.

A execução final passou em **35 verificações integradas no Chromium**, sem erros JavaScript, HTTP ou WebGL registrados: [validacao.json](validacao.json). Inclui posições da HUD e centro livre, telas de 1600/680/390 pixels, botão de pausa, cartas, bônus, chefe e retomada do save. As câmeras de visão geral e de telas estreitas são controladas pelo teste para a captura; no jogo normal a câmera continua acompanhando o personagem.

[Praça](praca-completa.png) · [Estacionamento](estacionamento-completo.png) · [HUD ampla](hud-ampla.png) · [HUD em 390 pixels](hud-390.png) · [Chefe com HUD nova](chefe-final-rodada-50.png) · [Menu e prévias](menu-cidade.png) · [Sessões simuladas](simulacoes.json)
