import urban from "../../public/assets/visual/dungeons/urban.json";
import type { DungeonId } from "./config";
export interface DungeonObstacle {
  id: string;
  kind:
    | "apartment"
    | "mall"
    | "booth"
    | "shop"
    | "sedan"
    | "hatchback"
    | "van"
    | "suv"
    | "fountain"
    | "bench"
    | "lamp"
    | "barrier"
    | "bush"
    | "drum"
    | "supply"
    | "bin";
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
}
export const DUNGEON_ENTRY = { x: 1536, y: 1856 };
export function dungeonObstacles(id: DungeonId): DungeonObstacle[] {
  const result: DungeonObstacle[] = [];
  const add = (
    kind: DungeonObstacle["kind"],
    x: number,
    y: number,
    width: number,
    height: number,
    solid = true,
  ) =>
    result.push({
      id: kind + "-" + result.length,
      kind,
      x,
      y,
      width,
      height,
      solid,
    });
  if (id === "abandoned-central-square") {
    for (const [x, y, kind] of [
      [300, 330, "apartment"],
      [1250, 270, "shop"],
      [2390, 310, "apartment"],
      [2700, 900, "shop"],
      [260, 1200, "shop"],
    ] as const)
      add(kind, x, y, 300, 220);
    add("fountain", 1536, 1080, 150, 130);
    for (const [x, y] of [
      [1230, 1080],
      [1850, 1080],
      [1536, 1390],
      [1536, 780],
    ])
      add("bench", x, y, 80, 45);
    for (let i = 0; i < 12; i++)
      add(
        i % 3 ? "sedan" : "van",
        420 + (i % 6) * 420,
        520 + Math.floor(i / 6) * 1280,
        70,
        110,
      );
  } else {
    add("mall", 1536, 260, 650, 260);
    add("booth", 420, 1830, 120, 130);
    add("booth", 2600, 1830, 120, 130);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 9; col++)
        if ((row * 7 + col) % 3 !== 0)
          add(
            (["sedan", "hatchback", "van", "suv"] as const)[(row + col) % 4],
            440 + col * 265,
            650 + row * 300,
            70,
            110,
          );
  }
  for (let i = 0; i < 14; i++) {
    add("lamp", 220 + (i % 7) * 430, 510 + Math.floor(i / 7) * 1350, 70, 140);
    if (i % 3 === 0)
      add(
        "bush",
        250 + (i % 7) * 420,
        470 + Math.floor(i / 7) * 1370,
        70,
        45,
        false,
      );
  }
  return result;
}
export function dungeonBlocked(id: DungeonId, x: number, y: number): boolean {
  return (
    x < 32 ||
    y < 48 ||
    x > 3040 ||
    y > 2260 ||
    DUNGEON_TREES[id].some(
      (t) => Math.abs(x - t.x) < 18 && Math.abs(y - t.y) < 12,
    ) ||
    MAP_OBSTACLES[id].some((p) => {
      if (p.kind === "lamp")
        return p.solid && Math.abs(x - p.x) < 9 && y > p.y - 9 && y < p.y + 4;
      const r = urban.frames[p.kind],
        scale = Math.min(p.width / r.width, p.height / r.height),
        width = r.width * scale,
        height = r.height * scale,
        car = ["sedan", "hatchback", "van", "suv"].includes(p.kind),
        depth = car
          ? height * 0.85
          : ["apartment", "mall", "booth", "shop"].includes(p.kind)
            ? 45
            : height * 0.6;
      return (
        p.solid &&
        Math.abs(x - p.x) < width * 0.36 &&
        y > p.y - depth &&
        y < p.y + 6
      );
    })
  );
}
export const MAP_OBSTACLES = {
  "abandoned-central-square": dungeonObstacles("abandoned-central-square"),
  "mall-parking": dungeonObstacles("mall-parking"),
};

export const DUNGEON_TREES = Object.fromEntries(
  (["abandoned-central-square", "mall-parking"] as const).map((id) => {
    const trees: { x: number; y: number; variant: number }[] =
      id === "abandoned-central-square"
        ? [
            { x: 1030, y: 810, variant: 0 },
            { x: 2080, y: 810, variant: 1 },
            { x: 1040, y: 1580, variant: 2 },
            { x: 2080, y: 1580, variant: 0 },
          ]
        : [];
    for (let i = 0; i < 48; i++) {
      const x = 130 + ((i * 659) % 2800),
        y = 150 + ((i * 397) % 2000);
      if (
        id === "abandoned-central-square"
          ? x > 650 && x < 2420 && y > 550 && y < 1810
          : x > 250 && x < 2800 && y > 300 && y < 2050
      )
        continue;
      if (MAP_OBSTACLES[id].some((p) => Math.hypot(p.x - x, p.y - y) < 145))
        continue;
      trees.push({ x, y, variant: i % 3 });
    }
    return [id, trees];
  }),
) as Record<DungeonId, { x: number; y: number; variant: number }[]>;

export const urbanOriginX = (kind: DungeonObstacle["kind"]): number =>
  kind === "lamp" ? 0.33 : 0.5;
