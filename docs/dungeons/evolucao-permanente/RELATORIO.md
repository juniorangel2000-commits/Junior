# Evolução permanente — interface e custos

Revisão local posterior à preview.13. Sem publicação. Os atributos adquiridos e o XP guardado foram preservados; não há reinício ou cobrança retroativa. Recompensas de XP e os bônus por atributo continuam iguais.

## Custos

A compra usa o nível atual do atributo, de 0 a 19. Personagem: `150 + 60 × nível + 10 × nível²`. Pet: `120 + 50 × nível + 8 × nível²`. O limite permanece em 20 por atributo. A mesma função é usada no débito e na interface.

| Nível a adquirir | Personagem | Pet |
| --- | ---: | ---: |
| 1 | 150 XP | 120 XP |
| 5 | 550 XP | 448 XP |
| 10 | 1.500 XP | 1.218 XP |
| 15 | 2.950 XP | 2.388 XP |
| 20 | 4.900 XP | 3.958 XP |

Maximizar um atributo do personagem custa 39.100 XP, contra 5.250 anteriormente. Os seis totalizam 234.600 XP, contra 31.500. No pet, um atributo custa 31.660 XP, contra 4.200; os cinco totalizam 158.300 XP, contra 21.000. Personagem e cada pet continuam com saldos próprios.

## Interface

A evolução ganhou cards por atributo, barra de progresso, nível atual, bônus acumulado, efeito do próximo nível, preço, saldo após a compra ou XP faltante. Atributos concluídos mostram nível máximo. A seleção permite alternar entre personagem e cada companheiro, com saldo específico. A tela informa o escopo dos efeitos nas dungeons e a exceção de velocidade/percepção dos pets na floresta de acesso.

Compras atualizam a tela e mostram o resultado. O salvamento continua sob a proteção existente: quando falha, a compra é revertida e a interface informa que a melhoria não foi aplicada.

Em telas estreitas os cards ficam em uma coluna, com rolagem dentro do painel.

## Validação

A suíte completa passou em 1.131 testes, em 123 arquivos. Após uma proteção adicional para custos inválidos, 39 testes direcionados foram aprovados. TypeScript e build aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

61 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL. Incluem compra persistida do personagem e do pet, débitos exatos de 150/120 XP e layout de 390 pixels. A conta de teste usa saldos controlados para verificar as compras.

Depois dos últimos ajustes de foco por teclado e rótulos de companheiros, mais seis verificações específicas da interface foram aprovadas: Enter mantém o atributo selecionado, o seletor não expõe identificadores internos, o saldo do pet é independente, falha de compra apresenta mensagem e tela estreita não transborda horizontalmente. O build final também foi aprovado.

[Personagem](evolucao-personagem.png) · [Companheiro](evolucao-pet.png) · [Tela de 390 pixels](evolucao-390.png) · [Validação integrada](validacao.json) · [Validação da interface](validacao-interface.json)
