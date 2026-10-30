# Dificuldade e melhorias permanentes após preview.16

## Combate

As duas dungeons usam inimigos com 10% mais vida e dano no início. A progressão por tempo/rodada chega a 3,3× de vida e 2,2× de dano no final, antes do multiplicador existente por nível do jogador. Antes, chegava a 2,5× e 1,75×, respectivamente: aumento de 32% de vida e cerca de 26% de dano no final. A chance de inimigos especiais cresce 3 pontos percentuais por estágio, chegando a 17%. Velocidade, colisões, relógio e número máximo de inimigos permanecem iguais. A dificuldade acompanha o estágio e o nível da partida, sem escalar com os atributos permanentes comprados.

## Efeito por nível comprado

| Atributo | Efeito |
| --- | --- |
| Força | +3% de dano de todas as armas (antes +2% somente corpo a corpo) |
| Resistência | +2 pontos percentuais de redução de dano; limite total de 75% preservado |
| Agilidade | +2% de movimento |
| Vitalidade | +4% de vida máxima (antes +3%) |
| Precisão | +1 ponto percentual de precisão e +0,5 ponto de chance de crítico, inclusive corpo a corpo |
| Sobrevivência | +0,06 de vida/s (antes +0,02) |
| Resistência do pet | +8% de vida; dano dividido por 1 + 0,08 × níveis, somado à resistência das cartas no divisor (antes 5%) |

Crítico permanente soma-se ao bônus temporário de 20% encontrado no mapa e usa o multiplicador de dano existente. Força não altera o dano dos pets. A tela de evolução usa as mesmas constantes do motor e informa a redução real de dano da resistência do pet. Outras melhorias do pet continuam disponíveis.

Custos, XP acumulada, limite de 20 níveis e níveis já comprados foram preservados. Não há reinício de progresso nem nova versão do save. Os bônus de combate continuam restritos às dungeons. Melhorias do próprio pet em movimento/percepção continuam com o uso anterior no mundo normal.

## Comparações

Bot determinístico sem invulnerabilidade nem XP concedida na partida; duas combinações e duas sementes sem pet, mais uma combinação com cão comum. Cada cenário foi repetido com zero, cinco e dez níveis em cada atributo do personagem e, quando presente, do pet. As configurações representam perfis de investimento para teste; não exigem que o jogador evolua todos os atributos igualmente. Como precisão introduz jogadas críticas e consome aleatoriedade, cartas e trajetórias também podem divergir.

| Perfil | Vitórias em 5 cenários |
| --- | --- |
| zero | 1 / 5 |
| rank5 | 3 / 5 |
| rank10 | 5 / 5 |

No cenário com cão, o perfil com cinco níveis passou de derrota aos 4min02s para vitória aos 15min; com dez níveis também venceu. As recuperações foram 14 e 11 nos perfis de cinco/dez níveis, comparadas a 27 no cenário original da preview.16. As mudanças alteram cartas e trajetória; isso não isola a resistência como causa única.

As conclusões das cartas nas partidas vitoriosas investidas variaram de cerca de 7min14s a 13min07s. Ainda há variação considerável por cartas e trajetória; aproximar todas as combinações do fim dos 15 minutos exige mais calibração. O teste não garante uma taxa de vitória humana nem conclusão de cartas em toda partida. A chance de vitória aumentou nos cenários testados sem alterar a frequência das recompensas ou conceder imunidade.

## Verificação

- 1.199 testes em 134 arquivos aprovados.
- Compilação de produção aprovada.
- Seis verificações de interface no Chromium aprovadas: foco por teclado, seleção do pet, saldo próprio, falha de compra, tela de 390 px e ausência de erros JavaScript.
- Comparação após restaurar o checkpoint mantida nas simulações.

Alterações locais, preparadas para a próxima versão; a release preview.16 permanece como publicada.


Verificação adicional do estacionamento, com cinco níveis por atributo: a combinação de ataque venceu a rodada 50 em 1762 s; a combinação de controle venceu em 2143 s. Nenhum cenário ficou travado em uma rodada ou gerou save inválido.
