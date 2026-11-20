# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** montaria masculina aprovada na revisão do chat e integrada na Propriedade. Arte feminina e atlas original do cavalo preservados.

## Feito nesta rodada

- Depois da revisão visual com o Junior, a pose frontal do fazendeiro passou a ter as pernas abertas em diagonal, como na pose montada da fazendeira. A altura frontal segue a prévia final, com pequeno ajuste ao passo para esconder a faixa escura acima da crina.
- `scripts/prepare-male-mounted.cjs` usa a fonte frontal `referencias/personagens/montaria/masculino-frente.png` e as outras sete poses de `farmer-male-seated.png`. Recorta sem reduzir os pixels. O novo atlas `farmer-male-mounted.png` mede 1533×775 e registra dimensões e pontos de encaixe por quadro.
- O recorte frontal copia os pixels da cabeça do cavalo a partir do atlas original. São 17 quadros de orelhas e crina, compactados numa folha separada. A sobreposição fica à frente do cavaleiro só ao olhar para sul. As mãos, as botas e as laterais do corpo continuam visíveis.
- O adaptador da montaria e a tela de carregamento usam as mesmas coordenadas da arte. A chave da textura de montaria e o formato do save continuam compatíveis.
- A comparação byte a byte confirmou os sete quadros já existentes e os 17 recortes copiados do cavalo. A conferência no Chromium partiu de uma partida na Propriedade, montou com V e verificou frente, costas, esquerda e direita ao passo e no galope, com Shift. Capturas frontais em `docs/planejamento/qa-montaria-preview44/`.
- A revisão das ferramentas, as rotinas da vila, as passadas de Marina e Rui e a porteira a 90 graus estão em `a106cdb:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Sincronizar o efeito da pá e da foice com o quadro de contato. Hoje as ações via inventário mudam o solo ou recolhem a vegetação no início da animação. Testar pelo inventário na Propriedade e a foice também nos Campos e na Floresta. A enxada e o regador já aplicam o efeito no contato.
- Revisar a lâmina da enxada no impacto para que sua direção fique legível. Preservar escala, pegada e sprites dos ícones.
- O fazendeiro montado usa uma pose por direção e acompanha o lombo animado. Uma pose de tronco própria para o galope fica para uma revisão de arte futura, se pedida.

## Pendências e ideias para depois

- Diagonais autorais para Marina e Rui com as caminhadas originais do jogador como referência.
- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- Base: `npm ci` pelo cache, `npm run check` e 2.203 testes passando.
- Integração: `npm run check`, conferência das quatro vistas principais na Propriedade e auditoria de pixels passaram.
- Final: 2.204 testes em 263 arquivos e build passaram. O build inclui os dois novos atlas e seus metadados.
