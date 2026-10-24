# After Rain 0.9.0 — Floresta Antiga

- Nova área separada de 96×72 blocos, com lago, riacho, ponte, caminhos, clareiras e árvores grandes.
- O mapa anterior continua inteiro como Propriedade Abandonada, preservando plantações, construções, recursos e edições.
- Dez animais em seis tipos, com sprites novos: galinhas, ovelhas, cabras, vacas, coelho e cervo. E acolhe o animal; ele aparece nos campos da propriedade e não reaparece na floresta.
- Salva a área atual, posição da floresta e animais acolhidos; permite continuar dentro da floresta. Relógio e plantações continuam avançando.
- M mostra a área inteira e o indicador do jogador; zoom, pausa e transições com escurecimento.

Como entrar: siga a trilha a leste da propriedade, atravesse a ponte e continue até a placa Floresta Antiga no fim do caminho (bloco 75,18). Com as mãos vazias, pressione E junto à placa. A saída da floresta fica ao sul; E retorna à propriedade.

Esta primeira etapa inclui exploração e acolhimento simples. Alimentação, reprodução, produção e caminhada animada dos animais ainda não estão implementadas. Construção, fabricação, ferramentas e editor continuam na propriedade; a floresta usa controles próprios de exploração.

Validação: TypeScript, 322 testes, build e Chromium. Testados acesso às clareiras, entrada/retorno, mapa, teclado, pausa, acolhimento dos dez animais, presença na propriedade, reentrada sem duplicação e recarga na floresta.

Prévia portátil Windows 11 x64 gerada em Windows. Execução interativa no Windows 11 não testada neste ambiente Linux.
