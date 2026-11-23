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
