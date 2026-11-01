import type Phaser from 'phaser';
import type { PetShelterData } from './systems/pet-shelter';
const files = ['01-muito-destruida', '02-parcialmente-reparada', '03-restaurada'];
export function preloadPetShelter(scene: Phaser.Scene): void {
  for(const id of ['left','right'])if(!scene.textures.exists('homestead-cliff-'+id))scene.load.image('homestead-cliff-'+id,'/assets/visual/property/homestead-cliff-'+id+'.png');
  files.forEach((file, i) => { if (!scene.textures.exists(`pet-shelter-${i}`)) scene.load.image(`pet-shelter-${i}`, `/assets/visual/pets/shelter/${file}.png`); });
}
export function drawPetShelter(scene: Phaser.Scene, site: PetShelterData): { refresh(): void } {
  // Shared crop and anchor preserve the original generated pixels across all three states.
  for (let i = 0; i < 3; i++) {
    const texture = scene.textures.get(`pet-shelter-${i}`);
    if (!texture.has('shelter')) texture.add('shelter', 0, 245, 325, 805, 725);
  }
  const house = scene.add.image(site.x, site.y, 'pet-shelter-0', 'shelter').setOrigin(.5, 1).setScale(.10).setDepth(site.y - 10).setData('pet-shelter', true);
  const supplies = scene.add.graphics().setDepth(site.y + 2);
  const refresh = () => {
    house.setTexture(`pet-shelter-${site.stage === 3 ? 2 : site.stage === 2 ? 1 : 0}`, 'shelter');
    supplies.clear();
    if (site.stage === 1) {
      supplies.fillStyle(0xb68a50, 1);
      supplies.fillRect(site.x + 48, site.y - 10, 22, 4);
      supplies.fillRect(site.x + 46, site.y - 5, 22, 4);
      supplies.lineStyle(1, 0x64492e).strokeRect(site.x + 46, site.y - 5, 22, 4);
    }
  };
  refresh();
  return { refresh };
}
