/** AABB colliders from the same wall records that architecture draws (Rule 5). */

export function wallToAabb(wall) {
  return {
    minX: wall.x - wall.w / 2,
    maxX: wall.x + wall.w / 2,
    minZ: wall.z - wall.d / 2,
    maxZ: wall.z + wall.d / 2,
    minY: wall.y - wall.h / 2,
    maxY: wall.y + wall.h / 2,
  };
}

/** Circle vs AABB on XZ. Player stays on the floor (y=0), so only walls with minY < 1.8 collide. */
export function resolveCircleAabb(px, pz, radius, aabb, height = 1.8) {
  if (aabb.maxY < 0.05 || aabb.minY > height) return { x: px, z: pz };
  const nx = Math.max(aabb.minX, Math.min(px, aabb.maxX));
  const nz = Math.max(aabb.minZ, Math.min(pz, aabb.maxZ));
  const dx = px - nx;
  const dz = pz - nz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= radius * radius) return { x: px, z: pz };
  if (d2 < 1e-8) {
    const left = px - aabb.minX;
    const right = aabb.maxX - px;
    const up = pz - aabb.minZ;
    const down = aabb.maxZ - pz;
    const m = Math.min(left, right, up, down);
    if (m === left) return { x: aabb.minX - radius, z: pz };
    if (m === right) return { x: aabb.maxX + radius, z: pz };
    if (m === up) return { x: px, z: aabb.minZ - radius };
    return { x: px, z: aabb.maxZ + radius };
  }
  const d = Math.sqrt(d2);
  const k = radius / d;
  return { x: nx + dx * k, z: nz + dz * k };
}

export function slide(px, pz, radius, aabbs) {
  let x = px;
  let z = pz;
  for (let i = 0; i < aabbs.length; i++) {
    const r = resolveCircleAabb(x, z, radius, aabbs[i]);
    x = r.x;
    z = r.z;
  }
  return { x, z };
}
