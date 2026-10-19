import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { wallToAabb, resolveCircleAabb, slide } from './collision.js';

describe('collision', () => {
  it('AABB from the same wall record architecture draws', () => {
    const aabb = wallToAabb({ x: 0, y: 7, z: -23, w: 40, h: 14, d: 1.2 });
    assert.equal(aabb.minX, -20);
    assert.equal(aabb.maxX, 20);
    assert.equal(aabb.minZ, -23.6);
    assert.equal(aabb.maxZ, -22.4);
  });

  it('pushes a circle out of a wall on +x', () => {
    const aabb = { minX: -1, maxX: 1, minZ: -1, maxZ: 1, minY: 0, maxY: 4 };
    const r = resolveCircleAabb(1.2, 0, 0.5, aabb);
    assert.ok(r.x >= 1.5 - 1e-9, r.x);
    assert.equal(r.z, 0);
  });

  it('ignores high headers the player can walk under', () => {
    const aabb = { minX: -2, maxX: 2, minZ: -0.5, maxZ: 0.5, minY: 5, maxY: 8 };
    const r = resolveCircleAabb(0, 0, 0.55, aabb);
    assert.equal(r.x, 0);
    assert.equal(r.z, 0);
  });

  it('slide keeps the player outside two walls', () => {
    const walls = [
      wallToAabb({ x: 0, y: 2, z: -5, w: 10, h: 4, d: 1 }),
      wallToAabb({ x: -5, y: 2, z: 0, w: 1, h: 4, d: 10 }),
    ];
    const r = slide(0, -4.6, 0.55, walls);
    assert.ok(r.z > -4.5, r);
  });
});
