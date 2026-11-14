# Domesticação do cavalo

Implementada em 14/11/2026 (Claude Code). O estábulo foi feito pelo Codex (commit `64dab91`): abrigo **aberto**, sem cerca nem porteira, para 1 cavalo, com 12 madeiras nobres no custo. A doma completa foi conferida no jogo, do primeiro dia até "Alojar Trovão". Código em `src/systems/horse-taming.ts`; testes em `tests/horse-taming.test.ts`;
conferência no navegador em `scripts/qa-horse-taming.cjs`.

## Regras em vigor (decisões do Junior)

- **Comida:** cesta de colheita da Helena, com **1 cenoura + 1 morango (Primavera) + 1 milho (Verão) + 20 C**.
- **Sem cocho.** O jogador **usa** a cesta (mochila ou barra rápida) nos Campos Abertos e ela
  **fica no chão** à frente dele, como objeto do cenário, não como item solto. O cavalo vai até ela.
  - Uma cesta de cada vez.
  - Com E perto dela, a cesta volta para a mochila enquanto o cavalo não comeu.
  - Lugares apertados (colados em tronco, pedra ou parede) são recusados, porque o cavalo é largo e não alcançaria.
  - Usar a cesta fora dos Campos mostra um aviso, e a cesta continua na mochila.
- **Confiança:** +1 por dia em que o cavalo come a cesta, no máximo uma vez por dia; são 7 dias.
  **Um dia inteiro sem cesta faz a confiança voltar a zero** (os 7 dias precisam ser seguidos).
  A doma completa não se perde.
- Barra de confiança (7 quadrinhos) sobre o cavalo selvagem; nome sobre o cavalo domado.
- **Fases:**

  | Dia de alimentação | Distância que você precisa manter da cesta | Raio de fuga |
  | --- | --- | --- |
  | 1–2 | 300 px | 196 px |
  | 3–4 | 170 px | 120 px |
  | 5–7 | 56 px | 56 px |

- **Fora dos Campos:** se você deixa a cesta e sai do cenário, o cavalo come sozinho naquele dia,
  e o efeito é aplicado quando você volta. Com você nos Campos, ele vai até a cesta na própria cena.
- **Domado (dia 7):** não foge mais e vem até você. Com E, você dá o nome numa janela: até
  16 letras, com espaço, hífen e apóstrofo. Depois do nome, E faz carinho.
- **A corda só depois da doma completa**, do nome e **com o estábulo pronto**. É na tecla G e
  gasta 1 corda; G de novo solta, e a corda volta.
  - Com o cavalo ao lado, você atravessa a passagem norte e ele chega na Propriedade.
  - Lá, G solta a corda e ele passa a ser seu.
  - O painel da construção mostra "Alojar <nome>".
- O estábulo passou a ser exigido para a corda, e não para o cavalo comer, porque o estábulo ainda
  não existe e a doma precisa ser testável. Se o Junior preferir, a exigência pode voltar a valer
  para comer, em `OpenFieldsWorld.basketFor`.

## Encaixe do estábulo (para o Codex)

- Criar o estábulo em `FARM_KINDS` e `FARM_BUILDINGS` (`src/data/farm-buildings.ts`) com
  **`animal:'horse'`**, capacidade 1 e **madeira nobre** no custo. O teste em
  `tests/ipe-trees.test.ts` exige madeira nobre em toda construção com animal.
- Nada mais na doma precisa mudar: `stableReady` reconhece qualquer construção pronta com
  `animal:'horse'`, e `assignFarmAnimal` e o painel já aceitam o cavalo (`src/data/domestic-animals.ts`).
- Também é preciso: arte em `src/farm-construction-view.ts` (o atlas usa `<tipo>-<estágio>`), ícone
  `farm-<tipo>` em `src/visual-assets.ts`, ferramenta `farm-<tipo>` em `Tool` (`src/types.ts`),
  `TOOLS` (`src/systems/save.ts`) e `QUICK_TOOLS` (`src/systems/quickbar.ts`).
- **Feito.** `scripts/qa-horse-taming.cjs` agora segue até o fim: corda recusada sem estábulo, estábulo pronto, corda (G), travessia para a Propriedade, soltar (o cavalo vira do jogador) e "Alojar Trovão".

## Depois

- Chamar o cavalo de longe, montaria (pode exigir sela fabricada) e usar os quadros de deitar,
  descansar e levantar.

## Animações e fuga já integradas

- Novo pacote `create_a_horse_with_medium_details-v2.zip`, com 308 quadros originais preservados.
- Comer: `Eat_Start` → `Eating` por 4–7 segundos → `Eat_End`. Só inicia junto de capim crescido e com jogador afastado. Ações interrompidas concluem as transições antes da fuga.
- Mexer a cabeça toca uma vez, por cerca de 2,2 segundos.
- Há intervalos independentes de 8–15 segundos entre ações. Pausa não avança o ciclo. Nenhuma ação de idle roda infinitamente.
- Fuga do cavalo usa 2,2 vezes a velocidade básica, superior à corrida do jogador com botas.
- Pastar e mexer a cabeça são visuais: NÃO concedem confiança nem substituem a comida especial.

Deitar, descansar e levantar do novo pacote estão preservados no atlas, para
integração posterior. Não confundir os arquivos disponíveis com ações já ativas.
