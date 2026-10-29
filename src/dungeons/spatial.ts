export interface SpatialEntity {
  id: number;
  x: number;
  y: number;
}
/** Rebuilt once per simulation tick; attacks inspect neighboring cells only. */
export class EnemySpatialIndex<T extends SpatialEntity> {
  private readonly cells = new Map<string, T[]>();
  constructor(readonly size = 128) {}
  rebuild(entities: Iterable<T>): void {
    this.cells.clear();
    for (const e of entities) {
      const key = `${Math.floor(e.x / this.size)},${Math.floor(e.y / this.size)}`,
        cell = this.cells.get(key) ?? [];
      cell.push(e);
      this.cells.set(key, cell);
    }
  }
  query(x: number, y: number, radius: number): T[] {
    const result: T[] = [],
      r2 = radius * radius;
    for (
      let cy = Math.floor((y - radius) / this.size);
      cy <= Math.floor((y + radius) / this.size);
      cy++
    )
      for (
        let cx = Math.floor((x - radius) / this.size);
        cx <= Math.floor((x + radius) / this.size);
        cx++
      )
        for (const e of this.cells.get(`${cx},${cy}`) ?? [])
          if ((e.x - x) ** 2 + (e.y - y) ** 2 <= r2) result.push(e);
    return result;
  }
}
