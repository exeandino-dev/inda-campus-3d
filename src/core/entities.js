/** Registro de interactables. Cada uno es un Object3D con userData { type, title, ... }. */

export function createRegistry() {
  const items = [];
  return {
    add(object3d) {
      items.push(object3d);
      return object3d;
    },
    list() {
      return items;
    },
    nearest(from, maxDist = 6) {
      let best = null;
      let bestD = maxDist;
      for (const it of items) {
        const d = from.distanceTo(it.position);
        if (d < bestD) {
          bestD = d;
          best = it;
        }
      }
      return best;
    },
  };
}
