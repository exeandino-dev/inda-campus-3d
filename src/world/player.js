import * as THREE from 'three';
import { LOCAL_FORWARD, cameraBasis, placeFollowCamera, yawToFace } from '../core/frames.js';
import { slide } from '../core/collision.js';

/**
 * Third-person player. Yaw lives on player.rotation.y.
 * Camera is placed from the same local −z, then WASD is read from the camera.
 */
export function createPlayer(scene, campus) {
  const cfg = campus.player;
  const spawn = campus.spawn;
  const group = new THREE.Group();
  group.position.set(spawn[0], spawn[1], spawn[2]);
  scene.add(group);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.2, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x2c353d, metalness: 0.5, roughness: 0.2 }),
  );
  body.position.y = 1.05;
  body.castShadow = true;
  group.add(body);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.16, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
  );
  visor.position.set(0, 1.52, -0.32);
  visor.name = 'playerVisor';
  group.add(visor);

  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.25),
    new THREE.MeshBasicMaterial({ color: 0x0088ee }),
  );
  backpack.position.set(0, 1.1, 0.4);
  group.add(backpack);

  const keys = Object.create(null);
  let pitch = 0.28;
  let dragging = false;
  let locked = false;

  const fwdWorld = new THREE.Vector3();
  const camFwd = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const wish = new THREE.Vector3();

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#modal-container, #nav-teleport, #editor-panel, a, button, input, textarea')) return;
    dragging = true;
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging || locked) return;
    group.rotation.y -= e.movementX * 0.0045;
    pitch = Math.max(0.08, Math.min(1.15, pitch + e.movementY * 0.0045));
  });

  function facing() {
    return LOCAL_FORWARD.clone().applyQuaternion(group.quaternion);
  }

  function placeCamera(camera) {
    fwdWorld.copy(LOCAL_FORWARD).applyQuaternion(group.quaternion);
    const dist = cfg.camDist * Math.cos(pitch);
    const height = cfg.camHeight + cfg.camDist * Math.sin(pitch);
    placeFollowCamera(camera, group.position, fwdWorld, dist, height, group.position.y + cfg.eye);
    camera.updateMatrixWorld(true);
  }

  function update(dt, camera, aabbs) {
    placeCamera(camera);
    if (locked) return;

    cameraBasis(camera, camFwd, camRight);
    let fx = 0;
    let sx = 0;
    if (keys.KeyW || keys.ArrowUp) fx += 1;
    if (keys.KeyS || keys.ArrowDown) fx -= 1;
    if (keys.KeyD || keys.ArrowRight) sx += 1;
    if (keys.KeyA || keys.ArrowLeft) sx -= 1;

    wish.set(0, 0, 0);
    if (fx || sx) {
      wish.addScaledVector(camFwd, fx).addScaledVector(camRight, sx);
      if (wish.lengthSq() > 1e-8) {
        wish.normalize().multiplyScalar(cfg.speed * dt);
        const nx = group.position.x + wish.x;
        const nz = group.position.z + wish.z;
        const hit = slide(nx, nz, cfg.radius, aabbs);
        const b = campus.bounds;
        group.position.x = Math.max(b.minX, Math.min(b.maxX, hit.x));
        group.position.z = Math.max(b.minZ, Math.min(b.maxZ, hit.z));
        group.position.y = 0;
      }
    }
  }

  function teleport(x, y, z) {
    group.position.set(x, y ?? 0, z);
  }

  function lookAtXZ(x, z) {
    group.rotation.y = yawToFace(x - group.position.x, z - group.position.z);
  }

  return {
    group,
    keys,
    facing,
    placeCamera,
    update,
    teleport,
    lookAtXZ,
    lock(v) {
      locked = v;
    },
    isLocked: () => locked,
  };
}

export function installControlSelfTest(player, camera, step) {
  window.__selfTestControls = async function selfTestControls() {
    const UP = new THREE.Vector3(0, 1, 0);
    const V = THREE.Vector3;
    const basis = () => {
      const f = new V();
      camera.getWorldDirection(f);
      f.y = 0;
      f.normalize();
      return { f, r: new V().crossVectors(f, UP) };
    };
    const press = async (code, ms) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code }));
      await step(ms);
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    };
    const visor = player.group.getObjectByName('playerVisor');
    const modelFront = () => {
      const p = new V();
      visor.getWorldPosition(p);
      p.sub(player.group.position).setY(0).normalize();
      return p;
    };
    const results = [];
    for (const [code, axis, sign] of [
      ['KeyD', 'r', +1],
      ['KeyA', 'r', -1],
      ['KeyW', 'f', +1],
      ['KeyS', 'f', -1],
    ]) {
      const b = basis();
      const p0 = player.group.position.clone();
      await press(code, 400);
      const d = player.group.position.clone().sub(p0);
      d.y = 0;
      if (d.length() < 0.05) {
        results.push(`${code}: no move`);
        continue;
      }
      const along = d.clone().normalize().dot(b[axis]) * sign;
      results.push(`${code}: along=${along.toFixed(2)}`);
      console.assert(along > 0.7, `${code}: moved the wrong way (cos=${along.toFixed(2)})`);
      console.assert(modelFront().dot(player.facing()) > 0.7, `${code}: visor off heading`);
    }
    console.info('[INDA 3D] control self-test', results);
    return results;
  };
}
