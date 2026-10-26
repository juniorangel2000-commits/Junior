// EXEMPLO de integração, não aplicado ao jogo.
// Copie os PNGs para o diretório público conforme a arquitetura atual do projeto.
// Coordenadas e colisões ainda DEVEM ser verificadas em jogo.
import Phaser from 'phaser';

type SceneItem = { key: string; url: string; x: number; y: number; interactive?: boolean };
export function preloadStoreProps(scene: Phaser.Scene, items: SceneItem[]) {
  for (const it of items) if (!scene.textures.exists(it.key)) scene.load.image(it.key,it.url);
}
export function placeStoreProps(scene: Phaser.Scene, items: SceneItem[]) {
  return items.map(it => {
    const image = scene.add.image(it.x,it.y,it.key).setOrigin(0.5,1);
    image.setDepth(Math.round(it.y)); // ordenação por posição dos pés
    if (it.interactive) image.setInteractive();
    return image;
  });
}
// NÃO criar corpos físicos sem definir hitboxes verificadas, caminhos e pontos de interação.
