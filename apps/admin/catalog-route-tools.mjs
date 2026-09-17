import { rpc, table } from './src/core/api.mjs';
import {
  catalogPanelBadge,
  routeCatalogPanelHtml,
} from './src/core/route-catalog-panel.mjs';

const app = typeof document !== 'undefined' ? document.querySelector('#app') : null;

export function routeCodeFromEyebrowText(text) {
  const parts = String(text ?? '').split('·').map((part) => part.trim()).filter(Boolean);
  const candidate = parts.at(-1) ?? '';
  return /^MA-\d{3}$/.test(candidate) ? candidate : null;
}

export function shouldShowCatalogTab(snapshot = {}) {
  return Boolean(snapshot?.catalog_profile?.canonical_catalog_id);
}

async function routeIdForCode(routeCode) {
  const rows = await table(
    'routes',
    `?select=id,route_code&route_code=eq.${encodeURIComponent(routeCode)}&limit=1`,
  );
  return rows?.[0]?.id ?? null;
}

function catalogPanelNode(snapshot) {
  const template = document.createElement('template');
  template.innerHTML = routeCatalogPanelHtml(snapshot).trim();
  return template.content.firstElementChild;
}

function activateCatalogPanel(master, button, snapshot) {
  master.querySelectorAll('[data-route-master-tab]').forEach((item) => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
  });

  const currentPanel = master.querySelector('[data-route-master-panel]');
  const replacement = catalogPanelNode(snapshot);
  if (currentPanel && replacement) currentPanel.replaceWith(replacement);
}

async function enhanceRouteMaster(master) {
  if (master.dataset.catalogEnhancement === 'loading' || master.dataset.catalogEnhancement === 'ready') return;

  const eyebrow = master.querySelector('.route-master-eyebrow');
  const routeCode = routeCodeFromEyebrowText(eyebrow?.textContent);
  if (!routeCode) return;

  master.dataset.catalogEnhancement = 'loading';

  try {
    const routeId = await routeIdForCode(routeCode);
    if (!routeId || !master.isConnected) {
      master.dataset.catalogEnhancement = 'none';
      return;
    }

    const snapshot = await rpc('admin_route_master_snapshot', { target_route_id: routeId });
    if (!master.isConnected || !shouldShowCatalogTab(snapshot)) {
      master.dataset.catalogEnhancement = 'none';
      return;
    }

    const tabs = master.querySelector('.route-master-tabs');
    if (!tabs || tabs.querySelector('[data-route-master-tab="catalog"]')) {
      master.dataset.catalogEnhancement = 'ready';
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'route-master-tab route-master-tab-catalog';
    button.dataset.routeMasterTab = 'catalog';
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span>Catálogo oficial</span><small>${catalogPanelBadge(snapshot)}</small>`;
    button.addEventListener('click', () => activateCatalogPanel(master, button, snapshot));
    tabs.append(button);

    master.dataset.catalogEnhancement = 'ready';
  } catch (error) {
    master.dataset.catalogEnhancement = 'error';
    console.warn('No se pudo cargar el catálogo canónico de la ruta', error);
  }
}

function decorateCatalogRoutes() {
  document.querySelectorAll('.route-master').forEach((master) => {
    void enhanceRouteMaster(master);
  });
}

if (app) {
  new MutationObserver(() => queueMicrotask(decorateCatalogRoutes))
    .observe(app, { childList: true, subtree: true });
  addEventListener('hashchange', () => queueMicrotask(decorateCatalogRoutes));
  queueMicrotask(decorateCatalogRoutes);
}
