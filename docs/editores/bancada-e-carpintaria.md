# Bancada e peças de madeira

A bancada é montada inicialmente com martelo, quatro tábuas brutas e quatro cavilhas, sem exigir outra estação. Ao colocá-la, as mãos são selecionadas. Mãos + E na bancada abre a fabricação; C também a abre quando ela estiver ao alcance.

Banco e cerca deixam de ser construções diretas a partir de madeira solta. A bancada fabrica:

- Banco de madeira: 10 madeiras e 4 tábuas regulares; martelo necessário; três segundos.
- Módulo de cerca: 3 madeiras; martelo necessário; um segundo e meio.

As peças prontas ficam na mochila e podem ser obtidas também na vila. B seleciona o que posicionar; usar a peça na mochila também entra no posicionamento. R troca entre as quatro vistas do banco. Posicionar consome uma peça, sem cobrar os ingredientes novamente. Recolher retorna a peça pronta para reposicionar. Fechar a fabricação em andamento cancela o processo sem gastar materiais.

Bancos usam as sprites detalhadas da praça, em quatro vistas, com a mesma ocupação de um bloco das construções anteriores. Cercas e suas prévias usam a arte conectada de madeira; os desenhos antigos de blocos foram removidos. O desgaste visual existente continua compatível, e o reparo substitui um trecho usando um módulo pronto. Cercas e bancos das partidas antigas mantêm posição e colisão, usando a arte atual e podendo ser recolhidos como peças.

Verificação: `tests/woodwork.test.ts`, testes de construção/cercas e `scripts/qa-workshop.cjs`. O teste real cobre construção da bancada, interação por E, cancelamento, fabricação, giro, colocação, conexão, recolhimento, reposicionamento e salvamento.
