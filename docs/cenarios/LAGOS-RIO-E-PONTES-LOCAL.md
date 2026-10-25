> Registro das prévias aprovadas e incorporadas à versão 0.9.6.

# Lagos, rio e pisos — revisão local

Continua a prévia de iluminação e edição. Nenhuma nova Release foi publicada.

## Cenários

Os dois lagos da propriedade e o lago da Floresta Antiga usam contornos assimétricos contínuos com baías, curvas e margens arenosas úmidas. A água ganha uma variação discreta entre a parte rasa e o centro. O riacho da floresta foi retirado: o antigo leito agora é chão da mata. A geração histórica de árvores conserva seus IDs, sem plantar uma faixa nova de árvores sobre o antigo riacho.

O rio da propriedade varia de direção e largura em toda a extensão, com transições suaves nas duas pontes e cabeceiras secas. Árvores atingidas pelas novas margens são realocadas em terra próxima com o mesmo ID. Recursos fixos secos não ficam flutuando nas áreas alagadas.

## Pisos

O antigo trecho de caminho solto a oeste da casa foi retirado. As bordas da pintura de chão recebem transição irregular e pontas arredondadas; células vizinhas iguais não ganham linhas entre si. A grama pintada usa a mesma paleta, variação de luz e musgo do chão original. A máscara de margem pintada também é usada pelo nado, conservando a coerência entre imagem e movimento.

Os minúsculos seixos da decoração antiga foram retirados da água e dos caminhos. As pedras novas do cenário e os recursos coletáveis permanecem. Água pintada, madeira e calçamento mantêm a cobertura integral de suas células. Os arquivos JSON do autor e os pontos de entrada/saída não foram alterados.

## Pontes e nado

As pontes aceitam entrada e saída pelas cabeceiras. As laterais bloqueiam o personagem mesmo quando o chão ao redor está seco. A amostragem da profundidade fora da ponte ignora o piso elevado do tabuleiro: quem tenta subir pela lateral continua nadando, em vez de mudar para caminhada por estar perto do deck.

## Validação

TypeScript, 473 testes em 46 arquivos e build passaram. Chromium: duas pontes pelas quatro cabeceiras, quatro aproximações laterais em água profunda mantendo nado, máscaras de ondas sem vazamento em terra, três lagos, antigo riacho seco, raízes fora da água e transição entre nado e terra. A edição com recursos ocultos e as sombras centrais também têm validação própria. Imagens em `lagos-rio-organicos`, relatório `validacao.json`.
