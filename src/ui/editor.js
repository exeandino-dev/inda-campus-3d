/**
 * Modo editor: ?editor=1 o tecla ?.
 * Dump de posiciones de NPCs / TVs / hologramas / portales para pegar en campus.json.
 */
export function createEditor(campus, { player, registry, architecture }) {
  const panel = document.getElementById('editor-panel');
  const enabled = new URLSearchParams(location.search).has('editor');
  let on = enabled;

  panel.innerHTML = `
    <b>Editor de campus</b>
    <p>Arrastrá el avatar, copiá JSON. Los colliders salen de las mismas walls que se dibujan.</p>
    <label><input type="checkbox" id="ed-col" /> wireframe colliders</label>
    <textarea id="ed-out" readonly></textarea>
    <button class="btn-act" type="button" id="ed-dump">Dump posiciones</button>
    <button class="btn-act" type="button" id="ed-copy">Copiar</button>
  `;

  function dump() {
    const pick = (type) =>
      registry.list()
        .filter((o) => o.userData.type === type)
        .map((o) => ({
          id: o.userData.id,
          title: o.userData.title,
          pos: [Number(o.position.x.toFixed(2)), Number(o.position.y.toFixed(2)), Number(o.position.z.toFixed(2))],
        }));
    const payload = {
      spawn: [
        Number(player.group.position.x.toFixed(2)),
        0,
        Number(player.group.position.z.toFixed(2)),
      ],
      npcs: pick('npc'),
      tvs: pick('tv'),
      holograms: pick('hologram'),
      portals: pick('portal'),
    };
    const ta = document.getElementById('ed-out');
    ta.value = JSON.stringify(payload, null, 2);
    return payload;
  }

  document.getElementById('ed-dump').addEventListener('click', dump);
  document.getElementById('ed-copy').addEventListener('click', async () => {
    dump();
    const ta = document.getElementById('ed-out');
    await navigator.clipboard.writeText(ta.value);
  });
  document.getElementById('ed-col').addEventListener('change', (e) => {
    architecture.toggleColliders(e.target.checked);
  });

  function toggle(v) {
    on = v ?? !on;
    panel.hidden = !on;
    if (on) dump();
    return on;
  }
  panel.hidden = !on;
  if (on) dump();

  return { toggle, dump, isOn: () => on };
}
