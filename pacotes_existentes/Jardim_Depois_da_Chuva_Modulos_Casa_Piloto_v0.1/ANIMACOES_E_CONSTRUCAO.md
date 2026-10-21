# Jardim Depois da Chuva — Diretrizes de animação e construção

## Status
- Tiles em `tiles/`: protótipo geométrico de **encaixe 32 px**, feito especificamente para testar repetição e disposição das peças. NÃO são a arte final aprovada; esta precisa de mais textura/ajuste para igualar a qualidade do cenário.
- O arquivo `TESTE_MONTAGEM_CASA.png` mostra uma montagem técnica a partir dos próprios tiles, sem elementos de cenário falsamente funcionais.
- A folha `CATALOGO_MODULOS.png` é catálogo visual; os sprites reais estão na pasta `tiles`.

## Definições de construção modular
- Grade do mundo: 32x32 px; câmera e apresentação podem ampliar 2x-4x pelo método nearest-neighbor.
- Pisos e telhas: 32x32 px. Paredes: 32x64 px para representar altura com transparência acima do ponto de apoio.
- Referência de posicionamento de parede: o eixo de colisão está no rodapé da sprite; telhado em camada superior pode ficar transparente quando personagem entra.
- Ordem de desenho: terreno, piso, parede/estrutura, objetos, personagem, cobertura/efeitos. A ordem real deverá usar profundidade por Y no motor escolhido.
- O modo livre e o modo projeto pronto consomem o mesmo catálogo de recursos.
- Regras de teste: preview transparente (verde=válido, vermelho=inválido), bloquear colocação sobre personagem, água sem ponte, áreas ocupadas e portas sem acesso.
- A casa deve poder ser salva por lista de entidades com id, x/y em células, orientação, saúde e materiais.
- Conjuntos de arte final ainda necessários: cantos internos e externos, terminações de parede, roof edges, janelas/portas abertas e fechadas, batentes, shadows, pilares e transições de piso.

## Animação — padrão proposto
- Personagem: visual de 32x48 px em canvas 64x64 px (margens para ferramentas e ações); pivot fixo dos pés sugerido em (32,56).
- Direções: baixo, esquerda, direita e cima. Cada ação cria 4 sequências de 8 frames (32 frames por ação) a 10 fps de base, ajustável.
- `cortar_arvore`: frames 0-1 preparação, 2-4 arco da machadinha, 5 impacto, 6-7 recuperação. Evento sonoro e recurso: somente no 5.
- `minerar`: frames 0-2 levantar picareta, 3-4 ataque, 5 impacto, 6-7 retorno. Evento de partículas no 5.
- `serrar`: frames 0-1 posicionar, 2-6 cinco movimentos alternados de serrote, 7 repouso; consumo da madeira ao fim do processamento.
- `construir`: frames 0-1 posicionar, 2-4 erguer martelo, 5 impacto, 6-7 retorno; confirmação de construção no frame 5.
- Quadros por ação/direção podem ser montados em folhas de 8 colunas x 4 linhas, cada frame 64x64 => 512x256 px por ação.
- Evitar mudar rosto, roupas e proporções entre os frames; mãos e ferramenta devem manter relação constante.
- O hitbox deve ficar no chão, distinto do tamanho completo da sprite, permitindo ferramenta ultrapassar o canvas visual.

## Próximos checkpoints
1. Aprovar dimensão do personagem in-game diante da porta construída.
2. Ilustrar a primeira ação (`minerar`) quadro a quadro, garantindo todos os frames.
3. Desenhar versão definitiva do tileset em pixel art, baseada na paleta e materiais aprovados.
4. Só depois preparar integração em projeto de engine com Codex.
