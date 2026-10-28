/** Um minuto de jogo por segundo de simulação, em todos os mapas. */
export const GAME_MINUTES_PER_SECOND = 1;
export const MORNING_MINUTES = 8 * 60;
export const NIGHT_START_MINUTES = 19 * 60;
export const MAX_DAY = 999_999;
export interface GameClock { day: number; time: number }
export interface SleepResult extends GameClock { ok: boolean; elapsedMinutes: number; message: string }

export function advanceClock(clock: GameClock, minutes: number): GameClock {
  if (!Number.isFinite(minutes) || minutes <= 0) return { ...clock };
  const total = clock.time + minutes;
  const day = Math.min(MAX_DAY, clock.day + Math.floor(total / 1440));
  return { day, time: clock.day + Math.floor(total / 1440) > MAX_DAY ? 1439.999 : total % 1440 };
}

export function sleepUntilMorning(clock: GameClock): SleepResult {
  const unchanged = { ...clock, ok: false, elapsedMinutes: 0 };
  if (clock.time >= MORNING_MINUTES && clock.time < NIGHT_START_MINUTES) {
    return { ...unchanged, message: 'Ainda é dia. Volte para dormir a partir das 19:00.' };
  }
  const nextDay = clock.time >= NIGHT_START_MINUTES;
  if (nextDay && clock.day >= MAX_DAY) return { ...unchanged, message: 'O calendário chegou ao último dia disponível.' };
  return {
    day: clock.day + Number(nextDay), time: MORNING_MINUTES, ok: true,
    elapsedMinutes: MORNING_MINUTES - clock.time + (nextDay ? 1440 : 0),
    message: `Você acordou às 08:00 do dia ${clock.day + Number(nextDay)}. Um novo começo.`,
  };
}
