# Cabana de pesca do Damião

Implementação local sobre o trabalho da Celina. Não há nova publicação.

## Resultado

Fachada na família visual dos demais comércios: madeira, alvenaria clara, telhado de cerâmica, venezianas, lanternas e placa de peixe/anzol. Redes, varas e cordas diferenciam a cabana. As colisões acompanham as paredes e os equipamentos laterais, mantendo a porta e os degraus livres. Beiral não vira obstáculo no chão.

Interior com 16 objetos próprios e 19 peças posicionadas: balcão, suporte de varas, armário de redes, bancada de reparos, bacia com ondulação de água, barril, caixas, rede de parede, caixa de anzóis, livro de pescarias, boias, corda, lanternas, banco, tapete e janela. Acessórios da bancada seguem seu objeto de apoio na edição. Piso de madeira e paredes escuras preservam o padrão dos interiores.

Atendimento 08h–18h, intervalo 12h–13h30 na praça, guia que aguarda o jogador e retorno à cabana. Compra e venda acontecem no interior durante atendimento. Catálogo existente, aulas de pesca e entrega de peixe raro foram preservados. O editor de desenvolvimento abre com H e exporta After-Rain-Cabana-Pesca-Editada.json.

Saves com o layout provisório intacto migram para o novo; layouts personalizados não são substituídos. A rotina e o interior persistem. O usuário enviou damiao.zip: 72 PNGs com oito direções, oito passos por direção e poses paradas. Os arquivos originais e metadata.json permanecem intactos, com dimensões e SHA-256 registrados em personagem.json. A vista south refinada é uma fonte separada; as outras sete direções usam os PNGs originais sem redesenho.

## Validação

- Quatro testes específicos: circulação, migração/preservação de saves, colisões e rotina com ida/volta da praça.
- Chromium: 14 verificações passaram, cobrindo comércio, editor/exportação, save, fachada, noite, entrada/saída, rotina e ausência de erros JavaScript/WebGL/assets.
- A suíte de efeitos passou a reconhecer explicitamente a nova bacia de água.
- Resultados finais da suíte geral e build registrados no acompanhamento desta tarefa.

Reproduzir: python scripts/prepare-damiao-assets.py registra o atlas sem sobrescrever um layout existente; --write-layout regenera deliberadamente o layout padrão. Vite deve estar na porta 5177 para executar node scripts/qa-damiao-shop.cjs com Playwright/Chromium disponíveis. DAMIAO_QA_OUTPUT muda a pasta de resultados, cujo padrão é /workspace/after-rain-damiao.

Validação final: 815 testes passaram em 90 arquivos; TypeScript e build passaram. O aviso conhecido de tamanho do bundle permanece.

## South refinado e animação

A frente foi refinada em nove poses, uma parada e oito de caminhada, preservando o boné, a barba, o colete, a corda e as botas amarelas. Recortes e alinhamento da cabeça ficam em personagem.json, com uma única escala para o ciclo inteiro. O atlas final tem 2304 × 2048, em células de 256 × 256. A quantização de alfa é aplicada somente à frente refinada, como nos outros NPCs. A rotina e o acompanhamento utilizam a quantidade real de quadros recebidos.

Validação lógica após integração: 826 testes passaram em 94 arquivos; TypeScript e build passaram. Os 72 PNGs enviados também foram decodificados integralmente com Pillow.

As 16 verificações no navegador passaram após reiniciar o servidor de prévia. Relatório conjunto em `../frentes-damiao-helena-icaro/RELATORIO.md`.
