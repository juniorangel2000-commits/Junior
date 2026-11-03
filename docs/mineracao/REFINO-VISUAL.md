# Refino visual e ações de picareta

Branch: `feature/mina-natural`, posterior à preview.30. Inclui a correção da
chegada à propriedade quando Bento ocupa a saída da casa.

- Textura própria de rocha, contínua no espaço do mundo. A borda visível ocupa
  duas células e escurece continuamente até a massa oculta. Apenas a camada
  dianteira revela minérios; destruir um bloco atualiza treze células próximas,
  e dano parcial atualiza uma. A colisão usa o contorno orgânico existente.
- Família única de nove ícones (fragmento, bruto e lingote de ferro, ouro e metal
  negro), veios transparentes e depósitos no mundo. Os veios não substituem a
  textura da parede. Nenhum preço, recurso ou regra de picareta foi alterado.
- Carrinhos, caixas, lanternas e objetos de missão próprios, sem recortes do chão.
  Reservas estruturais continuam protegidas, mas as caixas não são paredes.
  Colisões menores seguem a base visível e não bloqueiam posições anteriormente
  livres, verificado contra os contornos anteriores.
- Fazendeiro e fazendeira: quatro direções, seis poses de mineração. Pivô fixo
  por direção e escala calibrada nas poses oficiais, sem redimensionar quadro a
  quadro. O impacto continua no quadro quatro da ação original de nove tempos.
  Só a cabeça da picareta recebe a paleta de ferro, ouro ou metal negro.
- O corpo normal volta ao terminar, cancelar, trocar ferramenta ou abrir menu.
  As ações usam o mesmo adaptador na propriedade, floresta e galerias.

Fontes originais preservadas em `/workspace/generated_images`. Extração em
`scripts/prepare-mine-natural.cjs` e `scripts/prepare-player-mining.cjs`.

Validação: build de produção, 105 testes dirigidos e mais três de profundidade
visual (regressão final de 89 testes), todos aprovados. Chromium: colisão real do
jogador com carrinho, cinco golpes de cada personagem, uma recompensa de quatro
pedras por bloco, área escavada livre, restauração do corpo, cancelamento,
recriação da cena a partir do save e nenhum erro JavaScript.

Prévias em `/workspace/mina-natural-qa/`: imagens do cenário, carrinho e mochila,
GIF/MP4 dos dois personagens e `validacao.json`. O roteiro
`scripts/qa-mine-natural.cjs` usa uma partida de QA com perigos temporariamente
retirados para tornar a inspeção visível; a produção mantém os perigos.
