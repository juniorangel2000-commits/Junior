# After Rain 0.10.0-preview.16 — companheiros, coleção e dungeons

Os companheiros têm movimentação mais livre, caminhada em oito direções e funções próprias para ajudar o jogador nas dungeons. O Menu do jogo → Companheiros → Ver coleção de pets mostra as variações resgatadas e as que faltam desbloquear.

## Companheiros

- Caminhada nas oito direções para cachorro e gato, incluindo as variantes ✦. Corrida e ataques mantêm as quatro direções fornecidas. Os quadros originais foram preservados.
- Cachorro proporcionalmente maior que o gato, com enquadramento uniforme dos retratos. Variante do cachorro com pelagem creme/caramelo e focinho marrom; variante do gato com tons dourados. O ícone ✦ identifica as variantes especiais.
- Movimentação mais lenta e natural, espaço ao redor do jogador, pequenos passeios e aproximação dos inimigos nas dungeons. Os pets respeitam colisões.
- Gato sentado com animação mais lenta e ocasional. Cachorro parado descansa entre animações curtas.
- Coleção com quatro variações, bônus, contagem de resgates e estado de desbloqueio. Somente pets resgatados podem ser equipados.
- Chance de uma variante especial reduzida de 5% para 1% por pet resgatado. A frequência de encontrar pets foi mantida.

## Bônus ao jogador nas dungeons

| Pet | Bônus |
| --- | --- |
| Cão | +10% de vida máxima e 8% de redução de dano |
| Cão ✦ | +20% de vida máxima, 16% de redução de dano e +15% de cura recebida |
| Gato | +20% de alcance de coleta de experiência e +5% de velocidade |
| Gato ✦ | +40% de alcance de coleta de experiência, +10% de velocidade e +10% de experiência recebida |

Os bônus da espécie permanecem durante a recuperação do pet. Somam-se às melhorias existentes; as variantes não duplicam cartas, melhorias permanentes ou atributos próprios do animal. A redução total de dano mantém o limite de 75%. Cura adicional respeita a vida máxima.

## Combate e iluminação

- Pets com esquiva de contato: 70% no cão e 80% no gato, iguais nas variantes especiais. Breve intervalo de proteção evita dano acumulado por vários inimigos a cada quadro. Desvio curto com indicação “Esquiva”; pausa e save preservam seu andamento.
- Tamanho visual das armas ajustado ao personagem, incluindo espadas, evoluções, projéteis e armas orbitais. Alcance, dano e cadência mantidos.
- Iluminação das duas dungeons com luz suave nos postes, ambiente mais frio, sombras de contato e reflexo discreto na fonte. Respeita as preferências de iluminação e a pausa.

## Compatibilidade e validação

Saves anteriores, pets resgatados e melhorias permanentes continuam compatíveis. O save passa a aceitar a orientação diagonal dos companheiros.

Suíte completa aprovada com 1.195 testes em 133 arquivos. Compilação de produção aprovada. Verificações no Chromium cobriram bônus, menus, desbloqueios, esquiva, proporções, oito direções, cores e armas.

Baixe `After-Rain-0.10.0-preview.16-Windows-x64.exe`. É portátil: abra o arquivo para jogar. Confira a integridade usando `SHA256SUMS.txt`.
