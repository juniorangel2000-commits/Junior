# Piso intertravado, caminhos usados e zoom temporário

A praça mantém as dimensões e a disposição aprovadas. O piso interno agora usa pequenos blocos intertravados inspirados na referência enviada. O contorno de pedra continua fino e detalhado. Os caminhos usam uma variação da mesma textura, mais quente, com desgaste leve e terra nas juntas, preservando o contraste com a praça limpa. Os caminhos têm bordas de pedra, com juntas acompanhando os trajetos.

As duas texturas originais ficam em `public/assets/visual/village/plaza`, com hashes no manifesto. A textura repete um recorte de dois períodos completos do encaixe, em uma unidade de 32 pixels de mundo; isso mantém os tijolos pequenos e elimina as quebras causadas por espelhamento da imagem inteira. A grama original e sua paleta foram restauradas conforme o pedido final. A substituição de material é feita durante a geração do terreno; não altera colisões, largura dos caminhos ou pinturas manuais de terreno.

O controle de zoom fica oculto ao abrir o HUD. Scroll, teclas de zoom ou botões revelam o controle por três segundos; cada ajuste reinicia o prazo. Ele fica no canto inferior direito, afastado do relógio, recursos e barra de ferramentas. Pausar ou trocar de HUD limpa o temporizador. Propriedade, vila e floresta usam o mesmo comportamento.

## Validação

- Suíte completa: 863 testes em 100 arquivos passaram, incluindo visitas, saves e integridade das texturas. TypeScript e build passaram; permanece o aviso existente sobre tamanho do bundle.
- Onze verificações integradas no Chromium passaram: zoom oculto inicialmente, revelado por scroll real sem cobrir o HUD, desaparecimento automático, cenário e mobiliário, circulação dos dez NPCs, fonte animada, save e mapas externos preservados, ausência de erros JavaScript, HTTP e WebGL.
- Capturas reais da praça, caminhos e controle temporário conferidas visualmente.

O acesso à vila no lado da propriedade recebeu grama no lugar dos caminhos originais próximos à placa, sem bloquear a passagem, alterar objetos ou apagar pisos manuais diferentes do original. O tratamento atende saves existentes na renderização e novas partidas no mapa padrão. Há um teste adicional para preservar madeira, água e pisos autorais, e uma verificação no Chromium confirmou terreno gramado e passagem seca e livre. O JSON original do mapa permanece intacto.

Tudo local, sem publicação.
