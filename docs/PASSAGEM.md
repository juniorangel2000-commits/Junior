# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD do branch (interiores em `8d17a2d`).
- **Última versão publicada:** `v0.10.0-preview.34`, Release pública com instalador e portátil Windows x64: https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** etapa 1 do plano de animais (interiores do galinheiro e do curral) implementada e validada, **com arte provisória**. Não publicado.

## Feito nesta rodada

- **Publicação da preview.34**:
  - Este ambiente do Claude Code não consegue criar tags (git e API do GitHub respondem 403).
  - O Junior criou a Release pela página do GitHub, e a tag disparou o workflow do Windows.
  - O workflow agora aceita uma Release já existente: atualiza título e notas e anexa os arquivos.
  - Faltava `docs/cenarios/LEIA-0.10.0-preview.34.md`, que o workflow exige; foi adicionado.
- **Interiores do galinheiro e do curral** (`docs/planejamento/ANIMAIS-E-RECEITAS.md`, etapa 1):
  - Cena própria `FarmInteriorScene` (chave `'Interior'`), aberta pela porta da construção pronta (E no cercado, logo à frente do corpo da construção) ou pelo botão "Entrar" do painel. A saída é pela porta de baixo.
  - Planta em `src/data/farm-interiors.ts`:
    - Galinheiro 10×8: cocho, bebedouro e 6 ninhos.
    - Curral 14×10: 4 baias com divisórias, cocho e bebedouro.
    - Os objetos fixos já mostram o que farão ("em breve").
  - Rotina em `src/systems/farm-interior.ts`: de dia (06:00–18:00) no cercado, à noite dentro. "Recolher os animais" e "Soltar no cercado" no painel valem até a próxima virada (`animalsOverride` na obra).
  - Na Propriedade, os animais que estão dentro somem do cercado e voltam pela porta.
  - O save guarda o jogador do lado de fora da porta: recarregar o jogo dentro do interior volta para a entrada.
  - **Arte provisória** em `src/farm-interior-art.ts`, desenhada em código. As chaves de textura são fixas:
    - `interior-<tipo>-floor`
    - `interior-trough-<largura>`
    - `interior-water`
    - `interior-nest`
    - `interior-stall-<l>x<a>`
    - `interior-divider-<a>`
- **SpriteCook** (sessão seguinte, 2026-11-14): o plugin (`github.com/SpriteCook/claude-plugin`, v0.1.8) carregou, mas o servidor `mcp.spritecook.ai/mcp/claude` pediu login (OAuth). Uma sessão do Claude Code na nuvem não consegue abrir esse login, então nenhuma arte foi gerada. Nada de código mudou nessa sessão; `npm run check` ok e 1.939 testes passando.

## Em andamento e próximo passo exato

- **Antes de tudo, o SpriteCook precisa estar autorizado:**
  - O Junior entra em https://claude.ai/customize/connectors, clica em **Conectar** no SpriteCook e faz o login da conta SpriteCook.
  - Depois disso, uma sessão **nova** já carrega as ferramentas. Para conferir, peça o saldo de créditos (`get_credit_balance`).
  - Se o SpriteCook não aparecer nessa lista, há duas alternativas:
    - rodar o Claude Code no computador do Junior, onde o plugin abre o login no navegador;
    - guardar uma API key `sc_live_` como segredo de rede do host `api.spritecook.ai` (servidor `https://api.spritecook.ai/mcp/`). O Junior preferiu não usar a chave por enquanto.
- **Arte definitiva dos interiores com o SpriteCook**, numa sessão nova:
  - piso de palha (galinheiro) e de tábuas com palha (curral);
  - paredes de tábua;
  - cocho, bebedouro, ninho e baia.

  Manter a escala de 32 px e o estilo das construções externas (`public/assets/visual/farm/`). Carregar os PNGs com as mesmas chaves em `src/farm-interior-art.ts`, trocando o desenho em código, e conferir com `scripts/qa-farm-interior.cjs`.
- Depois, etapa 2: **ovos e leite** (`docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`), usando os ninhos e as baias do interior, com cocho abastecido com palha.

## Pendências e ideias para depois

- Para o Junior confirmar: o estábulo é exigido para a **corda** do cavalo, não para o cavalo comer.
- Plano completo de animais, máquinas e cozinha em `docs/planejamento/ANIMAIS-E-RECEITAS.md`, com ovelha e cabra, porco, pato, abelhas, máquinas e cozinha.
- Chamar o cavalo de longe, montaria e quadros de deitar e descansar do cavalo.
- Sementes especiais para o ano todo; clima, peixes por estação, árvores frutíferas e estufa.
- Preços dos produtos e pratos, a definir jogando.

## Problemas conhecidos

- Os animais dentro do interior não guardam a posição; a cada entrada eles aparecem espalhados (galinhas) ou nas baias (vacas).
- O interior não tem iluminação de noite; é sempre claro.
- Publicação: o Claude Code prepara a versão na `main` e o Junior cria a Release pelo site; o Codex pode criar tags normalmente.

## Testes

- `npm run check`: ok.
- `npm test`: **1.939 passaram, zero falhas, 219 arquivos**. Os 10 novos estão em `tests/farm-interior.test.ts`: rotina, viradas, recolher e soltar, planta alcançável, porta e validação.
- `npm run build`: não executado (sem publicação).
- Chromium (`scripts/qa-farm-interior.cjs`):
  - À noite a galinha some do cercado.
  - "Entrar no galinheiro · E" abre o interior com a galinha.
  - O ninho é identificado ao chegar perto.
  - A saída pela porta volta à Propriedade.
  - Nenhum erro de JavaScript. Captura em `docs/planejamento/qa-interiores/galinheiro-noite.png`.
