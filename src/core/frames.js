import * as THREE from 'three';

/** Un solo marco espacial. Three.js y-up, right-handed. Local forward de Object3D = −z. */

export const UP = Object.freeze(new THREE.Vector3(0, 1, 0));
export const LOCAL_FORWARD = Object.freeze(new THREE.Vector3(0, 0, -1));

/**
 * Camera-relative movement basis, read from the camera every frame.
 * right = forward × up  (y-up, right-handed).
 * Check: camera behind player looking −z → fwd=(0,0,-1) → right=(1,0,0).
 */
export function cameraBasis(camera, fwdOut, rightOut) {
  camera.getWorldDirection(fwdOut);
  fwdOut.y = 0;
  if (fwdOut.lengthSq() < 1e-8) fwdOut.set(0, 0, -1);
  else fwdOut.normalize();
  rightOut.crossVectors(fwdOut, UP);
  if (rightOut.lengthSq() < 1e-8) rightOut.set(1, 0, 0);
  else rightOut.normalize();
  return { fwd: fwdOut, right: rightOut };
}

/** Place a third-person camera from the same forward the player faces. */
export function placeFollowCamera(camera, target, fwdWorld, dist, height, lookY) {
  camera.position.copy(target).addScaledVector(fwdWorld, -dist).addScaledVector(UP, height);
  camera.lookAt(target.x, lookY, target.z);
}

/** Yaw so a −z-fronted object faces planar direction d. rotation.y = atan2(-d.x, -d.z). */
export function yawToFace(dx, dz) {
  return Math.atan2(-dx, -dz);
}

/** Planar angle φ=atan2(z,x) → Object3D.rotation.y. Mirror of textbook 2D. */
export function yawFromPlanarAngle(phi) {
  return -phi;
}
