# Fase 9 — derrota e resgate por Bento

Ao perder toda a vida nas Galerias da Mina, o jogador interrompe as ações e a
imagem escurece. O retorno avança duas horas de jogo, respeita a virada do dia e
o limite do calendário, e atualiza o crescimento das plantações pelo tempo
realmente transcorrido. O jogador desperta em uma cama instalada na própria casa.

## Cena e controle

- Poses de repouso e despertar para a fazendeira e o fazendeiro, em atlas próprio
  transparente. A cama é o móvel real, inclusive quando foi reposicionada.
- Bento aparece próximo à cama. Há três variações de fala, alternadas somente
  por resgates realmente confirmados no salvamento.
- A posição física do jogador fica em piso livre, alcançável e próximo à cama;
  a pose de repouso é desenhada sobre o móvel. Os corpos ficam separados.
- Movimento, ferramentas, atalhos e cliques da HUD ficam suspensos durante a
  cena. O inventário volta a funcionar depois da conversa e do salvamento.
- Se o salvamento falhar, a cena permite tentar novamente, preservando o estado
  anterior. Recarregar durante o despertar retoma a conversa sem repetir perdas
  ou avançar novamente o relógio.

## Perdas e preservação

Todos os recursos carregados são perdidos, inclusive os obtidos antes da
expedição, os peixes da cesta e os consumíveis. Permanecem as ferramentas e os
equipamentos permanentes, o dinheiro, os bens guardados na base, construções,
melhorias, túneis, perigos já existentes e descobertas. Os objetos físicos únicos
das missões voltam ao ponto original; entregas anteriores e progresso permanente
são mantidos. Não há recuperação dos recursos comuns perdidos.

## O mesmo Bento retorna à oficina

O resgate usa a identidade persistente de Bento. A mudança para a casa acontece
sob a tela escura; a volta é caminhada: interior da casa → porta → propriedade →
passagem real da vila → ferraria. A rotina comum fica suspensa durante a viagem,
e os outros cenários não desenham outra cópia do ferreiro. Se o jogador bloquear
uma passagem, ele aguarda; um contato já sobreposto permite apenas passos de
separação, sem atravessar o jogador ou mudar de destino instantaneamente.

A geometria visível da propriedade usa as colisões reais do cenário e as regras
das pontes. Fora da tela, o trajeto usa a navegação autorada e continua pelo mesmo
percurso. O resgate funciona também fora dos dias semanais de mineração.

A bolsa, os depósitos, a condição da picareta e as tarefas particulares de Bento
não viram recompensa do jogador. Se ele já levava materiais reservados para uma
tarefa da ferraria, retoma essa tarefa antes de descarregar a bolsa. Isso evita
um segundo depósito dos mesmos materiais ou uma tarefa bloqueada sem insumos.

## Persistência e compatibilidade

`mineRescue` é uma extensão opcional do salvamento: contador, cama, horário,
tempo transcorrido, variante e etapa (`waking`, `leaving`, `complete`). Saves
anteriores continuam válidos. Estados pendentes inconsistentes são rejeitados
para evitar que a partida fique presa em uma cena sem cama ou sem Bento.

O encerramento da conversa é persistido antes de devolver o controle. Apenas o
resgate confirmado aplica perdas; a confirmação e a volta do NPC não reaplicam
nenhuma consequência. O contador fica disponível para a fase social posterior.

## Validação

- 249 testes passaram em 20 arquivos, incluindo 9 testes específicos de resgate,
  missões, viagens, defesa, trabalho particular, saves antigos, casa, relógio e
  inventário. A execução usa dois workers e timeout de 20 s para os percursos
  completos neste ambiente de CI.
- `npm run build` passou; a distribuição inclui o atlas novo.
- `scripts/qa-mine-rescue.cjs` passou no navegador: derrota real, repouso,
  conversa, reload sem consequências repetidas, falha de armazenamento,
  inventário e caminhada física até a ferraria. Sem erros de execução ou
  texturas ausentes. O caso da cama movida e personagem masculino também passou
  em `scripts/qa-mine-rescue-male.cjs`.

Os scripts de QA usam partidas próprias e não substituem o save do usuário.
O código recuperado foi preservado em uma branch de backup no GitHub antes de
continuar as alterações. A fase 10, de relações sociais simples, permanece como
próxima etapa. Esta fase não publica uma release nem altera a versão do jogo.
