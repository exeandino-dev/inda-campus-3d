/**
 * Catálogo Moodle. El REST de campusinda.net suele bloquear CORS en el browser;
 * si hay VITE_MOODLE_PROXY se intenta fetch, si no se usa campus.json.
 */
export async function loadCourses(campus) {
  const proxy = import.meta.env.VITE_MOODLE_PROXY;
  const fallback = campus.courses || [];
  if (!proxy) return { source: 'campus.json', courses: fallback };

  try {
    const res = await fetch(proxy, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const courses = Array.isArray(data) ? data : data.courses || [];
    if (!courses.length) throw new Error('empty');
    return { source: 'moodle', courses };
  } catch (err) {
    console.info('[INDA 3D] Moodle API no disponible, catálogo estático.', err);
    return { source: 'campus.json', courses: fallback };
  }
}

export function courseUrl(course) {
  if (course.url) return course.url;
  const base = 'https://campusinda.net/course/view.php?id=';
  return base + course.id;
}
