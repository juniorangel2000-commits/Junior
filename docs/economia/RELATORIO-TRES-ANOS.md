# Três anos de After Rain — economia depois da preview.48 (23/11/2026)

Pedido do Junior: "vamos fazer outro relatório" e "dessa vez conseguimos reproduzir 3 anos?".

O relatório anterior, de 1 ano, está em [RELATORIO-ANO-1.md](RELATORIO-ANO-1.md). Este refaz a conta com o que mudou na preview.48:

- **Vigor:** a enxada gasta 1 por canteiro, o regador 1 a cada 2 regas e a pesca 3 por arremesso. A cama recupera tudo.
- **Chuva:** em dia de chuva a horta já amanhece regada.
- **Animais:** não se compram mais. Vêm de graça, com a corda, dos cenários.

## Como foi feito

**Jogador simulado** (`scripts/economia/jogador.test.ts`, gera [JOGADOR-TRES-ANOS.md](JOGADOR-TRES-ANOS.md)):

- Joga 336 dias seguidos, ou seja, 3 anos, com o código real da horta, da mochila e das lojas.
- Trabalha 15 minutos reais por dia e escolhe a planta que mais rende para os dias que faltam na estação.
- Tem 100 de vigor por dia. Quando o vigor acaba, pode comprar refeição na pousada: 28 C por 50 de vigor.
- A chuva entra sozinha, porque a simulação usa a horta de verdade.

**Tabelas por atividade** (`scripts/economia/ano.test.ts`, gera [SIMULACAO-ANO.md](SIMULACAO-ANO.md)). A tabela dos animais agora mostra:

- onde cada animal aparece;
- em que construção ele mora;
- quanto vale a construção.

Para rodar de novo: `ECONOMIA=1 npx vitest run scripts/economia`.

## No navegador: 3 anos jogados

- O jogo rodou 337 noites seguidas, do Ano 1 até a Primavera 1 do Ano 4, com horta plantada, rega e colheita.
- A cada virada de estação, a página foi recarregada e a partida continuou pelo "Continuar". Foram 12 recargas, e todas voltaram na data certa.
- **Chuva:** em 89 dias a horta amanheceu regada sozinha, sem nenhuma falha.
- **Vigor:** o personagem dormiu cansado todas as noites, com 5 de vigor, e acordou com 100 em todos os dias. A barra da tela acompanhou.
  - O teste chamou a mesma recuperação que a cama usa, sem deitar na cama de verdade.
- **Animais:** uma vez por ano, uma vaca foi presa com a corda nos Campos e levada até a propriedade: wild-cow-4, depois wild-cow-5, depois wild-cow-6.
  - Cada vaca levada saiu do sorteio, e no ano seguinte apareceu outra.
- **Plantas:** as que estavam fora de estação murcharam na virada, como previsto.
- Não apareceu nenhum erro de página nem de console.

## Resultado: dinheiro no fim de cada ano

| Estratégia | Ano 1 | Ano 2 | Ano 3 | Canteiros | Dias sem vigor | Refeições |
| --- | --- | --- | --- | --- | --- | --- |
| Só horta | 47.920 | 121.312 | 194.704 | 165 | 1 | 0 |
| Só horta, comprando refeições | 47.892 | 121.284 | 194.676 | 165 | 0 | 1 |
| Horta + Pomar + Costa + pesca | 86.538 | 182.928 | 279.816 | 165 | 68 | 0 |
| Horta + Pomar + Costa + pesca, comprando refeições | 87.030 | 184.196 | 281.772 | 165 | 2 | 66 |
| Só os 45 canteiros iniciais + coleta e pesca | 62.256 | 127.554 | 192.830 | 45 | 68 | 0 |

Em 3 anos houve 86 dias de chuva com horta plantada, cerca de 26% dos dias.

## O que os números mostram

1. **O dinheiro cresce sempre no mesmo ritmo e não tem onde ser gasto.**
   - Do ano 2 em diante, cada ano rende a mesma coisa: cerca de 73 mil só com a horta e cerca de 95 mil com tudo.
   - No fim do ano 3, o jogador tem entre 190 e 280 mil coroas.
   - Os únicos gastos grandes continuam sendo os lingotes das ferramentas (ouro 750, metal negro 5.000) e os materiais das construções.
   - Este é o maior problema da economia hoje.

