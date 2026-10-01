import { rpc } from './src/core/api.mjs';

const app=document.querySelector('#app');

function esc(value){return String(value??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function show(text,type='success'){const target=document.querySelector('#flash');if(target)target.innerHTML=`<p class="${type}">${esc(text)}</p>`;}
function metric(label,value){return `<div class="card kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;}

async function decorateDashboard(main){if(main.dataset.extendedDashboard==='true')return;main.dataset.extendedDashboard='true';try{const m=await rpc('admin_dashboard_metrics',{});main.insertAdjacentHTML('beforeend',`<section class="card extended-dashboard"><h2>Métricas operativas</h2><div class="grid kpis">${metric('Usuarios',m.users_total)}${metric('Activos 30 días',m.users_active_30d)}${metric('Rutas publicadas',`${m.routes_published}/${m.routes_total}`)}${metric('Incidencias abiertas',m.safety_open)}${metric('Moderación abierta',Number(m.moderation_open||0)+Number(m.chat_reports_open||0))}${metric('Premios activos',m.rewards_active)}${metric('Canjes 30 días',m.redemptions_30d)}${metric('Reservas pendientes',m.redemptions_reserved)}${metric('Aceitunas netas',m.olives_net)}${metric('Mensajes chat 24 h',m.chat_messages_24h)}</div></section>`);}catch(error){main.insertAdjacentHTML('beforeend',`<section class="card error">${esc(error.message)}</section>`);}}

function userInspector(){return `<section class="card user-inspector"><h2>Ficha administrativa de usuario</h2><form id="user-overview-form" class="form route-load-form"><div class="field"><label>Usuario UUID</label><input name="user_id" required></div><button class="btn primary">Abrir ficha</button></form><div id="user-overview-result"></div></section>`;}

function objectCard(title,value){return `<div class="user-overview-box"><h4>${esc(title)}</h4><pre class="code">${esc(JSON.stringify(value,null,2))}</pre></div>`;}

function renderUserOverview(data){const target=document.querySelector('#user-overview-result');if(!target)return;target.innerHTML=`<div class="user-overview-grid"><div class="user-overview-box"><h3>${esc(data.email||data.user_id)}</h3><p class="code">${esc(data.user_id)}</p><p>Alta: ${esc(data.created_at||'')}</p><p>Último acceso: ${esc(data.last_sign_in_at||'')}</p></div><div class="user-overview-box"><span>Aceitunas</span><strong class="big-number">${esc(data.olive_balance||0)}</strong><p>Mensajes chat: ${esc(data.chat_messages||0)}</p><p>Reportes sobre mensajes: ${esc(data.chat_reports_against||0)}</p></div>${objectCard('Roles',data.roles||[])}${objectCard('Moderación',data.moderation||{})}${objectCard('Canjes',data.redemptions||{})}</div>`;}

function bindUserInspector(){const form=document.querySelector('#user-overview-form');if(!form)return;form.addEventListener('submit',async(event)=>{event.preventDefault();const target=document.querySelector('#user-overview-result');target.innerHTML='<p class="muted">Cargando ficha…</p>';try{const data=await rpc('admin_user_overview',{target_user_id:form.elements.user_id.value.trim()});renderUserOverview(data);}catch(error){target.innerHTML=`<p class="error">${esc(error.message)}</p>`;show(error.message,'error');}});}

async function decorate(){const main=document.querySelector('.main');if(!main||document.querySelector('.login-wrap'))return;const section=(location.hash||'#dashboard').slice(1);if(section==='dashboard')await decorateDashboard(main);if(section==='users'&&main.dataset.userInspector!=='true'){main.dataset.userInspector='true';main.insertAdjacentHTML('beforeend',userInspector());bindUserInspector();}}

new MutationObserver(()=>queueMicrotask(decorate)).observe(app,{childList:true,subtree:true});
addEventListener('hashchange',()=>queueMicrotask(decorate));
queueMicrotask(decorate);
