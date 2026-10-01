import { insert, patch, rpc } from './src/core/api.mjs';
import { routeBounds, pointToSvg, svgToLngLat, polylinePoints } from './src/core/route-editor.mjs';
import { normalizeRedemptionToken, barcodeDetectorSupported } from './src/core/qr.mjs';

const app = document.querySelector('#app');
const SVG_WIDTH = 800;
const SVG_HEIGHT = 420;
const SVG_PADDING = 28;
let activeStream = null;
let scanFrame = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function show(text, type='success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function stopScanner() {
  if (scanFrame) cancelAnimationFrame(scanFrame);
  scanFrame = null;
  if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

function routeEditorShell() {
  return `<section class="card visual-route-editor">
    <div class="section-heading"><div><h2>Editor visual del trazado</h2><p class="muted">Carga una ruta y pulsa directamente sobre el trazado para colocar checkpoints o descubrimientos.</p></div></div>
    <form id="visual-route-load" class="form route-load-form">
      <div class="field"><label>Ruta UUID</label><input name="route_id" required></div>
      <button class="btn primary">Cargar trazado</button>
    </form>
    <div id="visual-route-workspace" class="visual-route-workspace empty-workspace">Carga una ruta para empezar.</div>
  </section>`;
}

function markerCircle(item, bounds, className) {
  const p = pointToSvg([item.lng, item.lat], bounds, SVG_WIDTH, SVG_HEIGHT, SVG_PADDING);
  return `<g class="map-marker ${className}" data-marker-id="${esc(item.id)}">
    <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="8"></circle>
    <title>${esc(item.name)}</title>
  </g>`;
}

function stateList(snapshot) {
  const checkpoints = snapshot.checkpoints || [];
  const discoveries = snapshot.discoveries || [];
  const item = (row, type) => `<li><span><strong>${esc(row.name)}</strong><small>${type === 'checkpoint' ? `radio ${esc(row.radius_m)} m` : `${esc(row.category)} · +${esc(row.reward_xp)} XP · +${esc(row.reward_olives)} aceitunas`}</small></span><button class="btn tiny secondary" data-toggle-type="${type}" data-id="${esc(row.id)}" data-active="${row.active ? 'true' : 'false'}">${row.active ? 'Desactivar' : 'Activar'}</button></li>`;
  return `<div class="visual-route-lists"><div><h3>Checkpoints (${checkpoints.length})</h3><ul>${checkpoints.length ? checkpoints.map((r)=>item(r,'checkpoint')).join('') : '<li class="muted">Sin checkpoints.</li>'}</ul></div><div><h3>Descubrimientos (${discoveries.length})</h3><ul>${discoveries.length ? discoveries.map((r)=>item(r,'discovery')).join('') : '<li class="muted">Sin descubrimientos.</li>'}</ul></div></div>`;
}

function editorForms() {
  return `<div class="visual-route-forms">
    <div class="selected-coordinate"><strong>Punto seleccionado</strong><span id="selected-coordinate">Pulsa sobre el mapa</span></div>
    <form id="visual-checkpoint-create" class="form two">
      <input type="hidden" name="lng"><input type="hidden" name="lat">
      <div class="field"><label>Checkpoint</label><input name="name" required placeholder="Ej. Mirador del sendero"></div>
      <div class="field"><label>Radio GPS (m)</label><input name="trigger_radius_m" type="number" min="5" max="500" value="30" required></div>
      <label class="check"><input name="required" type="checkbox"> Obligatorio para completar la ruta</label>
      <button class="btn primary">Añadir checkpoint</button>
    </form>
    <form id="visual-discovery-create" class="form two">
      <input type="hidden" name="lng"><input type="hidden" name="lat">
      <div class="field"><label>Descubrimiento</label><input name="name" required placeholder="Ej. Encina centenaria"></div>
      <div class="field"><label>Categoría</label><select name="category"><option>flora</option><option>fauna</option><option>heritage</option><option>olive</option><option>tradition</option><option>landscape</option></select></div>
      <div class="field"><label>Radio GPS (m)</label><input name="trigger_radius_m" type="number" min="5" max="500" value="30" required></div>
      <div class="field"><label>XP</label><input name="reward_xp" type="number" min="0" value="50"></div>
      <div class="field"><label>Aceitunas</label><input name="reward_olives" type="number" min="0" value="10"></div>
      <button class="btn primary">Añadir descubrimiento</button>
    </form>
  </div>`;
}

async function afterRouteEditorMutation(routeId, workspace, onChange) {
  if (typeof onChange === 'function') {
    await onChange();
    return;
  }
  await loadRouteSnapshot(routeId, workspace, null);
}

function renderRouteEditor(snapshot, workspace, onChange = null) {
  if (!workspace) return;
  const points = Array.isArray(snapshot.coordinates) ? snapshot.coordinates : [];
  if (points.length < 2) throw new Error('La ruta no tiene geometría suficiente');
  const bounds = routeBounds(points);
  const checkpointMarkers = (snapshot.checkpoints || []).map((item)=>markerCircle(item,bounds,'checkpoint-marker')).join('');
  const discoveryMarkers = (snapshot.discoveries || []).map((item)=>markerCircle(item,bounds,'discovery-marker')).join('');

  workspace.classList.remove('empty-workspace');
  workspace.innerHTML = `<div class="visual-route-summary"><div><strong>${esc(snapshot.title)}</strong><span>${esc(snapshot.status)} · geometría v${esc(snapshot.version)}</span></div><div class="map-legend"><span><i class="checkpoint-dot"></i>Checkpoint</span><span><i class="discovery-dot"></i>Descubrimiento</span></div></div>
    <div class="route-canvas-wrap"><svg id="route-canvas" class="route-canvas" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-label="Trazado editable de la ruta"><rect width="100%" height="100%" class="route-canvas-bg"></rect><polyline class="route-polyline-halo" points="${polylinePoints(points,SVG_WIDTH,SVG_HEIGHT,SVG_PADDING)}"></polyline><polyline class="route-polyline" points="${polylinePoints(points,SVG_WIDTH,SVG_HEIGHT,SVG_PADDING)}"></polyline>${checkpointMarkers}${discoveryMarkers}<circle id="selected-map-point" class="selected-map-point" r="7" cx="-100" cy="-100"></circle></svg></div>
    ${editorForms()}${stateList(snapshot)}`;

  const svg = workspace.querySelector('#route-canvas');
  svg.addEventListener('click', (event) => {
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (SVG_WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (SVG_HEIGHT / rect.height);
    const [lng, lat] = svgToLngLat(x,y,bounds,SVG_WIDTH,SVG_HEIGHT,SVG_PADDING);
    workspace.querySelector('#selected-map-point').setAttribute('cx', String(x));
    workspace.querySelector('#selected-map-point').setAttribute('cy', String(y));
    workspace.querySelector('#selected-coordinate').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    for (const formId of ['visual-checkpoint-create','visual-discovery-create']) {
      const form = workspace.querySelector(`#${formId}`);
      form.elements.lng.value = lng.toFixed(7);
      form.elements.lat.value = lat.toFixed(7);
    }
  });

  workspace.querySelector('#visual-checkpoint-create').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.elements.lng.value) return show('Selecciona primero un punto en el trazado','error');
    try {
      await insert('checkpoints', {
        route_id: snapshot.route_id,
        name: form.elements.name.value.trim(),
        position: `SRID=4326;POINT(${Number(form.elements.lng.value)} ${Number(form.elements.lat.value)})`,
        trigger_radius_m: Number(form.elements.trigger_radius_m.value),
        required: form.elements.required.checked,
        active: true
      });
      show('Checkpoint añadido');
      await afterRouteEditorMutation(snapshot.route_id, workspace, onChange);
    } catch (error) { show(error.message,'error'); }
  });

  workspace.querySelector('#visual-discovery-create').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.elements.lng.value) return show('Selecciona primero un punto en el trazado','error');
    try {
      await insert('discoveries', {
        route_id: snapshot.route_id,
        name: form.elements.name.value.trim(),
        category: form.elements.category.value,
        position: `SRID=4326;POINT(${Number(form.elements.lng.value)} ${Number(form.elements.lat.value)})`,
        trigger_radius_m: Number(form.elements.trigger_radius_m.value),
        reward_xp: Number(form.elements.reward_xp.value || 0),
        reward_olives: Number(form.elements.reward_olives.value || 0),
        active: true
      });
      show('Descubrimiento añadido');
      await afterRouteEditorMutation(snapshot.route_id, workspace, onChange);
    } catch (error) { show(error.message,'error'); }
  });

  workspace.querySelectorAll('[data-toggle-type]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const active = button.dataset.active !== 'true';
      const tableName = button.dataset.toggleType === 'checkpoint' ? 'checkpoints' : 'discoveries';
      try {
        await patch(tableName, `id=eq.${encodeURIComponent(button.dataset.id)}`, { active });
        show(active ? 'Elemento activado' : 'Elemento desactivado');
        await afterRouteEditorMutation(snapshot.route_id, workspace, onChange);
      } catch (error) { show(error.message,'error'); }
    });
  });
}

