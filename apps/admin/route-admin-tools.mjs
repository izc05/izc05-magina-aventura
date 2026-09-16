import { getSession, rpc, table } from './src/core/api.mjs';
import { canPermanentlyDeleteRoute, confirmRouteDeletionInput } from './src/core/route-editor.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

function statusLabel(status) {
  return ({
    draft: 'Borrador',
    review: 'En revisión',
    published: 'Publicada',
    archived: 'Archivada'
  })[status] ?? status;
}

function difficultyLabel(value) {
  return ({ easy: 'Fácil', moderate: 'Moderada', hard: 'Difícil' })[value] ?? '—';
}

async function currentRoles() {
  const userId = getSession()?.user?.id;
  if (!userId) return [];
  const rows = await table('user_admin_roles', `?select=role_id&user_id=eq.${encodeURIComponent(userId)}`);
  return rows.map((row) => row.role_id);
}

async function loadRouteRows() {
  const [routes, municipalities, versions, roles] = await Promise.all([
    table('routes', '?select=id,title,slug,status,municipality_id,current_content_version,updated_at&order=updated_at.desc'),
    table('municipalities', '?select=id,name'),
    table('route_versions', '?select=route_id,version,distance_km,elevation_gain_m,duration_minutes,difficulty'),
    currentRoles()
  ]);

  const municipalityNames = new Map(municipalities.map((row) => [row.id, row.name]));
  const versionsByRoute = new Map(versions.map((row) => [`${row.route_id}:${row.version}`, row]));

  return {
    roles,
    rows: routes.map((route) => ({
      ...route,
      municipality_name: municipalityNames.get(route.municipality_id) ?? 'Sin municipio',
      version: versionsByRoute.get(`${route.id}:${route.current_content_version}`) ?? null
    }))
  };
}

function rowActions(route, roles) {
  const archive = route.status !== 'archived'
    ? `<button class="btn secondary tiny" data-route-archive="${esc(route.id)}" data-route-title="${esc(route.title)}">Archivar</button>`
    : '';

  const remove = canPermanentlyDeleteRoute(route, roles)
    ? `<button class="btn danger tiny" data-route-delete="${esc(route.id)}" data-route-title="${esc(route.title)}">Eliminar definitivamente</button>`
    : route.status === 'published' && roles.includes('super_admin')
      ? '<span class="muted">Archiva antes de eliminar</span>'
      : '';

  return `<div class="route-row-actions">${archive}${remove}</div>`;
}

function tableHtml(rows, roles) {
  if (!rows.length) return '<div class="card empty">Sin rutas.</div>';

  return `<section class="card route-management-tool">
    <div class="section-heading">
      <div>
        <h2>Rutas existentes</h2>
        <p class="muted">Vista operativa. Los UUID quedan como referencia técnica secundaria.</p>
      </div>
    </div>
    <div class="table-wrap">
      <table class="table route-management-table">
        <thead><tr>
          <th>Ruta</th><th>Municipio</th><th>Distancia</th><th>Desnivel +</th><th>Duración</th><th>Dificultad</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody>${rows.map((route) => {
          const v = route.version;
          return `<tr>
            <td><strong>${esc(route.title)}</strong><small class="route-technical-id">${esc(route.id)}</small></td>
            <td>${esc(route.municipality_name)}</td>
            <td>${v ? `${esc(v.distance_km)} km` : '—'}</td>
            <td>${v ? `${esc(v.elevation_gain_m)} m` : '—'}</td>
            <td>${v ? `${esc(v.duration_minutes)} min` : '—'}</td>
            <td>${esc(difficultyLabel(v?.difficulty))}</td>
            <td><span class="status status-${esc(route.status)}">${esc(statusLabel(route.status))}</span></td>
            <td>${rowActions(route, roles)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </section>`;
}

function flash(text, type = 'success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function bind(rows, roles) {
  const routeById = new Map(rows.map((route) => [route.id, route]));

  document.querySelectorAll('[data-route-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const route = routeById.get(button.dataset.routeArchive);
      if (!route) return;
      if (!confirm(`Archivar “${route.title}”? La ruta dejará de estar disponible como publicada.`)) return;
      try {
        await rpc('admin_set_route_status', { target_route_id: route.id, new_status: 'archived' });
        flash(`Ruta archivada: ${route.title}`);
        location.reload();
      } catch (error) {
        flash(error.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-route-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const route = routeById.get(button.dataset.routeDelete);
      if (!route || !canPermanentlyDeleteRoute(route, roles)) return;

      if (!confirm(`ELIMINACIÓN DEFINITIVA\n\nSe borrará “${route.title}” y sus datos dependientes. Esta acción no se puede deshacer. ¿Continuar?`)) return;
      const typed = prompt(`Segunda confirmación: escribe exactamente el nombre de la ruta:\n\n${route.title}`) ?? '';
      if (!confirmRouteDeletionInput(route.title, typed)) {
        flash('El nombre escrito no coincide. La ruta no se ha eliminado.', 'error');
        return;
      }

      try {
        await rpc('admin_delete_route', { target_route_id: route.id });
        flash(`Ruta eliminada definitivamente: ${route.title}`);
        location.reload();
      } catch (error) {
        flash(error.message, 'error');
      }
    });
  });
}

async function decorate() {
  const main = document.querySelector('.main');
  if (!main || document.querySelector('.login-wrap')) return;
  if ((location.hash || '#dashboard').slice(1) !== 'routes') return;
  if (main.dataset.routeAdminTool) return;
  main.dataset.routeAdminTool = 'loading';

  try {
    const { rows, roles } = await loadRouteRows();
    const genericTable = main.querySelector('.table-wrap');
    if (!genericTable) throw new Error('No se encontró la tabla base de rutas');
    genericTable.insertAdjacentHTML('beforebegin', tableHtml(rows, roles));
    genericTable.remove();
    main.dataset.routeAdminTool = 'ready';
    bind(rows, roles);
  } catch (error) {
    main.dataset.routeAdminTool = 'error';
    flash(`No se pudo cargar la vista avanzada de rutas: ${error.message}`, 'error');
  }
}

new MutationObserver(() => queueMicrotask(decorate)).observe(app, { childList: true, subtree: true });
addEventListener('hashchange', () => queueMicrotask(decorate));
queueMicrotask(decorate);
