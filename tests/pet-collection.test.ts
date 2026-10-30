import { expect, it } from "vitest";
import { petCollectionHTML, type PetMenuView } from "../src/dungeons/pet-menu";
import { petSpritePose } from "../src/dungeons/pet-sprites";
import { recolorPetPixels } from "../src/dungeons/pet-appearance";

it("shows all four locked variations for a new player, without equip actions", () => {
  const html = petCollectionHTML({ pets: [], icons: {}, nearby: false });
  expect(html).toContain("0 de 4");
  expect(html.match(/data-unlocked="false"/g)).toHaveLength(4);
  expect(html).not.toContain("data-pet-select");
  expect(html.toLowerCase()).not.toContain("shiny");
});

it("unlocks only rescued species and variants, counts duplicates once and uses variant portraits", () => {
  const pet = {
    id: "cat-rare",
    species: "cat" as const,
    rare: true,
    xp: 0,
    attributes: {
      speed: 0,
      resistance: 0,
      perception: 0,
      protection: 0,
      efficiency: 0,
    },
  };
  const view: PetMenuView = {
    pets: [pet, { ...pet, id: "second-cat" }],
    selected: pet.id,
    nearby: true,
    icons: { "cat-rare": "gold.png" },
  };
  const html = petCollectionHTML(view);
  expect(html).toContain("1 de 4");
  expect(html.match(/data-unlocked="true"/g)).toHaveLength(1);
  expect(html).toContain("2 na coleção");
  expect(html).toContain('src="gold.png"');
  expect(html).toContain('data-pet-select="cat-rare"');
  expect(html).toContain("Em uso");
  expect(html).toContain("+10% de experiência recebida");
  expect(html.toLowerCase()).not.toContain("shiny");
});

it("preserves exact alpha and transparent pixels while applying distinct runtime palettes", () => {
  const original = new Uint8ClampedArray([
    255, 230, 180, 255, 110, 90, 60, 128, 3, 7, 9, 0,
  ]);
  const dog = original.slice(),
    cat = original.slice();
  recolorPetPixels(dog, "dog");
  recolorPetPixels(cat, "cat");
  expect(dog).not.toEqual(cat);
  expect(dog.slice(0, 3)).not.toEqual(original.slice(0, 3));
  for (const pixels of [dog, cat]) {
    expect(pixels[3]).toBe(255);
    expect(pixels[7]).toBe(128);
    expect(pixels.slice(8)).toEqual(original.slice(8));
  }
});

it("changes only the texture for every variant animation, preserving frame, scale and pivot", () => {
  for (const species of ["dog", "cat"] as const)
    for (const action of [
      "idle",
      "walk",
      "run",
      "attack",
      "rest",
      "sit",
      "stand",
    ] as const)
      for (const direction of ["north", "south", "east", "west"] as const) {
        const common = petSpritePose(species, action, direction, 0.4);
        const rare = petSpritePose(species, action, direction, 0.4, true, true);
        expect(rare.texture).toBe(common.texture + "-rare");
        expect({ ...rare, texture: common.texture }).toEqual(common);
      }
});
