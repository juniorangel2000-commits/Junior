# PROMPTS SEQUENCIAIS PARA O CODEX

**Como usar:** estes prompts são separados intencionalmente. Envie **somente o Prompt 00** primeiro. Confirme o diagnóstico e copie cada etapa seguinte quando a anterior estiver funcionando. Para Codex que recebe anexos, entregue `01_BIBLIA_DO_JOGO.md`, `03_ATIVOS_E_ESTADO_REAL.md`, `04_TESTES_E_CRITERIOS_DE_ACEITE.md` e `06_DADOS_PROVISORIOS.json`, além dos pacotes de arte relevantes.

## REGRAS GERAIS (cola opcional antes de cada etapa)

Você está trabalhando em **Jardim Depois da Chuva**, um jogo original de pixel art detalhada com inspiração de agricultura acolhedora e sobrevivência, construção livre e projetos prontos. Leia a bíblia de desenvolvimento incluída. **Preserve o repositório existente**: não troque de engine, não recrie o projeto, não remova código/recursos válidos e não substitua arte aprovada por placeholders definitivos. Detecte primeiro os sistemas já existentes, reaproveite-os e entregue incrementos pequenos. Mostre arquivos alterados, justificativa e como testar. Receitas, teclas, grid e tempos devem ser parametrizáveis. Artworks conceituais não são sprites diretamente importáveis; sprites PNG devem ter transparência verdadeira, enquadramento validado, pivô dos pés em personagens e dimensões adequadas. Diferencie implementação real, mockup e funcionalidade futura. Registre qualquer incompatibilidade ou dependência antes de mudar arquitetura.

---

## PROMPT 00 — AUDITORIA DO PROJETO EXISTENTE (SOMENTE LEITURA)

> Quero continuar o jogo **Jardim Depois da Chuva** a partir do que **já existe neste repositório**, sem começar outro projeto. Leia `LEIA_PRIMEIRO.md`, `documentacao/01_BIBLIA_DO_JOGO.md`, `documentacao/03_ATIVOS_E_ESTADO_REAL.md` e `documentacao/05_DECISOES_E_PENDENCIAS.md` se disponíveis. **Por enquanto não altere nenhum arquivo nem implemente funcionalidade.** Inspecione a estrutura real e me entregue: (1) linguagem, engine/framework, versão e comando para rodar; (2) organização de cenas, código e assets; (3) lista objetiva de funcionalidades já implementadas versus mockups/protótipos/planejamento; (4) problemas técnicos e riscos de regressão; (5) avaliação de como importar o personagem, recursos e interfaces sem distorção, com a escala/renderização atual; (6) um plano em etapas pequenas para completar a primeira vertical slice: movimento → coleta → crafting de machadinha e picareta → corte e mineração → tronco em tábuas → bancada e serrote → parede/abrigo → salvar/carregar. Liste arquivos que você propõe alterar em cada etapa, e como vou testar cada etapa. **Pare e aguarde minha aprovação após o diagnóstico.**

### Depois da resposta do Prompt 00

Se o Codex encontrou uma engine e um código funcional, aprove o caminho de migração incremental. Se não houver repositório anexado, peça a localização dos arquivos do projeto **antes** de gerar novo código. Não peça ao Codex para codificar todas as mecânicas de uma vez.

---

## PROMPT 01 — ESTABILIZAR FUNDAMENTOS E ESCALA

> Com base na auditoria aprovada, implemente apenas a base faltante para a próxima etapa: abrir/rodar cena principal, movimentar nas 4 direções, câmera que segue o jogador, colisão com obstáculos, grid lógico de 32×32 **apenas se compatível com o projeto atual**, escala visível do personagem e animações idle/walk já disponíveis. **Use a ficha visual aprovada como referência de aparência; não use uma imagem de folha inteira como um sprite.** Normalize sprite sheet / pivô dos pés e pixel snapping; não corte o cabelo, mãos, botas nem ferramentas. Inclua uma pequena região de teste com chão, árvore, pedra e casa/obstáculo; não construa o mapa completo agora. Respeite a organização já existente. Adicione teste manual ou automatizado para colisão, orientação e viewport. Ao terminar, resuma os arquivos alterados, comando para jogar e eventuais limitações gráficas. Não avance para crafting nesta etapa.

**Aceite:** player grande o bastante para ser visto; quatro direções; sem atravessar obstáculos nem animações tremidas; jogo roda e salva o estado do repositório sem regressão.

---

## PROMPT 02 — DADOS DE ITENS + INVENTÁRIO + HOTBAR

