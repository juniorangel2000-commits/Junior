# Jardim Depois da Chuva — Sistema de Ações v0.1

## Como testar
Extraia o ZIP e abra `TESTAR_ACOES.html` em um navegador. Não precisa instalar nada nem usar servidor local. Setas ou WASD para andar; 1–4 para trocar ação; espaço para agir perto do objeto. Ao usar árvore, pedra, bancada e obra, o inventário é atualizado. Botão Exportar permite salvar estado experimental em JSON.

## Arte
O personagem foi isolado da ficha aprovada `ficha_de_personagem_em_pixel_art.png` (o retrato original não foi substituído). Há 24 quadros de referência extraídos (4 direções × [2 idle + 4 caminhada]). Os 128 quadros de ação são composições experimentais de poses originais, transformação de ferramenta e efeitos, e NÃO quadros novos desenhados à mão. Em particular, braços, empunhadura e contato físico ainda precisam de revisão artística. Os sprites de ferramenta vieram do pacote de itens v0.2.

## Estados e eventos
- Parado e andando nas quatro direções.
- Ações: cortar, minerar, serrar, construir (8 quadros por direção).
- O evento de interação ocorre no quadro de índice 4, e o ciclo impede a repetição enquanto a ação está em curso.
- Alcance e recompensas são protótipos de balanceamento: árvore 3 golpes → 1 tronco; rocha 4 golpes → 2 pedras; serra 1 tronco → 3 tábuas; construção 4 tábuas → 1 parede.

## Próximos passos recomendados
Criar poses genuínas em 4 direções com alinhamento de mãos e ferramenta, contato e feedback de colisão; refinar sombras e testar sprite em escala 32/48/64px; integrar um controlador de estados na engine do projeto, sem substituir lógica preexistente; consolidar colisões, alvos e receitas com o sistema de crafting real.
