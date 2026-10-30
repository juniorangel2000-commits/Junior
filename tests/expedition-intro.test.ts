import { expect, it } from "vitest";
import { expeditionVideo } from "../src/dungeons/expedition-intro";

it("uses the matching supplied cinematic for both fixed characters", () => {
  expect(expeditionVideo({ characterId: "farmer-male" })).toBe("assets/video/expedition/road-male");
  expect(expeditionVideo({ characterId: "farmer-female" })).toBe("assets/video/expedition/road-female");
});

it("keeps legacy saves on the same female default as the player renderer", () => {
  expect(expeditionVideo({})).toBe("assets/video/expedition/road-female");
});
