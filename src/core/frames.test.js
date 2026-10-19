import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { yawToFace, yawFromPlanarAngle, LOCAL_FORWARD } from './frames.js';

function localMinusZ(yaw) {
  const o = new THREE.Object3D();
  o.rotation.y = yaw;
  o.updateMatrixWorld();
  return LOCAL_FORWARD.clone().applyQuaternion(o.quaternion);
}

describe('frames', () => {
  it('−z-front faces world −z at yaw 0', () => {
    const y = yawToFace(0, -1);
    assert.ok(Math.abs(y) < 1e-12, y);
    const f = localMinusZ(y);
    assert.ok(Math.abs(f.x) < 1e-8 && Math.abs(f.z + 1) < 1e-8, f);
  });
  it('faces world +x: rotation.y = −π/2 (Object3D, −z front)', () => {
    const y = yawToFace(1, 0);
    assert.ok(Math.abs(y + Math.PI / 2) < 1e-9, y);
    const f = localMinusZ(y);
    assert.ok(f.x > 0.99 && Math.abs(f.z) < 1e-8, f);
  });
  it('planar angle round-trip helper is negation', () => {
    assert.equal(yawFromPlanarAngle(0.4), -0.4);
  });
});
