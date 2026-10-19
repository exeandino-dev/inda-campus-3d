import * as THREE from 'three';
import { createRegistry } from './core/entities.js';
import { createRenderer, createScene, bindResize } from './scene/scene.js';
import { buildCampus } from './scene/architecture.js';
import { createPostFx } from './scene/postfx.js';
import { createPlayer, installControlSelfTest } from './world/player.js';
import { createTVs, createHolograms } from './world/interactables.js';
import { createNPCs } from './world/npcs.js';
import { createPortals } from './world/portals.js';
import { createUI, createMinimap } from './ui/ui.js';
import { createEditor } from './ui/editor.js';
import { loadCourses } from './data/moodle.js';

async function boot() {
  const campus = await fetch('./campus.json').then((r) => r.json());
  const renderer = createRenderer(document.body);
  const { scene, camera } = createScene();
  const architecture = buildCampus(scene, campus);
  const registry = createRegistry();
  const player = createPlayer(scene, campus);
  createTVs(scene, campus, registry);
  const holograms = createHolograms(scene, campus, registry);
  const npcs = createNPCs(scene, campus, registry);
  const portals = createPortals(scene, campus, registry);
  const fx = createPostFx(renderer, scene, camera);
  bindResize(camera, renderer, fx.composer);

  const ui = createUI(campus, {
    onTeleport(x, y, z) {
      player.teleport(x, y, z);
      ui.close();
    },
  });
  const minimap = createMinimap(campus);
  const editor = createEditor(campus, { player, registry, architecture });

  const catalog = await loadCourses(campus);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && !ui.isOpen()) {
      const near = registry.nearest(player.group.position, 6);
      if (near) {
        player.lock(true);
        ui.interact(near);
      }
    }
    if (e.code === 'KeyM') minimap.toggle();
    if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) editor.toggle();
    if (e.code === 'KeyC' && e.altKey) ui.openCatalog(catalog.courses, catalog.source);
  });

  const modal = document.getElementById('modal-container');
  const unlock = () => player.lock(false);
  modal.querySelector('[data-close]').addEventListener('click', unlock);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') unlock();
  });

  const clock = new THREE.Clock();
  let acc = 0;
  const queued = [];
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();
    player.update(dt, camera, architecture.aabbs);
    holograms.tick(dt, elapsed);
    portals.tick(elapsed);
    npcs.facePlayer(player.group.position);
    const near = registry.nearest(player.group.position, 6);
    ui.setPrompt(near);
    if (minimap.isVisible()) minimap.draw(player.group);
    fx.render();
    acc += dt * 1000;
    while (queued.length && acc >= queued[0].ms) {
      queued.shift().resolve();
    }
  }
  animate();

  installControlSelfTest(player, camera, (ms) =>
    new Promise((resolve) => {
      queued.push({ ms: acc + ms, resolve });
    }),
  );

  console.info(
    `[INDA Campus 3D] ${campus.rooms.length} salas · ${catalog.courses.length} cursos (${catalog.source}) · fx ${fx.enabled ? 'on' : 'off'}`,
  );
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<p style="position:absolute;left:20px;top:80px;color:#f88;z-index:50">Error al cargar el campus: ${err.message}</p>`,
  );
});
