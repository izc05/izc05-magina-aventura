import { insert, patch, rpc } from './src/core/api.mjs';
import { parseGpxTrack, toLineStringWkt } from './src/core/gpx.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function field(name,label,type='text',extra='') {
  return `<div class="field"><label>${esc(label)}</label><input name="${esc(name)}" type="${esc(type)}" ${extra}></div>`;
}

function select(name,label,values) {
  return `<div class="field"><label>${esc(label)}</label><select name="${esc(name)}">${values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></div>`;
}

function card(title, body) {
  return `<section class="card admin-enhancement"><h2>${esc(title)}</h2>${body}</section>`;
}

function show(text, type='success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function values(form) { return Object.fromEntries(new FormData(form).entries()); }

function bind(selector, handler) {
  const form = document.querySelector(selector);
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await handler(values(form), form);
      show('Operación completada');
      setTimeout(() => location.reload(), 250);
    } catch (error) {
      show(error.message || String(error), 'error');
    }
  });
}

function routeTools() {
  return [
    card('Importar GPX', `<form id="advanced-gpx" class="form two">${field('route_id','Ruta UUID','text','required')}<div class="field"><label>Archivo GPX</label><input name="file" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" required></div><button class="btn primary span-2">Importar trazado</button></form>`),
    card('Estado de publicación', `<form id="advanced-route-status" class="form two">${field('route_id','Ruta UUID','text','required')}${select('status','Nuevo estado',['draft','review','published','archived'])}<button class="btn primary span-2">Cambiar estado</button></form>`),
    card('Editar datos principales', `<form id="advanced-route-edit" class="form two">${field('route_id','Ruta UUID','text','required')}${field('title','Nuevo título')}${field('slug','Nuevo slug')}<button class="btn secondary span-2">Guardar cambios</button></form>`)
  ].join('');
}

function mediaTools() {
  return card('Vincular imagen a una ruta', `<form id="advanced-route-media" class="form two">${field('route_id','Ruta UUID','text','required')}${field('media_id','Media UUID','text','required')}${select('kind','Uso',['hero','gallery','safety','discovery'])}${field('sort_order','Orden','number','value="0"')}<button class="btn primary span-2">Vincular</button></form>`);
}

function moderationTools() {
  return card('Resolver reporte', `<form id="advanced-report" class="form two">${field('report_id','Reporte UUID','text','required')}${select('status','Resultado',['resolved','dismissed'])}<div class="field span-2"><label>Resolución</label><textarea name="resolution" required></textarea></div><button class="btn primary span-2">Cerrar reporte</button></form>`);
}

function gamificationTools() {
  return card('Crear reglas de gamificación', `<div class="split"><form id="advanced-level" class="form">${field('level','Nivel','number','min="1" required')}${field('name','Nombre','text','required')}${field('min_xp','XP mínimo','number','min="0" required')}${field('reward_olives','Aceitunas premio','number','min="0" value="0"')}<button class="btn primary">Crear nivel</button></form><form id="advanced-badge" class="form">${field('slug','Slug','text','required')}${field('name','Insignia','text','required')}<div class="field"><label>Descripción</label><textarea name="description" required></textarea></div><button class="btn secondary">Crear insignia</button></form></div>`);
}

function redemptionTools() {
  return card('Gestión de reservas', `<div class="split"><form id="advanced-cancel-redemption" class="form">${field('redemption_id','Canje UUID','text','required')}<button class="btn danger">Cancelar y devolver aceitunas</button></form><form id="advanced-expire-redemptions" class="form"><p class="muted">Caduca las reservas vencidas del ámbito que administras y devuelve automáticamente aceitunas y stock.</p><button class="btn secondary">Procesar caducadas</button></form></div>`);
}

function notificationTools() {
  return card('Publicar notificación', `<form id="advanced-publish-notification" class="form">${field('notification_id','Notificación UUID','text','required')}<button class="btn primary">Publicar ahora</button></form>`);
}

function safetyTools() {
  return card('Cerrar incidencia', `<form id="advanced-resolve-safety" class="form">${field('incident_id','Incidencia UUID','text','required')}<button class="btn primary">Marcar resuelta</button></form>`);
}

function adminTools() {
  return card('Revocar rol', `<form id="advanced-revoke-role" class="form two">${field('user_id','Usuario UUID','text','required')}${select('role_id','Rol',['super_admin','admin','route_manager','moderator','partner'])}<button class="btn danger span-2">Revocar rol</button></form>`);
}

function rewardTools() {
  return card('Actualizar premio', `<form id="advanced-reward-edit" class="form two">${field('reward_id','Premio UUID','text','required')}${field('stock','Stock','number','min="0"')}${field('olive_cost','Coste en aceitunas','number','min="1"')}${select('active','Estado',['true','false'])}<button class="btn secondary span-2">Actualizar</button></form>`);
}

