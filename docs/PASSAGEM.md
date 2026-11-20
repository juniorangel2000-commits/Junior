# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** arte nova do fazendeiro montado aplicada. O ajuste mais recente do Junior é deixar a orelha do cavalo visível de frente.

## Feito nesta rodada

- O primeiro vídeo de revisão mostrou a montaria antiga. A arte nova já existia como fonte em `referencias/personagens/montaria/masculino-proposta.png`. Foi preparada e ligada ao jogo como `farmer-male-seated.png`.
- `scripts/prepare-male-rider.cjs` limpa a transparência residual conservando a resolução nativa. `src/data/horse-rider-art.ts` registra a posição e escala de cada pose no espaço da célula do cavalo. A ordem da folha nova é sul, norte, oeste, leste, sudoeste, sudeste, noroeste e nordeste. A ordem do atlas do cavalo é diferente.
- O jogo e a tela de carregamento leem a mesma folha e as mesmas posições. A pose de cada direção acompanha o lombo ao passo e no galope. A arte feminina e o atlas do cavalo continuam sendo os mesmos.
- De frente, o corpo do cavaleiro fica sobre o cavalo. Apenas dois recortes das orelhas passam à frente do cavaleiro, acompanhando os quadros do passo e do galope.
- A revisão anterior das ferramentas encontrou a lâmina da enxada voltada para o personagem na batida e os efeitos da pá/foice acontecendo antes do contato. O pedido atual foi limitado à orelha da montaria. As ferramentas desta rodada estão como em `5133e15`.
- A passagem completa das ferramentas, as rotinas da vila, passadas de Marina/Rui e a porteira a 90 graus estão em `a106cdb:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Conferir o retorno do Junior sobre a vista frontal da montaria. A troca de arte está no branch de desenvolvimento.
- A postura do cavaleiro é uma pose por direção; o movimento é sincronizado ao lombo. Se o Junior pedir, tratar uma pose própria de galope como trabalho posterior.
- Tratar o momento do contato da pá e da foice em etapa própria se o Junior retomar as ferramentas.

## Pendências e ideias para depois

- Diagonais autorais para Marina/Rui, preservando a caminhada original dos jogadores.
- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais e itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta, e `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Manter os originais de arte na resolução nativa. Não aplicar o stash antigo da preview.34 sobre este branch.

## Testes

- Base: `npm ci` pelo cache, check e 2.203 testes passando.
- A conferência de sprites verifica as duas folhas realmente carregadas e a ordem dos quadros de montaria em relação às direções.
- Integração `3d72d87` e correção frontal `3a137e2`: check e 2.203 testes passando.
- No navegador, foi confirmada a folha masculina nova. A montaria tem a direção correta ao passo e no galope. Na gravação final, só os recortes das orelhas estiveram à frente, e o cavaleiro permaneceu acima do corpo do cavalo.
- O Junior pediu uma nova referência visual para polir apenas a cabeça e o pescoço, usando as quatro vistas das sprites atuais. A discussão e as prévias seguintes ficam aqui no chat até decidir o acabamento.
