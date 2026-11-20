# Animações laterais das ferramentas

Capturas pelo `ToolVisual` real no Chromium, dois personagens, esquerda/direita.
`tools-male.gif` e `tools-female.gif`: machadinha e picareta de referência, depois enxada, pá, foice e regador.
Os JSONs registram ausência de erros JS, textura/escala/espelhamento constantes
por ciclo, quatro níveis de ferramenta e restauração da visibilidade do corpo.

Proporção ajustada à picareta/machadinha: enxada e pá com cerca de 30 px de altura no mundo, foice com cerca de 22 px. Ícones preservados; arte simplificada exclusiva do movimento. A enxada usa o
arco de levantar e bater; a pá cava/faz alavanca; a foice corta embaixo. O regador
preserva o jato autoral. O relógio de impacto e as regras do solo não mudaram.

Reproduzir com Vite em 5190 e:

```sh
node scripts/capture-art-review.cjs /tmp/conferencia tools-male
node scripts/capture-art-review.cjs /tmp/conferencia tools-female
```

Essas capturas verificam o adaptador de renderização, não um percurso completo
de plantio em cada mapa. Propriedade, Floresta e Campos chamam o mesmo adaptador;
foice/pá também passam o corpo do jogador nas interações de coleta.

Após o retorno sobre pegadas e diferença de estilo, as fontes de corpo foram
refeitas diretamente da machadinha: feminino com suas próprias proporções e
mãos, masculino com a postura original. As capturas finais usam essa segunda
base; as capturas intermediárias de `/tmp/tool-work-preview` foram descartadas.