function partnerTools() {
  return card('Actualizar almazara', `<form id="advanced-partner-edit" class="form two">${field('partner_id','Partner UUID','text','required')}${field('name','Nombre')}${select('active','Estado',['true','false'])}<button class="btn secondary span-2">Actualizar</button></form>`);
}

function toolsFor(section) {
  if (section === 'routes') return routeTools();
  if (section === 'media') return mediaTools();
  if (section === 'moderation') return moderationTools();
  if (section === 'gamification') return gamificationTools();
  if (section === 'redemptions') return redemptionTools();
  if (section === 'notifications') return notificationTools();
  if (section === 'safety') return safetyTools();
  if (section === 'admins') return adminTools();
  if (section === 'rewards') return rewardTools();
  if (section === 'partners') return partnerTools();
  return '';
}

function bindCurrent(section) {
  if (section === 'routes') {
    bind('#advanced-gpx', async (_, form) => {
      const routeId = form.elements.route_id.value.trim();
      const file = form.elements.file.files[0];
      if (!file) throw new Error('Selecciona un archivo GPX');
      const points = parseGpxTrack(await file.text());
      await rpc('admin_save_route_geometry', { target_route_id: routeId, geometry_wkt: toLineStringWkt(points) });
    });
    bind('#advanced-route-status', d => rpc('admin_set_route_status', { target_route_id:d.route_id, new_status:d.status }));
    bind('#advanced-route-edit', async d => {
      const changes = {};
      if (d.title.trim()) changes.title = d.title.trim();
      if (d.slug.trim()) changes.slug = d.slug.trim();
      if (!Object.keys(changes).length) throw new Error('Indica al menos un cambio');
      await patch('routes', `id=eq.${encodeURIComponent(d.route_id)}`, changes);
    });
  }
  if (section === 'media') bind('#advanced-route-media', d => insert('route_media', { route_id:d.route_id, media_id:d.media_id, kind:d.kind, sort_order:Number(d.sort_order || 0) }));
  if (section === 'moderation') bind('#advanced-report', d => rpc('admin_resolve_report', { report_id:d.report_id, new_status:d.status, resolution:d.resolution }));
  if (section === 'gamification') {
    bind('#advanced-level', d => insert('gamification_levels', { level:Number(d.level), name:d.name, min_xp:Number(d.min_xp), reward_olives:Number(d.reward_olives || 0), active:true }));
    bind('#advanced-badge', d => insert('gamification_badges', { slug:d.slug, name:d.name, description:d.description, active:true }));
  }
  if (section === 'redemptions') {
    bind('#advanced-cancel-redemption', d => rpc('cancel_reward_redemption', { redemption_id:d.redemption_id }));
    bind('#advanced-expire-redemptions', async () => { const result = await rpc('expire_reward_redemptions', {}); show(`Reservas caducadas procesadas: ${result}`); });
  }
  if (section === 'notifications') bind('#advanced-publish-notification', d => rpc('admin_publish_notification', { notification_id:d.notification_id }));
  if (section === 'safety') bind('#advanced-resolve-safety', d => rpc('admin_resolve_safety', { incident_id:d.incident_id }));
  if (section === 'admins') bind('#advanced-revoke-role', d => rpc('admin_revoke_role', { target_user_id:d.user_id, target_role:d.role_id }));
  if (section === 'rewards') bind('#advanced-reward-edit', async d => {
    const changes = { active:d.active === 'true' };
    if (d.stock !== '') changes.stock = Number(d.stock);
    if (d.olive_cost !== '') changes.olive_cost = Number(d.olive_cost);
    await patch('rewards', `id=eq.${encodeURIComponent(d.reward_id)}`, changes);
  });
  if (section === 'partners') bind('#advanced-partner-edit', async d => {
    const changes = { active:d.active === 'true' };
    if (d.name.trim()) changes.name = d.name.trim();
    await patch('reward_partners', `id=eq.${encodeURIComponent(d.partner_id)}`, changes);
  });
}

function decorate() {
  const main = document.querySelector('.main');
  if (!main || document.querySelector('.login-wrap')) return;
  const section = (location.hash || '#dashboard').slice(1);
  if (main.dataset.enhancedSection === section) return;
  main.dataset.enhancedSection = section;
  const html = toolsFor(section);
  if (!html) return;
  main.insertAdjacentHTML('beforeend', html);
  bindCurrent(section);
}

new MutationObserver(() => queueMicrotask(decorate)).observe(app, { childList:true, subtree:true });
addEventListener('hashchange', () => queueMicrotask(decorate));
queueMicrotask(decorate);