async function loadRouteSnapshot(routeId, workspace, onChange = null) {
  if (workspace) workspace.innerHTML = '<p class="muted">Cargando trazado…</p>';
  const snapshot = await rpc('admin_route_editor_snapshot', { target_route_id: String(routeId).trim() });
  renderRouteEditor(snapshot, workspace, onChange);
  return snapshot;
}

export async function mountRouteEditor(workspace, routeId, options = {}) {
  if (!workspace) throw new Error('Falta el contenedor del editor de ruta');
  const normalizedRouteId = String(routeId ?? '').trim();
  if (!normalizedRouteId) throw new Error('Falta la ruta para cargar el editor');
  return loadRouteSnapshot(normalizedRouteId, workspace, options.onChange ?? null);
}

function bindRouteEditor() {
  const form = document.querySelector('#visual-route-load');
  const workspace = document.querySelector('#visual-route-workspace');
  if (!form || !workspace) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await mountRouteEditor(workspace, form.elements.route_id.value); }
    catch (error) { show(error.message,'error'); }
  });
}

function qrScannerShell() {
  return `<section class="card qr-scanner-card"><h2>Escáner QR de almazara</h2><p class="muted">Escanea el QR del usuario. La validación final sigue realizándose en el servidor y cada token solo puede usarse una vez.</p><div class="qr-scanner-grid"><div><video id="qr-video" class="qr-video" autoplay playsinline muted></video><div class="qr-actions"><button id="qr-start" class="btn primary" type="button">Abrir cámara</button><button id="qr-stop" class="btn secondary" type="button">Cerrar cámara</button></div></div><div><div class="field"><label>Escanear imagen</label><input id="qr-image" type="file" accept="image/*" capture="environment"></div><p id="qr-support" class="muted"></p><p id="qr-result" class="code">Sin lectura</p></div></div></section>`;
}

