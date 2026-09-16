export const ROUTE_MASTER_TABS = Object.freeze([
  { id: 'summary', label: 'Resumen' },
  { id: 'track', label: 'Track / Mapa' },
  { id: 'content', label: 'Contenido' },
  { id: 'discoveries', label: 'Descubrimientos' },
  { id: 'media', label: 'Multimedia' },
  { id: 'safety', label: 'Seguridad' },
  { id: 'rewards', label: 'Recompensas' },
  { id: 'sources', label: 'Fuentes / Validación' }
]);

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);
}

function statusLabel(status) {
  return ({
    draft: 'Borrador',
    review: 'En revisión',
    published: 'Publicada',
    archived: 'Archivada'
  })[status] ?? status ?? 'Sin estado';
}

export function routeDisplayCode(route = {}) {
  const code = String(route.route_code ?? '').trim();
  if (code) return code;
  const slug = String(route.slug ?? '').trim();
  return slug || 'Ruta sin código';
}

export function routeReadinessPresentation(readiness = {}) {
  const ready = readiness.ready === true;
  return {
    ready,
    label: ready ? 'Lista para publicar' : 'Pendiente de validación',
    tone: ready ? 'success' : 'warning',
    reasons: Array.isArray(readiness.reasons) ? readiness.reasons.filter(Boolean) : []
  };
}

function countBadge(items) {
  return String(Array.isArray(items) ? items.length : 0);
}

export function routeMasterTabModels(snapshot = {}) {
  const checkpoints = Array.isArray(snapshot.checkpoints) ? snapshot.checkpoints.length : 0;
  const badges = {
    summary: '',
    track: `${checkpoints} ${checkpoints === 1 ? 'checkpoint' : 'checkpoints'}`,
    content: snapshot.content ? 'OK' : 'Pendiente',
    discoveries: countBadge(snapshot.discoveries),
    media: countBadge(snapshot.media),
    safety: countBadge(snapshot.safety),
    rewards: snapshot.content ? `${Number(snapshot.content.reward_xp ?? 0)} XP` : '—',
    sources: countBadge(snapshot.sources)
  };

  return ROUTE_MASTER_TABS.map((tab) => ({ ...tab, badge: badges[tab.id] }));
}

export function routeMasterHeaderHtml(snapshot = {}) {
  const route = snapshot.route ?? {};
  const readiness = routeReadinessPresentation(snapshot.readiness);
  const reasons = readiness.reasons.length
    ? `<ul class="route-readiness-reasons">${readiness.reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul>`
    : '';

  return `<header class="route-master-header">
    <div class="route-master-title-block">
      <p class="route-master-eyebrow">${esc(route.municipality ?? 'Sierra Mágina')} · ${esc(routeDisplayCode(route))}</p>
      <h2>${esc(route.title ?? 'Ruta')}</h2>
      <div class="route-master-status-row">
        <span class="status status-${esc(route.status)}">${esc(statusLabel(route.status))}</span>
        <span class="route-readiness route-readiness-${esc(readiness.tone)}">${esc(readiness.label)}</span>
      </div>
    </div>
    <div class="route-readiness-card route-readiness-card-${esc(readiness.tone)}">
      <strong>${esc(readiness.label)}</strong>
      ${reasons}
    </div>
  </header>`;
}
