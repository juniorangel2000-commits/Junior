# After Rain 0.10.0-preview.36 — Qualidade e equilíbrio de preços

Cuidar bem dos animais agora rende produtos melhores, e os preços das máquinas e dos
pratos seguem uma regra: transformar sempre vale mais do que vender cru.

**Amizade dos animais**
- Galinhas, patos, vacas, cabras, ovelhas e porcos têm amizade de 0 a 30.
- Sobe 1 a cada manhã em que o animal comeu do cocho e mais 1 com o carinho do dia:
  dentro do abrigo, chegue perto do animal e aperte E. Um coração sobe sobre ele.
- Cai 2 a cada manhã em que o cocho estava vazio para ele.
- A dica sobre o animal mostra a amizade e a qualidade que ele produz.

**Qualidade dos produtos**
- Amizade 10 produz **bom**; 25 produz **excelente**.
- Ovos, ovos de pato, leite, leite de cabra e lã saem com a qualidade do animal.
- Queijo, manteiga, novelo e tecido de lã herdam a qualidade do que entrou na máquina.
- Os pratos herdam a qualidade média dos ingredientes de animal.
- Bom vale 1,25× e excelente 1,5× na venda; pratos bons e excelentes também
  recuperam mais vigor. A venda e a cozinha usam primeiro as melhores unidades.
- Na mochila, estrela prateada (bom) ou dourada (excelente), e o detalhe do item diz
  quantas unidades de cada qualidade você tem.

**Equilíbrio de preços**
- Produto de máquina vale pelo menos 1,3× o que entra nela. Prato vale os ingredientes
  e a lenha, com lucro de 35% no fogão, 45% no forno e 30% na fogueira.
- **Moinho:** agora mói 1 grão por farinha, fubá ou aveia em flocos (antes eram 2).
  Farinha 32, fubá 37 e aveia em flocos 32.
- **Tear:** faz **tecido de lã**, um item novo que a Celina compra por 150.
- Geleia de melancia: 370.
- Pratos com preços novos, por exemplo: omelete de couve 55, pão caseiro 130, café da
  manhã reforçado 210, torta de morango 275 e pão com queijo e mel 285.

**Correções**
- Máquinas da Propriedade e dos abrigos guardam a qualidade do produto.
- Comer um prato fora da Propriedade mantém o efeito do prato na partida.

Partidas anteriores continuam compatíveis: os produtos guardados são comuns, a
amizade começa em zero, e fornadas do tear já carregadas entregam tecido de lã.

Validação: TypeScript, 2.089 testes em 236 arquivos e build de produção aprovados. No
Chromium foram conferidos o carinho, o ovo excelente, a estrela na mochila, o queijo
excelente, as máquinas, a cozinha e as conservas.
