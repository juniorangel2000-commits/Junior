import { DUNGEONS, DUNGEON_BALANCE, type DungeonId } from "./config";

/** Derived from the saved clock/round: pausing and loading cannot reroll a phase. */
export function hordeProfile(
  dungeon: DungeonId,
  elapsed: number,
  round: number,
  level = 1,
) {
  const extraLevels = Math.max(0, level - 1);
  const timed = DUNGEONS[dungeon].mode === "timed";
  const stage = Math.min(
    5,
    timed
      ? [60, 180, 360, 600, 780].filter((t) => elapsed >= t).length
      : Math.floor((round - 1) / 10),
  );
  const progress = Math.max(
    0,
    Math.min(
      1,
      timed
        ? elapsed / DUNGEONS[dungeon].duration
        : (round - 1) / (DUNGEONS[dungeon].rounds - 1),
    ),
  );
  const phaseTimes = [0, 60, 180, 360, 600, 780, 900];
  const intervals = [1.5, 1.25, 1, .85, .75, .65, .6];
  const phaseProgress = Math.max(0, Math.min(1, (elapsed - phaseTimes[stage]) / (phaseTimes[stage + 1] - phaseTimes[stage])));
  const timedInterval = intervals[stage] + (intervals[stage + 1] - intervals[stage]) * phaseProgress;
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
        ? [2, 3, 5, 8, 11, 15][stage]
        : Math.min(8, 2 + stage + Math.floor(progress * 2)),
    interval: respite
      ? 2.8
      : timed
        ? timedInterval
        : 0.65 - progress * 0.24,
    health: 1.1 * (1 + progress * 2) * (1 + extraLevels * 0.002),
    damage: 1.1 * (1 + progress) * (1 + extraLevels * 0.0006),
    speed: (1 + progress * 0.5) * (1 + Math.min(0.2, extraLevels * 0.0002)),
    experience: timed ? 1 + progress * 0.25 : 1,
    specialChance: 0.02 + stage * 0.03,
    runnerChance: stage === 0 ? 0 : 0.1 + stage * 0.025,
  };
}

/** Early onboarding is preserved; later levels keep getting more expensive. */
export function experienceForLevel(level: number): number {
  if (level >= DUNGEON_BALANCE.xpLinearStartLevel)
    return (
      DUNGEON_BALANCE.xpLinearStartCost +
      level -
      DUNGEON_BALANCE.xpLinearStartLevel
    );
  const n = Math.max(0, level - 1);
  return Math.floor(12 + n * 3 + n * n * 0.15);
}

/** Existing waves retain their saved remainder; subsequent waves use this budget. */
export function waveEnemyCount(round: number): number {
  const n = Math.max(1, Math.min(50, Math.floor(round)));
  return 5 + n * 2 + Math.floor((n - 1) * .75);
}
