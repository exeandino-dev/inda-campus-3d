import * as THREE from 'three';
import { createTileTexture } from './textures.js';
import { wallToAabb } from '../core/collision.js';

const MATS = {
  interior: () => new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }),
  exterior: () => new THREE.MeshStandardMaterial({ color: 0x0f1722, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.1 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0x0088ee, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide }),
  led: () => new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
  ledBlue: () => new THREE.MeshBasicMaterial({ color: 0x0088ee }),
};

function box(def, mat, scene, shadows = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), mat);
  mesh.position.set(def.x, def.y, def.z);
  if (shadows) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  scene.add(mesh);
  return mesh;
}

function buildLogo(scene, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x0088ee });
  const top = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 16, 48, Math.PI * 0.8), arcMat);
  top.rotation.z = Math.PI * 0.1;
  const btm = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 16, 48, Math.PI * 0.8), arcMat);
  btm.rotation.z = Math.PI * 1.1;
  group.add(top, btm);

  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#2c353d';
  ctx.font = '900 135px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('INDA', 256, 130);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }),
  );
  plane.position.z = 0.1;
  group.add(plane);
  scene.add(group);
}

export function buildCampus(scene, campus) {
  const aabbs = [];
  const debugGroup = new THREE.Group();
  debugGroup.visible = false;

  for (const room of campus.rooms) {
    const f = room.floor;
    const tex = createTileTexture(f.type);
    tex.repeat.set(f.repeat?.[0] ?? 6, f.repeat?.[1] ?? 6);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: f.type === 'hall' ? 0.15 : 0.4,
      metalness: f.type === 'hall' ? 0.6 : 0.3,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(f.x, 0.01, f.z);
    mesh.receiveShadow = true;
    const n = new THREE.Vector3();
    mesh.updateMatrixWorld(true);
    mesh.geometry.computeVertexNormals();
    n.fromBufferAttribute(mesh.geometry.attributes.normal, 0);
    n.applyEuler(mesh.rotation);
    if (n.y < 0) mesh.geometry.scale(1, -1, 1);
    scene.add(mesh);
  }

  const outdoor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x090e15, roughness: 0.9 }),
  );
  outdoor.rotation.x = -Math.PI / 2;
  outdoor.receiveShadow = true;
  scene.add(outdoor);

  const cache = {};
  const mat = (k) => (cache[k] ??= MATS[k] ? MATS[k]() : MATS.interior());

  for (const w of campus.walls) {
    box(w, mat(w.mat || 'interior'), scene);
    aabbs.push(wallToAabb(w));
    const helper = new THREE.Mesh(
      new THREE.BoxGeometry(w.w, w.h, w.d),
      new THREE.MeshBasicMaterial({ color: 0xff2d6a, wireframe: true, transparent: true, opacity: 0.45 }),
    );
    helper.position.set(w.x, w.y, w.z);
    debugGroup.add(helper);
  }

  const d = campus.decor || {};
  if (d.glassEntrance) box(d.glassEntrance, mat('glass'), scene, false);
  if (d.glassWest) box(d.glassWest, mat('glass'), scene, false);
  if (d.glassEast) box(d.glassEast, mat('glass'), scene, false);
  if (d.archWest) box(d.archWest, mat('interior'), scene);
  if (d.archEast) box(d.archEast, mat('interior'), scene);
  if (d.headerW) box(d.headerW, mat('interior'), scene);
  if (d.headerE) box(d.headerE, mat('interior'), scene);
  if (d.balcony) box(d.balcony, mat('white'), scene);
  if (d.rail) box(d.rail, mat('glass'), scene, false);
  if (d.hallRoof) box(d.hallRoof, mat('interior'), scene);
  if (d.wingRoofW) box(d.wingRoofW, mat('interior'), scene);
  if (d.wingRoofE) box(d.wingRoofE, mat('interior'), scene);

  const led = mat('led');
  box({ x: -18.4, y: 0.08, z: 4, w: 0.2, h: 0.15, d: 52 }, led, scene, false);
  box({ x: 18.4, y: 0.08, z: 4, w: 0.2, h: 0.15, d: 52 }, led, scene, false);
  box({ x: 0, y: 0.08, z: -22.3, w: 38, h: 0.15, d: 0.2 }, mat('ledBlue'), scene, false);

  buildLogo(scene, 0, 11.2, -22.3);
  scene.add(debugGroup);

  return {
    aabbs,
    debugGroup,
    toggleColliders(on) {
      debugGroup.visible = on;
    },
  };
}