2. **O vigor quase não limita a horta.**
   - Quem limita é o tempo do dia: 165 canteiros já ocupam os 15 minutos.
   - Regar 165 canteiros custa cerca de 82 de vigor, então sobra vigor.

3. **O vigor limita a pesca.**
   - Com 3 de vigor por arremesso, quem pesca muito fica sem vigor em 68 dias dos 3 anos.
   - A refeição da pousada resolve barato: 66 refeições custaram 1.848 C em 3 anos e renderam cerca de 3.800 C a mais de peixe.
   - Ou seja, a comida tem função, mas é barata demais para pesar.

4. **A chuva poupa trabalho, mas não aumenta a renda do jogador simulado.**
   - Em cerca de 1 dia a cada 4, a rega fica de graça.
   - O jogador simulado não usa esse tempo livre para outra coisa. No jogo real, o tempo vai para a mina, a pesca, os animais e a cozinha.

5. **Os animais ficaram muito em conta.**
   - Vêm de graça com a corda. A construção vale de 190 a 330 C em materiais e se paga em 2 a 4 dias com a casa cheia.
   - Exemplos: 6 galinhas rendem cerca de 120 C por dia, e 4 cabras cerca de 144 C por dia.
   - O limite natural é encontrar os animais no sorteio de cada dia e levá-los até a propriedade.

6. **A horta pequena com pesca ainda rende quase o mesmo que a horta grande.**
   - Com só 45 canteiros, a pesca trouxe 105 mil C em 3 anos, e o total ficou quase igual ao de "só horta".
   - Isso já acontecia no relatório do ano 1.

## O que a simulação não cobre

- Animais, máquinas e cozinha não entram no jogador simulado. Aparecem só nas tabelas por atividade.
- Aspersores e melhorias de ferramenta, que aumentariam a horta nos anos 2 e 3, também não entram.
- A mina e os seus minérios ficam de fora.

## Decisões para o Junior

1. **Onde gastar o dinheiro.** É a maior pendência. Algumas ideias:
   - ampliar a casa;
   - móveis e decoração;
   - comprar terrenos para a horta;
   - reformar a Vila (ponte, praça, estação);
   - animais raros ou de raça.
2. **Preço da refeição.** 28 C por 50 de vigor é barato perto do que um dia rende. Dá para subir o preço ou deixar a comida caseira mais vantajosa.
3. **Vigor da horta.** Se a ideia é o vigor limitar a horta, a rega teria que custar 1 por canteiro em vez de 1 a cada 2.
4. **Pesca com horta pequena.** Se incomodar que a pesca renda tanto, dá para baixar o peixe comum de 12 C para 10 C ou subir o vigor do arremesso.

---

## Depois das obras grandes (23/11/2026)

Rodada pedida pelo Junior depois de entrarem a casa ampliada, a estufa, as obras do Vale e os moradores novos.

### Em código

Duas estratégias novas no jogador simulado ([JOGADOR-TRES-ANOS.md](JOGADOR-TRES-ANOS.md)) pagam as obras assim que sobra dinheiro além de uma reserva de 3 mil.

- **Ordem das obras:** casa, estufa, ampliação da estufa, moinho, ponte, farol, Estação e casas novas.
- **Materiais:** entram pelo preço das lojas.
- **Estufa:** depois de pronta, o jogador planta, rega e colhe nela todo dia, gastando tempo e vigor.

| Estratégia | Fim do ano 1 | Fim do ano 2 | Fim do ano 3 | Obras pagas |
| --- | --- | --- | --- | --- |
| Só horta, sem obras | 47.920 | 121.312 | 194.704 | — |
| Só horta, pagando as obras | 7.910 | 36.732 | 8.494 | casa completa (dia 165), estufa (dia 336) |
| Horta + Pomar + Costa + pesca, sem obras | 87.030 | 184.196 | 281.772 | — |
| Horta + Pomar + Costa + pesca, pagando as obras | ≈ 47 mil | ≈ 100 mil | ≈ 11 mil | casa completa (dia 122), estufa (236), ampliação (292), moinho (331) |

