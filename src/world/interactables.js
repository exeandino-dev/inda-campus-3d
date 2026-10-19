import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

function makeLoader() {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_CDN);
  loader.setDRACOLoader(draco);
  return loader;
}

function tvTexture(tv) {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 512;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, '#04101e');
  grad.addColorStop(1, '#02386e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 36px Segoe UI, sans-serif';
  ctx.fillText(`● ${tv.tag || 'INDA TV'}`, 50, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Segoe UI, sans-serif';
  ctx.fillText(tv.name, 50, 190);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px monospace';
  ctx.fillText(String(tv.url || '').slice(0, 54), 50, 290);
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 28px Segoe UI, sans-serif';
  ctx.fillText('▶  [E]  reproducir  ·  cambiar URL', 50, 420);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTVs(scene, campus, registry) {
  for (const tv of campus.tvs || []) {
    const group = new THREE.Group();
    group.position.set(...tv.pos);
    group.rotation.y = tv.rotY || 0;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(tv.size[0] + 0.35, tv.size[1] + 0.35, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.7, roughness: 0.25 }),
    );
    group.add(frame);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(tv.size[0], tv.size[1]),
      new THREE.MeshBasicMaterial({ map: tvTexture(tv) }),
    );
    screen.position.z = 0.1;
    group.add(screen);

    group.userData = { type: 'tv', title: tv.name, url: tv.url, id: tv.id };
    registry.add(group);
    scene.add(group);
  }
}

function holoMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x0055aa,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
}

function proceduralHolo(kind, mat) {
  if (kind === 'quantum') {
    const mesh = new THREE.Group();
    mesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), mat));
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 16, 64), mat);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.05, 16, 64), mat);
    r2.rotation.x = Math.PI / 2;
    mesh.add(r1, r2);
    return mesh;
  }
  if (kind === 'neural') return new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), mat);
  if (kind === 'blockchain') {
    const mesh = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
      b.position.x = i * 1.25;
      mesh.add(b);
    }
    return mesh;
  }
  return new THREE.Mesh(new THREE.TorusKnotGeometry(1.0, 0.35, 80, 16), mat);
}

export function createHolograms(scene, campus, registry) {
  const spinning = [];
  const loader = makeLoader();

  for (const h of campus.holograms || []) {
    const group = new THREE.Group();
    group.position.set(...h.pos);

    const y = h.pos[1];
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x111923, metalness: 0.8, roughness: 0.2 }),
    );
    base.position.y = -y + 0.3;
    group.add(base);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 0.4, y, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x0088ee, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    );
    beam.position.y = -y / 2 + 0.4;
    group.add(beam);

    const mat = holoMaterial();
    const mesh = proceduralHolo(h.kind, mat);
    group.add(mesh);
    spinning.push(mesh);

    if (h.glb) {
      loader.load(
        h.glb.startsWith('http') ? h.glb : `./models/${h.glb.replace(/^\/?models\/?/, '')}`,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3()).length() || 1;
          model.scale.setScalar(2.2 / size);
          const c = box.getCenter(new THREE.Vector3());
          model.position.sub(c.multiplyScalar(model.scale.x));
          mesh.visible = false;
          group.add(model);
          spinning.push(model);
          group.userData.glbRoot = model;
        },
        undefined,
        (err) => console.warn('[INDA 3D] GLB no cargó', h.glb, err),
      );
    }

    group.userData = { type: 'hologram', title: h.title, mesh, id: h.id, kind: h.kind, glb: h.glb || '' };
    registry.add(group);
    scene.add(group);
  }

  return {
    tick(dt, elapsed) {
      for (const holo of spinning) {
        holo.rotation.y += 0.8 * dt;
        holo.rotation.x = Math.sin(elapsed * 1.5) * 0.12;
      }
    },
  };
}
