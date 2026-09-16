import { getSession, patch, rpc, table } from './src/core/api.mjs';
import { canPermanentlyDeleteRoute, confirmRouteDeletionInput } from './src/core/route-editor.mjs';
import { routeListRowHtml, routeMasterShellHtml } from './src/core/route-master-view.mjs';
import { parseTrackText, sha256Hex } from './src/core/track-import.mjs';
import { mountRouteEditor } from './visual-tools.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

async function currentRoles() {
  const userId = getSession()?.user?.id;
  if (!userId) return [];
  const rows = await table('user_admin_roles', `?select=role_id&user_id=eq.${encodeURIComponent(userId)}`);
  return rows.map((row) => row.role_id);
}

async function loadRouteRows() {
  const [routes, municipalities, versions, roles] = await Promise.all([
    table('routes', '?select=id,route_code,title,slug,status,municipality_id,current_content_version,updated_at&order=updated_at.desc'),
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
    ? `<button class="btn secondary tiny" data-route-archive="${esc(route.slug)}">Archivar</button>`
    : '';

  const remove = canPermanentlyDeleteRoute(route, roles)
    ? `<button class="btn danger tiny" data-route-delete="${esc(route.slug)}">Eliminar definitivamente</button>`
    : route.status === 'published' && roles.includes('super_admin')
      ? '<span class="muted">Archiva antes de eliminar</span>'
      : '';

  return `${archive}${remove}`;
}

function tableHtml(rows) {
  if (!rows.length) return '<div class="card empty route-management-tool">Sin rutas.</div>';

  return `<section class="card route-management-tool">
    <div class="section-heading">
      <div>
        <h2>Rutas existentes</h2>
        <p class="muted">Abre una ruta para trabajar toda su información desde una única ficha.</p>
      </div>
    </div>
    <div class="table-wrap">
      <table class="table route-management-table">
        <thead><tr><th>Ruta</th><th>Municipio</th><th>Estado</th><th>Datos</th><th>Acciones</th></tr></thead>
        <tbody>${rows.map((route) => routeListRowHtml(route)).join('')}</tbody>
      </table>
    </div>
  </section>`;
}

function flash(text, type = 'success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function setFormBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((control) => {
    control.disabled = busy;
  });
}

async function reloadRouteMaster(stage, list, route, activeTab = 'summary') {
  const snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
  Object.assign(route, snapshot?.route ?? {});
  renderRouteMaster(stage, list, route, snapshot, activeTab);
  return snapshot;
}

function normalizedTrackSourceKind(value) {
  const kind = String(value ?? 'manual');
  return ['official', 'field', 'community', 'manual'].includes(kind) ? kind : 'manual';
}

function optionalNumber(values, name) {
  const raw = String(values.get(name) ?? '').trim();
  return raw === '' ? null : Number(raw);
}

function requiredNumber(values, name) {
  const value = Number(values.get(name));
  if (!Number.isFinite(value)) throw new Error(`Valor numérico no válido: ${name}`);
  return value;
}

