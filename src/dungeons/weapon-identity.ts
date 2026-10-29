import { WEAPONS, type WeaponId } from "./config";
export const WEAPON_EVOLUTIONS = {
  sword: {
    id: "sword-dual",
    name: "Espadas Duplas",
    role: "Cortes alternados para abrir passagem",
  },
  bow: {
    id: "bow-triple",
    name: "Disparo Triplo",
    role: "Três flechas direcionadas; prioriza alvos diferentes",
  },
  boomerang: {
    id: "boomerang-cross",
    name: "Trajetória Cruzada",
    role: "Dois lados cobertos, com dano na ida e na volta",
  },
  spear: {
    id: "spear-fan",
    name: "Estocada em Leque",
    role: "Três linhas de perfuração, sem repetir o mesmo alvo",
  },
  hammer: {
    id: "hammer-double",
    name: "Martelada Dupla",
    role: "Dois impactos de área com recuo do grupo",
  },
  "rotating-blade": {
    id: "blade-double",
    name: "Lâminas Duplas",
    role: "Duas lâminas opostas controlam a área próxima",
  },
  "orbiting-shield": {
    id: "shield-double",
    name: "Barreira de Impacto",
    role: "Duas cargas de bloqueio e onda de repulsão maior",
  },
} as const;
export function weaponIdentity(
  id: WeaponId,
  levels: Readonly<Record<string, number>>,
) {
  const evolution = WEAPON_EVOLUTIONS[id as keyof typeof WEAPON_EVOLUTIONS];
  return evolution && levels[evolution.id]
    ? { name: evolution.name, role: evolution.role, evolved: true }
    : {
        name: WEAPONS[id].name,
        role:
          (
            {
              sword: "Corte frontal que abre espaço",
              bow: "Disparo preciso à distância",
              boomerang: "Atravessa grupos e retorna",
              spear: "Perfura inimigos alinhados",
              hammer: "Impacto de área com recuo",
              "rotating-blade": "Controla a área ao redor",
              "orbiting-shield": "Absorve um golpe, repele o cerco e recarrega",
            } as Partial<Record<WeaponId, string>>
          )[id] ?? WEAPONS[id].name,
        evolved: false,
      };
}
export const swordHalfArc = (wide: number) => 0.65 + wide * 0.18;
export function insideSwordArc(
  dx: number,
  dy: number,
  angle: number,
  wide: number,
): boolean {
  const relative = Math.atan2(dy, dx) - angle;
  return (
    Math.abs(Math.atan2(Math.sin(relative), Math.cos(relative))) <=
    swordHalfArc(wide)
  );
}
