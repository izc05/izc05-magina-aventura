export * from './route-master-view-base.mjs';
import { routeMasterShellHtml as baseRouteMasterShellHtml } from './route-master-view-base.mjs';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);
}

function safetyDateLabel(value) {
  if (!value) return 'Sin fecha prevista';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return esc(date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }));
}

function safetySeverityLabel(value) {
  return ({ info: 'Información', warning: 'Precaución', critical: 'Crítica' })[value] ?? String(value ?? 'Información');
}

function safetyStatusLabel(value) {
  return ({ open: 'Activa', resolved: 'Resuelta', cancelled: 'Cancelada' })[value] ?? String(value ?? 'Activa');
}

function safetyCardHtml(incident, index) {
  const open = incident.status === 'open';
  return `<article class="route-safety-card route-safety-${esc(incident.severity ?? 'info')}">
    <div class="route-safety-card-heading">
      <div>
        <span class="status">${esc(safetySeverityLabel(incident.severity))}</span>
        <h4>${esc(incident.title ?? 'Aviso de seguridad')}</h4>
      </div>
      <span class="status">${esc(safetyStatusLabel(incident.status))}</span>
    </div>
    <p>${esc(incident.description ?? '')}</p>
    <div class="route-safety-meta">
      <span>Desde: ${safetyDateLabel(incident.starts_at)}</span>
      <span>Hasta: ${safetyDateLabel(incident.ends_at)}</span>
      <span>${incident.blocks_adventure ? 'Bloquea nuevas aventuras' : 'No bloquea nuevas aventuras'}</span>
    </div>
    ${open ? `<button type="button" class="btn secondary" data-route-safety-resolve="${index}">Marcar como resuelta</button>` : ''}
  </article>`;
}

function safetyPanelHtml(snapshot = {}) {
  const incidents = Array.isArray(snapshot.safety) ? snapshot.safety : [];
  const activeCount = incidents.filter((incident) => incident.status === 'open').length;
  const cards = incidents.length
    ? incidents.map((incident, index) => safetyCardHtml(incident, index)).join('')
    : '<div class="empty route-safety-empty">No hay incidencias de seguridad registradas para esta ruta.</div>';
  const slug = snapshot.route?.slug ?? '';

  return `<section class="route-master-panel route-safety-panel" data-route-master-panel="safety" data-route-safety-slug="${esc(slug)}">
    <div class="route-panel-heading">
      <div>
        <p class="route-panel-kicker">Estado operativo de la ruta</p>
        <h3>Seguridad</h3>
        <p class="muted" data-route-safety-summary>${activeCount} ${activeCount === 1 ? 'incidencia activa' : 'incidencias activas'}. Los cierres pueden impedir que se inicien nuevas aventuras.</p>
      </div>
    </div>

    <form class="form two route-safety-form" data-route-safety-form>
      <div class="field"><label>Título</label><input name="title" value="Ruta temporalmente cerrada" required></div>
      <div class="field"><label>Severidad</label><select name="severity"><option value="info">Información</option><option value="warning">Precaución</option><option value="critical" selected>Crítica</option></select></div>
      <div class="field span-2"><label>Motivo / indicaciones</label><textarea name="description" required></textarea></div>
      <div class="field"><label>Fin previsto</label><input name="ends_at" type="datetime-local"></div>
      <label class="check"><input name="blocks_adventure" type="checkbox" checked> Bloquea nuevas aventuras</label>
      <button type="submit" class="btn danger span-2">Registrar aviso de seguridad</button>
    </form>

    <div class="route-safety-list">${cards}</div>
  </section>`;
}

export function routeMasterShellHtml(snapshot = {}, activeTab = 'summary') {
  const html = baseRouteMasterShellHtml(snapshot, activeTab);
  if (activeTab !== 'safety') return html;
  return html.replace(
    /<section class="route-master-panel" data-route-master-panel="safety">[\s\S]*?<\/section>/,
    safetyPanelHtml(snapshot)
  );
}
