import { courseUrl } from '../data/moodle.js';
import { askAgent } from '../data/agent.js';

export function createUI(campus, { onTeleport }) {
  const nav = document.getElementById('nav-teleport');
  const prompt = document.getElementById('prompt-interaction');
  const modal = document.getElementById('modal-container');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const actionsEl = document.getElementById('modal-actions');
  const closeBtn = modal.querySelector('[data-close]');

  nav.innerHTML = '';
  for (const room of campus.rooms) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.type = 'button';
    btn.textContent = `${room.icon || ''} ${room.label}`.trim();
    btn.addEventListener('click', () => onTeleport(...room.teleport));
    nav.appendChild(btn);
  }

  function close() {
    modal.hidden = true;
    bodyEl.innerHTML = '';
    actionsEl.innerHTML = '';
  }

  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') close();
  });

  function action(label, fn) {
    const btn = document.createElement('button');
    btn.className = 'btn-act';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', fn);
    actionsEl.appendChild(btn);
    return btn;
  }

  function openLink(url) {
    window.open(url, '_blank', 'noopener');
  }

  function courseListHtml(courses) {
    if (!courses?.length) return '';
    const items = courses
      .map((c) => `<li><a href="${courseUrl(c)}" target="_blank" rel="noopener">${c.title}</a></li>`)
      .join('');
    return `<p><b>Cursos campusinda.net</b></p><ul>${items}</ul>`;
  }

  async function openNpc(data) {
    titleEl.textContent = data.title;
    bodyEl.innerHTML = `<p>${data.talk}</p><div class="chat-log" id="chat-log"></div>`;
    if (data.agent) {
      bodyEl.insertAdjacentHTML(
        'beforeend',
        `<div class="chat-input"><input id="chat-q" placeholder="Preguntale al tutor…" /><button class="btn-act" type="button" id="chat-send">Enviar</button></div>`,
      );
      const send = async () => {
        const input = document.getElementById('chat-q');
        const log = document.getElementById('chat-log');
        const msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        log.insertAdjacentHTML('beforeend', `<p><b>Vos:</b> ${msg}</p>`);
        const reply = await askAgent({ npc: data, message: msg, campus });
        log.insertAdjacentHTML('beforeend', `<p><b>${data.title}:</b> ${reply}</p>`);
        log.scrollTop = log.scrollHeight;
      };
      document.getElementById('chat-send').addEventListener('click', send);
      document.getElementById('chat-q').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') send();
      });
    }
    for (const opt of data.options || []) {
      action(opt.text, () => {
        if (opt.url) openLink(opt.url);
        else if (opt.resp) bodyEl.querySelector('p').textContent = opt.resp;
      });
    }
    modal.hidden = false;
  }

  function openTv(data) {
    titleEl.textContent = data.title;
    bodyEl.innerHTML = `<p><b>Señal activa:</b> <code>${data.url}</code></p>`;
    action('▶ Reproducir', () => {
      const src = data.url.includes('?') ? `${data.url}&autoplay=1` : `${data.url}?autoplay=1`;
      bodyEl.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    });
    action('🔗 Cambiar URL', () => {
      const next = window.prompt('URL embebida de YouTube / streaming:', data.url);
      if (next) {
        data.url = next;
        bodyEl.innerHTML = `<p>Enlace actualizado a <code>${next}</code></p>`;
      }
    });
    modal.hidden = false;
  }

  function openHologram(data) {
    titleEl.textContent = data.title;
    bodyEl.innerHTML = `
      <p>Inspección de modelo 3D / CAD. Compatible con GLB Draco o meshopt exportados de Blender, SketchUp o Unreal.</p>
      <p>${data.glb ? `Modelo: <code>${data.glb}</code>` : 'Sin GLB: geometría procedural. Poné <code>holograms[].glb</code> en campus.json y el archivo en <code>public/models/</code>.'}</p>
    `;
    action('🌐 Estructura / sólido', () => {
      const root = data.glbRoot || data.mesh;
      root?.traverse((c) => {
        if (c.isMesh && c.material) c.material.wireframe = !c.material.wireframe;
      });
    });
    modal.hidden = false;
  }

  function openPortal(data) {
    titleEl.textContent = data.title;
    if (data.kind === 'iframe') {
      bodyEl.innerHTML = `<p>${data.label || ''}</p><iframe src="${data.url}" allowfullscreen></iframe>`;
      action('Abrir en pestaña', () => openLink(data.url));
    } else {
      bodyEl.innerHTML = `<p>Portal a <code>${data.url}</code></p>`;
      action(data.label || 'Entrar', () => openLink(data.url));
    }
    modal.hidden = false;
  }

  function openCatalog(courses, source) {
    titleEl.textContent = 'Catálogo Moodle';
    bodyEl.innerHTML = `<p>Fuente: <code>${source}</code></p>${courseListHtml(courses)}`;
    action('Abrir campusinda.net', () => openLink(campus.campus.moodle));
    modal.hidden = false;
  }

  function interact(obj) {
    const data = obj.userData;
    actionsEl.innerHTML = '';
    if (data.type === 'npc') return openNpc(data);
    if (data.type === 'tv') return openTv(data);
    if (data.type === 'hologram') return openHologram(data);
    if (data.type === 'portal') return openPortal(data);
  }

  function setPrompt(obj) {
    if (!obj) {
      prompt.style.display = 'none';
      return;
    }
    prompt.style.display = 'block';
    prompt.textContent = `Presioná [E] · ${obj.userData.title}`;
  }

  return {
    close,
    interact,
    setPrompt,
    openCatalog,
    isOpen: () => !modal.hidden,
  };
}

export function createMinimap(campus) {
  const wrap = document.getElementById('minimap');
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 280;
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const b = campus.bounds;
  const sx = canvas.width / (b.maxX - b.minX);
  const sz = canvas.height / (b.maxZ - b.minZ);
  const toX = (x) => (x - b.minX) * sx;
  const toY = (z) => (z - b.minZ) * sz;

  function draw(player) {
    ctx.fillStyle = '#081016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const room of campus.rooms) {
      const f = room.floor;
      ctx.fillStyle = 'rgba(0,136,238,0.22)';
      ctx.fillRect(toX(f.x - f.w / 2), toY(f.z - f.d / 2), f.w * sx, f.d * sz);
      ctx.fillStyle = '#9fe';
      ctx.font = '11px sans-serif';
      ctx.fillText(room.icon || room.id, toX(f.x) - 8, toY(f.z));
    }
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(toX(player.position.x), toY(player.position.z), 5, 0, Math.PI * 2);
    ctx.fill();
  }

  let visible = false;
  function toggle(on) {
    visible = on ?? !visible;
    wrap.hidden = !visible;
    return visible;
  }
  wrap.hidden = true;

  return { draw, toggle, isVisible: () => visible };
}
