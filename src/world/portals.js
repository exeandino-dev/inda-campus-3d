import * as THREE from 'three';

export function createPortals(scene, campus, registry) {
  const rings = [];

  for (const p of campus.portals || []) {
    const group = new THREE.Group();
    group.position.set(p.pos[0], 1.6, p.pos[2]);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.08, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
    );
    group.add(torus);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0088ee,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      }),
    );
    group.add(disc);

    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 42px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label || p.name, 256, 64);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.85),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }),
    );
    label.position.y = 2.05;
    group.add(label);

    group.userData = {
      type: 'portal',
      title: p.name,
      url: p.url,
      kind: p.kind || 'link',
      id: p.id,
      label: p.label,
    };
    registry.add(group);
    scene.add(group);
    rings.push(torus);
  }

  return {
    tick(elapsed) {
      for (const r of rings) r.rotation.z = elapsed * 0.6;
    },
  };
}
