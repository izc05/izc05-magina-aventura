import './route-admin-tools-base.mjs';
import { rpc, table } from './src/core/api.mjs';

const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function showRewardFlash(text, type = 'success') {
  const target = document.querySelector('#flash');
  if (target) target.innerHTML = `<p class="${type}">${esc(text)}</p>`;
}

function rewardContentPayload(content = {}, rewardXp, rewardOlives) {
  const {
    route_id: _routeId,
    version: _version,
    created_at: _createdAt,
    created_by: _createdBy,
    updated_at: _updatedAt,
    ...editableContent
  } = content ?? {};

  return {
    ...editableContent,
    reward_xp: rewardXp,
    reward_olives: rewardOlives
  };
}

function rewardTotals(snapshot = {}) {
  const content = snapshot.content ?? {};
  const discoveries = Array.isArray(snapshot.discoveries) ? snapshot.discoveries : [];
  const active = discoveries.filter((discovery) => discovery.active !== false);
  const baseXp = Number(content.reward_xp ?? 0);
  const baseOlives = Number(content.reward_olives ?? 0);
  const bonusXp = active.reduce((sum, discovery) => sum + Number(discovery.reward_xp ?? 0), 0);
  const bonusOlives = active.reduce((sum, discovery) => sum + Number(discovery.reward_olives ?? 0), 0);
  return {
    baseXp,
    baseOlives,
    bonusXp,
    bonusOlives,
    totalXp: baseXp + bonusXp,
    totalOlives: baseOlives + bonusOlives
  };
}

function rewardDiscoveryRowsHtml(discoveries = []) {
  if (!discoveries.length) {
    return '<div class="empty">Esta ruta todavía no tiene descubrimientos con bonificación.</div>';
  }
  return discoveries.map((discovery) => `
    <article class="route-reward-discovery-card">
      <div><strong>${esc(discovery.name ?? 'Descubrimiento')}</strong><span>${discovery.active === false ? 'Inactivo' : 'Activo'}</span></div>
      <p>${esc(Number(discovery.reward_xp ?? 0))} XP · ${esc(Number(discovery.reward_olives ?? 0))} aceitunas</p>
    </article>`).join('');
}

function renderRewardSnapshot(panel, snapshot) {
  const totals = rewardTotals(snapshot);
  const form = panel.querySelector('[data-route-rewards-form]');
  if (form) {
    form.elements.reward_xp.value = String(totals.baseXp);
    form.elements.reward_olives.value = String(totals.baseOlives);
  }

  const base = panel.querySelector('[data-route-reward-base]');
  const bonus = panel.querySelector('[data-route-reward-bonus]');
  const total = panel.querySelector('[data-route-reward-total]');
  if (base) base.textContent = `${totals.baseXp} XP · ${totals.baseOlives} aceitunas`;
  if (bonus) bonus.textContent = `${totals.bonusXp} XP · ${totals.bonusOlives} aceitunas`;
  if (total) total.textContent = `${totals.totalXp} XP · ${totals.totalOlives} aceitunas`;

  const discoveries = panel.querySelector('[data-route-reward-discoveries]');
  if (discoveries) {
    discoveries.innerHTML = rewardDiscoveryRowsHtml(Array.isArray(snapshot.discoveries) ? snapshot.discoveries : []);
  }
}

async function rewardRouteBySlug(slug) {
  const rows = await table('routes', `?select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] ?? null;
}

async function bindRouteMasterRewards() {
  const panel = document.querySelector('[data-route-master-panel="rewards"][data-route-rewards-slug]');
  if (!panel || panel.dataset.routeRewardsBound) return;
  panel.dataset.routeRewardsBound = 'loading';

  try {
    const slug = panel.dataset.routeRewardsSlug;
    const route = await rewardRouteBySlug(slug);
    if (!route?.id) throw new Error('No se pudo identificar la ruta abierta');

    let snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
    renderRewardSnapshot(panel, snapshot);

    const form = panel.querySelector('[data-route-rewards-form]');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const rewardXp = Number(values.get('reward_xp'));
      const rewardOlives = Number(values.get('reward_olives'));
      if (!Number.isInteger(rewardXp) || rewardXp < 0 || !Number.isInteger(rewardOlives) || rewardOlives < 0) {
        showRewardFlash('XP y aceitunas deben ser números enteros no negativos.', 'error');
        return;
      }

      form.querySelectorAll('button,input').forEach((control) => { control.disabled = true; });
      try {
        snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
        const content_payload = rewardContentPayload(snapshot.content, rewardXp, rewardOlives);
        const newVersion = await rpc('admin_update_route_content_v2', {
          target_route_id: route.id,
          content_payload
        });
        snapshot = await rpc('admin_route_master_snapshot', { target_route_id: route.id });
        renderRewardSnapshot(panel, snapshot);
        showRewardFlash(`Recompensa base guardada como versión ${newVersion}.`);
      } catch (error) {
        showRewardFlash(`No se pudo guardar la recompensa: ${error.message}`, 'error');
      } finally {
        form.querySelectorAll('button,input').forEach((control) => { control.disabled = false; });
      }
    });

    panel.dataset.routeRewardsBound = 'true';
  } catch (error) {
    panel.dataset.routeRewardsBound = '';
    showRewardFlash(`No se pudo activar la gestión de recompensas: ${error.message}`, 'error');
  }
}

new MutationObserver(() => queueMicrotask(bindRouteMasterRewards)).observe(app, { childList: true, subtree: true });
addEventListener('hashchange', () => queueMicrotask(bindRouteMasterRewards));
queueMicrotask(bindRouteMasterRewards);
