# INDA Campus 3D

Campus universitario en el navegador: Vite + Three.js, salas definidas en JSON, portales a [campusinda.net](https://campusinda.net/), tutores NPC y post-processing (Bloom + SSAO).

Carpeta local:

```
/Users/macexe/Desktop/APLICACIONES 2026/INDA 2026/INDA-Campus-3D
```

Repo: [exeandino-dev/inda-campus-3d](https://github.com/exeandino-dev/inda-campus-3d)

## Correr en local

```bash
cd "/Users/macexe/Desktop/APLICACIONES 2026/INDA 2026/INDA-Campus-3D"
npm install
npm run dev
```

Abrí `http://localhost:5173`.

| Tecla | Acción |
|---|---|
| WASD / flechas | Caminar (relativo a la cámara) |
| Arrastrar mouse | Mirar |
| E | Interactuar (NPC, TV, holograma, portal) |
| M | Minimapa |
| ? | Editor de posiciones |
| Esc | Cerrar modal |
| Alt+C | Catálogo Moodle |

Query params:

- `?fx=0` sin post-processing
- `?fx=bloom` solo bloom (sin SSAO)
- `?editor=1` abre el editor

`npm test` corre los tests de frames y colisión (sin browser).

## Deploy GitHub Pages

1. Settings → Pages → **Source: GitHub Actions**.
2. Push a `main`. El workflow `.github/workflows/pages.yml` hace `npm ci && npm run build` y publica `dist/`.
3. URL típica: `https://exeandino-dev.github.io/inda-campus-3d/`

`vite.config.js` usa `base: './'` para que también sirva en un subdominio o carpeta.

## Subdominio oficial (después)

Cuando esté estable, apuntá `3d.inda.com.ar` o `campus3d.campusinda.net` al VPS (CloudPanel + SSL) y copiá `dist/`. No hace falta cambiar código.

## Cómo agregar una sala

Todo vive en [`public/campus.json`](public/campus.json). Ejemplo:

```json
{
  "id": "bio",
  "label": "Lab de Cosmetología",
  "icon": "💄",
  "floor": { "x": -35, "z": 50, "w": 24, "d": 20, "type": "library", "repeat": [5, 4] },
  "teleport": [-35, 0, 50],
  "moodle": "https://campusinda.net/course/view.php?id=15127"
}
```

Después:

1. Agregá `walls` (AABB) para esa sala. El mesh y el collider salen **del mismo record**.
2. Opcional: un NPC, un TV, un holograma, un portal.
3. Un curso en `courses[]` con `room: "bio"`.
4. Recargá. El botón de teleport aparece solo.

Modo editor (`?`): caminá, **Dump posiciones**, pegá el JSON en `campus.json`.

## Módulos

```
src/
  core/     frames.js  collision.js  entities.js  physics.js
  scene/    scene.js   architecture.js  textures.js  postfx.js
  world/    player.js  interactables.js  npcs.js  portals.js
  ui/       ui.js      editor.js
  data/     moodle.js  agent.js
public/
  campus.json          ← fuente de verdad
  models/              ← GLB Draco / meshopt
```

## Integraciones

### Moodle / campusinda.net

El catálogo estático en `campus.json` usa IDs reales (`IA desde Cero` = 15047, etc.). El REST de Moodle bloquea CORS en el browser. Para live:

1. Proxy en el VPS (PHP o nginx) que llame `core_course_get_courses`.
2. `VITE_MOODLE_PROXY=https://…/moodle-courses.json` en `.env`.

### Chat de NPCs (OpenClaw / capa agéntica)

`VITE_AGENT_URL` recibe `POST { npcId, npcName, message }` y responde `{ reply }`. Sin URL, el tutor usa el diálogo del JSON.

### GLB reales

Ver [`public/models/README.md`](public/models/README.md).

### Física Rapier / VR / multiplayer

Stubs listos: `src/core/physics.js` (hoy AABB). WebXR y presencia quedan para una iteración posterior.

## Brand

Azul INDA `#0088ee`, cian `#00e5ff`. Sitios: [inda.com.ar](https://www.inda.com.ar) · [inda.edu.uy](https://inda.edu.uy) · [campusinda.net](https://campusinda.net/).