- **O dinheiro passou a ter destino.** Em 3 anos, o jogador completo gasta cerca de 280 mil coroas em obras e termina com uns 11 mil.
- **Ponte, farol, Estação e casas novas** ficam para os Anos 4 a 6, que é o longo prazo planejado.
- **Estufa:** em cerca de 95 dias de uso, a colheita do jogador completo subiu de 298 mil para 321 mil.
- **Casa:** a cozinha sai no começo do Ano 2. A casa completa custa menos de um ano de horta.

### No navegador (337 noites, até a Primavera do Ano 4)

As obras foram pagas pelo próprio serviço do morador, ao longo dos anos.

**Casa e estufa:**
- A sala maior foi paga no dia 40 e ficou pronta no dia 42; a casa passou para 16 × 12.
- O quarto ficou pronto no dia 118 (20 × 12) e a cozinha no dia 174 (20 × 14).
- A estufa ficou pronta no dia 245 e foi montada sozinha, perto da casa, na posição (53, 22).
- Cada etapa mostrou o aviso de obra pronta pela manhã.

**Moinho:** pronto no dia 304; o aviso "O moinho voltou a girar!" apareceu.

**Ponte (problema do teste, não do jogo):** a entrega foi recusada porque o Bento estava a caminho da Mina, com a ferraria fechada. É o comportamento certo do jogo: a obra fica no menu do Bento.
- Como a ponte não foi paga, o farol e a Estação ficaram bloqueados, como deveriam: "Primeiro termine…".
- O teste deveria ter tentado em outro dia.

**Casas novas:**
- Casa leste pronta no dia 330: "A Lúcia se mudou para a casa leste e abriu a padaria."
- Casa sul pronta no dia 332: "O Jonas se mudou para a casa sul e abriu o consultório."

**Restante:**
- As 12 recargas nas viradas de estação funcionaram.
- A chuva regou a horta em 89 dias, sem falhas.
- Uma vaca foi levada com a corda por ano.
- Nenhum erro de página.

**Ajuste feito por causa do teste:** a cozinha nova e a casa leste pediam "Ninho e baias", uma peça de galpão de animais. Agora pedem 6 vidros, que viram as janelas.

---

## Bateria de testes de tudo (23/11/2026)

Pedido do Junior: "vamos testar tudo e ver os resultados e ajustar o que precisa melhorar". Os scripts usados ficaram fora do repositório. Cada parte começou de uma partida gravada e aberta pelo "Continuar", como o jogador faria.

### Partidas salvas antigas

As versões preview.46 e preview.47 foram rodadas de verdade. Em cada uma foi criada uma partida com galinhas, pato e porco comprados, ovelha e cabra do Bosque e canteiros plantados.

- **Carregamento na versão nova:** as duas abrem pelo "Continuar" no dia certo, com o dinheiro e os animais preservados. Salvam de novo sem erro.
- **Saves com a corda em uso:** foram montados nove casos, como o de uma ovelha presa no Bosque, além de casos inválidos de propósito. A versão antiga e a nova aceitam e recusam exatamente os mesmos.

### Obras do Vale, trem e farol

**Ponte:**
- Entregue ao Bento às 8h e entrou em obra.
- Na Vila, a saída norte passou a perguntar "Floresta da Cidade" ou "Ruínas, pela ponte", e a segunda opção leva direto às Ruínas.
- O Bento vai à mina cerca de 2 dias por semana. Nesses dias, a obra da ponte e o vidro precisam esperar.

**Farol:** a Costa vira ponto de peixe raro das 19h às 5h só depois da obra. Ao meio-dia e sem farol, continua comum.

**Trem:**
- Vila → Estação → Costa → Vila: cada viagem cobra 30 coroas e soma meia hora no relógio.
- Com animal na corda, recusa: "Solte a corda antes de embarcar no trem."
- **Corrigido:** vindo da Costa ou da Estação, o jogador descia num ladrilho com obstáculo e ia parar na entrada oeste da Vila. Agora cada parada tem um ponto de descida livre ao lado da placa.

### Estufa

