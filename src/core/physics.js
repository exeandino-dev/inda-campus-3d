/**
 * Capa de física. Hoy: AABB 2D (collision.js) derivado de las mismas walls.
 * Rapier (@dimforge/rapier3d-compat) entra acá sin tocar player.js:
 * createPhysicsWorld(campus) → { step(dt), moveCapsule(pos, wish) }.
 */
export { slide as moveCapsule } from './collision.js';
