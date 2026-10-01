import { describe, expect, it } from 'vitest';

import {
  getMunicipalRouteInformationBySlug,
  municipalRouteInformation,
  municipalRouteInformationViewModel,
} from './municipal-route-information';

describe('municipal route information-only record', () => {
  it('keeps official route facts and community references visibly separate', () => {
    const viewModel = municipalRouteInformationViewModel();

    expect(viewModel).toMatchObject({
      kind: 'municipal-information-only',
      qaLabel: 'FICHA PILOTO · QA',
      title: 'Sendero Fluvial de la Cueva del Agua',
      municipality: 'Cuadros · Bedmar y Garcíez, Jaén',
      statusLabel: 'Información publicada por el Ayuntamiento',
      endpoints: [
        'Puente Blanco de Las Tinajas',
        'Entrada de la Cueva del Agua',
      ],
      directionNote: 'El Ayuntamiento indica que puede recorrerse en ambos sentidos.',
      traceStatus: 'Trazado en preparación',
      showRouteMap: false,
      showContextMap: true,
      showGallerySlot: true,
      canStartPhysicalRoute: false,
      canCaptureTechnicalGps: false,
      showDistance: false,
      showElevation: false,
      showDuration: false,
      showDifficulty: false,
      showRewards: false,
      showCheckpoints: false,
    });
    expect(viewModel.statusDetail).toContain('no confirma las condiciones actuales');
    expect(viewModel.officialDataNotice).toContain('no aporta distancia oficial');
    expect(viewModel.nonNavigationNotice).toContain('no representa el sendero');
    expect(viewModel.contextMap.accessibilityLabel).toContain('No muestra la ruta');
    expect(viewModel.gallery.body).toContain('CC BY-NC-ND 2.0');
    expect(viewModel.communityReference).toMatchObject({
      label: 'Referencia comunitaria · Wikiloc',
      distance: '0,34 mi · ≈0,55 km',
      elevationGain: '39 ft · ≈12 m de desnivel positivo',
      recordedRouteType: 'Registro marcado «One Way»',
      sourceUrl: 'https://www.wikiloc.com/walking-trails/sendero-fluvial-cueva-del-agua-278776231',
    });
    expect(viewModel.communityReference.note).toContain('no métricas oficiales');
    expect(viewModel.communityReference.note).toContain('ambos sentidos');
  });

  it('does not acquire operational route fields, geometry, checkpoints or invented progress/actions', () => {
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
      'polyline',
      'checkpoints',
      'offlineAvailable',
      'startGps',
      'prepareRoute',
      'progress',
      'ranking',
    ];

    for (const key of forbiddenKeys) {
      expect(viewModel).not.toHaveProperty(key);
    }
    expect(viewModel.canStartPhysicalRoute).toBe(false);
    expect(viewModel.canCaptureTechnicalGps).toBe(false);
    expect(viewModel.showRouteMap).toBe(false);
    expect(viewModel.showCheckpoints).toBe(false);
    expect(viewModel.showRewards).toBe(false);
  });

  it('links the official notice, community listing, map context and reviewed photo rights', () => {
    const sources = municipalRouteInformationViewModel().sourceLinks;

    expect(sources.map((source) => source.id)).toEqual([
      'municipal',
      'map-center',
      'photo-license',
      'base-map',
    ]);
    expect(sources[0].url).toBe('https://www.facebook.com/reel/28588117584209389/');
    expect(sources[1].url).toBe('https://vivemasandalucia.es/municipios/bedmar-y-garciez/');
    expect(sources[2].url).toBe('https://www.flickr.com/photos/jamebla/51635640356/');
    expect(sources[3].url).toBe('https://openfreemap.org/');
    expect(municipalRouteInformation.communityReference.sourceUrl).toContain('wikiloc.com');
  });

  it('resolves only its explicit information-only slug', () => {
    expect(
      getMunicipalRouteInformationBySlug(municipalRouteInformation.slug),
    ).toBe(municipalRouteInformation);
    expect(getMunicipalRouteInformationBySlug('sendero-de-cuadros-dev')).toBeUndefined();
    expect(getMunicipalRouteInformationBySlug(undefined)).toBeUndefined();
  });
});