function bindRouteMasterForms(stage, list, route, snapshot) {
  const sourceForm = stage.querySelector('[data-route-source-form]');
  sourceForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(sourceForm);
    setFormBusy(sourceForm, true);
    try {
      await rpc('admin_add_route_source', {
        target_route_id: route.id,
        source_label: String(values.get('label') ?? '').trim(),
        source_url: String(values.get('url') ?? '').trim(),
        source_type: String(values.get('source_type') ?? 'other'),
        source_official: values.get('official') === 'on',
        source_checked_at: null,
        source_notes: String(values.get('notes') ?? '').trim()
      });
      flash('Fuente añadida a la ficha de la ruta.');
      await reloadRouteMaster(stage, list, route, 'sources');
    } catch (error) {
      flash(`No se pudo añadir la fuente: ${error.message}`, 'error');
      setFormBusy(sourceForm, false);
    }
  });

  const validationForm = stage.querySelector('[data-route-validation-form]');
  validationForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(validationForm);
    setFormBusy(validationForm, true);
    try {
      await rpc('admin_update_route_validation', {
        target_route_id: route.id,
        editorial_status: String(values.get('editorial_status') ?? 'pending'),
        track_status: String(values.get('track_status') ?? 'missing'),
        field_status: String(values.get('field_status') ?? 'not_checked'),
        media_status: String(values.get('media_status') ?? 'missing'),
        safety_status: String(values.get('safety_status') ?? 'pending'),
        validation_notes: String(values.get('notes') ?? '').trim()
      });
      flash('Validación guardada y gate de publicación recalculado.');
      await reloadRouteMaster(stage, list, route, 'sources');
    } catch (error) {
      flash(`No se pudo guardar la validación: ${error.message}`, 'error');
      setFormBusy(validationForm, false);
    }
  });

  const contentForm = stage.querySelector('[data-route-content-form]');
  contentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(contentForm);
    setFormBusy(contentForm, true);
    try {
      const content_payload = {
        description: String(values.get('description') ?? '').trim(),
        safety_notes: String(values.get('safety_notes') ?? '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        distance_km: requiredNumber(values, 'distance_km'),
        elevation_gain_m: requiredNumber(values, 'elevation_gain_m'),
        elevation_loss_m: requiredNumber(values, 'elevation_loss_m'),
        elevation_min_m: optionalNumber(values, 'elevation_min_m'),
        elevation_max_m: optionalNumber(values, 'elevation_max_m'),
        duration_minutes: requiredNumber(values, 'duration_minutes'),
        difficulty: String(values.get('difficulty') ?? 'moderate'),
        reward_xp: requiredNumber(values, 'reward_xp'),
        reward_olives: requiredNumber(values, 'reward_olives'),
        offline_available: values.get('offline_available') === 'on',
        route_kind: String(values.get('route_kind') ?? 'circular'),
        access_notes: String(values.get('access_notes') ?? '').trim(),
        parking_notes: String(values.get('parking_notes') ?? '').trim(),
        water_notes: String(values.get('water_notes') ?? '').trim(),
        shade_notes: String(values.get('shade_notes') ?? '').trim(),
        coverage_notes: String(values.get('coverage_notes') ?? '').trim(),
        recommended_seasons: values.getAll('recommended_seasons').map((value) => String(value)),
        editorial_sections: {
          heritage: String(values.get('heritage') ?? '').trim(),
          flora: String(values.get('flora') ?? '').trim(),
          fauna: String(values.get('fauna') ?? '').trim(),
          olive_grove: String(values.get('olive_grove') ?? '').trim(),
          landscape: String(values.get('landscape') ?? '').trim(),
          tradition: String(values.get('tradition') ?? '').trim()
        }
      };

      const newVersion = await rpc('admin_update_route_content_v2', {
        target_route_id: route.id,
        content_payload
      });
      flash(`Contenido guardado correctamente como versión ${newVersion}.`);
      await reloadRouteMaster(stage, list, route, 'content');
    } catch (error) {
      flash(`No se pudo guardar el contenido: ${error.message}`, 'error');
      setFormBusy(contentForm, false);
    }
  });

  const discoveries = Array.isArray(snapshot.discoveries) ? snapshot.discoveries : [];
  stage.querySelectorAll('[data-route-discovery-form]').forEach((form) => {
    if (!form.querySelector('[data-route-discovery-save]')) {
      form.insertAdjacentHTML('beforeend', '<button type="submit" class="btn primary span-2" data-route-discovery-save>Guardar descubrimiento</button>');
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const index = Number(form.dataset.discoveryIndex);
      const discovery = discoveries[index];
      if (!Number.isInteger(index) || !discovery?.id) {
        flash('No se pudo identificar el descubrimiento seleccionado.', 'error');
        return;
      }

      const values = new FormData(form);
      setFormBusy(form, true);
      try {
        await patch('discoveries', `id=eq.${encodeURIComponent(discovery.id)}&route_id=eq.${encodeURIComponent(route.id)}`, {
          name: String(values.get('name') ?? '').trim(),
          category: String(values.get('category') ?? 'landscape'),
          trigger_radius_m: requiredNumber(values, 'trigger_radius_m'),
          reward_xp: requiredNumber(values, 'reward_xp'),
          reward_olives: requiredNumber(values, 'reward_olives'),
          active: values.get('active') === 'on'
        });
        flash('Descubrimiento actualizado.');
        await reloadRouteMaster(stage, list, route, 'discoveries');
      } catch (error) {
        flash(`No se pudo guardar el descubrimiento: ${error.message}`, 'error');
        setFormBusy(form, false);
      }
    });
  });

  const mediaList = Array.isArray(snapshot.media) ? snapshot.media : [];
  stage.querySelectorAll('[data-route-media-form]').forEach((form) => {
    if (!form.querySelector('[data-route-media-save]')) {
      form.insertAdjacentHTML('beforeend', '<button type="submit" class="btn primary span-2" data-route-media-save>Guardar multimedia</button>');
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const index = Number(form.dataset.mediaIndex);
      const media = mediaList[index];
      if (!Number.isInteger(index) || !media?.id || !media?.kind) {
        flash('No se pudo identificar el archivo multimedia seleccionado.', 'error');
        return;
      }

      const values = new FormData(form);
      const nextKind = String(values.get('kind') ?? media.kind);
      setFormBusy(form, true);
      try {
        await patch('route_media', `route_id=eq.${encodeURIComponent(route.id)}&media_id=eq.${encodeURIComponent(media.id)}&kind=eq.${encodeURIComponent(media.kind)}`, {
          kind: nextKind,
          sort_order: requiredNumber(values, 'sort_order')
        });
        await patch('media_assets', `id=eq.${encodeURIComponent(media.id)}`, {
          title: String(values.get('title') ?? '').trim(),
          alt_text: String(values.get('alt_text') ?? '').trim() || null,
          archived: values.get('archived') === 'on'
        });
        flash('Multimedia de la ruta actualizada.');
        await reloadRouteMaster(stage, list, route, 'media');
      } catch (error) {
        flash(`No se pudo guardar la multimedia: ${error.message}`, 'error');
        setFormBusy(form, false);
      }
    });
  });

  const trackForm = stage.querySelector('[data-route-track-import-form]');
  trackForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(trackForm);
    const file = values.get('file');
    if (!file || typeof file.text !== 'function') {
      flash('Selecciona un archivo GPX o KML.', 'error');
      return;
    }

    setFormBusy(trackForm, true);
    try {
      const xml = await file.text();
      const parsed = parseTrackText(xml);
      const geometry_wkt = parsed.geometryWkt;
      const file_hash = await sha256Hex(xml);
      const sourceUrl = String(values.get('source_url') ?? '').trim();
      const newVersion = await rpc('admin_import_route_track', {
        target_route_id: route.id,
        geometry_wkt,
        track_format: parsed.format,
        track_source_kind: normalizedTrackSourceKind(values.get('source_kind')),
        track_source_url: sourceUrl || null,
        track_original_filename: file.name || null,
        track_source_hash: file_hash,
        track_source_id: null,
        track_notes: String(values.get('notes') ?? '').trim()
      });
      flash(`Track importado correctamente como geometría v${newVersion}.`);
      await reloadRouteMaster(stage, list, route, 'track');
    } catch (error) {
      flash(`No se pudo importar el track: ${error.message}`, 'error');
      setFormBusy(trackForm, false);
    }
  });
}

