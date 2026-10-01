import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';
import { routePresentationViewModel } from './route-presentation-view-model';

describe('routePresentationViewModel', () => {
  it('keeps fixture facts, rewards, map, safety and checkpoints out of verified UI', () => {
    const fixture = developmentRoutes[0]!;
    const viewModel = routePresentationViewModel(fixture, 'development-simulation');

    expect(viewModel).toMatchObject({
      mode: 'technical-gps-qa',
      title: 'Ruta en preparación',
      municipalityName: null,
      stats: null,
      rewardPreview: null,
      description: null,
      safetyNotes: [],
      showVerifiedMap: false,
      showVerifiedCheckpoints: false,
      showVerifiedOfflinePackage: false,
      canStartPhysicalRoute: false,
      canCaptureTechnicalGps: true,
      preparationLabel: 'SIMULACIÓN DE DESARROLLO',
      mapStatusLabel: 'Cartografía verificada aún no disponible',
      checkpointStatusLabel: 'Sin checkpoints verificados',
    });
    expect(viewModel.technicalGpsNotice).toContain('métricas auténticas');
    expect(viewModel.technicalGpsNotice).toContain('no están verificados');
    expect(viewModel.technicalGpsNotice).toContain('No recorras');
  });

  it('does not expose a non-fixture route without an explicit verified source', () => {
    const route = { ...developmentRoutes[0]!, developmentFixture: false };
    const viewModel = routePresentationViewModel(route, 'unverified');

    expect(viewModel.mode).toBe('preparing');
    expect(viewModel.stats).toBeNull();
    expect(viewModel.rewardPreview).toBeNull();
    expect(viewModel.showVerifiedMap).toBe(false);
    expect(viewModel.showVerifiedCheckpoints).toBe(false);
    expect(viewModel.canStartPhysicalRoute).toBe(false);
    expect(viewModel.canCaptureTechnicalGps).toBe(false);
  });

  it('never trusts a fixture even if a caller passes the verified origin', () => {
    const fixture = developmentRoutes[0]!;
    const viewModel = routePresentationViewModel(fixture, 'verified');

    expect(viewModel.mode).toBe('preparing');
    expect(viewModel.stats).toBeNull();
    expect(viewModel.rewardPreview).toBeNull();
    expect(viewModel.canStartPhysicalRoute).toBe(false);
  });

  it('exposes facts only for an explicitly verified non-fixture route', () => {
    const route = { ...developmentRoutes[0]!, developmentFixture: false };
    const viewModel = routePresentationViewModel(route, 'verified');

    expect(viewModel.mode).toBe('verified');
    expect(viewModel.stats?.distanceKm).toBe(route.distanceKm);
    expect(viewModel.rewardPreview).toEqual(route.rewardPreview);
    expect(viewModel.showVerifiedMap).toBe(true);
    expect(viewModel.showVerifiedCheckpoints).toBe(true);
    expect(viewModel.canStartPhysicalRoute).toBe(true);
  });
});
