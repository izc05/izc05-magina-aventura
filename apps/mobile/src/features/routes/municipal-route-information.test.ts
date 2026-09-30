import { describe, expect, it } from 'vitest';
import {
  getMunicipalRouteInformationBySlug,
  municipalRouteInformation,
  municipalRouteInformationViewModel,
} from './municipal-route-information';

describe('municipal route information-only record', () => {
  it('contains only attributed public facts and an official municipal notice', () => {
    const viewModel = municipalRouteInformationViewModel();

    expect(viewModel).toEqual({
      kind: 'municipal-information-only',
      title: 'Sendero Fluvial de la Cueva del Agua',
      municipality: 'Cuadros · Bedmar y Garcíez, Jaén',
      statusLabel: 'Estado reportado por el Ayuntamiento',
      statusDetail:
        'El Ayuntamiento lo comunica como habilitado para el público e indica que fue inaugurado en primavera de 2026.',
      endpoints: [
        'Puente Blanco de Las Tinajas',
        'Entrada de la Cueva del Agua',
      ],
      directionNote:
        'El Ayuntamiento indica que puede recorrerse en ambos sentidos.',
      gpsNotice: 'Trazado/mapa/checkpoints pendientes; sin navegación GPS.',
      nonNavigationNotice:
        'Ficha informativa basada en comunicaciones municipales; no es una guía para llegar ni para seguir el sendero.',
      sourceLabel: 'Aviso del Ayuntamiento · 9 de septiembre de 2026',
      sourceUrl: 'https://www.facebook.com/reel/28588117584209389/',
      canStartPhysicalRoute: false,
      canCaptureTechnicalGps: false,
      showRouteMap: false,
      showDistance: false,
      showElevation: false,
      showDuration: false,
      showDifficulty: false,
      showRewards: false,
      showCheckpoints: false,
    });
    expect(viewModel.sourceUrl).toBe(municipalRouteInformation.sourceUrl);
  });

  it('does not acquire operational route fields or actions', () => {
    const viewModel = municipalRouteInformationViewModel();
    const forbiddenKeys = [
      'distanceKm',
      'elevationGainM',
      'durationMinutes',
      'difficulty',
      'rewardPreview',
      'geometryVersion',
      'startLatitude',
      'startLongitude',
      'routeLine',
      'checkpoints',
      'offlineAvailable',
      'startGps',
      'prepareRoute',
    ];

    for (const key of forbiddenKeys) {
      expect(viewModel).not.toHaveProperty(key);
    }
    expect(viewModel.canStartPhysicalRoute).toBe(false);
    expect(viewModel.canCaptureTechnicalGps).toBe(false);
    expect(viewModel.showRouteMap).toBe(false);
    expect(viewModel.showDistance).toBe(false);
    expect(viewModel.showElevation).toBe(false);
    expect(viewModel.showDuration).toBe(false);
    expect(viewModel.showDifficulty).toBe(false);
    expect(viewModel.showRewards).toBe(false);
    expect(viewModel.showCheckpoints).toBe(false);
  });

  it('resolves only its explicit information-only slug', () => {
    expect(
      getMunicipalRouteInformationBySlug(municipalRouteInformation.slug),
    ).toBe(municipalRouteInformation);
    expect(getMunicipalRouteInformationBySlug('sendero-de-cuadros-dev')).toBeUndefined();
    expect(getMunicipalRouteInformationBySlug(undefined)).toBeUndefined();
  });
});
