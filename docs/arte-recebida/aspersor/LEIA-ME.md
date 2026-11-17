# Jardim Depois da Chuva — Integração do aspersor automático

Pacote de código e sprites para **substituir a bomba de água provisória** por um aspersor giratório com **três braços**. Não modifica os sprites de personagens nem cavalos e não publica nada no GitHub.

## Mudanças
- Animação em **16 quadros**, com **90 milissegundos por quadro**, reiniciando continuamente (sem pausa) quando há plantas no alcance.
- Versão **desligada**, sem jatos de água, quando não há canteiros a irrigar.
- Água azul semitransparente sobre os pixels da arte aprovada; base fixa e ferragens preservadas.
- **Mesma regra atual de irrigação:** plantas a até **3 tiles** da instalação recebem rega automática, em todas as direções.
- A bomba continua exigindo instalação no local já permitido pelo jogo, perto de rio/lago.
- A imagem desligada também passa a aparecer como ícone do item no inventário.
- Preserva o ID interno `waterPump`, as instalações salvas com `kind:'pump'` e o sistema atual de saves.

## Instalar em uma cópia local do projeto

Coloque esta pasta ao lado do projeto e rode no terminal:

```bash
python3 scripts/install_aspersor.py /caminho/para/Junior --check
python3 scripts/install_aspersor.py /caminho/para/Junior
```

No Windows, use `py -3 scripts/install_aspersor.py C:\\caminho\\para\\Junior`.

O instalador altera apenas:
- `src/village-equipment.ts`
- `src/visual-assets.ts`
- `src/data/items.ts`
- `public/assets/visual/equipment/irrigation-sprinkler-animated.png`
- `public/assets/visual/equipment/irrigation-sprinkler-off.png`

A instalação é repetível sem duplicar trechos. Antes de aplicar, rode `--check` para confirmar que o projeto ainda tem a estrutura esperada.

## Validar no jogo

1. Rode `npm run check` e `npm run build` com as dependências do projeto instaladas.
2. Entre na Propriedade, instale o Aspersor automático perto de rio/lago, como já permitido no jogo.
3. Com plantas a até três tiles, ele rega e gira sem pausa; sem plantas no alcance, permanece desligado.
4. Confira a altura em frente a canteiros, a sobreposição com jogador e o consumo de memória de texturas.

**Nota:** os arquivos foram preparados e validados como pacote. Não houve execução do jogo completo neste ambiente, nem modificação do repositório remoto. Não usar como arte definitiva sem o teste visual dentro da cena.
