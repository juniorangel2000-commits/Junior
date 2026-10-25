# Clareira nordeste, coleta manual, animais e bordas de grama

Alterações locais sobre a versão publicada 0.9.7. Os dois JSONs originais do autor permanecem intactos.

## Cenário

A clareira de prado no nordeste da floresta (aproximadamente x78–91/y3–14) recebeu grupos de flores brancas, samambaias, arbustos com berries, cogumelos, um tronco, um toco e uma rocha na periferia. O centro continua aberto. São as mesmas sprites atuais do jogo; não há novas árvores fechando a passagem. Os detalhes entram no editor como objetos normais, com IDs estáveis, permitindo mover ou remover. Plantas coletadas continuam ausentes ao salvar/recarregar; pisos construídos impedem seu reaparecimento.

## Recursos

Grama, prado, musgo e piso de floresta pintados são habitats válidos para plantas. Madeira, pavimento, solo preparado e água continuam livres dessas plantas. A seleção de posições considera setores do mapa, distância entre recursos, clareiras, bordas de trilhas e sombra das copas, sem concentrar tudo em um canto.

A geração dá prioridade a fibras, galhos, pedras pequenas, berries/sementes e sucata. Os limites de recursos soltos, contando os pontos fixos, passaram a 96 na propriedade e 80 na floresta. Árvores em pé não entram nesse total. Os recursos de coleta manual continuam reaparecendo apenas depois de três dias do jogo. Partidas antigas ganham as vagas novas uma única vez, sem mudar IDs já ativos ou antecipar temporizadores de coletas anteriores.

## Animais

Uma preferência por espaço aberto usa as árvores reais do cenário, incluindo copas e raízes. A procura ponderada de caminhos, a escolha dos passeios e os atalhos consideram essa preferência. Ela se atualiza quando uma árvore é cortada ou reposicionada. É um custo de navegação, não uma colisão nova: corredores estreitos continuam utilizáveis e os animais ainda podem acompanhar o jogador pela corda. Raio de percepção e velocidades anteriores permanecem iguais.

## Pisos

Grama, prado, musgo e chão de floresta agora misturam seus materiais numa faixa mais ampla, com pequenas irregularidades coerentes com a posição no mundo. O centro do piso pintado permanece íntegro; os detalhes das folhas não recebem desfoque. As clareiras naturais também usam uma transição mais ampla. Água e pisos estruturais mantêm suas regras anteriores de cobertura e colisão.

## Validação

TypeScript, 499 testes em 51 arquivos e build. Os testes cobrem piso natural pintado, equilíbrio entre famílias, distribuição em setores, migração sem adiantar coletas, desvio de copas, acesso por corredor estreito, continuidade entre gramas e preservação das regras da água.

Testes de navegador e dados: `scripts/qa-glade-foraging-animals.cjs`, `validacao.json`. Incluem coleta sem ferramentas, recarga sem repetir recompensa, retorno em três dias, limites, movimentos reais de animais e amostragem de grama sobre a água. `antes.json` registra a contagem anterior para comparação.

Prévias reais do jogo:

- [Clareira antes](antes.png)
- [Clareira atual](depois.png)
- [Bordas entre as gramas, com os recursos ocultos no editor de desenvolvimento](bordas-grama.png)

Na amostra real de nova partida, a coleta manual passou de 39 para 63 pontos na propriedade e de 13 para 37 na floresta. Quantidades podem variar com o progresso; os limites se mantêm. A amostragem dos pisos encontrou zero pixels de grama com cobertura maior que 50% sobre pontos de nado em ambos os mapas. A regressão de passagens, corda e editor oculto em produção também passou (`transicoes-corda.json`).