> Inspecione e estenda o inventário que existir, sem reescrevê-lo à força. Implemente um catálogo **data-driven** com IDs estáveis para galho, pedra, fibra vegetal, corda, pedra lascada, cabo, cavilhas, tronco, tábua bruta, sucata, lâmina de sucata, tábua regular, machadinha, picareta rudimentar, martelo, serrote e bancada simples. Use `documentacao/06_DADOS_PROVISORIOS.json` como referência conceitual adaptada ao formato real da engine. Faça slots de inventário, quantidade empilhável para materiais, item único com condição para ferramentas, hotbar, seleção e tooltip com nome. Importe ícones do pacote `Assets_v0.2` por manifesto após conferir RGBA/transparência e dimensão; placeholders temporários somente quando asset faltar e com comentário claro. Disponibilize pequena área de teste para coletar galhos, pedras e fibras, respeitando alcance e capacidade. Teste adicionar/remover/split/stack/drop com prevenção de duplicação. Não implementar construções ainda.

**Aceite:** coletar e selecionar itens, ver contagem correta, pilhas sem duplicação, controles não quebrados, IDs preparados para saves.

---

## PROMPT 03 — CRAFTING MANUAL INICIAL, SEM DEPENDÊNCIAS CIRCULARES

> Acrescente receitas configuráveis produzíveis com as mãos: `3 fibra → 1 corda`; `2 pedra → 1 pedra lascada`; `1 galho → 1 cabo`; `1 galho → 4 cavilhas`; `1 cabo + 1 pedra lascada + 1 corda → 1 machadinha`; `1 cabo + 2 pedras lascadas + 1 corda → 1 picareta rudimentar`; `1 cabo + 1 pedra + 1 corda → 1 martelo rudimentar`. Leve em conta o documento-mestre, não as quantidades em pôsteres. A UI deve mostrar receitas conhecidas, disponíveis, materiais faltantes e quantidade de saída. A transação deve ser atômica: conferir materiais → consumir uma vez → produzir uma vez; nenhum duplo clique ou cancelamento pode duplicar itens. Garanta a possibilidade de criar as três ferramentas a partir da coleta inicial, sem sucata ou ferro. Não implementar serrote avançado nesta etapa.

**Aceite:** posso fabricar machadinha, picareta e martelo desde inventário vazio; testes com recursos insuficientes não consomem nada nem geram item.

---

## PROMPT 04 — ÁRVORES, ROCHAS, AÇÕES E RECURSOS CAÍDOS

> Implemente um sistema genérico de alvos interativos com ID único, resistência, ferramenta exigida, estado visual e drops. Suporte árvore pequena (4 impactos machadinha → 1–2 troncos + 2–3 galhos), árvore média (7 impactos → 2–3 troncos + 3–5 galhos), rocha (5 impactos picareta → 3–5 pedras) e ferro superficial (7 impactos com picareta rudimentar → 1–2 minérios). Valores editáveis. Ação exige alcance/linha livre, verifica energia e ferramenta, toca animação em 4 direções (usar provisória quando necessário, sem alegar que é definitiva), emite evento de impacto uma só vez, mostra progresso visual (inteiro, marcado, danificado, concluído), partículas leves, consome durabilidade e cria drops. Quando o inventário não couber, manter drops no chão. Não permitir segunda recompensa de um alvo concluído, mesmo após carregar jogo. Integrar a UI anterior sem reescrever arquitetura.

**Aceite:** derrubar árvore e quebrar rocha com progressão; alvo concluído não dá drop novamente; personagem continua legível.

---

## PROMPT 05 — MADEIRA, BANCADA E SERROTE

> Desenvolva o elo de carpintaria do crafting: `1 tronco + machadinha → 2 tábuas brutas` em ~4 s; `4 tábuas brutas + 4 cavilhas + martelo → 1 bancada simples`; `1 sucata → 1 lâmina de sucata` na bancada; `1 lâmina + 1 cabo + 1 corda → 1 serrote improvisado` na bancada; `1 tronco + serrote improvisado + bancada → 3 tábuas regulares` em ~3 s. Garanta pelo menos uma fonte acessível e fixa de sucata no mapa inicial/área de exploração, sem depender de sorte. Monte interface de bancada que exiba os materiais e uma barra de progresso e impeça processamento paralelo indevido, duplo consumo e perda ao sair/cancelar. Se houver filas, persistir apenas na etapa apropriada e documentar. Combine ação, animação, efeito de serragem e durabilidade. Preservar gameplay básico pronto.

**Aceite:** caminho lógico fechado de galho à tábua, sem ciclo de requisitos, sem duplicação, bancada com interação e processamento visível.

---

## PROMPT 06 — CONSTRUÇÃO LIVRE MODULAR BÁSICA

