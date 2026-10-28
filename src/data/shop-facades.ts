/** Trade-specific silhouettes share materials and runtime geometry, not one house shape. */
export type FacadeId = 'augusto' | 'rosa' | 'amelia' | 'nilo' | 'celina' | 'damiao' | 'helena' | 'icaro';
type Point = { x: number; y: number };
type Rect = readonly [number, number, number, number];
export interface ShopFacade {
  texture: string;
  file: string;
  width: number;
  height: number;
  scale: number;
  door: Point;
  entranceHalfWidth: number;
  foot: number;
  chimney: Point | null;
  lamps: readonly Point[];
  glass: readonly { x: number; y: number; width: number; height: number }[];
  solids: readonly Rect[];
}
const pane = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
function facade(id: FacadeId, data: Omit<ShopFacade, 'texture' | 'file' | 'width' | 'height'>): ShopFacade {
  return { texture: `village-${id}-shop`, file: `assets/visual/village/${id}/fachada.png`, width: 1536, height: 1024, ...data };
}
export const SHOP_FACADES: Readonly<Record<FacadeId, ShopFacade>> = {
  augusto: facade('augusto', {
    scale: .23, door: { x: 822, y: 762 }, entranceHalfWidth: 95, foot: 827 / 1024,
    chimney: { x: 1240, y: 280 }, lamps: [{ x: 692, y: 607 }, { x: 956, y: 606 }],
    glass: [pane(434, 603, 155, 90), pane(1055, 602, 132, 84)],
    solids: [[160, 535, 1290, 238], [182, 700, 165, 92], [1280, 690, 145, 119]],
  }),
  rosa: facade('rosa', {
    scale: .23, door: { x: 765, y: 782 }, entranceHalfWidth: 110, foot: 833 / 1024,
    chimney: null, lamps: [{ x: 630, y: 584 }, { x: 900, y: 582 }],
    glass: [pane(200, 512, 380, 223), pane(948, 512, 385, 223), pane(280, 325, 1000, 129)],
    solids: [[160, 500, 1240, 288], [75, 730, 320, 105], [1150, 715, 325, 120]],
  }),
  amelia: facade('amelia', {
    scale: .255, door: { x: 628, y: 862 }, entranceHalfWidth: 75, foot: 958 / 1024,
    chimney: { x: 390, y: 106 }, lamps: [{ x: 510, y: 650 }, { x: 759, y: 650 }],
    glass: [pane(588, 350, 72, 85), pane(375, 646, 45, 73), pane(906, 476, 370, 80), pane(875, 600, 437, 235)],
    solids: [[330, 550, 525, 324], [855, 580, 480, 325], [435, 840, 95, 94], [735, 838, 83, 90]],
  }),
  nilo: facade('nilo', {
    scale: .255, door: { x: 768, y: 895 }, entranceHalfWidth: 75, foot: 980 / 1024,
    chimney: { x: 901, y: 29 }, lamps: [{ x: 678, y: 700 }, { x: 857, y: 700 }],
    glass: [pane(742, 153, 50, 81), pane(585, 388, 70, 90), pane(862, 394, 59, 80), pane(526, 644, 113, 215), pane(902, 643, 107, 217)],
    solids: [[480, 610, 565, 312]],
  }),
  celina: facade('celina', {
    scale: .255, door: { x: 987, y: 895 }, entranceHalfWidth: 90, foot: 960 / 1024,
    chimney: { x: 1181, y: 72 }, lamps: [{ x: 868, y: 670 }, { x: 1117, y: 670 }],
    glass: [pane(936, 350, 121, 94), pane(683, 386, 50, 63), pane(1260, 414, 45, 68), pane(265, 590, 510, 240), pane(1235, 653, 89, 95)],
    solids: [[220, 575, 1180, 313]],
  }),
  damiao: facade('damiao', {
    scale: .255, door: { x: 620, y: 803 }, entranceHalfWidth: 80, foot: 880 / 1024,
    chimney: { x: 394, y: 117 }, lamps: [{ x: 502, y: 590 }, { x: 750, y: 590 }, { x: 915, y: 615 }],
    glass: [pane(330, 543, 75, 107), pane(870, 548, 335, 198)],
    solids: [[195, 480, 1220, 329], [110, 690, 170, 180], [1310, 720, 163, 160]],
  }),
  helena: facade('helena', {
    scale: .255, door: { x: 330, y: 850 }, entranceHalfWidth: 90, foot: 923 / 1024,
    chimney: { x: 259, y: 92 }, lamps: [{ x: 202, y: 650 }, { x: 448, y: 651 }, { x: 1426, y: 671 }],
    glass: [pane(255, 374, 75, 73), pane(544, 374, 75, 70), pane(555, 640, 58, 80), pane(750, 620, 445, 150)],
    solids: [[155, 535, 575, 322], [730, 600, 730, 279], [90, 796, 165, 120], [1405, 794, 99, 115]],
  }),
  icaro: facade('icaro', {
    scale: .255, door: { x: 355, y: 823 }, entranceHalfWidth: 83, foot: 881 / 1024,
    chimney: { x: 329, y: 253 }, lamps: [{ x: 250, y: 622 }, { x: 465, y: 622 }],
    glass: [pane(523, 590, 142, 102), pane(760, 254, 560, 170), pane(885, 465, 355, 35)],
    solids: [[200, 530, 1220, 336], [114, 756, 80, 113], [1403, 760, 90, 116]],
  }),
};
export function facadeSourceSolid(b: ShopFacade, x: number, y: number): boolean {
  // A narrow entrance is clear, while the rest of the walls and stock remain solid.
  if (Math.abs(x - b.door.x) < b.entranceHalfWidth && y >= b.door.y - 40 && y <= b.door.y + 100) return false;
  return b.solids.some(([left, top, width, height]) => x >= left && x <= left + width && y >= top && y <= top + height);
}
export function facadeBlockedPoint(b: ShopFacade, x: number, y: number, anchor: Point): boolean {
  return facadeSourceSolid(b, b.door.x + (x - (anchor.x + .5) * 32) / b.scale, b.door.y + (y - (anchor.y * 32 + 25)) / b.scale);
}
const FACADE_TRADES: Readonly<Record<string, FacadeId>> = {
  general: 'augusto', seeds: 'rosa', herbalist: 'amelia', traveler: 'nilo', tailor: 'celina', fisher: 'damiao', inn: 'helena', mechanic: 'icaro',
};
export function facadeForMerchant(shop: string | undefined): ShopFacade | undefined {
  return shop && Object.hasOwn(FACADE_TRADES, shop) ? SHOP_FACADES[FACADE_TRADES[shop]] : undefined;
}
