# Cinco anos de After Rain — teste de tudo com as conquistas (24/11/2026)

Pedido do Junior: "vamos fazer o teste de tudo como antes e vamos incluir as conquistas" e "vamos gerar 5 anos". Versão testada: `release/v0.10.0-preview.49`.

## Em código: 5 anos (560 dias)

Jogador simulado (`ECONOMIA=1 npx vitest run scripts/economia`; tabelas completas em [JOGADOR-CINCO-ANOS.md](JOGADOR-CINCO-ANOS.md)). Valores atuais: refeição 60 C, rega 1 de vigor por canteiro e peixe comum 10 C.

| Estratégia | Ano 1 | Ano 2 | Ano 3 | Ano 4 | Ano 5 | Canteiros | Dias sem vigor | Refeições | Dias de chuva |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Só horta, sem comprar comida | 29.600 | 71.836 | 117.234 | 160.176 | 202.965 | 165 | 354 | 0 | 151 |
| Só horta, compra até 2 refeições por dia | 41.920 | 106.312 | 171.064 | 236.056 | 300.928 | 165 | 1 | 676 | 150 |
| Horta + Pomar + Costa + pesca, sem comprar comida | 52.998 | 113.234 | 177.110 | 239.432 | 302.221 | 165 | 412 | 0 | 151 |
| Horta + Pomar + Costa + pesca, até 2 refeições | 75.962 | 162.482 | 249.646 | 338.018 | 426.041 | 165 | 4 | 760 | 150 |
| Só os 45 canteiros iniciais + coleta e pesca, sem comida | 55.216 | 112.816 | 170.752 | 229.272 | 288.002 | 45 | 164 | 0 | 150 |
| Só horta, pagando as obras | 16.520 | 36.250 | 46.574 | 98.336 | 53.208 | 165 | 353 | 0 | 151 |
| Horta + Pomar + Costa + pesca, pagando as obras, até 2 refeições | 36.792 | 81.082 | 10.710 | 20.675 | 35.215 | 165 | 51 | 721 | 150 |
| Tudo + animais (galinhas, cabras, vacas), sem obras, até 2 refeições | 87.816 | 212.708 | 338.325 | 464.362 | 591.038 | 165 | 4 | 759 | 150 |
| Tudo + animais, pagando as obras, até 2 refeições | 4.496 | 30.183 | 12.917 | 62.225 | 44.014 | 165 | 6 | 699 | 150 |

**Obras pagas pelo jogador completo, com animais:**
- casa completa até o dia 112;
- estufa no dia 196 e ampliação no 251;
- moinho no 277 e ponte no 331;
- farol no 403 e Estação no 525.

O dinheiro do jogo tem destino durante os 5 anos. A Estação, a obra mais cara, sai no 5º ano. As casas da Lúcia e do Jonas ficam para o 6º.

Sem obras, o jogador completo chega ao ano 5 com cerca de 591 mil coroas. Pagando as obras, termina cada ano com uma reserva entre 4 mil e 62 mil.

## No navegador: 5 anos (560 noites, até a Primavera do Ano 6)

**Jogo e salvamento**
- Sem nenhum erro de página.
- As 20 recargas de estação voltaram na data certa.
- A chuva regou a horta em 155 dias, com 0 falhas.
- O vigor voltou a 100 em todas as manhãs.

**Animais:** uma vaca por ano trazida com a corda. As 5 foram para a propriedade.

**As 11 obras ficaram prontas, cada uma com o seu aviso:**
- casa, nos dias 42, 118 e 174;
- estufa, no dia 245, montada em (53, 22), e ampliação, no 343;
- moinho, no 304, ponte, no 389, farol, no 436, e Estação, no 487;
- Lúcia, no 524, e Jonas, no 535.

**A ponte foi recusada 4 dias seguidos** porque o Bento estava "a caminho da Mina". Não é defeito do jogo: o Bento anda de verdade até a mina e de volta, e o teste pula cada dia em menos de um segundo. Num jogo normal, com dias de 18 minutos, ele volta no mesmo dia.

**Conquistas no navegador: 0.** O jogador automático começa direto na horta, sem fazer o tutorial (fabricar a enxada). Como a trilha é linear, nada se abre antes do capítulo 1. Para um jogador de verdade isso não acontece, porque o tutorial é o começo obrigatório. O funcionamento das conquistas foi provado nos testes abaixo.

## Conquistas

**Jornada completa** (`tests/missions-journey.test.ts`):
- Uma partida que fez tudo ganha as 46 conquistas, na ordem da trilha, até "O Vale Renasceu".
- Todas as 266 missões podem ser cumpridas com o que o jogo guarda, com nomes de itens, cenários e serviços corretos.

**No navegador, primeiros capítulos:**
- Cada passo da primeira colheita marcou a missão.
- Ao colher, saíram o aviso e o efeito da conquista "Mãos na terra", e o capítulo seguinte se abriu.
- A aba Conquistas mostrou a medalha com o dia.
- Os vídeos foram enviados ao Junior.

**Partidas antigas:**
- Os saves da preview.46 e da preview.47 abrem na versão nova; os dois não tinham feito o tutorial e ficam com 0 conquistas.
- Um save avançado da preview.48 recebeu na hora "Mãos na terra" e "Primeiro teto", com aviso, e o painel abriu no capítulo 3.
- Missões de cenário, como "Chegar à Vila", só contam a partir desta versão, porque os saves antigos não guardavam os lugares visitados.

**Ações que contam para as missões:**
- viagem de trem;
- moer grãos no moinho;
- fundir vidro.

**Custo:** acompanhar as missões leva cerca de 0,3 ms por salvamento e o painel 0,01 ms. O registro ocupa uns 3 KB no save.

## Obras, trem e serviços (de novo)

- **Ponte e farol:** a ponte leva às Ruínas, e o farol vale das 19h às 5h.
- **Trem:** nas 3 paradas, com passagem de 30 C e meia hora no relógio. A chegada à Vila é ao lado da placa. Com animal na corda, recusa.
- **Serviços:** moinho, vidro e areia funcionando.
- **Erros:** nenhum.
