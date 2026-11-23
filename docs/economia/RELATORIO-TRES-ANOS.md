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