- **Plantio:** 24 morangos plantados no inverno.
- **Persistência:** a página foi recarregada e os canteiros continuaram lá, com a rega do dia.
- **Ciclo completo:** por 9 dias o jogador entrou, encheu o regador no barril (3 vezes por dia, com o regador de 8) e regou tudo. O morango ficou pronto no 8º dia regado e rendeu 24 morangos, e o pé volta a produzir em 4 dias.
- **Ampliação:** a estufa passa a ter 48 canteiros numa sala de 16 × 11.

### Serviços novos

- **Lúcia:** compra trigo, ovos e leite com 30% a mais. Vende pão caseiro e café da manhã reforçado. Às 19h recusa: "abre das 8h às 18h".
- **Jonas:** vende galinha (1.500), cabra (5.000) e duas vacas (6.000 cada), e depois avisa que não tem mais. Os animais aparecem na propriedade, perto da casa, num lugar livre.
- **Moinho:** 5 trigos, 3 milhos e 2 aveias viraram farinha, fubá e aveia em flocos, por 3 coroas cada.
- **Vidro:** 10 areias e 25 coroas rendem 5 vidros com o Bento.
- **Areia:** a Costa tem 12 pontos de areia, cada um rende 2 e volta no dia seguinte. São 24 areias por dia, o bastante para 12 vidros.

### Desempenho

O teste roda sem placa de vídeo, por isso os números absolutos são baixos. O que importa é a comparação entre os cenários, medida em quadros por segundo:

| Cenário | Quadros por segundo |
| --- | --- |
| Propriedade nova | 6,6 |
| Propriedade completa (casa 20 × 14, estufa ampliada, animais) | 6,9 |
| Estufa com 48 canteiros | 9,9 |
| Casa 20 × 14 | 13 |

As obras não deixaram o jogo mais pesado.

### Outros ajustes

- **Avisos com a tecla repetida:** nas trilhas, como na Costa e na Estação, o aviso mostrava a tecla duas vezes ("E E · Pegar o trem"). O selo já mostra a tecla, então o texto não a repete mais. A placa da Lúcia e do Jonas também foi ajustada.
- **Parede da casa ampliada:** a última janela da parede do fundo aparecia cortada pelo pilar do canto. Agora a parede é montada por baias inteiras (janela, pilar, quadro com luminária), e a sobra vira parede lisa.

### Jogador simulado com animais

Duas estratégias novas foram incluídas em [JOGADOR-TRES-ANOS.md](JOGADOR-TRES-ANOS.md).
- **Construções:** galinheiro a partir do dia 8, aprisco no dia 20 e curral no dia 35.
- **Animais:** 6 galinhas, 4 cabras e 4 vacas, trazidos com a corda, um a cada 2 dias.
- **Tempo:** cada animal leva 5 s de cuidado por dia.

| Estratégia | Fim do ano 1 | Fim do ano 2 | Fim do ano 3 |
| --- | --- | --- | --- |
| Tudo, sem animais e sem obras | 87.030 | 184.196 | 281.772 |
| Tudo + animais, sem obras | 108.832 | 244.010 | 379.679 |
| Tudo + animais, pagando as obras | 24.560 | 60.607 | 53.471 |

- **Retorno dos animais:** com 850 coroas de construções, os 14 animais renderam cerca de 112 mil em 3 anos. O tempo gasto com eles sai da pesca, que caiu de 52 mil para 42 mil.
- **Ritmo das obras:** com animais, o jogador paga a casa, a estufa, a ampliação, o moinho e a ponte até o dia 297. Farol, Estação e casas novas ficam para o Ano 4.
- **Decisão para o Junior:** os animais continuam rendendo muito pelo que custam. Dá para encarecer as construções, cobrar ração no inverno ou limitar a quantidade de galinheiros.

**O que ainda fica de fora da simulação:** máquinas (queijo, manteiga, geleia), cozinha, aspersores e mina.

---

## Construções de animais mais caras (24/11/2026)

Pedido do Junior: "vamos encarecer o galinheiro, aprisco e curral".

Além dos materiais, as três construções agora cobram a **mão de obra do Tobias** em coroas. A cobrança acontece no momento de concluir a obra com o martelo. Construções já prontas nas partidas salvas não pagam nada, e uma obra em andamento só precisa das coroas no fim.

