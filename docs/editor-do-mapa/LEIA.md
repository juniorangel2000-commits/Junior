# Editor do mapa — prévia para Windows

Esta prévia inclui um editor dentro do jogo. O executável publicado anteriormente (0.8.0) ainda não tem esse recurso.

1. Abra **Editar mapa** no início do jogo, ou pressione **F2** durante a partida. Também há um botão no menu de pausa.
2. Escolha um terreno e arraste para pintar. O pincel pode ter 1, 3 ou 5 quadrados.
3. Escolha uma árvore ou recurso para colocar no chão. Em **Selecionar e mover**, arraste pela base do objeto. **Remover objeto** apaga somente o objeto escolhido.
4. Use a roda do mouse ou os botões de zoom. Segure **Espaço** e arraste para navegar. **Enquadrar mapa** mostra o cenário inteiro. **Ctrl+Z** desfaz e **Ctrl+Y** refaz.
5. **Aplicar e jogar** salva o mapa editado na sua partida e permite explorá-lo. **Voltar sem aplicar** mantém a partida anterior. O rascunho fica separado e pode ser recuperado depois.
6. Para enviar seu trabalho, clique em **Exportar** e guarde o arquivo **After-Rain-meu-mapa.json**. Envie esse arquivo na conversa. Também é possível reabri-lo com **Importar**.

A exportação contém as alterações do cenário; não inclui inventário, personagem ou progresso da partida. Não é necessário enviar a pasta do jogo. O arquivo não é enviado automaticamente pela internet.

Para a próxima atualização, o JSON será revisado e incorporado ao mapa distribuído com o jogo, com testes dos caminhos, colisões, recursos e partidas antigas.

Nesta primeira versão, o editor trabalha no mapa externo atual de **96 × 72 quadrados**, usando a arte existente. Casa, varanda, chegada, horta inicial, pontes, Lia, ruínas, poço e construções já feitas ficam protegidos. A imagem do mapa expandido aparece em **Referência** como guia; as novas regiões da imagem ainda precisam ser implementadas no jogo.

Os rascunhos são locais ao computador/perfil. Exporte o JSON para transportar o mapa ou manter uma cópia independente. Se o armazenamento não estiver disponível, o editor informa a falha e mantém o rascunho aberto para exportação.
