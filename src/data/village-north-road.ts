import { villageNorthConnectionDistance } from "./city-forest";
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
/** Same walkable link: warm village paving gradually gives way to the dirt road. */
export function villageNorthRoadSurface(px: number, py: number) {
  const distance = villageNorthConnectionDistance(px / 32, py / 32) * 32;
  const edgeNoise =
    Math.sin(py * 0.19 + px * 0.07) * 0.65 +
    Math.sin(px * 0.37 - py * 0.11) * 0.35;
  const coverage = 1 - smooth((distance - 21.5 + edgeNoise) / 3.5);
  const progress = smooth((py - 88) / 320);
  const patches =
    Math.sin(px * 0.17 + py * 0.083) * 0.21 +
    Math.sin(px * 0.31 - py * 0.137) * 0.16 +
    Math.sin(px * 0.061 - py * 0.057) * 0.08;
  const stone =
    progress >= 0.999
      ? 1
      : progress <= 0.001
        ? 0
        : smooth((progress + patches - 0.38) / 0.24);
  const join = smooth((Math.hypot(px - 1424, py - 464) - 24) / 36);
  const curb =
    smooth((distance - 20) / 1.3) *
    (1 - smooth((distance - 23.5) / 1.6)) *
    progress *
    stone *
    join;
  return { coverage, stone, curb };
}
