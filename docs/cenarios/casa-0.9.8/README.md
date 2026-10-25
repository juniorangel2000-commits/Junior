# Casa, horta e poço — 0.9.8

Arte original enviada pelo autor, preservada em `public/assets/visual/architecture/authored-cottage.png` (SHA256 `b7ed010b594516766e7b9e052286ee2e8889a5582b669100c3f13af111f31c4b`). O PNG256×256 permanece intacto; o recorte proporcional da fachada mede205×212 no canvas256×224. A porta tem aproximadamente41pixels de largura, coerente com o personagem e o poço.

A porta está no eixo do caminho. Casa e pé visível do poço compartilham a linha y508; as sombras se apoiam em508,25. A horta esquerda tem30canteiros,25cercas e uma porteira funcional. A atualização única preserva plantas, construções, pisos, móveis, itens e posições salvas, sem recriar peças removidas nem colocar cercas ou solo sob entidades.

O interior foi mantido. Caminhar pela porta entra/sai automaticamente; E continua recolhendo objetos e usando os móveis, enquanto H personaliza o interior. Transições têm120ms por etapa e não retornam automaticamente ao chegar ou recarregar.

As duas janelas usam a máscara exata dos vidros para o brilho e as luzes noturnas. A fumaça usa seis nuvens suaves num loop3,6s, sem criar objetos por quadro; oculta-se dentro da casa e retorna ao sair.

- `casa-horta-poco-dia.png` e `casa-horta-poco-noite.png`: capturas reais, árvores ocultas apenas para revisão.
- `validacao.json`: PNG original, escala, alinhamento, horta, máscara/janelas, sombras, fumaça, saves legados e entrada/saída automática.
- Reproduzir com `NODE_PATH=/tmp/after-rain-browser/node_modules QA_URL=http://127.0.0.1:5178 node scripts/qa-homestead.cjs`.
