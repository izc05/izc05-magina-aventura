import { ADMIN_NAV_ITEMS } from './src/core/navigation.mjs';
import { canAny } from './src/core/roles.mjs';
import { getSession, signIn, signOut, table, insert, patch, rpc, uploadMedia } from './src/core/api.mjs';
import { municipalityOptions } from './src/core/route-editor.mjs';

const app = document.querySelector('#app');
let roles = [];
let partnerId = null;

const TABLE_SECTIONS = {
  routes: { table: 'routes', title: 'Rutas', select: 'id,title,slug,status,updated_at', capability: 'routes.manage' },
  map: { table: 'checkpoints', title: 'Mapa y checkpoints', select: 'id,route_id,name,trigger_radius_m,required,active', capability: 'map.manage' },
  discoveries: { table: 'discoveries', title: 'Descubrimientos', select: 'id,route_id,category,name,trigger_radius_m,reward_xp,reward_olives,active', capability: 'discoveries.manage' },
  media: { table: 'media_assets', title: 'Biblioteca multimedia', select: 'id,object_key,title,mime_type,archived,created_at', capability: 'media.manage' },
  moderation: { table: 'moderation_reports', title: 'Moderación', select: 'id,target_type,target_id,reason,status,created_at,resolved_at', capability: 'moderation.manage' },
  gamification: { table: 'gamification_levels', title: 'Niveles y gamificación', select: 'id,level,name,min_xp,reward_olives,active', capability: 'gamification.manage' },
  olives: { table: 'olive_transactions', title: 'Ledger de aceitunas', select: 'id,user_id,amount,reason,source_type,created_at', capability: 'olives.manage' },
  rewards: { table: 'rewards', title: 'Premios', select: 'id,partner_id,title,olive_cost,stock,active,valid_until', capability: 'rewards.manage' },
  partners: { table: 'reward_partners', title: 'Almazaras / partners', select: 'id,name,slug,active,created_at', capability: 'partners.manage' },
  redemptions: { table: 'reward_redemptions', title: 'Canjes QR', select: 'id,user_id,reward_id,partner_id,status,reserved_at,redeemed_at,expires_at', capability: 'redemptions.manage' },
  notifications: { table: 'admin_notifications', title: 'Notificaciones', select: 'id,title,audience,status,published_at,created_at', capability: 'notifications.manage' },
  safety: { table: 'route_safety_incidents', title: 'Seguridad e incidencias', select: 'id,route_id,title,severity,status,starts_at,ends_at', capability: 'safety.manage' },
  admins: { table: 'user_admin_roles', title: 'Administradores y roles', select: 'user_id,role_id,partner_id,created_at', capability: 'admins.manage' },
  audit: { table: 'admin_audit_log', title: 'Auditoría', select: 'id,actor_user_id,action,entity_type,entity_id,created_at', capability: 'audit.read' }
};

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function currentUserId() { return getSession()?.user?.id ?? null; }
function sectionId() { return (location.hash || '#dashboard').slice(1); }
function allowed(capability) { return canAny(roles, capability); }

function renderLogin(message = '') {
  app.innerHTML = `<main class="login-wrap"><section class="login"><h1>Mágina Aventura · Admin</h1><p class="muted">Acceso exclusivo para administración.</p>${message ? `<p class="error">${esc(message)}</p>` : ''}<form id="login" class="form"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username"></div><div class="field"><label>Contraseña</label><input name="password" type="password" required autocomplete="current-password"></div><button class="btn primary">Entrar</button></form></section></main>`;
  document.querySelector('#login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try { await signIn(data.get('email'), data.get('password')); await bootstrap(); }
    catch (error) { renderLogin(error.message); }
  });
}

async function loadAccess() {
  const userId = currentUserId();
  if (!userId) throw new Error('La sesión no contiene usuario');
  const rows = await table('user_admin_roles', `?select=role_id,partner_id&user_id=eq.${encodeURIComponent(userId)}`);
  roles = rows.map((row) => row.role_id);
  partnerId = rows.find((row) => row.partner_id)?.partner_id ?? null;
  if (!roles.length) throw new Error('Tu cuenta no tiene un rol administrativo');
}

