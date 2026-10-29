# After Rain 0.10.0-preview.12 — expedições à cidade

A floresta ao norte da vila ganha acesso à cidade e dois desafios de sobrevivência com combate automático. Esta é a primeira prévia jogável do sistema de dungeons.

- Floresta independente com trilhas arredondadas, cercas rurais e neblina leve.
- Viagem de aproximadamente cinco segundos por uma estrada molhada, com chuva, som ambiente e construções abandonadas.
- Praça Central Abandonada: sobreviva por 15 minutos ativos.
- Estacionamento de Shopping: conclua 50 rodadas.
- Sete armas automáticas, Arsenal de quatro espaços, 56 melhorias, três cartas por escolha, raridades e evoluções lendárias.
- Cães e gatos resgatáveis, companheiro selecionável e evolução permanente do personagem e de cada pet. Na floresta de acesso, o companheiro acompanha o jogador e pode auxiliar na coleta diária.
- Eventos temporários e recompensas em moedas, experiência permanente, materiais existentes e pets.
- Salvamento e retomada da expedição, pausa e retorno ao ponto exato da estrada após vitória, derrota ou abandono.
- Proteção contra recompensas duplicadas e nova tentativa de salvamento quando o armazenamento falha.
- Novas artes de zumbis, pets, armas e objetos urbanos, preservando os sprites oficiais existentes.

## Como jogar

Entre na floresta ao norte da vila e interaja com E junto à placa na estrada. Escolha um desafio no menu da cidade. Os ataques são automáticos; movimente-se e recolha experiência para escolher melhorias. A retomada de uma expedição salva começa pausada.

## Validação e limites desta prévia

Validação direcionada: 95 testes, TypeScript, build de produção e 19 verificações integradas no Chromium. Foram verificados entrada, combate inicial, cartas, Arsenal, pausa, retomada, pets, recompensas e retorno. A carga controlada chegou a 240 inimigos com pools limitados.

Os limites de 15 minutos e as transições das 50 rodadas foram verificados por estados controlados. Ainda falta avaliação manual prolongada de balanceamento e desempenho em diferentes computadores Windows. Não há chefes ativos nesta prévia.

A suíte completa também passou localmente; o workflow Windows repete os testes antes de empacotar e publicar o executável. Saves anteriores continuam compatíveis; mantenha uma cópia antes de testar a nova modalidade.
