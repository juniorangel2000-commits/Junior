import weaponArt from "../../public/assets/visual/dungeons/weapons-remake.json";
import type { AttackEffect } from "./run";
import type { WeaponId } from "./config";
import { swordHalfArc } from "./weapon-identity";
export const WEAPON_PALETTES: Record<
  WeaponId,
  { core: number; trail: number }
> = {
  sword: { core: 0xe6eee2, trail: 0x87b9b5 },
  bow: { core: 0xe4d8a6, trail: 0xa9bf92 },
  spear: { core: 0xd1ede4, trail: 0x65aaa2 },
  boomerang: { core: 0xdcbe88, trail: 0x70b9ad },
  hammer: { core: 0xe8d2a5, trail: 0xb79b7c },
  "rotating-blade": { core: 0xdde9dc, trail: 0x91bca3 },
  "orbiting-shield": { core: 0xc8e1f1, trail: 0x85b8d5 },
};
/** Physical art stays proportional to the avatar; reach is shown by the attack effects. */
export const WEAPON_DISPLAY_BOUNDS = {
  sword: { width: 34, height: 12 },
  bow: { width: 16, height: 34 },
  spear: { width: 60, height: 14 },
  hammer: { width: 38, height: 22 },
  boomerang: { width: 25, height: 25 },
  "rotating-blade": { width: 26, height: 26 },
  "orbiting-shield": { width: 22, height: 24 },
  arrow: { width: 24, height: 7 },
} as const;
export function weaponDisplaySize(id: WeaponId | "arrow", evolved = false) {
  const frame =
    weaponArt.frames[
      `${id}${evolved ? "-evolved" : ""}` as keyof typeof weaponArt.frames
    ];
  const box = WEAPON_DISPLAY_BOUNDS[id],
    scale = Math.min(box.width / frame.width, box.height / frame.height);
  return { width: frame.width * scale, height: frame.height * scale };
}
export const effectProgress = (ttl: number) =>
  Math.max(0, Math.min(1, (0.22 - ttl) / 0.22));
export function attackSpritePose(
  e: AttackEffect,
  range: number,
  wide: number,
  evolved = false,
) {
  const t = effectProgress(e.ttl),
    direction = e.variant ? -1 : 1;
  const display = weaponDisplaySize(e.weapon, evolved);
  let x = e.x,
    y = e.y - 20,
    angle = e.angle,
    width = display.width,
    height = display.height;
  if (e.weapon === "sword") {
    angle = e.angle + direction * (t * 2 - 1) * swordHalfArc(wide);
    x += Math.cos(angle) * Math.min(range * 0.42, 20);
    y += Math.sin(angle) * Math.min(range * 0.42, 20);
  } else if (e.weapon === "spear") {
    width = Math.min(display.width, range);
    height = (display.height * width) / display.width;
    const thrust = Math.sin(Math.PI * Math.min(1, t * 1.2));
    const reach = width * 0.25 + (range - width * 0.75) * thrust;
    x += Math.cos(angle) * reach;
    y += Math.sin(angle) * reach;
  } else if (e.weapon === "hammer") {
    const swing = Math.sin((t * Math.PI) / 2);
    angle = e.angle - 1.6 * (1 - swing);
    x += Math.cos(e.angle) * 12;
    y -= Math.sin(Math.PI * t) * 26;
  } else if (e.weapon === "bow") {
    x += Math.cos(angle) * (20 - (1 - t) * 5);
    y += Math.sin(angle) * (20 - (1 - t) * 5);
  }
  return { x, y, angle, width, height, alpha: Math.min(1, (1 - t) * 3) };
}
