# Jardim Depois da Chuva — Pacote visual v0.2

## Escopo e estado

Este pacote contém sprites individuais recortados diretamente das QUATRO FOLHAS COM TRANSPARÊNCIA aprovadas no chat, diferentemente da primeira tentativa que usava quadros com textos e fundo. Os arquivos originais de arte continuam sendo imagens de referência; os sprites aqui são itens de inventário e representações conceituais de estações, não uma tileset modular funcional, nem animações completas.

## Itens e dimensões

- Ferramentas: 20 PNGs (320x320)
- Recursos brutos: 20 PNGs (320x320)
- Materiais processados: 15 PNGs (320x320)
- Estações: 10 PNGs (512x512)
- Ícones de inventário de 96x96 para cada item
- Total: 65 sprites em tamanho de referência, 65 ícones de inventário.

Todos estão em PNG RGBA, com bordas transparentes, enquadramento central e margem mínima de 20 pixels na área de saída (conferência automatizada). Mantivemos um resampler nearest-neighbor para proteger o aspecto pixelado.

## Notas de qualidade

1. Recorte sem perda no limite das células: confira a PREVIA de cada categoria. Pequenos efeitos semitransparentes das folhas originais podem aparecer no contorno.
2. Algumas artes geradas não distinguem adequadamente todos os tiers (ex.: picareta reforçada vs picareta de ferro). Ainda precisam de revisão artística manual antes da versão final.
3. Estações são imagens isométricas/3-4; elas não possuem separação de planos de colisão nem posicionamento no terreno. Isto será definido na etapa de objetos do mundo.
4. O conteúdo foi organizado para revisão e prototipagem no Codex, não como jogo funcional.
5. As receitas e quantidades seguem provisórias até balanceamento.

## Próxima execução criativa (não implementada neste ZIP)

A. Animações de trabalho de personagem: cortar árvores, mineração/picareta, serrar troncos e construção — cada ação com 4 direções, 6 a 8 quadros e posição fixa dos pés.
B. Tileset de construção: pisos, paredes (frente, fundo, laterais), quinas internas/externas, portas, janelas, telhados, escadas; cada peça em 32x32 de referência, possíveis módulos 32x64/64x64 e objetos maiores.
C. Teste de montagem de casa com colisão e transparência de paredes antes de enviar ao Codex.

## Importação

Use manifest.json para associar o ID lógico de cada item ao caminho do arquivo. Os diretórios sprites/ e icones_96px/ têm os mesmos nomes internos.
