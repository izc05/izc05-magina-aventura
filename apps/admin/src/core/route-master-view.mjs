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

function selected(actual, expected) {
  return actual === expected ? ' selected' : '';
}

function dateLabel(value) {
  if (!value) return 'Sin revisar';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-ES');
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

function trackPanelHtml(snapshot) {
  const track = snapshot.track_source ?? null;
  const geometry = snapshot.geometry ?? null;
  const geometryLabel = geometry?.version ? `Geometría v${esc(geometry.version)}` : 'Sin geometría';
  const provenance = track
    ? `${esc(String(track.format ?? '').toUpperCase())} · ${esc(track.original_filename ?? 'archivo sin nombre')} · ${esc(track.source_kind ?? 'sin procedencia')}`
    : 'Todavía no hay procedencia registrada para el track actual.';

  return `<section class="route-master-panel route-track-panel" data-route-master-panel="track">
    <div class="route-track-panel-heading">
      <div>
        <p class="route-panel-kicker">Navegación y geografía</p>
        <h3>Track / Mapa</h3>
        <p class="muted">${geometryLabel} · ${provenance}</p>
      </div>
      <span class="status">${esc(String(snapshot.validation?.track_status ?? 'missing'))}</span>
    </div>

    <form class="form two route-track-import-form" data-route-track-import-form>
      <div class="field"><label>Archivo GPX o KML</label><input name="file" type="file" accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml,application/xml,text/xml" required></div>
      <div class="field"><label>Procedencia</label><select name="source_kind"><option value="official">Oficial</option><option value="field">Trabajo de campo</option><option value="community">Comunidad</option><option value="manual">Manual / cartografía</option></select></div>
      <div class="field span-2"><label>URL de origen</label><input name="source_url" type="url" placeholder="https://…"></div>
      <div class="field span-2"><label>Notas del track</label><textarea name="notes" placeholder="Origen, fecha, autor o comprobaciones realizadas"></textarea></div>
      <button type="submit" class="btn primary span-2">Importar y versionar track</button>
    </form>

    <div class="route-master-track-editor visual-route-workspace empty-workspace" data-route-master-track-editor>Cargando editor visual…</div>
  </section>`;
}

function contentPanelHtml(snapshot) {
  const content = snapshot.content ?? {};
  const sections = content.editorial_sections ?? {};
  const safetyNotes = Array.isArray(content.safety_notes)
    ? content.safety_notes.join('\n')
    : String(content.safety_notes ?? '');
  const seasons = new Set(Array.isArray(content.recommended_seasons) ? content.recommended_seasons : []);
  const version = content.version ?? snapshot.route?.current_content_version ?? '—';
  const seasonCheck = (value) => seasons.has(value) ? ' checked' : '';

  return `<section class="route-master-panel route-content-panel" data-route-master-panel="content">
    <div class="route-panel-heading route-content-heading">
      <div>
        <p class="route-panel-kicker">Ficha editorial versionada</p>
        <h3>Contenido de la ruta</h3>
        <p class="muted">Versión actual ${esc(version)}. Guardar crea una versión nueva; si la ruta estaba publicada, volverá a revisión.</p>
      </div>
      <span class="status">v${esc(version)}</span>
    </div>

    <form class="route-content-form" data-route-content-form>
      <section class="route-content-section">
        <h4>Descripción y seguridad</h4>
        <div class="route-content-grid">
          <div class="field span-2"><label>Descripción</label><textarea name="description" required>${esc(content.description ?? '')}</textarea></div>
          <div class="field span-2"><label>Notas de seguridad <small>Una por línea</small></label><textarea name="safety_notes">${esc(safetyNotes)}</textarea></div>
        </div>
      </section>

      <section class="route-content-section">
        <h4>Datos técnicos</h4>
        <div class="route-content-grid route-content-metrics-grid">
          <div class="field"><label>Distancia (km)</label><input name="distance_km" type="number" step="0.01" min="0.01" value="${esc(content.distance_km ?? '')}" required></div>
          <div class="field"><label>Desnivel + (m)</label><input name="elevation_gain_m" type="number" min="0" value="${esc(content.elevation_gain_m ?? 0)}" required></div>
          <div class="field"><label>Desnivel − (m)</label><input name="elevation_loss_m" type="number" min="0" value="${esc(content.elevation_loss_m ?? 0)}" required></div>
          <div class="field"><label>Altitud mín. (m)</label><input name="elevation_min_m" type="number" value="${esc(content.elevation_min_m ?? '')}"></div>
          <div class="field"><label>Altitud máx. (m)</label><input name="elevation_max_m" type="number" value="${esc(content.elevation_max_m ?? '')}"></div>
          <div class="field"><label>Duración (min)</label><input name="duration_minutes" type="number" min="1" value="${esc(content.duration_minutes ?? '')}" required></div>
          <div class="field"><label>Dificultad</label><select name="difficulty"><option value="easy"${selected(content.difficulty,'easy')}>Fácil</option><option value="moderate"${selected(content.difficulty,'moderate')}>Moderada</option><option value="hard"${selected(content.difficulty,'hard')}>Difícil</option></select></div>
          <div class="field"><label>Tipo de ruta</label><select name="route_kind"><option value="circular"${selected(content.route_kind,'circular')}>Circular</option><option value="linear"${selected(content.route_kind,'linear')}>Lineal</option><option value="out_and_back"${selected(content.route_kind,'out_and_back')}>Ida y vuelta</option></select></div>
        </div>
      </section>

      <section class="route-content-section">
        <h4>Acceso y condiciones</h4>
        <div class="route-content-grid">
          <div class="field"><label>Acceso</label><textarea name="access_notes">${esc(content.access_notes ?? '')}</textarea></div>
          <div class="field"><label>Aparcamiento</label><textarea name="parking_notes">${esc(content.parking_notes ?? '')}</textarea></div>
          <div class="field"><label>Agua</label><textarea name="water_notes">${esc(content.water_notes ?? '')}</textarea></div>
          <div class="field"><label>Sombra</label><textarea name="shade_notes">${esc(content.shade_notes ?? '')}</textarea></div>
          <div class="field span-2"><label>Cobertura móvil</label><textarea name="coverage_notes">${esc(content.coverage_notes ?? '')}</textarea></div>
          <fieldset class="route-season-fieldset span-2"><legend>Época recomendada</legend><div class="route-season-options">
            <label class="check"><input type="checkbox" name="recommended_seasons" value="spring"${seasonCheck('spring')}> Primavera</label>
            <label class="check"><input type="checkbox" name="recommended_seasons" value="summer"${seasonCheck('summer')}> Verano</label>
            <label class="check"><input type="checkbox" name="recommended_seasons" value="autumn"${seasonCheck('autumn')}> Otoño</label>
            <label class="check"><input type="checkbox" name="recommended_seasons" value="winter"${seasonCheck('winter')}> Invierno</label>
          </div></fieldset>
        </div>
      </section>

      <section class="route-content-section">
        <h4>Contenido editorial</h4>
        <div class="route-content-grid route-editorial-grid">
          <div class="field"><label>Patrimonio</label><textarea name="heritage">${esc(sections.heritage ?? '')}</textarea></div>
          <div class="field"><label>Flora</label><textarea name="flora">${esc(sections.flora ?? '')}</textarea></div>
          <div class="field"><label>Fauna</label><textarea name="fauna">${esc(sections.fauna ?? '')}</textarea></div>
          <div class="field"><label>Olivar</label><textarea name="olive_grove">${esc(sections.olive_grove ?? '')}</textarea></div>
          <div class="field"><label>Paisaje</label><textarea name="landscape">${esc(sections.landscape ?? '')}</textarea></div>
          <div class="field"><label>Tradición</label><textarea name="tradition">${esc(sections.tradition ?? '')}</textarea></div>
        </div>
      </section>

      <section class="route-content-section">
        <h4>Recompensas y offline</h4>
        <div class="route-content-grid route-content-reward-grid">
          <div class="field"><label>XP</label><input name="reward_xp" type="number" min="0" value="${esc(content.reward_xp ?? 0)}" required></div>
          <div class="field"><label>Aceitunas</label><input name="reward_olives" type="number" min="0" value="${esc(content.reward_olives ?? 0)}" required></div>
          <label class="check span-2"><input name="offline_available" type="checkbox"${content.offline_available ? ' checked' : ''}> Disponible sin conexión</label>
        </div>
      </section>

      <div class="route-content-actions">
        <p class="muted">Los cambios no sobrescriben el histórico.</p>
        <button type="submit" class="btn primary">Crear nueva versión</button>
      </div>
    </form>
  </section>`;
}

function readinessItem(ok, label, detail = '') {
  return `<li class="route-gate-item ${ok ? 'is-ready' : 'is-pending'}"><span aria-hidden="true">${ok ? '✓' : '!'}</span><div><strong>${esc(label)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div></li>`;
}

function sourceCardHtml(source) {
  return `<article class="route-source-card${source.official ? ' is-official' : ''}">
    <div class="route-source-card-head">
      <div><strong>${esc(source.label ?? 'Fuente')}</strong><small>${source.official ? 'Fuente oficial' : esc(source.source_type ?? 'otra')}</small></div>
      <span>${esc(dateLabel(source.checked_at))}</span>
    </div>
    ${source.url ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>` : ''}
    ${source.notes ? `<p>${esc(source.notes)}</p>` : ''}
  </article>`;
}

function sourcesValidationPanelHtml(snapshot) {
  const readiness = snapshot.readiness ?? {};
  const validation = snapshot.validation ?? {};
  const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];
  const track = snapshot.track_source ?? null;
  const reasons = Array.isArray(readiness.reasons) ? readiness.reasons : [];

  const gateItems = [
    readinessItem(Boolean(readiness.has_content), 'Contenido actual'),
    readinessItem(Boolean(readiness.has_geometry), 'Geometría actual'),
    readinessItem(Boolean(readiness.has_official_source), 'Fuente oficial'),
    readinessItem(Boolean(readiness.track_verified), 'Track verificado'),
    readinessItem(Boolean(readiness.editorial_verified), 'Validación editorial'),
    readinessItem(Boolean(readiness.safety_reviewed), 'Seguridad revisada'),
    readinessItem(Number(readiness.blocking_incidents ?? 0) === 0, 'Sin incidencias bloqueantes', Number(readiness.blocking_incidents ?? 0) ? `${Number(readiness.blocking_incidents)} activas` : '')
  ].join('');

  const sourceCards = sources.length
    ? sources.map(sourceCardHtml).join('')
    : '<div class="empty route-sources-empty">Todavía no hay fuentes registradas.</div>';

  const trackHtml = track
    ? `<div class="route-track-provenance-grid">
        <div><span>Formato</span><strong>${esc(String(track.format ?? '—').toUpperCase())}</strong></div>
        <div><span>Procedencia</span><strong>${esc(track.source_kind ?? '—')}</strong></div>
        <div><span>Archivo</span><strong>${esc(track.original_filename ?? '—')}</strong></div>
        <div><span>Validación</span><strong>${esc(track.validated_at ? `Validado · ${dateLabel(track.validated_at)}` : 'Pendiente')}</strong></div>
      </div>
      ${track.source_url ? `<a class="route-track-source-link" href="${esc(track.source_url)}" target="_blank" rel="noopener noreferrer">Abrir fuente del track ↗</a>` : ''}
      ${track.notes ? `<p class="muted">${esc(track.notes)}</p>` : ''}`
    : '<p class="muted">No hay procedencia de track registrada para la geometría actual.</p>';

  return `<section class="route-master-panel route-sources-panel" data-route-master-panel="sources">
    <div class="route-sources-layout">
      <article class="route-gate-card">
        <div class="route-panel-heading"><div><p class="route-panel-kicker">Control de calidad</p><h3>Gate de publicación</h3></div><span class="route-readiness route-readiness-${readiness.ready ? 'success' : 'warning'}">${readiness.ready ? 'Listo' : 'Pendiente'}</span></div>
        <ul class="route-gate-list">${gateItems}</ul>
        ${reasons.length ? `<div class="route-gate-reasons"><strong>Qué falta</strong><ul>${reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul></div>` : '<p class="success">La ruta cumple todos los requisitos del gate V2.</p>'}
      </article>

      <article class="route-validation-card">
        <div class="route-panel-heading"><div><p class="route-panel-kicker">Estado editorial</p><h3>Validación</h3></div></div>
        <form class="form two" data-route-validation-form>
          <div class="field"><label>Editorial</label><select name="editorial_status"><option value="pending"${selected(validation.editorial_status,'pending')}>Pendiente</option><option value="reviewing"${selected(validation.editorial_status,'reviewing')}>En revisión</option><option value="verified"${selected(validation.editorial_status,'verified')}>Verificado</option></select></div>
          <div class="field"><label>Track</label><select name="track_status"><option value="missing"${selected(validation.track_status,'missing')}>Falta</option><option value="imported"${selected(validation.track_status,'imported')}>Importado</option><option value="verified"${selected(validation.track_status,'verified')}>Verificado</option></select></div>
          <div class="field"><label>Campo</label><select name="field_status"><option value="not_checked"${selected(validation.field_status,'not_checked')}>Sin comprobar</option><option value="planned"${selected(validation.field_status,'planned')}>Planificado</option><option value="verified"${selected(validation.field_status,'verified')}>Verificado</option></select></div>
          <div class="field"><label>Multimedia</label><select name="media_status"><option value="missing"${selected(validation.media_status,'missing')}>Falta</option><option value="partial"${selected(validation.media_status,'partial')}>Parcial</option><option value="ready"${selected(validation.media_status,'ready')}>Lista</option></select></div>
          <div class="field"><label>Seguridad</label><select name="safety_status"><option value="pending"${selected(validation.safety_status,'pending')}>Pendiente</option><option value="reviewed"${selected(validation.safety_status,'reviewed')}>Revisada</option></select></div>
          <div class="field span-2"><label>Notas de validación</label><textarea name="notes" placeholder="Observaciones, verificaciones pendientes y trabajo de campo">${esc(validation.notes ?? '')}</textarea></div>
          <button type="submit" class="btn primary span-2">Guardar validación</button>
        </form>
      </article>
    </div>

    <div class="route-sources-layout route-sources-secondary">
      <article class="route-sources-card">
        <div class="route-panel-heading"><div><p class="route-panel-kicker">Trazabilidad</p><h3>Fuentes</h3></div><span class="status">${esc(sources.length)} registradas</span></div>
        <div class="route-source-list">${sourceCards}</div>
        <form class="form two route-source-form" data-route-source-form>
          <div class="field"><label>Nombre de la fuente</label><input name="label" required maxlength="160" placeholder="Ayuntamiento, IGN, trabajo de campo…"></div>
          <div class="field"><label>Tipo</label><select name="source_type"><option value="official">Oficial</option><option value="map">Mapa</option><option value="track">Track</option><option value="field">Trabajo de campo</option><option value="other">Otra</option></select></div>
          <div class="field span-2"><label>URL</label><input name="url" type="url" required placeholder="https://…"></div>
          <label class="check"><input name="official" type="checkbox"> Marcar como fuente oficial</label>
          <div class="field span-2"><label>Notas</label><textarea name="notes" placeholder="Qué información respalda esta fuente"></textarea></div>
          <button type="submit" class="btn secondary span-2">Añadir fuente</button>
        </form>
      </article>

      <article class="route-track-provenance-card">
        <div class="route-panel-heading"><div><p class="route-panel-kicker">Geometría actual</p><h3>Procedencia del track</h3></div></div>
        ${trackHtml}
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
    : validTab === 'track'
      ? trackPanelHtml(snapshot)
      : validTab === 'content'
        ? contentPanelHtml(snapshot)
        : validTab === 'sources'
          ? sourcesValidationPanelHtml(snapshot)
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