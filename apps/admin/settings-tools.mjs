import { rpc, table } from './src/core/api.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function show(text,type='success') {
  const target=document.querySelector('#flash');
  if(target) target.innerHTML=`<p class="${type}">${esc(text)}</p>`;
}

function settingsCard() {
  return `<section class="card settings-tool"><h2>Configuración operativa</h2><p class="muted">Los valores públicos pueden ser leídos por la app. Las claves privadas solo son visibles para administradores autorizados.</p><form id="setting-save" class="form two"><div class="field"><label>Clave</label><input name="key" required placeholder="features.weather"></div><div class="field"><label>Visible para la app</label><select name="public_readable"><option value="false">No</option><option value="true">Sí</option></select></div><div class="field span-2"><label>Valor JSON</label><textarea name="value" required placeholder='true | 30 | {"mode":"auto"}'></textarea></div><div class="field span-2"><label>Descripción</label><textarea name="description"></textarea></div><button class="btn primary span-2">Guardar configuración</button></form><div id="settings-list" class="settings-list"></div></section>`;
}

function jsonPreview(value) {
  return `<span class="code">${esc(JSON.stringify(value))}</span>`;
}

async function loadSettings() {
  const target=document.querySelector('#settings-list');
  if(!target) return;
  try {
    const rows=await table('app_settings','?select=key,value,description,public_readable,updated_at&order=key.asc');
    if(!rows.length){target.innerHTML='<p class="muted">Sin configuración.</p>';return;}
    target.innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Clave</th><th>Valor</th><th>Pública</th><th>Descripción</th><th></th></tr></thead><tbody>${rows.map(row=>`<tr><td class="code">${esc(row.key)}</td><td>${jsonPreview(row.value)}</td><td>${row.public_readable?'Sí':'No'}</td><td>${esc(row.description||'')}</td><td><button class="btn tiny secondary" data-setting-edit="${esc(row.key)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`;
    target.querySelectorAll('[data-setting-edit]').forEach((button)=>button.addEventListener('click',()=>{
      const row=rows.find((item)=>item.key===button.dataset.settingEdit);
      const form=document.querySelector('#setting-save');
      form.elements.key.value=row.key;
      form.elements.value.value=JSON.stringify(row.value,null,2);
      form.elements.description.value=row.description||'';
      form.elements.public_readable.value=String(Boolean(row.public_readable));
      form.elements.value.focus();
    }));
  } catch(error){target.innerHTML=`<p class="error">${esc(error.message)}</p>`;}
}

function bindSettings() {
  const form=document.querySelector('#setting-save');
  if(!form) return;
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    let parsed;
    try { parsed=JSON.parse(form.elements.value.value); }
    catch { return show('El valor debe ser JSON válido','error'); }
    try {
      await rpc('admin_set_app_setting',{
        setting_key:form.elements.key.value.trim(),
        setting_value:parsed,
        setting_description:form.elements.description.value.trim(),
        setting_public_readable:form.elements.public_readable.value==='true'
      });
      show('Configuración guardada');
      form.reset();
      await loadSettings();
    } catch(error){show(error.message,'error');}
  });
}

async function decorate(){
  const main=document.querySelector('.main');
  if(!main||document.querySelector('.login-wrap')) return;
  const section=(location.hash||'#dashboard').slice(1);
  if(section!=='settings'||main.dataset.settingsTool==='true') return;
  main.dataset.settingsTool='true';
  main.insertAdjacentHTML('beforeend',settingsCard());
  bindSettings();
  await loadSettings();
}

new MutationObserver(()=>queueMicrotask(decorate)).observe(app,{childList:true,subtree:true});
addEventListener('hashchange',()=>queueMicrotask(decorate));
queueMicrotask(decorate);
