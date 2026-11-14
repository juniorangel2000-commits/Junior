# After Rain 0.10.0-preview.34 — Estações, plantações e o cavalo

O ano agora tem estações. A horta ganhou 19 plantas, cada uma com sua época, e o
cavalo selvagem dos Campos Abertos pode ser domado com paciência e uma cesta de
colheita.

**Calendário**
- Quatro estações de 28 dias: Primavera, Verão, Outono e Inverno. A interface mostra a
  estação e o dia, com o ano logo abaixo (Ano 1, Ano 2…); ao passar o mouse aparece a
  data completa. A lista de saves também mostra a data.

**Plantações**
- As plantas crescem **um dia a cada dia em que foram regadas**; a rega vale para aquele dia.
  O nabo leva 4 dias regados.
- 19 plantas, com sementes vendidas na loja da Rosa:
  - legumes e verduras: nabo, alface, cenoura, tomate, batata-doce, abóbora, couve e repolho;
  - grãos: feijão, milho, trigo e aveia;
  - frutas: morango e melancia;
  - flores: margarida e girassol;
  - ervas: hortelã e camomila;
  - algodão.
- Cada planta tem suas estações. Plantar fora da época é recusado, e as plantas murcham
  na troca para uma estação que não é a delas. Algumas voltam a produzir depois da colheita.
- Nenhuma loja vende colheitas; a Rosa, a Helena, a Celina e a Amélia compram parte delas.
- A missão inicial agora pede uma semente da estação e termina na primeira colheita.

**Ipês-amarelos e madeira nobre**
- Seis ipês floridos existem só nos Campos Abertos. Só caem com machadinha de Ferro ou
  melhor, em seis golpes, e rendem madeira nobre: 1 com Ferro, 2 com Ouro e 3 com Metal
  Negro. Voltam a crescer em sete dias.
- Galinheiro, curral e estábulo pedem madeira nobre.
- O corte com machadinha ganhou animação de corpo inteiro nas quatro direções.

**O cavalo**
- O cavalo dos Campos Abertos pasta, mexe a cabeça e foge rápido.
- A Helena prepara a **cesta de colheita**: 1 cenoura + 1 morango (Primavera) + 1 milho
  (Verão) + 20 coroas.
- **Use a cesta nos Campos**: ela fica no chão e o cavalo vem comer. São **sete dias
  seguidos**; se faltar a cesta em um dia, a confiança volta a zero. Nos primeiros dias
  ele só se aproxima com você longe; depois passa a tolerar você por perto.
  Uma barra sobre ele mostra a confiança.
- Domado, ele vem até você e recebe um nome. Com o **estábulo** pronto, a corda (G)
  leva o cavalo até a Propriedade, onde ele passa a ser seu e pode morar no estábulo.
- O estábulo é um abrigo aberto para um cavalo.

Partidas anteriores continuam compatíveis: as plantações são convertidas para dias
regados preservando o progresso, e os itens novos chegam com estoque zero.

Validação: TypeScript, 1.929 testes em 218 arquivos e build de produção aprovados. No
Chromium foram conferidos o calendário, o cultivo por dias, a cadeia completa até a
cesta (sementes da Rosa, colheitas na Primavera e no Verão, Helena) e a doma completa,
do primeiro dia até o cavalo morando no estábulo.
