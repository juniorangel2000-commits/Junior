# Gastos grandes e para sempre: plano (proposta para o Junior aprovar)

**Por quê:** o [relatório de três anos](../economia/RELATORIO-TRES-ANOS.md) mostrou que, a partir do Ano 2, o jogador ganha de 73 a 95 mil coroas por ano e quase não tem onde gastar.

**O que este plano faz:** cria gastos que mudam o jogo de verdade, nesta ordem:

1. ampliação da casa (5);
2. estufa (7);
3. reconstrução da Vila (9);
4. casas para novos moradores (11).

**Faixa de preço:**

- O Ano 1 continua com os gastos pequenos que já existem.
- No Ano 2, cada etapa grande deve custar o equivalente a 1 a 4 meses de renda (10 a 40 mil).
- Do Ano 3 em diante, os projetos da Vila custam de 30 a 150 mil e pedem materiais. Por isso não se resolvem só com dinheiro.

---

## 5. Ampliar a casa (com o Tobias, na carpintaria)

**Hoje:** a casa é um cômodo só, de 12 × 10 blocos (`src/systems/home.ts`). O desenho é recortado de uma imagem (`src/home-room-art.ts`).

| Etapa | Custo | Materiais | Leva | O que muda |
| --- | --- | --- | --- | --- |
| 1. Sala maior | 10.000 C | 60 tábuas, 20 pedras | 2 dias | O cômodo vai de 12 × 10 para 16 × 12. Os limites de móveis dobram: mais cadeiras, estantes e vasos. |
| 2. Quarto | 25.000 C | 80 tábuas, 10 madeiras de lei, 1 kit de porta | 3 dias | Nova porta ao norte leva a um quarto separado. A cama do quarto dá +20 de vigor extra pela manhã. |
| 3. Cozinha e despensa | 40.000 C | 40 tijolos, 20 pedras, 2 kits de janela | 4 dias | Fogão e forno dentro de casa, sem gastar lenha da rua. A despensa guarda 30 tipos de item fora da mochila. |

- **Como funciona:** o Tobias pega a encomenda e cobra na hora. Nos dias de obra, a casa mostra andaimes por fora e você dorme normalmente. Ao terminar, a casa por fora fica maior.
- **No save:** um novo campo `homeLevel`, de 0 a 3. Saves antigos começam em 0, e os móveis ficam onde estavam.
- **Arte necessária:**
  - casa por fora em três tamanhos;
  - parede e piso que possam ser repetidos para o cômodo maior;
  - quarto e cozinha.

  Faço uma versão provisória a partir da arte atual; você pode pedir a definitiva ao ChatGPT.

## 7. Estufa (construção na propriedade)

Nova construção no menu de obras, ao lado do galinheiro e do curral.

- **Custo:** 100.000 C (decisão do Junior), mais 60 tábuas, 30 vidros e 10 madeiras de lei. O vidro seria novo: feito no forno com 2 areias. A areia é recolhida na Costa.
- **Dentro:** 24 canteiros que plantam qualquer semente em qualquer estação. Não murcham na virada e não precisam de chuva. A rega gasta vigor normal.
- **Limite:** uma estufa por propriedade. Mais tarde, dá para ampliar para 48 canteiros por mais 60.000 C.
- **Por que vale:** no inverno, quase nada cresce lá fora. A estufa vira o motor do inverno. Custando 100 mil, ela é a meta do fim do Ano 1 ou do começo do Ano 2.
- **Arte:** a estufa da Rosa na Vila serve de base para a versão provisória. O interior usa o chão da horta.

## 9. Reconstrução do Vale (o grande objetivo, a partir do Ano 2)

**A ideia:** o mundo de After Rain é um vale que está se recuperando depois da chuva. Os enfeites quebrados e as estradas sem destino viram obras que o jogador financia.

**Quadro de obras:** fica na Casa Comunitária, que já é reformável e tem um quadro. Lá aparecem as obras abertas, quanto já foi doado e o que cada uma libera.

- Dá para doar aos poucos, em coroas e materiais.
- Cada obra tem um morador responsável, que comenta o avanço.
- Ao terminar, a obra é inaugurada com uma cena curta e muda o mapa.

