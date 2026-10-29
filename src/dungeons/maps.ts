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
export const PARKING_BAYS = Array.from({ length: 24 }, (_, i) => ({
  x: 440 + [0, 1, 2, 7, 8, 9][i % 6] * 245,
  y: 540 + Math.floor(i / 6) * 320,
}));
export const PARK_LAWNS = [
  { x: 780, y: 630, w: 420, h: 270 },
  { x: 1850, y: 620, w: 430, h: 280 },
  { x: 790, y: 1480, w: 410, h: 250 },
  { x: 1860, y: 1480, w: 420, h: 250 },
];
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
    for (const [x, y, kind, w, h] of [
      [320, 330, "apartment", 320, 240],
      [1240, 245, "shop", 330, 220],
      [2640, 380, "apartment", 340, 250],
      [2800, 1320, "shop", 270, 200],
      [260, 1400, "shop", 280, 200],
    ] as const)
      add(kind, x, y, w, h);
    add("fountain", 1536, 1152, 170, 145);
    for (const [x, y] of [
      [1300, 1160],
      [1770, 1160],
      [1536, 1390],
      [1536, 925],
    ])
      add("bench", x, y, 80, 45);
    for (const [x, y, kind] of [
      [390, 700, "sedan"],
      [2750, 730, "van"],
      [390, 1860, "hatchback"],
      [2670, 1940, "suv"],
      [610, 350, "van"],
      [2250, 2160, "sedan"],
    ] as const)
      add(kind, x, y, 76, 116);
    for (const [x, y] of [
      [560, 980],
      [2440, 970],
      [580, 1620],
      [2460, 1630],
      [1020, 470],
      [2060, 1940],
    ])
      add("lamp", x, y, 70, 140);
    for (const [x, y] of [
      [780, 700],
      [2180, 700],
      [780, 1650],
      [2180, 1650],
    ])
      add("bush", x, y, 76, 48, false);
    for (const [x, y, kind] of [
      [500, 1450, "bin"],
      [2480, 1860, "drum"],
      [1140, 325, "supply"],
      [2690, 1260, "barrier"],
    ] as const)
      add(kind, x, y, 55, 55);
  } else {
    add("mall", 1536, 260, 650, 260);
    add("booth", 420, 1940, 120, 130);
    add("booth", 2630, 1940, 120, 130);
    for (const [i, bay] of PARKING_BAYS.entries())
      if (i % 3 !== 0) {
        add(
          (["sedan", "hatchback", "van", "suv"] as const)[(i * 7) % 4],
          bay.x + (i % 2 ? 4 : -4),
          bay.y + 140,
          76,
          116,
        );
      }
    for (const [x, y] of [
      [260, 520],
      [1050, 650],
      [2050, 650],
      [2800, 560],
      [1040, 1750],
      [2050, 1750],
      [2800, 1740],
      [260, 1740],
    ])
      add("lamp", x, y, 70, 140);
    for (const [x, y, kind] of [
      [500, 410, "barrier"],
      [2490, 410, "barrier"],
      [330, 1120, "drum"],
      [2780, 1050, "bin"],
      [2460, 2040, "supply"],
    ] as const)
      add(kind, x, y, 64, 55);
    for (const [x, y] of [
      [300, 800],
      [2840, 800],
      [310, 1460],
      [2820, 1450],
    ])
      add("bush", x, y, 80, 50, false);
  }
  return result;
}
interface Collider {
  x: number;
  halfWidth: number;
  top: number;
  bottom: number;
}
const collisionCells = new Map<DungeonId, Map<string, Collider[]>>();
function collisionIndex(id: DungeonId): Map<string, Collider[]> {
  const cached = collisionCells.get(id);
  if (cached) return cached;
  const cells = new Map<string, Collider[]>();
  const boxes: Collider[] = DUNGEON_TREES[id].map((t) => ({
    x: t.x,
    halfWidth: 18,
    top: t.y - 12,
    bottom: t.y + 12,
  }));
  for (const p of MAP_OBSTACLES[id]) {
    if (!p.solid) continue;
    if (p.kind === "lamp") {
      boxes.push({ x: p.x, halfWidth: 9, top: p.y - 9, bottom: p.y + 4 });
      continue;
    }
    const frame = urban.frames[p.kind],
      scale = Math.min(p.width / frame.width, p.height / frame.height),
      width = frame.width * scale,
      height = frame.height * scale,
      depth = ["sedan", "hatchback", "van", "suv"].includes(p.kind)
        ? height * 0.85
        : ["apartment", "mall", "booth", "shop"].includes(p.kind)
          ? 45
          : height * 0.6;
    boxes.push({
      x: p.x,
      halfWidth: width * 0.36,
      top: p.y - depth,
      bottom: p.y + 6,
    });
  }
  for (const box of boxes)
    for (
      let cy = Math.floor(box.top / 128);
      cy <= Math.floor(box.bottom / 128);
      cy++
    )
      for (
        let cx = Math.floor((box.x - box.halfWidth) / 128);
        cx <= Math.floor((box.x + box.halfWidth) / 128);
        cx++
      ) {
        const key = cx + "," + cy,
          items = cells.get(key) ?? [];
        items.push(box);
        cells.set(key, items);
      }
  collisionCells.set(id, cells);
  return cells;
}
export function dungeonBlocked(id: DungeonId, x: number, y: number): boolean {
  if (x < 32 || y < 48 || x > 3040 || y > 2260) return true;
  return (
    collisionIndex(id)
      .get(Math.floor(x / 128) + "," + Math.floor(y / 128))
      ?.some(
        (b) => Math.abs(x - b.x) < b.halfWidth && y > b.top && y < b.bottom,
      ) ?? false
  );
}
export const MAP_OBSTACLES = {
  "abandoned-central-square": dungeonObstacles("abandoned-central-square"),
  "mall-parking": dungeonObstacles("mall-parking"),
};