function renderShell(content, title) {
  const links = ADMIN_NAV_ITEMS.filter((item) => allowed(item.capability)).map((item) => `<a href="${item.href}" class="${sectionId() === item.id ? 'active' : ''}">${esc(item.label)}</a>`).join('');
  app.innerHTML = `<div class="shell"><aside class="sidebar"><p class="brand">Mágina Aventura<small>Panel de administración</small></p><nav class="nav">${links}</nav></aside><main class="main"><header class="topbar"><div><h1>${esc(title)}</h1><p class="muted">${esc(roles.join(' · '))}</p></div><button id="logout" class="btn secondary">Salir</button></header><div id="flash"></div>${content}</main></div>`;
  document.querySelector('#logout').addEventListener('click', () => { signOut(); roles = []; renderLogin(); });
}

function flash(text, type = 'success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function rowsTable(rows) {
  if (!rows?.length) return '<div class="card empty">Sin datos.</div>';
  const keys = Object.keys(rows[0]);
  return `<div class="card table-wrap"><table class="table"><thead><tr>${keys.map((key) => `<th>${esc(key)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${keys.map((key) => `<td>${typeof row[key] === 'object' ? `<span class="code">${esc(JSON.stringify(row[key]))}</span>` : esc(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

async function renderDashboard() {
  if (!allowed('dashboard.read')) return forbidden();
  const [routes, reports, rewards, redemptions] = await Promise.all([
    table('routes', '?select=id'),
    allowed('moderation.manage') ? table('moderation_reports', '?select=id&status=eq.open') : Promise.resolve([]),
    allowed('rewards.manage') ? table('rewards', '?select=id&active=eq.true') : Promise.resolve([]),
    allowed('redemptions.manage') ? table('reward_redemptions', '?select=id&status=eq.reserved') : Promise.resolve([])
  ]);
  renderShell(`<div class="grid kpis"><div class="card kpi"><span>Rutas</span><strong>${routes.length}</strong></div><div class="card kpi"><span>Reportes abiertos</span><strong>${reports.length}</strong></div><div class="card kpi"><span>Premios activos</span><strong>${rewards.length}</strong></div><div class="card kpi"><span>Canjes pendientes</span><strong>${redemptions.length}</strong></div></div><div class="card"><h2>Centro de control</h2><p>Desde aquí se gestionan contenidos, seguridad, recompensas y operación de Mágina Aventura. Todas las acciones sensibles quedan sujetas a RLS y auditoría.</p></div>`, 'Dashboard');
}

function forbidden() { renderShell('<div class="card error">No tienes permiso para esta sección.</div>', 'Acceso restringido'); }

async function renderListSection(id) {
  const spec = TABLE_SECTIONS[id];
  if (!spec || !allowed(spec.capability)) return forbidden();
  const partnerFilter = roles.includes('partner') && partnerId && ['rewards','redemptions'].includes(id) ? `&partner_id=eq.${partnerId}` : '';
  const rows = await table(spec.table, `?select=${encodeURIComponent(spec.select)}${partnerFilter}&order=created_at.desc.nullslast` ).catch(async () => table(spec.table, `?select=${encodeURIComponent(spec.select)}${partnerFilter}`));
  const actionContext = {};
  if (id === 'routes') {
    const municipalityRows = await table('municipalities', '?select=id,name,active&active=eq.true&order=name.asc').catch(() => []);
    actionContext.municipalities = municipalityOptions(municipalityRows);
  }
  renderShell(`${actionPanel(id, actionContext)}${rowsTable(rows)}`, spec.title);
  bindActions(id);
}

function actionPanel(id, context = {}) {
  if (id === 'routes') {
    const municipalities = context.municipalities ?? [];
    const municipalityField = municipalities.length
      ? `<div class="field"><label>Municipio</label><select name="municipality_id" required>${municipalities.map((item) => `<option value="${esc(item.value)}">${esc(item.label)}</option>`).join('')}</select></div>`
      : `<div class="field"><label>Municipio UUID</label><input name="municipality_id" required placeholder="Añade primero un municipio activo"></div>`;
    return `<section class="card"><h2>Nueva ruta</h2><form id="route-create" class="form two">${municipalityField}<div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Slug</label><input name="slug" required></div><div class="field"><label>Dificultad</label><select name="difficulty"><option>easy</option><option>moderate</option><option>hard</option></select></div><div class="field span-2"><label>Descripción</label><textarea name="description" required></textarea></div><div class="field"><label>Distancia km</label><input name="distance_km" type="number" step="0.001" min="0" required></div><div class="field"><label>Desnivel + m</label><input name="elevation_gain_m" type="number" min="0" required></div><div class="field"><label>Duración min</label><input name="duration_minutes" type="number" min="1" required></div><div class="field"><label>XP</label><input name="reward_xp" type="number" min="0" value="0"></div><div class="field"><label>Aceitunas</label><input name="reward_olives" type="number" min="0" value="0"></div><button class="btn primary span-2">Crear borrador</button></form></section>`;
  }
  if (id === 'map') return simplePointForm('checkpoint-create','Nuevo checkpoint',[['route_id','Ruta UUID'],['name','Nombre'],['lat','Latitud'],['lng','Longitud'],['trigger_radius_m','Radio m']]);
  if (id === 'discoveries') return `<section class="card"><h2>Nuevo descubrimiento</h2><form id="discovery-create" class="form two">${field('route_id','Ruta UUID')}${field('name','Nombre')}${field('lat','Latitud')}${field('lng','Longitud')}${field('trigger_radius_m','Radio m')}${selectField('category','Categoría',['flora','fauna','heritage','olive','tradition','landscape'])}${field('reward_xp','XP','number','0')}${field('reward_olives','Aceitunas','number','0')}<button class="btn primary span-2">Guardar</button></form></section>`;
  if (id === 'media') return `<section class="card"><h2>Subir imagen / archivo</h2><form id="media-upload" class="form"><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Archivo</label><input name="file" type="file" required></div><button class="btn primary">Subir</button></form></section>`;
  if (id === 'olives') return `<section class="card"><h2>Ajuste administrativo</h2><form id="olive-adjust" class="form two">${field('user_id','Usuario UUID')}${field('amount','Importe (+/-)','number')}${field('reason','Motivo')}<button class="btn primary">Registrar ajuste</button></form></section>`;
  if (id === 'partners') return genericCreate('partner-create','Nueva almazara',[['name','Nombre'],['slug','Slug']]);
  if (id === 'rewards') return `<section class="card"><h2>Nuevo premio</h2><form id="reward-create" class="form two">${field('partner_id','Partner UUID', 'text', partnerId ?? '')}${field('title','Título')}${field('olive_cost','Coste en aceitunas','number')}${field('stock','Stock','number')}<button class="btn primary span-2">Crear premio</button></form></section>`;
  if (id === 'redemptions') return `<section class="card"><h2>Validar QR</h2><form id="redeem" class="form"><div class="field"><label>Token del QR</label><input name="token" required autocomplete="off"></div><button class="btn primary">Validar y marcar entregado</button></form></section>`;
  if (id === 'notifications') return `<section class="card"><h2>Nueva notificación</h2><form id="notification-create" class="form">${field('title','Título')}<div class="field"><label>Mensaje</label><textarea name="body" required></textarea></div>${selectField('audience','Audiencia',['all','route','municipality','role'])}<button class="btn primary">Guardar borrador</button></form></section>`;
  if (id === 'safety') return `<section class="card"><h2>Nueva incidencia</h2><form id="safety-create" class="form two">${field('route_id','Ruta UUID')}${field('title','Título')}${selectField('severity','Severidad',['info','warning','critical'])}<div class="field span-2"><label>Descripción</label><textarea name="description" required></textarea></div><button class="btn primary span-2">Abrir incidencia</button></form></section>`;
  if (id === 'admins') return `<section class="card"><h2>Asignar rol</h2><form id="role-assign" class="form two">${field('user_id','Usuario UUID')}${selectField('role_id','Rol',['super_admin','admin','route_manager','moderator','partner'])}${field('partner_id','Partner UUID (solo partner)')}<button class="btn primary span-2">Asignar</button></form></section>`;
  return '';
}

function field(name,label,type='text',value=''){return `<div class="field"><label>${esc(label)}</label><input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${name === 'reason' ? 'required' : ''}></div>`}
function selectField(name,label,values){return `<div class="field"><label>${esc(label)}</label><select name="${esc(name)}">${values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></div>`}
function simplePointForm(id,title,fields){return `<section class="card"><h2>${esc(title)}</h2><form id="${id}" class="form two">${fields.map(([n,l])=>field(n,l,n.includes('radius')?'number':'text')).join('')}<button class="btn primary span-2">Guardar</button></form></section>`}
function genericCreate(id,title,fields){return `<section class="card"><h2>${esc(title)}</h2><form id="${id}" class="form two">${fields.map(([n,l])=>field(n,l)).join('')}<button class="btn primary span-2">Crear</button></form></section>`}

function formData(form){return Object.fromEntries(new FormData(form).entries())}
function num(value){return Number(value)}
function point(lng,lat){return `SRID=4326;POINT(${Number(lng)} ${Number(lat)})`}

function bindActions(id) {
  const on = (selector, fn) => { const el = document.querySelector(selector); if (el) el.addEventListener('submit', async (event) => { event.preventDefault(); try { await fn(formData(event.currentTarget), event.currentTarget); flash('Operación completada'); await render(); } catch (error) { flash(error.message,'error'); } }); };
  on('#route-create', async (d) => {
    const created = await insert('routes',{ municipality_id:d.municipality_id, title:d.title, slug:d.slug, status:'draft' });
    const route = created[0];
    await insert('route_versions',{ route_id:route.id, version:1, description:d.description, distance_km:num(d.distance_km), elevation_gain_m:num(d.elevation_gain_m), duration_minutes:num(d.duration_minutes), difficulty:d.difficulty, reward_xp:num(d.reward_xp), reward_olives:num(d.reward_olives) });
  });
  on('#checkpoint-create', (d)=>insert('checkpoints',{route_id:d.route_id,name:d.name,position:point(d.lng,d.lat),trigger_radius_m:num(d.trigger_radius_m),required:false,active:true}));
  on('#discovery-create', (d)=>insert('discoveries',{route_id:d.route_id||null,name:d.name,position:point(d.lng,d.lat),trigger_radius_m:num(d.trigger_radius_m),category:d.category,reward_xp:num(d.reward_xp),reward_olives:num(d.reward_olives),active:true}));
  on('#olive-adjust',(d)=>rpc('admin_adjust_olives',{target_user_id:d.user_id,delta:num(d.amount),adjustment_reason:d.reason}));
  on('#partner-create',(d)=>insert('reward_partners',{name:d.name,slug:d.slug,active:true}));
  on('#reward-create',(d)=>insert('rewards',{partner_id:d.partner_id,title:d.title,olive_cost:num(d.olive_cost),stock:num(d.stock),active:true}));
  on('#redeem',(d)=>rpc('redeem_reward_token',{token:d.token}));
  on('#notification-create',(d)=>insert('admin_notifications',{title:d.title,body:d.body,audience:d.audience,status:'draft'}));
  on('#safety-create',(d)=>insert('route_safety_incidents',{route_id:d.route_id,title:d.title,description:d.description,severity:d.severity,status:'open',starts_at:new Date().toISOString()}));
  on('#role-assign',(d)=>rpc('admin_assign_role',{target_user_id:d.user_id,new_role:d.role_id,target_partner_id:d.partner_id||null}));
  const media = document.querySelector('#media-upload');
  if (media) media.addEventListener('submit', async (event)=>{event.preventDefault();try{const d=formData(event.currentTarget);const file=event.currentTarget.querySelector('[name=file]').files[0];const key=`${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;await uploadMedia(file,key);await insert('media_assets',{object_key:key,title:d.title,mime_type:file.type||'application/octet-stream',byte_size:file.size,created_by:currentUserId()});flash('Archivo subido');await render();}catch(error){flash(error.message,'error')}});
}

async function renderUsers() {
  if (!allowed('users.read')) return forbidden();
  const rows = await rpc('admin_list_users',{});
  renderShell(rowsTable(rows), 'Usuarios');
}

async function renderCommunity() {
  if (!allowed('community.manage')) return forbidden();
  renderShell('<div class="card"><h2>Comunidad</h2><p>La moderación pública se opera desde la bandeja de reportes. No existe un lector general de mensajes privados.</p><p><a class="btn secondary" href="#moderation">Abrir moderación</a></p></div>', 'Comunidad');
}

async function renderSettings() {
  if (!allowed('settings.manage')) return forbidden();
  renderShell('<div class="card"><h2>Configuración</h2><p>Configuración operativa protegida. Los secretos y claves de servicio no se muestran ni se almacenan en el navegador.</p></div>', 'Configuración');
}

async function render() {
  try {
    const id = sectionId();
    if (id === 'dashboard') return await renderDashboard();
    if (id === 'users') return await renderUsers();
    if (id === 'community') return await renderCommunity();
    if (id === 'settings') return await renderSettings();
    return await renderListSection(id);
  } catch (error) {
    renderShell(`<div class="card error">${esc(error.message)}</div>`, 'Error');
  }
}

async function bootstrap() {
  if (!getSession()) return renderLogin();
  try { await loadAccess(); await render(); }
  catch (error) { signOut(); renderLogin(error.message); }
}

addEventListener('hashchange', render);
bootstrap();