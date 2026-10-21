# DECISÕES, CONFLITOS RESOLVIDOS E PENDÊNCIAS

## Prioridades aprovadas

1. **Estilo visual**: usar cenário original e sua versão mais pixelada; novas construções no mesmo padrão artístico (creme/terracota/madeira/venezianas azul-esverdeadas/trepadeiras). Arte técnica rudimentar apenas como placeholder.
2. **Mapa maior**: ampla liberdade para construir/personalizar com territórios e pontos de interesse separados por exploração real.
3. **Personagem inicial**: usar visual da personagem criada em ficha original; quatro direções e versões de ação visíveis; editor de nome/aparência é objetivo futuro.
4. **Crafting completo progressivo**: criação de ferramenta desde recursos brutos, inclusive PICARETA rudimentar; árvore de dependências sem receitas impossíveis.
5. **Construção híbrida**: modo livre e projetos prontos de mesma economia, com telhado separado e interiores exploráveis.
6. **Inventário/UI**: interface com madeira/creme/verde rústicos, grade de itens, barra rápida, equipamento, receitas, bancadas e modo construção.
7. **NPCs e riscos**: mundo social e acolhedor com ameaças ocasionais; desenvolver em fases depois de fundamento e crafting.
8. **Estratégia de trabalho**: este chat cria e aprova conceitos; Codex implementa em projeto separado quando solicitado.

## Conflitos anteriores que NÃO devem ser usados sem revisão

- Primeiro esboço de crafting trazia **4 tábuas regulares por serrote improvisado**; especificação mais recente traz **3** com improvisado e **4** com reforçado. A última é fonte de verdade para v1.
- Algumas primeiras receitas de parede previam **4 tábuas + 2 cavilhas**; documento de interação v1.0 prevê **2 tábuas brutas + 1 cavilha por módulo inicial**, que é a regra de referência atual. Paredes mais elaboradas poderão ter receitas próprias depois.
- Há posters mostrando **ferramentas/tier** parecidos, mas sem garantia de IDs/coerência dimensional: sprites v0.2 são provisórios.
- Primeiras folhas sugeriam personagem 32px; animação técnica sugeriu canvas 64×64; protótipo de ações v0.1 usa 96×128. Não usar esses valores como três escalas simultâneas: escolher escala lógica/renderização durante auditoria, baseada em legibilidade, preservando pivô dos pés.
- O laboratório de animação usa quadro de impacto de índice **4** (zero-based); outra nota sugere quadro **5**. Manter **evento configurável por ação**, inicialmente compatível com v0.1, e validar contra sprites finais.
- Arte da casa **8×6 tiles com três cômodos** é estudo visual; abrigo inicial **3×3** é blueprint mínimo com custo próprio. Não misturar quantidades.
- Arte de referência de objetos com estado usa pôster com o personagem, mas não prova que cada fase visual é um PNG independente; preparar transições específicas antes de aplicar no jogo.
- Foi tentada remoção de fundo de folha de animações e apareceram resíduos/halos: preferir ficha original e extrair sprites criticamente.

## Pendências para o Codex avaliar no Prompt 00

- Qual engine/framework já está em uso? Qual comando realmente abre o jogo?
- Há mapa navegável, sistema de colisões, inventário, cenas ou salvamento já programados?
- Existem controles atribuídos a E, B, Espaço e 1–4? Evitar conflitos.
- Qual resolução interna/zoom de apresentação preserva legibilidade de personagem e terrenos?
- Quais sprites recortados passam no QA de alpha e textura? Onde desenhar/refazer sprites ausentes?
- Como organizar footprint/collision/roof-ordering para a tecnologia atual sem reescrever o jogo?

## Pendências criativas de longo prazo (NÃO bloquear MVP)

- Visual/nível de realismo do editor de aparência e progressão de roupas/acessórios.
- Mecânica de sono, calendário, clima, estações, pesca e alimentação com números definitivos.
- Detalhamento do plantio, irrigação, variedades e duração de crescimento.
- Tipos, origem e comportamento de hordas/inimigos; combate, dano, risco e dificuldade.
- Personalidades, diários, profissões e rotinas de NPCs; comércio e relações.
- História/quests, eventos, habilidades e raridade de recursos de biomas distantes.
- Biblioteca completa de tiles 32px com cantos, junções e telhas sem emendas.
- Animações verdadeiramente redesenhadas do personagem, alinhadas mão/ferramenta.

## Regras para pedir alteração

Se uma mecânica precisar ser ajustada depois dos playtests, editar a definição data-driven, atualizar a bíblia e os critérios de QA no mesmo commit e anotar por que mudou. Não mudar silenciosamente por ter visto outro valor em arte conceitual.
