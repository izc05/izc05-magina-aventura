import { rpc, table } from './src/core/api.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function show(text, type='success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function userTools() {
  return `<section class="card people-community-tool"><h2>Estado del usuario</h2><form id="user-state-form" class="form two"><div class="field"><label>Usuario UUID</label><input name="user_id" required></div><div class="field"><label>Estado</label><select name="status"><option value="active">active</option><option value="warned">warned</option><option value="suspended">suspended</option></select></div><div class="field span-2"><label>Motivo</label><textarea name="reason" placeholder="Motivo de advertencia, suspensión o reactivación"></textarea></div><button class="btn primary span-2">Aplicar estado</button></form><div id="moderation-state-list"></div></section>`;
}

function overviewCard(data) {
  if (!data?.available) {
    return `<section class="card people-community-tool"><h2>Comunidad</h2><p>El Admin está preparado para la rama de Comunidad, pero sus tablas todavía no forman parte de <code>main</code>. No se crean duplicados para evitar conflictos cuando se integre.</p><p class="muted">La moderación genérica y los reportes del panel siguen disponibles. Los mensajes privados no se exponen como bandeja administrativa general.</p></section>`;
  }
  return `<section class="card people-community-tool"><h2>Estado de Comunidad</h2><div class="grid kpis"><div class="card kpi"><span>Fotos pendientes</span><strong>${Number(data.photos_pending||0)}</strong></div><div class="card kpi"><span>Comentarios visibles</span><strong>${Number(data.comments_visible||0)}</strong></div><div class="card kpi"><span>Reseñas visibles</span><strong>${Number(data.reviews_visible||0)}</strong></div><div class="card kpi"><span>Incidencias pendientes</span><strong>${Number(data.incidents_pending||0)}</strong></div><div class="card kpi"><span>Reportes abiertos</span><strong>${Number(data.reports_open||0)}</strong></div></div><p class="muted">La gestión detallada se mantiene en la bandeja de Moderación y en los RPC auditados de Comunidad. Los mensajes privados solo deben aportar contexto cuando sean reportados.</p></section>`;
}

async function loadStates() {
  const target = document.querySelector('#moderation-state-list');
  if (!target) return;
  try {
    const rows = await table('user_moderation_states', '?select=user_id,status,reason,updated_at&order=updated_at.desc');
    if (!rows.length) { target.innerHTML = '<p class="muted">Sin estados administrativos registrados.</p>'; return; }
    target.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Usuario</th><th>Estado</th><th>Motivo</th><th>Actualizado</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="code">${esc(r.user_id)}</td><td><span class="status">${esc(r.status)}</span></td><td>${esc(r.reason||'')}</td><td>${esc(r.updated_at||'')}</td></tr>`).join('')}</tbody></table></div>`;
  } catch (error) {
    target.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  }
}

function bindUserForm() {
  const form = document.querySelector('#user-state-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    try {
      await rpc('admin_set_user_state', { target_user_id:d.user_id, new_status:d.status, state_reason:d.reason||'' });
      show('Estado del usuario actualizado');
      form.reset();
      await loadStates();
    } catch (error) { show(error.message,'error'); }
  });
}

async function decorate() {
  const main = document.querySelector('.main');
  if (!main || document.querySelector('.login-wrap')) return;
  const section = (location.hash || '#dashboard').slice(1);
  const marker = `people-community-${section}`;
  if (main.dataset.peopleCommunity === marker) return;
  main.dataset.peopleCommunity = marker;

  if (section === 'users') {
    main.insertAdjacentHTML('beforeend', userTools());
    bindUserForm();
    await loadStates();
  }

  if (section === 'community') {
    try {
      const overview = await rpc('admin_community_overview', {});
      main.insertAdjacentHTML('beforeend', overviewCard(overview));
    } catch (error) {
      main.insertAdjacentHTML('beforeend', `<section class="card error people-community-tool">${esc(error.message)}</section>`);
    }
  }
}

new MutationObserver(() => queueMicrotask(decorate)).observe(app,{childList:true,subtree:true});
addEventListener('hashchange',()=>queueMicrotask(decorate));
queueMicrotask(decorate);
