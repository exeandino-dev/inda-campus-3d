/**
 * Chat de NPCs. Si hay VITE_AGENT_URL (OpenClaw / capa agéntica) se POST-ea;
 * si no, responde con el diálogo local del JSON.
 */
export async function askAgent({ npc, message, campus }) {
  const url = import.meta.env.VITE_AGENT_URL || campus.campus?.agentUrl || '';
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          npcName: npc.title,
          message,
          campus: campus.campus?.name,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      return data.reply || data.text || data.message || JSON.stringify(data);
    } catch (err) {
      return `No pude hablar con el tutor en línea (${err.message}). Mientras tanto: ${npc.talk}`;
    }
  }

  const q = message.toLowerCase();
  const hit = (npc.options || []).find((o) => o.resp && o.text.toLowerCase().includes(q.slice(0, 12)));
  if (hit) return hit.resp;
  if (/moodle|campus|curso/.test(q)) {
    return 'Los cursos viven en campusinda.net. Inscripción en inda.com.ar; el mismo día entra al aula Moodle.';
  }
  if (/mover|wasd|control/.test(q)) {
    return 'WASD o flechas para caminar, arrastrá el mouse para mirar, E para interactuar. A la izquierda hay teleports.';
  }
  return npc.talk;
}
