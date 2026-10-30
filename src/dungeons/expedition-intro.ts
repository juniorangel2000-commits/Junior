import { CinematicPlayer } from "../cinematic-player";
import { resolveCharacter } from "../data/characters";
import type { CharacterProfile } from "../types";

export function expeditionVideo(profile: Pick<CharacterProfile, "characterId">): string {
  return `assets/video/expedition/road-${resolveCharacter(profile).id === "farmer-male" ? "male" : "female"}`;
}

/** City travel uses the shared player and the same resource gate. */
export class ExpeditionIntro extends CinematicPlayer {
  constructor(host: HTMLElement, profile: Pick<CharacterProfile, "characterId">, resources: Promise<unknown>, complete: () => void, back: () => void) {
    const base = expeditionVideo(profile);
    super(host, { src: `${base}.mp4`, poster: `${base}.jpg`, label: "Viagem até a cidade", description: "A estrada para a cidade", loading: "Preparando a cidade…", className: "dungeon-travel expedition-intro" }, resources, complete, back);
  }
}

export async function decodeExpeditionPreviews(previews: Record<string, string>): Promise<void> {
  await Promise.all(Object.values(previews).map(src => {
    const image = new Image();
    image.src = src;
    return image.decode();
  }));
  await document.fonts.ready;
}