> Implemente APENAS a camada técnica modular, sem sacrificar a arte aprovada. Suporte grid de colocação coerente com o projeto, seleção por tecla B, prévia fantasma, orientação, custo e posicionamento de `piso 1 tábua bruta`, `parede 2 tábuas brutas + 1 cavilha`, `porta 3 tábuas brutas + 2 cavilhas`, `janela 2 tábuas brutas + 1 cavilha`, `telhado simples (1×3) 2 tábuas brutas + 3 fibras`. Use a referência visual de paredes creme/terracota/venezianas azul-esverdeadas; módulos provisórios podem ser usados somente onde faltar arte final e devem ser sinalizados. Valide bloqueios, camada de colisão, alcance, suporte e acesso à porta, confirme somente uma vez e impeça construir sobre personagem/árvore/água sem ponte. Crie teto em camada separada que se oculta ao entrar para revelar piso e interiores. Suporte desmontagem com recuperação provisória de 60%, nunca duplicando materiais. Teste uma casa pequena e junções.

**Aceite:** colocar, remover, bloquear, girar, atravessar porta, ocultar teto e ver interior, sem explodir inventário; cada peça persiste após recarregar quando save estiver pronto.

---

## PROMPT 07 — PROJETO PRONTO UTILIZANDO AS MESMAS PEÇAS

> Sobre o sistema modular anterior, adicione blueprints como listas de módulos com coordenadas, orientação, categoria, recursos e estado de obra; não criar um sistema paralelo de 'casa instantânea'. Implemente o **abrigo 3×3** usando 9 pisos + 6 paredes + 1 porta + 1 janela + 3 segmentos de cobertura, total de referência **32 tábuas brutas + 9 cavilhas + 9 fibras**. Projetos prontos e construção livre devem usar os MESMOS IDs, receitas, verificações e consumo atômico. A referência visual de casa maior 8×6 com quarto, sala/cozinha e oficina é um MODELO POSTERIOR, não o custo do abrigo 3×3. Projeto permite prévia, posicionamento válido, construção em etapas e ampliação/edição posterior. Salvar estrutura e todo estado por módulo.

**Aceite:** custo de peças soltas e blueprint idêntico; não cria materiais ocultos; cancelamento antes de construir é gratuito; não bloqueia todos os acessos.

---

## PROMPT 08 — INTERFACE DEFINITIVA DO NÚCLEO E SALVAR/CARREGAR

> Faça a integração final da primeira vertical slice com UI consistente com `referencias/INTERFACE_UI_CONCEITO.png`: HUD simples, hotbar, mochila, itens empilhados, equipamentos/durabilidade, receitas e bancadas, menu de construção livre/projetos prontos, mensagens legíveis. **Mais importante:** adicione/complete salvamento persistente com versão de schema para personagem, inventário, itens únicos, tempo, árvores/rochas resistentes ou destruídas, drops no chão, bancadas, peças e telhado, interior e modo livre/blueprint. Use IDs estáveis de objetos/ações, migração de esquema quando necessário, teste save/load e ações interrompidas sem duplicação. Não criar interface falsa separada do sistema. Verifique contrastes e legibilidade em zoom normal e telas menores.

**Aceite:** realizar ciclo do item básico até construção; fechar e abrir aplicação; tudo relevante persiste, sem duplicação; mapa e controle continuam funcionando.

---

## PROMPT 09 — REFINAMENTO E PREPARAÇÃO PARA EXPANSÃO

> Após comprovar a vertical slice (testes do documento QA), faça apenas refinamentos observáveis: alinhamento de sprite e mãos/ferramentas, partículas leves para corte/mineração/serragem/construção, sons ajustáveis, feedback de alcance/receitas, profundidade Y e oclusão de telhados, transições entre pisos/paredes, ordem de renderização, organização de atlas/manifests e opções de acessibilidade. Não trate artes conceituais como texturas diretamente recortáveis sem QA. Elabore uma proposta para as próximas etapas **sem ainda implementar tudo**: cultivo e estações, mobiliário/baús, NPC sociável, construção comunitária e, por último, IA inimiga/eventos de hordas. Entregue checklist com o que funciona de verdade e as pendências artísticas.

**Aceite:** jogabilidade estável e visual legível, sem regressões, com próximos marcos definidos.

---

## RESPOSTA PADRÃO QUE DESEJO DEPOIS DE CADA PROMPT

Informe: **arquivos alterados**, funcionalidades efetivamente implementadas, funcionalidades deixadas para depois, comando de execução, testes rodados com resultado, testes manuais que devo executar, riscos/limitações e se é seguro avançar ao próximo prompt. Não apresente trabalho fictício como concluído.
