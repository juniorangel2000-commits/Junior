interface Point {
  x: number;
  y: number;
}
interface View extends Point {
  width: number;
  height: number;
}
/** Project the rescue point into the canvas and keep the label clear of the HUD. */
export function petRescueMarker(
  player: Point,
  pet: Point,
  view: View,
  screen: View,
) {
  const dx = pet.x - player.x,
    dy = pet.y - player.y;
  const projectedX = screen.x + ((pet.x - view.x) / view.width) * screen.width;
  const projectedY =
    screen.y + ((pet.y - view.y) / view.height) * screen.height;
  const marginX = Math.min(90, screen.width / 2),
    marginY = Math.min(150, screen.height / 2);
  return {
    x: Math.max(
      screen.x + marginX,
      Math.min(screen.x + screen.width - marginX, projectedX),
    ),
    y: Math.max(
      screen.y + marginY,
      Math.min(screen.y + screen.height - marginY, projectedY - 58),
    ),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    near: Math.hypot(dx, dy) < 80,
  };
}
