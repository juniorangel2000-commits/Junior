# Partidas salvas

O menu inicial inclui **Partidas salvas**. É possível criar novas histórias, escolher qual carregar, renomear a partida sem mudar o personagem e excluir uma partida com confirmação. A lista mostra personagem, dia, região e condições de recuperação. Saves inválidos ou de versões futuras permanecem visíveis, mas não são carregados automaticamente.

O arquivo legado continua em sua chave original e aparece como “Minha primeira partida”. Não é movido nem regravado apenas por abrir a biblioteca. Cada nova partida tem uma chave independente e suas próprias cópias rotativas, cópia de migração e preservação de arquivo danificado. A seleção só troca o apontador da partida ativa. Todos os cenários continuam usando as funções centrais de salvar e carregar.

Criar uma partida primeiro grava seus dados e metadados e só depois a seleciona. Falha de quota cancela a criação e preserva a partida ativa. Apontadores inválidos falham explicitamente; não são redirecionados silenciosamente para outro jogo. Renomear altera apenas os metadados. Excluir remove somente os dados e cópias daquela partida, depois da confirmação na interface.

Os dados continuam locais ao navegador ou ao aplicativo instalado, sem sincronização na nuvem e sem importação/exportação de arquivos nesta etapa.

Validação: `tests/save-library.test.ts` cobre isolamento, save legado, backups, falhas de armazenamento, nomes, exclusão e versões futuras. `scripts/qa-save-library.cjs` testa o fluxo real de criação, carregamento, renomeação, cancelamento/exclusão e continuidade do save antigo.
