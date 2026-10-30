# After Rain 0.10.0-preview.21 — hordas maiores e nova pausa

## Pausa da expedição

- Novo painel com mapa, tempo sobrevivido, nível, eliminações, rodada ou tempo restante e vida.
- Arsenal com ícones, armas evoluídas e próximas escolhas nos níveis 10, 30 e 50.
- Melhorias com descrição e progresso; companheiro com vida e indicador especial ✦.
- Retomar em destaque, navegação por teclado e confirmação para abandonar. Ações permanecem visíveis em telas menores.

## Hordas e dificuldade

- Limite simultâneo dobrado de 240 para **480 inimigos** nos dois modos.
- Hordas maiores e intervalos progressivamente menores. A velocidade base dos novos zumbis cresce até +50% do início ao fim, preservando o bônus limitado por nível.
- O modo de rodadas usa dificuldade equivalente ao progresso no modo de 15 minutos: vida, dano, velocidade, chance de especiais e ritmo de chegada seguem os mesmos perfis para o mesmo progresso e nível do jogador.
- Cada rodada tem mais de duas vezes a quantidade do primeiro ajuste: 16 inimigos na rodada 1, 161 na rodada 25 e 311 na rodada 50.
- O limite simultâneo é uma capacidade máxima; não obriga toda rodada a ter 480 inimigos.
- Uma rodada já salva mantém seu restante registrado. A nova contagem vale a partir da próxima rodada.

## Tela inicial e viagem

- Fundo animado recortado para não criar rolagem horizontal.
- Chuva com emenda contínua, sem a redução para silêncio nas pontas da faixa.
- Confirmar a ida à cidade abre o vídeo imediatamente. O carregamento da dungeon começa por trás após o primeiro quadro, e o mesmo vídeo continua sem reiniciar.
- Pular continua bloqueado até os recursos estarem prontos.

## Validação e desempenho

Suíte automatizada, build de produção e verificações no Chromium: nova pausa em quatro tamanhos de tela, recuperação e retomada de hordas com 480 inimigos, renderização das duas cenas com 480 sprites, carregamento bloqueado durante a viagem e duas emendas da chuva. Simulações dos dois modos incluíram atributos permanentes de nível 5 e variações de pets.

No ambiente de teste com renderizador por software, 480 inimigos aumentaram o custo de renderização em cerca de 44% a 52% em relação a 240. Isso não mede o FPS do executável no computador Windows do jogador. Os relatórios acompanham o código em `docs/dungeons/hordas-progressivas`, `docs/dungeons/menu-pausa` e `docs/abertura`.

Saves e progresso anteriores continuam compatíveis. Baixe `After-Rain-0.10.0-preview.21-Windows-x64.exe` e confira a integridade com `SHA256SUMS.txt`.