export const DUNGEON_TREES = Object.fromEntries(
  (["abandoned-central-square", "mall-parking"] as const).map((id) => {
    const trees: { x: number; y: number; variant: number }[] = [];
    const clusters =
      id === "abandoned-central-square"
        ? [
            [170, 620],
            [220, 1800],
            [2830, 550],
            [2850, 1780],
            [800, 2080],
            [2250, 2120],
            [950, 790],
            [2070, 1640],
          ]
        : [
            [140, 700],
            [160, 1380],
            [2880, 650],
            [2890, 1370],
            [630, 2140],
            [2380, 2160],
          ];
    for (const [cluster, center] of clusters.entries())
      for (let n = 0; n < (cluster < 6 ? 5 : 3); n++) {
        const a = n * 2.399963 + cluster * 0.7,
          r = 30 + ((n * 43) % 140),
          x = Math.round(center[0] + Math.cos(a) * r),
          y = Math.round(center[1] + Math.sin(a) * r);
        if (
          x < 90 ||
          x > 2980 ||
          y < 140 ||
          y > 2210 ||
          Math.hypot(x - DUNGEON_ENTRY.x, y - DUNGEON_ENTRY.y) < 210
        )
          continue;
        if (
          MAP_OBSTACLES[id].some(
            (p) => p.solid && Math.hypot(p.x - x, p.y - y) < 130,
          )
        )
          continue;
        if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < 70)) continue;
        trees.push({ x, y, variant: (cluster + n) % 3 });
      }
    return [id, trees];
  }),
) as Record<DungeonId, { x: number; y: number; variant: number }[]>;

/** Layout updates keep old runs playable by moving only actors inside a new obstacle. */
export function safeDungeonPoint(
  id: DungeonId,
  x: number,
  y: number,
): { x: number; y: number } {
  if (!dungeonBlocked(id, x, y)) return { x, y };
  for (let radius = 8; radius <= 384; radius += 8)
    for (let n = 0; n < 32; n++) {
      const a = (n * Math.PI) / 16,
        px = x + Math.cos(a) * radius,
        py = y + Math.sin(a) * radius;
      if (!dungeonBlocked(id, px, py)) return { x: px, y: py };
    }
  return { ...DUNGEON_ENTRY };
}

export const urbanOriginX = (kind: DungeonObstacle["kind"]): number =>
  kind === "lamp" ? 0.33 : 0.5;
