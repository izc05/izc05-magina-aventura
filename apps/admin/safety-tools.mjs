import { insert, rpc, table } from './src/core/api.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function show(text, type = 'success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function safetyDateLabel(value) {
  if (!value) return 'Sin fecha prevista';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? esc(value)
    : esc(date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }));
}

function safetySeverityLabel(value) {
  return ({ info: 'Información', warning: 'Precaución', critical: 'Crítica' })[value] ?? String(value ?? 'Información');
}

function safetyStatusLabel(value) {
  return ({ open: 'Activa', resolved: 'Resuelta', cancelled: 'Cancelada' })[value] ?? String(value ?? 'Activa');
}

function routeSafetyCardHtml(incident, index) {
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

async function routeBySlug(slug) {
  const rows = await table('routes', `?select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] ?? null;
}

function renderRouteSafetyList(panel, route, snapshot) {
  const incidents = Array.isArray(snapshot.safety) ? snapshot.safety : [];
  const list = panel.querySelector('.route-safety-list');
  const summary = panel.querySelector('[data-route-safety-summary]');
  const activeCount = incidents.filter((incident) => incident.status === 'open').length;

  if (summary) {
    summary.textContent = `${activeCount} ${activeCount === 1 ? 'incidencia activa' : 'incidencias activas'}. Los cierres pueden impedir que se inicien nuevas aventuras.`;
  }

  if (list) {
    list.innerHTML = incidents.length
      ? incidents.map((incident, index) => routeSafetyCardHtml(incident, index)).join('')
      : '<div class="empty route-safety-empty">No hay incidencias de seguridad registradas para esta ruta.</div>';
  }

  panel.querySelectorAll('[data-route-safety-resolve]').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.routeSafetyResolve);
      const incident = snapshot.safety?.[index];
      if (!Number.isInteger(index) || !incident?.id || incident.status !== 'open') {
        show('No se pudo identificar la incidencia seleccionada.', 'error');
        return;
      }

      button.disabled = true;
      try {
        await rpc('admin_resolve_safety', { incident_id: incident.id });
        show('Incidencia resuelta. La disponibilidad de la ruta se ha recalculado.');
        await refreshRouteMasterSafety(panel, route);
      } catch (error) {
        show(error.message, 'error');
        button.disabled = false;
      }
    });
  });
}

async function refreshRouteMasterSafety(panel, route) {
  const snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
  renderRouteSafetyList(panel, route, snapshot);
  return snapshot;
}

async function bindRouteMasterSafety() {
  const panel = document.querySelector('[data-route-master-panel="safety"][data-route-safety-slug]');
  if (!panel || panel.dataset.safetyBound) return;
  panel.dataset.safetyBound = 'loading';

  try {
    const slug = panel.dataset.routeSafetySlug;
    const route = await routeBySlug(slug);
    if (!route?.id) throw new Error('No se pudo identificar la ruta abierta');

    let snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
    renderRouteSafetyList(panel, route, snapshot);

    const form = panel.querySelector('[data-route-safety-form]');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      form.querySelectorAll('button,input,select,textarea').forEach((control) => { control.disabled = true; });

      try {
        await insert('route_safety_incidents', {
          route_id: route.id,
          title: String(data.title ?? '').trim(),
          description: String(data.description ?? '').trim(),
          severity: String(data.severity ?? 'warning'),
          status: 'open',
          blocks_adventure: data.blocks_adventure === 'on',
          starts_at: new Date().toISOString(),
          ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null
        });
        show('Aviso de seguridad registrado para esta ruta.');
        form.reset();
        snapshot = await refreshRouteMasterSafety(panel, route);
      } catch (error) {
        show(error.message, 'error');
      } finally {
        form.querySelectorAll('button,input,select,textarea').forEach((control) => { control.disabled = false; });
      }
    });

    panel.dataset.safetyBound = 'true';
  } catch (error) {
    panel.dataset.safetyBound = '';
    show(`No se pudo activar la gestión de seguridad de la ruta: ${error.message}`, 'error');
  }
}

function shell() {
  return `<section class="card safety-gate-tool"><h2>Cierre temporal de ruta</h2><p class="muted">Bloquea el inicio de nuevas aventuras sin archivar la ruta. Al resolver la incidencia, la ruta vuelve a quedar disponible automáticamente.</p><form id="route-closure-create" class="form two"><div class="field"><label>Ruta UUID</label><input name="route_id" required></div><div class="field"><label>Título</label><input name="title" value="Ruta temporalmente cerrada" required></div><div class="field"><label>Severidad</label><select name="severity"><option value="warning">warning</option><option value="critical" selected>critical</option></select></div><div class="field"><label>Fin previsto (opcional)</label><input name="ends_at" type="datetime-local"></div><div class="field span-2"><label>Motivo / indicaciones</label><textarea name="description" required></textarea></div><button class="btn danger span-2">Bloquear inicio de aventuras</button></form><div id="active-route-closures"></div></section>`;
}

async function load() {
  const target = document.querySelector('#active-route-closures');
  if (!target) return;
  try {
    const rows = await table('route_safety_incidents', '?select=id,route_id,title,severity,starts_at,ends_at&status=eq.open&blocks_adventure=eq.true&order=starts_at.desc&limit=100');
    target.innerHTML = rows.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>Ruta</th><th>Incidencia</th><th>Severidad</th><th>Desde</th><th>Hasta</th><th></th></tr></thead><tbody>${rows.map((row) => `<tr><td class="code">${esc(row.route_id)}</td><td>${esc(row.title)}</td><td>${esc(row.severity)}</td><td>${esc(row.starts_at)}</td><td>${esc(row.ends_at || 'Sin fecha')}</td><td><button class="btn tiny secondary" data-reopen="${esc(row.id)}">Reabrir ruta</button></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="muted">No hay cierres temporales activos.</p>';
    target.querySelectorAll('[data-reopen]').forEach((button) => button.addEventListener('click', async () => {
      try {
        await rpc('admin_resolve_safety', { incident_id: button.dataset.reopen });
        show('Ruta reabierta: incidencia resuelta');
        await load();
      } catch (error) {
        show(error.message, 'error');
      }
    }));
  } catch (error) {
    target.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  }
}

function bind() {
  const form = document.querySelector('#route-closure-create');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await insert('route_safety_incidents', {
        route_id: data.route_id.trim(),
        title: data.title.trim(),
        description: data.description.trim(),
        severity: data.severity,
        status: 'open',
        blocks_adventure: true,
        starts_at: new Date().toISOString(),
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null
      });
      show('Ruta cerrada temporalmente para nuevas aventuras');
      form.reset();
      await load();
    } catch (error) {
      show(error.message, 'error');
    }
  });
}

async function decorate() {
  const main = document.querySelector('.main');
  if (!main || document.querySelector('.login-wrap')) return;
  const section = (location.hash || '#dashboard').slice(1);

  if (section === 'routes') {
    await bindRouteMasterSafety();
    return;
  }

  if (section !== 'safety' || main.dataset.safetyGate === 'true') return;
  main.dataset.safetyGate = 'true';
  main.insertAdjacentHTML('beforeend', shell());
  bind();
  await load();
}

new MutationObserver(() => queueMicrotask(decorate)).observe(app, { childList: true, subtree: true });
addEventListener('hashchange', () => queueMicrotask(decorate));
queueMicrotask(decorate);
