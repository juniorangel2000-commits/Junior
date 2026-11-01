# Companheiros na HUD

O painel usa a mesma moldura de madeira e fundo de pergaminho da HUD. Arraste pelo título para reposicioná-lo. Os botões − e × minimizam e fecham o painel; a preferência e a posição são mantidas neste navegador. Minimizar mantém o cabeçalho com botão de restaurar.

K abre/fecha a tela completa dos companheiros, inclusive quando o painel flutuante está fechado. Nessa tela, “Mostrar painel flutuante” restaura os comandos rápidos. Os comandos Seguir, Esperar e Chamar continuam usando o mesmo salvamento e reversão em caso de erro da tela completa.

O painel não pausa o mundo. Atalhos não atuam durante digitação e respeitam modificadores, menus e troca de cenário. O painel de controles inclui os atalhos de construção, mochila, companheiros, pesca, câmera, navegação de menus e ferramentas de desenvolvimento quando disponíveis.

Verificação: scripts/qa-world-refresh.cjs testa comandos rápidos, minimizar, fechar, recuperar, K, digitação, modificadores e retorno à vila sem duplicar painéis. Capturas e resultados são gerados fora do repositório em /workspace/world-refresh-qa.
