# Domesticação do cavalo — direção definida com o Junior

O cavalo selvagem e suas animações estão no cenário. A cadeia de domesticação
abaixo ainda precisa ser implementada.

- Estábulo concluído é pré-requisito.
- Comida especial: **cesta de colheita** preparada pela Helena, com 3 colheitas diferentes (legumes, verduras, grãos ou frutas) + 20 C. Decisão do Junior em 13/11/2026: cesta com vários itens, não só nabos. Depende das etapas 1–4 de `CULTIVOS-E-CALENDARIO.md`.
- Um ponto/cocho nos Campos Abertos recebe a comida, permitindo estoque para alguns dias.
- Padrões adotados enquanto o Junior não decidir outra coisa: cada virada de dia com comida no cocho conta (mesmo com o jogador em outro cenário); o cocho guarda 3 porções; o estábulo é uma nova construção para 1 cavalo, com madeira nobre, usando a arte do curral até haver arte própria.
- Barra de **Confiança**, com no máximo um avanço por dia alimentado; são sete dias.
- Dias sem comida pausam a confiança, sem apagar o progresso conquistado.
- Dias 1–2: observa de longe e só come com jogador afastado. Dias 3–4: reconhece o jogador e tolera distância menor. Dias 5–6: aproxima-se do alimento na presença do jogador. Dia 7: aproximação voluntária, nome e condução ao estábulo.
- **A corda só pode ser colocada DEPOIS da doma completa.** Não permitir captura/condução antes dos sete dias; proximidade não deve domar o cavalo.
- Após domar: carinho, chamado e condução. Montaria pode exigir sela fabricada em uma etapa posterior.
- Salvar/carregar e trocar de cenário devem preservar confiança, consumo e dia contado, sem duplicação.

## Animações e fuga já integradas

- Novo pacote `create_a_horse_with_medium_details-v2.zip`, com 308 quadros originais preservados.
- Comer: `Eat_Start` → `Eating` por 4–7 segundos → `Eat_End`. Só inicia junto de capim crescido e com jogador afastado. Ações interrompidas concluem as transições antes da fuga.
- Mexer a cabeça toca uma vez, por cerca de 2,2 segundos.
- Há intervalos independentes de 8–15 segundos entre ações. Pausa não avança o ciclo. Nenhuma ação de idle roda infinitamente.
- Fuga do cavalo usa 2,2 vezes a velocidade básica, superior à corrida do jogador com botas.
- Pastar e mexer a cabeça são visuais: NÃO concedem confiança nem substituem a comida especial.

Deitar, descansar e levantar do novo pacote estão preservados no atlas, para
integração posterior. Não confundir os arquivos disponíveis com ações já ativas.
