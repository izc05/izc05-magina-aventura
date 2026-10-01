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
    expect(viewModel.officialSource).toEqual({
      id: 'municipal',
      label: 'Publicación del Ayuntamiento · 9 sep 2026',
      url: 'https://www.facebook.com/reel/28588117584209389/',
    });
    expect(viewModel.communityReference).toEqual({
      label: 'Referencia comunitaria · Wikiloc',
      note: 'Referencia externa no oficial. Esta ficha no reproduce métricas, texto, fotos ni geometría de Wikiloc.',
      sourceLabel: 'Abrir ficha comunitaria no oficial del Sendero Fluvial de la Cueva del Agua en Wikiloc',
      sourceUrl: 'https://www.wikiloc.com/walking-trails/sendero-fluvial-cueva-del-agua-278776231',
    });
    expect(viewModel.officialSource).toBe(viewModel.sourceLinks[0]);
    expect(viewModel.officialSource.url).toMatch(/^https:\/\//);
    expect(viewModel.communityReference.sourceUrl).toMatch(/^https:\/\//);
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

  it('keeps the Junta hiking recommendations literal, generic, linked and non-duplicated', () => {
    const recommendations = municipalRouteInformationViewModel().generalHikingRecommendations;

    expect(recommendations.title).toBe('Recomendaciones generales oficiales');
    expect(recommendations.attribution).toContain('Junta de Andalucía');
    expect(recommendations.scopeNote).toContain(
      'no constituyen una evaluación de seguridad específica del Sendero Fluvial',
    );
    expect(recommendations.items).toEqual([
      'Consulta la previsión meteorológica antes de iniciar tu actividad.',
      'Lleva agua, protección solar, ropa y calzado adecuados.',
      'Lleva un móvil con suficiente batería en caso de emergencia (112), pero recuerda que no siempre hay cobertura.',
      'Evita salir solo. Si lo haces, comunica recorrido y hora de regreso a otras personas.',
      'Por tu seguridad y la del entorno, no te salgas del camino señalizado ni tomes atajos.',
    ]);
    expect(new Set(recommendations.items).size).toBe(recommendations.items.length);
    expect(recommendations.sourceUrl).toBe(
      'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-actividad/-/asset_publisher/QYwm8uHC3ojh/content/senderismo-1/255035',
    );
  });

  it('keeps the registered official notice, confirmed community link, map context and photo-rights source', () => {
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
    expect(municipalRouteInformation.communityReference.sourceUrl).toBe(
      'https://www.wikiloc.com/walking-trails/sendero-fluvial-cueva-del-agua-278776231',
    );
    expect(municipalRouteInformation.communityReference).not.toHaveProperty('distance');
    expect(municipalRouteInformation.communityReference).not.toHaveProperty('elevationGain');
    expect(municipalRouteInformation.communityReference).not.toHaveProperty('recordedRouteType');
  });

  it('resolves only its explicit information-only slug', () => {
    expect(
      getMunicipalRouteInformationBySlug(municipalRouteInformation.slug),
    ).toBe(municipalRouteInformation);
    expect(getMunicipalRouteInformationBySlug('sendero-de-cuadros-dev')).toBeUndefined();
    expect(getMunicipalRouteInformationBySlug(undefined)).toBeUndefined();
  });
});
