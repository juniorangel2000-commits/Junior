# JARDIM DEPOIS DA CHUVA — Casa modular v1

## Conteúdo
- `ABRIR_CASA_INTERATIVA.html`: protótipo visual interativo local com botão para esconder o telhado, editar móveis, mudar pisos e colocar/retirar divisórias; permite exportar planta personalizada JSON.
- `PREVIA_CASA_MODULAR.png`: comparação de cobertura presente e ocultada.
- `CASA_TELHADO_VISIVEL.png` e `CASA_INTERIOR_VISIVEL.png`: cenas separadas em PNG com transparência.
- `assets/`: PNGs separados extraídos do atlas conceitual aprovado + cinco tiles geométricos de encaixe em pixel art.
- `casa_inicial_blueprint.json`: divisão de salas, oficina, portas e estrutura base.
- `manifest.json`: catálogo de recursos com classificação e corte da fonte.

## Método de uso
1. Extraia o ZIP inteiro mantendo a estrutura das pastas.
2. Abra `ABRIR_CASA_INTERATIVA.html` em um navegador desktop.
3. Esconda o telhado, altere móveis e pisos e experimente divisórias; clique em "Exportar planta JSON" para guardar sua proposta.
4. NÃO apagar `assets/` porque a demonstração lê imagens relativas do HTML.

## Compromissos e limitações
- A referência para as casas é a arte aprovada: telha cerâmica alaranjada, reboco creme, madeira, venezianas azul-petróleo e paisagismo exuberante.
- Este material é um piloto demonstrável e editável. NÃO é motor final, nem um tileset com todas as junções e animações previstas.
- O atlas de referência foi criado como conceito artístico, com peças de tamanhos irregulares e checkerboard incorporado; removemos digitalmente o fundo de muitas sprites e preservamos as cores, porém alguns contornos podem exigir retoque manual.
- Pisos de encaixe e campo de telhas da demo foram reconstruídos tecnicamente para repetição correta; precisam ser refinados para atingir a densidade visual do atlas de arte.
- Roof-on/roof-off são estados visuais simulados no navegador; a transição por gatilho ao entrar no interior deve ser implementada na engine.
- A construção livre ainda exigirá sistema de colisão, validação de suporte de telhados, conexões de porta, energia e recursos, custo de receita e integração de salvamento.
- Direção artística e desenho da casa aprováveis agora, integração final com Codex depois.

## Próximos passos
1. Aprovar a composição das salas e o efeito da troca de telhado.
2. Construir variantes de canto, junções e bordas de telha em 4 direções.
3. Desenhar frentes e perfis de portas/janelas com estado aberto/fechado.
4. Unificar a escala de 32 px de base, mantendo sprites de parede em altura múltipla.
5. Implementar autoconexão de paredes e telhados, salvar mundo e crafting do jogador.
