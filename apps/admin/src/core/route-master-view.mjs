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

function rewardDiscoveryRows(discoveries) {
  if (!discoveries.length) {
    return '<div class="empty">Esta ruta todavía no tiene descubrimientos con bonificación.</div>';
  }

  return `<div class="route-reward-discoveries">${discoveries.map((discovery) => `
    <article class="route-reward-discovery-card">
      <div><strong>${esc(discovery.name ?? 'Descubrimiento')}</strong><span>${discovery.active === false ? 'Inactivo' : 'Activo'}</span></div>
      <p>${esc(Number(discovery.reward_xp ?? 0))} XP · ${esc(Number(discovery.reward_olives ?? 0))} aceitunas</p>
    </article>`).join('')}</div>`;
}

function rewardsPanelHtml(snapshot = {}) {
  const content = snapshot.content ?? {};
  const discoveries = Array.isArray(snapshot.discoveries) ? snapshot.discoveries : [];
  const activeDiscoveries = discoveries.filter((discovery) => discovery.active !== false);
  const baseXp = Number(content.reward_xp ?? 0);
  const baseOlives = Number(content.reward_olives ?? 0);
  const discoveryXp = activeDiscoveries.reduce((sum, discovery) => sum + Number(discovery.reward_xp ?? 0), 0);
  const discoveryOlives = activeDiscoveries.reduce((sum, discovery) => sum + Number(discovery.reward_olives ?? 0), 0);
  const totalXp = baseXp + discoveryXp;
  const totalOlives = baseOlives + discoveryOlives;

  return `<section class="route-master-panel route-rewards-panel" data-route-master-panel="rewards">
    <div class="route-panel-heading">
      <div>
        <p class="route-panel-kicker">Progreso y economía de aventura</p>
        <h3>Recompensas</h3>
        <p class="muted">La recompensa base se entrega al completar la ruta. Los descubrimientos activos pueden sumar bonificaciones adicionales.</p>
      </div>
      <a class="btn secondary" href="#gamification">Abrir gamificación global</a>
    </div>

    <div class="route-master-summary-grid route-rewards-summary">
      <article class="route-master-summary-card"><span>Recompensa de la ruta</span><strong>${esc(baseXp)} XP · ${esc(baseOlives)} aceitunas</strong></article>
      <article class="route-master-summary-card"><span>Bonus por descubrimientos</span><strong>${esc(discoveryXp)} XP · ${esc(discoveryOlives)} aceitunas</strong></article>
      <article class="route-master-summary-card"><span>Potencial total</span><strong>${esc(totalXp)} XP · ${esc(totalOlives)} aceitunas</strong></article>
    </div>

    <form class="form two route-rewards-form" data-route-rewards-form>
      <div class="field"><label>XP por completar ruta</label><input name="reward_xp" type="number" min="0" value="${esc(baseXp)}" required></div>
      <div class="field"><label>Aceitunas por completar ruta</label><input name="reward_olives" type="number" min="0" value="${esc(baseOlives)}" required></div>
      <p class="muted span-2">Guardar la recompensa base crea una nueva versión del contenido de la ruta para mantener trazabilidad editorial.</p>
      <button type="submit" class="btn primary span-2">Guardar recompensa base</button>
    </form>

    <section class="route-reward-bonus-section">
      <div class="route-panel-heading"><div><h4>Bonificaciones por descubrimientos</h4><p class="muted">Se administran desde la pestaña Descubrimientos y se suman al potencial de la ruta.</p></div></div>
      ${rewardDiscoveryRows(discoveries)}
    </section>
  </section>`;
}

export function routeMasterShellHtml(snapshot = {}, activeTab = 'summary') {
  const html = baseRouteMasterShellHtml(snapshot, activeTab);
  if (activeTab === 'safety') {
    return html.replace(
      /<section class="route-master-panel" data-route-master-panel="safety">[\s\S]*?<\/section>/,
      safetyPanelHtml(snapshot)
    );
  }
  if (activeTab === 'rewards') {
    return html.replace(
      /<section class="route-master-panel" data-route-master-panel="rewards">[\s\S]*?<\/section>/,
      rewardsPanelHtml(snapshot)
    );
  }
  return html;
}
