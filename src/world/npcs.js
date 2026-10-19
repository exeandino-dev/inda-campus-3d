import * as THREE from 'three';
import { yawToFace } from '../core/frames.js';

export function createNPCs(scene, campus, registry) {
  const list = [];

  for (const npc of campus.npcs || []) {
    const group = new THREE.Group();
    group.position.set(...npc.pos);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 1.1, 8, 16),
      new THREE.MeshStandardMaterial({ color: npc.color, metalness: 0.4, roughness: 0.3 }),
    );
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    visor.position.set(0, 1.5, -0.32);
    visor.name = 'npcVisor';
    group.add(visor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.05, 32),
      new THREE.MeshBasicMaterial({ color: npc.color, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    group.userData = {
      type: 'npc',
      title: npc.name,
      talk: npc.talk,
      options: npc.options || [],
      agent: Boolean(npc.agent),
      id: npc.id,
    };
    registry.add(group);
    scene.add(group);
    list.push(group);
  }

  return {
    list,
    facePlayer(playerPos) {
      for (const npc of list) {
        npc.rotation.y = yawToFace(playerPos.x - npc.position.x, playerPos.z - npc.position.z);
      }
    },
  };
}