function mountRouteMasterTrackEditor(stage, list, route) {
  const workspace = stage.querySelector('[data-route-master-track-editor]');
  if (!workspace) return;

  void mountRouteEditor(workspace, route.id, {
    onChange: () => reloadRouteMaster(stage, list, route, 'track')
  }).catch((error) => {
    if (!workspace.isConnected) return;
    workspace.classList.add('empty-workspace');
    workspace.innerHTML = `<p class="muted">El editor visual estará disponible cuando exista una geometría válida. Puedes importar un GPX/KML arriba.</p><p class="muted">${esc(error.message)}</p>`;
  });
}

function renderRouteMaster(stage, list, route, snapshot, activeTab = 'summary') {
  stage.innerHTML = `<div class="route-master-toolbar"><button type="button" class="btn secondary" data-route-back>← Volver a rutas</button></div>${routeMasterShellHtml(snapshot, activeTab)}`;

  stage.querySelector('[data-route-back]')?.addEventListener('click', () => {
    stage.remove();
    list.hidden = false;
  });

  stage.querySelectorAll('[data-route-master-tab]').forEach((button) => {
    button.addEventListener('click', () => renderRouteMaster(stage, list, route, snapshot, button.dataset.routeMasterTab));
  });

  bindRouteMasterForms(stage, list, route, snapshot);
  if (activeTab === 'track') mountRouteMasterTrackEditor(stage, list, route);
}

async function openRouteMaster(route, list) {
  const existing = list.parentElement?.querySelector('.route-master-stage');
  existing?.remove();

  const stage = document.createElement('div');
  stage.className = 'route-master-stage';
  list.insertAdjacentElement('afterend', stage);
  list.hidden = true;

  try {
    await reloadRouteMaster(stage, list, route, 'summary');
  } catch (error) {
    stage.remove();
    list.hidden = false;
    throw error;
  }
}

function bind(rows, roles) {
  const routeBySlug = new Map(rows.map((route) => [route.slug, route]));
  const list = document.querySelector('.route-management-tool');
  if (!list) return;

  document.querySelectorAll('[data-route-open]').forEach((button) => {
    const route = routeBySlug.get(button.dataset.routeOpen);
    if (route && !button.dataset.routeActionsReady) {
      button.dataset.routeActionsReady = 'true';
      button.insertAdjacentHTML('afterend', rowActions(route, roles));
    }

    button.addEventListener('click', async () => {
      const selected = routeBySlug.get(button.dataset.routeOpen);
      if (!selected) return;
      button.disabled = true;
      try {
        await openRouteMaster(selected, list);
      } catch (error) {
        flash(`No se pudo abrir la ficha de ${selected.title}: ${error.message}`, 'error');
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-route-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const route = routeBySlug.get(button.dataset.routeArchive);
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
      const route = routeBySlug.get(button.dataset.routeDelete);
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
    genericTable.insertAdjacentHTML('beforebegin', tableHtml(rows));
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