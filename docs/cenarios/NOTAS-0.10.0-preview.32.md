# After Rain 0.10.0-preview.32 — Ferramentas individuais e animais

As vacas usam o novo conjunto de sprites fornecido pelo jogador: caminhada em
oito direções e sequências completas para deitar, descansar e levantar. Depois
de receber uma moradia, entram pela porteira e passeiam pelo piso livre do curral,
respeitando paredes, cercas e os outros animais. O descanso mantém a posição no
chão e termina antes de a vaca voltar a caminhar.

- Colisões mais precisas no curral e alinhamento antes de atravessar porteiras
  estreitas, evitando cortes pelas quinas e animais presos na entrada.
- O jogador consegue se afastar quando chega ao mesmo ponto de um NPC. NPCs em
  deslocamento permitem a passagem; parados e separados, voltam a bloquear
  normalmente. As rotas continuam sendo percorridas a pé.
- Nova arte de palha no inventário e nos itens no chão. No silo, cada palha exige
  três fibras; fibras restantes são preservadas, inclusive ao atingir a lotação.
- Ferramentas em espaços individuais na mochila, com identidade e durabilidade
  próprias. A barra rápida aponta para a cópia escolhida; reparo, aprimoramento,
  itens no chão e salvamento preservam sua condição sem alterar as outras cópias.
- Martelo, serrote, vara de pesca e rede também têm desgaste por uso e reparo
  individual com Bento. A rede permite recolher até dois peixes por captura;
  cancelar com Esc durante o arremesso encerra a ação e libera o jogador.
- Prévias e imagens históricas de desenvolvimento arquivadas, com índice de
  recuperação e links preservados. A limpeza retirou cerca de 516 MiB da árvore
  atual do projeto, preservando as fontes originais e os arquivos usados no jogo.

Partidas anteriores continuam compatíveis. A produção diária de ovos e leite e
o futuro cenário Campos Abertos continuam planejados; não fazem parte desta versão.

Validação local: TypeScript e build de produção aprovados; 1.830 testes em 206
arquivos passaram. No Chromium, foram conferidos o curral, dez ferramentas
separadas, desgaste da cópia escolhida, soltar/recolher e recarregar o save, a rede
na água, cancelamento durante o arremesso e a captura completa de dois peixes.
A publicação também executa os testes e gera os dois pacotes no Windows x64.