function writeQrToken(raw) {
  const token = normalizeRedemptionToken(raw);
  const input = document.querySelector('#redeem [name="token"]');
  if (!input) throw new Error('No se encuentra el formulario de canje');
  input.value = token;
  const result = document.querySelector('#qr-result');
  if (result) result.textContent = `Token detectado: ${token.slice(0,8)}…`;
  show('QR leído. Revisa y pulsa “Validar y marcar entregado”.');
  return token;
}

async function detectFromSource(detector, source) {
  const codes = await detector.detect(source);
  const raw = codes.find((item) => item.rawValue)?.rawValue;
  if (!raw) throw new Error('No se ha detectado ningún QR');
  writeQrToken(raw);
  return raw;
}

function bindQrScanner() {
  const start = document.querySelector('#qr-start');
  if (!start) return;
  const video = document.querySelector('#qr-video');
  const support = document.querySelector('#qr-support');
  const image = document.querySelector('#qr-image');
  const supported = barcodeDetectorSupported();
  support.textContent = supported ? 'Escáner QR nativo disponible.' : 'Este navegador no ofrece lector QR nativo. Puedes seguir introduciendo el token manualmente.';
  if (!supported) start.disabled = true;

  document.querySelector('#qr-stop').addEventListener('click', stopScanner);

  start.addEventListener('click', async () => {
    stopScanner();
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = activeStream;
      await video.play();
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        if (!activeStream) return;
        try {
          const codes = await detector.detect(video);
          const raw = codes.find((item)=>item.rawValue)?.rawValue;
          if (raw) {
            writeQrToken(raw);
            stopScanner();
            return;
          }
        } catch {}
        scanFrame = requestAnimationFrame(scan);
      };
      scanFrame = requestAnimationFrame(scan);
    } catch (error) {
      stopScanner();
      show(`No se pudo abrir la cámara: ${error.message}`,'error');
    }
  });

  image.addEventListener('change', async () => {
    if (!supported || !image.files?.[0]) return;
    try {
      const bitmap = await createImageBitmap(image.files[0]);
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      await detectFromSource(detector, bitmap);
      bitmap.close?.();
    } catch (error) { show(error.message,'error'); }
  });
}

function decorate() {
  const main = document.querySelector('.main');
  if (!main || document.querySelector('.login-wrap')) return;
  const section = (location.hash || '#dashboard').slice(1);
  const marker = `visual-tools-${section}`;
  if (main.dataset.visualTools === marker) return;
  main.dataset.visualTools = marker;
  stopScanner();

  if (section === 'map') {
    main.insertAdjacentHTML('beforeend', routeEditorShell());
    bindRouteEditor();
  }
  if (section === 'redemptions') {
    main.insertAdjacentHTML('beforeend', qrScannerShell());
    bindQrScanner();
  }
}

new MutationObserver(() => queueMicrotask(decorate)).observe(app, { childList:true, subtree:true });
addEventListener('hashchange', () => { stopScanner(); queueMicrotask(decorate); });
addEventListener('beforeunload', stopScanner);
queueMicrotask(decorate);