| Construção | Mão de obra | Custo total (com materiais) | A casa cheia rende | Dias para se pagar |
| --- | --- | --- | --- | --- |
| Galinheiro | 3.000 C | 3.222 C | 120 C/dia (6 galinhas) | 27 |
| Aprisco | 4.000 C | 4.298 C | 144 C/dia (4 cabras) | 30 |
| Curral | 3.500 C | 3.830 C | 120 C/dia (4 vacas) | 32 |

O silo, o chiqueiro e o estábulo continuam sem mão de obra.

O jogador simulado com animais passa a gastar 11.350 C em construções, em vez de 850:

| Estratégia | Fim do ano 1 | Fim do ano 2 | Fim do ano 3 |
| --- | --- | --- | --- |
| Tudo, sem animais | 87.030 | 184.196 | 281.772 |
| Tudo + animais, antes | 108.832 | 244.010 | 379.679 |
| Tudo + animais, com a mão de obra | 98.332 | 233.510 | 369.179 |
| Tudo + animais, pagando as obras | 14.004 | 49.053 | 41.632 |

No primeiro mês, os animais agora pedem um investimento de verdade. Depois de pagos, continuam rendendo bem, que é o papel deles. Pagando as obras grandes, o jogador termina a ponte no dia 307, 10 dias depois do que antes.

---

## Refeição, rega e pesca (24/11/2026)

Pedido do Junior: "faça essas alterações", referindo-se às decisões pendentes do relatório.

| O quê | Antes | Agora |
| --- | --- | --- |
| Refeição da pousada (50 de vigor) | 28 C | 60 C |
| Vigor da rega (propriedade e estufa) | 1 a cada 2 canteiros | 1 por canteiro |
| Peixe comum (`FISH_PRICE`) | 12 C | 10 C |

O peixe identificado na peixaria continua ganhando o bônus de espécie e tamanho por cima desse valor.

### Três anos de novo

| Estratégia | Ano 1 | Ano 2 | Ano 3 | Dias sem vigor | Refeições |
| --- | --- | --- | --- | --- | --- |
| Só horta, sem comprar comida | 29.600 | 71.836 | 117.234 | 206 | 0 |
| Só horta, até 2 refeições por dia | 41.920 | 106.312 | 171.064 | 1 | 394 |
| Horta + Pomar + Costa + pesca, sem comida | 52.998 | 113.234 | 177.110 | 250 | 0 |
| Horta + Pomar + Costa + pesca, até 2 refeições | 75.962 | 162.482 | 249.646 | 4 | 460 |
| 45 canteiros + coleta e pesca, sem comida | 55.216 | 112.816 | 170.752 | 103 | 0 |
| Tudo + animais, sem obras | 87.816 | 212.708 | 338.325 | 4 | 460 |
| Tudo + animais, pagando as obras | 4.496 | 30.183 | 12.917 | 6 | 397 |

- **O vigor passou a limitar a horta.** Regar 165 canteiros custa 165 de vigor, e o dia começa com 100 (120 com o quarto). Sem comer, o jogador fica sem vigor em 206 dos 336 dias e ganha 117 mil em vez de 195 mil.
- **A comida tem papel.** Quem compra até 2 refeições por dia gasta cerca de 24 a 28 mil coroas em 3 anos e recupera a maior parte da renda.
  - A comida feita em casa, mais barata, não entra na simulação. Ela fica sendo o caminho natural, junto com os aspersores, que regam sem gastar vigor.
- **A pesca rende menos:**
  - Com tudo e 2 refeições: caiu de 52,7 mil para cerca de 42 mil em 3 anos.
  - Com horta pequena: ainda rende 83,5 mil, porque esse jogador quase não rega e usa o vigor para pescar. A horta pequena com pesca (171 mil) agora empata com a horta grande comprando comida.
- **Obras com animais:** a ponte sai no dia 331, em vez do 307.

**Para acompanhar:** se a horta grande parecer pesada demais no começo do jogo, os ajustes possíveis são aspersores mais baratos ou mais vigor no café da manhã feito em casa.
