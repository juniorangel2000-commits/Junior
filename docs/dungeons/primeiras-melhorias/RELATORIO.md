# Primeiras tentativas e escolha de melhorias

## Recompensas

- Combater e sobreviver concede 15 XP permanentes por minuto completo, limitado a 90 XP por expedição e a duas vezes as eliminações. O bônus vale em vitória/derrota; abandonar mantém somente a XP de eliminações existente.
- No início da jornada, sessões de pelo menos 120 s e 20 eliminações podem receber um complemento para alcançar 100 XP. O complemento é limitado pela janela inicial de 600 XP de progressão do personagem, contando saldo e valores gastos em melhorias.
- Duas derrotas qualificadas de um personagem novo, com 20 eliminações e 2 min cada, concedem 100 XP cada. Isso permite escolher uma primeira melhoria de 150 XP, restando 50 XP.
- Gastar XP não reinicia o apoio. Esperar sem eliminar inimigos, encerrar imediatamente ou abandonar não concede o complemento. Não foi criado novo contador no save.
- A tela de resultado explica quanto veio de sobrevivência e de apoio inicial. Os valores são incluídos na recompensa total, aplicada uma única vez e preservada ao voltar ao mapa. O companheiro ativo continua recebendo a mesma XP permanente do resultado.

## Escolhas

A tela de evolução explica duas orientações, sem comprar ou equipar atributos automaticamente:

- Ataque: Força e Precisão.
- Sobrevivência: Vitalidade, Resistência e Sobrevivência.

Custos e atributos adquiridos foram mantidos. Não há exigência de evoluir todos os atributos igualmente.

## Primeiros investimentos testados

Bot determinístico, sem XP concedida dentro da partida, sem invulnerabilidade e sem armas pré-equipadas. Duas combinações de armas na mesma semente; dois ou três níveis comprados no total, sem pet.

| Perfil | Compras | Custo total | Combinação de ataque | Combinação de controle |
| --- | --- | --- | --- | --- |
| Ataque, 2 compras | Força 2 | 370 XP | victory aos 15min00s | victory aos 15min00s |
| Ataque, 3 compras | Força 2 + Precisão 1 | 520 XP | defeat aos 3min35s | defeat aos 12min23s |
| Sobrevivência, 2 compras | Vitalidade 1 + Resistência 1 | 300 XP | defeat aos 14min48s | defeat aos 14min06s |
| Sobrevivência, 3 compras | Vitalidade 1 + Resistência 1 + Sobrevivência 1 | 450 XP | victory aos 15min00s | defeat aos 5min03s |

No cenário anterior sem melhorias, a combinação de ataque terminou em derrota aos 5min e a de controle aos 14min18s. A amostra é pequena e os custos não são iguais entre caminhos. Críticos, eliminações e trajetórias também alteram a sequência aleatória; portanto, esses resultados não significam que comprar Precisão ou um terceiro atributo piore o personagem, nem que uma rota garanta vitória.

As melhorias mantêm efeitos diretos testados no motor. O objetivo é oferecer uma escolha útil desde as primeiras compras e permitir recuperar investimento em tentativas malsucedidas, preservando a dificuldade de base.

## Validação

- 1.204 testes em 135 arquivos aprovados, incluindo apoio inicial, limite acumulado, compra após duas derrotas, abandono e idempotência das recompensas.
- Compilação de produção aprovada.
- 19 verificações no Chromium de resultados, retorno ao mapa e leitura do save aprovadas, sem erros JavaScript ou HTTP.

Alterações preparadas para a próxima versão; ainda não publicadas.


Quatro verificações adicionais de interface aprovadas: discriminação dos 100 XP no resultado, compra escolhida depois de duas tentativas, orientações em 390 px e ausência de erros JavaScript.

[Resultado de uma primeira derrota qualificada](primeira-derrota.png)
