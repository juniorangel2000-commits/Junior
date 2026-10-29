import { DUNGEON_BALANCE as B } from "./config";
export const isBossRound = (round: number) =>
  B.bossRounds.some((value) => value === round);
export function bossProfile(round: number) {
  const index = Math.max(0, Math.min(4, Math.floor(round / 10) - 1));
  return {
    health: round === 50 ? 120 : 20 + round * 1.2,
    damage: round === 50 ? 4 : 1.8 + round / 100,
    speed: round === 50 ? 1.1 : 0.85,
    xp: 100 + round * 3,
    name: ["O Demolidor", "A Sentinela", "O Acorrentado", "O Contaminado", "O Devorador"][index],
    art: ["demolisher", "sentinel", "chained", "contaminated", "devourer"][index],
    color: [0xd4ae67, 0x94b4c9, 0xd0a18e, 0xb8c96c, 0xe59583][index],
  };
}