| # | Obra | Onde | Custo | Materiais | Responsável | O que libera |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Moinho da Vila** | moinho (hoje enfeite) | 30.000 C | 40 tábuas, 20 pedras, 4 tecidos de lã | Augusto | As pás voltam a girar. O moinho mói trigo, milho e aveia por uma taxa pequena, sem a máquina de casa. Dias de vento soltam farinha extra. |
| 2 | **Coreto e praça** | coreto e fonte | 40.000 C | 30 tábuas, 10 vasos de flor | Helena | Música nas noites de sábado: todos os moradores vão à praça e a amizade sobe. Os festivais ganham palco e barracas fixas. |
| 3 | **Ponte nova da Floresta da Cidade** | caminho da Vila para a Floresta da Cidade | 60.000 C | 20 lingotes de ferro, 40 tábuas | Bento | Atalho para as Ruínas, com a carroça do Damião passando. O caminho com a corda fica mais curto. |
| 4 | **Farol da Costa** | ponta da Costa | 80.000 C | 15 lingotes de ouro, 30 pedras, 10 vidros | Damião | Pesca noturna na Costa, com peixes raros novos. Um barco passa a visitar o píer uma vez por semana com mercadorias de fora. |
| 5 | **Estação reativada** | Estação | 150.000 C | 40 lingotes de ferro, 10 de ouro, 20 peças metálicas | Ícaro e Nilo | O trem volta. Dá para viajar rápido entre a Estação, a Vila e a Costa, e a estrada leste da Estação, que hoje não leva a nada, ganha um destino. |
| 6 | **Celeiro comunitário** | celeiro (hoje enfeite) | 50.000 C | 60 tábuas, 30 pedras | Rosa | Feira semanal: os moradores compram parte da sua colheita a preço cheio. Também guarda a colheita de quem doar. |

- **Ordem sugerida:** Moinho → Coreto → Celeiro → Ponte → Farol → Estação.
- **Total:** cerca de 410 mil coroas, mais materiais. Isso cobre do Ano 2 até o Ano 4 ou 5.
- **Cada obra exige a anterior.** Isso cria a sensação de que o Vale está se reerguendo.
- **No save:** `valeRebuild: {obra: {coins, items, done, day}}`, um campo opcional e validado.
- **Arte:** cada obra tem uma versão "antes" (a atual) e uma "depois": moinho girando, coreto enfeitado, ponte, farol, trem. Faço provisórias para testar, e você manda as definitivas.

## 11. Casas para novos moradores (as casinhas leste e sul)

As duas casinhas da Vila (`casa-leste` e `casa-sul` em `src/data/village-landmarks.ts`) hoje são só enfeite. A ideia é que elas possam ser reformadas para receber uma família nova.

| Casa | Reforma | Morador que chega | O que ele traz |
| --- | --- | --- | --- |
| Casa leste | 45.000 C, 50 tábuas, 1 kit de porta, 2 kits de janela | **Padaria da Lúcia** | Compra trigo, farinha, ovos e leite a preço melhor. Vende pão, bolo e café da manhã. Ensina 3 receitas de forno novas. |
| Casa sul | 60.000 C, 60 tábuas, 10 madeiras de lei | **Veterinário (o Jonas)** | Cuida dos animais: animais doentes param de produzir até serem tratados. Vende animais de raça (ideia 8): galinha caipira, vaca leiteira e cabra leiteira, que rendem 1,5 vez mais. Ensina a fazer ração. |

- Cada morador novo tem rotina, amizade, presentes e uma história, como os outros dez.
- Depois da obra, a casa ganha porta e interior com loja.
- **Arte necessária:** dois personagens novos, com caminhada em 4 direções e retrato, além do interior das duas casas. É a parte que mais depende de arte. Posso preparar o pacote de pedidos para o ChatGPT, como fiz com os animais.

---

## Ordem de trabalho proposta

1. **Base:** dinheiro e materiais em etapas, com o quadro de obras e o save. É o mesmo sistema para a casa, a estufa e as obras.
2. **Ampliação da casa (5):** com arte provisória.
3. **Estufa (7):** com arte provisória e o vidro e a areia novos.
4. **Obras 1 e 2 (moinho e coreto):** usam arte que já existe com pequenas animações.
5. **Pacote de arte para o ChatGPT:** obras 3 a 6 e os dois moradores novos.
6. **Obras 3 a 6 e moradores novos (11):** conforme a arte for chegando.
7. **Rodar de novo os 3 anos:** em código e no navegador, conferindo se o dinheiro passa a ter destino.

## O que preciso que o Junior decida

- Os valores e a ordem das obras estão bons?
- Os moradores novos (padaria e veterinário) combinam com o Vale, ou prefere outros? Por exemplo: apicultor, músico ou relojoeiro.
- A estrada leste da Estação deve levar a um cenário novo ou à cidade grande?
