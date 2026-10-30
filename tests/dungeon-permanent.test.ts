import { it, expect } from "vitest";
import {
  permanentUpgradeCost,
  buyPermanentAttribute,
  createDungeonProgress,
  validDungeonProgress,
} from "../src/dungeons/progression";
import { permanentEvolutionHTML } from "../src/dungeons/permanent-ui";
it("charges increasingly steep costs for character and pets", () => {
  expect(permanentUpgradeCost(0)).toBe(150);
  expect(permanentUpgradeCost(19)).toBe(4900);
  expect(permanentUpgradeCost(0, true)).toBe(120);
  expect(permanentUpgradeCost(19, true)).toBe(3958);
  for (const pet of [false, true])
    for (let i = 1; i < 19; i++)
      expect(
        permanentUpgradeCost(i + 1, pet) - permanentUpgradeCost(i, pet),
      ).toBeGreaterThan(
        permanentUpgradeCost(i, pet) - permanentUpgradeCost(i - 1, pet),
      );
});
it("rejects insufficient XP, deducts exact cost and keeps acquired ranks", () => {
  const p = createDungeonProgress();
  p.attributes.strength = 7;
  const cost = permanentUpgradeCost(7);
  p.xp = cost - 1;
  expect(buyPermanentAttribute(p, "strength")).toBe(false);
  expect(p.attributes.strength).toBe(7);
  p.xp = cost + 8;
  expect(buyPermanentAttribute(p, "strength")).toBe(true);
  expect(p.xp).toBe(8);
  expect(p.attributes.strength).toBe(8);
  p.attributes.strength = 20;
  p.xp = 100000;
  expect(buyPermanentAttribute(p, "strength")).toBe(false);
  expect(validDungeonProgress(p)).toBe(true);
});
it("uses separate pet XP and caps pet upgrades", () => {
  const p = createDungeonProgress();
  p.xp = 900;
  p.pets = [
    {
      id: "pet",
      species: "dog",
      rare: false,
      xp: 120,
      attributes: {
        speed: 0,
        resistance: 0,
        perception: 0,
        protection: 0,
        efficiency: 0,
      },
    },
  ];
  expect(buyPermanentAttribute(p, "strength", "pet", "speed")).toBe(true);
  expect(p.pets[0].xp).toBe(0);
  expect(p.xp).toBe(900);
  p.pets[0].attributes.speed = 20;
  p.pets[0].xp = 90000;
  expect(buyPermanentAttribute(p, "strength", "pet", "speed")).toBe(false);
});
it("shows current bonus, next bonus, shortage and maximum without losing existing ranks", () => {
  const p = createDungeonProgress();
  p.attributes.strength = 2;
  p.attributes.vitality = 20;
  p.xp = 100;
  const html = permanentEvolutionHTML(p);
  expect(html).toContain("+6% de dano das armas");
  expect(html).toContain("+9% de dano das armas");
  expect(html).toContain("Faltam 210 XP");
  expect(html).toContain("Nível máximo");
  expect(html).toContain("aplicados nas dungeons");
});
