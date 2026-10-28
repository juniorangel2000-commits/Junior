# Frentes refinadas: Damião, Helena e Ícaro

Integração local, sem publicação. Os três ZIPs foram preservados: Damião tem 72 PNGs, Helena 56 e Ícaro 62. O ZIP reenviado do Damião é idêntico ao anterior. Cada personagem tem metadata original e manifesto com hashes SHA-256; o south refinado fica em arquivo separado.

Damião usa oito passos por direção; Helena e Ícaro usam seis. A escala e o alinhamento de cabeça do south são únicos por personagem. Apenas a linha south recebe corte de alpha para eliminar a franja translúcida; as outras sete direções são copiadas sem reamostragem. O Ícaro veio com duas variantes de caminhada north: ambas foram preservadas; a segunda exportada (`north-2101ebd7`) é usada no atlas.

## Validação

- 830 testes em 96 arquivos passaram; TypeScript e build de produção passaram (aviso já existente sobre tamanho do bundle).
- Navegador: oito direções e todas as fases registradas nos três atlas; nove poses south distintas do Damião e sete de cada outro personagem.
- Comparação pixel a pixel das outras direções: 63 poses do Damião, 49 da Helena e 49 do Ícaro; nenhuma diferença.
- Cabeça varia no máximo dois pixels e pés no máximo três pixels no canvas de 256 pixels.
- Sem erros JavaScript, WebGL ou respostas HTTP de erro.
- As 16 verificações completas da cabana do Damião passaram: condução com oito passos, comércio, editor, exportação, save, porta, iluminação e rotina.

Resultados medidos em `validacao.json`; PNGs frontais e capturas do jogo nesta pasta. A falha anterior de decodificação era do servidor antigo de desenvolvimento, que devolvia HTML para um PNG; foi resolvida usando um servidor atual, sem alterar os originais.
