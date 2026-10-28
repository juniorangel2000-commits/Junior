# Pousada da Helena

Implementação local, sem publicação. A fachada foi redesenhada com dois volumes assimétricos: sobrado à esquerda com telhado de quatro águas e ala baixa de refeições à direita. A porta principal fica no sobrado; a porta lateral é decorativa e permanece fechada.

Interior com 16 objetos próprios e 19 peças: recepção, armário de roupas de cama, lareira, mesa de refeições, cama de hóspedes, banco, baú, bandeja, chá, livro de hóspedes, cesta de pães, jarra, lanternas, cadeira, tapete e janela. Lareira e lanternas iluminam; chá emite vapor. A cama faz parte do cenário: hospedagem continua sendo contratada no serviço da Helena, que avança até as 08h e recupera vigor. Rumores, acolhimento e catálogo existentes foram preservados.

Atendimento das 08h às 22h, com intervalo das 12h às 13h30 e retorno à pousada. Comércio no interior durante atendimento. Editor H em desenvolvimento com exportação After-Rain-Pousada-Editada.json. Migração aplica o layout somente a interiores provisórios intactos; layouts personalizados permanecem preservados. As quatro poses atuais da personagem permanecem até o usuário enviar sua animação.

Validação: quatro testes do interior, migração, colisões e rotina; 14 verificações no Chromium passaram sem erros de JavaScript, assets ou WebGL. Suíte geral com a diversificação das fachadas: 822 testes em 92 arquivos, TypeScript e build passaram; permanece o aviso conhecido de bundle grande.

Reprodução: python scripts/prepare-helena-assets.py registra os recortes sem substituir um layout existente. --write-layout regenera deliberadamente o padrão. Com Vite na porta 5177 e Playwright/Chromium disponíveis: node scripts/qa-helena-shop.cjs. HELENA_QA_OUTPUT altera a pasta padrão /workspace/after-rain-helena.
