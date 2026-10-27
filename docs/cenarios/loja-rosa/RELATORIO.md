# Loja agrícola da Rosa e colisões externas

Implementação local integrada à vila existente. Sem alteração de preços, receitas ou regras econômicas.

## Arte e cenário

- Fachada agrícola original em PNG RGBA, 353,28 × 235,52 unidades de canvas no jogo, ancorada na entrada existente da Rosa. Janelas com máscara de iluminação, duas lanternas e fumaça na chaminé.
- 16 objetos desenhados do zero em atlas nativo: balcão, estante de sementes, armário de vasos, expositor de hortaliças, bancada de mudas, sacos, suporte de ferramentas, janela, cesta, caixote de mudas, lanterna, banquinho, balança, livro, vasos e tapete.
- Interior com 19 peças (estrutura, piso, os 16 objetos e uma segunda instância da lanterna). Peças independentes e editáveis. Pisos e estrutura reaproveitam o sistema existente.
- Parede usa diretamente `SMITH_WALL_COLOR` da ferraria, sem outra paleta duplicada.
- Os 40 PNGs enviados no Rosa.zip foram preservados byte a byte: oito vistas paradas e quatro quadros em cada uma das oito direções. Atlas em runtime, escala uniforme e origem única para os pés.
- Imagens de revisão ocultam as árvores. O jogo mantém as árvores normalmente.

## Rotina e atendimento

Rosa usa o mesmo `MerchantDailyRoutine` do Augusto e do Bento, incluindo a navegação estática compilada para evitar recalcular colisões dos móveis a cada passo.

- Atendimento: 08h–12h e 13h30–18h.
- Durante o trabalho, entra e circula na própria loja.
- No intervalo, caminha até a praça. À tarde retorna caminhando.
- À noite permanece no interior sem habilitar compra/venda.
- Compra/venda somente dentro da própria loja, com validação também na transação. Conversas e demais serviços continuam separados.
- A condução opcional até a loja reaproveita a implementação existente.
- Rotina e cenário persistem nos campos existentes do save. Saves sem Rosa recebem o valor padrão; interiores efetivamente personalizados são preservados. Somente o antigo cenário genérico intacto migra para o novo.

## Editor

No ambiente de desenvolvimento, entrar na loja e usar H ou F2. É possível mover, dimensionar, ocultar, duplicar e trocar colisão/luz das peças. Importação/exportação `After-Rain-Rosa-Editada.json`. Validação preserva a estrutura, a entrada, o corredor e o espaço dos personagens. O editor continua restrito ao desenvolvimento.

## Colisões e minerais

- Casas padrão: contorno no chão com rebaixo da porta; beiral, grama e degraus não formam paredes invisíveis.
- Casa da propriedade: removido o retângulo antigo de tiles 21–27/11–15; movimento pontual e navegação agora usam a mesma referência de base visual.
- Augusto e Bento: refinadas as paredes, expositores e porta, preservando a área transitável da fornalha.
- Rosa: polígonos próprios de paredes e estoque, sem bloquear a entrada.
- Poços da propriedade e da vila: abertura inteira protegida, contorno da base e pés dos postes. Telhado livre para passagem por trás.
- Três novas rochas minerais, com proporção preservada, origem na base e associação explícita ao ID do recurso. A atualização não seleciona mais uma imagem pela proximidade das coordenadas, evitando atingir decoração ou sombra.

## Verificação

- TypeScript: aprovado.
- Build: aprovado (aviso preexistente de tamanho do bundle do Vite).
- Testes automatizados: 749 aprovados em 76 arquivos, sem testes ignorados.
- Testes de navegador: 41 verificações aprovadas (19 da Rosa/colisões e 22 de regressão dos comércios), sem erros de execução ou assets ausentes. Consultar `validacao.json`, `regressao-interiores.json` e as capturas nesta pasta.
- Movimento real contra casa e poço, passagem nas dez portas, atlas da personagem, fachada única, transações fora/dentro, editor/exportação, intervalo/retorno, salvamento, lanternas, janelas e associação das três rochas verificados no Phaser/WebGL.

O desempenho geral no PC do jogador não foi medido nesta etapa. Este relatório registra a validação local anterior à publicação v0.10.0-preview.6; o workflow Windows repete TypeScript e testes e gera o executável nativo antes de publicar.

## Arquivos principais

Novos: `src/rosa-sprites.ts`, `src/rosa-shop.ts`, `src/data/rosa-shop.ts`, `src/data/rosa-layout.json`, `public/assets/visual/village/rosa/`, `public/assets/visual/economy/deposits/rochas-detalhadas.{png,json}`, `scripts/prepare-rosa-assets.py`, `scripts/qa-rosa-shop.cjs`, `tests/rosa-shop.test.ts`, `tests/mineral-visuals.test.ts`.

Integração: `src/scenes/VillageScene.ts`, `src/systems/merchant-routine.ts`, `src/data/merchant-rooms.ts`, `src/merchant-interior.ts`, `src/economy-art.ts`, `src/economy-visuals.ts`, `src/village-world.ts`, `src/world.ts`, `src/forest-world.ts`, `src/solar-shadows.ts`, `src/data/village.ts`, `src/data/architecture-collision.ts`, `src/data/augusto-shop.ts`, `src/data/blacksmith-house.ts`. Testes existentes e o verificador de rotinas foram ajustados para a terceira rotina e os contornos refinados.
