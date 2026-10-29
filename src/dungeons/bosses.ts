import { DUNGEON_BALANCE as B } from "./config";
export const isBossRound = (round: number) =>
  B.bossRounds.some((value) => value === round);
export function bossProfile(round: number) {
  return {
    health: round === 50 ? 120 : 20 + round * 1.2,
    damage: round === 50 ? 4 : 1.8 + round / 100,
    speed: round === 50 ? 1.1 : 0.85,
    xp: 100 + round * 3,
    name: round === 50 ? "Chefe final" : "Chefe da rodada " + round,
  };
}
