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

function difficultyLabel(value) {
  return ({ easy: 'Fácil', moderate: 'Moderada', hard: 'Difícil' })[value] ?? '—';
}

function routeKindLabel(value) {
  return ({ circular: 'Circular', linear: 'Lineal', out_and_back: 'Ida y vuelta' })[value] ?? '—';
}

function durationLabel(minutes) {
  const total = Number(minutes ?? 0);
  if (!Number.isFinite(total) || total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
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

function summaryPanelHtml(snapshot) {
  const content = snapshot.content ?? {};
  const accessPoints = Array.isArray(snapshot.access_points) ? snapshot.access_points : [];
  const start = accessPoints.find((point) => point.kind === 'start') ?? accessPoints[0];

  return `<section class="route-master-panel" data-route-master-panel="summary">
    <div class="route-master-metrics">
      <div><span>Distancia</span><strong>${esc(content.distance_km ?? '—')} km</strong></div>
      <div><span>Desnivel +</span><strong>${esc(content.elevation_gain_m ?? '—')} m</strong></div>
      <div><span>Desnivel −</span><strong>${esc(content.elevation_loss_m ?? '—')} m</strong></div>
      <div><span>Duración</span><strong>${esc(durationLabel(content.duration_minutes))}</strong></div>
      <div><span>Dificultad</span><strong>${esc(difficultyLabel(content.difficulty))}</strong></div>
      <div><span>Tipo</span><strong>${esc(routeKindLabel(content.route_kind))}</strong></div>
    </div>
    <div class="route-master-summary-grid">
      <article class="route-master-summary-card">
        <span>Punto de inicio</span>
        <strong>${esc(start?.name ?? 'Pendiente')}</strong>
      </article>
      <article class="route-master-summary-card">
        <span>Recompensa</span>
        <strong>${esc(Number(content.reward_xp ?? 0))} XP · ${esc(Number(content.reward_olives ?? 0))} aceitunas</strong>
      </article>
      <article class="route-master-summary-card">
        <span>Track</span>
        <strong>${snapshot.track_source ? `${esc(String(snapshot.track_source.format ?? '').toUpperCase())} · ${esc(snapshot.track_source.source_kind ?? 'sin procedencia')}` : 'Pendiente'}</strong>
      </article>
      <article class="route-master-summary-card">
        <span>Contenido asociado</span>
        <strong>${countBadge(snapshot.discoveries)} descubrimientos · ${countBadge(snapshot.media)} archivos</strong>
      </article>
    </div>
  </section>`;
}

function placeholderPanelHtml(activeTab, snapshot) {
  const tab = ROUTE_MASTER_TABS.find((item) => item.id === activeTab) ?? ROUTE_MASTER_TABS[0];
  const badges = routeMasterTabModels(snapshot);
  const badge = badges.find((item) => item.id === tab.id)?.badge;
  return `<section class="route-master-panel" data-route-master-panel="${esc(tab.id)}"><h3>${esc(tab.label)}</h3><p class="muted">${badge ? `${esc(badge)} · ` : ''}Gestión integrada en la Ficha Maestra.</p></section>`;
}

export function routeMasterShellHtml(snapshot = {}, activeTab = 'summary') {
  const validTab = ROUTE_MASTER_TABS.some((tab) => tab.id === activeTab) ? activeTab : 'summary';
  const tabs = routeMasterTabModels(snapshot);
  const panel = validTab === 'summary'
    ? summaryPanelHtml(snapshot)
    : placeholderPanelHtml(validTab, snapshot);

  return `<section class="route-master card">
    ${routeMasterHeaderHtml(snapshot)}
    <nav class="route-master-tabs" aria-label="Secciones de la ruta">
      ${tabs.map((tab) => `<button type="button" class="route-master-tab${tab.id === validTab ? ' active' : ''}" data-route-master-tab="${esc(tab.id)}" aria-pressed="${tab.id === validTab ? 'true' : 'false'}"><span>${esc(tab.label)}</span>${tab.badge ? `<small>${esc(tab.badge)}</small>` : ''}</button>`).join('')}
    </nav>
    ${panel}
  </section>`;
}

export function routeListRowHtml(route = {}) {
  const municipality = route.municipality_name ?? route.municipality ?? 'Sierra Mágina';
  const version = route.version ?? {};
  const details = [
    Number.isFinite(Number(version.distance_km)) ? `${Number(version.distance_km)} km` : null,
    Number.isFinite(Number(version.elevation_gain_m)) ? `+${Number(version.elevation_gain_m)} m` : null,
    version.difficulty ? difficultyLabel(version.difficulty) : null
  ].filter(Boolean).join(' · ');

  return `<tr class="route-master-list-row">
    <td><strong>${esc(route.title ?? 'Ruta')}</strong><small class="route-friendly-code">${esc(routeDisplayCode(route))}</small></td>
    <td>${esc(municipality)}</td>
    <td><span class="status status-${esc(route.status)}">${esc(statusLabel(route.status))}</span></td>
    <td>${esc(details || '—')}</td>
    <td class="route-row-actions"><button type="button" class="btn primary tiny" data-route-open="${esc(route.slug ?? '')}">Abrir ficha</button></td>
  </tr>`;
}
