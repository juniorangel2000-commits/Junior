import type Phaser from "phaser";
import benches from "../../public/assets/visual/dungeons/benches.json";
import urban from "../../public/assets/visual/dungeons/urban.json";
import weapons from "../../public/assets/visual/dungeons/weapons.json";
import pets from "../../public/assets/visual/dungeons/pets.json";
import zombie from "../../public/assets/visual/dungeons/zombie.json";
import demolisher from "../../public/assets/visual/dungeons/boss-demolisher.json";
import sentinel from "../../public/assets/visual/dungeons/boss-sentinel.json";
import chained from "../../public/assets/visual/dungeons/boss-chained.json";
import contaminated from "../../public/assets/visual/dungeons/boss-contaminated.json";
import devourer from "../../public/assets/visual/dungeons/boss-devourer.json";
import { setupVillagePropAtlas } from "../village-prop-atlas";
export const DUNGEON_ART = {
  urban, weapons, pets, zombie, benches,
  "boss-demolisher": demolisher, "boss-sentinel": sentinel,
  "boss-chained": chained, "boss-contaminated": contaminated,
  "boss-devourer": devourer,
};
export function preloadDungeonArt(scene: Phaser.Scene): void {
  for (const [id, m] of Object.entries(DUNGEON_ART))
    if (!scene.textures.exists("dungeon-" + id))
      scene.load.image("dungeon-" + id + "-source", m.file);
}
export function setupDungeonArt(scene: Phaser.Scene): void {
  for (const [id, m] of Object.entries(DUNGEON_ART)) {
    setupVillagePropAtlas(
      scene,
      "dungeon-" + id,
      "dungeon-" + id + "-source",
      m,
    );
    if (scene.textures.exists("dungeon-" + id + "-source"))
      scene.textures.remove("dungeon-" + id + "-source");
  }
}
