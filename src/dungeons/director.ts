import { DUNGEONS, type DungeonId } from "./config";

/** Derived from the saved clock/round: pausing and loading cannot reroll a phase. */
export function hordeProfile(
  dungeon: DungeonId,
  elapsed: number,
  round: number,
) {
  const timed = DUNGEONS[dungeon].mode === "timed";
  const stage = Math.min(
    5,
    timed
      ? [60, 180, 360, 600, 780].filter((t) => elapsed >= t).length
      : Math.floor((round - 1) / 10),
  );
  // Brief breathing windows reduce arrivals; enemies already present keep pursuing.
  const respite = timed && elapsed >= 80 && elapsed % 90 >= 80;
  const pattern = timed ? Math.floor(elapsed / 30) % 3 : (round - 1) % 3;
  return {
    stage,
    respite,
    name: respite
      ? "Breve respiro"
      : [
          "Primeiros sinais",
          "Cerco crescente",
          "Ruas tomadas",
          "Horda intensa",
          "Resistência",
          "Última resistência",
        ][stage],
    pattern: (["surround", "flank", "pincer"] as const)[pattern],
    sector: (timed ? Math.floor(elapsed / 30) : round) * 2.399963,
    batch: respite
      ? 1
      : timed
        ? [2, 3, 5, 7, 9, 12][stage]
        : Math.min(6, 2 + stage),
    interval: respite
      ? 2.8
      : timed
        ? [1.5, 1.25, 1, 0.85, 0.75, 0.65][stage]
        : Math.max(0.3, 0.65 - stage * 0.06),
    health: 1 + stage * 0.22 + (timed ? 0 : (round - 1) * 0.012),
    specialChance: 0.02 + stage * 0.025,
    runnerChance: stage === 0 ? 0 : 0.1 + stage * 0.025,
  };
}

/** Gradual cost growth keeps later choices attainable within a fifteen-minute run. */
export function experienceForLevel(level: number): number {
  const n = Math.max(0, level - 1);
  return Math.floor(12 + n * 6 + n * n * 0.35);
}
